import { type Address, type Hash, type TransactionReceipt, zeroAddress } from 'viem'
import { deployContract, waitForTransactionReceipt } from 'viem/actions'
import { getSpraayAddress } from '../core/addresses'
import { SpraayError } from '../core/errors'
import { resolveTxContext } from '../core/tx'
import type { TxOptions } from '../core/types'
import { batchDistributeHookAbi } from './abi'
import { batchDistributeHookBytecode } from './bytecode'
import { getInfinityAddresses } from './constants'

export interface DeployHookParams extends Omit<TxOptions, 'approve'> {
  /** Hook admin (`Ownable2Step`). Defaults to the deploying account. */
  owner?: Address
  /** Initial distribution operator. Defaults to none; add one later with `setOperator`. */
  operator?: Address
  /** Defaults to PancakeSwap's CLPoolManager on `chain` */
  poolManager?: Address
}

export interface DeployHookResult {
  hash: Hash
  /** Present unless `waitForReceipt` is `false` */
  address?: Address
  receipt?: TransactionReceipt
  constructorArgs: readonly [poolManager: Address, spraay: Address, owner: Address, operator: Address]
}

/**
 * Deploys BatchDistributeHook directly from the caller's account.
 *
 * Infinity reads hook permissions from `PoolKey.parameters`, not from the hook address,
 * so no address mining is needed. (PancakeSwap's own deploy script uses Create3Factory,
 * which only accepts whitelisted deployers.)
 */
export async function deployBatchDistributeHook(params: DeployHookParams): Promise<DeployHookResult> {
  const poolManager = params.poolManager ?? getInfinityAddresses(params.chain).clPoolManager
  const spraay = getSpraayAddress(params.chain)
  const ctx = await resolveTxContext(params)
  const constructorArgs = [poolManager, spraay, params.owner ?? ctx.accountAddress, params.operator ?? zeroAddress] as const

  const hash = await deployContract(ctx.walletClient, {
    abi: batchDistributeHookAbi,
    bytecode: batchDistributeHookBytecode,
    args: constructorArgs,
    account: ctx.account,
    chain: ctx.walletClient.chain ?? null,
  } as any)
  if (!ctx.waitForReceipt) return { hash, constructorArgs }

  const receipt = await waitForTransactionReceipt(ctx.reader, { hash })
  if (receipt.status !== 'success' || !receipt.contractAddress) {
    throw new SpraayError('TRANSACTION_REVERTED', `Hook deployment ${hash} reverted`)
  }
  return { hash, address: receipt.contractAddress, receipt, constructorArgs }
}
