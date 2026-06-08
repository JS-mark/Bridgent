# What is Bridgent AI?

**Bridgent AI** turns the definitions you already have into production-ready **MCP servers**. The current v0.2.x alpha ships four source paths:

- OpenAPI 3.x specs
- Prisma 6.x schemas
- Drizzle tables
- Hand-written Zod tools

tRPC and GraphQL remain on the source roadmap.

Once exposed, the resulting server is immediately usable from any MCP host — Claude Code, Codex, Cursor, Gemini CLI, the official Inspector, or anything else that speaks the protocol.

## Why does this exist?

Writing an MCP server from scratch means learning the SDK, designing JSON schemas, threading auth, and shipping a binary. For most teams the value/effort tradeoff is poor — so they don't ship one, and their data stays invisible to AI agents.

Bridgent AI collapses the effort to zero by **reusing the schema you already have**:

| You already have | Bridgent AI gives you |
|---|---|
| `prisma.schema` | `find` / `findMany` / `aggregate` / `count` tools, read-only by default, with optional audited writes |
| `openapi.json` | One MCP tool per operation, read-only by default, with Bearer and API-key auth support |
| Zod schema + function | A complete MCP server, packaged for npm |
| Drizzle tables | Read-only `findMany` tools with row caps |

## What Bridgent AI is *not*

- **Not** another LangChain. No prompts, chains, memory, or agent runtime.
- **Not** a SaaS. Bridgent AI runs locally next to your code.
- **Not** locked to a single framework, like nestia. Cross-source by design.

## Status

**Current v0.2.x alpha** ships:

- **Sources**: Zod (hand-written tools), OpenAPI 3.x specs, Prisma 6.x schemas (read-only by default, audited writes opt-in), Drizzle tables (read-only)
- **Transports**: stdio, Streamable HTTP, runtime-agnostic Web Standard fetch handler
- **CLI**: `bridgent init`, `bridgent dev`, `bridgent serve`, `bridgent inspect`
- **Cross-host harness** verifying any MCP 1.x compliant client can consume the server

Recent v0.2/v0.2.x work added `bridgent init`, OpenAPI API-key auth, Drizzle read tools, and audited Prisma write tools behind explicit allowlists and preview tokens. Roadmap after that: tRPC / GraphQL sources, richer Prisma write helpers, improved inspector UX, hosted control plane.
