# Bridgent Plan 4 — HTTP/SSE 双协议 + `bridgent serve` / `bridgent inspect`

## Context

Plan 1-3 已经把 stdio MCP server 跑稳：core 5 件套（`createStdioServer`）、CLI（`bridgent dev`）、两个 source（OpenAPI / Prisma）、三个 example 全部 e2e 通过。但目前 Bridgent 仅支持 **stdio**——只能本地 IDE-agent 子进程消费，无法支撑：

- 远端托管（Cloud / serverless）场景
- 多 client 共享一个 server（团队复用）
- 浏览器中的 inspector / web UI 调试

Plan 4 补齐两件事：

1. **HTTP/SSE 双协议**：基于 SDK 1.29 `StreamableHTTPServerTransport`，让同一份 tools 数组同时能在 stdio 与 HTTP 上提供 MCP
2. **`bridgent inspect` thin wrapper**：调用官方 `@modelcontextprotocol/inspector` + 转发到用户 server 文件——零额外依赖、与 Plan 1-3 README 已经在用的 inspector 命令一致

完成后，用户可以 `bridgent serve ./server.ts` 起一个本地 HTTP MCP（`http://localhost:3333/mcp`），或 `bridgent inspect ./server.ts` 一行调出 inspector 浏览器界面。

## 范围

| 模块 | 做什么 | 不做什么 |
|---|---|---|
| `packages/core` | 抽 `registerTools()` helper；新增 `createHttpServer({ tools, port?, path?, host?, stateful? })` | WebSocket transport、auth middleware、TLS |
| `packages/cli` | 新增 `serve <file>`、`inspect <file>` 子命令；`dev` 保留 stdio（兼容） | `init`、`expose`、`publish`、`test`（仍留 v0.5+） |
| `examples/04-http-server` | 最小 HTTP server 例子，复用 example 01 的 hello tools | — |
| `apps/docs/guide/` | 增 `transports.md`、`inspect.md` | API auto-generation |
| `docs/decisions.md` | 增 ADR-018 ~ ADR-020 | — |
| `docs/progress.md` | 增 Plan 4 章节 | — |

**显式不做**：
- WebSocket / 老式 SSE-only transport（SDK 已弃用，新 transport 是 streamable-HTTP，自带 SSE）
- 自写 web inspector UI（用官方的，省 90% 工作量；自写留给 Plan 7+ 当差异化卖点）
- `WebStandardStreamableHTTPServerTransport`（Cloudflare/Deno/Bun 用，Plan 5 处理）
- HTTP auth / rate limit（v0.1 仅 localhost 默认 bind，user 自己加 reverse proxy）

## 关键技术决策（已锁定）

1. **HTTP transport**：`StreamableHTTPServerTransport`（基于 Node IncomingMessage/ServerResponse）— SDK 内置，零额外依赖
2. **Session 模式**：默认 **stateful**（`sessionIdGenerator: () => randomUUID()`），与 SDK 推荐 / 官方 inspector / Claude Code 默认对齐；保留 `stateful: false` 选项供后续 serverless 场景
3. **HTTP server**：Node 内置 `http.createServer()`，**不引入 express / hono / fastify**（与 ADR-003/004 ESM-only + 最小依赖原则一致）
4. **默认端口 + 路径**：`3333` + `/mcp`，启动后打印可访问 URL
5. **默认 host**：`127.0.0.1`（仅本地访问），`--host 0.0.0.0` 显式开放
6. **`bridgent serve <file>`**：spawn `node --experimental-strip-types <file>`，但用环境变量告诉 user file 走 HTTP 模式 —— 需要 user 在文件里调 `createHttpServer`，CLI 不改 user 代码
7. **`bridgent inspect <file>`**：spawn `npx @modelcontextprotocol/inspector bridgent dev <file>` 的薄包装；用 `pnpm dlx` 兜底；走 stdio（最稳）
8. **Tool 注册抽出**：`packages/core/src/register.ts` 新增 `registerTools(server, tools)`，stdio/http 两条路径都复用，避免代码重复

