import { decodeDeployData, keccak256, toHex, zeroAddress } from 'viem'
import { base, bsc, mainnet } from 'viem/chains'
import { describe, expect, it } from 'vitest'
import {
  BATCH_DISTRIBUTE_HOOK_BITMAP,
  PANCAKESWAP_INFINITY,
  batchDistributeHookAbi,
  batchDistributeHookBytecode,
  deployHook,
  distribute,
  distributeEqual,
  distributeNative,
  encodeCLPoolParameters,
  estimateCost,
  getPoolId,
  setOperator,
} from '../../src/pancakeswap'
import { HOOK, POOL_ID, SENDER, TOKEN, createMockChain, recipients } from '../helpers/mock-chain'

const ready = { operators: [SENDER], registeredPools: [POOL_ID] }

describe('pancakeswap: deployment', () => {
  it('deploys the hook with CLPoolManager, Spraay, owner and operator', async () => {
    const { walletClient, publicClient, state, spraay } = createMockChain()
    const operator = '0x5555555555555555555555555555555555555555'
    const result = await deployHook({ chain: bsc, walletClient, publicClient, operator })

    expect(result.address).toBe('0x4444444444444444444444444444444444444444')
    expect(result.constructorArgs).toEqual([PANCAKESWAP_INFINITY[56].clPoolManager, spraay, SENDER, operator])
    const { args } = decodeDeployData({ abi: batchDistributeHookAbi, bytecode: batchDistributeHookBytecode, data: state.sent[0]!.data })
    expect(args).toEqual(result.constructorArgs)
  })

  it('defaults the operator to none and uses Base addresses on Base', async () => {
    const { walletClient, publicClient } = createMockChain({ chain: base })
    const result = await deployHook({ chain: base, walletClient, publicClient })
    expect(result.constructorArgs).toEqual([
      '0xa0FfB9c1CE1Fe56963B0321B32E7A0302114058b',
      '0x1646452F98E36A3c9Cfc3eDD8868221E207B5eEC',
      SENDER,
      zeroAddress,
    ])
  })

  it('rejects chains without Infinity + Spraay', async () => {
    const { walletClient } = createMockChain({ chain: mainnet as any })
    await expect(deployHook({ chain: mainnet, walletClient })).rejects.toMatchObject({ code: 'UNSUPPORTED_CHAIN' })
  })

  it('owner can grant the operator role', async () => {
    const { walletClient, publicClient, state } = createMockChain()
    await setOperator({ hook: HOOK, operator: SENDER, chain: bsc, walletClient, publicClient })
    expect(state.sent[0]).toMatchObject({ to: HOOK, functionName: 'setOperator', args: [SENDER, true] })
    expect(state.operators.has(SENDER.toLowerCase())).toBe(true)
  })
})

describe('pancakeswap: pool helpers', () => {
  it('encodes the afterInitialize + afterDonate bitmap with tickSpacing', () => {
    expect(BATCH_DISTRIBUTE_HOOK_BITMAP).toBe(0x0202)
    expect(encodeCLPoolParameters(10)).toBe(`0x${'0'.repeat(58)}0a0202`)
  })

  it('computes the PoolId as keccak256(abi.encode(PoolKey))', () => {
    const key = {
      currency0: zeroAddress,
      currency1: TOKEN,
      hooks: HOOK,
      poolManager: PANCAKESWAP_INFINITY[56].clPoolManager,
      fee: 3000,
      parameters: encodeCLPoolParameters(60),
    } as const
    const encoded = [
      key.currency0.slice(2).padStart(64, '0'),
      key.currency1.slice(2).padStart(64, '0'),
      key.hooks.slice(2).padStart(64, '0'),
      key.poolManager.slice(2).padStart(64, '0'),
      (3000).toString(16).padStart(64, '0'),
      key.parameters.slice(2),
    ].join('')
    expect(getPoolId(key)).toBe(keccak256(`0x${encoded.toLowerCase()}`))
    expect(getPoolId(key)).not.toBe(keccak256(toHex('')))
  })
})

