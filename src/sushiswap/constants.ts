import type { Address } from 'viem'
import { SPRAAY_ADDRESSES } from '../core/addresses'

// Mirrors `packages/batch-distribute` from sushi-labs/sushiswap#2324 (open at the time of writing).
// The launchpad integration calls Spraay directly on Base; there is no Sushi-side contract.
// TODO: re-sync these exports if the PR changes before it merges.

export const SUSHISWAP_BATCH_DISTRIBUTE_PR = 'https://github.com/sushi-labs/sushiswap/pull/2324'

/** The launchpad integration is Base-only */
export const SPRAAY_CHAIN_ID = 8453

export const SPRAAY_BASE_ADDRESS: Address = SPRAAY_ADDRESSES[8453]

/** Maximum number of recipients per batch call (`MAX_RECIPIENTS`) */
export const SPRAAY_MAX_RECIPIENTS = 200

/** Upper bound on the protocol fee in basis points (`MAX_FEE_BPS`) */
export const SPRAAY_MAX_FEE_BPS = 500

/** Sentinel token address for native ETH in `sprayEqual` */
export const SPRAAY_NATIVE_SENTINEL: Address = '0x0000000000000000000000000000000000000000'
