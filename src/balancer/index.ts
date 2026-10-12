// Balancer v3 adapter: distributions go through BatchDistributeHook, which attributes
// each batch to a Balancer v3 pool and forwards it to Spraay.

import { deployBatchDistributeHook } from './deploy'

export { distribute, distributeEqual, distributeNative, estimateCost, type HookTarget } from './distribute'
export { deployBatchDistributeHook, type DeployHookParams, type DeployHookResult } from './deploy'
export {
  acceptOwnership,
  getHookInfo,
  isOperator,
  isRegisteredPool,
  quoteHookTotalCost,
  rescueTokens,
  setOperator,
  setSpraayContract,
  transferOwnership,
  type AdminResult,
  type HookInfo,
} from './admin'
export {
  BALANCER_V3,
  getBalancerAddresses,
  type BalancerSupportedChainId,
  type BalancerV3Addresses,
} from './constants'
export { batchDistributeHookAbi } from './abi'
export { batchDistributeHookBytecode } from './bytecode'

export const deployHook = deployBatchDistributeHook

export { NATIVE_TOKEN } from '../core/addresses'
export type * from '../core/types'