## 仓库新增 / 修改

```
packages/core/src/
├── register.ts                  # NEW: 抽出 registerTools(server, tools)
├── server.ts                    # MOD: 用 registerTools，瘦身
├── http.ts                      # NEW: createHttpServer()
└── index.ts                     # MOD: 增 export createHttpServer

packages/cli/src/commands/
├── serve.ts                     # NEW: bridgent serve <file>
├── inspect.ts                   # NEW: bridgent inspect <file>
└── dev.ts                       # 不变

packages/cli/src/cli.ts          # MOD: 注册 serve / inspect 子命令

examples/04-http-server/
├── server.ts                    # 同 hello tools，但调 createHttpServer
├── package.json
└── README.md

apps/docs/guide/
├── transports.md                # NEW
└── inspect.md                   # NEW

apps/docs/.vitepress/config.ts   # MOD: sidebar 增 "Transports" + "Tooling"

docs/
├── progress.md                  # 增 Plan 4 章节
├── decisions.md                 # ADR-018 ~ ADR-020
└── plans/2026-06-04-plan-4-http-inspect.md
```

## API 形态

### `packages/core` 新 API

```ts
// packages/core/src/register.ts
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { BridgentTool } from './define-tool'

export function registerTools(server: McpServer, tools: BridgentTool[]): void

// packages/core/src/http.ts
export interface CreateHttpServerOptions {
  name: string
  version: string
  tools: BridgentTool[]
  /** Default 3333. */
  port?: number
  /** Default '/mcp'. */
  path?: string
  /** Default '127.0.0.1' (loopback only). Pass '0.0.0.0' to expose. */
  host?: string
  /** Default true. False enables stateless mode. */
  stateful?: boolean
}

export interface HttpServerHandle {
  /** The Node http.Server instance. */
  raw: import('node:http').Server
  /** Cleanly close the server. */
  close: () => Promise<void>
  /** Resolved URL (e.g. http://127.0.0.1:3333/mcp). */
  url: string
}

export async function createHttpServer(opts: CreateHttpServerOptions): Promise<HttpServerHandle>
```

### CLI 新子命令

```bash
bridgent dev <file>       # stdio (already exists)
bridgent serve <file>     # NEW: starts user's createHttpServer-based file
bridgent inspect <file>   # NEW: spawns @modelcontextprotocol/inspector + bridgent dev <file>
```

`bridgent inspect`：

```ts
// packages/cli/src/commands/inspect.ts
import { spawn } from 'node:child_process'
import { defineCommand } from 'citty'

export const inspect = defineCommand({
  meta: { name: 'inspect', description: 'Open MCP Inspector and connect to your server (stdio).' },
  args: { file: { type: 'positional', required: true } },
  async run({ args }) {
    // Equivalent to: pnpm dlx @modelcontextprotocol/inspector bridgent dev <file>
    const child = spawn('pnpm', [
      'dlx', '@modelcontextprotocol/inspector',
      process.execPath,
      '--experimental-strip-types',
      '--no-warnings=ExperimentalWarning',
      args.file,
    ], { stdio: 'inherit' })
    child.on('exit', code => process.exit(code ?? 0))
  },
})
```

`bridgent serve`：与 `dev` 几乎一样，区别是它假设 user 文件调了 `createHttpServer`（不是 `createStdioServer`），所以 stdio 透传时不会污染 MCP 协议。**实际上 serve 本质就是 dev 改个名 + 文档区分用法**——CLI 不感知 user 代码用哪种 transport。

## Example: `examples/04-http-server`

```ts
// examples/04-http-server/server.ts
import { createHttpServer, defineTool } from '@bridgent/core'
import { z } from 'zod'

const handle = await createHttpServer({
  name: 'hello-http',
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

console.error(`MCP HTTP listening at ${handle.url}`)
```

### `package.json` scripts

