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

## v0.2.4 Increment: Prisma Relation Write Inputs

`@bridgent/source-prisma@0.2.4` closes the most immediate relation-write gap:

- `create`, `update`, and `upsert` data accept one-level relation `connect` and shallow nested `create`.
- `createMany` and `updateMany` remain scalar-only because Prisma does not support nested writes there.
- Relation reads through `include` remain deferred.

## v0.3 Planned Scope

v0.3 should continue the runtime/API-first strategy by adding one high-value source adapter and the metadata needed to make larger source surfaces understandable.

The primary v0.3 theme is **type-preserving application-code exposure**:

- Add `@bridgent/source-trpc` so teams can expose existing tRPC routers as MCP tools without rewriting procedures as hand-written Zod tools.
- Add source/tool metadata that helps hosts, docs, and a future inspector explain where tools came from, whether they are read-only or mutating, and what safety controls apply.
- Keep all changes compatible with the existing explicit server-file model. Users should still compose adapters in code.

### v0.3.0: tRPC Source Adapter MVP

`@bridgent/source-trpc` should support a narrow but useful tRPC v10/v11 router surface:

- Input:
  - `fromTrpc({ router, createContext?, toolPrefix?, procedureFilter?, allow? })`
  - Router can be imported from the user's existing app package.
  - `createContext` can be sync or async and receives a minimal invocation context.
- Procedure mapping:
  - `query` procedures become read tools.
  - `mutation` procedures are disabled by default.
  - Mutations require an explicit opt-in, ideally `allow.mutating: true` plus a procedure allowlist.
  - `subscription` procedures are not exposed in the first release because MCP tool calls are request/response.
- Tool naming:
  - Stable names derived from router path, for example `trpc_user_getById`.
  - Optional `toolPrefix` for multi-source servers.
  - Collision detection should throw during tool generation.
- Schemas:
  - Reuse tRPC procedure input parsers where possible.
  - Zod-backed inputs should preserve generated MCP input schemas.
  - Unsupported or opaque input parsers should fail clearly instead of generating permissive `any` inputs.
- Execution:
  - Calls should execute through the router caller API, not HTTP round-trips.
  - Procedure errors should map to clear MCP text results or structured errors following existing Bridgent patterns.
  - Non-string results should continue to be JSON-stringified by the shared core wrapper.
- Safety:
  - No mutation exposure by default.
  - No subscriptions in v0.3.0.
  - No implicit auth bypass. Context creation remains the host app's responsibility.
- Example:
  - Add `examples/06-trpc-router` with at least one query and one disabled-by-default mutation.
- Docs:
  - Add package README.
  - Add VitePress English and Chinese `From tRPC` pages.
  - Update source overview, changelog, roadmap, and getting-started next steps.

### v0.3.1: Source Capability Metadata

After the tRPC MVP works, add a small shared metadata contract that adapters can attach to generated tools:

- Source identity:
  - source kind: `zod`, `openapi`, `prisma`, `drizzle`, `trpc`
  - optional source name / namespace
  - original operation path, model name, table name, or procedure path
- Capability flags:
  - read-only vs mutating
  - requires auth/context
  - has audit
  - has preview token
  - row/output limits when applicable
- Intended consumers:
  - docs examples
  - `bridgent inspect` output hints
  - future custom inspector UI
  - future policy DSL

This should be additive. Existing adapters must keep returning normal `BridgentTool[]`.

### v0.3.2: Inspector and CLI Hints

Do not build a full custom inspector in v0.3. Instead, improve developer feedback around the official Inspector:

- `bridgent inspect` should print grouped source/tool hints before opening the official MCP Inspector when metadata is available.
- Add copyable host configuration snippets for stdio and HTTP paths.
- Surface warnings for risky generated surfaces, such as:
  - mutating tools enabled
  - missing audit for a source that supports writes
  - very large generated tool count

### v0.3 Explicit Non-Goals

- No hosted control plane.
- No Bridgent Hub, package index, or private registry.
- No GraphQL source adapter unless a concrete integration user appears before v0.3 starts.
- No tRPC subscriptions.
- No generic policy DSL enforcement engine.
- No OAuth2 PKCE platform flow.
- No recursive Prisma relation graph writes.
- No Prisma 7 support unless Prisma 7 adoption becomes a blocker for active users.
- No change to ESM-only packaging or the explicit server-file runtime model.

### v0.3 Acceptance Criteria

v0.3 is complete when:

- `@bridgent/source-trpc` can expose a real tRPC router query as an MCP tool.
- tRPC mutations remain hidden unless explicitly allowlisted.
- Unsupported input parser shapes fail with actionable errors.
- A runnable tRPC example is covered by tests.
- Existing full gate still passes: `pnpm turbo run build test typecheck lint`.
- Public docs clearly state shipped vs roadmap sources in English and Chinese.
- Changelog entries use real package versions, not generic `0.3.x` placeholders.

## v0.4+ Ecosystem

These are real product directions, but they should not block source/runtime adoption:

- GraphQL source adapter, after a concrete integration target is chosen
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
