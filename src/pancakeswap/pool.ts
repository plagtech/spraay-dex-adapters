import { type Address, type Hex, encodeAbiParameters, keccak256, numberToHex } from 'viem'
import { BATCH_DISTRIBUTE_HOOK_BITMAP, CL_TICK_SPACING_OFFSET } from './constants'

/** PancakeSwap Infinity `PoolKey` */
export interface PoolKey {
  currency0: Address
  currency1: Address
  hooks: Address
  poolManager: Address
  /** LP fee in hundredths of a bip, or 0x800000 for a dynamic fee */
  fee: number
  /** Hook registration bitmap + pool-type parameters (tickSpacing for CL) */
  parameters: Hex
}

/** Builds `PoolKey.parameters` for a CL pool that uses BatchDistributeHook */
export function encodeCLPoolParameters(tickSpacing: number, hooksBitmap: number = BATCH_DISTRIBUTE_HOOK_BITMAP): Hex {
  if (!Number.isInteger(tickSpacing) || tickSpacing < 1 || tickSpacing >= 2 ** 23) {
    throw new RangeError(`Invalid tickSpacing: ${tickSpacing}`)
  }
  if (!Number.isInteger(hooksBitmap) || hooksBitmap < 0 || hooksBitmap >= 2 ** 16) {
    throw new RangeError(`Invalid hooks bitmap: ${hooksBitmap}`)
  }
  return numberToHex((BigInt(tickSpacing) << BigInt(CL_TICK_SPACING_OFFSET)) | BigInt(hooksBitmap), { size: 32 })
}

/** `PoolIdLibrary.toId`: keccak256 of the ABI-encoded PoolKey */
export function getPoolId(key: PoolKey): Hex {
  return keccak256(
    encodeAbiParameters(
      [
        { type: 'address' },
        { type: 'address' },
        { type: 'address' },
        { type: 'address' },
        { type: 'uint24' },
        { type: 'bytes32' },
      ],
      [key.currency0, key.currency1, key.hooks, key.poolManager, key.fee, key.parameters],
    ),
  )
}
