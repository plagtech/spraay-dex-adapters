// Live-chain checks against the real deployments. Skipped unless RPC URLs are set:
//   BSC_RPC_URL=... BASE_RPC_URL=... npm run test:fork
// Optional: BSC_HOOK_ADDRESS / BASE_HOOK_ADDRESS to also check a deployed BatchDistributeHook.

import { type Address, type Chain, createPublicClient, http } from 'viem'
import { getCode, readContract } from 'viem/actions'
import { base, bsc } from 'viem/chains'
import { describe, expect, it } from 'vitest'
import { MAX_RECIPIENTS, SPRAAY_ADDRESSES, spraayAbi } from '../../src/core'
import { estimateCost } from '../../src/generic'
import { PANCAKESWAP_INFINITY, getHookInfo } from '../../src/pancakeswap'
import { UNISWAP_V4 } from '../../src/uniswap-v4'

const targets: { chain: Chain; rpc?: string; hook?: string }[] = [
  { chain: bsc, rpc: process.env.BSC_RPC_URL, hook: process.env.BSC_HOOK_ADDRESS },
  { chain: base, rpc: process.env.BASE_RPC_URL, hook: process.env.BASE_HOOK_ADDRESS },
]

for (const { chain, rpc, hook } of targets) {
  describe.skipIf(!rpc)(`fork: ${chain.name}`, () => {
    const publicClient = createPublicClient({ chain, transport: http(rpc) })
    const spraay = SPRAAY_ADDRESSES[chain.id as 56 | 8453]

    it('Spraay matches the SDK limits', async () => {
      const read = (functionName: 'MAX_RECIPIENTS' | 'MAX_FEE_BPS' | 'feeBps' | 'paused') =>
        readContract(publicClient, { address: spraay, abi: spraayAbi, functionName })
      const [maxRecipients, maxFeeBps, feeBps, paused] = await Promise.all([
        read('MAX_RECIPIENTS'),
        read('MAX_FEE_BPS'),
        read('feeBps'),
        read('paused'),
      ])
      expect(maxRecipients).toBe(BigInt(MAX_RECIPIENTS))
      expect(maxFeeBps).toBe(500n)
      expect(feeBps).toBeLessThanOrEqual(500n)
      expect(typeof paused).toBe('boolean')
    })

    it('estimateCost matches calculateTotalCost on-chain', async () => {
      const amounts = [10n ** 18n, 2n * 10n ** 18n]
      const estimate = await estimateCost({
        token: '0x0000000000000000000000000000000000000000',
        recipients: ['0x000000000000000000000000000000000000dEaD', '0x000000000000000000000000000000000000bEEF'],
        amounts,
        chain,
        publicClient,
      })
      const onchain = await readContract(publicClient, {
        address: spraay,
        abi: spraayAbi,
        functionName: 'calculateTotalCost',
        args: [3n * 10n ** 18n],
      })
      expect(estimate.totalCost).toBe(onchain)
      expect(estimate.fee).toBe((3n * 10n ** 18n * estimate.feeBps) / 10_000n)
    })

    it('PancakeSwap Infinity CLPoolManager is deployed', async () => {
      const code = await getCode(publicClient, { address: PANCAKESWAP_INFINITY[chain.id as 56 | 8453].clPoolManager })
      expect(code && code.length > 2).toBe(true)
    })

    it('Uniswap V4 PoolManager is deployed', async () => {
      const code = await getCode(publicClient, { address: UNISWAP_V4[chain.id as 56 | 8453].poolManager })
      expect(code && code.length > 2).toBe(true)
    })

    it.skipIf(!hook)('deployed BatchDistributeHook points at Spraay and CLPoolManager', async () => {
      const info = await getHookInfo({ hook: hook as Address, publicClient })
      expect(info.spraay).toBe(spraay)
      expect(info.poolManager).toBe(PANCAKESWAP_INFINITY[chain.id as 56 | 8453].clPoolManager)
      expect(info.maxRecipients).toBe(200n)
    })
  })
}
