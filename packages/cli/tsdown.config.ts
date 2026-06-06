import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: { cli: './src/cli.ts' },
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  clean: true,
  sourcemap: true,
  shims: false,
  outputOptions: {
    banner: '#!/usr/bin/env node',
  },
  deps: {
    neverBundle: [
      '@bridgent/core',
      '@modelcontextprotocol/sdk',
      /^@modelcontextprotocol\/sdk\/.*/,
      'zod',
      'citty',
      'consola',
    ],
  },
})
