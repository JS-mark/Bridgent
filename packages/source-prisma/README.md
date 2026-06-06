# @bridgent/source-prisma

> Expose any **Prisma** schema as MCP tools — read-only by default, with row caps, query timeouts, and `Bytes`-field stripping.

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

## What you get out of the box

For each Prisma model (e.g. `User`), 5 tools:

| Tool | Method | Notes |
|---|---|---|
| `user_findUnique` | `findUnique` | look up by id / unique field |
| `user_findFirst` | `findFirst` | first matching row |
| `user_findMany` | `findMany` | **default `take: 10000`, hard-capped** |
| `user_count` | `count` | aggregate count |
| `user_aggregate` | `aggregate` | `_count / _sum / _avg / _min / _max` |

Write operations (`create / update / delete / upsert / *Many`) are **disabled by default**. To opt in:

```ts
await fromPrisma({ client, allow: { mutating: true } })
```

> v0.1 only ships read-side factories — `mutating: true` is reserved for v0.2; toggling it now is a no-op.

## Built-in guardrails

| Guard | What it does |
|---|---|
| **LIMIT clamp** | `findMany.take` is clamped to `maxTake` (default 10000) and the response carries `meta.warning` when clamping happened |
| **Soft timeout** | every query is raced against `queryTimeoutMs` (default 10000); a timeout returns `{ ok: false, error: { kind: 'timeout' } }` rather than killing the server |
| **Bytes stripping** | DMMF fields with `type === 'Bytes'` are removed from the generated `where` / `select` / `orderBy` schemas — they never enter the LLM context |
| **No raw SQL** | `findRaw` / `aggregateRaw` / `$queryRaw` / `$executeRaw` are never exposed |

## Errors

Prisma errors are packaged into the response, not thrown:

```json
{ "ok": false, "error": { "kind": "prisma", "message": "Unique constraint failed on the fields: (`email`)" } }
```

This keeps the MCP server alive across upstream failures and gives the LLM enough info to course-correct.

## Compatibility

- `@prisma/client@^6.19.0` (Prisma 7.x is **not** supported in v0.1 — its datasource layer was reworked into `prisma.config.ts` + adapter, which is a breaking change.)
- Node `>= 22.18`
