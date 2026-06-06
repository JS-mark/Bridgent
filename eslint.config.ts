import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  typescript: true,
  vue: true,
  markdown: true,
  ignores: [
    '**/dist/**',
    '**/.vitepress/dist/**',
    '**/.vitepress/cache/**',
    '**/node_modules/**',
    '**/coverage/**',
    'pnpm-lock.yaml',
  ],
})
