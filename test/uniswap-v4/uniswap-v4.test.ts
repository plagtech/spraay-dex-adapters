import { decodeDeployData, encodeDeployData, getContractAddress, keccak256, numberToHex, slice, zeroAddress } from 'viem'
import { base, bsc, mainnet } from 'viem/chains'
import { describe, expect, it } from 'vitest'
import {
  BATCH_DISTRIBUTE_HOOK_FLAGS,
  CREATE2_DEPLOYER,
  NATIVE_TOKEN,
  UNISWAP_V4,
  UniswapV4Adapter,
  batchDistributeHookAbi,
  batchDistributeHookBytecode,
  deployHook,
  distribute,
  distributeEqual,
  distributeNative,
  estimateCost,
  getPoolId,
  mineHookAddress,
  setOperator,
} from '../../src/uniswap-v4'
import { HOOK, POOL_ID, SENDER, TOKEN, createMockChain, recipients } from '../helpers/mock-chain'

const ready = { operators: [SENDER], registeredPools: [POOL_ID] }

/** Low 14 bits of an address: where V4 reads hook permissions from */
const flagsOf = (address: string) => Number(BigInt(address) & 0x3fffn)

describe('uniswap-v4: address mining', () => {
  it('matches v4-periphery HookMiner.find for the same init code', () => {
    // Vector from `forge script script/DeployBatchDistributeHook.s.sol` on a Base fork,
    // HOOK_OWNER=0x…bEEF HOOK_OPERATOR=0x…cafE (plagtech/spraay-uniswap-v4-hook)
    const initCode = encodeDeployData({
      abi: batchDistributeHookAbi,
      bytecode: batchDistributeHookBytecode,
      args: [
        UNISWAP_V4[8453].poolManager,
        '0x1646452F98E36A3c9Cfc3eDD8868221E207B5eEC',
        '0x000000000000000000000000000000000000bEEF',
        '0x000000000000000000000000000000000000cafE',
      ],
    })
    const mined = mineHookAddress({ initCode })
    expect(mined.salt).toBe(`0x${'182d'.padStart(64, '0')}`)
    expect(mined.address).toBe('0x3B9029041b8805Be91cf91e8AB5825912028D010')
  })

  it('finds an address with exactly afterInitialize + afterDonate set', () => {
    expect(BATCH_DISTRIBUTE_HOOK_FLAGS).toBe(0x1010)
    const { address } = mineHookAddress({ initCode: '0x6080' })
    expect(flagsOf(address)).toBe(0x1010)
  })

  it('throws HOOK_ADDRESS_NOT_FOUND when the search space is exhausted', () => {
    expect(() => mineHookAddress({ initCode: '0x6080', maxIterations: 1 })).toThrow(
      expect.objectContaining({ code: 'HOOK_ADDRESS_NOT_FOUND' }),
    )
  })
})

