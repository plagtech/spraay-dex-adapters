// SushiSwap launchpad adapter, based on sushi-labs/sushiswap#2324: push-model holder rewards
// on Base, sent straight to Spraay. Same interface as the other adapters, plus the PR's helpers.

export {
  distribute,
  distributeEqual,
  distributeNative,
  distributeToHolders,
  estimateCost,
  type DistributeToHoldersParams,
  type SpraayRecipient,
} from './distribute'
export { calculateSpraayFee, getSpraayDistributionAmount, validateSpraayRecipients } from './launchpad'
export { SPRAAY_BATCH_ABI } from './abi'
export {
  SPRAAY_BASE_ADDRESS,
  SPRAAY_CHAIN_ID,
  SPRAAY_MAX_FEE_BPS,
  SPRAAY_MAX_RECIPIENTS,
  SPRAAY_NATIVE_SENTINEL,
  SUSHISWAP_BATCH_DISTRIBUTE_PR,
} from './constants'

export { NATIVE_TOKEN } from '../core/addresses'
export type * from '../core/types'
