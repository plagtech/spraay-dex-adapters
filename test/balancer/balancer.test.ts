import { base } from 'viem/chains'
import { describe, expect, it } from 'vitest'
import * as balancer from '../../src/balancer'
import * as generic from '../../src/generic'
import * as pancakeswap from '../../src/pancakeswap'
import * as sushiswap from '../../src/sushiswap'
import { HOOK, SENDER, TOKEN, createMockChain, recipients } from '../helpers/mock-chain'

const POOL = '0x5555555555555555555555555555555555555555' as const

describe('consistent adapter interface', () => {
  it.each([
    ['generic', generic],
    ['pancakeswap', pancakeswap],
    ['sushiswap', sushiswap],
    ['balancer', balancer],
  ])('%s exports distribute, distributeEqual, distributeNative, estimateCost', (_, adapter) => {
    for (const fn of ['distribute', 'distributeEqual', 'distributeNative', 'estimateCost'] as const) {
      expect(typeof adapter[fn]).toBe('function')
    }
  })
})

describe('balancer adapter', () => {
  it('exports Balancer-specific constants and types', () => {
    expect(balancer.BALANCER_V3).toBeDefined()
    expect(balancer.BALANCER_V3[8453]).toBeDefined()
    expect(balancer.BALANCER_V3[8453].vault).toBe('0xbA1333333333a1BA1108E8412f11850A5C319bA9')
    expect(balancer.batchDistributeHookAbi).toBeDefined()
    expect(typeof balancer.deployBatchDistributeHook).toBe('function')
    expect(typeof balancer.deployHook).toBe('function')
    expect(typeof balancer.setOperator).toBe('function')
    expect(typeof balancer.getHookInfo).toBe('function')
    expect(typeof balancer.isRegisteredPool).toBe('function')
    expect(typeof balancer.getBalancerAddresses).toBe('function')
  })

  it('rejects unsupported chains', async () => {
    const { walletClient, publicClient } = createMockChain({ chain: { id: 1, name: 'mainnet', nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: [] } } } as any })
    const params = {
      token: TOKEN,
      recipients: recipients(1),
      amounts: [1n],
      chain: 1,
      walletClient,
      publicClient,
      hook: HOOK,
      pool: POOL,
    }
    await expect(balancer.distribute(params)).rejects.toThrow(/not supported/)
  })

  it('rejects NOT_OPERATOR', async () => {
    const { walletClient, publicClient } = createMockChain({ chain: base, registeredPools: [POOL] })
    const params = {
      token: TOKEN,
      recipients: recipients(1),
      amounts: [1n],
      chain: base,
      walletClient,
      publicClient,
      hook: HOOK,
      pool: POOL,
    }
    await expect(balancer.distribute(params)).rejects.toMatchObject({ code: 'NOT_OPERATOR' })
  })

  it('rejects POOL_NOT_REGISTERED', async () => {
    const { walletClient, publicClient } = createMockChain({ chain: base, operators: [SENDER] })
    const params = {
      token: TOKEN,
      recipients: recipients(1),
      amounts: [1n],
      chain: base,
      walletClient,
      publicClient,
      hook: HOOK,
      pool: POOL,
    }
    await expect(balancer.distribute(params)).rejects.toMatchObject({ code: 'POOL_NOT_REGISTERED' })
  })

  it('distribute sends batchDistribute to the hook', async () => {
    const { walletClient, publicClient, state } = createMockChain({
      chain: base,
      operators: [SENDER],
      registeredPools: [POOL],
      allowance: 10n ** 30n,
    })
    const result = await balancer.distribute({
      token: TOKEN,
      recipients: recipients(2),
      amounts: [100n, 200n],
      chain: base,
      walletClient,
      publicClient,
      hook: HOOK,
      pool: POOL,
    })
    expect(result.hash).toBeDefined()
    expect(result.recipientCount).toBe(2)
    expect(result.totalAmount).toBe(300n)
    expect(result.contract).toBe(HOOK)
    expect(result.token).toBe(TOKEN)
    const hookCall = state.sent.find((tx) => tx.to === HOOK && tx.functionName === 'batchDistribute')
    expect(hookCall).toBeDefined()
  })
})
