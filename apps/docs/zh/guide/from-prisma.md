# 从 Prisma 接入

拿任何 **Prisma** 模式,一次调用就把它暴露成 Bridgent MCP 服务器。默认只读,带行数上限和按查询的超时。

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
- `user_count` —— 聚合计数
- `user_aggregate` —— `_count / _sum / _avg / _min / _max`

`include` / 嵌套关系查询在 v0.1 **不支持** —— 这样可以保持暴露给 LLM 的接口小而可预测。

## 内置护栏

| 护栏 | 默认值 | 覆盖方式 |
|---|---|---|
| 对 `findMany.take` 的 LIMIT 钳制 | 10000 | `maxTake`、`defaultTake` |
| 单查询软超时 | 10000 ms | `queryTimeoutMs` |
| `Bytes` 字段剥离 | 默认生效 | `excludeFieldTypes` |
| 原始 SQL(`findRaw` / `$queryRaw`) | **永久禁用** | — |

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

写工具(`create / update / delete / upsert / *Many`)**默认禁用**。`mutating: true` 会启用 API 中的开关,但 **v0.1 只交付读侧工厂** —— 此时切换它是空操作。v0.2 会和审计日志一起带来写工具。

## 兼容性

- 仅 `@prisma/client@^6.19.0`。Prisma 7.x 在 v0.1 **不支持**(它的 datasource 被改造到 `prisma.config.ts` + adapter,这是一个我们会在后续处理的破坏性变更)。
- Node `>= 22.18`
