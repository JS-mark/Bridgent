# Roadmap calibration design

- Date: 2026-06-07
- Scope: planning docs, public roadmap copy, release docs, and agent guidance
- Trigger: v0.1 alpha scope and CLI package naming changed after the original proposal; planning sources drifted from implementation.

## 1. Background

The original proposal positioned v0.1 as a broad product launch with `init`, `expose`, Drizzle, tRPC, OAuth2, a custom inspector UI, and real host automation. The repository evolved into a narrower and more realistic alpha:

- Zod / OpenAPI / Prisma read-only source paths
- stdio / Streamable HTTP / Web Standard transports
- thin CLI commands: `dev`, `serve`, `inspect`
- protocol-level host harness instead of GUI host automation
- official Inspector wrapper instead of a custom inspector
- npm package `@bridgent/cli` with binary `bridgent`

The code and release setup had moved, but multiple planning and public docs still used the old proposal language. That creates two risks:

- Users see features in public docs that are not shipped.
- Future agents and contributors follow historical plans instead of the current roadmap.

## 2. Goals

Create one current planning source and update high-impact docs to point at it.

Required outcomes:

1. `docs/roadmap.md` becomes the active planning source.
2. `docs/decisions.md` records CLI package naming as a superseding ADR.
3. Public docs distinguish shipped alpha capabilities from roadmap items.
4. Release docs use `@bridgent/cli` as the npm package and `bridgent` only as the binary.
5. Agent guidance (`AGENTS.md`, `CLAUDE.md`) points to the active roadmap and uses current package names.
6. Historical files under `docs/plans/` and `docs/superpowers/` remain historical unless explicitly superseded.

## 3. Non-goals

- No implementation changes to runtime packages.
- No new source adapter work.
- No custom inspector work.
- No rewrite of archived proposal documents.
- No attempt to make old `docs/plans/` files internally current; they are execution history.

## 4. Current Product Definition

### v0.1 alpha shipped surface

- Sources:
  - `@bridgent/core` for hand-written Zod tools
  - `@bridgent/source-openapi` for OpenAPI 3.x
  - `@bridgent/source-prisma` for Prisma 6.x read-side tools
- Transports:
  - `createStdioServer`
  - `createHttpServer`
  - `createWebHandler`
- CLI:
  - `bridgent dev <file>`
  - `bridgent serve <file>`
  - `bridgent inspect <file>`
- Package/binary naming:
  - npm package: `@bridgent/cli`
  - binary: `bridgent`

### v0.1 explicitly not shipped

- `bridgent init`
- `bridgent expose`
- Drizzle / tRPC / GraphQL sources
- OAuth2 / PKCE / generic API-key auth
- Prisma writes
- custom inspector UI
- hosted control plane
- GUI host automation

## 5. Roadmap Rules

The active roadmap should follow this priority model:

1. Fix install/onboarding friction before adding more surface.
2. Add source adapters only when their safety model is clear.
3. Treat writes as a separate product design problem, not a boolean toggle.
4. Keep official Inspector integration unless custom UI unlocks source-specific value.
5. Use protocol-level harness as the compatibility contract.
6. Public docs must never claim roadmap sources are shipped.

## 6. Planned Roadmap Shape

### v0.2

- CLI onboarding:
  - `bridgent init`
  - generated starter `server.ts`
  - optional `expose --from` only after config semantics are clear
- Source expansion:
  - Drizzle first if database-read demand is strongest
  - tRPC first if typed framework adoption is the stronger pull
  - GraphQL after a concrete integration target exists
- OpenAPI auth:
  - API-key/header auth before OAuth2
  - OAuth2 PKCE only when backed by a real SaaS integration
- Prisma writes:
  - audit log
  - explicit allowlist
  - dry-run/preview where possible

### v0.3+

- Bridgent Hub / package index
- private registry / team catalog
- hosted control plane
- OTel trace export
- policy DSL
- Python SDK or bridge

## 7. Files to Update

### New

```
docs/roadmap.md
docs/superpowers/specs/2026-06-07-roadmap-calibration-design.md
docs/superpowers/plans/2026-06-07-roadmap-calibration.md
```

### Modified

```
README.md
AGENTS.md
CLAUDE.md
docs/README.md
docs/decisions.md
docs/progress.md
docs/release-checklist.md
apps/docs/index.md
apps/docs/zh/index.md
apps/docs/guide/getting-started.md
apps/docs/zh/guide/getting-started.md
apps/docs/guide/what-is-bridgent.md
apps/docs/zh/guide/what-is-bridgent.md
apps/docs/guide/inspect.md
apps/docs/zh/guide/inspect.md
apps/docs/zh/guide/hosts/claude-code.md
```

## 8. Validation

Required validation:

- `pnpm --filter @bridgent/docs lint`
- `pnpm --filter @bridgent/docs build`
- search public docs for stale install/package claims:
  - `pnpm add -D bridgent`
  - `pnpm i -g bridgent`
  - shipped claims for Drizzle / tRPC / GraphQL
  - shipped claims for API key / OAuth2

Full repository validation is not required for this planning-only task unless runtime files are edited in the same working tree.
