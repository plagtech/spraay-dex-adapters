import {
  type Abi,
  type Account,
  type Address,
  type Client,
  type Hash,
  type TransactionReceipt,
  type WalletClient,
  erc20Abi,
  zeroAddress,
} from 'viem'
import {
  estimateContractGas,
  getChainId,
  getGasPrice,
  readContract,
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
} from 'viem/actions'
import { resolveChainId } from './addresses'
import { SpraayError } from './errors'
import type { DistributeResult, TxOptions } from './types'

// Shared plumbing for every adapter: account / chain checks, ERC-20 allowance, simulate-then-send, receipts.
// Internal: not exported from the package root.

export interface TxContext {
  walletClient: WalletClient
  /** Client used for reads, simulation and receipts */
  reader: Client
  account: Account | Address
  accountAddress: Address
  chainId: number
  approve: boolean
  waitForReceipt: boolean
}

export function accountAddress(account: Account | Address): Address {
  return typeof account === 'string' ? account : account.address
}

export function isNative(token: Address): boolean {
  return token.toLowerCase() === zeroAddress
}

export async function resolveTxContext(opts: TxOptions): Promise<TxContext> {
  const chainId = resolveChainId(opts.chain)
  const account = opts.account ?? opts.walletClient.account
  if (!account) {
    throw new SpraayError('MISSING_ACCOUNT', 'No account: pass `account` or use a walletClient with an account')
  }
  const walletChainId = opts.walletClient.chain?.id ?? (await getChainId(opts.walletClient))
  if (walletChainId !== chainId) {
    throw new SpraayError('CHAIN_MISMATCH', `walletClient is on chain ${walletChainId}, but chain ${chainId} was requested`)
  }
  if (opts.publicClient?.chain && opts.publicClient.chain.id !== chainId) {
    throw new SpraayError(
      'CHAIN_MISMATCH',
      `publicClient is on chain ${opts.publicClient.chain.id}, but chain ${chainId} was requested`,
    )
  }
  return {
    walletClient: opts.walletClient,
    reader: opts.publicClient ?? opts.walletClient,
    account,
    accountAddress: accountAddress(account),
    chainId,
    approve: opts.approve ?? true,
    waitForReceipt: opts.waitForReceipt ?? true,
  }
}

export interface ContractCall {
  address: Address
  abi: Abi
  functionName: string
  args: readonly unknown[]
  value?: bigint
}

/** Simulates first so reverts surface with decoded errors before anything is signed */
export async function sendContractCall(
  ctx: TxContext,
  call: ContractCall,
  { wait = ctx.waitForReceipt }: { wait?: boolean } = {},
): Promise<{ hash: Hash; receipt?: TransactionReceipt }> {
  const { request } = await simulateContract(ctx.reader, { ...call, account: ctx.account } as any)
  const hash = await writeContract(ctx.walletClient, {
    ...request,
    account: ctx.account,
    chain: ctx.walletClient.chain ?? null,
  } as any)
  if (!wait) return { hash }
  const receipt = await waitForTransactionReceipt(ctx.reader, { hash })
  if (receipt.status !== 'success') {
    throw new SpraayError('TRANSACTION_REVERTED', `Transaction ${hash} reverted`)
  }
  return { hash, receipt }
}

export async function readAllowance(reader: Client, token: Address, owner: Address, spender: Address): Promise<bigint> {
  return readContract(reader, { address: token, abi: erc20Abi, functionName: 'allowance', args: [owner, spender] })
}

/** Approves `spender` for exactly `amount` when the allowance is short. Returns the approval hash, if one was sent. */
export async function ensureAllowance(
  ctx: TxContext,
  token: Address,
  spender: Address,
  amount: bigint,
): Promise<Hash | undefined> {
  const allowance = await readAllowance(ctx.reader, token, ctx.accountAddress, spender)
  if (allowance >= amount) return undefined
  if (!ctx.approve) {
    throw new SpraayError(
      'INSUFFICIENT_ALLOWANCE',
      `Allowance for ${spender} is ${allowance}, ${amount} is required (distribution + Spraay fee). Approve it or pass approve: true.`,
    )
  }
  // The distribution is simulated right after, so the approval must be mined first
  const { hash } = await sendContractCall(
    ctx,
    { address: token, abi: erc20Abi, functionName: 'approve', args: [spender, amount] },
    { wait: true },
  )
  return hash
}

export interface DistributionCall extends Omit<ContractCall, 'value'> {
  token: Address
  recipientCount: number
  totalAmount: bigint
  /** `totalAmount + fee`, quoted on-chain by the caller */
  totalCost: bigint
}

/** Funds (approval or msg.value) and sends a distribution. The contract being called is also the ERC-20 spender. */
export async function executeDistribution(ctx: TxContext, call: DistributionCall): Promise<DistributeResult> {
  const native = isNative(call.token)
  const approvalHash = native ? undefined : await ensureAllowance(ctx, call.token, call.address, call.totalCost)
  const { hash, receipt } = await sendContractCall(ctx, {
    address: call.address,
    abi: call.abi,
    functionName: call.functionName,
    args: call.args,
    value: native ? call.totalCost : undefined,
  })
  return {
    hash,
    receipt,
    approvalHash,
    contract: call.address,
    token: call.token,
    recipientCount: call.recipientCount,
    totalAmount: call.totalAmount,
    fee: call.totalCost - call.totalAmount,
    totalCost: call.totalCost,
  }
}

export interface GasEstimate {
  gas?: bigint
  gasPrice?: bigint
  gasCost?: bigint
  gasEstimateError?: string
}

/** Never throws: estimation commonly fails before the ERC-20 approval exists */
export async function estimateCallGas(
  reader: Client,
  call: ContractCall,
  account: Account | Address,
): Promise<GasEstimate> {
  try {
    const [gas, gasPrice] = await Promise.all([
      estimateContractGas(reader, { ...call, account } as any),
      getGasPrice(reader),
    ])
    return { gas, gasPrice, gasCost: gas * gasPrice }
  } catch (error) {
    const message = error instanceof Error ? ((error as { shortMessage?: string }).shortMessage ?? error.message) : String(error)
    return { gasEstimateError: message }
  }
}
