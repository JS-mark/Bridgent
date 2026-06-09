# @bridgent/source-prisma

> Expose any **Prisma** schema as MCP tools — read-only by default, with row caps, query timeouts, `Bytes`-field stripping, and optional audited writes.

## Quick start

```ts
import { createStdioServer } from '@bridgent/core'
import { createJsonlAuditSink, fromPrisma } from '@bridgent/source-prisma'
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

Write operations (`create / update / delete / upsert / *Many`) are **disabled by default**. Enabling them requires a mutating opt-in, an explicit final-tool allowlist, and an audit sink:

```ts
await fromPrisma({
  client,
  allow: { mutating: true },
  writes: {
    allowTools: ['user_create', 'ticket_update'],
    audit: createJsonlAuditSink({ path: './.bridgent/audit.jsonl' }),
    idempotencyKeyTTLMs: 10 * 60_000,
  },
})
```

`allow.mutating: true` by itself throws. So does `writes` without the mutating opt-in.

Write tools use a two-step protocol:

1. Call with `dryRun: true` to receive `{ preview, previewToken }`.
2. Call again with the same write args plus `previewToken` to commit.

If `preview.exceedsThreshold` is true, the commit call must also include `confirmLargeImpact: true`.

Hosts that can retry tool calls should pass an `idempotencyKey` with the write args. Bridgent deduplicates same-process in-flight commits and caches successful results for matching `(toolName, idempotencyKey, argsHash)` tuples for `writes.idempotencyKeyTTLMs` (default 10 minutes), so retries do not duplicate the database write.

## Built-in guardrails

| Guard | What it does |
|---|---|
| **LIMIT clamp** | `findMany.take` is clamped to `maxTake` (default 10000) and the response carries `meta.warning` when clamping happened |
| **Soft timeout** | every query is raced against `queryTimeoutMs` (default 10000); a timeout returns `{ ok: false, error: { kind: 'timeout' } }` rather than killing the server |
| **Bytes stripping** | DMMF fields with `type === 'Bytes'` are removed from the generated `where` / `select` / `orderBy` schemas — they never enter the LLM context |
| **No raw SQL** | `findRaw` / `aggregateRaw` / `$queryRaw` / `$executeRaw` are never exposed |
| **Write preview token** | write commits require a one-use `pt_*` token from an identical `dryRun` call |
| **Audit fail-closed** | write preview/commit requires `writes.audit.write`; if the commit-attempt sink fails, the database write is not executed |
| **JSONL audit helper** | `createJsonlAuditSink({ path })` appends one audit event per line and creates parent directories |
| **Idempotent replay** | same-process in-flight commits and successful write results can be replayed by `idempotencyKey` without running Prisma again |

`update` data excludes id, unique, generated, and `@updatedAt` fields by default.

## Errors

Prisma errors are packaged into the response, not thrown:

```json
{ "ok": false, "error": { "kind": "prisma", "message": "Unique constraint failed on the fields: (`email`)" } }
```

This keeps the MCP server alive across upstream failures and gives the LLM enough info to course-correct.

## Compatibility

- `@prisma/client@^6.19.0` (Prisma 7.x is **not** supported yet — its datasource layer was reworked into `prisma.config.ts` + adapter, which is a breaking change.)
- Node `>= 22.18`
