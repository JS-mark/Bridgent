# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## What this is

Bridgent exposes existing APIs / databases / code (OpenAPI, Prisma schema, Zod functions) as production-ready **MCP servers**. Alpha shipping today:

- **Sources**: `@bridgent/core` (hand-written Zod tools), `@bridgent/source-openapi`, `@bridgent/source-prisma` (read-only), `@bridgent/source-drizzle` (read-only)
- **Transports**: stdio (`createStdioServer`), Streamable HTTP (`createHttpServer`), Web Standard fetch handler (`createWebHandler`)
- **CLI** (`bridgent`): `init` / `dev` / `serve` / `inspect`

Roadmap: `@bridgent/source-trpc` / `@bridgent/source-graphql`, Prisma write tools + audit log, hosted control plane.

Status, day-by-day decisions, and verification logs live in `docs/`:

- `docs/decisions.md` — ADRs (read this before changing build / packaging / engine choices)
- `docs/roadmap.md` — active roadmap; older proposal files are historical context
- `docs/progress.md` — dated progress log
- `docs/plans/` — per-phase plans

## Reference image rule

When the user provides an example image, reference image, screenshot, or visual target, implement against that image directly. Treat the image as the primary specification for layout, proportions, visual hierarchy, colors, icon structure, and visible details.

Do **not** produce a loose "inspired by" abstraction unless the user explicitly asks for reinterpretation. If the implementation must differ from the reference because of technical constraints, state the specific constraint and keep the deviation minimal. For SVG/logo/UI work, compare the result against the reference before claiming completion, including light and dark variants when the reference shows both.

## Commands

All tasks go through Turborepo at the root. `^build` deps mean upstream packages must build before downstream `typecheck` / `test` / `dev` can run.

```bash
pnpm install                       # workspace + catalog resolve

pnpm turbo run build               # builds core → cli → examples → docs
pnpm turbo run test                # vitest (currently core only)
pnpm turbo run typecheck           # tsc --noEmit; needs ^build first run
pnpm turbo run lint                # antfu eslint
pnpm clean                         # remove all dist / .turbo / cache

# Single-package targeting
pnpm --filter @bridgent/core test
pnpm --filter @bridgent/core test -- -t 'pattern'   # single test by name
pnpm --filter @bridgent/cli build
pnpm --filter @bridgent/core dev   # tsdown --watch

# Docs site
pnpm docs:dev                      # vitepress dev
pnpm docs:build

# Run the CLI against a server file
node packages/cli/dist/cli.mjs init ./server.ts
node packages/cli/dist/cli.mjs dev examples/01-zod-hello/server.ts
# or, after `pnpm install` links the workspace bin:
pnpm --filter @bridgent-examples/01-zod-hello exec bridgent dev ./server.ts
```

Engines are strict (`engines-strict=true` in `.npmrc`): **Node ≥ 22.18** and **pnpm ≥ 10**. Lower versions fail at install. Registry is pinned to `registry.npmmirror.com` in `.npmrc`.

## Architecture

### Monorepo layout

```
apps/docs              VitePress site (public docs)
packages/core          @bridgent/core — MCP runtime + Zod tool wrapper
packages/cli           @bridgent/cli — CLI package; binary name is `bridgent`
packages/source-drizzle @bridgent/source-drizzle — Drizzle read-only source adapter
examples/              executable examples used as smoke tests
docs/                  internal AI progress archive (NOT published)
```

Three workspace globs in `pnpm-workspace.yaml`: `apps/*`, `packages/*`, `examples/*`. All dependency versions are managed via the **pnpm catalog** (single source of truth — never bump versions in individual `package.json`s, edit `pnpm-workspace.yaml` `catalog:`).

### `@bridgent/core` data flow

The contract is intentionally narrow. The full export surface (`packages/core/src/index.ts`):

1. `defineTool({ name, description?, inputSchema: ZodObject, run })` — identity function for type inference (`packages/core/src/define-tool.ts`).
2. `createStdioServer({ name, version, tools })` — wires tools into MCP SDK 1.29's `McpServer.registerTool` and connects a `StdioServerTransport` (`packages/core/src/server.ts`).
3. `createHttpServer({ name, version, tools, port?, path?, host?, stateful? })` — same registration over Streamable HTTP using Node's built-in `http.createServer` (`packages/core/src/http.ts`). Defaults: port 3333, path `/mcp`, host `127.0.0.1`, stateful.
4. `createWebHandler({ name, version, tools, stateful? })` — runtime-agnostic `(Request) => Promise<Response>` handler for Cloudflare / Deno / Bun / Vercel Edge / Hono (`packages/core/src/web.ts`).
5. `registerTools(mcpServer, tools)` — shared helper used by all three transports; stringifies non-string `run` results into `{ content: [{ type: 'text', text }] }`.

