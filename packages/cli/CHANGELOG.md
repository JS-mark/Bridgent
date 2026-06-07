# @bridgent/cli

## 0.2.1

### Patch Changes

- Updated dependencies [c5eebf2]
  - @bridgent/core@0.2.1

## 0.2.0

### Minor Changes

- [#2](https://github.com/JS-mark/Bridgent/pull/2) [`0e99db0`](https://github.com/JS-mark/Bridgent/commit/0e99db036f224a666463d013d97071e39cfa6b93) Thanks [@JS-mark](https://github.com/JS-mark)! - Add `bridgent init [file] [--force]` to generate an editable starter MCP server file.

### Patch Changes

- [#2](https://github.com/JS-mark/Bridgent/pull/2) [`54c9773`](https://github.com/JS-mark/Bridgent/commit/54c9773773bb091b4f9dfe0532db55b3e97f1f38) Thanks [@JS-mark](https://github.com/JS-mark)! - Complete v0.2 scope with atomic `bridgent init` writes, OpenAPI API-key auth, and a read-only Drizzle source adapter.

## 0.1.0

### Minor Changes

- [`7fb3aeb`](https://github.com/JS-mark/Bridgent/commit/7fb3aeb8d84b375ec45e03a7d6f20a340650f846) Thanks [@JS-mark](https://github.com/JS-mark)! - 🎉 **First public alpha of Bridgent AI** — expose any existing API, database, or code as a production-ready MCP server in one line.

  **Sources** (3): hand-written Zod tools, OpenAPI 3.x specs, Prisma 6.x schemas (read-only with row caps, query timeouts, and Bytes-field stripping).

  **Transports** (3): stdio, Streamable HTTP, and runtime-agnostic Web Standard fetch handler — same tools across Node, Cloudflare Workers, Deno, Bun, and any Vercel-Edge-style runtime.

  **CLI** (3 commands): `bridgent dev`, `bridgent serve`, `bridgent inspect`.

  **Cross-host verified** by a protocol-level harness against the official MCP SDK Client — equivalent to any 1.x-compliant host (Claude Code, Cursor, OpenAI Codex CLI, Gemini CLI).

### Patch Changes

- Updated dependencies [[`7fb3aeb`](https://github.com/JS-mark/Bridgent/commit/7fb3aeb8d84b375ec45e03a7d6f20a340650f846)]:
  - @bridgent/core@0.1.0
