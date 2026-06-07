// apps/docs/.vitepress/locales/zh.ts
import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'

export const zh: LocaleSpecificConfig<DefaultTheme.Config> = {
  description: 'Bridgent AI — 一行命令把任何现有 API、数据库或代码暴露为生产可用的 MCP 服务器。',
  themeConfig: {
    nav: [
      { text: '指南', link: '/zh/guide/what-is-bridgent' },
    ],
    sidebar: {
      '/zh/guide/': [
        {
          text: '引言',
          items: [
            { text: '什么是 Bridgent?', link: '/zh/guide/what-is-bridgent' },
            { text: '快速开始', link: '/zh/guide/getting-started' },
          ],
        },
        {
          text: '数据源',
          items: [
            { text: '总览', link: '/zh/guide/sources-overview' },
            { text: '从 Zod 接入', link: '/zh/guide/from-zod' },
            { text: '从 OpenAPI 接入', link: '/zh/guide/from-openapi' },
            { text: '从 Prisma 接入', link: '/zh/guide/from-prisma' },
            { text: '从 Drizzle 接入', link: '/zh/guide/from-drizzle' },
          ],
        },
        {
          text: '传输与工具',
          items: [
            { text: '传输层', link: '/zh/guide/transports' },
            { text: 'CLI', link: '/zh/guide/cli' },
            { text: '探查与调试', link: '/zh/guide/inspect' },
          ],
        },
        {
          text: '宿主',
          items: [
            { text: 'Claude Code', link: '/zh/guide/hosts/claude-code' },
            { text: 'Cursor', link: '/zh/guide/hosts/cursor' },
            { text: 'OpenAI Codex CLI', link: '/zh/guide/hosts/codex' },
            { text: 'Gemini CLI', link: '/zh/guide/hosts/gemini-cli' },
          ],
        },
      ],
    },
    outlineTitle: '本页内容',
    docFooter: { prev: '上一页', next: '下一页' },
    lastUpdatedText: '最后更新于',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换至浅色模式',
    darkModeSwitchTitle: '切换至深色模式',
    langMenuLabel: '切换语言',
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    externalLinkIcon: true,
    footer: {
      message: '基于 MIT 协议发布。',
      copyright: '版权所有 © 2026 Bridgent AI 贡献者',
    },
  },
}
