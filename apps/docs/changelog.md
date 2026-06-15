# Changelog

This page summarizes the user-visible product changes by alpha line. For engineering notes and daily implementation logs, see [`docs/progress.md`](https://github.com/js-mark/bridgent/blob/main/docs/progress.md) in the repository.

## v0.3.0 — tRPC Source Adapter

`@bridgent/source-trpc@0.3.0` exposes tRPC v10/v11 routers as MCP tools through the existing explicit server-file model.

### Added

- `fromTrpc({ router, createContext?, toolPrefix?, procedureFilter?, allow? })`.
- Query procedures become read tools by default.
- Procedure path `user.getById` becomes tool name `trpc_user_getById`.
- `toolPrefix` replaces the default `trpc` prefix.
- Zod object inputs are reused as MCP input schemas.
- Procedures without input get an empty strict object schema.
- `examples/06-trpc-router` demonstrates default query exposure and an explicit mutating variant.

### Guardrails

- Mutations remain hidden unless `allow.mutating: true` and `allow.tools` list final generated mutation tool names.
- Subscriptions are not exposed because MCP tool calls are request/response.
- Unsupported or opaque input parser shapes fail during tool generation instead of falling back to permissive `any`.

## v0.2.4 — Prisma Relation Write Inputs

`@bridgent/source-prisma@0.2.4` expands audited Prisma write schemas with narrow relation input support.

### Added

- One-level relation `connect` / nested `create` inputs for:
  - `create.data`
  - `update.data`
  - `upsert.create`
  - `upsert.update`
- List relation fields accept a single value or an array for `connect` and `create`.
- Nested create uses a shallow scalar-only schema for the related model and omits backlink foreign-key scalar fields that Prisma fills from the parent relation.

### Guardrails

- `createMany` and `updateMany` remain scalar-only because Prisma does not support nested relation writes there.
- Nested relation writes still require the existing write controls: explicit tool allowlist, audit sink, dry-run preview token, and commit guardrails.
- Relation reads through `include` remain out of scope.

## v0.2.3 — Prisma Writes Hardening

`@bridgent/source-prisma@0.2.3` hardens the audited write path added in `0.2.2`.

### Added

- Built-in `createJsonlAuditSink({ path })` helper for local JSONL audit files.
  - Creates parent directories automatically.
  - Appends one `PrismaAuditEvent` per line.
- Optional `idempotencyKey` write control for host retry safety.
  - Same-process in-flight commits are deduplicated by `(toolName, idempotencyKey, argsHash)`.
  - Successful commit results are cached for short-lived replay.
  - The replay cache is in-memory; it is not a cross-process or persistent idempotency store.

## v0.2.2 — Prisma Writes Increment

`@bridgent/source-prisma@0.2.2` supports audited write tools as an explicit opt-in. This release does not add a fourth source path; Drizzle shipped earlier in `@bridgent/source-drizzle@0.2.0`.

### Added

- Prisma write methods:
  - `create`
  - `createMany`
  - `update`
  - `updateMany`
  - `upsert`
  - `delete`
  - `deleteMany`
- Required write controls:
  - `allow: { mutating: true }`
  - non-empty `writes.allowTools`
  - `writes.audit.write`
- Two-step write protocol:
  - call with `dryRun: true`
  - receive `preview` and `previewToken`
  - commit with the same write args plus `previewToken`
- One-use in-memory preview tokens with TTL and argument hash binding.
- Large-impact write confirmation through `confirmLargeImpact: true`.
- Fail-closed commit audit: if the commit-attempt audit event fails, the database write does not run.
- `examples/03b-prisma-writes` demonstrating SQLite + Prisma writes.

### Guardrails

- `updateMany` and `deleteMany` reject empty `where`.
- `update`, `upsert`, and `delete` require unique-only `where`.
- `create` inputs account for Prisma default/generated fields.
- `update` inputs exclude id, unique, generated, and `@updatedAt` fields by default.
- Raw SQL remains permanently unavailable.

## v0.2.1 — Version-Line Sync

v0.2.1 is a no-behavior-change patch release used to catch all publishable packages up to the same alpha version line at that time.

### Changed

- `@bridgent/core` and `@bridgent/source-prisma` were bumped to `0.2.1`.
- `@bridgent/cli`, `@bridgent/source-openapi`, and `@bridgent/source-drizzle` also received no-op patch releases.
- No runtime behavior, API surface, source adapter behavior, or documentation-site routing changed in this release.

## v0.2.0 — Onboarding, Auth, and Drizzle

v0.2.0 improves first-run onboarding and expands shipped source adapters without changing the core runtime model.

### Added

- `bridgent init [file] [--force]`
  - generates an editable starter server file
  - protects existing files by default
  - supports custom output paths
- OpenAPI API-key auth support:
  - header
  - query parameter
  - cookie
- `@bridgent/source-drizzle@0.2.0`
  - read-only `findMany` tools
  - limit/defaultLimit guardrails
  - table filtering
  - no raw SQL and no write tools
- Prisma write-side design, later implemented in `@bridgent/source-prisma@0.2.2`.

### Kept Deferred

- `bridgent expose`
- tRPC source adapter
- GraphQL source adapter
- Custom Bridgent Inspector UI
- Hosted control plane

## v0.1 — First Public Alpha

v0.1 established the runtime and package foundation.

### Sources

- Hand-written Zod tools through `@bridgent/core`.
- OpenAPI 3.x tools through `@bridgent/source-openapi`.
- Prisma 6.x read tools through `@bridgent/source-prisma`.

### Transports

- stdio through `createStdioServer`.
- Streamable HTTP through `createHttpServer`.
- Web Standard fetch handler through `createWebHandler`.

### CLI

- `bridgent dev <file>`
- `bridgent serve <file>`
- `bridgent inspect <file>`

### Compatibility and Safety

- Node `>= 22.18`.
- ESM-only packages.
- Protocol-level host harness for MCP 1.x clients.
- Prisma read guardrails:
  - row caps
  - soft query timeout
  - `Bytes` field stripping
  - raw SQL disabled
- OpenAPI read-only by default with Bearer auth baseline.

## Current Roadmap

Next likely areas:

- tRPC source adapter.
- GraphQL source adapter.
- improved Inspector UX.
- hosted control plane.
