import type { Address, Client, PublicClient } from 'viem'
import { readContract } from 'viem/actions'
import { spraayAbi } from '../core/abi'
import { getSpraayAddress } from '../core/addresses'
import { buildRecipients, sumAmounts } from '../core/recipients'
import { accountAddress, estimateCallGas, isNative, readAllowance } from '../core/tx'
import type { ChainLike, CostEstimate, EstimateCostParams } from '../core/types'
import { validateToken } from '../core/validate'

export async function readTotalCost(reader: Client, spraay: Address, totalAmount: bigint): Promise<bigint> {
  return readContract(reader, { address: spraay, abi: spraayAbi, functionName: 'calculateTotalCost', args: [totalAmount] })
}

/** `amount + fee` at the live on-chain fee rate */
export async function quoteTotalCost({
  chain,
  publicClient,
  amount,
}: {
  chain: ChainLike
  publicClient: PublicClient
  amount: bigint
}): Promise<bigint> {
  return readTotalCost(publicClient, getSpraayAddress(chain), amount)
}

/** Live Spraay fee rate in basis points */
export async function getFeeBps({ chain, publicClient }: { chain: ChainLike; publicClient: PublicClient }): Promise<bigint> {
  return readContract(publicClient, { address: getSpraayAddress(chain), abi: spraayAbi, functionName: 'feeBps' })
}

/** Fee breakdown at the live fee rate, plus gas when `account` is given */
export async function estimateDistributionCost(params: EstimateCostParams): Promise<CostEstimate> {
  const { token, chain, publicClient, account } = params
  validateToken(token, { allowNative: true })
  const recipients = buildRecipients(params.recipients, params.amounts)
  const spraay = getSpraayAddress(chain)
  const native = isNative(token)
  const totalAmount = sumAmounts(params.amounts)

  const [totalCost, feeBps] = await Promise.all([
    readTotalCost(publicClient, spraay, totalAmount),
    readContract(publicClient, { address: spraay, abi: spraayAbi, functionName: 'feeBps' }),
  ])
  const estimate: CostEstimate = {
    recipientCount: recipients.length,
    totalAmount,
    fee: totalCost - totalAmount,
    totalCost,
    feeBps,
  }
  if (!account) return estimate

  if (!native) {
    const allowance = await readAllowance(publicClient, token, accountAddress(account), spraay)
    estimate.approvalRequired = allowance < totalCost
  }
  const call = native
    ? { address: spraay, abi: spraayAbi, functionName: 'sprayETH', args: [recipients], value: totalCost }
    : { address: spraay, abi: spraayAbi, functionName: 'sprayToken', args: [token, recipients] }
  return { ...estimate, ...(await estimateCallGas(publicClient, call, account)) }
}
