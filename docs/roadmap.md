# Bridgent AI Roadmap

This is the current planning source for Bridgent AI. Older proposal files are historical market research and should not be treated as the active scope.

## Current Position

Bridgent AI exposes existing APIs, databases, and code as MCP servers. The alpha is intentionally runtime/API-first: users compose source adapters in a server file, then run that file through the CLI or host configuration.

The product is **not** trying to become an agent framework. It does not own prompts, memory, planning, chains, or model orchestration.

## v0.1 Alpha

v0.1 is the first public alpha and should stay narrow:

- Sources:
  - Hand-written Zod tools via `@bridgent/core`
  - OpenAPI 3.x via `@bridgent/source-openapi`
  - Prisma 6.x read-side tools via `@bridgent/source-prisma`
- Transports:
  - stdio via `createStdioServer`
  - Streamable HTTP via `createHttpServer`
  - Web Standard fetch handler via `createWebHandler`
- CLI:
  - `bridgent dev <file>`
  - `bridgent serve <file>`
  - `bridgent inspect <file>` as a thin wrapper around the official MCP Inspector
- Verification:
  - Protocol-level host harness for stdio, HTTP, and Web handler
  - Host configuration docs for Claude Code, Cursor, Codex, and Gemini CLI
- Packaging:
  - Publishable packages are `@bridgent/cli`, `@bridgent/core`, `@bridgent/source-openapi`, and `@bridgent/source-prisma`
  - The installed CLI binary remains `bridgent`

v0.1 does **not** include `bridgent init`, `bridgent expose`, a custom inspector UI, OAuth flows, Prisma writes, Drizzle, tRPC, GraphQL, a hosted control plane, or a real GUI-driven host test suite.

## v0.2.0 Completed Scope

v0.2.0 improves onboarding and closes the most visible source/auth/design gaps without changing the core runtime shape:

- `bridgent init [file] [--force]` generates an editable starter server file.
- OpenAPI API-key auth supports header, query, and cookie locations.
- `@bridgent/source-drizzle` exposes read-only `findMany` tools with row caps and no raw SQL.
- Prisma write-side design is documented in `docs/design/prisma-writes-v0.2.md`.
- Custom Inspector UI remains deferred; `bridgent inspect` continues to use the official Inspector.
- Publishable packages are now `@bridgent/cli`, `@bridgent/core`, `@bridgent/source-openapi`, `@bridgent/source-prisma`, and `@bridgent/source-drizzle`.

## v0.2.2 Increment: Prisma Writes

`@bridgent/source-prisma` now implements audited write tools as a follow-up to the v0.2 design:

- `create`, `createMany`, `update`, `updateMany`, `upsert`, `delete`, and `deleteMany` can be generated.
- Writes require `allow.mutating: true`, `writes.allowTools`, and `writes.audit.write`.
- `allow.mutating: true` without `writes` throws instead of silently exposing or dropping writes.
- Write commits require a two-step `dryRun` / `previewToken` protocol.
- Preview tokens are in-memory, one-use, time-limited, and bound to the final tool name plus write args hash.
- `updateMany` / `deleteMany` reject empty `where`; `update` / `upsert` / `delete` require unique-only `where`.
- `create` inputs account for Prisma default/generated fields; `update` inputs exclude id/unique/generated/updatedAt fields by default.
- Large-impact previews require `confirmLargeImpact: true` on commit.
- Audit is fail-closed before commit and records attempted/final commit status.
- `examples/03b-prisma-writes` demonstrates the pattern against SQLite.

## v0.2.3 Increment: Prisma Writes Hardening

`@bridgent/source-prisma@0.2.3` hardens the v0.2.2 write path:

- `createJsonlAuditSink({ path })` provides a built-in local JSONL audit sink.
- Optional `idempotencyKey` deduplicates same-process in-flight commits and caches successful commit results for host retry safety.

Next refinements, if needed:

- More complete create/update input schema coverage for relation connects.

## v0.2 Priorities

v0.2 should improve onboarding and close the most visible source gaps without changing the core runtime shape.

1. **CLI onboarding**
   - Done in v0.2 development: `bridgent init` generates a minimal `server.ts` and install/config hints.
   - Consider `bridgent expose --from <source>` only after the config model is settled. It should generate or edit a server file, not hide the runtime model behind magic.

2. **Source expansion**
   - Done in v0.2 development: `@bridgent/source-drizzle` exposes read-only `findMany` tools with row caps and no raw SQL.
   - Add `@bridgent/source-trpc` if framework users need type-preserving procedure exposure.
   - Keep GraphQL after Drizzle/tRPC unless there is a concrete integration user; its auth, operation selection, and schema-size tradeoffs are larger.

3. **Prisma write-side design**
   - Do not add writes as a simple `allow.mutating: true` toggle.
   - Done in v0.2 development: write-side design documented in `docs/design/prisma-writes-v0.2.md`.
   - Done as a v0.2.2 increment: audited runtime write tools behind explicit allowlist + preview token.

4. **OpenAPI auth**
   - Keep Bearer support as v0.1 baseline.
   - Done in v0.2 development: API-key auth supports header, query, and cookie.
   - Treat OAuth2 PKCE as a later feature unless a real SaaS integration requires it.

5. **Inspector improvements**
   - Keep `bridgent inspect` on the official Inspector for v0.1/v0.2 unless a custom UI is clearly cheaper than extending docs and examples.
   - If a custom inspector is built, focus it on source grouping, auth hints, Prisma trace/audit visibility, and copyable host config.

## v0.3+ Ecosystem

These are real product directions, but they should not block source/runtime adoption:

- Bridgent Hub or package index
- Private registry or team catalog
- Hosted control plane
- OTel/Langfuse/Grafana trace export
- Policy DSL with max rows, allowed tools, auth requirements, and per-host budgets
- Python SDK or bridge

## Explicit Non-Goals

- No prompt/chain/memory/agent runtime.
- No raw SQL exposure by default.
- No GUI automation as the main compatibility claim; protocol-level harness remains the CI contract.
- No custom web framework dependency in core HTTP transport.
- No CJS output unless there is strong user demand for a separate compatibility package.

## Planning Rules

- ADRs in `docs/decisions.md` are binding until superseded by a newer ADR.
- `docs/progress.md` records what happened; it is not the active plan.
- `docs/plans/` files are historical execution plans.
- Public docs must not claim roadmap sources are shipped.
- Release and install docs must refer to `@bridgent/cli` as the npm package and `bridgent` as the binary.
