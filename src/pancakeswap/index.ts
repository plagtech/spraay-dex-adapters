// PancakeSwap Infinity adapter: distributions go through BatchDistributeHook, which attributes
// each batch to an Infinity pool and forwards it to Spraay.

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
export { encodeCLPoolParameters, getPoolId, type PoolKey } from './pool'
export {
  BATCH_DISTRIBUTE_HOOK_BITMAP,
  CL_TICK_SPACING_OFFSET,
  HOOKS_AFTER_DONATE_OFFSET,
  HOOKS_AFTER_INITIALIZE_OFFSET,
  PANCAKESWAP_INFINITY,
  getInfinityAddresses,
  type InfinityAddresses,
} from './constants'
export { batchDistributeHookAbi } from './abi'
export { batchDistributeHookBytecode } from './bytecode'

export const deployHook = deployBatchDistributeHook

export { NATIVE_TOKEN } from '../core/addresses'
export type * from '../core/types'
