# Prisma writes v0.2 design

This document is the v0.2 write-side design for `@bridgent/source-prisma`.
It is intentionally **not** an implementation approval for runtime write tools.

## Why writes are not a boolean toggle

Database writes are materially different from read tools:

- destructive operations can delete or corrupt user data
- LLM retries can duplicate side effects
- user intent can be ambiguous
- auditability matters more than convenience

Therefore `allow.mutating: true` must not expose Prisma writes by itself.

## Required runtime contract

Before Prisma writes ship, the API must require all of these:

1. **Explicit per-tool allowlist**
   - Users must name the exact generated write tools they want.
   - Model-wide or method-wide wildcards should be rejected in the first write release.
2. **Audit log sink**
   - Every attempted write records timestamp, tool name, args summary, host/session metadata when available, preview result when available, and final status.
   - The default sink can be local JSONL; production users can provide an async sink.
3. **Dry-run or preview**
   - `create`/`update`/`upsert` should expose a preview step when Prisma can produce enough information without writing.
   - `delete`/`deleteMany` must require a prior read/preview count.
4. **Idempotency guidance**
   - Tools should accept an optional idempotency key when the underlying operation can be retried by a host.
5. **Destructive-operation guardrails**
   - `deleteMany` and `updateMany` require a `where` clause.
   - Empty `where` is rejected.
   - Large affected-row counts require an explicit confirmation token in a later call.

## Proposed future API

```ts
await fromPrisma({
  client,
  writes: {
    allowTools: ['user_create', 'ticket_update'],
    audit: {
      write: async event => appendAuditEvent(event),
    },
    requirePreview: true,
  },
})
```

## Non-goals for v0.2

- No runtime write tools.
- No generic `allow.mutating: true` write exposure.
- No bypass for audit logging.
- No raw SQL.

## Open questions

- How should confirmation tokens be represented across MCP hosts?
- Should audit events include redacted full args or only summaries by default?
- Should write tools be generated as two-phase `preview_*` and `commit_*` tools, or as one tool with a required preview token?
