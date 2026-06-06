import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts'],
  format: ['esm'],
  dts: true,
  target: 'node22',
  platform: 'node',
  clean: true,
  sourcemap: true,
  deps: {
    neverBundle: [
      '@bridgent/core',
      '@prisma/client',
      /^@prisma\/client\/.*/,
      'zod',
    ],
  },
})
