// apps/docs/.vitepress/locales/shared.ts
import type { DefaultTheme, UserConfig } from 'vitepress'

export const shared = {
  title: 'Bridgent AI',
  titleTemplate: ':title — Bridgent AI',
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/js-mark/bridgent' },
    ],
  },
} satisfies UserConfig<DefaultTheme.Config>
