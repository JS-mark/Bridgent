# What is Bridgent AI?

**Bridgent AI** turns any of the following into a production-ready **MCP server** with a single command:

- OpenAPI 3.1 specs
- Prisma / Drizzle schemas
- tRPC routers
- GraphQL schemas
- Hand-written Zod tools

Once exposed, the resulting server is immediately usable from any MCP host — Claude Code, Codex, Cursor, Gemini CLI, the official Inspector, or anything else that speaks the protocol.

## Why does this exist?

Writing an MCP server from scratch means learning the SDK, designing JSON schemas, threading auth, and shipping a binary. For most teams the value/effort tradeoff is poor — so they don't ship one, and their data stays invisible to AI agents.

Bridgent AI collapses the effort to zero by **reusing the schema you already have**:

| You already have | Bridgent AI gives you |
|---|---|
| `prisma.schema` | `find` / `findMany` / `aggregate` / `count` tools, read-only by default, with row caps |
| `openapi.json` | One MCP tool per operation, with auth (Bearer / API key / OAuth2 PKCE) |
| `appRouter` (tRPC) | One tool per procedure, fully typed |
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

Roadmap: Drizzle / tRPC / GraphQL sources, write-side Prisma + audit log, branded inspector UI, hosted Cloud edition.
