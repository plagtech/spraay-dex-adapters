import type { Hex } from 'viem'

/**
 * Pre-compiled bytecode for Balancer v3 BatchDistributeHook.
 *
 * Source: contracts/balancer/BatchDistributeHook.sol
 * Compiler: solc 0.8.26+commit.8a97fa7a, via-IR, optimizer 1000 runs, EVM cancun
 *
 * To recompile:
 *   1. Clone the companion repo with Foundry config pointing at Balancer v3 deps
 *   2. forge build --via-ir --optimizer-runs 1000
 *   3. Copy `out/BatchDistributeHook.sol/BatchDistributeHook.json` → `.bytecode.object`
 *
 * TODO: Replace with compiled bytecode from Foundry build.
 * The bytecode will be generated once the Balancer v3 hook is compiled in a Foundry
 * environment with the full dependency tree (OpenZeppelin, Balancer v3 interfaces/vault).
 */
export const batchDistributeHookBytecode: Hex = '0x' as Hex
