import { base, bsc } from 'viem/chains'
import { describe, expect, it } from 'vitest'
import {
  SPRAAY_BASE_ADDRESS,
  SPRAAY_MAX_RECIPIENTS,
  SPRAAY_NATIVE_SENTINEL,
  calculateSpraayFee,
  distribute,
  distributeToHolders,
  getSpraayDistributionAmount,
  validateSpraayRecipients,
} from '../../src/sushiswap'
import { TOKEN, createMockChain, recipients } from '../helpers/mock-chain'

const recipient = '0x000000000000000000000000000000000000dEaD'

// Ported from packages/batch-distribute/src/index.test.ts in sushi-labs/sushiswap#2324
describe('sushiswap: launchpad helpers', () => {
  it('sums recipient amounts', () => {
    expect(
      getSpraayDistributionAmount([
        { recipient, amount: 1n },
        { recipient, amount: 2n },
      ]),
    ).toBe(3n)
  })

  it('mirrors the contract fee calculation', () => {
    expect(calculateSpraayFee(10_000n, 30n)).toBe(30n)
    expect(calculateSpraayFee(333n, 30n)).toBe(0n)
  })

  it('validates recipient lists', () => {
    expect(validateSpraayRecipients([{ recipient, amount: 1n }])).toBeNull()
    expect(validateSpraayRecipients([])).toBe('No recipients provided')
    expect(
      validateSpraayRecipients(Array.from({ length: SPRAAY_MAX_RECIPIENTS + 1 }, () => ({ recipient, amount: 1n }))),
    ).toBe(`Maximum ${SPRAAY_MAX_RECIPIENTS} recipients per batch`)
    expect(validateSpraayRecipients([{ recipient: SPRAAY_NATIVE_SENTINEL, amount: 1n }])).toBe('Invalid recipient')
    expect(validateSpraayRecipients([{ recipient, amount: 0n }])).toBe('Recipient amounts must be greater than zero')
  })
})

describe('sushiswap: distribution on Base', () => {
  it('only runs on Base, like the launchpad integration', async () => {
    const { walletClient, publicClient } = createMockChain({ chain: bsc })
    await expect(
      distribute({ token: TOKEN, recipients: recipients(1), amounts: [1n], chain: bsc, walletClient, publicClient }),
    ).rejects.toMatchObject({ code: 'UNSUPPORTED_CHAIN' })
  })

  it('distributeToHolders sends sprayToken to the Base Spraay contract', async () => {
    const { walletClient, publicClient, state } = createMockChain({ chain: base })
    const addrs = recipients(2)
    const result = await distributeToHolders({
      token: { address: TOKEN, symbol: 'TKN' },
      holders: [
        { recipient: addrs[0]!, amount: 1_000n },
        { recipient: addrs[1]!, amount: 9_000n },
      ],
      walletClient,
      publicClient,
    })
    expect(state.sent.map((tx) => tx.functionName)).toEqual(['approve', 'sprayToken'])
    expect(state.sent[1]!.to).toBe(SPRAAY_BASE_ADDRESS)
    expect(result.totalCost).toBe(10_030n)
  })

  it('distributeToHolders with native ETH calls sprayETH', async () => {
    const { walletClient, publicClient, state } = createMockChain({ chain: base })
    await distributeToHolders({ token: 'native', holders: [{ recipient, amount: 10_000n }], walletClient, publicClient })
    expect(state.sent[0]).toMatchObject({ functionName: 'sprayETH', value: 10_030n })
  })
})
