import type { Address } from 'viem'
import type { Recipient } from './types'
import { MAX_RECIPIENTS, validateDistribution } from './validate'

/** Zips `address[]` + `amount[]` into the `Recipient[]` structs Spraay expects */
export function buildRecipients(recipients: readonly Address[], amounts: readonly bigint[]): Recipient[] {
  validateDistribution(recipients, amounts)
  return recipients.map((recipient, i) => ({ recipient, amount: amounts[i]! }))
}

export function sumAmounts(amounts: readonly bigint[]): bigint {
  return amounts.reduce((sum, amount) => sum + amount, 0n)
}

/** Splits a list larger than `MAX_RECIPIENTS` into batches that each fit in one transaction */
export function chunkDistribution(
  recipients: readonly Address[],
  amounts: readonly bigint[],
  size: number = MAX_RECIPIENTS,
): { recipients: Address[]; amounts: bigint[] }[] {
  if (!Number.isInteger(size) || size < 1 || size > MAX_RECIPIENTS) {
    throw new RangeError(`Chunk size must be an integer between 1 and ${MAX_RECIPIENTS}`)
  }
  if (recipients.length !== amounts.length) {
    throw new RangeError(`Got ${recipients.length} recipients but ${amounts.length} amounts`)
  }
  const chunks: { recipients: Address[]; amounts: bigint[] }[] = []
  for (let i = 0; i < recipients.length; i += size) {
    chunks.push({ recipients: recipients.slice(i, i + size), amounts: amounts.slice(i, i + size) })
  }
  return chunks
}
