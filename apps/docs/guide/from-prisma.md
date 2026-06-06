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
- `user_count` — aggregate count
- `user_aggregate` — `_count / _sum / _avg / _min / _max`

`include` / nested relation queries are **not** supported in v0.1 — keeps the LLM-facing surface small and predictable.

## Built-in guardrails

| Guard | Default | Override |
|---|---|---|
| LIMIT clamp on `findMany.take` | 10000 | `maxTake`, `defaultTake` |
| Soft per-query timeout | 10000 ms | `queryTimeoutMs` |
| `Bytes` field stripping | enforced | `excludeFieldTypes` |
| Raw SQL (`findRaw` / `$queryRaw`) | **permanently disabled** | — |

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

Write tools (`create / update / delete / upsert / *Many`) are **disabled by default**. `mutating: true` will enable the flag in the API, but **v0.1 ships only read-side factories** — toggling it now is a no-op. v0.2 will land write tools alongside an audit log.

## Compatibility

- `@prisma/client@^6.19.0` only. Prisma 7.x is **not** supported in v0.1 (its datasource was reworked into `prisma.config.ts` + adapter, which is a breaking change we'll handle in a follow-up).
- Node `>= 22.18`
