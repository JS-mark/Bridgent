# Bridgent Plan 5 — 跨宿主 e2e harness + WebStandard transport + 4 份 host 配置

## Context

Plan 1-4 已经把 stdio + Streamable HTTP 两条 transport 跑稳，三个 source（Zod / OpenAPI / Prisma）都 e2e 通过。但 **"Bridgent 真的能在 4 个主流 IDE-Agent 宿主里被消费"** 这件事还没有可演示、可回归的证据；这是 Plan 5 的核心任务。

完成后：

1. 任何 Claude Code / Cursor / Codex / Gemini CLI 用户可以**复制粘贴一段配置**就用上 Bridgent server
2. CI 里有一份**协议层 e2e harness**，用官方 MCP SDK Client 直接连我们的 server，等价于"任何符合 1.x 的客户端都能消费"——发布前回归测试的最后一道护栏
3. 多一个 **WebStandard transport**，让 Bridgent 不只活在 Node 里，Cloudflare Workers / Deno / Bun / 任何接受 fetch handler 的运行时都能跑——为 Plan 6 之后的 Cloud 版预热

营销侧：30 秒"4 个 IDE-Agent 同时调用同一份 server" demo GIF 占位 + 录制脚本，留给用户后续手动交付。

## 范围

| 模块 | 做什么 | 不做什么 |
|---|---|---|
| `packages/core` | 新增 `createWebHandler({ tools, stateful? })` → `(req: Request) => Promise<Response>` | WebSocket、auth middleware、Cloudflare-specific bindings |
| `packages/host-test` (新包) | 协议层 e2e harness：vitest + `@modelcontextprotocol/sdk` Client，覆盖 stdio + HTTP 两 transport | GUI 自动化、真启 Claude Code/Cursor 进程 |
| `apps/docs/guide/hosts/` | claude-code.md / cursor.md / codex.md / gemini-cli.md 四份配置片段 | 各 host 的安装 / 上手指南 |
| `examples/05-web-handler` | Cloudflare Workers / Deno style 的最小 fetch-handler example | 真上线 Cloudflare（仅本地 `node-server` adapter 跑） |
| README + `docs/recording.md` | demo GIF placeholder + asciinema/vhs 录制脚本提示 | 真录 GIF |
| `docs/decisions.md` | 增 ADR-021 ~ ADR-023 | — |
| `docs/progress.md` | 增 Plan 5 章节 | — |

**显式不做**：
- 启动真实 Claude Code / Cursor / Codex / Gemini CLI 进程做 e2e（沙箱与 CI 都不可行）
- 写 IDE-agent 浏览器自动化（playwright 操控 Cursor 内嵌 webview）
- WebSocket transport（SDK 已弃用）
- HTTP auth / rate limit（仍由 reverse proxy 负责，与 ADR-018 一致）

## 关键技术决策（已锁定）

1. **跨宿主验证 = 协议层 harness + 4 份配置文档**：harness 用 SDK 的 `Client` + 两种 `*Transport`，等价"客户端实现"——任何宿主只要 1.x compliant 就能跑。文档片段让用户秒懂。
2. **WebStandard transport** 用 SDK 1.29 内置 `WebStandardStreamableHTTPServerTransport`，零额外 framework。返回值是纯 Web Handler，Cloudflare Workers / Deno / Bun / Hono / Vercel Edge 都能直接挂。
3. **harness 单独包** `@bridgent/host-test`：private（不发布），workspace 内供 vitest 用；既可在 dev 时跑 `pnpm --filter @bridgent/host-test test`，也用作 Plan 6 发布前自动化回归。
4. **Host 配置文档**：每份给一个**完整**可复制的 JSON 片段 + 一行 Bridgent CLI 用法（`bridgent dev` / `bridgent serve`）+ 故障排查 3 条。
5. **demo GIF** 用 `vhs`（charm.sh）脚本式录制，README 留 `assets/demo.gif` 占位 + `docs/recording.md` 给具体命令；不阻塞 Plan 5 完成。
6. **不引入 Cloudflare 依赖**：example 05 跑在 Node 上用 `@hono/node-server`（已经在 SDK 依赖链里）或自己写一个 Node adapter。**实测优先：直接用 Node 22.18+ 内置 `Request`/`Response`，自己写 5 行 adapter**——零额外 dep。

