import { base } from 'viem/chains'
import { describe, expect, it } from 'vitest'
import * as balancer from '../../src/balancer'
import * as generic from '../../src/generic'
import * as pancakeswap from '../../src/pancakeswap'
import * as sushiswap from '../../src/sushiswap'
import { TOKEN, createMockChain, recipients } from '../helpers/mock-chain'

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

describe('balancer scaffold', () => {
  it('throws NOT_IMPLEMENTED', async () => {
    const { walletClient, publicClient } = createMockChain({ chain: base })
    const params = { token: TOKEN, recipients: recipients(1), amounts: [1n], chain: base, walletClient, publicClient }
    await expect(balancer.distribute(params)).rejects.toMatchObject({ code: 'NOT_IMPLEMENTED' })
    await expect(balancer.estimateCost(params)).rejects.toThrow(/not yet implemented/)
    expect(balancer.BALANCER_ADAPTER_STATUS).toBe('coming-soon')
  })
})
