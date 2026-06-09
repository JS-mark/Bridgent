// apps/docs/.vitepress/locales/en.ts
import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'

export const en: LocaleSpecificConfig<DefaultTheme.Config> = {
  description:
    'Bridgent AI — expose any existing API, database, or code as a production-ready MCP server in one line.',
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/what-is-bridgent' },
      { text: 'Changelog', link: '/changelog' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is Bridgent?', link: '/guide/what-is-bridgent' },
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Brand Assets', link: '/guide/brand-assets' },
          ],
        },
        {
          text: 'Sources',
          items: [
            { text: 'Overview', link: '/guide/sources-overview' },
            { text: 'From Zod', link: '/guide/from-zod' },
            { text: 'From OpenAPI', link: '/guide/from-openapi' },
            { text: 'From Prisma', link: '/guide/from-prisma' },
            { text: 'From Drizzle', link: '/guide/from-drizzle' },
          ],
        },
        {
          text: 'Transports & Tooling',
          items: [
            { text: 'Transports', link: '/guide/transports' },
            { text: 'CLI', link: '/guide/cli' },
            { text: 'Inspect', link: '/guide/inspect' },
          ],
        },
        {
          text: 'Hosts',
          items: [
            { text: 'Claude Code', link: '/guide/hosts/claude-code' },
            { text: 'Cursor', link: '/guide/hosts/cursor' },
            { text: 'OpenAI Codex CLI', link: '/guide/hosts/codex' },
            { text: 'Gemini CLI', link: '/guide/hosts/gemini-cli' },
          ],
        },
      ],
    },
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Bridgent AI contributors',
    },
  },
}
