import {
  type Abi,
  type Address,
  type Chain,
  type Hash,
  type Hex,
  createPublicClient,
  createWalletClient,
  custom,
  decodeFunctionData,
  encodeFunctionResult,
  erc20Abi,
  getAddress,
  getContractAddress,
  slice,
  keccak256,
  numberToHex,
  toHex,
} from 'viem'
import { bsc } from 'viem/chains'
import { spraayAbi } from '../../src/core/abi'
import { SPRAAY_ADDRESSES } from '../../src/core/addresses'
import { batchDistributeHookAbi as balancerHookAbi } from '../../src/balancer/abi'
import { batchDistributeHookAbi as pancakeswapHookAbi } from '../../src/pancakeswap/abi'
import { CREATE2_DEPLOYER } from '../../src/uniswap-v4/constants'

// Merge both ABIs so the mock chain handles PancakeSwap and Balancer hook calls.
// Distinct selectors (isRegisteredPool(bytes32) vs isRegisteredPool(address)) route correctly;
// identical selectors (isOperator, quoteTotalCost, etc.) share the same return type so the
// first match encodes the same result.
const mergedHookAbi: Abi = [...pancakeswapHookAbi, ...balancerHookAbi] as unknown as Abi

export const SENDER: Address = '0x1111111111111111111111111111111111111111'
export const TOKEN: Address = '0x2222222222222222222222222222222222222222'
export const HOOK: Address = '0x3333333333333333333333333333333333333333'
export const DEPLOYED_HOOK: Address = '0x4444444444444444444444444444444444444444'
export const POOL_ID: Hex = '0x00000000000000000000000000000000000000000000000000000000000000aa'

export const recipients = (n: number): Address[] =>
  Array.from({ length: n }, (_, i) => getAddress(numberToHex(i + 1, { size: 20 })))

export interface SentTx {
  from: Address
  to?: Address
  value: bigint
  functionName?: string
  args?: readonly unknown[]
  data: Hex
}

interface Options {
  chain?: Chain
  feeBps?: bigint
  allowance?: bigint
  operators?: Address[]
  registeredPools?: Hex[]
  revertSends?: boolean
  /** Addresses that already have code (eth_getCode returns non-empty) */
  deployedCode?: Address[]
}

