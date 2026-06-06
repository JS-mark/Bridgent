# Transports

Bridgent supports three transports for the same tool list:

| Transport | API | When to use |
|---|---|---|
| **stdio** | `createStdioServer` | local IDE-agent integration (Claude Code / Cursor / Codex / Gemini CLI) |
| **HTTP (Streamable)** | `createHttpServer` | self-hosted Node, headless inspection |
| **Web Handler** | `createWebHandler` | Cloudflare / Deno / Bun / Vercel Edge — anywhere with a fetch handler runtime |

All three wrap the same `BridgentTool[]` — switching is just changing one factory.

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

## Web Handler

`createWebHandler` returns a runtime-agnostic fetch handler — the same `(Request) => Promise<Response>` shape every modern Web platform speaks. Drop it into Cloudflare Workers, Deno Deploy, Bun, Vercel Edge, or any framework that takes a fetch handler.

```ts
import { createWebHandler, defineTool } from '@bridgent/core'
import { z } from 'zod'

const handler = await createWebHandler({
  name: 'hello-web',
  version: '0.0.1',
  stateful: true, // default true; set false for serverless
  tools: [
    defineTool({
      name: 'add',
      inputSchema: z.object({ a: z.number(), b: z.number() }),
      run: ({ a, b }) => ({ sum: a + b }),
    }),
  ],
})

// handler.fetch: (request: Request) => Promise<Response>
// handler.close: () => Promise<void>
```

### Cloudflare Workers

```ts
export default {
  fetch: handler.fetch,
}
```

### Deno Deploy

```ts
Deno.serve(handler.fetch)
```

### Bun

```ts
Bun.serve({ port: 3333, fetch: handler.fetch })
```

### Vercel Edge / Next.js Route Handler

```ts
// app/mcp/route.ts
export const runtime = 'edge'
export const POST = handler.fetch
export const GET = handler.fetch
export const DELETE = handler.fetch
```

### Hono (any runtime)

```ts
import { Hono } from 'hono'
const app = new Hono()
app.all('/mcp', c => handler.fetch(c.req.raw))
export default app
```

### Web Handler vs HTTP

- **Use HTTP (`createHttpServer`)** when you want a self-hosted Node process — the simplest path for `pnpm start`, systemd, pm2.
- **Use Web Handler (`createWebHandler`)** when deploying to a Web platform that hands you a `Request` and expects a `Response` — Workers, Edge, Deno, Bun.

The transport on the wire is identical (Streamable HTTP); only the integration point differs.

### Stateful in serverless

If your platform is request-scoped (Cloudflare Workers free tier, Vercel Edge), pass `stateful: false`. Otherwise the per-client `Mcp-Session-Id` won't survive cold starts and clients will reset on every request.
