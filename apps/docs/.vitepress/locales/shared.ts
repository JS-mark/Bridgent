// apps/docs/.vitepress/locales/shared.ts
import type { UserConfig } from 'vitepress'

export const shared: Pick<
  UserConfig,
  'title' | 'titleTemplate' | 'cleanUrls' | 'lastUpdated'
> & { themeConfig: { socialLinks: { icon: string, link: string }[] } } = {
  title: 'Bridgent AI',
  titleTemplate: ':title — Bridgent AI',
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/js-mark/bridgent' },
    ],
  },
}