```json
{
  "scripts": {
    "start": "bridgent serve ./server.ts",
    "raw": "node --experimental-strip-types --no-warnings=ExperimentalWarning ./server.ts"
  }
}
```

## 实施顺序

1. `packages/core/src/register.ts`：抽 `registerTools(server, tools)`（不改行为）
2. `packages/core/src/server.ts`：改用 `registerTools`，瘦身
3. `packages/core/src/http.ts`：`createHttpServer` 实现 — Node `http.createServer` + `StreamableHTTPServerTransport.handleRequest`
4. `packages/core/src/index.ts`：导出 `createHttpServer` + `HttpServerHandle`
5. `packages/core/test/http.test.ts`：起一个 ephemeral HTTP server，发 `tools/list` 验证响应
6. `packages/cli/src/commands/serve.ts`：与 dev.ts 几乎一致
7. `packages/cli/src/commands/inspect.ts`：spawn 官方 inspector
8. `packages/cli/src/cli.ts`：注册两个新子命令
9. `examples/04-http-server`：server.ts + package.json + README
10. `apps/docs/guide/transports.md` + `inspect.md` + sidebar 增
11. `docs/decisions.md` ADR-018 ~ ADR-020
12. `docs/progress.md` Plan 4 章节
13. **端到端验证**

## 关键代码骨架

### `packages/core/src/register.ts`

```ts
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { BridgentTool } from './define-tool'

export function registerTools(server: McpServer, tools: BridgentTool[]): void {
  for (const tool of tools) {
    server.registerTool(
      tool.name,
      { description: tool.description, inputSchema: tool.inputSchema.shape },
      async (args) => {
        const result = await tool.run(args as never)
        const text = typeof result === 'string' ? result : JSON.stringify(result)
        return { content: [{ type: 'text' as const, text }] }
      },
    )
  }
}
```

### `packages/core/src/http.ts`

```ts
import { createServer, type Server } from 'node:http'
import { randomUUID } from 'node:crypto'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { registerTools } from './register'

export async function createHttpServer(opts: CreateHttpServerOptions): Promise<HttpServerHandle> {
  const port = opts.port ?? 3333
  const host = opts.host ?? '127.0.0.1'
  const path = opts.path ?? '/mcp'
  const stateful = opts.stateful ?? true

  const mcp = new McpServer({ name: opts.name, version: opts.version })
  registerTools(mcp, opts.tools)

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: stateful ? () => randomUUID() : undefined,
  })
  await mcp.connect(transport)

  const httpServer: Server = createServer((req, res) => {
    if (!req.url || !req.url.startsWith(path)) {
      res.statusCode = 404
      res.end('Not Found')
      return
    }
    transport.handleRequest(req, res)
  })

  await new Promise<void>(resolve => httpServer.listen(port, host, resolve))

  return {
    raw: httpServer,
    url: `http://${host}:${port}${path}`,
    close: () => new Promise<void>((resolve, reject) =>
      httpServer.close(err => err ? reject(err) : resolve()),
    ),
  }
}
```

> ⚠️ 进 pkg 后实测：`StreamableHTTPServerTransport.handleRequest` 在 1.29 是否会自己读 body，还是要外部 `await req.toJSON`。看 dist/esm/server/streamableHttp.js 第 ~80 行 — 它内部用 `node-server` 转 IncomingMessage → fetch Request，body 流式处理，**应该不需要外部预读**。如错则按 `transport.handleRequest(req, res, parsedBody)` 三参数版本传 body。

## 验证（端到端）

按顺序跑、全部为绿才算 Plan 4 完成：

1. `pnpm turbo run lint typecheck test build` → 19 → 20 packages 全绿（新增 example 04）
2. **HTTP server e2e**：
   - `pnpm --filter @bridgent-examples/04-http-server start` 起 HTTP 在 `http://127.0.0.1:3333/mcp`
   - 用 curl + JSON-RPC 发 `initialize` → 拿到 `Mcp-Session-Id` header
   - 用同 session 发 `tools/list` → 看到 `add`
   - 用同 session 发 `tools/call add {a:2,b:3}` → 返回 5
