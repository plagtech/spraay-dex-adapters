import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'core/index': 'src/core/index.ts',
    'generic/index': 'src/generic/index.ts',
    'pancakeswap/index': 'src/pancakeswap/index.ts',
    'sushiswap/index': 'src/sushiswap/index.ts',
    'balancer/index': 'src/balancer/index.ts',
    'uniswap-v4/index': 'src/uniswap-v4/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: true,
  target: 'es2022',
  external: ['viem'],
})
