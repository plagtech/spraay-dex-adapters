// Uniswap V4 adapter: distributions go through BatchDistributeHook, which attributes each batch
// to a V4 pool and forwards it to Spraay. V4 reads hook permissions from the hook address, so
// deployment mines a CREATE2 salt (see `mineHookAddress`).

import { deployBatchDistributeHook } from './deploy'

export { distribute, distributeEqual, distributeNative, estimateCost, type HookTarget } from './distribute'
export {
  deployBatchDistributeHook,
  mineHookAddress,
  type DeployHookParams,
  type DeployHookResult,
  type MineHookAddressParams,
  type MinedHookAddress,
} from './deploy'
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
export { UniswapV4Adapter, type UniswapV4AdapterConfig, type UniswapV4DeployParams } from './adapter'
export { getPoolId, type PoolKey } from './pool'
export {
  AFTER_DONATE_FLAG,
  AFTER_INITIALIZE_FLAG,
  ALL_HOOK_MASK,
  BATCH_DISTRIBUTE_HOOK_FLAGS,
  CREATE2_DEPLOYER,
  HOOK_MINER_MAX_LOOP,
  UNISWAP_V4,
  getUniswapV4Addresses,
  type UniswapV4Addresses,
} from './constants'
export { batchDistributeHookAbi } from './abi'
export { batchDistributeHookBytecode } from './bytecode'

export const deployHook = deployBatchDistributeHook

export { NATIVE_TOKEN } from '../core/addresses'
export type * from '../core/types'
