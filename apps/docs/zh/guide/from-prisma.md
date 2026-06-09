# 从 Prisma 接入

拿任何 **Prisma** 模式,一次调用就把它暴露成 Bridgent MCP 服务器。默认只读,带行数上限和按查询的超时。带审计写操作从 `@bridgent/source-prisma@0.2.2` 开始可显式开启;JSONL audit helper 与同进程幂等能力从 `@bridgent/source-prisma@0.2.3` 开始可用。

## 快速开始

```ts
import { createStdioServer } from '@bridgent/core'
import { fromPrisma } from '@bridgent/source-prisma'
import { PrismaClient } from '@prisma/client'

const client = new PrismaClient()

await createStdioServer({
  name: 'demo-db',
  version: '0.0.1',
  tools: await fromPrisma({ client, namespace: 'db_' }),
})
```

## 每个 model 你能拿到什么

对一个 model `User`,Bridgent 会生成 5 个工具:

- `user_findUnique` —— 按 id 或唯一字段查找
- `user_findFirst` —— 匹配过滤条件的第一行
- `user_findMany` —— 列出多行;**默认 `take: 10000`,有硬上限**
- `user_count` —— 带上限的聚合计数
- `user_aggregate` —— 带上限的 `_count / _sum / _avg / _min / _max`

`include` / 嵌套关系查询暂不支持 —— 继续保持暴露给 LLM 的接口小而可预测。

## 内置护栏

| 护栏 | 默认值 | 覆盖方式 |
|---|---|---|
| 对 `findMany` / `count` / `aggregate` 的 LIMIT 钳制 | 10000 | `maxTake`、`defaultTake` |
| 单查询软超时 | 10000 ms | `queryTimeoutMs` |
| `Bytes` 字段剥离 | 默认生效 | `excludeFieldTypes` |
| 原始 SQL(`findRaw` / `$queryRaw`) | **永久禁用** | — |

默认值与 `packages/source-prisma/src/types.ts` 一致。`defaultTake` 和 `maxTake` 是两个独立选项:`defaultTake` 是调用方未传 `take` 时我们填入的值;`maxTake` 是钳制到调用方 `take` 之上的硬上限。

当查询超时,Bridgent 返回 `{ ok: false, error: { kind: 'timeout' } }`。底层 Prisma 查询会继续在连接上跑直到自然结束 —— 超时是**软**的,这是有意的设计。

## 过滤:model / method / tool

```ts
await fromPrisma({
  client,
  // Per-model filter (camelCase model name as on PrismaClient)
  modelFilter: name => name !== 'auditLog',

  // Limit which methods get generated for every model
  allow: { methods: ['findMany', 'count'] },

  // Whitelist by final tool name (after namespace + slug)
  allowTools: ['db_user_findMany', 'db_post_count'],

  // Or denylist
  denyTools: ['db_user_findMany'],
})
```

## 写操作

写工具(`create` / `createMany` / `update` / `updateMany` / `upsert` / `delete` / `deleteMany`)默认永远不会生成。

要暴露写操作,必须同时开启 mutating,并明确列出允许写入的最终工具名:

```ts
await fromPrisma({
  client,
  allow: { mutating: true },
  writes: {
    allowTools: ['db_user_create', 'db_user_update'],
    audit: createJsonlAuditSink({ path: './.bridgent/audit.jsonl' }),
  },
})
```

只有 `allow.mutating: true` 没有 `writes` 会抛错。只有 `writes` 没有 `allow.mutating: true` 也会抛错。`writes.allowTools` 必须非空,`writes.audit.write` 必须提供。

每个写工具都走两步:

1. 调用工具并传 `dryRun: true`,Bridgent 预览影响行数并返回 `previewToken`。
2. 再次调用同一个工具,传入完全相同的写参数和 `previewToken` 执行提交。

Preview token 存在内存中,一次性使用,默认 60000 ms 过期,并绑定到最终工具名和写参数稳定 hash。

大影响写入需要额外确认。如果 `preview.exceedsThreshold` 为 `true`,提交时必须同时传 `confirmLargeImpact: true`。阈值默认是 `100` 行,可通过 `writes.largeImpactThreshold` 调整。

如果宿主可能重试工具调用,在写参数里带上 `idempotencyKey`。Bridgent 会对同进程内正在执行的相同 commit 做 in-flight 去重,并按 `(toolName, idempotencyKey, argsHash)` 缓存成功结果 `writes.idempotencyKeyTTLMs` 时间(默认 10 分钟),同一次提交重试会返回共享或缓存结果,不会再次执行 Prisma 写入。

本地文件审计可以直接使用内置 JSONL helper:

```ts
import { createJsonlAuditSink, fromPrisma } from '@bridgent/source-prisma'

await fromPrisma({
  client,
  allow: { mutating: true },
  writes: {
    allowTools: ['db_user_create'],
    audit: createJsonlAuditSink({ path: './.bridgent/audit.jsonl' }),
  },
})
```

额外写入护栏:

- `deleteMany` 和 `updateMany` 拒绝空 `where`。
- `update`、`upsert`、`delete` 的 `where` 只允许唯一字段。
- `update` 的 `data` 默认排除 id、唯一字段、generated 字段和 `@updatedAt` 字段。
- `denyTools` 仍然会在 `writes.allowTools` 之后生效。
- 审计在 commit 前 fail-closed:如果 commit-attempt audit 事件抛错,数据库写入不会执行。Commit audit 事件使用 `attempted`,随后记录最终 `ok` 或 `error`。
- 审计事件需要记录参数时,用 `writes.redactor` 返回脱敏后的 args。

可运行示例见 [`examples/03b-prisma-writes`](https://github.com/js-mark/bridgent/tree/main/examples/03b-prisma-writes)。

## 兼容性

- 仅 `@prisma/client@^6.19.0`。Prisma 7.x 暂不支持(它的 datasource 被改造到 `prisma.config.ts` + adapter,这是一个我们会在后续处理的破坏性变更)。
- Node `>= 22.18`
