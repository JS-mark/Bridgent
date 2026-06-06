# 传输层

Bridgent 为同一份工具列表支持两种传输层:

| 传输层 | API | 何时使用 |
|---|---|---|
| **stdio** | `createStdioServer` | 本地 IDE-agent 集成(Claude Code / Cursor / Codex / Gemini CLI) |
| **HTTP(Streamable)** | `createHttpServer` | 共享服务、无头探查、未来的 Cloud / serverless 部署 |

两者包装的都是同一份 `BridgentTool[]` —— 切换只是换一个工厂函数。

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
