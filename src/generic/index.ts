// Direct Spraay contract calls, no DEX involved. Works on every chain Spraay is deployed on.

import { batchDistribute, batchDistributeETH, batchDistributeEqual } from './distribute'
import { estimateDistributionCost } from './estimate'

export { batchDistribute, batchDistributeETH, batchDistributeEqual } from './distribute'
export { estimateDistributionCost, getFeeBps, quoteTotalCost } from './estimate'

// Interface shared by every adapter
export const distribute = batchDistribute
export const distributeEqual = batchDistributeEqual
export const distributeNative = batchDistributeETH
export const estimateCost = estimateDistributionCost

export { NATIVE_TOKEN, SPRAAY_ADDRESSES, getSpraayAddress } from '../core/addresses'
export { spraayAbi } from '../core/abi'
export type * from '../core/types'
