import { zeroAddress } from 'viem'
import { base, bsc } from 'viem/chains'
import { describe, expect, it } from 'vitest'
import { SpraayError } from '../../src/core'
import {
  batchDistribute,
  distribute,
  distributeEqual,
  distributeNative,
  estimateCost,
  getFeeBps,
} from '../../src/generic'
import { SENDER, TOKEN, createMockChain, recipients } from '../helpers/mock-chain'

describe('generic adapter', () => {
  it('approves exactly amount + fee, then calls sprayToken with Recipient[] structs', async () => {
    const { walletClient, publicClient, state, spraay } = createMockChain()
    const addrs = recipients(3)
    const result = await distribute({
      token: TOKEN,
      recipients: addrs,
      amounts: [100_000n, 200_000n, 300_000n],
      chain: bsc,
      walletClient,
      publicClient,
    })

    expect(state.sent.map((tx) => tx.functionName)).toEqual(['approve', 'sprayToken'])
    expect(state.sent[0]).toMatchObject({ to: TOKEN, args: [spraay, 601_800n] })
    expect(state.sent[1]).toMatchObject({
      to: spraay,
      value: 0n,
      args: [
        TOKEN,
        [
          { recipient: addrs[0], amount: 100_000n },
          { recipient: addrs[1], amount: 200_000n },
          { recipient: addrs[2], amount: 300_000n },
        ],
      ],
    })
    expect(result).toMatchObject({
      contract: spraay,
      token: TOKEN,
      recipientCount: 3,
      totalAmount: 600_000n,
      fee: 1_800n,
      totalCost: 601_800n,
    })
    expect(result.approvalHash).toBeDefined()
    expect(result.receipt?.status).toBe('success')
  })

  it('skips the approval when the allowance already covers amount + fee', async () => {
    const { walletClient, publicClient, state } = createMockChain({ allowance: 10n ** 30n })
    const result = await distribute({ token: TOKEN, recipients: recipients(1), amounts: [1n], chain: bsc, walletClient, publicClient })
    expect(state.sent.map((tx) => tx.functionName)).toEqual(['sprayToken'])
    expect(result.approvalHash).toBeUndefined()
  })

  it('fails clearly with approve: false and a short allowance', async () => {
    const { walletClient, publicClient, state } = createMockChain()
    await expect(
      distribute({ token: TOKEN, recipients: recipients(1), amounts: [1n], chain: bsc, walletClient, publicClient, approve: false }),
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_ALLOWANCE' })
    expect(state.sent).toHaveLength(0)
  })

  it('reads the live fee instead of assuming 30 bps', async () => {
    const { walletClient, publicClient } = createMockChain({ feeBps: 50n, allowance: 10n ** 30n })
    const result = await distribute({ token: TOKEN, recipients: recipients(1), amounts: [10_000n], chain: bsc, walletClient, publicClient })
    expect(result.fee).toBe(50n)
  })

  it('sends amount + fee as msg.value to sprayETH', async () => {
    const { walletClient, publicClient, state, spraay } = createMockChain({ chain: base })
    const addrs = recipients(2)
    const result = await distributeNative({ recipients: addrs, amounts: [10n ** 18n, 10n ** 18n], chain: base, walletClient, publicClient })
    expect(state.sent).toHaveLength(1)
    expect(state.sent[0]).toMatchObject({ to: spraay, functionName: 'sprayETH', value: 2_006_000_000_000_000_000n })
    expect(result.token).toBe(zeroAddress)
  })

  it('distributeEqual calls sprayEqual for ERC-20 and native', async () => {
    const { walletClient, publicClient, state, spraay } = createMockChain({ allowance: 10n ** 30n })
    const addrs = recipients(4)
    await distributeEqual({ token: TOKEN, recipients: addrs, amountEach: 2_500n, chain: bsc, walletClient, publicClient })
    await distributeEqual({ token: zeroAddress, recipients: addrs, amountEach: 2_500n, chain: bsc, walletClient, publicClient })
    expect(state.sent[0]).toMatchObject({ to: spraay, functionName: 'sprayEqual', value: 0n, args: [TOKEN, addrs, 2_500n] })
    expect(state.sent[1]).toMatchObject({ functionName: 'sprayEqual', value: 10_030n, args: [zeroAddress, addrs, 2_500n] })
  })

  it('validates before touching the RPC', async () => {
    const { walletClient, publicClient, state } = createMockChain()
    const addrs = recipients(201)
    await expect(
      distribute({ token: TOKEN, recipients: addrs, amounts: addrs.map(() => 1n), chain: bsc, walletClient, publicClient }),
    ).rejects.toMatchObject({ code: 'TOO_MANY_RECIPIENTS' })
    await expect(
      distribute({ token: zeroAddress, recipients: recipients(1), amounts: [1n], chain: bsc, walletClient, publicClient }),
    ).rejects.toMatchObject({ code: 'INVALID_TOKEN' })
    expect(state.calls).toHaveLength(0)
  })

  it('rejects a wallet on a different chain', async () => {
    const { walletClient, publicClient } = createMockChain({ chain: bsc })
    await expect(
      distribute({ token: TOKEN, recipients: recipients(1), amounts: [1n], chain: base, walletClient, publicClient }),
    ).rejects.toMatchObject({ code: 'CHAIN_MISMATCH' })
  })

  it('throws when the transaction reverts', async () => {
    const { walletClient, publicClient } = createMockChain({ revertSends: true, allowance: 10n ** 30n })
    await expect(
      distribute({ token: TOKEN, recipients: recipients(1), amounts: [1n], chain: bsc, walletClient, publicClient }),
    ).rejects.toBeInstanceOf(SpraayError)
  })

  it('returns without a receipt when waitForReceipt is false, using the wallet client for reads', async () => {
    const { walletClient } = createMockChain({ allowance: 10n ** 30n })
    const result = await batchDistribute({ token: TOKEN, recipients: recipients(1), amounts: [1n], chain: bsc, walletClient, waitForReceipt: false })
    expect(result.hash).toMatch(/^0x[0-9a-f]{64}$/)
    expect(result.receipt).toBeUndefined()
  })

  it('estimateCost returns the fee breakdown, gas and approval status', async () => {
    const { publicClient } = createMockChain()
    const params = { token: TOKEN, recipients: recipients(2), amounts: [5_000n, 5_000n], chain: bsc, publicClient }

    expect(await estimateCost(params)).toEqual({ recipientCount: 2, totalAmount: 10_000n, fee: 30n, totalCost: 10_030n, feeBps: 30n })
    expect(await estimateCost({ ...params, account: SENDER })).toMatchObject({
      approvalRequired: true,
      gas: 150_000n,
      gasPrice: 1_000_000_000n,
      gasCost: 150_000_000_000_000n,
    })
    expect(await getFeeBps({ chain: bsc, publicClient })).toBe(30n)
  })
})