/** In-memory JSON-RPC provider that understands the Spraay, BatchDistributeHook and ERC-20 ABIs */
export function createMockChain(options: Options = {}) {
  const chain = options.chain ?? bsc
  const spraay = SPRAAY_ADDRESSES[chain.id as 56 | 8453]
  const state = {
    feeBps: options.feeBps ?? 30n,
    allowances: new Map<string, bigint>(),
    operators: new Set((options.operators ?? []).map((a) => a.toLowerCase())),
    pools: new Set((options.registeredPools ?? []).map((p) => p.toLowerCase())),
    sent: [] as SentTx[],
    calls: [] as { to: Address; functionName: string }[],
    code: new Set((options.deployedCode ?? []).map((a) => a.toLowerCase())),
    receipts: new Map<Hash, { status: 'success' | 'reverted'; contractAddress?: Address; to?: Address }>(),
  }
  if (options.allowance !== undefined) {
    state.allowances.set(`${TOKEN}:${SENDER}:${spraay}`.toLowerCase(), options.allowance)
    state.allowances.set(`${TOKEN}:${SENDER}:${HOOK}`.toLowerCase(), options.allowance)
  }

  const totalCost = (amount: bigint) => amount + (amount * state.feeBps) / 10_000n

  function abiFor(to: string): Abi {
    const addr = to.toLowerCase()
    if (addr === spraay.toLowerCase()) return spraayAbi
    if (addr === HOOK.toLowerCase() || addr === DEPLOYED_HOOK.toLowerCase()) return mergedHookAbi
    return erc20Abi
  }

  function call(to: Address, data: Hex, from?: Address): Hex {
    const abi = abiFor(to)
    const { functionName, args = [] } = decodeFunctionData({ abi, data })
    state.calls.push({ to, functionName })
    const result = (() => {
      switch (functionName) {
        case 'calculateTotalCost':
        case 'quoteTotalCost':
          return totalCost(args[0] as bigint)
        case 'feeBps':
          return state.feeBps
        case 'MAX_RECIPIENTS':
          return 200n
        case 'spraay':
          return spraay
        case 'allowance':
          return state.allowances.get(`${to}:${args[0]}:${args[1]}`.toLowerCase()) ?? 0n
        case 'isOperator':
          return state.operators.has((args[0] as string).toLowerCase())
        case 'isRegisteredPool':
          return state.pools.has((args[0] as string).toLowerCase())
        case 'approve':
          return true
        default:
          return undefined // writes with no return value
      }
    })()
    void from
    const fn = (abi as readonly { type: string; name?: string; outputs?: readonly unknown[] }[]).find(
      (item) => item.type === 'function' && item.name === functionName,
    )
    if (!fn?.outputs?.length) return '0x'
    return encodeFunctionResult({ abi, functionName, result } as any)
  }

  function send(tx: { from: Address; to?: Address; data: Hex; value?: Hex }): Hash {
    const hash = keccak256(toHex(`tx-${state.sent.length}`))
    const value = tx.value ? BigInt(tx.value) : 0n
    if (tx.to?.toLowerCase() === CREATE2_DEPLOYER.toLowerCase()) {
      // Uniswap V4 hooks: raw `salt ++ initCode` to the deterministic CREATE2 deployer
      state.sent.push({ from: tx.from, to: tx.to, value, data: tx.data })
      const deployed = getContractAddress({ opcode: 'CREATE2', from: CREATE2_DEPLOYER, salt: slice(tx.data, 0, 32), bytecodeHash: keccak256(slice(tx.data, 32)) })
      if (!options.revertSends) state.code.add(deployed.toLowerCase())
      state.receipts.set(hash, { status: options.revertSends ? 'reverted' : 'success', to: tx.to })
      return hash
    }
    if (!tx.to) {
      state.sent.push({ from: tx.from, value, data: tx.data })
      state.receipts.set(hash, { status: 'success', contractAddress: DEPLOYED_HOOK })
      return hash
    }
    const { functionName, args = [] } = decodeFunctionData({ abi: abiFor(tx.to), data: tx.data })
    state.sent.push({ from: tx.from, to: tx.to, value, functionName, args, data: tx.data })
    if (functionName === 'approve') {
      state.allowances.set(`${tx.to}:${tx.from}:${args[0]}`.toLowerCase(), args[1] as bigint)
    }
    if (functionName === 'setOperator') {
      const op = (args[0] as string).toLowerCase()
      if (args[1]) state.operators.add(op)
      else state.operators.delete(op)
    }
    const reverted = options.revertSends && functionName !== 'approve'
    state.receipts.set(hash, { status: reverted ? 'reverted' : 'success', to: tx.to })
    return hash
  }

  const provider = {
    async request({ method, params }: { method: string; params?: any }): Promise<unknown> {
      switch (method) {
        case 'eth_chainId':
          return numberToHex(chain.id)
        case 'eth_blockNumber':
          return '0x10'
        case 'eth_call':
          return call(params[0].to, params[0].data ?? params[0].input, params[0].from)
        case 'eth_getCode':
          return state.code.has(params[0].toLowerCase()) ? '0x6080' : '0x'
        case 'eth_estimateGas':
          return numberToHex(150_000)
        case 'eth_gasPrice':
          return numberToHex(1_000_000_000)
        case 'eth_sendTransaction':
          return send({ ...params[0], data: params[0].data ?? params[0].input })
        case 'eth_getTransactionReceipt': {
          const receipt = state.receipts.get(params[0])
          if (!receipt) return null
          return {
            transactionHash: params[0],
            transactionIndex: '0x0',
            blockHash: keccak256('0x01'),
            blockNumber: '0x10',
            from: SENDER,
            to: receipt.to ?? null,
            cumulativeGasUsed: '0x1',
            gasUsed: '0x1',
            effectiveGasPrice: '0x1',
            contractAddress: receipt.contractAddress ?? null,
            logs: [],
            logsBloom: `0x${'0'.repeat(512)}`,
            status: receipt.status === 'success' ? '0x1' : '0x0',
            type: '0x2',
          }
        }
        default:
          throw new Error(`mock-chain: unsupported method ${method}`)
      }
    },
  }

  const transport = custom(provider, { retryCount: 0 })
  const walletClient = createWalletClient({ account: SENDER, chain, transport, pollingInterval: 1 })
  const publicClient = createPublicClient({ chain, transport, pollingInterval: 1 })

  return { chain, spraay, state, walletClient, publicClient, totalCost }
}
