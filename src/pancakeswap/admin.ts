import type { Address, Hash, Hex, PublicClient, TransactionReceipt } from 'viem'
import { readContract } from 'viem/actions'
import { resolveTxContext, sendContractCall } from '../core/tx'
import type { TxOptions } from '../core/types'
import { batchDistributeHookAbi } from './abi'

type AdminParams<T> = Omit<TxOptions, 'approve'> & { hook: Address } & T

export interface AdminResult {
  hash: Hash
  receipt?: TransactionReceipt
}

async function callHook(params: AdminParams<object>, functionName: string, args: readonly unknown[]): Promise<AdminResult> {
  const ctx = await resolveTxContext(params)
  return sendContractCall(ctx, { address: params.hook, abi: batchDistributeHookAbi, functionName, args })
}

/** Owner only. Grants (or with `allowed: false`, revokes) the distribution operator role. */
export function setOperator(params: AdminParams<{ operator: Address; allowed?: boolean }>): Promise<AdminResult> {
  return callHook(params, 'setOperator', [params.operator, params.allowed ?? true])
}

/** Owner only. Points the hook at a different Spraay deployment. */
export function setSpraayContract(params: AdminParams<{ spraay: Address }>): Promise<AdminResult> {
  return callHook(params, 'setSpraayContract', [params.spraay])
}

/** Owner only. Recovers ERC-20s sent to the hook by mistake (the hook never holds funds between calls). */
export function rescueTokens(params: AdminParams<{ token: Address; to: Address; amount: bigint }>): Promise<AdminResult> {
  return callHook(params, 'rescueTokens', [params.token, params.to, params.amount])
}

/** Owner only. Step 1 of the `Ownable2Step` handover. */
export function transferOwnership(params: AdminParams<{ newOwner: Address }>): Promise<AdminResult> {
  return callHook(params, 'transferOwnership', [params.newOwner])
}

/** Pending owner only. Step 2 of the `Ownable2Step` handover. */
export function acceptOwnership(params: AdminParams<object>): Promise<AdminResult> {
  return callHook(params, 'acceptOwnership', [])
}

interface ReadParams {
  hook: Address
  publicClient: PublicClient
}

export function isOperator({ hook, publicClient, account }: ReadParams & { account: Address }): Promise<boolean> {
  return readContract(publicClient, { address: hook, abi: batchDistributeHookAbi, functionName: 'isOperator', args: [account] })
}

/** Pools are registered when initialized with this hook */
export function isRegisteredPool({ hook, publicClient, poolId }: ReadParams & { poolId: Hex }): Promise<boolean> {
  return readContract(publicClient, {
    address: hook,
    abi: batchDistributeHookAbi,
    functionName: 'isRegisteredPool',
    args: [poolId],
  })
}

/** `amount + Spraay fee`, as the hook will charge it */
export function quoteHookTotalCost({ hook, publicClient, amount }: ReadParams & { amount: bigint }): Promise<bigint> {
  return readContract(publicClient, {
    address: hook,
    abi: batchDistributeHookAbi,
    functionName: 'quoteTotalCost',
    args: [amount],
  })
}

export interface HookInfo {
  owner: Address
  pendingOwner: Address
  spraay: Address
  poolManager: Address
  vault: Address
  maxRecipients: bigint
}

export async function getHookInfo({ hook, publicClient }: ReadParams): Promise<HookInfo> {
  const read = (functionName: 'owner' | 'pendingOwner' | 'spraay' | 'poolManager' | 'vault' | 'MAX_RECIPIENTS') =>
    readContract(publicClient, { address: hook, abi: batchDistributeHookAbi, functionName })
  const [owner, pendingOwner, spraay, poolManager, vault, maxRecipients] = await Promise.all([
    read('owner'),
    read('pendingOwner'),
    read('spraay'),
    read('poolManager'),
    read('vault'),
    read('MAX_RECIPIENTS'),
  ])
  return {
    owner: owner as Address,
    pendingOwner: pendingOwner as Address,
    spraay: spraay as Address,
    poolManager: poolManager as Address,
    vault: vault as Address,
    maxRecipients: maxRecipients as bigint,
  }
}
