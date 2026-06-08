<p align="center">
  <img src="./assets/bridgent-logo-lockup.svg" alt="Bridgent AI logo" width="560" />
</p>

# Bridgent AI

> 一行命令把已有 API、数据库和代码暴露为生产可用的 MCP Server。

一行命令把已有的 OpenAPI / SQL Schema / Prisma / Drizzle / tRPC / Zod 暴露为 **MCP Server**，
让 Claude Code、Codex、Cursor、Gemini CLI 等任何 MCP 宿主即时可用。

[![npm](https://img.shields.io/npm/v/@bridgent/cli.svg)](https://www.npmjs.com/package/@bridgent/cli)
[![License](https://img.shields.io/npm/l/@bridgent/cli.svg)](./LICENSE)
[![Docs](https://img.shields.io/badge/docs-js--mark.com%2FBridgent-0aa)](https://js-mark.com/Bridgent/)

**官网**：[https://js-mark.com/Bridgent/](https://js-mark.com/Bridgent/)

**语言**：[English](./README.md) | **简体中文**

## 状态

🚧 **Alpha** —— 当前能力：

- **数据源**：手写 **Zod** 工具、**OpenAPI 3.x** 规范、**Prisma 6.x** schema（默认只读，可显式开启带审计写操作）、**Drizzle** 表（只读）
- **传输层**：**stdio**、**Streamable HTTP**，以及与运行时无关的 **Web Standard fetch handler**（Cloudflare / Deno / Bun）
- **CLI**：`bridgent init`、`bridgent dev`、`bridgent serve`、`bridgent inspect`
- **协议级测试覆盖的宿主**：Claude Code、Cursor、Codex、Gemini CLI（任何兼容 MCP 1.x 的客户端）

路线图：tRPC / GraphQL 数据源、更完整的 Prisma 写入辅助能力、改进的 inspector 体验、托管控制台。

## 快速开始

```bash
# 需要 Node >= 22.18
pnpm add -D @bridgent/cli @bridgent/core zod
bridgent init ./server.ts
```

```ts
// 或者自己写 server.ts：
import { createStdioServer, defineTool } from '@bridgent/core'
import { z } from 'zod'

await createStdioServer({
  name: 'hello',
  version: '0.0.1',
  tools: [
    defineTool({
      name: 'add',
      description: 'Add two numbers',
      inputSchema: z.object({ a: z.number(), b: z.number() }),
      run: ({ a, b }) => a + b,
    }),
  ],
})
```

```bash
bridgent dev ./server.ts
```

## 宿主

每个 IDE Agent 在文档中都有可直接复制的一段配置：

- [Claude Code](./apps/docs/guide/hosts/claude-code.md)
- [Cursor](./apps/docs/guide/hosts/cursor.md)
- [OpenAI Codex CLI](./apps/docs/guide/hosts/codex.md)
- [Gemini CLI](./apps/docs/guide/hosts/gemini-cli.md)

## 仓库结构

```
apps/docs              VitePress 站
packages/core          MCP runtime + Zod→tool 封装
packages/cli           bridgent CLI
examples/              使用示例
docs/                  AI 进度档案（开发文档，不发布）
```

主要规划入口为 [`docs/roadmap.md`](./docs/roadmap.md)，更早的提案与计划文件保留作为历史参考。

## 开发

```bash
pnpm install
pnpm turbo run build test typecheck lint
```

工具版本要求（`engines-strict=true`）：

- Node `>= 22.18`
- pnpm `>= 10`

## License

[MIT](./LICENSE)