describe('pancakeswap: distribution through the hook', () => {
  it('approves the hook (not Spraay) and calls batchDistribute with the poolId', async () => {
    const { walletClient, publicClient, state } = createMockChain(ready)
    const addrs = recipients(2)
    const result = await distribute({
      hook: HOOK,
      poolId: POOL_ID,
      token: TOKEN,
      recipients: addrs,
      amounts: [10_000n, 20_000n],
      chain: bsc,
      walletClient,
      publicClient,
    })

    expect(state.sent.map((tx) => tx.functionName)).toEqual(['approve', 'batchDistribute'])
    expect(state.sent[0]).toMatchObject({ to: TOKEN, args: [HOOK, 30_090n] })
    expect(state.sent[1]).toMatchObject({ to: HOOK, value: 0n, args: [POOL_ID, TOKEN, addrs, [10_000n, 20_000n]] })
    expect(result).toMatchObject({ contract: HOOK, totalAmount: 30_000n, fee: 90n, totalCost: 30_090n })
  })

  it('distributeNative sends amount + fee as msg.value with token = 0', async () => {
    const { walletClient, publicClient, state } = createMockChain(ready)
    const addrs = recipients(2)
    await distributeNative({ hook: HOOK, poolId: POOL_ID, recipients: addrs, amounts: [10n ** 18n, 10n ** 18n], chain: bsc, walletClient, publicClient })
    expect(state.sent).toHaveLength(1)
    expect(state.sent[0]).toMatchObject({
      functionName: 'batchDistribute',
      value: 2_006_000_000_000_000_000n,
      args: [POOL_ID, zeroAddress, addrs, [10n ** 18n, 10n ** 18n]],
    })
  })

  it('distributeEqual calls batchDistributeEqual', async () => {
    const { walletClient, publicClient, state } = createMockChain({ ...ready, allowance: 10n ** 30n })
    const addrs = recipients(3)
    await distributeEqual({ hook: HOOK, poolId: POOL_ID, token: TOKEN, recipients: addrs, amountEach: 1_000n, chain: bsc, walletClient, publicClient })
    expect(state.sent[0]).toMatchObject({ functionName: 'batchDistributeEqual', args: [POOL_ID, TOKEN, addrs, 1_000n] })
  })

  it('fails before approving when the sender is not an operator', async () => {
    const { walletClient, publicClient, state } = createMockChain({ registeredPools: [POOL_ID] })
    await expect(
      distribute({ hook: HOOK, poolId: POOL_ID, token: TOKEN, recipients: recipients(1), amounts: [1n], chain: bsc, walletClient, publicClient }),
    ).rejects.toMatchObject({ code: 'NOT_OPERATOR' })
    expect(state.sent).toHaveLength(0)
  })

  it('fails when the pool was not initialized with the hook', async () => {
    const { walletClient, publicClient } = createMockChain({ operators: [SENDER] })
    await expect(
      distribute({ hook: HOOK, poolId: POOL_ID, token: TOKEN, recipients: recipients(1), amounts: [1n], chain: bsc, walletClient, publicClient }),
    ).rejects.toMatchObject({ code: 'POOL_NOT_REGISTERED' })
  })

  it('enforces 200 recipients before any RPC call', async () => {
    const { walletClient, publicClient, state } = createMockChain(ready)
    const addrs = recipients(201)
    await expect(
      distribute({ hook: HOOK, poolId: POOL_ID, token: TOKEN, recipients: addrs, amounts: addrs.map(() => 1n), chain: bsc, walletClient, publicClient }),
    ).rejects.toMatchObject({ code: 'TOO_MANY_RECIPIENTS' })
    expect(state.calls).toHaveLength(0)
  })

  it('estimateCost quotes through the hook and checks the allowance to the hook', async () => {
    const { publicClient, state } = createMockChain(ready)
    const estimate = await estimateCost({
      hook: HOOK,
      poolId: POOL_ID,
      token: TOKEN,
      recipients: recipients(2),
      amounts: [5_000n, 5_000n],
      chain: bsc,
      publicClient,
      account: SENDER,
    })
    expect(estimate).toMatchObject({ totalAmount: 10_000n, fee: 30n, totalCost: 10_030n, feeBps: 30n, approvalRequired: true, gas: 150_000n })
    expect(state.calls.map((c) => c.functionName)).toContain('quoteTotalCost')
  })
})
