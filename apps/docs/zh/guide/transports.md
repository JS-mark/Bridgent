# 传输层

Bridgent 为同一份工具列表支持两种传输层:

| 传输层 | API | 何时使用 |
|---|---|---|
| **stdio** | `createStdioServer` | 本地 IDE-agent 集成(Claude Code / Cursor / Codex / Gemini CLI) |
| **HTTP(Streamable)** | `createHttpServer` | 自托管 Node、无头探查 |
| **Web Handler** | `createWebHandler` | Cloudflare / Deno / Bun / Vercel Edge —— 任何带 fetch handler 的运行时 |

这三种都包装同一份 `BridgentTool[]` —— 切换只是换一个工厂函数。

## stdio

默认选项。CLI:`bridgent dev <file>`。

```ts
import { createStdioServer, defineTool } from '@bridgent/core'

await createStdioServer({
  name: 'hello',
  version: '0.0.1',
  tools: [/* ... */],
})
```

## HTTP

构建在 MCP 1.x 的 [Streamable HTTP](https://modelcontextprotocol.io/) 规范之上 —— 单一端点同时处理普通的 JSON-RPC POST **以及** SSE 风格的流式响应。

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

CLI:`bridgent serve <file>`。

### 有状态 vs 无状态

- **stateful**(默认):服务器为每个客户端生成一个 `Mcp-Session-Id` cookie/header;后续请求必须回传它。官方 MCP Inspector 与 Claude Code 的 HTTP 传输模式都需要这个。
- **stateless**:不跟踪会话;每个请求互相独立。在 Cloudflare Workers、Vercel Edge、AWS Lambda 等会话状态无法常驻进程的地方使用。

### 基于 Node 内置 HTTP

Bridgent **不**引入 Express、Hono 或 Fastify。`createHttpServer` 只是 Node 内置 `http.createServer` 加上 MCP SDK 的 `StreamableHTTPServerTransport` 的薄封装。

如果你需要鉴权、限流或 TLS,把 Bridgent 挂在反向代理后面(Caddy / nginx / Cloudflare)—— Bridgent 是有意设计成单一职责的服务器。

## Web Handler

`createWebHandler` 返回一个与运行时无关的 fetch handler —— 与现代 Web 平台普遍说的 `(Request) => Promise<Response>` 形状一致。可以直接放进 Cloudflare Workers、Deno Deploy、Bun、Vercel Edge,或任何接受 fetch handler 的框架。

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

### Hono(任意运行时)

```ts
import { Hono } from 'hono'
const app = new Hono()
app.all('/mcp', c => handler.fetch(c.req.raw))
export default app
```

### Web Handler 与 HTTP 的取舍

- **用 HTTP(`createHttpServer`)**:当你想要一个自托管的 Node 进程 —— `pnpm start`、systemd、pm2 的最简路径。
- **用 Web Handler(`createWebHandler`)**:当你部署到一个把 `Request` 交给你、并期待 `Response` 的 Web 平台 —— Workers、Edge、Deno、Bun。

传输协议本身一致(都是 Streamable HTTP),区别只在集成点。

### Serverless 下的 stateful

如果你的平台是请求级隔离的(Cloudflare Workers 免费版、Vercel Edge),传 `stateful: false`。否则 per-client 的 `Mcp-Session-Id` 撑不过冷启动,客户端在每次请求都会重置。
