import type { Address, Client, Hex } from 'viem'
import { readContract } from 'viem/actions'
import { spraayAbi } from '../core/abi'
import { NATIVE_TOKEN } from '../core/addresses'
import { SpraayError } from '../core/errors'
import { buildRecipients, sumAmounts } from '../core/recipients'
import { type TxContext, accountAddress, estimateCallGas, executeDistribution, isNative, readAllowance, resolveTxContext } from '../core/tx'
import type {
  CostEstimate,
  DistributeEqualParams,
  DistributeNativeParams,
  DistributeParams,
  DistributeResult,
  EstimateCostParams,
} from '../core/types'
import { validateAmount, validateRecipients, validateToken } from '../core/validate'
import { batchDistributeHookAbi } from './abi'
import { getUniswapV4Addresses } from './constants'

/** Every hook distribution is attributed to a pool initialized with the hook */
export interface HookTarget {
  /** Deployed BatchDistributeHook */
  hook: Address
  /** Uniswap V4 pool that uses the hook (see `getPoolId`) */
  poolId: Hex
}

function readHookTotalCost(reader: Client, hook: Address, totalAmount: bigint): Promise<bigint> {
  return readContract(reader, { address: hook, abi: batchDistributeHookAbi, functionName: 'quoteTotalCost', args: [totalAmount] })
}

/** The hook would revert with NotOperator / PoolNotRegistered; checking first gives a clearer error and skips the approval */
async function assertCanDistribute(ctx: TxContext, { hook, poolId }: HookTarget): Promise<void> {
  const [operator, registered] = await Promise.all([
    readContract(ctx.reader, { address: hook, abi: batchDistributeHookAbi, functionName: 'isOperator', args: [ctx.accountAddress] }),
    readContract(ctx.reader, { address: hook, abi: batchDistributeHookAbi, functionName: 'isRegisteredPool', args: [poolId] }),
  ])
  if (!operator) {
    throw new SpraayError('NOT_OPERATOR', `${ctx.accountAddress} is not an operator of hook ${hook}. The hook owner can add it with setOperator().`)
  }
  if (!registered) {
    throw new SpraayError('POOL_NOT_REGISTERED', `Pool ${poolId} was not initialized with hook ${hook}`)
  }
}

/** ERC-20 batch with per-recipient amounts → `BatchDistributeHook.batchDistribute` → `Spraay.sprayToken` */
export async function distribute(params: DistributeParams & HookTarget): Promise<DistributeResult> {
  validateToken(params.token)
  return distributeVariable(params, params.token)
}

/** Native currency (ETH / BNB) batch → `BatchDistributeHook.batchDistribute(token = 0)` → `Spraay.sprayETH` */
export async function distributeNative(params: DistributeNativeParams & HookTarget): Promise<DistributeResult> {
  return distributeVariable(params, NATIVE_TOKEN)
}

async function distributeVariable(
  params: (DistributeParams | DistributeNativeParams) & HookTarget,
  token: Address,
): Promise<DistributeResult> {
  const { hook, poolId, recipients, amounts } = params
  buildRecipients(recipients, amounts) // validates
  getUniswapV4Addresses(params.chain)
  const ctx = await resolveTxContext(params)
  await assertCanDistribute(ctx, params)
  const totalAmount = sumAmounts(amounts)
  return executeDistribution(ctx, {
    address: hook,
    abi: batchDistributeHookAbi,
    functionName: 'batchDistribute',
    args: [poolId, token, recipients, amounts],
    token,
    recipientCount: recipients.length,
    totalAmount,
    totalCost: await readHookTotalCost(ctx.reader, hook, totalAmount),
  })
}

/** Same amount to every recipient → `BatchDistributeHook.batchDistributeEqual` → `Spraay.sprayEqual`. `token` may be `NATIVE_TOKEN`. */
export async function distributeEqual(params: DistributeEqualParams & HookTarget): Promise<DistributeResult> {
  const { hook, poolId, token, recipients, amountEach } = params
  validateToken(token, { allowNative: true })
  validateRecipients(recipients)
  validateAmount(amountEach, 'amountEach')
  getUniswapV4Addresses(params.chain)
  const ctx = await resolveTxContext(params)
  await assertCanDistribute(ctx, params)
  const totalAmount = amountEach * BigInt(recipients.length)
  return executeDistribution(ctx, {
    address: hook,
    abi: batchDistributeHookAbi,
    functionName: 'batchDistributeEqual',
    args: [poolId, token, recipients, amountEach],
    token,
    recipientCount: recipients.length,
    totalAmount,
    totalCost: await readHookTotalCost(ctx.reader, hook, totalAmount),
  })
}

/** Fee breakdown via the hook's Spraay deployment, plus gas for the hook call when `account` is given */
export async function estimateCost(params: EstimateCostParams & HookTarget): Promise<CostEstimate> {
  const { hook, poolId, token, recipients, amounts, publicClient, account } = params
  validateToken(token, { allowNative: true })
  buildRecipients(recipients, amounts) // validates
  getUniswapV4Addresses(params.chain)
  const native = isNative(token)
  const totalAmount = sumAmounts(amounts)

  const [totalCost, spraay] = await Promise.all([
    readHookTotalCost(publicClient, hook, totalAmount),
    readContract(publicClient, { address: hook, abi: batchDistributeHookAbi, functionName: 'spraay' }),
  ])
  const feeBps = await readContract(publicClient, { address: spraay, abi: spraayAbi, functionName: 'feeBps' })
  const estimate: CostEstimate = {
    recipientCount: recipients.length,
    totalAmount,
    fee: totalCost - totalAmount,
    totalCost,
    feeBps,
  }
  if (!account) return estimate

  if (!native) {
    const allowance = await readAllowance(publicClient, token, accountAddress(account), hook)
    estimate.approvalRequired = allowance < totalCost
  }
  const call = {
    address: hook,
    abi: batchDistributeHookAbi,
    functionName: 'batchDistribute',
    args: [poolId, token, recipients, amounts],
    value: native ? totalCost : undefined,
  }
  return { ...estimate, ...(await estimateCallGas(publicClient, call, account)) }
}
