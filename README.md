# @spraay/dex-adapters

Push-model batch distribution for DEXes, powered by [Spraay Protocol](https://spraay.app). You can send tokens to up to 200 recipients in one transaction, either straight through Spraay or through a DEX integration that ties each payout to a pool.

```sh
npm install @spraay/dex-adapters viem
```

| Adapter | Import | Status |
| --- | --- | --- |
| Generic | `@spraay/dex-adapters/generic` | ✅ Direct Spraay calls on any supported chain |
| Uniswap V4 | `@spraay/dex-adapters/uniswap-v4` | ✅ `BatchDistributeHook` (CREATE2-mined deploy, admin, distribute) on Base, BNB Chain |
| PancakeSwap Infinity | `@spraay/dex-adapters/pancakeswap` | ✅ `BatchDistributeHook` (deploy, admin, distribute) |
| SushiSwap | `@spraay/dex-adapters/sushiswap` | ✅ Launchpad holder rewards on Base ([sushi-labs/sushiswap#2324](https://github.com/sushi-labs/sushiswap/pull/2324), open) |
| Balancer v3 | `@spraay/dex-adapters/balancer` | ✅ `BatchDistributeHook` (deploy, admin, distribute) on Base |

## Push vs pull distribution

DEX incentives are usually **pull-based**. Rewards build up in a contract (farms, `donate()`, merkle distributors), and each recipient sends their own claim transaction. Spraay is **push-based**. The sender chooses the recipient list off-chain and delivers to every recipient in one transaction, with no claim step.

|                     | Pull (farms, donate, merkle claims) | Push (Spraay)                              |
| ------------------- | ----------------------------------- | ------------------------------------------ |
| Who pays gas        | Each recipient, on claim            | The sender, once per batch                 |
| Eligible recipients | Positions or proofs set up on-chain | Any address                                |
| Allocation logic    | On-chain                            | Off-chain, decided by the sender           |
| Recipient action    | Claim                               | None                                       |
| Best for            | Open, continuous incentives         | Airdrops, holder rewards, revenue shares, targeted payouts |

The two models work well together. A pool can keep its farm running while its operator pushes one-off or targeted payouts.

## Quick start

### Generic: call Spraay directly

```ts
import { createPublicClient, createWalletClient, custom, http, parseUnits } from 'viem'
import { base } from 'viem/chains'
import { distribute, estimateCost } from '@spraay/dex-adapters/generic'

const walletClient = createWalletClient({ chain: base, transport: custom(window.ethereum) })
const [account] = await walletClient.requestAddresses()
const publicClient = createPublicClient({ chain: base, transport: http() })

const recipients = ['0xAbc…', '0xDef…'] as const
const amounts = [parseUnits('100', 6), parseUnits('250', 6)]

const quote = await estimateCost({ token: USDC, recipients, amounts, chain: base, publicClient, account })
// quote.totalAmount 350_000000n, quote.fee 1_050000n (30 bps), quote.totalCost 351_050000n, quote.gas …

const { hash, approvalHash } = await distribute({
  token: USDC,
  recipients,
  amounts,
  chain: base,
  walletClient,
  publicClient,
  account,
})
```

`distribute` reads the live cost on-chain. If the allowance is short, it approves Spraay for exactly `amount + fee` and waits for that approval. Then it simulates the distribution, sends it, and waits for the receipt.

### PancakeSwap Infinity: distribute through `BatchDistributeHook`

The hook links every batch to an Infinity pool that was initialized with it. Distributions from the hook show up next to the pool's `donate()` incentives in indexers.

```ts
import { zeroAddress } from 'viem'
import { bsc } from 'viem/chains'
import {
  deployHook,
  distribute,
  encodeCLPoolParameters,
  getPoolId,
  PANCAKESWAP_INFINITY,
  setOperator,
} from '@spraay/dex-adapters/pancakeswap'

// 1. Deploy once per chain. Defaults: owner = deployer, poolManager = PancakeSwap's CLPoolManager.
const { address: hook } = await deployHook({ chain: bsc, walletClient, publicClient, operator: account })

// 2. Create the pool with the hook. Its parameters carry the hook's callback bitmap + tickSpacing.
const poolKey = {
  currency0: zeroAddress, // BNB
  currency1: TOKEN,
  hooks: hook!,
  poolManager: PANCAKESWAP_INFINITY[56].clPoolManager,
  fee: 3000,
  parameters: encodeCLPoolParameters(60),
}
// … initialize the pool via CLPoolManager / CLPositionManager …
const poolId = getPoolId(poolKey)

// 3. Distribute. The operator funds the batch, and the hook forwards it to Spraay in the same tx.
await distribute({ hook: hook!, poolId, token: TOKEN, recipients, amounts, chain: bsc, walletClient, publicClient })
```

PancakeSwap-specific functions:

- `deployHook` / `deployBatchDistributeHook`
- `setOperator`, `setSpraayContract`, `rescueTokens`, `transferOwnership`, `acceptOwnership`
- `isOperator`, `isRegisteredPool`, `quoteHookTotalCost`, `getHookInfo`
- `getPoolId`, `encodeCLPoolParameters`, `BATCH_DISTRIBUTE_HOOK_BITMAP`
- `batchDistributeHookAbi`, `batchDistributeHookBytecode`

The hook is non-custodial. Each call pulls exactly `amount + fee` from the operator, approves Spraay for that amount, and calls it, so nothing stays in the hook. Before approving anything, the SDK checks that the sender is an operator and that the pool is registered.

### Uniswap V4: distribute through `BatchDistributeHook`

Same hook model as PancakeSwap: every batch is tied to a V4 pool that was initialized with the hook, and `afterDonate` lets indexers line up push-side payouts with the pool's `donate()` incentives. The difference is deployment. V4 reads hook permissions from the low 14 bits of the hook **address**, so `deployHook` mines a CREATE2 salt for the `afterInitialize | afterDonate` flags (`0x…1010`, about a second of hashing) and deploys through the deterministic CREATE2 deployer. The miner is a port of v4-periphery's `HookMiner` and produces the same salt as the Foundry deploy script.

```ts
import { zeroAddress } from 'viem'
import { base } from 'viem/chains'
import { deployHook, distribute, getPoolId, UniswapV4Adapter } from '@spraay/dex-adapters/uniswap-v4'

// 1. Deploy once per chain. Defaults: owner = deployer, poolManager = Uniswap V4 PoolManager.
const { address: hook } = await deployHook({ chain: base, walletClient, publicClient, operator: account })

// 2. Create the pool with the hook (PoolManager.initialize / PositionManager), then derive its id.
const poolId = getPoolId({ currency0: zeroAddress, currency1: TOKEN, fee: 3000, tickSpacing: 60, hooks: hook })

// 3. Distribute. The operator funds the batch, and the hook forwards it to Spraay in the same tx.
await distribute({ hook, poolId, token: TOKEN, recipients, amounts, chain: base, walletClient, publicClient })

// Or the object-style wrapper bound to one hook + pool:
const v4 = new UniswapV4Adapter({ hook, poolId, walletClient, publicClient })
await v4.batchDistribute({ token: TOKEN, recipients: [{ address: '0xAbc…', amount: 1_000n }] })
await v4.batchDistributeEqual({ token: TOKEN, recipients: ['0xAbc…', '0xDef…'], amountPerRecipient: 500n })
```

Uniswap V4-specific functions:

- `deployHook` / `deployBatchDistributeHook` (mines automatically; pass `salt` to reuse one), `mineHookAddress`
- `UniswapV4Adapter` (`deploy`, `batchDistribute`, `batchDistributeEqual`, `estimateCost`, `setOperator`, reads)
- `setOperator`, `setSpraayContract`, `rescueTokens`, `transferOwnership`, `acceptOwnership`
- `isOperator`, `isRegisteredPool`, `quoteHookTotalCost`, `getHookInfo`
- `getPoolId`, `BATCH_DISTRIBUTE_HOOK_FLAGS`, `CREATE2_DEPLOYER`, `UNISWAP_V4`
- `batchDistributeHookAbi`, `batchDistributeHookBytecode`

Hook source, Foundry tests and deploy script: [plagtech/spraay-uniswap-v4-hook](https://github.com/plagtech/spraay-uniswap-v4-hook).

### SushiSwap: launchpad holder rewards on Base

This adapter is based on [sushi-labs/sushiswap#2324](https://github.com/sushi-labs/sushiswap/pull/2324). The launchpad sends holder rewards straight to Spraay on Base, and no Sushi contract is involved. The adapter only accepts Base and rejects other chains with `UNSUPPORTED_CHAIN`.

```ts
import { base } from 'viem/chains'
import { distribute, distributeToHolders, validateSpraayRecipients } from '@spraay/dex-adapters/sushiswap'

// Shared interface
await distribute({ token: LAUNCH_TOKEN, recipients, amounts, chain: base, walletClient, publicClient })

// Same flow as the launchpad's useBatchDistribute hook, without React
const holders = [{ recipient: '0xAbc…', amount: 1_000n }, { recipient: '0xDef…', amount: 9_000n }]
const error = validateSpraayRecipients(holders) // string | null, same as @sushiswap/batch-distribute
if (!error) await distributeToHolders({ token: { address: LAUNCH_TOKEN, symbol: 'LAUNCH' }, holders, walletClient, publicClient })
```

The adapter also re-exports the PR's helpers and constants unchanged: `getSpraayDistributionAmount`, `validateSpraayRecipients`, `calculateSpraayFee`, `SPRAAY_BATCH_ABI`, `SPRAAY_BASE_ADDRESS`, `SPRAAY_CHAIN_ID`, `SPRAAY_MAX_RECIPIENTS`, `SPRAAY_MAX_FEE_BPS` and `SPRAAY_NATIVE_SENTINEL`.

## Shared interface

Every adapter exports these four functions with the same parameters. The PancakeSwap and Uniswap V4 adapters also take `hook` and `poolId`; the Balancer adapter takes `hook` and `pool` (the Balancer v3 pool address).

```ts
distribute({ token, recipients, amounts, chain, walletClient })        // ERC-20, per-recipient amounts
distributeEqual({ token, recipients, amountEach, chain, walletClient }) // equal split; token may be NATIVE_TOKEN
distributeNative({ recipients, amounts, chain, walletClient })          // BNB / ETH
estimateCost({ token, recipients, amounts, chain, publicClient })       // fee breakdown (+ gas with `account`)
```

The write functions also accept these options:

| Option | Default | |
| --- | --- | --- |
| `publicClient` | `walletClient` | Client for reads, simulation and receipts |
| `account` | `walletClient.account` | Sender |
| `approve` | `true` | Approve exactly `amount + fee` when the allowance is short. With `false`, a short allowance throws `INSUFFICIENT_ALLOWANCE`. |
| `waitForReceipt` | `true` | Wait for the receipt and throw `TRANSACTION_REVERTED` if the transaction failed |

They return a `DistributeResult`:

```ts
{ hash, receipt?, approvalHash?, contract, token, recipientCount, totalAmount, fee, totalCost }
```

`chain` accepts a viem `Chain` or a chain id. If the wallet is on a different chain, the call throws `CHAIN_MISMATCH` before anything is signed.

The generic adapter also exports these functions under the names Spraay uses: `batchDistribute`, `batchDistributeEqual`, `batchDistributeETH` and `estimateDistributionCost`.

## Fees

Spraay charges a protocol fee **on top of** the distributed amount. The fee is currently **30 bps**. Recipients get exactly the amounts you pass in, and the sender pays `totalAmount + totalAmount * feeBps / 10000`. The Spraay contract handles the fee: it pulls the gross amount and forwards the fee to its fee recipient.

The Spraay owner can change the fee (capped at 500 bps). For that reason, the write and estimate functions always read `calculateTotalCost` on-chain. Use the `core` helpers for offline quotes:

```ts
import { calculateFee, calculateTotalCost, quoteDistribution } from '@spraay/dex-adapters/core'

calculateTotalCost(10_000n)            // 10_030n
quoteDistribution([200n, 200n, 200n])  // fee is charged once on the batch total: { totalAmount: 600n, fee: 1n, totalCost: 601n, feeBps: 30n }
```

## Limits and validation

- **At most 200 recipients per batch**, matching Spraay's on-chain `MAX_RECIPIENTS`. The SDK checks this before any RPC call. For longer lists, use `chunkDistribution(recipients, amounts)` to split them into batches.
- Recipients must be valid, non-zero addresses. Amounts must be `bigint`s greater than zero, one per recipient.
- Fee-on-transfer and rebasing tokens are not supported, because Spraay pulls the exact gross amount.

Errors thrown by the SDK are `SpraayError` instances with a `code`:

`NO_RECIPIENTS`, `TOO_MANY_RECIPIENTS`, `LENGTH_MISMATCH`, `INVALID_ADDRESS`, `INVALID_AMOUNT`, `INVALID_TOKEN`, `UNSUPPORTED_CHAIN`, `CHAIN_MISMATCH`, `MISSING_ACCOUNT`, `INSUFFICIENT_ALLOWANCE`, `TRANSACTION_REVERTED`, `NOT_OPERATOR`, `POOL_NOT_REGISTERED`, `NOT_IMPLEMENTED`, `HOOK_ADDRESS_NOT_FOUND`

Contract reverts from viem pass through with their decoded errors.

## Supported chains

**Spraay (`SprayContract`, verified on Sourcify, exact match)**

| Chain | Chain id | Address |
| --- | --- | --- |
| BNB Chain | 56 | `0x3093a2951FB77b3beDfB8BA20De645F7413432C1` |
| Base | 8453 | `0x1646452F98E36A3c9Cfc3eDD8868221E207B5eEC` |

**Uniswap V4 (used by the V4 hook)**

| Chain | PoolManager |
| --- | --- |
| BNB Chain | `0x28e2Ea090877bF75740558f6BFB36A5ffeE9e9dF` |
| Base | `0x498581fF718922c3f8e6A244956aF099B2652b2b` |

**PancakeSwap Infinity (used by the hook)**

| Chain | CLPoolManager | Vault |
| --- | --- | --- |
| BNB Chain | `0xa0FfB9c1CE1Fe56963B0321B32E7A0302114058b` | `0x238a358808379702088667322f80aC48bAd5e6c4` |
| Base | `0xa0FfB9c1CE1Fe56963B0321B32E7A0302114058b` | `0x238a358808379702088667322f80aC48bAd5e6c4` |

**Balancer v3 (used by the Balancer hook)**

| Chain | Vault |
| --- | --- |
| Base | `0xbA1333333333a1BA1108E8412f11850A5C319bA9` |

| Adapter | Chains |
| --- | --- |
| generic | BNB Chain, Base |
| uniswap-v4 | BNB Chain, Base |
| pancakeswap | BNB Chain, Base |
| sushiswap | Base |
| balancer | Base |

### Balancer v3: distribute through `BatchDistributeHook`

The Balancer hook is similar to PancakeSwap's, but pools are identified by their contract address instead of a `bytes32` pool id, and the Balancer v3 vault is deterministic (`0xbA1333…`) across all chains.

```ts
import { base } from 'viem/chains'
import { deployHook, distribute, setOperator, BALANCER_V3 } from '@spraay/dex-adapters/balancer'

// 1. Deploy once per chain. Defaults: owner = deployer, vault = Balancer v3 Vault.
const { address: hook } = await deployHook({ chain: base, walletClient, publicClient, operator: account })

// 2. Create a Balancer v3 pool that specifies this hook at registration.
//    The hook's onRegister callback tracks the pool automatically.

// 3. Distribute. The operator funds the batch, and the hook forwards it to Spraay.
await distribute({
  hook: hook!,
  pool: '0x…',   // Balancer v3 pool address (registered with the hook)
  token: USDC,
  recipients,
  amounts,
  chain: base,
  walletClient,
  publicClient,
})
```

Balancer-specific functions: `deployHook` / `deployBatchDistributeHook`, `setOperator`, `getHookInfo`, `isOperator`, `isRegisteredPool`, `quoteHookTotalCost`, `getBalancerAddresses`, `BALANCER_V3`.

See [`src/balancer/README.md`](src/balancer/README.md) for architecture details and differences from the PancakeSwap adapter.

## Package layout

```
src/core/         ABI, addresses, fee math, Recipient[] building, validation, shared types
src/generic/      direct Spraay calls
src/uniswap-v4/   BatchDistributeHook adapter (ABI + bytecode, CREATE2 address mining + deploy, admin, distribute, PoolId, UniswapV4Adapter)
src/pancakeswap/  BatchDistributeHook adapter (ABI + bytecode, deploy, admin, distribute, PoolId helpers)
src/sushiswap/    launchpad adapter (sushi-labs/sushiswap#2324)
src/balancer/     BatchDistributeHook adapter (ABI + bytecode, deploy, admin, distribute, Balancer v3 constants)
contracts/        Solidity reference sources (ISpraay, BatchDistributeHook)
```

ESM and CJS builds are included, with types for both. `viem ^2` is a peer dependency.

## Development

```sh
npm install
npm test            # unit tests against an in-memory JSON-RPC mock (real viem encoding)
npm run typecheck
npm run build

# Optional live-chain checks, read-only:
BSC_RPC_URL=https://bsc-dataseed.bnbchain.org BASE_RPC_URL=https://mainnet.base.org npm run test:fork
# add BSC_HOOK_ADDRESS / BASE_HOOK_ADDRESS to also check a deployed hook
```

## License

MIT © [plagtech](https://github.com/plagtech)