The wrapper passes `inputSchema.shape` (Zod v4 raw shape) to `registerTool`.

Key invariants (these are load-bearing — see `docs/decisions.md`):

- **MCP SDK is `dependencies`, Zod is `peerDependencies`.** SDK is `external` in tsdown so the bundle stays small and SDK transitives (hono / express / ajv / jose) don't get inlined. See ADR-004.
- **ESM-only output, no CJS.** `tsdown` produces `dist/*.mjs` + `*.d.mts` only. ADR-003.
- **Zod v4 only** in catalog; `zodObject.shape` works under v4 — don't reach for v3 helpers. ADR-008.

### `bridgent` CLI

`packages/cli` is published as **`@bridgent/cli`**; the installed binary is still `bridgent`. Built by tsdown with banner `#!/usr/bin/env node`; tsdown auto-grants +x on the bin output (no chmod needed — ADR's R5). See ADR-027.

`bridgent init [file]` (`packages/cli/src/commands/init.ts`) writes a minimal editable `server.ts` using `@bridgent/core`, Zod, and `createStdioServer`. It creates parent directories, refuses to overwrite by default, and accepts `--force` for explicit replacement. It does **not** install dependencies or create a hidden config model.

`bridgent dev <file>` (`packages/cli/src/commands/dev.ts`) spawns a child Node process running the user file directly. For `.ts/.tsx/.mts` it adds `--experimental-strip-types --no-warnings=ExperimentalWarning` — i.e. **no `tsx` dependency, no compile step, requires Node 22.18+**. ADR-006. If strip-types breaks under workspace links, fallback documented in ADR-006 is to add `tsx` and exec it.

CLI deps that must stay `external` in tsdown: `@bridgent/core`, `@modelcontextprotocol/sdk` (+ subpaths), `zod`, `citty`, `consola`.

### TypeScript config

- Single root `tsconfig.json` excludes only build outputs (no `files`/`include`); each package has its own `tsconfig.json` extending `tsconfig.base.json`.
- **No project references / `composite`.** ADR-005. `typecheck` consumes upstream packages' emitted `.d.mts`, so it depends on `^build` in `turbo.json`. First time on a fresh checkout you must `pnpm turbo run build` once before `typecheck` works. `pnpm dev` (tsdown watch) keeps the dts fresh during development.
- `noUncheckedIndexedAccess` and `verbatimModuleSyntax` are on — keep type-only imports as `import type` and guard array index access.

### Linting

`eslint.config.ts` uses `@antfu/eslint-config` with `type: 'lib'`, TS + Vue + Markdown enabled. The `antfu/no-top-level-await` rule fires on example files using top-level `await createStdioServer(...)`; the existing pattern is a file-local `// eslint-disable-next-line` comment (see `examples/01-zod-hello/server.ts`). Don't disable the rule globally — when source-* packages land they shouldn't need it.

### Known soft spots

- `@rolldown/binding-darwin-arm64` is pinned in root devDeps as a workaround for flaky optional-dep resolution on weak networks (ADR R7). To be replaced with pnpm `supportedArchitectures`.
- Vitest is held at `^3.2.6` because Vitest 4 conflicts with VitePress 1.x's vite peer (ADR R8). Don't bump until VitePress 2.x lands.

## Conventions when adding a new package

- Add it under `packages/` (lib, scoped `@bridgent/*`) or `apps/` (app).
- Use catalog references (`"zod": "catalog:"`) — never hardcode versions.
- Mirror `packages/core/tsdown.config.ts` for libs: ESM-only, `target: 'node22'`, `clean: true`, mark MCP SDK / zod / workspace siblings as `neverBundle`.
- Add `build` / `dev` / `test` / `typecheck` / `lint` scripts so Turborepo picks them up automatically.
- Verify with the full pipeline before claiming done: `pnpm turbo run build test typecheck lint` — the `progress.md` log treats this as the gate.
