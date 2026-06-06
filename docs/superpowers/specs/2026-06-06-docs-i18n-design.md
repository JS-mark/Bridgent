# apps/docs 中英双语化设计

- 日期:2026-06-06
- 范围:`apps/docs`(VitePress 站点)
- 目标:同步交付英文(默认)+ 简体中文双语版本
- 不在范围:站内搜索 i18n、hreflang、自动语言检测重定向、繁体中文、第三种语言、LLM 翻译流水线

## 1. 背景与目标

`apps/docs` 当前为单语(英文)VitePress 站点,共 1 个 home + 7 篇 guide(其中 4 篇在 `guide/hosts/`),配置约 60 行。需要在不破坏现有英文 URL 的前提下加入简体中文版本,使中英内容一一对应、UI 文案本地化、构建链路保持绿色。

## 2. 关键决策

| 决策 | 选项 | 结论 | 依据 |
| --- | --- | --- | --- |
| 默认语言 | 英文 / 中文 / 双前缀 | **英文为默认(根路径),中文走 `/zh/`** | 不破坏现有英文链接;面向全球开源生态;SEO 一致 |
| 顶部 nav GitHub 入口 | 保留 / 移除 | **移除文字入口,只保留 socialLinks 图标** | 文字+图标重复占位,移除后 nav 更紧凑(本期顺手修) |
| 实现方式 | VitePress 原生 `locales` / 第三方插件 / 双站 | **VitePress 原生 `locales` + 镜像目录** | 官方姿势、零额外依赖、URL 友好、UI 自动本地化 |
| 内容范围 | 仅架构 / 部分 / 全量 | **全量翻译 7 篇 guide + home** | 文档总量仅 549 行,一次到位避免漂移 |
| 配置组织 | 集中 config / 拆分 locales | **拆分 `locales/{en,zh,shared}.ts`** | 主 config 退化为装配胶水,新增语言只增文件 |

## 3. 目录结构

```
apps/docs/
├── index.md                       # 英文 home(保留)
├── guide/                         # 英文 guide(保留)
│   ├── what-is-bridgent.md
│   ├── getting-started.md
│   ├── from-openapi.md
│   ├── from-prisma.md
│   ├── transports.md
│   ├── inspect.md
│   └── hosts/
│       ├── claude-code.md
│       ├── cursor.md
│       ├── codex.md
│       └── gemini-cli.md
├── zh/                            # 新增:中文镜像
│   ├── index.md
│   └── guide/
│       ├── what-is-bridgent.md
│       ├── getting-started.md
│       ├── from-openapi.md
│       ├── from-prisma.md
│       ├── transports.md
│       ├── inspect.md
│       └── hosts/
│           ├── claude-code.md
│           ├── cursor.md
│           ├── codex.md
│           └── gemini-cli.md
└── .vitepress/
    ├── config.ts                  # 装配胶水(约 30 行)
    └── locales/                   # 新增
        ├── shared.ts              # 跨语言共享配置
        ├── en.ts                  # root locale(英文)
        └── zh.ts                  # zh locale(中文)
```

## 4. VitePress 配置改造

### 4.1 `.vitepress/config.ts`(改写后)

```ts
import { defineConfig } from 'vitepress'
import { en } from './locales/en'
import { zh } from './locales/zh'
import { shared } from './locales/shared'

export default defineConfig({
  ...shared,
  locales: {
    root: { label: 'English', lang: 'en-US', ...en },
    zh:   { label: '简体中文', lang: 'zh-CN', ...zh },
  },
})
```

### 4.2 `locales/shared.ts`

跨语言共享:`title: 'Bridgent AI'`、`titleTemplate: ':title — Bridgent AI'`、`cleanUrls: true`、`lastUpdated: true`、`themeConfig.socialLinks`(GitHub 链接)。

### 4.3 `locales/en.ts`

- `description`(英文,沿用当前)
- `themeConfig.nav`:仅 `Guide`(原来的 `GitHub` 文字入口移除,与 `socialLinks` 中的 GitHub 图标重复)
- `themeConfig.sidebar['/guide/']`:沿用当前 4 个分组(Introduction / Sources / Transports & Tooling / Hosts)
- `themeConfig.footer`:沿用当前 MIT + Copyright 文案
- sidebar `link` 字段写裸路径(如 `/guide/getting-started`),VitePress 按 locale 自动解析

### 4.4 `locales/zh.ts`

镜像 `en.ts` 结构,本地化字段:

- `description`:中文站点描述
- `nav`:`[{ text: '指南', link: '/guide/what-is-bridgent' }]`(同样不放 GitHub 文字入口)
- `sidebar['/guide/']`:分组标题翻译为 `引言` / `数据源` / `传输与工具` / `宿主`,条目 `text` 翻译,`link` 与英文一致
- `footer`:`message: '基于 MIT 协议发布。'`、`copyright: '版权所有 © 2026 Bridgent AI 贡献者'`
- 本地化 UI 文案:
  - `outlineTitle: '本页内容'`
  - `docFooter: { prev: '上一页', next: '下一页' }`
  - `lastUpdatedText: '最后更新于'`
  - `darkModeSwitchLabel: '主题'`
  - `lightModeSwitchTitle: '切换至浅色模式'`
  - `darkModeSwitchTitle: '切换至深色模式'`
  - `langMenuLabel: '切换语言'`
  - `returnToTopLabel: '回到顶部'`
  - `sidebarMenuLabel: '菜单'`
  - `externalLinkIcon: true`

