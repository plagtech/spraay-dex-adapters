import { zeroAddress } from 'viem'
import { describe, expect, it } from 'vitest'
import {
  MAX_RECIPIENTS,
  SPRAAY_ADDRESSES,
  SpraayError,
  buildRecipients,
  calculateFee,
  calculateTotalCost,
  chunkDistribution,
  getSpraayAddress,
  isSupportedChain,
  quoteDistribution,
  sumAmounts,
  validateDistribution,
  validateToken,
} from '../../src/core'
import { base, bsc, mainnet } from 'viem/chains'
import { recipients } from '../helpers/mock-chain'

function expectCode(fn: () => unknown, code: string) {
  try {
    fn()
  } catch (error) {
    expect(error).toBeInstanceOf(SpraayError)
    expect((error as SpraayError).code).toBe(code)
    return error as SpraayError
  }
  throw new Error(`expected SpraayError ${code}`)
}

describe('fee (30 bps on top)', () => {
  it('adds 30 bps on top of the distributed amount', () => {
    expect(calculateFee(10_000n)).toBe(30n)
    expect(calculateTotalCost(10_000n)).toBe(10_030n)
    expect(calculateTotalCost(1_000_000n * 10n ** 18n)).toBe(1_003_000n * 10n ** 18n)
  })

  it('rounds the fee down like the contract', () => {
    expect(calculateFee(333n)).toBe(0n)
    expect(calculateFee(334n)).toBe(1n)
    expect(calculateTotalCost(999n)).toBe(1001n)
  })

  it('accepts a custom fee rate', () => {
    expect(calculateFee(10_000n, 500n)).toBe(500n)
    expect(calculateTotalCost(10_000n, 0n)).toBe(10_000n)
  })

  it('charges the fee once on the batch total, not per recipient', () => {
    // 3 × 200 per-recipient fees would round to 0; on the 600 total it is 1
    const quote = quoteDistribution([200n, 200n, 200n])
    expect(quote).toEqual({ totalAmount: 600n, fee: 1n, totalCost: 601n, feeBps: 30n })
  })
})

describe('recipients', () => {
  it('builds Recipient[] structs from address[] + amount[]', () => {
    const addrs = recipients(2)
    expect(buildRecipients(addrs, [1n, 2n])).toEqual([
      { recipient: addrs[0], amount: 1n },
      { recipient: addrs[1], amount: 2n },
    ])
  })

  it('sums amounts', () => {
    expect(sumAmounts([1n, 2n, 3n])).toBe(6n)
    expect(sumAmounts([])).toBe(0n)
  })

  it('chunks large lists into batches of at most 200', () => {
    const addrs = recipients(450)
    const amounts = addrs.map((_, i) => BigInt(i + 1))
    const chunks = chunkDistribution(addrs, amounts)
    expect(chunks.map((c) => c.recipients.length)).toEqual([200, 200, 50])
    expect(chunks[2]!.amounts[0]).toBe(401n)
    expect(() => chunkDistribution(addrs, amounts, 201)).toThrow(RangeError)
  })
})

describe('validation', () => {
  it('accepts exactly 200 recipients', () => {
    const addrs = recipients(MAX_RECIPIENTS)
    expect(() => validateDistribution(addrs, addrs.map(() => 1n))).not.toThrow()
  })

  it('rejects 201 recipients with a clear error', () => {
    const addrs = recipients(201)
    const error = expectCode(() => validateDistribution(addrs, addrs.map(() => 1n)), 'TOO_MANY_RECIPIENTS')
    expect(error.message).toContain('got 201, max 200')
  })

  it('rejects empty lists', () => {
    expectCode(() => validateDistribution([], []), 'NO_RECIPIENTS')
  })

  it('rejects mismatched lengths', () => {
    expectCode(() => validateDistribution(recipients(2), [1n]), 'LENGTH_MISMATCH')
  })

  it('rejects invalid and zero addresses', () => {
    expectCode(() => validateDistribution(['0x1234'], [1n]), 'INVALID_ADDRESS')
    expectCode(() => validateDistribution([zeroAddress], [1n]), 'INVALID_ADDRESS')
  })

  it('rejects zero, negative and non-bigint amounts', () => {
    expectCode(() => validateDistribution(recipients(1), [0n]), 'INVALID_AMOUNT')
    expectCode(() => validateDistribution(recipients(1), [-1n]), 'INVALID_AMOUNT')
    expectCode(() => validateDistribution(recipients(1), [1 as unknown as bigint]), 'INVALID_AMOUNT')
  })

  it('rejects the zero token unless native is allowed', () => {
    expectCode(() => validateToken(zeroAddress), 'INVALID_TOKEN')
    expect(() => validateToken(zeroAddress, { allowNative: true })).not.toThrow()
    expectCode(() => validateToken('not-an-address'), 'INVALID_TOKEN')
  })
})

describe('addresses', () => {
  it('returns the Spraay deployment per chain', () => {
    expect(getSpraayAddress(bsc)).toBe('0x3093a2951FB77b3beDfB8BA20De645F7413432C1')
    expect(getSpraayAddress(base)).toBe('0x1646452F98E36A3c9Cfc3eDD8868221E207B5eEC')
    expect(getSpraayAddress(8453)).toBe(SPRAAY_ADDRESSES[8453])
  })

  it('rejects chains without a deployment', () => {
    expect(isSupportedChain(mainnet)).toBe(false)
    expectCode(() => getSpraayAddress(mainnet), 'UNSUPPORTED_CHAIN')
  })
})