## 仓库新增 / 修改

```
packages/core/src/
├── web.ts                                  # NEW: createWebHandler()
├── index.ts                                # MOD: export createWebHandler
└── http.ts                                 # 不变

packages/core/test/
└── web.test.ts                             # NEW: vitest 用 fetch() 直打 web handler

packages/host-test/                         # NEW (private 包，monorepo 内部)
├── src/
│   ├── make-server.ts                      # 共享一组 hello-world tools
│   ├── stdio.ts                            # SDK Client 走 stdio 连
│   └── http.ts                             # SDK Client 走 HTTP 连
├── test/
│   ├── stdio.test.ts                       # initialize → tools/list → tools/call
│   ├── http.test.ts                        # 同上，HTTP transport
│   └── web.test.ts                         # 同上，WebStandard handler
├── tsconfig.json
├── vitest.config.ts
└── package.json                            # name: @bridgent/host-test, private

examples/05-web-handler/
├── server.ts                               # createWebHandler + Node http adapter
├── package.json
└── README.md

apps/docs/guide/hosts/                      # NEW
├── claude-code.md
├── cursor.md
├── codex.md
└── gemini-cli.md

apps/docs/.vitepress/config.ts              # MOD: sidebar 增 "Hosts" 分组

docs/
├── recording.md                            # NEW: demo GIF 录制脚本 + vhs 配方
├── progress.md                             # MOD: Plan 5 章节
├── decisions.md                            # MOD: ADR-021 ~ ADR-023
└── plans/2026-06-06-plan-5-cross-host.md   # 归档

README.md                                   # MOD: assets/demo.gif placeholder
```

## API 形态

### `createWebHandler`

```ts
// packages/core/src/web.ts
import type { BridgentTool } from './define-tool'

export interface CreateWebHandlerOptions {
  name: string
  version: string
  tools: BridgentTool<any, any>[]
  /** Default true. False enables stateless mode (recommended for serverless). */
  stateful?: boolean
}

export interface WebHandler {
  /** Web-standard fetch handler. Wire into Cloudflare/Deno/Bun/Hono/Vercel Edge. */
  fetch: (request: Request) => Promise<Response>
  /** Cleanly close the underlying MCP transport. */
  close: () => Promise<void>
}

export async function createWebHandler(opts: CreateWebHandlerOptions): Promise<WebHandler>
```

### `@bridgent/host-test` Client harness

```ts
// packages/host-test/src/stdio.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

export async function connectStdio(serverFile: string) {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ['--experimental-strip-types', '--no-warnings=ExperimentalWarning', serverFile],
  })
  const client = new Client({ name: 'host-test', version: '0.0.1' }, { capabilities: {} })
  await client.connect(transport)
  return client
}
```

vitest 测：

```ts
it('any 1.x client can list + call tools over stdio', async () => {
  const client = await connectStdio(resolve(__dirname, '../fixtures/server.ts'))
  const tools = await client.listTools()
  expect(tools.tools.map(t => t.name)).toContain('add')
  const result = await client.callTool({ name: 'add', arguments: { a: 2, b: 3 } })
  expect(result.content[0].text).toBe('5')
})
```

## Host 配置文档草稿

四份 markdown 给**可直接复制粘贴**的 JSON。例：

### `apps/docs/guide/hosts/claude-code.md`

````md
# Claude Code

把以下加到 `~/.claude.json`（macOS / Linux）：

```jsonc
{
  "mcpServers": {
    "bridgent-hello": {
      "command": "bridgent",
      "args": ["dev", "/abs/path/to/server.ts"]
    }
  }
}
```

重启 Claude Code → 工具选择器里出现 `add` / `echo`。

## HTTP server 形式

如果你已经 `bridgent serve ./server.ts`：

```jsonc
{
  "mcpServers": {
    "bridgent-hello": {
      "transport": "streamable-http",
      "url": "http://127.0.0.1:3333/mcp"
    }
  }
}
```

## 故障排查

