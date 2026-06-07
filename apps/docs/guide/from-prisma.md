# From Prisma

Take any **Prisma** schema and expose it as a Bridgent MCP server in one call. Defaults are read-only, with row caps and per-query timeouts.

## Quick start

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

## What you get for each model

For a model `User`, Bridgent generates 5 tools:

- `user_findUnique` — look up by id or unique field
- `user_findFirst` — first row matching a filter
- `user_findMany` — list rows; **default `take: 10000`, hard-capped**
- `user_count` — capped aggregate count
- `user_aggregate` — capped `_count / _sum / _avg / _min / _max`

`include` / nested relation queries are **not** supported in v0.1 — keeps the LLM-facing surface small and predictable.

## Built-in guardrails

| Guard | Default | Override |
|---|---|---|
| LIMIT clamp on `findMany` / `count` / `aggregate` | 10000 | `maxTake`, `defaultTake` |
| Soft per-query timeout | 10000 ms | `queryTimeoutMs` |
| `Bytes` field stripping | enforced | `excludeFieldTypes` |
| Raw SQL (`findRaw` / `$queryRaw`) | **permanently disabled** | — |

Default values match `packages/source-prisma/src/types.ts`. `defaultTake` and `maxTake` are independent: `defaultTake` is what we apply when the caller omits `take`; `maxTake` is the hard cap clamped onto the caller's value.

When a query times out, Bridgent returns `{ ok: false, error: { kind: 'timeout' } }`. The underlying Prisma query keeps running on the connection until it finishes naturally — the timeout is **soft**, by design.

## Filtering: model / method / tool

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

## Mutating operations

Write tools (`create` / `update` / `delete` / `upsert` / `*Many`) are **not generated in v0.1.** The option is parsed by the API:

```ts
await fromPrisma({ client, allow: { mutating: true } }) // typechecks
```

…but the underlying tool factory only registers read-side operations, so mutating methods are **silently dropped** during tool generation. `fromPrisma` does **not** throw, so existing call sites stay valid; they just won't surface write tools until v0.2 ships them with an audit log.

If you need write access today, define the mutation as an explicit Zod tool — see [From Zod](./from-zod).

## Compatibility

- `@prisma/client@^6.19.0` only. Prisma 7.x is **not** supported in v0.1 (its datasource was reworked into `prisma.config.ts` + adapter, which is a breaking change we'll handle in a follow-up).
- Node `>= 22.18`
