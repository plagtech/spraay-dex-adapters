import { type Address, isAddress, zeroAddress } from 'viem'
import { SpraayError } from './errors'

/** Spraay's on-chain `MAX_RECIPIENTS`. The SDK checks it first so oversized batches fail before any RPC call. */
export const MAX_RECIPIENTS = 200

export function validateRecipients(recipients: readonly string[]): asserts recipients is readonly Address[] {
  if (!Array.isArray(recipients) || recipients.length === 0) {
    throw new SpraayError('NO_RECIPIENTS', 'At least one recipient is required')
  }
  if (recipients.length > MAX_RECIPIENTS) {
    throw new SpraayError(
      'TOO_MANY_RECIPIENTS',
      `Too many recipients: got ${recipients.length}, max ${MAX_RECIPIENTS} per batch. Split the list with chunkDistribution().`,
    )
  }
  recipients.forEach((recipient, i) => {
    if (typeof recipient !== 'string' || !isAddress(recipient, { strict: false })) {
      throw new SpraayError('INVALID_ADDRESS', `Recipient ${i} is not a valid address: ${String(recipient)}`)
    }
    if (recipient.toLowerCase() === zeroAddress) {
      throw new SpraayError('INVALID_ADDRESS', `Recipient ${i} is the zero address`)
    }
  })
}

export function validateAmount(amount: bigint, label = 'Amount'): void {
  if (typeof amount !== 'bigint') {
    throw new SpraayError('INVALID_AMOUNT', `${label} must be a bigint in base units, got ${typeof amount}`)
  }
  if (amount <= 0n) {
    throw new SpraayError('INVALID_AMOUNT', `${label} must be greater than zero, got ${amount}`)
  }
}

export function validateAmounts(amounts: readonly bigint[], recipientCount: number): void {
  if (!Array.isArray(amounts) || amounts.length !== recipientCount) {
    throw new SpraayError(
      'LENGTH_MISMATCH',
      `Got ${recipientCount} recipients but ${Array.isArray(amounts) ? amounts.length : 0} amounts`,
    )
  }
  amounts.forEach((amount, i) => validateAmount(amount, `Amount ${i}`))
}

/** Token address. The zero address (native BNB / ETH) is rejected unless `allowNative` is set. */
export function validateToken(token: string, { allowNative = false } = {}): asserts token is Address {
  if (typeof token !== 'string' || !isAddress(token, { strict: false })) {
    throw new SpraayError('INVALID_TOKEN', `Token is not a valid address: ${String(token)}`)
  }
  if (!allowNative && token.toLowerCase() === zeroAddress) {
    throw new SpraayError('INVALID_TOKEN', 'Token is the zero address. Use distributeNative() for BNB / ETH.')
  }
}

export function validateDistribution(recipients: readonly string[], amounts: readonly bigint[]): void {
  validateRecipients(recipients)
  validateAmounts(amounts, recipients.length)
}
