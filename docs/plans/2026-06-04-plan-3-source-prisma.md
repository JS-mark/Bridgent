# Bridgent Plan 3 — `@bridgent/source-prisma` + SQLite 只读示例

## Context

Plan 1 / Plan 2 已经把 monorepo / core / cli / OpenAPI source 跑通（参考 `docs/plans/`）。Plan 3 交付 Bridgent **第二个 source 适配器**：把任何已有的 Prisma schema → MCP server 的只读 5 件套，并自带 LIMIT 与 timeout 护栏。

完成后，用户在 LLM 里可以直接「帮我查上个月退款率最高的 SKU」类自然语言数据查询，**无需写新 chatbot、无需暴露 raw SQL、不会被一脚踹掉整张表**。这是 Bridgent 在数据团队场景的核心证明点。

## 范围

| 模块 | 做什么 | 不做什么 |
|---|---|---|
| `packages/source-prisma` | `fromPrisma({ client })` → `BridgentTool[]`；5 个只读方法 + LIMIT 注入 + timeout + Bytes 排除 | `groupBy`、`include` 关联、`raw SQL`、Prisma 7.x 适配、enum 字段 |
| `examples/03-prisma-readonly` | SQLite + User/Post/Comment 三表 + 假数据 + 一键 `pnpm start` | Postgres、Mongo、连接池 |
| `apps/docs/guide/from-prisma.md` | 用法 / 护栏 / 安全姿态文档 | API auto-generation |
| `docs/decisions.md` 增 | ADR-014 ~ ADR-017 | — |
| `docs/progress.md` 增 | Plan 3 章节 | — |

**显式不做**：
- 修改 `@bridgent/core`（沿用现有 BridgentTool 接口）
- `groupBy`（v0.1 排除，留给 Plan 3.5）
- `include`（无限嵌套 + 大查询风险，留给 v0.2）
- raw SQL（永远不会做 — 这是 Bridgent 的安全基线）
- 写操作的精细 audit log（v0.1 只允许/拒绝二选一，audit 留给 Plan 6）

## 关键技术决策（已锁定）

1. **Prisma 版本**：peerDependency `^6.19.0`（**不支持 7.x**；7.x 重构 datasource 为 `prisma.config.ts` + adapter，是 breaking change）
2. **DMMF 访问**：`import { Prisma } from '@prisma/client'` → `Prisma.dmmf.datamodel.models[]`（公开 stable API，已实测 6.19.3 ✅）
3. **5 个只读方法**：`findUnique` / `findFirst` / `findMany` / `count` / `aggregate`；写操作（create/update/delete/upsert/createMany 等）默认禁用，需 `allow: { mutating: true }` 或 `allowTools` 白名单解锁
4. **不支持 include**：v0.1 仅 scalar 字段；relation 字段在 select / where 里直接过滤掉
5. **LIMIT 注入**：`findMany` 默认 `take: 10000`；用户传 `take` 时 clamp 到 `maxTake`（默认 10000）+ 在响应里加 warning
6. **Query timeout**：`Promise.race([prismaCall, sleep(timeoutMs).then(throw)])`，默认 10000ms（soft timeout，连接池占用直到 query 自然结束 — 文档明确写）
7. **Bytes 字段排除**：DMMF field.type === 'Bytes' 直接从 select / where 里去掉，永远不会出现在 LLM 视野
8. **DateTime**：input/output 都用 ISO 8601 字符串（`z.string().datetime()`）；Prisma 接受 string 自动转 Date
9. **BigInt / Decimal**：input/output 用 string（避免 JSON.stringify 抛 "Do not know how to serialize a BigInt"）
10. **Json 字段**：input/output 用 `z.unknown()` / `z.any()` 透传
11. **Tool name**：`{namespace}{model}_{method}`，model 用 client camelCase（`user`, `post`），namespace 默认空（用户传 `'db_'` 之类前缀）
12. **Example DB**：SQLite（零依赖、`prisma migrate dev` 一行起）
13. **传入实例 vs spec**：让用户传**已 connect 的 PrismaClient 实例**（不是 schema 路径）；Bridgent 不依赖 `@prisma/internals`、不调 prisma generate；这与 Plan 2 「user 提供数据 / Bridgent 提供 LLM 接口」哲学一致
14. **Vendor extension**：Prisma 没有 vendor extension 的概念；用 BridgentOptions 里的 allow/deny 列表过滤即可

