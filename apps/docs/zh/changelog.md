# 更新日志

这个页面按 alpha 版本线汇总用户可见变化。更细的工程记录和每日进度见仓库中的 [`docs/progress.md`](https://github.com/js-mark/bridgent/blob/main/docs/progress.md)。

## v0.2.3 — Prisma 写操作加固

`@bridgent/source-prisma@0.2.3` 加固了 `0.2.2` 新增的审计写操作链路。

### 新增

- 内置 `createJsonlAuditSink({ path })`,用于本地 JSONL 审计文件。
  - 自动创建父目录。
  - 每行追加一个 `PrismaAuditEvent`。
- 可选 `idempotencyKey` 写入控制,提升宿主重试安全性。
  - 同进程内正在执行的相同 commit 会按 `(toolName, idempotencyKey, argsHash)` 去重。
  - 成功提交结果会进入短期 replay 缓存。
  - 该 replay cache 是内存缓存,不是跨进程或持久幂等存储。

## v0.2.2 — Prisma 写操作增量

`@bridgent/source-prisma@0.2.2` 支持显式开启的带审计写工具。这个版本没有新增第四种数据源路径;Drizzle 已在 `@bridgent/source-drizzle@0.2.0` 发布。

### 新增

- Prisma 写方法:
  - `create`
  - `createMany`
  - `update`
  - `updateMany`
  - `upsert`
  - `delete`
  - `deleteMany`
- 必需写入控制:
  - `allow: { mutating: true }`
  - 非空 `writes.allowTools`
  - `writes.audit.write`
- 两步写入协议:
  - 先传 `dryRun: true`
  - 拿到 `preview` 和 `previewToken`
  - 再用相同写参数加 `previewToken` 提交
- 内存一次性 preview token,带 TTL 和参数 hash 绑定。
- 大影响写入通过 `confirmLargeImpact: true` 二次确认。
- commit audit fail-closed:如果 commit-attempt 审计事件失败,数据库写入不会执行。
- 新增 `examples/03b-prisma-writes`,演示 SQLite + Prisma 写操作。

### 护栏

- `updateMany` 和 `deleteMany` 拒绝空 `where`。
- `update`、`upsert`、`delete` 要求 unique-only `where`。
- `create` 输入会识别 Prisma default/generated 字段,不会错误强制要求它们。
- `update` 输入默认排除 id、唯一字段、generated 字段和 `@updatedAt` 字段。
- Raw SQL 仍永久不可用。

## v0.2.0 — Onboarding、鉴权与 Drizzle

v0.2.0 改善首次使用体验,并扩展已发布的数据源适配器,但不改变核心 runtime 模型。

### 新增

- `bridgent init [file] [--force]`
  - 生成可编辑的 starter server 文件
  - 默认保护已有文件
  - 支持自定义输出路径
- OpenAPI API-key 鉴权:
  - header
  - query parameter
  - cookie
- `@bridgent/source-drizzle@0.2.0`
  - 只读 `findMany` 工具
  - limit/defaultLimit 护栏
  - table 过滤
  - 不暴露 raw SQL,不生成写工具
- Prisma 写侧设计,后续已在 `@bridgent/source-prisma@0.2.2` 实现。

### 继续延后

- `bridgent expose`
- tRPC 数据源适配器
- GraphQL 数据源适配器
- Bridgent 自定义 Inspector UI
- 托管控制平面

## v0.1 — 首个公开 Alpha

v0.1 建立了 runtime 和包结构基础。

### 数据源

- 通过 `@bridgent/core` 暴露手写 Zod 工具。
- 通过 `@bridgent/source-openapi` 暴露 OpenAPI 3.x 工具。
- 通过 `@bridgent/source-prisma` 暴露 Prisma 6.x 只读工具。

### 传输层

- 通过 `createStdioServer` 使用 stdio。
- 通过 `createHttpServer` 使用 Streamable HTTP。
- 通过 `createWebHandler` 使用 Web Standard fetch handler。

### CLI

- `bridgent dev <file>`
- `bridgent serve <file>`
- `bridgent inspect <file>`

### 兼容性与安全

- Node `>= 22.18`。
- ESM-only packages。
- 针对 MCP 1.x 客户端的协议层 host harness。
- Prisma 只读护栏:
  - 行数上限
  - 软查询超时
  - `Bytes` 字段剥离
  - raw SQL 禁用
- OpenAPI 默认只读,以 Bearer auth 作为 baseline。

## 当前路线图

下一阶段重点可能包括:

- tRPC 数据源适配器。
- GraphQL 数据源适配器。
- 更完整的 Prisma relation input 覆盖。
- 改进 Inspector 体验。
- 托管控制平面。
