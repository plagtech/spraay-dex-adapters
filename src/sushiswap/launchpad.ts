import { SPRAAY_MAX_RECIPIENTS, SPRAAY_NATIVE_SENTINEL } from './constants'
import type { SpraayRecipient } from './distribute'

// Helpers exported by `@sushiswap/batch-distribute` in sushi-labs/sushiswap#2324, same names and
// return values, so launchpad code can switch to this package without changes.

/** Sum the amounts sent to recipients, excluding the protocol fee */
export function getSpraayDistributionAmount(recipients: readonly SpraayRecipient[]): bigint {
  return recipients.reduce((sum, { amount }) => sum + amount, 0n)
}

/**
 * Validate a recipient list against the contract's on-chain requirements.
 * Returns an error message, or `null` if the list is valid.
 */
export function validateSpraayRecipients(recipients: readonly SpraayRecipient[]): string | null {
  if (recipients.length === 0) return 'No recipients provided'
  if (recipients.length > SPRAAY_MAX_RECIPIENTS) return `Maximum ${SPRAAY_MAX_RECIPIENTS} recipients per batch`
  for (const { recipient, amount } of recipients) {
    if (recipient === SPRAAY_NATIVE_SENTINEL) return 'Invalid recipient'
    if (amount <= 0n) return 'Recipient amounts must be greater than zero'
  }
  return null
}

/** Mirror of the contract's fee calculation: `amount * feeBps / 10000` */
export function calculateSpraayFee(amount: bigint, feeBps: bigint): bigint {
  return (amount * feeBps) / 10000n
}