- 没在工具列表里看到 → 检查 `bridgent --version` 在 PATH 里
- `command not found: bridgent` → `pnpm i -g bridgent`
- HTTP 模式连不上 → 确认 server stdout 打印的是 `127.0.0.1:3333` 不是 `0.0.0.0`
````

Cursor / Codex / Gemini CLI 各自的 config 文件位置 / schema 在它们对应的 markdown 里给（实际写时 verify 当前 cutoff 内的官方说明）。

## 实施顺序

1. `packages/core/src/web.ts`：用 `WebStandardStreamableHTTPServerTransport` + 5 行 fetch handler
2. `packages/core/src/index.ts`：导出 `createWebHandler` / `WebHandler`
3. `packages/core/test/web.test.ts`：用 fetch() 直打 handler，验证 init + tools/list（不 listen 端口）
4. `packages/host-test` 骨架（package.json / tsconfig / vitest.config）+ catalog 不增（private 包，内部用 SDK）
5. `packages/host-test/src/make-server.ts`：一份共享 hello tools
6. `packages/host-test/src/{stdio,http,web}.ts` + 三份 test
7. `examples/05-web-handler/server.ts`：用 Node http 包一层（5 行 adapter，把 `IncomingMessage` 转 `Request`）
8. `apps/docs/guide/hosts/*.md` × 4
9. `apps/docs/.vitepress/config.ts`：sidebar 增 "Hosts" 分组（4 entries）
10. `README.md`：`assets/demo.gif` placeholder + 简短"4 hosts" 一节
11. `docs/recording.md`：vhs 配方（仅文档，不真录）
12. `docs/decisions.md` ADR-021 ~ ADR-023
13. `docs/progress.md` Plan 5 章节
14. `docs/plans/2026-06-06-plan-5-cross-host.md` 归档
15. **端到端验证**：`pnpm turbo run lint typecheck test build` 全绿，host-test 三 transport 全过

## 关键代码骨架

### `packages/core/src/web.ts`

```ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { randomUUID } from 'node:crypto'
import { registerTools } from './register'

export async function createWebHandler(opts: CreateWebHandlerOptions): Promise<WebHandler> {
  const stateful = opts.stateful ?? true
  const mcp = new McpServer({ name: opts.name, version: opts.version })
  registerTools(mcp, opts.tools)

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: stateful ? () => randomUUID() : undefined,
  })
  await mcp.connect(transport)

  return {
    fetch: req => transport.handleRequest(req),
    close: () => transport.close().catch(() => undefined as void),
  }
}
```

### `examples/05-web-handler/server.ts`（Node 内置 http 适配器）

