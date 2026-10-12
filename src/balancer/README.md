# Balancer v3 adapter

Push-model batch distribution for Balancer v3 pools via a hook contract that routes
distributions through [Spraay Protocol](https://spraay.io).

## Architecture

### Hook contract (`BatchDistributeHook`)

A Balancer v3 hook (`BaseHooks + VaultGuard + Ownable2Step + ReentrancyGuard`) that:

1. **Registers pools** via `onRegister` — any pool that specifies this hook at creation is
   automatically tracked, so every distribution is attributable to a real Balancer v3 pool.
2. **Operator-gated distribution** — `batchDistribute()` and `batchDistributeEqual()` let
   whitelisted operators push tokens to up to 200 recipients in a single transaction.
3. **Non-custodial funding** — the hook never holds funds between calls. Each distribution
   pulls exactly `amount + Spraay fee` from the operator, approves Spraay, and calls it in
   the same transaction. Excess native currency is refunded.
4. **Pool attribution** — emits `BatchDistributed(pool, operator, token, ...)` keyed by the
   Balancer pool address, so indexers can pair push-side incentives with the pool's swap fees
   and gauge rewards.

### SDK adapter

This module exports the same interface as the other adapters (`distribute`, `distributeEqual`,
`distributeNative`, `estimateCost`) plus Balancer-specific helpers:

- `deployBatchDistributeHook()` — deploy the hook on any supported chain
- `setOperator()` / `getHookInfo()` / `isRegisteredPool()` — admin and read functions
- `BALANCER_V3` — deterministic Vault address (`0xbA1333333333a1BA1108E8412f11850A5C319bA9`)

## Supported chains

| Chain | Chain ID | Spraay | Balancer v3 | Status |
|-------|----------|--------|-------------|--------|
| Base  | 8453     | Yes    | Yes         | Supported |
| BNB Chain | 56   | Yes    | No          | Not supported |

## Key differences from PancakeSwap adapter

| Aspect | PancakeSwap Infinity | Balancer v3 |
|--------|---------------------|-------------|
| Pool ID | `bytes32` (keccak256 of PoolKey) | Pool contract `address` |
| Hook base | `CLBaseHook` | `BaseHooks + VaultGuard` |
| Registration | `afterInitialize` callback | `onRegister` callback |
| Constructor | `ICLPoolManager _poolManager` | `IVault _vault` |
| Hook flags | Bitmap (`uint16`) | `HookFlags` struct (10 bools) |
| Vault address | Varies by chain | Deterministic, same on all chains |

## Usage

```ts
import { distribute, deployBatchDistributeHook } from '@spraay/dex-adapters/balancer'

// Deploy the hook (once)
const { address: hook } = await deployBatchDistributeHook({
  chain: base,
  walletClient,
  operator: '0x...', // initial operator
})

// Distribute tokens (operator only, pool must be registered)
const result = await distribute({
  chain: base,
  walletClient,
  hook,
  pool: '0x...', // Balancer v3 pool address
  token: '0x...', // ERC-20 address
  recipients: ['0x...', '0x...'],
  amounts: [1000000n, 2000000n],
})
```

## Contract source

[`contracts/balancer/BatchDistributeHook.sol`](../../contracts/balancer/BatchDistributeHook.sol)