## 仓库新增

```
packages/source-prisma/
├── src/
│   ├── index.ts                    # re-export fromPrisma + 类型
│   ├── from-prisma.ts              # 主入口编排
│   ├── dmmf.ts                     # Prisma.dmmf 读取 + 模型/字段筛选
│   ├── schema.ts                   # DMMF field → Zod (where/select/orderBy)
│   ├── tools/
│   │   ├── find-many.ts            # 含 LIMIT 注入
│   │   ├── find-first.ts
│   │   ├── find-unique.ts
│   │   ├── count.ts
│   │   └── aggregate.ts
│   ├── guard.ts                    # query timeout + Bytes 排除
│   ├── slug.ts                     # tool name 生成
│   ├── filter.ts                   # method/model/tool 过滤管线
│   └── types.ts                    # FromPrismaOptions / 内部类型
├── test/
│   ├── schema.test.ts              # DMMF → zod 转换正确性
│   ├── slug.test.ts
│   ├── filter.test.ts
│   └── find-many.test.ts           # 含 LIMIT 注入 + clamp 行为
├── tsdown.config.ts
├── tsconfig.json
├── vitest.config.ts
├── package.json                    # name: @bridgent/source-prisma
└── README.md

examples/03-prisma-readonly/
├── prisma/
│   ├── schema.prisma               # User/Post/Comment 三表
│   └── dev.db                      # gitignore'd
├── seed.ts                         # 灌 5-10 条假数据
├── server.ts                       # ~10 行：fromPrisma({ client })
├── package.json
├── .env.example                    # DATABASE_URL=file:./prisma/dev.db
├── .gitignore
└── README.md

apps/docs/guide/
└── from-prisma.md                  # sidebar 增条目

docs/
├── progress.md                     # Plan 3 章节
├── decisions.md                    # ADR-014 ~ ADR-017
└── plans/2026-06-04-plan-3-source-prisma.md   # 归档
```

## API 形态

```ts
// packages/source-prisma/src/types.ts
export type PrismaReadMethod
  = 'findUnique' | 'findFirst' | 'findMany' | 'count' | 'aggregate'

export type PrismaMutatingMethod
  = 'create' | 'createMany' | 'update' | 'updateMany'
    | 'upsert' | 'delete' | 'deleteMany'

export type PrismaMethod = PrismaReadMethod | PrismaMutatingMethod

export interface FromPrismaOptions {
  /** Already-instantiated PrismaClient. Bridgent doesn't connect/disconnect. */
  client: object  // typed loosely to avoid coupling to a specific Prisma version

  /** Tool name namespace prefix, e.g. 'db_'. */
  namespace?: string

  /** Method allowlist. Default: read-only 5-piece. */
  allow?: {
    /** When true, also exposes create/update/delete/upsert variants. */
    mutating?: boolean
    /** Explicit method list. Overrides `mutating` when set. */
    methods?: PrismaMethod[]
  }

  /** Per-model filter (camelCase model name as on PrismaClient). */
  modelFilter?: RegExp | ((modelCamel: string) => boolean)

  /** Allowlist by final tool name (after namespace + slug). */
  allowTools?: string[]
  /** Denylist by final tool name. Applied after allowTools. */
  denyTools?: string[]

  /** Default `take` when not specified. Default 10000. */
  defaultTake?: number
  /** Hard cap clamped onto user's `take`. Default 10000. */
  maxTake?: number

  /** Per-query soft timeout in ms. Default 10000. */
  queryTimeoutMs?: number

  /** Field types to never expose. Default ['Bytes']. */
  excludeFieldTypes?: string[]
}

export async function fromPrisma(opts: FromPrismaOptions): Promise<BridgentTool[]>
```

