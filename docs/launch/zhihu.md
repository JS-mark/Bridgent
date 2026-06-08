# 知乎 — Bridgent AI

> **链接**: <https://zhuanlan.zhihu.com/write>（专栏文章）；问答可挂在
> "如何评价 MCP" 或 "Claude Code 用什么工具" 类问题下。
> **形式**: 长文 + 代码块；知乎读者吃技术深度。

---

## 标题候选

- 一行命令把任意 API / 数据库暴露给 AI Agent —— Bridgent AI 是怎么做的
- 让 Claude Code 看见你的 Prisma 数据库：Bridgent AI 实战
- 写一个 MCP server 太麻烦了？我做了 Bridgent AI

推荐第一个，最有信息量。

## 正文（800-1500 字范围）

```markdown
## 起因

最近一段时间，MCP（Model Context Protocol）已经在 Claude Code、Cursor、
OpenAI Codex CLI、Gemini CLI 几个主流 IDE-Agent 宿主里全面落地。理论上你
可以让 LLM 直接帮你查内部数据库、调内部 API。

但实际操作起来，写一个 MCP server 的成本不低：

- 学官方 SDK
- 手写每个工具的 JSON schema
- 串各种认证（Bearer / API Key / OAuth2）
- 选 stdio / SSE / Streamable HTTP 中的某种 transport
- 处理错误、序列化、超时

绝大部分团队权衡过后选择放弃 —— 然后他们的内部数据就在 AI 的视野之外。

## 思路

Bridgent AI 的设计前提是「**复用你已经有的 schema**」。你不需要重新声明工具，
只需要告诉它你已经有的资源在哪：

| 你已经有的 | Bridgent AI 给你的 |
|---|---|
| OpenAPI 3.x spec | 每个 operation 一个 MCP tool，带 Bearer auth |
| Prisma schema | 每张表 5 个只读方法（findUnique / findFirst / findMany / count / aggregate） |
| Zod 函数 | 直接打包成 stdio MCP server |

## 30 秒上手（Prisma 数据库）

\`\`\`ts
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
\`\`\`

\`\`\`bash
bridgent dev ./server.ts
\`\`\`

把这段加到 `~/.claude.json` 的 `mcpServers` 里，重启 Claude Code 就能用了。

## 数据安全（这是我做这个的核心动机之一）

让 LLM 直接连数据库最大的风险是「一句话误删一张表」。Bridgent AI 在 source-prisma
里建立了三道护栏：

1. **LIMIT 注入** —— 默认 `findMany.take = 10000`，用户传更大值会被 hard-clamp
   并在响应里带 warning
2. **Query timeout** —— 每个 query 都有 soft timeout（默认 10 秒），超时返回
   `{ ok: false, error: { kind: 'timeout' } }` 而不是把 server 拖死
3. **Raw SQL 永久禁用** —— `findRaw` / `aggregateRaw` / `$queryRaw` 在当前版本中
   完全不会被暴露，没有逃生通道

写操作（create/update/delete/upsert）默认完全禁用，需要显式 `allow: { mutating: true }`
或 `allowOperations` 白名单才能解锁。

## 三种 transport，同一份工具

\`\`\`ts
// stdio：本地 IDE-Agent
createStdioServer({ tools })

// Streamable HTTP：共享 server / 远端调试
createHttpServer({ tools, port: 3333 })

// Web Standard fetch handler：Cloudflare Workers / Deno / Bun / Vercel Edge
createWebHandler({ tools })
// → handler.fetch(request) 直接返回 Response
\`\`\`

## 现状

v0.2.x alpha 已经发到 npm。仓库里的 example 覆盖：

- `01-zod-hello` —— 最小 hello world
- `02-openapi-petstore` —— 零 auth 的 OpenAPI 3.1
- `02-openapi-github` —— 真实 GitHub REST API 子集（带 PAT）
- `03-prisma-readonly` —— SQLite + Prisma 三表
- `03b-prisma-writes` —— Prisma 审计写操作 + preview token
- `04-http-server` / `05-web-handler` —— HTTP 与 Web Standard 演示

Drizzle 只读 source 已在包里发布,示例目录后续再补。

## 链接

- GitHub: https://github.com/js-mark/bridgent
- 文档站: https://js-mark.com/Bridgent/
- npm: https://www.npmjs.com/package/@bridgent/cli

## 我最好奇的问题

如果你团队里有一份内部 API 或数据库，你最希望 AI agent 能看到哪一块？欢迎在评论里
聊聊场景，我会拿来排下一阶段优先级（重点看 tRPC / GraphQL、Prisma 写入辅助能力、
Inspector 体验）。
```

## 知乎话题

- AI Agent
- 模型上下文协议（MCP）
- Claude
- 开源项目
- TypeScript

## Notes

- 知乎读者对「软文」非常敏感，必须给真实的代码片段、真实的安全分析（如三道护栏）
- 评论区有问必答，前 24 小时内回复每一条
- 配一两张架构图（4 个 host 同时连同一个 server）会显著提高赞数
