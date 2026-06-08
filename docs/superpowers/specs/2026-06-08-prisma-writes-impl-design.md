# Prisma writes runtime — implementation design

**Date**: 2026-06-08
**Scope**: implement runtime write tools for `@bridgent/source-prisma`, satisfying the contract defined in `docs/design/prisma-writes-v0.2.md`.
**Supersedes open questions in**: `docs/design/prisma-writes-v0.2.md`

## Goal

Ship Prisma `create / createMany / update / updateMany / upsert / delete / deleteMany` as MCP tools, gated by an explicit allowlist, mandatory audit sink, and a two-call dryRun → commit protocol.

The contract in `docs/design/prisma-writes-v0.2.md` is binding. This spec resolves its three open questions and fills the runtime detail.

## Decisions resolved from the design doc

| Open question | Resolution |
|---|---|
| Confirmation token shape | Single tool with required `previewToken` bound to `(toolName, argsHash, TTL)`. Commit re-hashes args; mismatch rejects. |
| Audit event default | Summary by default (no `args` field). User-supplied `redactor` produces the `args` field when set. |
| Two-phase tools vs single tool with token | Single tool. `dryRun:true` → returns `previewToken`. Same tool with `previewToken` → commits. |
| Idempotency keys | Deferred to v0.3. Not accepted as input in v0.2. |

## API surface

```ts
fromPrisma({
  client,
  allow: { mutating: true },          // gate 1 (required)
  writes: {                            // gate 2 (required)
    allowTools: string[],              // explicit per-tool allowlist (non-empty required)
    audit: {
      write: (event: AuditEvent) => Promise<void>,
    },
    redactor?: Redactor,               // optional; when set, AuditEvent.args is populated
    previewTokenTTLMs?: number,        // default 60_000
    largeImpactThreshold?: number,     // default 100
  },
})
```

Validation at `fromPrisma` boot:

- `allow.mutating: true` set but `writes` missing → throw.
- `writes` set but `allow.mutating !== true` → throw.
- `writes.audit` missing → throw.
- `writes.allowTools` missing or empty → throw.
- `denyTools` continues to apply (`allowTools − denyTools`).
- A write tool whose generated name is not in `writes.allowTools` is not generated.
- Tool naming continues to use `${namespace}${modelCamel}_${method}` — same slug rule as read tools (ADR-016 area).

## Tool runtime contract

Each write tool's input schema is the Prisma method's native shape plus three control fields:

```ts
{
  // Prisma native (per method)
  data?: ...,
  where?: ...,
  create?: ...,           // upsert
  update?: ...,           // upsert
  skipDuplicates?: boolean, // createMany
  // Control fields (every write tool)
  dryRun?: boolean,
  previewToken?: string,
  confirmLargeImpact?: boolean,
}
```

### Protocol (visible in tool description)

1. Call with `dryRun: true`. Server returns `{ ok:true, preview, previewToken }`. No DB write.
2. Call again with the **same** `where` / `data` / `create` / `update` / `skipDuplicates` plus `previewToken`. Server re-hashes and commits.
3. If `preview.exceedsThreshold` was `true`, the commit call must also include `confirmLargeImpact: true`. Passing `confirmLargeImpact: true` on a commit that does **not** exceed the threshold is accepted as a no-op — it is not part of `argsHash`.

### Server-side preview token store

- In-memory `Map<token, Entry>`.
- `Entry`: `{ toolName, argsHash, affectedCount, exceedsThreshold, expiresAt }`.
- Token format: `pt_` + 32 random bytes, base64url-encoded.
- TTL: `previewTokenTTLMs` (default 60_000 ms).
- Eviction: lazy on access (`Date.now() > expiresAt` → delete + treat as missing) plus periodic sweep.
- **Single-use**: token is removed on the first commit attempt regardless of outcome (Prisma error, threshold reject, audit-sink throw, hash mismatch). A second commit with the same token always returns `preview_required`. The LLM must rerun `dryRun` after any failure.
- Single-process only. v0.2 transports (stdio, HTTP, Web handler) are all single-process; no Redis or shared store.
- Tokens are not persisted across process restarts. This is intentional.

