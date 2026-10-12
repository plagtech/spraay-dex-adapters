import type { Address } from 'viem'
import { resolveChainId } from '../core/addresses'
import { SpraayError } from '../core/errors'
import type { ChainLike, SupportedChainId } from '../core/types'

export interface InfinityAddresses {
  vault: Address
  clPoolManager: Address
  create3Factory: Address
}

/** PancakeSwap Infinity core deployments, from infinity-hooks `script/config/{bsc,base}-mainnet.json` */
export const PANCAKESWAP_INFINITY = {
  56: {
    vault: '0x238a358808379702088667322f80aC48bAd5e6c4',
    clPoolManager: '0xa0FfB9c1CE1Fe56963B0321B32E7A0302114058b',
    create3Factory: '0x38Ab3f2CE00973A51d3A2A04d634C9bcbf20e4e1',
  },
  8453: {
    vault: '0x238a358808379702088667322f80aC48bAd5e6c4',
    clPoolManager: '0xa0FfB9c1CE1Fe56963B0321B32E7A0302114058b',
    create3Factory: '0x38Ab3f2CE00973A51d3A2A04d634C9bcbf20e4e1',
  },
} as const satisfies Record<SupportedChainId, InfinityAddresses>

export function getInfinityAddresses(chain: ChainLike): InfinityAddresses {
  const chainId = resolveChainId(chain)
  const addresses = PANCAKESWAP_INFINITY[chainId as SupportedChainId] as InfinityAddresses | undefined
  if (!addresses) {
    throw new SpraayError(
      'UNSUPPORTED_CHAIN',
      `BatchDistributeHook needs PancakeSwap Infinity and Spraay on the same chain; chain ${chainId} is not supported. Supported: ${Object.keys(PANCAKESWAP_INFINITY).join(', ')}`,
    )
  }
  return addresses
}

/** Hook callback offsets from infinity-core `ICLHooks.sol` */
export const HOOKS_AFTER_INITIALIZE_OFFSET = 1
export const HOOKS_AFTER_DONATE_OFFSET = 9

/** `BatchDistributeHook.getHooksRegistrationBitmap()`: afterInitialize + afterDonate */
export const BATCH_DISTRIBUTE_HOOK_BITMAP = (1 << HOOKS_AFTER_INITIALIZE_OFFSET) | (1 << HOOKS_AFTER_DONATE_OFFSET)

/** Bit offset of tickSpacing in a CL pool's `PoolKey.parameters` (infinity-core `CLPoolParametersHelper`) */
export const CL_TICK_SPACING_OFFSET = 16
