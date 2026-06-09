# 微博头条文章 — Bridgent AI

> **链接**: <https://card.weibo.com/article/>
> **形式**: 比短微博更完整,但比知乎/掘金更轻。
> **时机**: 工作日 19:00–22:00。

---

## 标题候选

- 我做了一个开源工具:一行命令把已有 API/数据库暴露给 AI Agent
- Bridgent AI:让 Claude Code / Cursor 直接调用你的 OpenAPI 和 Prisma
- 写 MCP Server 太麻烦? 试试直接复用已有 schema

## 正文

```markdown
最近做了一个开源项目 Bridgent AI。

它解决的是一个很具体的问题:AI coding agent 越来越强,Claude Code、Cursor、Codex、
Gemini CLI 都支持 MCP,但很多团队的内部 API 和数据库仍然没有接进去。

不是因为没有价值,而是因为成本太高:

- 要学 MCP SDK
- 要手写 JSON schema
- 要处理 auth
- 要选 stdio / HTTP transport
- 要处理超时、错误、序列化
- 数据库还要考虑权限和误操作

Bridgent AI 的思路是:不要重新描述系统,直接复用你已经有的 schema。

现在支持四种 source:

1. OpenAPI 3.x:每个 operation 生成一个 MCP tool
2. Prisma 6.x:默认生成只读查询工具,写操作需要显式开启
3. Drizzle tables:生成只读 findMany 工具
4. Zod functions:手写函数直接变 typed MCP tool

同一套 tools 可以跑三种 transport:

- stdio:本地 IDE agent
- Streamable HTTP:共享 server / 远端调试
- Web Standard handler:Cloudflare Workers / Deno / Bun / Vercel Edge

我特别关注数据库安全。Prisma source 默认只读,有查询条数限制、query timeout,
raw SQL 不暴露。写操作需要 allowlist、preview token 和 audit log。v0.2.3 还补了
本地 JSONL audit helper 和同进程 idempotency key,降低宿主重试造成重复写入的风险。

这是 v0.2.3 发包后的发布草稿。项目还在 alpha,但已经能跑 OpenAPI、Prisma、Drizzle、
Zod 和 stdio/HTTP/Web handler 示例。

GitHub:
https://github.com/js-mark/bridgent

文档:
https://js-mark.com/Bridgent/

接下来会继续看 tRPC / GraphQL、更完整的 Prisma 写入辅助能力和 Inspector 体验。
如果你也在接 AI agent,欢迎聊聊你最想让 agent 看见哪份内部数据。
```

## 配图建议

- 首图:Bridgent AI logo lockup
- 第二张:source -> Bridgent -> MCP hosts 架构图
- 第三张:Prisma 最小代码示例

## Notes

- 微博头条文章可以比短微博多讲一点背景,但不要像知乎一样展开太深。
- 标题避免"震惊/颠覆"这类表达,保持工程师语气。