### Method-default 表

| 方法 | 默认开关 | take 注入 | 备注 |
|---|---|---|---|
| `findUnique` | ✅ on | — | 单条 |
| `findFirst` | ✅ on | — | 单条 |
| `findMany` | ✅ on | **default 10000, clamp ≤ maxTake** | LIMIT 主战场 |
| `count` | ✅ on | — | 聚合 |
| `aggregate` | ✅ on | — | 聚合 |
| `create / update / delete / upsert / *Many` | ❌ off | — | 需 `mutating: true` |
| `findRaw / aggregateRaw / $queryRaw / $executeRaw` | ❌ **永久禁用** | — | 不暴露，安全基线 |

### 过滤管线（与 Plan 2 风格对齐）

```
1. method ∈ allow.methods? (默认 5 件套)              → 否则丢
2. modelFilter(modelCamel) 通过？                     → 否则丢
3. denyTools 命中（对最终 tool name）？               → 丢
4. allowTools 非空 && 未命中？                        → 丢
5. 通过 → 生成 BridgentTool
```

### Schema 派生（DMMF → Zod）

每个 model 的 zod 输入由几个子 schema 拼装：

- `WhereSchema(model)`：`{ AND, OR, NOT, ...每个 scalar field 的 filter }`
  - String field: `{ equals?, contains?, startsWith?, endsWith?, in?, notIn? }`
  - Int/Float/Decimal/BigInt: `{ equals?, gt?, gte?, lt?, lte?, in? }`（数字类型 input 都接 number 或 string，输出按字段类型）
  - Boolean: `{ equals? }`
  - DateTime: `{ equals?, gt?, gte?, lt?, lte? }`，值为 ISO 字符串
  - Json: 不放 filter（v0.1 不支持 JSON path filter）
  - Bytes: 排除
- `SelectSchema(model)`：`{ [scalarField]: z.boolean().optional() }`，relation/Bytes 不出现
- `OrderBySchema(model)`：`{ [scalarField]: z.enum(['asc','desc']).optional() }`
- 各方法 input：
  - `findUnique`: `{ where: { id: ... } | { uniqueField: ... } }`（unique 用 `isUnique` + `isId` 在 DMMF 里筛）
  - `findFirst`: `{ where?, orderBy?, select?, skip? }`
  - `findMany`: `{ where?, orderBy?, select?, take?, skip?, distinct? }`
  - `count`: `{ where?, take?, skip? }` → number
  - `aggregate`: `{ where?, _count?, _sum?, _avg?, _min?, _max?, take?, skip? }`

### 护栏实现要点

```ts
// guard.ts
export async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Query "${label}" exceeded ${ms}ms timeout`)), ms)
  })
  try { return await Promise.race([p, timeout]) }
  finally { clearTimeout(timer!) }
}

// tools/find-many.ts
async function run(args) {
  const take = clampTake(args.take, defaultTake, maxTake)
  const sanitized = sanitizeSelect(args.select, excludeFieldTypes)
  const result = await withTimeout(
    client[modelCamel].findMany({ ...args, take, select: sanitized }),
    queryTimeoutMs,
    `${modelCamel}_findMany`,
  )
  return {
    rows: result,
    meta: {
      count: result.length,
      takeApplied: take,
      ...(args.take && args.take > maxTake ? { warning: `take clamped from ${args.take} to ${maxTake}` } : {}),
    },
  }
}
```

错误处理与 source-openapi 对齐：**不 throw**，把 `Error` 包成 `{ ok: false, error: { message, kind } }` 喂给 LLM；LLM 看到「query timeout」就能自己加 where 缩小范围重试。

## Example: `examples/03-prisma-readonly`

`prisma/schema.prisma`：

```
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id      Int      @id @default(autoincrement())
  email   String   @unique
  name    String?
  age     Int?
  posts   Post[]
  comments Comment[]
}

