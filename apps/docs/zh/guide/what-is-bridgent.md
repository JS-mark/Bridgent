# 什么是 Bridgent AI?

**Bridgent AI** 把你已经有的定义转换为生产可用的 **MCP 服务器**。从 v0.2.0 开始,Bridgent AI 已发布四种数据源路径:

- OpenAPI 3.x 规范
- Prisma 6.x schema
- Drizzle 表
- 手写的 Zod 工具

tRPC、GraphQL 仍是后续数据源规划。

一旦暴露,生成的服务器即可被任意 MCP 宿主使用 —— Claude Code、Codex、Cursor、Gemini CLI、官方 Inspector,或任何说这门协议的客户端。

## 为什么需要它?

从零写一个 MCP 服务器意味着要学 SDK、设计 JSON 模式、串好鉴权、再发布一个二进制。对大多数团队来说,投入产出比并不划算 —— 所以他们干脆不发布,数据层也就对 AI Agent 隐形了。

Bridgent AI 通过**复用你已经有的模式**把这份工作压到零:

| 你已经有的 | Bridgent AI 给你的 |
|---|---|
| `prisma.schema` | `find` / `findMany` / `aggregate` / `count` 工具,默认只读,可显式开启带审计写操作 |
| `openapi.json` | 每个操作一个 MCP 工具,默认只读,支持 Bearer 与 API-key 鉴权 |
| Zod schema + 函数 | 一个完整的 MCP 服务器,已为 npm 打包 |
| Drizzle 表 | 带行数上限的只读 `findMany` 工具 |

## Bridgent AI **不是**什么

- **不是**又一个 LangChain。没有 prompt、chain、memory 或 Agent 运行时。
- **不是** SaaS。Bridgent AI 在你代码旁边本地运行。
- **不**与单一框架(如 nestia)绑死。跨数据源是 Bridgent 的设计初衷。

## 状态

**当前 alpha** 已发布:

- **数据源**:Zod(手写工具)、OpenAPI 3.x 规范、Prisma 6.x 模式(默认只读,可显式开启带审计写操作)、Drizzle 表(只读)
- **传输层**:stdio、Streamable HTTP、运行时无关的 Web Standard fetch handler
- **CLI**:`bridgent init`、`bridgent dev`、`bridgent serve`、`bridgent inspect`
- **跨宿主测试装置**(harness):验证任何兼容 MCP 1.x 的客户端都能消费该服务器

版本历史:v0.2.0 新增 `bridgent init`、OpenAPI API-key 鉴权与 Drizzle 只读工具;`@bridgent/source-prisma@0.2.2` 新增显式 allowlist 与 preview token 保护的 Prisma 审计写工具;`@bridgent/source-prisma@0.2.3` 新增 JSONL audit helper 与同进程幂等保护。之后的路线图:tRPC / GraphQL 数据源、更完整的 Prisma relation input 覆盖、增强版 Inspector 体验、托管控制平面。