### Args hashing

- Take input.
- Strip control fields (`dryRun`, `previewToken`, `confirmLargeImpact`).
- Stable JSON stringify with sorted keys.
- SHA-256 hex.
- All native Prisma fields (`where`, `data`, `create`, `update`, `skipDuplicates`, `take`, `skip`) participate.

### Result envelope (extends `PrismaToolResult`)

```ts
interface PrismaToolResult<T> {
  ok: boolean
  result?: T
  preview?: {
    affectedCount: number
    exceedsThreshold: boolean
    expiresAt: string             // ISO
  }
  previewToken?: string
  meta?: { ... }                  // unchanged
  error?: {
    kind:
      | 'timeout'
      | 'invalid_input'
      | 'prisma'
      | 'unknown'
      | 'preview_required'        // new
      | 'confirmation_required'   // new
    message: string
  }
}
```

`preview` and `previewToken` populate **only** on a successful `dryRun: true` call.

## Audit events

```ts
interface AuditEvent {
  ts: string                              // ISO
  toolName: string
  model: string                           // DMMF model name
  method: PrismaMutatingMethod
  phase: 'preview' | 'commit'
  whereKeys?: string[]                    // top-level keys of where, no values
  dataKeys?: string[]                     // top-level keys of data, no values
  affectedCount?: number                  // commit: actual rows; preview: estimate
  status: 'ok' | 'error'
  errorKind?: PrismaToolResult['error']['kind']
  args?: unknown                          // present iff redactor supplied
}
```

### Sink behavior

- `audit.write(event)` is awaited. Caller blocks on it.
- Sink throws → tool returns `{ ok:false, error:{ kind:'unknown', message:'audit sink failed: ...' } }` and the underlying DB operation is **not** executed (fail-closed). For preview, the token is not issued. For commit, the write is aborted.
- Both `phase: 'preview'` and `phase: 'commit'` write audit events, on success and failure.

### Redactor

```ts
type Redactor = (
  rawArgs: Record<string, unknown>,
  ctx: { toolName: string, model: string, method: PrismaMutatingMethod },
) => unknown
```

- Not supplied → `event.args` is omitted.
- Returns `undefined` → `event.args` is omitted.
- Returns any other value → `event.args` is set to that value verbatim.

## Per-method behavior

| method | required input | preview action | large-impact source | extra rules |
|---|---|---|---|---|
| `create` | `data` | none — `preview.affectedCount = 1` | never triggers | `data` validated against `buildDataSchema` |
| `createMany` | `data: array` | none — `affectedCount = data.length` | `data.length > threshold` | passes `skipDuplicates` through |
| `update` | `where` (unique), `data` | `findUnique({ where })` to confirm hit | never triggers | `where` rejected unless every key is `isId || isUnique` |
| `updateMany` | `where` (non-empty), `data` | `count({ where })` | `affectedCount > threshold` | empty `where` rejected |
| `upsert` | `where` (unique), `create`, `update` | `findUnique({ where })` to determine create vs update | never triggers | unique-only `where` |
| `delete` | `where` (unique) | `findUnique({ where })` | never triggers | unique-only `where` |
| `deleteMany` | `where` (non-empty) | `count({ where })` | `affectedCount > threshold` | empty `where` rejected |

### Empty-where detection

Recursively strip `AND` / `OR` / `NOT`. If zero scalar leaf conditions remain, treat as empty. `where: {}`, `where: { AND: [] }`, `where: { OR: [{}] }` all rejected for `updateMany` / `deleteMany`.

### Unique-only where assertion

For `update` / `delete` / `upsert`: every top-level key in `where` must correspond to a DMMF field with `isId === true` or `isUnique === true`. Reuse the existing `uniqueLookupFields` helper.

### Timeouts and error mapping

- All write methods continue to use `withTimeout` from `guard.ts`. Default timeout matches read (`queryTimeoutMs`, default 10_000).
- `packErrorResult` is reused. New `error.kind` values (`preview_required`, `confirmation_required`) are produced inline by the write base, not by `packErrorResult`.

