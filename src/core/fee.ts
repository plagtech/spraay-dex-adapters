/**
 * Spraay protocol fee at the time of writing. The Spraay owner can change it (capped at `SPRAAY_MAX_FEE_BPS`),
 * so the write and estimate functions read the live value on-chain. Use these helpers for offline quotes.
 */
export const SPRAAY_FEE_BPS = 30n
export const SPRAAY_MAX_FEE_BPS = 500n
export const BPS_DENOMINATOR = 10_000n

/** Mirrors `SprayContract.calculateFee`: `amount * feeBps / 10000`, rounded down */
export function calculateFee(amount: bigint, feeBps: bigint = SPRAAY_FEE_BPS): bigint {
  return (amount * feeBps) / BPS_DENOMINATOR
}

/** Mirrors `SprayContract.calculateTotalCost`: the fee is added on top of the distributed amount */
export function calculateTotalCost(amount: bigint, feeBps: bigint = SPRAAY_FEE_BPS): bigint {
  return amount + calculateFee(amount, feeBps)
}

export interface FeeBreakdown {
  totalAmount: bigint
  fee: bigint
  totalCost: bigint
  feeBps: bigint
}

/** Offline quote for a batch. The contract charges the fee once on the batch total, not per recipient. */
export function quoteDistribution(amounts: readonly bigint[], feeBps: bigint = SPRAAY_FEE_BPS): FeeBreakdown {
  const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0n)
  const fee = calculateFee(totalAmount, feeBps)
  return { totalAmount, fee, totalCost: totalAmount + fee, feeBps }
}
