# What is Bridgent AI?

**Bridgent AI** turns the definitions you already have into production-ready **MCP servers**. v0.1 ships the first three source paths:

- OpenAPI 3.x specs
- Prisma 6.x schemas
- Hand-written Zod tools

Drizzle, tRPC, and GraphQL are on the source roadmap, not part of the current alpha.

Once exposed, the resulting server is immediately usable from any MCP host — Claude Code, Codex, Cursor, Gemini CLI, the official Inspector, or anything else that speaks the protocol.

## Why does this exist?

Writing an MCP server from scratch means learning the SDK, designing JSON schemas, threading auth, and shipping a binary. For most teams the value/effort tradeoff is poor — so they don't ship one, and their data stays invisible to AI agents.

Bridgent AI collapses the effort to zero by **reusing the schema you already have**:

| You already have | Bridgent AI gives you |
|---|---|
| `prisma.schema` | `find` / `findMany` / `aggregate` / `count` tools, read-only by default, with row caps |
| `openapi.json` | One MCP tool per operation, read-only by default, with Bearer auth support |
| Zod schema + function | A complete MCP server, packaged for npm |

## What Bridgent AI is *not*

- **Not** another LangChain. No prompts, chains, memory, or agent runtime.
- **Not** a SaaS. Bridgent AI runs locally next to your code.
- **Not** locked to a single framework, like nestia. Cross-source by design.

## Status

**v0.1 alpha** ships:

- **Sources**: Zod (hand-written tools), OpenAPI 3.x specs, Prisma 6.x schemas (read-only)
- **Transports**: stdio, Streamable HTTP, runtime-agnostic Web Standard fetch handler
- **CLI**: `bridgent dev`, `bridgent serve`, `bridgent inspect`
- **Cross-host harness** verifying any MCP 1.x compliant client can consume the server

v0.2 development adds `bridgent init` for starter server generation. Roadmap after that: Drizzle / tRPC / GraphQL sources, write-side Prisma + audit log, improved inspector UX, hosted control plane.
