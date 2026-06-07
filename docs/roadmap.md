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

## v0.2 Priorities

v0.2 should improve onboarding and close the most visible source gaps without changing the core runtime shape.

1. **CLI onboarding**
   - Done in v0.2 development: `bridgent init` generates a minimal `server.ts` and install/config hints.
   - Consider `bridgent expose --from <source>` only after the config model is settled. It should generate or edit a server file, not hide the runtime model behind magic.

2. **Source expansion**
   - Add `@bridgent/source-drizzle` first if database-read demand is strongest, because it can reuse the Prisma safety model: read-only, row caps, timeout, no raw SQL.
   - Add `@bridgent/source-trpc` if framework users need type-preserving procedure exposure.
   - Keep GraphQL after Drizzle/tRPC unless there is a concrete integration user; its auth, operation selection, and schema-size tradeoffs are larger.

3. **Prisma write-side design**
   - Do not add writes as a simple `allow.mutating: true` toggle.
   - Require an audit log design, explicit per-tool allowlist, dry-run preview where possible, and clear docs for destructive operations.

4. **OpenAPI auth**
   - Keep Bearer support as v0.1 baseline.
   - Add API key/header auth before OAuth2.
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
