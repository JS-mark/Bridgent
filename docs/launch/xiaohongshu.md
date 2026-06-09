# 小红书 — Bridgent AI

> **链接**: <https://www.xiaohongshu.com/>
> **形式**: 面向独立开发者、AI 工具玩家和前后端工程师的轻技术分享。
> **时机**: 工作日 12:00–13:30 或 20:00–23:00。

---

## 封面字

```
让 AI Agent 看见你的 API 和数据库
```

备选:

```
不用手写 MCP Server 了
```

```
OpenAPI / Prisma 一行变 MCP
```

## 标题候选

- 我做了个开源工具:让 Claude Code 直接看见你的 API 和数据库
- 写 MCP Server 太麻烦? 我把 OpenAPI / Prisma / Drizzle 接好了
- 给 AI Agent 接内部数据,终于不用从零手写 MCP 了

## 正文

```
最近做了一个开源项目:Bridgent AI。

一句话:把你已经有的 OpenAPI、Prisma schema、Drizzle tables、Zod 函数,
直接转换成 Claude Code / Cursor / Codex / Gemini CLI 能用的 MCP tools。

为什么做这个?

现在大家都在用 AI coding agent,但很多 agent 只能看代码,看不到你真实的内部 API
和数据库结构。真正要接进去的时候,又要手写 MCP server、JSON schema、auth、transport,
工程量一下就上来了。

Bridgent AI 的思路是:不要重复声明,直接复用已有 schema。

现在支持:

1. OpenAPI 3.x -> 每个 operation 变成 MCP tool
2. Prisma 6.x -> 默认只读查询工具
3. Drizzle tables -> 只读 findMany
4. Zod functions -> 手写函数直接变 typed tool

数据库这块默认是安全优先:

- 默认只读
- 限制查询条数
- query timeout
- raw SQL 不暴露
- 写操作必须显式打开,带 preview token 和 audit log
- v0.2.3 还补了 JSONL audit 和幂等重试保护

项目地址:
https://github.com/js-mark/bridgent

文档:
https://js-mark.com/Bridgent/

这是 v0.2.3 发包后的发布草稿。后续会继续看 tRPC / GraphQL / 更好的 Inspector。

如果你也在折腾 AI Agent,你最想让它先接入什么内部数据?
```

## 话题

`#AI工具` `#程序员` `#开源项目` `#ClaudeCode` `#MCP` `#独立开发`

## 配图建议

1. 首图:logo lockup + "APIs / Databases / Code -> MCP Servers"
2. 第二张:四种 source 卡片,OpenAPI / Prisma / Drizzle / Zod
3. 第三张:一屏代码示例
4. 第四张:安全默认列表

## Notes

- 小红书不适合一上来堆代码;首屏先讲场景和收益。
- 评论区可以引导到 GitHub / docs,正文里只放两个链接。
