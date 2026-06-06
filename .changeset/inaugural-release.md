---
"@bridgent/cli": minor
"@bridgent/core": minor
"@bridgent/source-openapi": minor
"@bridgent/source-prisma": minor
---

🎉 **First public alpha of Bridgent AI** — expose any existing API, database, or code as a production-ready MCP server in one line.

**Sources** (3): hand-written Zod tools, OpenAPI 3.x specs, Prisma 6.x schemas (read-only with row caps, query timeouts, and Bytes-field stripping).

**Transports** (3): stdio, Streamable HTTP, and runtime-agnostic Web Standard fetch handler — same tools across Node, Cloudflare Workers, Deno, Bun, and any Vercel-Edge-style runtime.

**CLI** (3 commands): `bridgent dev`, `bridgent serve`, `bridgent inspect`.

**Cross-host verified** by a protocol-level harness against the official MCP SDK Client — equivalent to any 1.x-compliant host (Claude Code, Cursor, OpenAI Codex CLI, Gemini CLI).
