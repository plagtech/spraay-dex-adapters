import { type Address, type Hash, type TransactionReceipt, zeroAddress } from 'viem'
import { deployContract, waitForTransactionReceipt } from 'viem/actions'
import { getSpraayAddress } from '../core/addresses'
import { SpraayError } from '../core/errors'
import { resolveTxContext } from '../core/tx'
import type { TxOptions } from '../core/types'
import { batchDistributeHookAbi } from './abi'
import { batchDistributeHookBytecode } from './bytecode'
import { getBalancerAddresses } from './constants'

export interface DeployHookParams extends Omit<TxOptions, 'approve'> {
  /** Hook admin (`Ownable2Step`). Defaults to the deploying account. */
  owner?: Address
  /** Initial distribution operator. Defaults to none; add one later with `setOperator`. */
  operator?: Address
  /** Defaults to Balancer v3 Vault on `chain` (deterministic address, same on all chains) */
  vault?: Address
}

export interface DeployHookResult {
  hash: Hash
  /** Present unless `waitForReceipt` is `false` */
  address?: Address
  receipt?: TransactionReceipt
  constructorArgs: readonly [vault: Address, spraay: Address, owner: Address, operator: Address]
}

/**
 * Deploys BatchDistributeHook for Balancer v3.
 *
 * Balancer v3 registers hooks through `IVaultExtension.registerPool`, which accepts
 * a `poolHooksContract` address directly. No address mining is needed.
 */
export async function deployBatchDistributeHook(params: DeployHookParams): Promise<DeployHookResult> {
  const vault = params.vault ?? getBalancerAddresses(params.chain).vault
  const spraay = getSpraayAddress(params.chain)
  const ctx = await resolveTxContext(params)
  const constructorArgs = [vault, spraay, params.owner ?? ctx.accountAddress, params.operator ?? zeroAddress] as const

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
