<p align="center">
  <img src="./assets/logo-color.svg" alt="Bridgent logo" width="96" height="96" />
</p>

# Bridgent AI

> Expose your existing APIs, databases, and code as production-ready MCP servers in one line.

One command turns your existing OpenAPI / SQL Schema / Prisma / Drizzle / tRPC / Zod into an **MCP Server**,
instantly usable from any MCP host such as Claude Code, Codex, Cursor, or Gemini CLI.

[![npm](https://img.shields.io/npm/v/@bridgent/cli.svg)](https://www.npmjs.com/package/@bridgent/cli)
[![License](https://img.shields.io/npm/l/@bridgent/cli.svg)](./LICENSE)
[![Docs](https://img.shields.io/badge/docs-bridgent.ai-0aa)](https://bridgent.ai)

**Website**: [https://js-mark.com/Bridgent](https://js-mark.com/Bridgent)

**Languages**: **English** | [简体中文](./README.zh-CN.md)

![Bridgent demo](./assets/demo.gif)

> _One server, four hosts — placeholder above. See [`docs/recording.md`](./docs/recording.md) for how the GIF gets produced._

## Status

🚧 **Alpha** — current capabilities:

- **Sources**: hand-written **Zod** tools, **OpenAPI 3.x** specs, **Prisma 6.x** schemas (read-only), **Drizzle** tables (read-only)
- **Transports**: **stdio**, **Streamable HTTP**, and runtime-agnostic **Web Standard fetch handler** (Cloudflare / Deno / Bun)
- **CLI**: `bridgent init`, `bridgent dev`, `bridgent serve`, `bridgent inspect`
- **Hosts verified by protocol-level harness**: Claude Code, Cursor, Codex, Gemini CLI (any 1.x-compliant MCP client)

Roadmap: tRPC / GraphQL sources, write-side Prisma implementation + audit log, improved inspector UX, hosted control plane.

## Quick start

```bash
# Requires Node >= 22.18
pnpm add -D @bridgent/cli @bridgent/core zod
bridgent init ./server.ts
```

```ts
// Or write server.ts yourself:
import { createStdioServer, defineTool } from '@bridgent/core'
import { z } from 'zod'

await createStdioServer({
  name: 'hello',
  version: '0.0.1',
  tools: [
    defineTool({
      name: 'add',
      description: 'Add two numbers',
      inputSchema: z.object({ a: z.number(), b: z.number() }),
      run: ({ a, b }) => a + b,
    }),
  ],
})
```

```bash
bridgent dev ./server.ts
```

## Hosts

Each IDE-agent has a one-paragraph copy-paste config in the docs:

- [Claude Code](./apps/docs/guide/hosts/claude-code.md)
- [Cursor](./apps/docs/guide/hosts/cursor.md)
- [OpenAI Codex CLI](./apps/docs/guide/hosts/codex.md)
- [Gemini CLI](./apps/docs/guide/hosts/gemini-cli.md)

## Repo structure

```
apps/docs              VitePress site
packages/core          MCP runtime + Zod→tool wrapper
packages/cli           bridgent CLI
examples/              Usage examples
docs/                  AI progress archive (development docs, not published)
```

The active planning source is [`docs/roadmap.md`](./docs/roadmap.md). Older proposal and plan files are historical context.

## Development

```bash
pnpm install
pnpm turbo run build test typecheck lint
```

Required tool versions (`engines-strict=true`):

- Node `>= 22.18`
- pnpm `>= 10`

## License

[MIT](./LICENSE)
