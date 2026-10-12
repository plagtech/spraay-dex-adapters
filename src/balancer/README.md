# Balancer adapter (planned)

Status: **scaffold only.** `distribute`, `distributeEqual`, `distributeNative` and `estimateCost` are exported with the shared adapter signatures and throw `SpraayError` with code `NOT_IMPLEMENTED`. Until this ships, use `@spraay/dex-adapters/generic`, which calls Spraay directly on any supported chain.

## Planned approach

Balancer v3 has a hooks system similar to PancakeSwap Infinity's: a pool registers one hooks contract with the Vault at creation, and the hook declares which callbacks it uses through `getHookFlags()`. The plan mirrors `BatchDistributeHook`:

1. **Balancer v3 hook contract.** Implement `IHooks` / `BaseHooks` with `onRegister` recording the pools that use the hook, the same way `afterInitialize` registers Infinity pools. Swap and liquidity callbacks stay disabled so pool operations cost no extra gas.
2. **Operator-gated batch distribution.** Same non-custodial funding as the PancakeSwap hook: pull exactly `amount + Spraay fee` from the operator, approve Spraay for exactly that amount, call `sprayToken` / `sprayETH` / `sprayEqual`, refund excess native currency, and enforce the 200-recipient limit.
3. **Pool attribution.** Emit a `BatchDistributed(pool, operator, token, ...)` event keyed by the Balancer pool address, so indexers can pair push-side incentives with the pool's swap fees and other reward flows.
4. **SDK adapter.** Fill in this module with the shared interface plus Balancer-specific helpers: `deployHook()`, `setOperator()`, and a helper to pass the hook address into Balancer's pool factory `create(...)` call.

## Open questions

- Which chains to target first. Spraay is on Base and BNB Chain; Balancer v3 is on Base but not BNB Chain.
- Whether to register through Balancer's pool factories or support existing pools without a hook, through a plain Spraay call attributed by pool address in calldata.
