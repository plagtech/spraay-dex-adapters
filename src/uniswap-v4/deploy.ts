import {
  type Address,
  type Client,
  type Hash,
  type Hex,
  type TransactionReceipt,
  concat,
  encodeDeployData,
  getContractAddress,
  keccak256,
  numberToHex,
  zeroAddress,
} from 'viem'
import { getCode, sendTransaction, waitForTransactionReceipt } from 'viem/actions'
import { getSpraayAddress } from '../core/addresses'
import { SpraayError } from '../core/errors'
import { resolveTxContext } from '../core/tx'
import type { TxOptions } from '../core/types'
import { batchDistributeHookAbi } from './abi'
import { batchDistributeHookBytecode } from './bytecode'
import {
  ALL_HOOK_MASK,
  BATCH_DISTRIBUTE_HOOK_FLAGS,
  CREATE2_DEPLOYER,
  HOOK_MINER_MAX_LOOP,
  getUniswapV4Addresses,
} from './constants'

export interface MineHookAddressParams {
  /** Full creation code including ABI-encoded constructor args */
  initCode: Hex
  /** Defaults to the hook's afterInitialize + afterDonate flags */
  flags?: number
  deployer?: Address
  /** First salt to try (default 0) */
  startSalt?: bigint
  /** Salts to try before giving up (default `HOOK_MINER_MAX_LOOP`, same as v4-periphery's HookMiner) */
  maxIterations?: number
}

export interface MinedHookAddress {
  address: Address
  salt: Hex
}

/**
 * TypeScript port of v4-periphery `HookMiner.find`: searches for a CREATE2 salt whose resulting
 * address has exactly `flags` in its low 14 bits. Pure; does not check whether the address is free.
 */
export function mineHookAddress(params: MineHookAddressParams): MinedHookAddress {
  const flags = BigInt((params.flags ?? BATCH_DISTRIBUTE_HOOK_FLAGS) & ALL_HOOK_MASK)
  const mask = BigInt(ALL_HOOK_MASK)
  const deployer = params.deployer ?? CREATE2_DEPLOYER
  const bytecodeHash = keccak256(params.initCode)
  const start = params.startSalt ?? 0n
  const end = start + BigInt(params.maxIterations ?? HOOK_MINER_MAX_LOOP)

  for (let i = start; i < end; i++) {
    const salt = numberToHex(i, { size: 32 })
    const address = getContractAddress({ opcode: 'CREATE2', from: deployer, salt, bytecodeHash })
    if ((BigInt(address) & mask) === flags) return { address, salt }
  }
  throw new SpraayError('HOOK_ADDRESS_NOT_FOUND', `No hook address with flags 0x${flags.toString(16)} found in ${end - start} salts`)
}

/** Mines the next salt whose address is not already deployed (HookMiner skips occupied addresses too) */
async function mineFreeHookAddress(reader: Client, initCode: Hex): Promise<MinedHookAddress> {
  let startSalt = 0n
  for (;;) {
    const mined = mineHookAddress({ initCode, startSalt })
    const code = await getCode(reader, { address: mined.address })
    if (!code || code === '0x') return mined
    startSalt = BigInt(mined.salt) + 1n
  }
}

export interface DeployHookParams extends Omit<TxOptions, 'approve'> {
  /** Hook admin (`Ownable2Step`). Defaults to the deploying account. */
  owner?: Address
  /** Initial distribution operator. Defaults to none; add one later with `setOperator`. */
  operator?: Address
  /** Defaults to the Uniswap V4 PoolManager on `chain` */
  poolManager?: Address
  /** Defaults to the Spraay deployment on `chain` */
  spraay?: Address
  /** Skip mining by passing a known salt (e.g. from `mineHookAddress` or the Foundry script) */
  salt?: Hex
}

export interface DeployHookResult {
  hash: Hash
  /** CREATE2 address with the hook's permission flags; known before the transaction is mined */
  address: Address
  salt: Hex
  receipt?: TransactionReceipt
  constructorArgs: readonly [poolManager: Address, spraay: Address, owner: Address, operator: Address]
}

/**
 * Deploys BatchDistributeHook through the deterministic CREATE2 deployer.
 *
 * Uniswap V4 reads hook permissions from the hook's address, so the address must have exactly the
 * afterInitialize + afterDonate bits set. This mines a matching salt (about 16k tries on average,
 * usually under a second) and sends `salt ++ initCode` to the CREATE2 deployer.
 */
export async function deployBatchDistributeHook(params: DeployHookParams): Promise<DeployHookResult> {
  const poolManager = params.poolManager ?? getUniswapV4Addresses(params.chain).poolManager
  const spraay = params.spraay ?? getSpraayAddress(params.chain)
  const ctx = await resolveTxContext(params)
  const constructorArgs = [poolManager, spraay, params.owner ?? ctx.accountAddress, params.operator ?? zeroAddress] as const

  const initCode = encodeDeployData({ abi: batchDistributeHookAbi, bytecode: batchDistributeHookBytecode, args: constructorArgs })
  const { address, salt } = params.salt
    ? {
        salt: params.salt,
        address: getContractAddress({ opcode: 'CREATE2', from: CREATE2_DEPLOYER, salt: params.salt, bytecodeHash: keccak256(initCode) }),
      }
    : await mineFreeHookAddress(ctx.reader, initCode)
  if ((BigInt(address) & BigInt(ALL_HOOK_MASK)) !== BigInt(BATCH_DISTRIBUTE_HOOK_FLAGS)) {
    throw new SpraayError('INVALID_ADDRESS', `Salt ${salt} gives ${address}, which does not encode the hook's permission flags`)
  }

  const hash = await sendTransaction(ctx.walletClient, {
    to: CREATE2_DEPLOYER,
    data: concat([salt, initCode]),
    account: ctx.account,
    chain: ctx.walletClient.chain ?? null,
  } as any)
  if (!ctx.waitForReceipt) return { hash, address, salt, constructorArgs }

  const receipt = await waitForTransactionReceipt(ctx.reader, { hash })
  const code = receipt.status === 'success' ? await getCode(ctx.reader, { address }) : undefined
  if (!code || code === '0x') {
    throw new SpraayError('TRANSACTION_REVERTED', `Hook deployment ${hash} reverted or left no code at ${address}`)
  }
  return { hash, address, salt, receipt, constructorArgs }
}
