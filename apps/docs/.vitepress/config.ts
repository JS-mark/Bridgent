import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Bridgent AI',
  titleTemplate: ':title — Bridgent AI',
  description: 'Bridgent AI — expose any existing API, database, or code as a production-ready MCP server in one line.',
  cleanUrls: true,
  lastUpdated: true,

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/what-is-bridgent' },
      { text: 'GitHub', link: 'https://github.com/js-mark/bridgent' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is Bridgent?', link: '/guide/what-is-bridgent' },
            { text: 'Getting Started', link: '/guide/getting-started' },
          ],
        },
        {
          text: 'Sources',
          items: [
            { text: 'From OpenAPI', link: '/guide/from-openapi' },
            { text: 'From Prisma', link: '/guide/from-prisma' },
          ],
        },
        {
          text: 'Transports & Tooling',
          items: [
            { text: 'Transports', link: '/guide/transports' },
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

    socialLinks: [
      { icon: 'github', link: 'https://github.com/js-mark/bridgent' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Bridgent AI contributors',
    },
  },
})
