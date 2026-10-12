import type { Account, Address, Chain, Hash, PublicClient, TransactionReceipt, WalletClient } from 'viem'

/** Chains with a Spraay deployment */
export type SupportedChainId = 56 | 8453

/** A viem `Chain` object or a numeric chain id */
export type ChainLike = Chain | number

/** Mirrors `SprayContract.Recipient` / `ISpraay.Recipient` */
export interface Recipient {
  recipient: Address
  amount: bigint
}

/** Options shared by every write call */
export interface TxOptions {
  chain: ChainLike
  walletClient: WalletClient
  /** Used for reads, simulation and receipts. Defaults to `walletClient` (its transport must serve reads). */
  publicClient?: PublicClient
  /** Overrides `walletClient.account` */
  account?: Account | Address
  /** Approve the spender for exactly the required ERC-20 amount when the allowance is short. Default `true`. */
  approve?: boolean
  /** Wait for the receipt and throw if the transaction reverted. Default `true`. */
  waitForReceipt?: boolean
}

/** ERC-20 batch with per-recipient amounts */
export interface DistributeParams extends TxOptions {
  token: Address
  recipients: readonly Address[]
  /** Amount for each recipient in token base units, excluding the Spraay fee */
  amounts: readonly bigint[]
}

/** Same amount to every recipient. `token` may be `NATIVE_TOKEN` (the zero address) for BNB / ETH. */
export interface DistributeEqualParams extends TxOptions {
  token: Address
  recipients: readonly Address[]
  /** Amount each recipient receives in base units, excluding the Spraay fee */
  amountEach: bigint
}

/** Native currency (BNB / ETH) batch with per-recipient amounts */
export interface DistributeNativeParams extends TxOptions {
  recipients: readonly Address[]
  amounts: readonly bigint[]
}

export interface EstimateCostParams {
  /** ERC-20 address, or `NATIVE_TOKEN` (the zero address) for BNB / ETH */
  token: Address
  recipients: readonly Address[]
  amounts: readonly bigint[]
  chain: ChainLike
  publicClient: PublicClient
  /** Sender to estimate gas for. Without it, only the fee breakdown is returned. */
  account?: Account | Address
}

export interface DistributeResult {
  hash: Hash
  /** Present unless `waitForReceipt` is `false` */
  receipt?: TransactionReceipt
  /** Hash of the ERC-20 approval sent first, if one was needed */
  approvalHash?: Hash
  /** Contract the distribution was sent to (Spraay, or a DEX hook) */
  contract: Address
  /** Distributed token, the zero address for BNB / ETH */
  token: Address
  recipientCount: number
  /** Sum delivered to recipients */
  totalAmount: bigint
  /** Spraay protocol fee, charged on top */
  fee: bigint
  /** `totalAmount + fee`, what the sender pays */
  totalCost: bigint
}

export interface CostEstimate {
  recipientCount: number
  totalAmount: bigint
  fee: bigint
  totalCost: bigint
  /** Fee rate read on-chain */
  feeBps: bigint
  /** Present when `account` was given and estimation succeeded */
  gas?: bigint
  gasPrice?: bigint
  /** `gas * gasPrice`, in native currency wei */
  gasCost?: bigint
  /** Why gas could not be estimated (e.g. the ERC-20 allowance is not set yet) */
  gasEstimateError?: string
  /** ERC-20 only, when `account` was given: whether an approval transaction is needed first */
  approvalRequired?: boolean
}
