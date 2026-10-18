import type { Address } from 'viem'
import { resolveChainId } from '../core/addresses'
import { SpraayError } from '../core/errors'
import type { ChainLike, SupportedChainId } from '../core/types'

export interface UniswapV4Addresses {
  poolManager: Address
}

/** Uniswap V4 PoolManager deployments (docs.uniswap.org/contracts/v4/deployments) */
export const UNISWAP_V4 = {
  56: { poolManager: '0x28e2Ea090877bF75740558f6BFB36A5ffeE9e9dF' },
  8453: { poolManager: '0x498581fF718922c3f8e6A244956aF099B2652b2b' },
} as const satisfies Record<SupportedChainId, UniswapV4Addresses>

export function getUniswapV4Addresses(chain: ChainLike): UniswapV4Addresses {
  const chainId = resolveChainId(chain)
  const addresses = UNISWAP_V4[chainId as SupportedChainId] as UniswapV4Addresses | undefined
  if (!addresses) {
    throw new SpraayError(
      'UNSUPPORTED_CHAIN',
      `BatchDistributeHook needs Uniswap V4 and Spraay on the same chain; chain ${chainId} is not supported. Supported: ${Object.keys(UNISWAP_V4).join(', ')}`,
    )
  }
  return addresses
}

/** Deterministic CREATE2 deployer (Arachnid), the `CREATE2_FACTORY` Foundry scripts deploy through */
export const CREATE2_DEPLOYER: Address = '0x4e59b44847b379578588920cA78FbF26c0B4956C'

/** v4-core `Hooks.sol` flags: permissions live in the low 14 bits of the hook address */
export const AFTER_INITIALIZE_FLAG = 1 << 12
export const AFTER_DONATE_FLAG = 1 << 4
export const ALL_HOOK_MASK = (1 << 14) - 1

/** `BatchDistributeHook.getHookPermissions()`: afterInitialize + afterDonate */
export const BATCH_DISTRIBUTE_HOOK_FLAGS = AFTER_INITIALIZE_FLAG | AFTER_DONATE_FLAG

/** Same bound as v4-periphery `HookMiner.MAX_LOOP` */
export const HOOK_MINER_MAX_LOOP = 160_444
