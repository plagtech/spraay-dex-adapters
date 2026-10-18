import type { Address, Hash, Hex, PublicClient, WalletClient } from 'viem'
import { isNative } from '../core/tx'
import type { ChainLike, CostEstimate, DistributeResult } from '../core/types'
import { getHookInfo, isOperator, isRegisteredPool, setOperator, type AdminResult, type HookInfo } from './admin'
import { deployBatchDistributeHook, type DeployHookResult } from './deploy'
import { distribute, distributeEqual, distributeNative, estimateCost } from './distribute'

export interface UniswapV4AdapterConfig {
  /** Deployed BatchDistributeHook */
  hook: Address
  /** Uniswap V4 pool the distributions are attributed to (see `getPoolId`) */
  poolId: Hex
  walletClient: WalletClient
  publicClient?: PublicClient
  /** Defaults to `walletClient.chain` */
  chain?: ChainLike
}

export interface UniswapV4DeployParams {
  signer: WalletClient
  publicClient?: PublicClient
  /** Defaults to `signer.chain` */
  chain?: ChainLike
  /** Defaults to the Uniswap V4 PoolManager on `chain` */
  poolManager?: Address
  /** Defaults to the Spraay deployment on `chain` */
  spraayContract?: Address
  /** Defaults to the signer */
  owner?: Address
  /** Defaults to none */
  operator?: Address
}

function chainOf(walletClient: WalletClient, chain?: ChainLike): ChainLike {
  const resolved = chain ?? walletClient.chain
  if (resolved === undefined) throw new TypeError('No chain: pass `chain` or use a walletClient with a chain')
  return resolved
}

/**
 * Object-style wrapper around the `@spraay/dex-adapters/uniswap-v4` functions, bound to one hook and pool.
 * Every method maps 1:1 onto a function export; use those directly for full control (approval, receipts).
 */
export class UniswapV4Adapter {
  readonly hook: Address
  readonly poolId: Hex
  readonly chain: ChainLike
  private readonly walletClient: WalletClient
  private readonly publicClient?: PublicClient

  constructor(config: UniswapV4AdapterConfig) {
    this.hook = config.hook
    this.poolId = config.poolId
    this.walletClient = config.walletClient
    this.publicClient = config.publicClient
    this.chain = chainOf(config.walletClient, config.chain)
  }

  /** Mines a CREATE2 salt for the hook's permission flags and deploys. Resolves to the hook address. */
  static async deploy(params: UniswapV4DeployParams): Promise<Address> {
    return (await UniswapV4Adapter.deployWithResult(params)).address
  }

  /** Like `deploy`, but returns the transaction hash, salt and constructor args too */
  static deployWithResult(params: UniswapV4DeployParams): Promise<DeployHookResult> {
    return deployBatchDistributeHook({
      chain: chainOf(params.signer, params.chain),
      walletClient: params.signer,
      publicClient: params.publicClient,
      poolManager: params.poolManager,
      spraay: params.spraayContract,
      owner: params.owner,
      operator: params.operator,
    })
  }

  private get tx() {
    return { hook: this.hook, poolId: this.poolId, chain: this.chain, walletClient: this.walletClient, publicClient: this.publicClient }
  }

  /** Per-recipient amounts. `token` may be `NATIVE_TOKEN` for ETH / BNB. Approves the hook when needed. */
  async batchDistribute(params: { token: Address; recipients: readonly { address: Address; amount: bigint }[] }): Promise<Hash> {
    return (await this.batchDistributeWithResult(params)).hash
  }

  async batchDistributeWithResult(params: {
    token: Address
    recipients: readonly { address: Address; amount: bigint }[]
  }): Promise<DistributeResult> {
    const recipients = params.recipients.map((r) => r.address)
    const amounts = params.recipients.map((r) => r.amount)
    return isNative(params.token)
      ? distributeNative({ ...this.tx, recipients, amounts })
      : distribute({ ...this.tx, token: params.token, recipients, amounts })
  }

  /** Same amount to every recipient. `token` may be `NATIVE_TOKEN`. */
  async batchDistributeEqual(params: { token: Address; recipients: readonly Address[]; amountPerRecipient: bigint }): Promise<Hash> {
    const result = await distributeEqual({
      ...this.tx,
      token: params.token,
      recipients: params.recipients,
      amountEach: params.amountPerRecipient,
    })
    return result.hash
  }

  estimateCost(params: { token: Address; recipients: readonly { address: Address; amount: bigint }[] }): Promise<CostEstimate> {
    return estimateCost({
      hook: this.hook,
      poolId: this.poolId,
      chain: this.chain,
      publicClient: this.reader,
      token: params.token,
      recipients: params.recipients.map((r) => r.address),
      amounts: params.recipients.map((r) => r.amount),
      account: this.walletClient.account,
    })
  }

  /** Owner only */
  setOperator(operator: Address, allowed = true): Promise<AdminResult> {
    const { hook, chain, walletClient, publicClient } = this.tx
    return setOperator({ hook, chain, walletClient, publicClient, operator, allowed })
  }

  isOperator(account: Address): Promise<boolean> {
    return isOperator({ hook: this.hook, publicClient: this.reader, account })
  }

  isRegisteredPool(poolId: Hex = this.poolId): Promise<boolean> {
    return isRegisteredPool({ hook: this.hook, publicClient: this.reader, poolId })
  }

  getHookInfo(): Promise<HookInfo> {
    return getHookInfo({ hook: this.hook, publicClient: this.reader })
  }

  private get reader(): PublicClient {
    return this.publicClient ?? (this.walletClient as unknown as PublicClient)
  }
}
