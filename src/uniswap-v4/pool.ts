import { type Address, type Hex, encodeAbiParameters, keccak256 } from 'viem'

/** Uniswap V4 `PoolKey` */
export interface PoolKey {
  /** Lower-sorted currency; the zero address for the native currency */
  currency0: Address
  currency1: Address
  /** LP fee in hundredths of a bip, or 0x800000 for a dynamic fee */
  fee: number
  tickSpacing: number
  hooks: Address
}

/** `PoolIdLibrary.toId`: keccak256 of the ABI-encoded PoolKey */
export function getPoolId(key: PoolKey): Hex {
  if (!Number.isInteger(key.tickSpacing) || key.tickSpacing < 1 || key.tickSpacing > 32_767) {
    throw new RangeError(`Invalid tickSpacing: ${key.tickSpacing}`)
  }
  if (!Number.isInteger(key.fee) || key.fee < 0 || key.fee >= 2 ** 24) {
    throw new RangeError(`Invalid fee: ${key.fee}`)
  }
  return keccak256(
    encodeAbiParameters(
      [{ type: 'address' }, { type: 'address' }, { type: 'uint24' }, { type: 'int24' }, { type: 'address' }],
      [key.currency0, key.currency1, key.fee, key.tickSpacing, key.hooks],
    ),
  )
}
