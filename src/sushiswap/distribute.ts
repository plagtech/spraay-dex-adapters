import type { Address, PublicClient } from 'viem'
import { resolveChainId } from '../core/addresses'
import { SpraayError } from '../core/errors'
import type {
  ChainLike,
  CostEstimate,
  DistributeEqualParams,
  DistributeNativeParams,
  DistributeParams,
  DistributeResult,
  EstimateCostParams,
  Recipient,
  TxOptions,
} from '../core/types'
import * as generic from '../generic'
import { SPRAAY_CHAIN_ID, SPRAAY_NATIVE_SENTINEL } from './constants'

export type SpraayRecipient = Recipient

function assertLaunchpadChain(chain: ChainLike): void {
  const chainId = resolveChainId(chain)
  if (chainId !== SPRAAY_CHAIN_ID) {
    throw new SpraayError(
      'UNSUPPORTED_CHAIN',
      `The SushiSwap launchpad integration runs on Base (${SPRAAY_CHAIN_ID}), got chain ${chainId}. Use the generic adapter for other chains.`,
    )
  }
}

/** ERC-20 batch → `Spraay.sprayToken` on Base */
export async function distribute(params: DistributeParams): Promise<DistributeResult> {
  assertLaunchpadChain(params.chain)
  return generic.distribute(params)
}

/** Same amount to every recipient → `Spraay.sprayEqual` on Base. `token` may be `NATIVE_TOKEN`. */
export async function distributeEqual(params: DistributeEqualParams): Promise<DistributeResult> {
  assertLaunchpadChain(params.chain)
  return generic.distributeEqual(params)
}

/** ETH batch → `Spraay.sprayETH` on Base */
export async function distributeNative(params: DistributeNativeParams): Promise<DistributeResult> {
  assertLaunchpadChain(params.chain)
  return generic.distributeNative(params)
}

export async function estimateCost(params: EstimateCostParams): Promise<CostEstimate> {
  assertLaunchpadChain(params.chain)
  return generic.estimateCost(params)
}

export interface DistributeToHoldersParams extends Omit<TxOptions, 'chain'> {
  /** Token being distributed, as the launchpad's `useBatchDistribute({ token })` takes it */
  token: { address: Address; symbol?: string } | 'native'
  /** Holder list with per-holder amounts */
  holders: readonly SpraayRecipient[]
  publicClient?: PublicClient
}

/**
 * Framework-free version of the launchpad's `useBatchDistribute().batchDistribute(recipients)`:
 * reads the live cost, approves Spraay when the allowance is short, simulates, then sends
 * `sprayETH` / `sprayToken` on Base.
 */
export async function distributeToHolders(params: DistributeToHoldersParams): Promise<DistributeResult> {
  const { token, holders, ...options } = params
  const recipients = holders.map(({ recipient }) => recipient)
  const amounts = holders.map(({ amount }) => amount)
  if (token === 'native' || token.address === SPRAAY_NATIVE_SENTINEL) {
    return distributeNative({ ...options, chain: SPRAAY_CHAIN_ID, recipients, amounts })
  }
  return distribute({ ...options, chain: SPRAAY_CHAIN_ID, token: token.address, recipients, amounts })
}
