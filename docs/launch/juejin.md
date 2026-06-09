# 掘金 — Bridgent AI

> **链接**: <https://juejin.cn/editor/drafts/new>
> **形式**: 技术长文,代码和架构细节要比朋友圈/小红书更实。
> **时机**: 工作日 10:00–11:30 或 20:00–22:00。

---

## 标题候选

- 我做了一个 TypeScript 开源工具:一行命令把已有 API/数据库暴露为 MCP Server
- MCP Server 写起来太麻烦? 我把 OpenAPI、Prisma、Drizzle、Zod 都接进来了
- Bridgent AI:把现有 schema 直接变成 Claude Code / Cursor 可用的 MCP 工具

推荐第一个。掘金读者更吃"我做了什么 + 技术栈 + 解决什么问题"。

## 正文

```markdown
最近在做一个开源项目:Bridgent AI。

它解决的问题很直接:很多团队已经有 OpenAPI 文档、Prisma schema、Drizzle tables
和一堆 typed function,但 AI coding agent 仍然看不到这些内部能力。原因不是没有价值,
而是每个团队都要重新写 MCP server、JSON schema、transport、auth、错误处理和超时。

Bridgent AI 的思路是复用已有 schema,把它们转换成 MCP tools:

- `fromOpenApi({ spec })`:OpenAPI 3.x operation -> MCP tool
- `fromPrisma({ client })`:Prisma model -> 只读查询工具;需要时可显式开启审计写操作
- `fromDrizzle({ db, tables })`:Drizzle table -> 只读 `findMany`
- `defineTool({ inputSchema, run })`:手写 Zod 函数 -> typed MCP tool

## 最小例子

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

这之后同一套 tools 可以跑在三种 transport 上:

- stdio:本地 Claude Code / Cursor / Codex / Gemini CLI
- Streamable HTTP:共享 server 或远端调试
- Web Standard handler:Cloudflare Workers / Deno / Bun / Vercel Edge

## 为什么不直接让 agent 访问数据库?

数据库暴露给 agent 最大的问题不是"能不能查",而是默认边界。

Bridgent AI 在 Prisma source 里做了几层限制:

1. 只读默认开启,写操作默认关闭。
2. `findMany.take` 有上限,避免一次拉爆上下文。
3. 查询有 timeout,不会把 MCP server 拖死。
4. Bytes 字段默认不暴露,避免把大块二进制塞给 LLM。
5. raw SQL 永久不暴露。
6. 写操作必须显式 allowlist,先 dry-run 拿 preview token,commit 时重复相同参数。
7. v0.2.3 增加 JSONL audit helper 和同进程 `idempotencyKey`,降低宿主重试造成重复写入的风险。

## 当前状态

这是 v0.2.3 发包后的发布草稿。当前已覆盖:

- OpenAPI 3.x
- Prisma 6.x read tools + audited writes
- Drizzle read-only tools
- Zod custom tools
- stdio / Streamable HTTP / Web Standard handler

tRPC 和 GraphQL 还在 roadmap。

GitHub: https://github.com/js-mark/bridgent
文档: https://js-mark.com/Bridgent/

如果你在团队里接过 MCP,你最希望它先支持哪种 source: tRPC、GraphQL,还是别的内部系统?
```

## 标签

`MCP` `AI Agent` `TypeScript` `Node.js` `开源`

## Notes

- 掘金正文可以附一张 logo lockup 和一张 source -> MCP 的架构图。
- 评论区优先回复"和 LangChain / Dify / FastMCP 有什么区别"这类问题。
