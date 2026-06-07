# 数据源总览

Bridgent 将不同形态的"你已有的定义"归一化为统一的 MCP 工具表面。选择匹配你代码库的数据源即可;运行时(传输层、CLI、宿主)是一致的。

## 能力矩阵

| | **From Zod** | **From OpenAPI** | **From Prisma** | **From Drizzle** | *From tRPC* | *From GraphQL* |
|---|---|---|---|---|---|---|
| 状态 | 已发布(`@bridgent/core`) | 已发布(`@bridgent/source-openapi`) | 已发布(`@bridgent/source-prisma`) | 已发布(`@bridgent/source-drizzle`) | 路线图 | 路线图 |
| 最小代码 | 每个工具一次 `defineTool` | `await fromOpenApi({ spec })` | `await fromPrisma({ client })` | `await fromDrizzle({ db, tables })` | — | — |
| 工具来源 | 每个 `defineTool` 调用 | spec 中的每个 operation | 每个 model × 5 个读方法 | 每张表 × `findMany` | router procedure | resolver 字段 |
| 命名 | 作者提供的 `name` | `operationId`(slug 化)或 `${method}_${path}` | `<namespace?><modelCamel>_<method>` | `<namespace?><table>_find_many` | TBD | TBD |
| 过滤 | 不适用 | `allow` / `allowOperations` / `denyOperations` / `pathFilter` / `respectExtensions` | `allow` / `modelFilter` / `allowTools` / `denyTools` | `tableFilter` | TBD | TBD |
| 鉴权 | 由作者在 `run` 中提供 | Bearer 或 API key | 复用 PrismaClient 的 datasource 凭据 | 复用 Drizzle 的数据库连接 | — | — |
| 读 / 写 | 由作者控制 | 默认只读;通过 `allow.mutating` 显式启用 | 只读 5 件套;写操作仍是设计阶段 | 只读 `findMany` | — | — |

## 如何选择

- **From Zod** —— 你已经有一个函数,想精确暴露它,并控制 LLM 看到的输入形状。表面积最小化。
- **From OpenAPI** —— 你有一个用 spec 描述的 HTTP API。Bridgent 为每个 operation 生成一个工具;子集由你控制。
- **From Prisma** —— 你想让 LLM 安全地读取数据库。默认只读,带行数上限、软超时与 `Bytes` 字段剥离。
- **From Drizzle** —— 你想在现有 Drizzle database 上暴露轻量、只读的表查询表面。

## 路线图

- **From tRPC** —— 每个 procedure 一个工具,完整类型,无需重写 schema。
- **From GraphQL** —— 把 operation 与字段级 resolver 作为工具。

这些规划在 v0.1 之后;进度跟踪请见 [GitHub 仓库](https://github.com/js-mark/bridgent)。

## 混合多个数据源

一个 Bridgent server 可以把多个数据源的工具拼装在一起:

```ts
import { createStdioServer, defineTool } from '@bridgent/core'
import { fromOpenApi } from '@bridgent/source-openapi'
import { fromPrisma } from '@bridgent/source-prisma'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const client = new PrismaClient()

await createStdioServer({
  name: 'mixed',
  version: '0.0.1',
  tools: [
    ...await fromPrisma({ client, namespace: 'db_' }),
    ...await fromOpenApi({
      spec: 'https://api.example.com/openapi.json',
      namespace: 'api_',
    }),
    defineTool({
      name: 'echo',
      inputSchema: z.object({ msg: z.string() }),
      run: ({ msg }) => msg,
    }),
  ],
})
```

为每个生成批次使用 `namespace` 以避免命名冲突;重复名会在启动时 fail-fast 抛出。
