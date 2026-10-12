// Root entry: shared core exports, plus each adapter as a namespace (they share function names).
// Prefer the subpath imports (`@spraay/dex-adapters/pancakeswap`, ...) for smaller bundles.

export * from './core'
export * as generic from './generic'
export * as pancakeswap from './pancakeswap'
export * as sushiswap from './sushiswap'
export * as balancer from './balancer'
