# V2EX — Bridgent AI

> **节点**: 推荐 `创意工坊` (Show creations) 或 `Open Source`
> **链接**: <https://www.v2ex.com/new>
> **时机**: 工作日 10:00–12:00 或 20:00–22:00（北京时间）

---

## 标题（≤ 60 字符）

```
[Show V2EX] Bridgent AI — 一行命令把已有 API/数据库暴露为 MCP Server
```

## 正文

```
最近做了一个开源项目想分享一下：Bridgent AI（https://github.com/js-mark/bridgent）。

## 它解决什么

MCP（Model Context Protocol）已经在 Claude Code / Cursor / Codex /
Gemini CLI 里全面落地，但写一个真正能用的 MCP server 仍然要学 SDK、
手写 JSON schema、串 auth、选 transport——大部分团队权衡之下就放弃了。
结果是：你有现成的 OpenAPI / Prisma / 内部 API，但 AI agent 看不到。

Bridgent AI 直接复用你已经有的 schema：

• `fromOpenApi(spec)` —— 任何 OpenAPI 3.x 一行变 MCP server
• `fromPrisma({ client })` —— Prisma schema 自动生成只读 5 件套
   （findUnique / findFirst / findMany / count / aggregate）
   带 LIMIT 注入、query timeout、Bytes 字段隐藏，raw SQL 永久禁用
• `defineTool({ inputSchema, run })` —— 手写 Zod 函数也能直接当工具

## 30 秒体验

  import { createStdioServer } from '@bridgent/core'
  import { fromPrisma } from '@bridgent/source-prisma'
  import { PrismaClient } from '@prisma/client'

  await createStdioServer({
    name: 'demo',
    version: '0.1.0',
    tools: await fromPrisma({
      client: new PrismaClient(),
      namespace: 'db_',
    }),
  })

然后 `bridgent dev ./server.ts` 就完事了，Claude Code 里立刻能用。

## 其他特性

• 三种 transport：stdio / Streamable HTTP / Web Standard fetch handler
  （可直接跑在 Cloudflare Workers / Deno / Bun / Vercel Edge 上）
• 协议层 harness 用官方 MCP SDK Client 自动回归
• 仓库里 5 个 example，包括把 GitHub REST API 子集（issues / pulls /
  releases）暴露给 LLM 的真实例子

## 现状

v0.1 alpha，已经发到 npm。下一阶段会加 Drizzle / tRPC / GraphQL 三种
source，以及 Prisma 写操作 + audit log。

GitHub: https://github.com/js-mark/bridgent
文档站: https://bridgent.ai

最好奇的问题：你最希望 AI agent 能看到哪份你内部的 API 或数据库？
```

## Tags

`AI` `MCP` `开源` `Claude` `Cursor`

## Notes

- V2EX 节点不要选错，「程序员」节点会被认为是水帖；`创意工坊` 或 `Open Source` 更合适
- 不要在评论里继续刷自家链接，V2EX 用户对此非常敏感