model Post {
  id        Int       @id @default(autoincrement())
  title     String
  content   String?
  published Boolean   @default(false)
  authorId  Int
  author    User      @relation(fields: [authorId], references: [id])
  comments  Comment[]
  createdAt DateTime  @default(now())
}

model Comment {
  id        Int      @id @default(autoincrement())
  body      String
  postId    Int
  post      Post     @relation(fields: [postId], references: [id])
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
}
```

`server.ts`（关键 ~10 行）：

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

`package.json` scripts：

```json
{
  "scripts": {
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev --name init",
    "prisma:seed": "node --experimental-strip-types --no-warnings=ExperimentalWarning seed.ts",
    "setup": "pnpm prisma:generate && pnpm prisma:migrate && pnpm prisma:seed",
    "start": "bridgent dev ./server.ts"
  }
}
```

`.env.example` / `.env`：`DATABASE_URL="file:./prisma/dev.db"`

`README.md` 引导：

```bash
cd examples/03-prisma-readonly
cp .env.example .env
pnpm setup           # generate + migrate + seed
pnpm start           # 起 stdio MCP server
```

## 实施顺序

1. `packages/source-prisma` 骨架（`package.json` / `tsconfig.json` / `tsdown.config.ts` / `vitest.config.ts`）
   - 把 `prisma` + `@prisma/client` 加进 catalog（`^6.19.3`）
   - peerDep 声明 `@prisma/client: ^6.19.0`
   - tsdown external `@prisma/client`、`@bridgent/core`、`zod`
2. `src/types.ts`：FromPrismaOptions / 内部类型
3. `src/dmmf.ts`：从 `Prisma.dmmf` 提取 model/field，过滤掉 relation 字段、Bytes 字段
4. `src/schema.ts`：DMMF field → zod（where/select/orderBy 三件套）+ 单测
5. `src/slug.ts`：`{namespace}{modelCamel}_{method}` + 单测
6. `src/filter.ts`：method/model/tool 三段过滤 + 单测
7. `src/guard.ts`：`withTimeout` + `clampTake` + `sanitizeSelect`
8. `src/tools/*.ts`：5 个 method 各自的 BridgentTool 工厂
9. `src/from-prisma.ts`：主入口编排
10. `src/index.ts`：re-export
11. `examples/03-prisma-readonly`：schema / seed / server / README
12. `apps/docs/guide/from-prisma.md` + sidebar 增 entry
13. `docs/decisions.md` 增 ADR-014 ~ ADR-017
14. `docs/progress.md` 增 Plan 3 章节
15. **端到端验证**

## 验证（端到端）

按顺序跑、全部为绿才算 Plan 3 完成：

1. `pnpm install`（catalog 增 prisma + @prisma/client 后）
2. `pnpm turbo run lint typecheck test build` — 期望 7 → 8 packages 全绿
3. `pnpm --filter @bridgent-examples/03-prisma-readonly setup` — generate + migrate + seed 全成功，`prisma/dev.db` 存在且有数据
4. **MCP 联通性 e2e**：用 Plan 1/2 验证过的 stdio 探针：
   - `tools/list` 应看到 `db_user_findMany`、`db_user_count`、`db_post_findMany`、`db_post_aggregate`、`db_comment_findMany` 等
   - **应不存在** `*_create` / `*_delete` / `*_findRaw` 等
   - `tools/call db_user_findMany { take: 5 }` 应返回 5 条 seed 用户
5. **LIMIT clamp 验证**：`tools/call db_user_findMany { take: 999999 }` 响应里 `meta.warning` 应包含 "clamped"
6. **timeout 验证**：单测中用 mock client 让 query 等 11s（默认 10s timeout），expect 返回 `{ ok: false, error: ... timeout ...}`
7. **Bytes 排除验证**：单测中给一个含 Bytes 字段的 mock DMMF model，select schema 不应包含该字段

## 风险与待实测项

| # | 项 | 验证方法 |
|---|---|---|
| R1 | `Prisma.dmmf.datamodel.models[]` 在 6.19.x 稳定 | 已实测 ✅ |
| R2 | client 上每个 method 都能动态拿到（`client[model][method]`） | 已实测 ✅ |
| R3 | DateTime 字段 input 用 ISO 字符串能否被 Prisma 接受 | 进 pkg 后 e2e 实测 |
| R4 | BigInt / Decimal 字段在 SQLite 例子里是否出现（schema 没有这些类型） | 例子用不到，仅 schema.test.ts 用单测 mock 覆盖 |
| R5 | `Promise.race` 触发 timeout 后底层 query 仍然占连接 | 文档明确告知 user，作为已知限制 |
| R6 | workspace 模式下 `@prisma/client` 的 generator 输出 | 例子里指定 `output = "../node_modules/.prisma/client"`（默认）即可；首次 install 后必须 `prisma generate`，写进 README |
| R7 | `prisma migrate dev` 在 monorepo + pnpm 下要不要 cwd 调整 | 在 example 包下跑，cwd 自然 OK |
| R8 | Prisma 6.19 `Prisma.dmmf` 的导出在打包后仍然存在 | tsdown external `@prisma/client`，运行时由 user 装；不会被 bundle 进 dist，安全 |

## ADR 增补（写进 docs/decisions.md）

- **ADR-014** Prisma 锁 6.19.x，不支持 7.x（datasource 重构 breaking change）
- **ADR-015** v0.1 仅 5 个只读方法（findUnique/findFirst/findMany/count/aggregate），groupBy + include 推迟到 v0.2
- **ADR-016** LIMIT 注入 + clamp + soft timeout 三件套护栏；raw SQL 永久禁用
- **ADR-017** Bytes 字段在 DMMF 派生时直接排除，永不进入 LLM 视野；DateTime 用 ISO string，BigInt/Decimal 用 string

## 后续 plan 预告（不在本次范围）

- **Plan 4 (Day 5-6)**：`bridgent inspect` web UI + HTTP/SSE 双协议
- **Plan 5 (Day 6-7)**：`packages/adapter-host` 跨宿主 e2e + 30s demo GIF
- **Plan 6**：发布流（changesets）+ awesome-* PR 串投放 + HN/PH 文案
- **Plan 7 (后续)**：source-prisma v0.2 — groupBy + include + audit log

## Critical Files

- `/Users/mark/myself/code/Bridgent/packages/source-prisma/src/from-prisma.ts`
- `/Users/mark/myself/code/Bridgent/packages/source-prisma/src/dmmf.ts`
- `/Users/mark/myself/code/Bridgent/packages/source-prisma/src/schema.ts`
- `/Users/mark/myself/code/Bridgent/packages/source-prisma/src/guard.ts`
- `/Users/mark/myself/code/Bridgent/packages/source-prisma/src/tools/find-many.ts`
- `/Users/mark/myself/code/Bridgent/packages/source-prisma/src/tools/aggregate.ts`
- `/Users/mark/myself/code/Bridgent/examples/03-prisma-readonly/prisma/schema.prisma`
- `/Users/mark/myself/code/Bridgent/examples/03-prisma-readonly/server.ts`
- `/Users/mark/myself/code/Bridgent/examples/03-prisma-readonly/seed.ts`
- `/Users/mark/myself/code/Bridgent/pnpm-workspace.yaml`（catalog 增 prisma + @prisma/client）
- `/Users/mark/myself/code/Bridgent/apps/docs/guide/from-prisma.md`
- `/Users/mark/myself/code/Bridgent/apps/docs/.vitepress/config.ts`（sidebar）
- `/Users/mark/myself/code/Bridgent/docs/decisions.md`
- `/Users/mark/myself/code/Bridgent/docs/progress.md`
