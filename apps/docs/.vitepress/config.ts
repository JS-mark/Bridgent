// apps/docs/.vitepress/config.ts
import { defineConfig } from 'vitepress'
import { en } from './locales/en'
import { shared } from './locales/shared'
import { zh } from './locales/zh'

export default defineConfig({
  ...shared,
  themeConfig: {
    ...shared.themeConfig,
  },
  locales: {
    root: { label: 'English', lang: 'en-US', ...en },
    zh: { label: '简体中文', lang: 'zh-CN', ...zh },
  },
})
