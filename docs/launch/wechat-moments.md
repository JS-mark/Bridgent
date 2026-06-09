# 微信朋友圈 — Bridgent AI

> **渠道**: 微信朋友圈
> **形式**: 熟人网络,语气要更像真实项目进展,少一点营销腔。
> **时机**: 工作日 11:30–13:00 或 20:00–22:30。

---

## Variant A — 项目发布

```
最近把一个开源项目 Bridgent AI 发到了 v0.2.3。

它做的事很简单:把已有 OpenAPI、Prisma schema、Drizzle tables、Zod 函数转换成 MCP tools,让 Claude Code / Cursor / Codex / Gemini CLI 这类 AI coding agent 能安全调用你的 API 和数据库。

数据库默认只读;写操作需要 preview token 和 audit log。这个版本补了 JSONL audit 和幂等重试保护。

文档:https://js-mark.com/Bridgent/
GitHub:https://github.com/js-mark/bridgent

如果你们团队也在接 MCP / AI agent,欢迎给我提场景。
```

## Variant B — 问题驱动

```
最近做 Bridgent AI 时越来越确定一个判断:

AI agent 接内部系统最大的障碍不是模型能力,而是工程接入成本。很多团队明明有 OpenAPI、Prisma、Drizzle,但不可能为了每个系统都重写一遍 MCP server。

所以我做了一个 schema -> MCP 的桥:
OpenAPI / Prisma / Drizzle / Zod 直接变 tools。

项目还在 alpha,但主要路径已经跑通:
https://js-mark.com/Bridgent/
```

## Variant C — 征集反馈

```
我在做一个开源 MCP 工具 Bridgent AI。

现在已经支持:
- OpenAPI -> MCP tools
- Prisma -> 只读查询 + 审计写操作
- Drizzle -> 只读查询
- Zod 函数 -> 自定义 tools

接下来在纠结优先做 tRPC、GraphQL,还是更完整的 Prisma 写入体验。

如果你正在用 Claude Code / Cursor / Codex / Gemini CLI,你最想让 AI agent 看到哪类内部数据?
```

## 配图建议

- 发 Variant A 时配 logo lockup。
- 发 Variant B 时配架构图。
- 发 Variant C 时可以不配图,更像真实征集反馈。

## Notes

- 朋友圈链接容易被折叠,正文第一屏先讲清楚项目价值。
- 不要连续多天发硬广;可以隔几天换成技术复盘。