## Tool description

Every write tool description ends with this block so the LLM learns the protocol:

```
Mutating tool. Two-step protocol:
  1) Call with dryRun:true to get { preview, previewToken }.
  2) Call again with the SAME args plus previewToken to commit.
If preview.exceedsThreshold is true, commit must also pass confirmLargeImpact:true.
```

## File layout

```
packages/source-prisma/src/
  types.ts                      [edit] add WritesOptions, AuditEvent, Redactor; extend PrismaToolResult
  filter.ts                     [edit] resolveAllowedMethods only returns mutating when writes is configured
  from-prisma.ts                [edit] validate writes; inject token store + audit into factory args
  preview-token.ts              [new] in-memory store: issue/redeem/sweep + argsHash
  audit.ts                      [new] writeAuditEvent helper + summary extraction
  empty-where.ts                [new] isEffectivelyEmptyWhere recursive check
  unique-where.ts               [new] assertWhereOnlyUniqueFields(where, model)
  schema.ts                     [edit] buildDataSchema(model) for create/update; buildCreateManyDataSchema
  tools/
    index.ts                    [edit] route mutating methods through createWriteTool
    write-base.ts               [new] shared dryRun/commit envelope + audit invocation
    create.ts                   [new]
    create-many.ts              [new]
    update.ts                   [new]
    update-many.ts              [new]
    upsert.ts                   [new]
    delete.ts                   [new]
    delete-many.ts              [new]

packages/source-prisma/test/
  preview-token.test.ts         [new] issue, hash match, TTL expiry, sweep
  empty-where.test.ts           [new] AND/OR/NOT shapes
  unique-where.test.ts          [new]
  audit.test.ts                 [new] summary extraction, redactor passthrough, sink throw
  write-create.test.ts          [new] dryRun → commit happy path + token mismatch + TTL expiry
  write-update.test.ts          [new]
  write-delete-many.test.ts     [new] empty where + threshold + confirmLargeImpact required
  write-allowlist.test.ts       [new] missing writes throws; empty allowTools throws; non-allowlisted tool not generated

examples/03b-prisma-writes/      [new] minimal example with allowTools + redactor + dryRun→commit transcript
```

Tests stub `PrismaClient` the same way `find-many.test.ts` does. No real DB.

## Documentation and ADRs

ADRs to add to `docs/decisions.md`:

- ADR-028: Prisma writes protocol = dryRun + previewToken bound to `(toolName, argsHash, TTL)` + `confirmLargeImpact` boolean.
- ADR-029: audit sink fail-closed; redactor optional and absent by default; `args` field omitted when no redactor.
- ADR-030: write tools require non-empty `writes.allowTools` plus `allow.mutating: true`; either alone is rejected.

Docs to update:

- `apps/docs/guide/from-prisma.md` — add Writes section.
- `apps/docs/guide.zh/from-prisma.md` — sync.
- `docs/design/prisma-writes-v0.2.md` — header note "Implemented in 0.2.x" and link to this spec.
- `docs/roadmap.md` — move Prisma writes from "design only" to "shipped" in v0.2 Completed Scope.

## Non-goals

- No idempotency keys in v0.2.
- No raw SQL.
- No `groupBy` mutations or `executeRaw` exposure.
- No persisted preview tokens. Restart invalidates all tokens.
- No multi-process token store. v0.2 transports are single-process.
- No batch confirmation flow beyond `confirmLargeImpact: true`. Splitting batches across calls remains LLM responsibility.

## Verification gate

Done = all of:

- `pnpm turbo run build test typecheck lint` green across the monorepo.
- New tests above pass.
- `examples/03b-prisma-writes` runs end-to-end against the existing SQLite seed (or its own seed extension): a dryRun returns a token, a tampered commit (changed `where`) is rejected, a clean commit succeeds and writes one preview + one commit audit event.
- Docs render under `pnpm docs:build` with the new Writes section visible in EN and ZH.
