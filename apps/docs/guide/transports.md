# Transports

Bridgent supports two transports for the same tool list:

| Transport | API | When to use |
|---|---|---|
| **stdio** | `createStdioServer` | local IDE-agent integration (Claude Code / Cursor / Codex / Gemini CLI) |
| **HTTP (Streamable)** | `createHttpServer` | shared servers, headless inspection, future Cloud / serverless deployment |

Both wrap the same `BridgentTool[]` — switching is just changing one factory.

## stdio

The default. CLI: `bridgent dev <file>`.

```ts
import { createStdioServer, defineTool } from '@bridgent/core'

await createStdioServer({
  name: 'hello',
  version: '0.0.1',
  tools: [/* ... */],
})
```

## HTTP

Built on the [Streamable HTTP](https://modelcontextprotocol.io/) spec from MCP 1.x — a single endpoint that handles plain JSON-RPC POSTs **and** SSE-style streaming responses.

```ts
import { createHttpServer, defineTool } from '@bridgent/core'

const handle = await createHttpServer({
  name: 'hello-http',
  version: '0.0.1',
  port: 3333, // default 3333
  path: '/mcp', // default '/mcp'
  host: '127.0.0.1', // default loopback only — pass '0.0.0.0' to expose
  stateful: true, // default true — set false for stateless / serverless
  tools: [/* ... */],
})

console.error(`Listening at ${handle.url}`)
// handle.close() to shut down cleanly
```

CLI: `bridgent serve <file>`.

### Stateful vs stateless

- **stateful** (default): the server generates a `Mcp-Session-Id` cookie/header per client; subsequent requests must echo it. Required for the official MCP Inspector and Claude Code's HTTP transport mode.
- **stateless**: no session tracking; every request is independent. Use this for Cloudflare Workers, Vercel Edge, AWS Lambda — anywhere session state can't live in-process.

### Built on Node's built-in HTTP

Bridgent does **not** add Express, Hono, or Fastify. `createHttpServer` is a thin wrapper around Node's built-in `http.createServer` plus the MCP SDK's `StreamableHTTPServerTransport`.

If you want auth, rate limits, or TLS, mount Bridgent behind a reverse proxy (Caddy / nginx / Cloudflare) — Bridgent is intentionally a single-responsibility server.