```ts
import { createServer } from 'node:http'
import { Readable } from 'node:stream'
import { createWebHandler, defineTool } from '@bridgent/core'
import { z } from 'zod'

const handler = await createWebHandler({
  name: 'hello-web',
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

createServer(async (req, res) => {
  const url = `http://${req.headers.host}${req.url}`
  const headers = new Headers()
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === 'string') headers.set(k, v)
    else if (Array.isArray(v)) headers.set(k, v.join(','))
  }
  const body = ['GET','HEAD'].includes(req.method!) ? undefined : Readable.toWeb(req) as ReadableStream
  const request = new Request(url, { method: req.method, headers, body, duplex: 'half' } as any)
  const response = await handler.fetch(request)
  res.statusCode = response.status
  response.headers.forEach((v, k) => res.setHeader(k, v))
  if (response.body) {
    for await (const chunk of Readable.fromWeb(response.body as any))
      res.write(chunk)
  }
  res.end()
}).listen(3334, '127.0.0.1', () => console.error('Web handler at http://127.0.0.1:3334'))
```

> ⚠️ 进 pkg 后实测：Node 22.18 的 `Readable.toWeb / fromWeb` + `duplex: 'half'` 在 SSE 流式下行为；`WebStandardStreamableHTTPServerTransport.handleRequest` 期望 fetch Request body 是 ReadableStream。若性能或正确性问题，回退用 `@hono/node-server` 的 `serve` 1 行即可（SDK 依赖链已带 hono 子模块）。

## 验证（端到端）

按顺序跑、全部为绿才算 Plan 5 完成：

1. `pnpm turbo run lint typecheck test build` → 19 → 22+ packages 全绿（新增 host-test + example 05 + core 多了 web.test.ts）
2. **host-test 三 transport e2e**：
   - stdio：spawn fixture server，SDK Client 走 stdio，list + call 全过
   - HTTP：起 ephemeral HTTP server，SDK `StreamableHTTPClientTransport` 连，list + call 全过
   - WebStandard：fetch() 直打 handler.fetch，init + list + call 全过
3. `pnpm --filter @bridgent-examples/05-web-handler start` → 起 `:3334`，curl `tools/list` 拿 `add`
4. **VitePress dev 看 4 份 host 文档**：`pnpm docs:dev`，访问 `/guide/hosts/claude-code` 等四页
5. README placeholder `assets/demo.gif` 缺图但路径正确（不阻塞 CI）

## 风险与待实测项

| # | 项 | 验证方法 |
|---|---|---|
| R1 | `WebStandardStreamableHTTPServerTransport.handleRequest` 在 1.29 是否真接受单参数 `Request`，返回 `Response` | 已查 dts ✅ |
| R2 | Node 22.18 的 `Readable.toWeb` + `duplex: 'half'` 在 example 05 流式下行为 | 进 pkg 后实测；如有问题回退 `@hono/node-server` |
| R3 | `StdioClientTransport` 在 SDK 1.29 是否还在 `client/stdio.js` 路径 | 已 ls 确认 ✅ |
| R4 | 各 host（Claude Code / Cursor / Codex / Gemini CLI）的 mcp.json 路径与 schema | 在写文档时按官方 cutoff 内说明，**不臆测**；不确定的部分写 "verify with your host's docs" |
| R5 | host-test 用 `process.execPath` spawn TS 文件能跨平台 | macOS 已在 Plan 1 验证；Linux CI 应同；Windows 暂不保证（README 标注） |

## ADR 增补

- **ADR-021** WebStandard transport 用 SDK `WebStandardStreamableHTTPServerTransport`，**返回纯 Web Handler**，运行时无关；Node adapter 用 5 行 `Readable.toWeb/fromWeb` 自写，零额外 framework
- **ADR-022** 跨宿主验证 = 协议层 harness + 配置文档；不做 GUI 自动化（CI 不可行 + ROI 低）；harness 包 `@bridgent/host-test` 是 private，仅 monorepo 内回归用
- **ADR-023** 4 个 host 文档放 `apps/docs/guide/hosts/` 而不是 README，给 sidebar "Hosts" 一级入口；README 仅放 hero placeholder

## 后续 plan 预告（不在本次范围）

- **Plan 6**：发布流（changesets）+ awesome-* PR + HN/PH 文案 + 真录 demo GIF
- **Plan 7+**：自写 Bridgent Inspector（差异化）+ source-prisma v0.2（写操作 + audit）+ source-drizzle / source-trpc / source-graphql

## Critical Files

- `/Users/mark/myself/code/Bridgent/packages/core/src/web.ts`
- `/Users/mark/myself/code/Bridgent/packages/core/src/index.ts`
- `/Users/mark/myself/code/Bridgent/packages/core/test/web.test.ts`
- `/Users/mark/myself/code/Bridgent/packages/host-test/src/{make-server,stdio,http,web}.ts`
- `/Users/mark/myself/code/Bridgent/packages/host-test/test/{stdio,http,web}.test.ts`
- `/Users/mark/myself/code/Bridgent/packages/host-test/package.json`
- `/Users/mark/myself/code/Bridgent/examples/05-web-handler/server.ts`
- `/Users/mark/myself/code/Bridgent/apps/docs/guide/hosts/{claude-code,cursor,codex,gemini-cli}.md`
- `/Users/mark/myself/code/Bridgent/apps/docs/.vitepress/config.ts`
- `/Users/mark/myself/code/Bridgent/README.md`
- `/Users/mark/myself/code/Bridgent/docs/recording.md`
- `/Users/mark/myself/code/Bridgent/docs/decisions.md`
- `/Users/mark/myself/code/Bridgent/docs/progress.md`
