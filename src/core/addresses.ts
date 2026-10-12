import { type Address, zeroAddress } from 'viem'
import { SpraayError } from './errors'
import type { ChainLike, SupportedChainId } from './types'

/** Spraay batch contract (SprayContract), verified on Sourcify (exact match) */
export const SPRAAY_ADDRESSES = {
  /** BNB Chain */
  56: '0x3093a2951FB77b3beDfB8BA20De645F7413432C1',
  /** Base */
  8453: '0x1646452F98E36A3c9Cfc3eDD8868221E207B5eEC',
} as const satisfies Record<SupportedChainId, Address>

export const SUPPORTED_CHAIN_IDS = Object.keys(SPRAAY_ADDRESSES).map(Number) as SupportedChainId[]

/** Token address Spraay and the hooks treat as the chain's native currency (BNB / ETH) */
export const NATIVE_TOKEN: Address = zeroAddress

export function resolveChainId(chain: ChainLike): number {
  return typeof chain === 'number' ? chain : chain.id
}

export function isSupportedChain(chain: ChainLike): boolean {
  return resolveChainId(chain) in SPRAAY_ADDRESSES
}

export function getSpraayAddress(chain: ChainLike): Address {
  const chainId = resolveChainId(chain)
  const address = SPRAAY_ADDRESSES[chainId as SupportedChainId] as Address | undefined
  if (!address) {
    throw new SpraayError(
      'UNSUPPORTED_CHAIN',
      `Spraay is not deployed on chain ${chainId}. Supported chains: ${SUPPORTED_CHAIN_IDS.join(', ')}`,
    )
  }
  return address
}
