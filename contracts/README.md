# Contracts

Reference Solidity sources. They are not compiled by this package: the SDK ships the ABIs in `src/` and the hooks' creation bytecode in `src/{pancakeswap,balancer,uniswap-v4}/bytecode.ts`.

| File | Source |
| --- | --- |
| `interfaces/ISpraay.sol` | Minimal interface for Spraay's `SprayContract` (`sprayETH`, `sprayToken`, `sprayEqual`, `Recipient[]` structs) |
| `pancakeswap/BatchDistributeHook.sol` | PancakeSwap Infinity CL hook that forwards operator-funded batches to Spraay |
| `pancakeswap/SpraayAddresses.sol` | Spraay deployments per chain, used by the hook's deploy script |
| `uniswap-v4/BatchDistributeHook.sol` | Uniswap V4 hook (OpenZeppelin `BaseHook`), same logic as the PancakeSwap hook |
| `uniswap-v4/SpraayAddresses.sol` | Spraay deployments on chains with a V4 PoolManager |

All three are copied unchanged from [plagtech/infinity-hooks](https://github.com/plagtech/infinity-hooks), branch `feat/batch-distribute-hook`, under `src/pool-cl/batch-distribute/`. Their import paths (`infinity-core/...`, `../CLBaseHook.sol`, `./interfaces/ISpraay.sol`) resolve inside that repository's layout and remappings, so compile and test them there with Foundry.

The bundled bytecode was compiled with solc 0.8.26, via-IR, optimizer at 1000 runs, EVM version `cancun`.

The `uniswap-v4/` sources are copied unchanged from [plagtech/spraay-uniswap-v4-hook](https://github.com/plagtech/spraay-uniswap-v4-hook) (`src/`); compile and test them there. Their bundled bytecode was compiled with solc 0.8.26, optimizer at 1000 runs, EVM version `cancun`, without via-IR.