3. **`bridgent serve` CLI 测试**：与 #2 等价但通过 `bridgent serve` 启动
4. **`bridgent inspect` 测试**：手测 `bridgent inspect ./examples/01-zod-hello/server.ts`，浏览器开 inspector 能列工具 + 调用（这步是手动验证，不进 CI）
5. core 新增 `http.test.ts` vitest：用 ephemeral 端口起 HTTP，发 `tools/list` 验证 happy path

## 风险与待实测项

| # | 项 | 验证方法 |
|---|---|---|
| R1 | `StreamableHTTPServerTransport.handleRequest` 在 1.29 的实际签名（2-arg vs 3-arg） | 进 pkg 后看 dts；写 vitest 跑 `tools/list` 确定 |
| R2 | stateful 模式下 client 必须先 `initialize` 才能调 `tools/list`（curl 测试要带正确顺序） | 文档明确 + 手测脚本里走完整 init handshake |
| R3 | `bridgent inspect` spawn `pnpm dlx` 在 npm/yarn 用户机器上是否可用 | fallback 到 `npx -y @modelcontextprotocol/inspector` |
| R4 | tsdown bundle 时 `node:http` 是否被 external（应自动） | tsdown.config.ts 已 platform=node，OK |
| R5 | dual-protocol 同一份 tools 数组互不干扰（一个 stdio + 一个 HTTP 进程同时跑） | 在 example 04 README 演示 |

## ADR 增补

- **ADR-018** Plan 4 引入 HTTP transport，用 SDK 1.29 内置 `StreamableHTTPServerTransport`，**不引入 express / hono / fastify**（最小依赖）
- **ADR-019** HTTP server 默认 stateful + 默认 bind 127.0.0.1 + 默认端口 3333 / 路径 `/mcp`（安全 by default）
- **ADR-020** `bridgent inspect` 是官方 `@modelcontextprotocol/inspector` 的 thin wrapper（不重造 web UI；自写 inspector 留给 Plan 7+ 做差异化）

## 后续 plan 预告（不在本次范围）

- **Plan 5 (Day 6-7)**：跨宿主 e2e (Claude Code / Codex / Cursor / Gemini CLI) + 30s demo GIF + `WebStandardStreamableHTTPServerTransport`（Cloudflare/Deno）
- **Plan 6**：发布流（changesets）+ awesome-* PR + HN/PH 文案
- **Plan 7+**：自写 Bridgent Inspector（差异化）+ source-prisma v0.2（写操作 + audit）

## Critical Files

- `/Users/mark/myself/code/Bridgent/packages/core/src/register.ts`
- `/Users/mark/myself/code/Bridgent/packages/core/src/http.ts`
- `/Users/mark/myself/code/Bridgent/packages/core/src/server.ts`
- `/Users/mark/myself/code/Bridgent/packages/core/src/index.ts`
- `/Users/mark/myself/code/Bridgent/packages/core/test/http.test.ts`
- `/Users/mark/myself/code/Bridgent/packages/cli/src/commands/serve.ts`
- `/Users/mark/myself/code/Bridgent/packages/cli/src/commands/inspect.ts`
- `/Users/mark/myself/code/Bridgent/packages/cli/src/cli.ts`
- `/Users/mark/myself/code/Bridgent/examples/04-http-server/server.ts`
- `/Users/mark/myself/code/Bridgent/examples/04-http-server/package.json`
- `/Users/mark/myself/code/Bridgent/apps/docs/guide/transports.md`
- `/Users/mark/myself/code/Bridgent/apps/docs/guide/inspect.md`
- `/Users/mark/myself/code/Bridgent/apps/docs/.vitepress/config.ts`
- `/Users/mark/myself/code/Bridgent/docs/decisions.md`
- `/Users/mark/myself/code/Bridgent/docs/progress.md`
