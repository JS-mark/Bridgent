// apps/docs/.vitepress/locales/shared.ts
import type { DefaultTheme, UserConfig } from 'vitepress'
import process from 'node:process'

// GitHub Pages project sites live at /<repo>/, so the build needs a non-root
// `base`. The CI workflow exports DOCS_BASE; for custom domains set DOCS_BASE=/
// (or leave it unset locally to keep dev/preview using `/`).
const base = process.env.DOCS_BASE ?? '/'

export const shared = {
  title: 'Bridgent AI',
  titleTemplate: ':title — Bridgent AI',
  base,
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/js-mark/bridgent' },
    ],
  },
} satisfies UserConfig<DefaultTheme.Config>
