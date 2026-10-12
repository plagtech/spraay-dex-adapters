import type { Address } from 'viem'
import { resolveChainId } from '../core/addresses'
import { SpraayError } from '../core/errors'
import type { ChainLike } from '../core/types'

export interface BalancerV3Addresses {
  /** Balancer v3 Vault — deterministic, same address on every chain */
  vault: Address
}

/**
 * Balancer v3 core deployments.
 *
 * The Vault address is deterministic across all chains: 0xbA1333333333a1BA1108E8412f11850A5C319bA9
 * Source: scaffold-balancer-v3 `packages/foundry/script/PoolHelpers.sol:24`
 *
 * Only Base (8453) has both Balancer v3 and Spraay deployed.
 */
export const BALANCER_V3 = {
  8453: {
    vault: '0xbA1333333333a1BA1108E8412f11850A5C319bA9',
  },
} as const satisfies Record<number, BalancerV3Addresses>

/** Chain IDs where both Balancer v3 and Spraay are deployed */
export type BalancerSupportedChainId = keyof typeof BALANCER_V3

export function getBalancerAddresses(chain: ChainLike): BalancerV3Addresses {
  const chainId = resolveChainId(chain)
  const addresses = BALANCER_V3[chainId as BalancerSupportedChainId] as BalancerV3Addresses | undefined
  if (!addresses) {
    throw new SpraayError(
      'UNSUPPORTED_CHAIN',
      `BatchDistributeHook needs Balancer v3 and Spraay on the same chain; chain ${chainId} is not supported. Supported: ${Object.keys(BALANCER_V3).join(', ')}`,
    )
  }
  return addresses
}
