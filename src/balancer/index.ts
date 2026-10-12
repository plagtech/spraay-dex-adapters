// Balancer adapter: coming soon. The interface matches the other adapters so code written
// against it compiles today; every call throws until the integration ships. See ./README.md.

import { SpraayError } from '../core/errors'
import type {
  CostEstimate,
  DistributeEqualParams,
  DistributeNativeParams,
  DistributeParams,
  DistributeResult,
  EstimateCostParams,
} from '../core/types'

export const BALANCER_ADAPTER_STATUS = 'coming-soon' as const

function notImplemented(fn: string): never {
  throw new SpraayError(
    'NOT_IMPLEMENTED',
    `@spraay/dex-adapters/balancer: ${fn}() is not yet implemented. Use @spraay/dex-adapters/generic in the meantime.`,
  )
}

export async function distribute(_params: DistributeParams): Promise<DistributeResult> {
  return notImplemented('distribute')
}

export async function distributeEqual(_params: DistributeEqualParams): Promise<DistributeResult> {
  return notImplemented('distributeEqual')
}

export async function distributeNative(_params: DistributeNativeParams): Promise<DistributeResult> {
  return notImplemented('distributeNative')
}

export async function estimateCost(_params: EstimateCostParams): Promise<CostEstimate> {
  return notImplemented('estimateCost')
}

export type * from '../core/types'
