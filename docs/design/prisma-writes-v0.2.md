# Prisma writes v0.2.x design

This document started as the v0.2 write-side design for `@bridgent/source-prisma`.
Runtime write tools were implemented as a v0.2.x increment from [`docs/superpowers/specs/2026-06-08-prisma-writes-impl-design.md`](../superpowers/specs/2026-06-08-prisma-writes-impl-design.md).

## Why writes are not a boolean toggle

Database writes are materially different from read tools:

- destructive operations can delete or corrupt user data
- LLM retries can duplicate side effects
- user intent can be ambiguous
- auditability matters more than convenience

Therefore `allow.mutating: true` must not expose Prisma writes by itself.

## Implemented runtime contract

Prisma writes require all of these:

1. **Explicit per-tool allowlist**
   - Users must name the exact generated write tools they want.
   - Model-wide or method-wide wildcards are not supported in the first write release.
2. **Audit log sink**
   - Every preview/commit records timestamp, tool name, model, method, where/data key summaries, affected count when known, and final status.
   - Users must provide an async or sync sink through `writes.audit.write`.
   - Audit is fail-closed before commit: if the commit-attempt sink throws, no database write is executed.
   - Commit events use `attempted` before the database write and final `ok` or `error` after the write path resolves.
3. **Dry-run or preview**
   - Every write tool requires `dryRun: true` first.
   - The preview returns a one-use `pt_*` token bound to the final tool name and stable hash of the write args.
   - Commit must repeat the same write args plus `previewToken`.
4. **Argument redaction**
   - Audit events include argument summaries by default.
   - Full redacted args are opt-in through `writes.redactor`.
5. **Destructive-operation guardrails**
   - `deleteMany` and `updateMany` require a `where` clause.
   - Empty `where` is rejected.
   - `update`, `upsert`, and `delete` only accept unique fields in `where`.
   - `update` data excludes id, unique, generated, and `@updatedAt` fields by default.
   - Large affected-row counts require `confirmLargeImpact: true` on commit.

## API

```ts
await fromPrisma({
  client,
  allow: { mutating: true },
  writes: {
    allowTools: ['user_create', 'ticket_update'],
    audit: {
      write: async event => appendAuditEvent(event),
    },
    redactor: rawArgs => redact(rawArgs),
    previewTokenTTLMs: 60_000,
    largeImpactThreshold: 100,
  },
})
```

## Non-goals for this increment

- No generic `allow.mutating: true` write exposure.
- No bypass for audit logging.
- No raw SQL.
- No persistent preview-token store.
- No default file audit sink; users provide their own sink.
- No idempotency-key abstraction yet.

## Resolved questions

- Confirmation tokens are opaque `pt_*` strings returned by `dryRun`.
- Audit includes where/data key summaries by default; redacted full args are opt-in.
- Writes use one tool per Prisma method with `dryRun` and `previewToken`, rather than separate preview/commit tools.