VitePress 自动渲染右上角语言切换器(两个 locale 的 `label` 决定菜单文案)。无需自定义 Vue 组件。

## 5. 内容翻译规范

### 5.1 结构对齐

- 中文版 markdown 与英文版**一一对应**:文件名、`#` 标题层级、代码块语言标签、frontmatter 字段(`layout`、`hero.actions[].link` 等)保持一致
- 中文 locale 下所有内部 `link`(`themeConfig.nav`、`themeConfig.sidebar[*].items[*].link`、frontmatter `actions[].link`、markdown 内相对链接)**必须写完整 `/zh/` 前缀**(如 `/zh/guide/getting-started`)。VitePress **不会**自动按 locale 解析裸路径;裸路径会跳出 locale 落到英文页
- 锚点由 VitePress 从标题文本自动派生,中文版的锚点是中文 slug,英文版的锚点是英文 slug。**不**强行保持英文锚点;跨语言深链接本就不通用,以本地语言锚点为准
- 文档之间的相对链接(若有)写裸路径,由 VitePress 解析

### 5.2 不译内容

命令、代码块、CLI 输出、产品/工具名:`bridgent`、`@bridgent/core`、`@bridgent/cli`、`pnpm`、`Node`、`Claude Code`、`Cursor`、`OpenAI Codex CLI`、`Gemini CLI`、`MCP`、`OpenAPI`、`Prisma`、`Drizzle`、`tRPC`、`Zod`、`stdio`、`SSE`、`HTTP`、文件路径与包名、URL。

### 5.3 要译内容

正文段落、列表自然语言项、表格表头/单元格自然语言、admonition 块(`::: tip` 等)中的标题与正文、按钮 `text`、`hero.text` 与 `hero.tagline`、`features[].title/details`。

`hero.name: Bridgent AI` 保留(产品名)。

### 5.4 术语表

| 英文 | 中文 |
| --- | --- |
| source adapter | 数据源适配器 |
| tool | 工具(MCP 工具) |
| transport | 传输层 |
| host | 宿主(IDE/CLI 客户端) |
| production-ready | 生产可用 |
| inspect | 探查 |
| read-only mode | 只读模式 |
| row limits | 行数限制 |
| query timeouts | 查询超时 |
| policy DSL | 策略 DSL |
| schema | 模式 / Schema(在涉及 SQL/Zod 时保留 Schema) |
| getting started | 快速开始 |

## 6. SEO 与 `<html lang>`

- VitePress 按每个 locale 的 `lang` 字段自动设置 `<html lang="en-US">` / `<html lang="zh-CN">`
- 本期**不**配置 hreflang/canonical:需要绝对域名,等部署域定下来后再补
- 本期**不**启用站内搜索(尚未启用);后续若启用 Algolia/local search,需在两个 locale 下分别配置

## 7. 验证策略

1. `pnpm --filter @bridgent/docs dev` 启动:
   - 访问 `/`、`/guide/getting-started` → 英文站正常
   - 访问 `/zh/`、`/zh/guide/getting-started` → 中文站正常,UI 文案中文
   - 右上角语言切换器存在,`English` ↔ `简体中文` 互跳;由于中英文采用镜像目录,VitePress 切换语言时应自动落在等价路径(`/guide/x` ↔ `/zh/guide/x`)。若实际行为是落在 locale 根(`/` 或 `/zh/`),记录为已知行为不视为缺陷
2. `pnpm turbo run build` 全绿:无死链(VitePress build 会在死链上失败)
3. `pnpm turbo run typecheck` 全绿:`locales/*.ts` 通过 `defineConfig` 类型校验
4. `pnpm turbo run lint` 全绿:antfu eslint 不报错
5. 抽查 sidebar:在英文页面看到的分组数与条目数,在中文页面完全一致(只是文案译过)

## 8. 风险与缓解

| 风险 | 缓解 |
| --- | --- |
| 中英文档将来漂移 | 文件名 + 标题层级强一致;PR review 时若改了一边必须同步另一边(后续可加 lint 脚本,本期不做) |
| sidebar `link` 缺前缀导致点击跳到英文页 | 中文 locale 下所有内部 `link` 必须写 `/zh/` 完整前缀;VitePress 不会自动 prefix |
| frontmatter 中 `actions[].link` 易遗忘前缀 | 同上:`/zh/index.md` 的 `actions[].link` 必须写 `/zh/guide/...`;`grep -n '"link":\s*"/guide/' apps/docs/zh` 应当返回空 |
| 翻译术语不一致 | 第 5.4 节术语表为约束 |

## 9. 交付物清单

- 修改:`apps/docs/.vitepress/config.ts`
- 新增:`apps/docs/.vitepress/locales/{shared,en,zh}.ts`
- 新增:`apps/docs/zh/index.md` + `apps/docs/zh/guide/**/*.md`(共 8 个新 markdown 文件:1 home + 7 guide)
- 不修改:任何英文 markdown 内容(仅可能因 VitePress locales 引入而需要保持当前路径不变)
- 验证:本地 `dev` 截图/手测 + `pnpm turbo run build typecheck lint` 通过
