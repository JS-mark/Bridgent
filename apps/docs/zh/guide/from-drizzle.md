# 从 Drizzle 接入

把 Drizzle 表暴露为只读 MCP 工具。

## 快速开始

```ts
import { createStdioServer } from '@bridgent/core'
import { fromDrizzle } from '@bridgent/source-drizzle'
import { db } from './db'
import * as schema from './schema'

await createStdioServer({
  name: 'drizzle-readonly',
  version: '0.0.1',
  tools: await fromDrizzle({
    db,
    tables: {
      users: schema.users,
      posts: schema.posts,
    },
    maxLimit: 100,
  }),
})
```

## 安全姿态

`@bridgent/source-drizzle@0.2.0` 开始每张表暴露一个只读 `findMany` 工具:

```ts
db.select().from(table).limit(n).offset(n)
```

适配器不接受 raw SQL,也不会生成写工具。

## 选项

| 选项 | 用途 |
|---|---|
| `db` | 已实例化且带 `select()` 的 Drizzle database 对象 |
| `tables` | 公开表名到 Drizzle table 对象的映射 |
| `namespace` | 生成工具名的前缀 |
| `tableFilter` | 针对表名的 RegExp 或函数过滤器 |
| `defaultLimit` | 调用方省略 `limit` 时使用的默认值 |
| `maxLimit` | 调用方传入 `limit` 时的硬上限 |

生成工具名格式为 `<namespace?><table>_find_many`。