describe('uniswap-v4: deployment', () => {
  it('deploys through the CREATE2 deployer with PoolManager, Spraay, owner and operator', async () => {
    const { walletClient, publicClient, state, spraay } = createMockChain({ chain: base })
    const operator = '0x5555555555555555555555555555555555555555'
    const result = await deployHook({ chain: base, walletClient, publicClient, operator })

    expect(result.constructorArgs).toEqual([UNISWAP_V4[8453].poolManager, spraay, SENDER, operator])
    expect(flagsOf(result.address)).toBe(BATCH_DISTRIBUTE_HOOK_FLAGS)

    const tx = state.sent[0]!
    expect(tx.to).toBe(CREATE2_DEPLOYER)
    expect(slice(tx.data, 0, 32)).toBe(result.salt)
    const initCode = slice(tx.data, 32)
    const { args } = decodeDeployData({ abi: batchDistributeHookAbi, bytecode: batchDistributeHookBytecode, data: initCode })
    expect(args).toEqual(result.constructorArgs)
    expect(getContractAddress({ opcode: 'CREATE2', from: CREATE2_DEPLOYER, salt: result.salt, bytecodeHash: keccak256(initCode) })).toBe(
      result.address,
    )
  })

  it('defaults the operator to none and uses BNB Chain addresses on BNB Chain', async () => {
    const { walletClient, publicClient } = createMockChain()
    const result = await deployHook({ chain: bsc, walletClient, publicClient })
    expect(result.constructorArgs).toEqual([
      '0x28e2Ea090877bF75740558f6BFB36A5ffeE9e9dF',
      '0x3093a2951FB77b3beDfB8BA20De645F7413432C1',
      SENDER,
      zeroAddress,
    ])
  })

  it('skips a mined address that is already deployed', async () => {
    const probe = createMockChain()
    const first = await deployHook({ chain: bsc, walletClient: probe.walletClient, publicClient: probe.publicClient, waitForReceipt: false })

    const { walletClient, publicClient } = createMockChain({ deployedCode: [first.address] })
    const second = await deployHook({ chain: bsc, walletClient, publicClient })
    expect(second.address).not.toBe(first.address)
    expect(BigInt(second.salt)).toBeGreaterThan(BigInt(first.salt))
    expect(flagsOf(second.address)).toBe(BATCH_DISTRIBUTE_HOOK_FLAGS)
  })

  it('accepts a precomputed salt and rejects one without the permission flags', async () => {
    const probe = createMockChain()
    const mined = await deployHook({ chain: bsc, walletClient: probe.walletClient, publicClient: probe.publicClient, waitForReceipt: false })

    const { walletClient, publicClient } = createMockChain()
    const reused = await deployHook({ chain: bsc, walletClient, publicClient, salt: mined.salt })
    expect(reused.address).toBe(mined.address)

    // first salt whose address does not carry the hook's flags
    const bytecodeHash = keccak256(slice(probe.state.sent[0]!.data, 32))
    let i = 0
    const saltAt = (n: number) => numberToHex(n, { size: 32 })
    while (flagsOf(getContractAddress({ opcode: 'CREATE2', from: CREATE2_DEPLOYER, salt: saltAt(i), bytecodeHash })) === BATCH_DISTRIBUTE_HOOK_FLAGS) i++
    await expect(deployHook({ chain: bsc, walletClient, publicClient, salt: saltAt(i) })).rejects.toMatchObject({ code: 'INVALID_ADDRESS' })
  })

  it('throws when the deployment reverts', async () => {
    const { walletClient, publicClient } = createMockChain({ revertSends: true })
    await expect(deployHook({ chain: bsc, walletClient, publicClient })).rejects.toMatchObject({ code: 'TRANSACTION_REVERTED' })
  })

  it('rejects chains without Uniswap V4 + Spraay', async () => {
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

describe('uniswap-v4: pool helpers', () => {
  it('computes the PoolId as keccak256(abi.encode(PoolKey)), matching Solidity', () => {
    // `cast keccak $(cast abi-encode "f(address,address,uint24,int24,address)" ...)`
    expect(getPoolId({ currency0: zeroAddress, currency1: TOKEN, fee: 3000, tickSpacing: 60, hooks: HOOK })).toBe(
      '0xf8bea7c8056dcc5224edef63bd57f7041343352cbd4e9bcd58d9aa85bde2fe76',
    )
  })

  it('validates fee and tickSpacing', () => {
    const key = { currency0: zeroAddress, currency1: TOKEN, fee: 3000, tickSpacing: 60, hooks: HOOK }
    expect(() => getPoolId({ ...key, tickSpacing: 0 })).toThrow(RangeError)
    expect(() => getPoolId({ ...key, fee: 2 ** 24 })).toThrow(RangeError)
  })
})

describe('uniswap-v4: distribution through the hook', () => {
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

describe('uniswap-v4: UniswapV4Adapter', () => {
  it('static deploy resolves to the mined hook address on the signer chain', async () => {
    const { walletClient, publicClient, state } = createMockChain({ chain: base })
    const address = await UniswapV4Adapter.deploy({ signer: walletClient, publicClient })
    expect(flagsOf(address)).toBe(BATCH_DISTRIBUTE_HOOK_FLAGS)
    expect(state.sent[0]!.to).toBe(CREATE2_DEPLOYER)
  })

  it('static deploy passes poolManager / spraayContract overrides into the constructor', async () => {
    const { walletClient, publicClient } = createMockChain({ chain: base })
    const poolManager = '0x6666666666666666666666666666666666666666'
    const spraayContract = '0x7777777777777777777777777777777777777777'
    const result = await UniswapV4Adapter.deployWithResult({ signer: walletClient, publicClient, poolManager, spraayContract })
    expect(result.constructorArgs).toEqual([poolManager, spraayContract, SENDER, zeroAddress])
  })

  it('batchDistribute maps {address, amount} recipients onto batchDistribute', async () => {
    const { walletClient, publicClient, state } = createMockChain(ready)
    const adapter = new UniswapV4Adapter({ hook: HOOK, poolId: POOL_ID, walletClient, publicClient })
    const [a, b] = recipients(2)
    const hash = await adapter.batchDistribute({ token: TOKEN, recipients: [{ address: a!, amount: 1_000n }, { address: b!, amount: 2_000n }] })

    expect(hash).toMatch(/^0x[0-9a-f]{64}$/)
    expect(state.sent.at(-1)).toMatchObject({ functionName: 'batchDistribute', args: [POOL_ID, TOKEN, [a, b], [1_000n, 2_000n]] })
  })

  it('batchDistribute with NATIVE_TOKEN sends value instead of approving', async () => {
    const { walletClient, publicClient, state } = createMockChain(ready)
    const adapter = new UniswapV4Adapter({ hook: HOOK, poolId: POOL_ID, walletClient, publicClient })
    await adapter.batchDistribute({ token: NATIVE_TOKEN, recipients: [{ address: recipients(1)[0]!, amount: 10_000n }] })
    expect(state.sent).toHaveLength(1)
    expect(state.sent[0]).toMatchObject({ functionName: 'batchDistribute', value: 10_030n })
  })

  it('batchDistributeEqual forwards amountPerRecipient', async () => {
    const { walletClient, publicClient, state } = createMockChain({ ...ready, allowance: 10n ** 30n })
    const adapter = new UniswapV4Adapter({ hook: HOOK, poolId: POOL_ID, walletClient, publicClient })
    const addrs = recipients(4)
    await adapter.batchDistributeEqual({ token: TOKEN, recipients: addrs, amountPerRecipient: 500n })
    expect(state.sent[0]).toMatchObject({ functionName: 'batchDistributeEqual', args: [POOL_ID, TOKEN, addrs, 500n] })
  })

  it('reads operator and pool registration through the hook', async () => {
    const { walletClient, publicClient } = createMockChain(ready)
    const adapter = new UniswapV4Adapter({ hook: HOOK, poolId: POOL_ID, walletClient, publicClient })
    expect(await adapter.isOperator(SENDER)).toBe(true)
    expect(await adapter.isRegisteredPool()).toBe(true)
  })
})
