# apps/docs 内容完善 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 `apps/docs` 与当前 alpha 实现对齐:补齐 Zod / Web Handler / CLI / Sources Overview 四个空缺;校准 from-openapi/from-prisma 字段签名;sidebar 扩容;同步中文;顺手把 CLAUDE.md 改到与现状一致。

**Architecture:** 镜像式中英双语,每对页结构严格一致。Sources 分组扩展为 4 项(加 Overview + From Zod);Transports & Tooling 加一项 CLI。所有内部 link 用本 locale 完整路径(英文裸 `/guide/...`,中文 `/zh/guide/...`),不依赖任何"自动加 prefix"假设。

**Tech Stack:** VitePress 1.x、TypeScript、pnpm workspace、Turborepo。

**Source spec:** `docs/superpowers/specs/2026-06-06-docs-content-refresh-design.md`(术语表沿用 i18n spec §5.4)。

**Pre-flight:**
- 仓库已有 commit 历史,所有 `git add` 用**显式路径**
- 验证用 `pnpm --filter @bridgent/docs <script>`(快),Turbo 全套留到最后一步
- 不修改 packages/ 下任何文件;不动 examples/;不动 host pages

---

## Source-Code Ground Truth(实施时所有声明都必须对照)

### `@bridgent/core` 实际导出(`packages/core/src/index.ts`)

| Symbol | Type | Source |
| --- | --- | --- |
| `defineTool` | function | `define-tool.ts:13` |
| `BridgentTool` | type | `define-tool.ts:3` |
| `createStdioServer` | function | `server.ts:12` |
| `CreateStdioServerOptions` | type | `server.ts:6` |
| `createHttpServer` | function | `http.ts:39` |
| `CreateHttpServerOptions` | type | `http.ts:9` |
| `HttpServerHandle` | type | `http.ts:23` |
| `createWebHandler` | function | `web.ts:29` |
| `CreateWebHandlerOptions` | type | `web.ts:7` |
| `WebHandler` | type | `web.ts:15` |
| `registerTools` | function | `register.ts:11` |

### `defineTool` 真实签名

```ts
export interface BridgentTool<
  TShape extends z.ZodRawShape = z.ZodRawShape,
  TOutput = unknown,
> {
  name: string
  description?: string
  inputSchema: z.ZodObject<TShape>
  run: (input: z.infer<z.ZodObject<TShape>>) => TOutput | Promise<TOutput>
}

export function defineTool<TShape, TOutput>(
  tool: BridgentTool<TShape, TOutput>
): BridgentTool<TShape, TOutput>
```

### `run` 返回值规则(`register.ts:19-27`)

- 字符串 → `{ content: [{ type: 'text', text: result }] }`
- 非字符串 → `{ content: [{ type: 'text', text: JSON.stringify(result) }] }`
- 异步抛错向上传播(MCP SDK 包成 error response)

### `createStdioServer` 签名

```ts
{ name: string, version: string, tools: BridgentTool[] }
returns Promise<McpServer>
```

### `createHttpServer` 签名

```ts
{
  name: string
  version: string
  tools: BridgentTool[]
  port?: number      // default 3333
  path?: string      // default '/mcp'
  host?: string      // default '127.0.0.1'
  stateful?: boolean // default true
}
returns Promise<HttpServerHandle> // { raw: http.Server, url: string, close: () => Promise<void> }
```

### `createWebHandler` 签名

```ts
{
  name: string
  version: string
  tools: BridgentTool[]
  stateful?: boolean // default true
}
returns Promise<WebHandler> // { fetch: (Request) => Promise<Response>, close: () => Promise<void> }
```

### CLI 命令实情

- `bridgent dev <file>` — `commands/dev.ts`:spawn child Node;TS 文件加 `--experimental-strip-types --no-warnings=ExperimentalWarning`
- `bridgent serve <file>` — `commands/serve.ts`:实现与 `dev` **逐字相同**,只有 `meta.description` 不同
- `bridgent inspect <file>` — `commands/inspect.ts`:wraps `pnpm dlx @modelcontextprotocol/inspector`(回退 `npx -y`)

### `fromOpenApi` 选项(`source-openapi/src/types.ts:11`)

| 字段 | 类型 | 默认 |
| --- | --- | --- |
| `spec` | `string \| Record<string, unknown>` | required |
| `baseUrl` | `string` | spec.servers[0].url |
| `auth` | `BearerAuth = { type: 'bearer', token: string \| (() => string \| Promise<string>) }` | undefined |
| `namespace` | `string` | undefined |
| `allow` | `{ mutating?: boolean, methods?: HttpMethod[] }` | `{ methods: ['GET','HEAD'] }` |
| `allowOperations` | `string[]` | undefined(空 = 不限) |
| `denyOperations` | `string[]` | undefined |
| `pathFilter` | `RegExp \| (path) => boolean` | undefined |
| `respectExtensions` | `boolean` | true |
| `fetch` | `typeof globalThis.fetch` | `globalThis.fetch` |

### `fromPrisma` 选项(`source-prisma/src/types.ts:55`)

| 字段 | 类型 | 默认 |
| --- | --- | --- |
| `client` | PrismaClient 实例 | required |
| `namespace` | `string` | undefined |
| `allow` | `{ mutating?: boolean, methods?: PrismaMethod[] }` | `{ methods: READ_METHODS }` |
| `modelFilter` | `RegExp \| (modelCamel) => boolean` | undefined |
| `allowTools` | `string[]` | undefined |
| `denyTools` | `string[]` | undefined |
| `defaultTake` | `number` | **10000** |
| `maxTake` | `number` | **10000** |
| `queryTimeoutMs` | `number` | **10000** |
| `excludeFieldTypes` | `string[]` | **`['Bytes']`** |
| `dmmf` | `{ models: DmmfModel[] }` | from `@prisma/client` |

### `mutating: true` 在 v0.1 的真实行为

`filter.ts:resolveAllowedMethods` 会把 mutating methods 加入 allowedMethods,但 `tools/index.ts:createReadTool` 对非读方法返回 `undefined`,主循环 `if (!tool) continue` 静默跳过。**净效果:静默 no-op**,不抛错。文档应明确为"v0.1 静默忽略,v0.2 落写工具时会启用"。

### 5 个 Prisma 工具与命名规则

`READ_METHODS = ['findUnique','findFirst','findMany','count','aggregate']`(`types.ts:19`)。命名:`<namespace?><modelCamel>_<method>` — 见 `slug.ts:buildToolName`。

---

## File Structure

**Create(6,中英各 3):**
```
apps/docs/guide/sources-overview.md          [新]
apps/docs/guide/from-zod.md                  [新]
apps/docs/guide/cli.md                       [新]
apps/docs/zh/guide/sources-overview.md       [新]
apps/docs/zh/guide/from-zod.md               [新]
apps/docs/zh/guide/cli.md                    [新]
```

**Modify(9):**
```
apps/docs/guide/transports.md                [+ Web Handler 章节]
apps/docs/guide/from-openapi.md              [字段对齐]
apps/docs/guide/from-prisma.md               [默认值精确化、mutating 静默说明]
apps/docs/zh/guide/transports.md             [中文同步]
apps/docs/zh/guide/from-openapi.md           [中文同步]
apps/docs/zh/guide/from-prisma.md            [中文同步]
apps/docs/.vitepress/locales/en.ts           [sidebar 扩容]
apps/docs/.vitepress/locales/zh.ts           [sidebar 扩容,/zh/ 前缀]
CLAUDE.md                                    [What this is + Architecture]
```

**Don't touch:** `index.md`(en/zh)、`getting-started.md`(en/zh)、`what-is-bridgent.md`(en/zh)、`inspect.md`(en/zh)、`hosts/*.md`(en/zh)、`config.ts`、`shared.ts`、packages/、examples/、根 README。

---

## Task 1: 新增 Sources Overview(en + zh)

**Files:**
- Create: `apps/docs/guide/sources-overview.md`
- Create: `apps/docs/zh/guide/sources-overview.md`

- [ ] **Step 1: 写英文版**

```md
# Sources Overview

Bridgent normalizes different shapes of "definitions you already have" into a single MCP tool surface. Pick the source that matches your codebase; the runtime (transport, CLI, hosts) is the same regardless.

## Capability matrix

| | **From Zod** | **From OpenAPI** | **From Prisma** | *From Drizzle* | *From tRPC* | *From GraphQL* |
|---|---|---|---|---|---|---|
| Status | shipped (`@bridgent/core`) | shipped (`@bridgent/source-openapi`) | shipped (`@bridgent/source-prisma`) | roadmap | roadmap | roadmap |
| Min code | `defineTool` per tool | `await fromOpenApi({ spec })` | `await fromPrisma({ client })` | — | — | — |
| Tools come from | each `defineTool` call | each operation in the spec | each model × 5 read methods | schema tables | router procedures | resolver fields |
| Naming | author-provided `name` | `operationId` (slugified) or `${method}_${path}` | `<namespace?><modelCamel>_<method>` | TBD | TBD | TBD |
| Filtering | not applicable | `allow` / `allowOperations` / `denyOperations` / `pathFilter` / `respectExtensions` | `allow` / `modelFilter` / `allowTools` / `denyTools` | TBD | TBD | TBD |
| Auth (v0.1) | author-provided in `run` | Bearer (static or thunk) | reuse PrismaClient's datasource creds | — | — | — |
| Read / Write | author-controlled | read-only by default; opt-in via `allow.mutating` | read-only 5-piece; `mutating: true` silently ignored in v0.1 | — | — | — |

## When to pick which

- **From Zod** — you already have a function and want to expose exactly that, with the precise input shape you want the LLM to see. Smallest possible surface.
- **From OpenAPI** — you have an HTTP API documented with a spec. Bridgent generates one tool per operation; you control which subset.
- **From Prisma** — you want the LLM to read a database safely. Default is read-only with row caps, soft timeouts, and `Bytes`-field stripping.

## Roadmap

- **From Drizzle** — same shape as Prisma: schema → read tools, with the same guardrails.
- **From tRPC** — one tool per procedure, fully typed, no schema rewrite.
- **From GraphQL** — operations and field-level resolvers as tools.

These are scoped for post-v0.1; track progress in [the GitHub repo](https://github.com/js-mark/bridgent).

## Mixing sources

A single Bridgent server can stitch tools from multiple sources together:

```ts
import { createStdioServer, defineTool } from '@bridgent/core'
import { fromOpenApi } from '@bridgent/source-openapi'
import { fromPrisma } from '@bridgent/source-prisma'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const client = new PrismaClient()

await createStdioServer({
  name: 'mixed',
  version: '0.0.1',
  tools: [
    ...await fromPrisma({ client, namespace: 'db_' }),
    ...await fromOpenApi({
      spec: 'https://api.example.com/openapi.json',
      namespace: 'api_',
    }),
    defineTool({
      name: 'echo',
      inputSchema: z.object({ msg: z.string() }),
      run: ({ msg }) => msg,
    }),
  ],
})
```

Use `namespace` on each generated batch to avoid name collisions; duplicates throw fail-fast at startup.
```

- [ ] **Step 2: 写中文版**

文件:`apps/docs/zh/guide/sources-overview.md`,完整翻译上面英文版。术语:source→数据源(适配器);tool→工具;namespace→命名空间;guardrail→护栏;read-only→只读;LLM 保留英文。表头中英对照:

| 英文 | 中文 |
| --- | --- |
| Status | 状态 |
| Min code | 最小代码 |
| Tools come from | 工具来源 |
| Naming | 命名 |
| Filtering | 过滤 |
| Auth (v0.1) | 鉴权(v0.1) |
| Read / Write | 读 / 写 |
| shipped | 已发布 |
| roadmap | 路线图 |
| not applicable | 不适用 |
| author-provided | 作者提供 |
| silently ignored | 静默忽略 |

完整中文标题与正文翻译规范见 spec 与上一轮 i18n plan。代码块、`@bridgent/*` 包名、CLI 命令、ts/json 完全保留。

- [ ] **Step 3: 验证 build**

Run: `pnpm --filter @bridgent/docs build`
Expected: PASS,无 dead-link(此时 sidebar 还没接入,只是页面本身可渲染)

- [ ] **Step 4: Commit**

```bash
git add apps/docs/guide/sources-overview.md apps/docs/zh/guide/sources-overview.md
git commit -m "docs: add sources overview page (en + zh)"
```

---

## Task 2: 新增 From Zod(en + zh)

**Files:**
- Create: `apps/docs/guide/from-zod.md`
- Create: `apps/docs/zh/guide/from-zod.md`

- [ ] **Step 1: 写英文版**

```md
# From Zod

The smallest possible Bridgent server: a function plus a Zod schema. `defineTool` gives you full TypeScript inference on the `run` body; the runtime serializes whatever you return.

## Quick start

```ts
import { createStdioServer, defineTool } from '@bridgent/core'
import { z } from 'zod'

await createStdioServer({
  name: 'hello',
  version: '0.0.1',
  tools: [
    defineTool({
      name: 'add',
      description: 'Add two numbers',
      inputSchema: z.object({
        a: z.number(),
        b: z.number(),
      }),
      run: ({ a, b }) => ({ sum: a + b }),
    }),
  ],
})
```

`bridgent dev ./server.ts` and you're live.

## `defineTool` signature

```ts
defineTool({
  name: string
  description?: string
  inputSchema: z.ZodObject<Shape>
  run: (input: z.infer<z.ZodObject<Shape>>) => Output | Promise<Output>
})
```

- **`name`** — the MCP tool name. Choose something the LLM can guess: `search_orders`, not `so_v3`.
- **`description`** — what the tool does, in one sentence. The LLM uses this to decide *whether* to call.
- **`inputSchema`** — must be a `ZodObject` (Zod v4). Bridgent passes its `.shape` to the MCP SDK so each input field shows up as its own argument with description and type.
- **`run`** — sync or async. The argument type is inferred from `inputSchema` — you don't need to write it.

## Return value rules

`run` can return any JSON-serializable value:

| You return | LLM sees |
|---|---|
| `'hello'` (string) | text content `"hello"` |
| `{ sum: 3 }` (object) | text content `'{"sum":3}'` |
| `42` (number) | text content `"42"` |
| `[1, 2, 3]` (array) | text content `"[1,2,3]"` |

The runtime stringifies non-strings via `JSON.stringify`. For richer responses (multiple text blocks, images), use the MCP SDK directly — `defineTool` is the simple path.

## Errors

If `run` throws (sync or async), the MCP SDK returns an error response to the host; Bridgent does not catch or transform errors. For expected failures the model should reason about, **return** an error envelope rather than throwing:

```ts
defineTool({
  name: 'lookup_user',
  inputSchema: z.object({ id: z.string() }),
  run: async ({ id }) => {
    const user = await db.user.findUnique({ where: { id } })
    if (!user) {
      return { ok: false, error: 'not_found' }
    }
    return { ok: true, user }
  },
})
```

This is the same pattern `@bridgent/source-openapi` and `@bridgent/source-prisma` use for upstream errors — keeps the server alive across failures and gives the model enough info to course-correct.

## Type inference

`inputSchema` drives the `run` parameter type:

```ts
defineTool({
  name: 'echo',
  inputSchema: z.object({
    message: z.string(),
    repeat: z.number().int().min(1).default(1),
  }),
  run: ({ message, repeat }) => message.repeat(repeat),
  //     ^? message: string
  //                ^? repeat: number  (default applied)
})
```

No manual type annotations on `run` — TypeScript infers from the schema.

## Composition

Multiple `defineTool` calls go into the same `tools: []` array. Mix freely with `fromOpenApi` / `fromPrisma` results — see [Sources Overview](./sources-overview).
```

- [ ] **Step 2: 写中文版**

文件:`apps/docs/zh/guide/from-zod.md`。要点:
- `# From Zod` → `# 从 Zod 接入`
- 每个二级标题对照翻译:`Quick start` → `快速开始`、`defineTool signature` → `defineTool 签名`、`Return value rules` → `返回值规则`、`Errors` → `错误处理`、`Type inference` → `类型推导`、`Composition` → `组合使用`
- 代码块逐字保留(包括代码内英文注释)
- 表格表头译:`You return` → `你返回的`,`LLM sees` → `LLM 看到的`
- 表格内容里的字面量(`'hello'`、`{ sum: 3 }`、`text content "hello"`)保留;括号内的"string""object""number""array"译为"字符串""对象""数字""数组"
- 链接 `[Sources Overview](./sources-overview)` 中文版对应路径用 `[数据源总览](/zh/guide/sources-overview)`(完整 `/zh/` 前缀)

- [ ] **Step 3: 验证 build**

Run: `pnpm --filter @bridgent/docs build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/docs/guide/from-zod.md apps/docs/zh/guide/from-zod.md
git commit -m "docs: add From Zod source page (en + zh)"
```

---

## Task 3: 新增 CLI 总览(en + zh)

**Files:**
- Create: `apps/docs/guide/cli.md`
- Create: `apps/docs/zh/guide/cli.md`

- [ ] **Step 1: 写英文版**

```md
# CLI

Bridgent ships three commands, all thin wrappers around `node`:

| Command | What it does | Most common use |
|---|---|---|
| [`bridgent dev <file>`](#dev) | Spawn `node <file>`, with TS support | local IDE-agent integration over stdio |
| [`bridgent serve <file>`](#serve) | Spawn `node <file>`, with TS support | shared HTTP server (when the file calls `createHttpServer`) |
| [`bridgent inspect <file>`](#inspect) | Open the official MCP Inspector against your server | debugging tool calls without an LLM |

## A common point of confusion

**`bridgent dev` and `bridgent serve` are the same implementation.** They both `spawn` Node on your file with stdio inherited. The transport is determined by **what your file does**, not by which CLI command runs it:

- File calls `createStdioServer` → speaks stdio
- File calls `createHttpServer` → listens on HTTP
- File calls `createWebHandler` and adapts to a Node listener → also HTTP

`dev` and `serve` exist as separate names purely to match user intent (local hacking vs. running a process). They produce the same child process. If `bridgent serve foo.ts` doesn't bind a port, the server file never called `createHttpServer`.

## TypeScript without a build step

For `.ts`, `.tsx`, `.mts` files, all three commands pass these flags to Node:

```
--experimental-strip-types --no-warnings=ExperimentalWarning
```

This requires **Node ≥ 22.18**. Lower versions fail at install (the workspace has `engines-strict=true`). No `tsx`, no `ts-node`, no compile step — Bridgent uses Node's built-in stripper.

If you hit a project that doesn't yet have Node 22.18, switch with `nvm use 22.18` or `volta install node@22.18`.

## `dev`

```bash
bridgent dev ./server.ts
# or
bridgent dev ./server.js
```

- Inherits stdio (your `console.log` shows up in the host's logs)
- Forwards `SIGINT` / `SIGTERM` to the child
- Exits with the child's exit code

Use this from the IDE's `command` config — Claude Code, Cursor, Codex CLI, Gemini CLI all support spawning a binary.

## `serve`

```bash
bridgent serve ./server.ts
```

Identical to `dev` — see the [confusion note above](#a-common-point-of-confusion). The name exists so launchd / systemd / pm2 / Docker units can use the more conventional verb.

## `inspect`

```bash
bridgent inspect ./server.ts
```

Wraps the official [`@modelcontextprotocol/inspector`](https://github.com/modelcontextprotocol/inspector) and connects it to your server file over stdio. It opens a browser window letting you list tools, send `tools/call` payloads, and view traces — no LLM in the loop.

Under the hood:

```bash
# pnpm shells:
pnpm dlx @modelcontextprotocol/inspector node --experimental-strip-types --no-warnings=ExperimentalWarning ./server.ts

# fallback:
npx -y @modelcontextprotocol/inspector node --experimental-strip-types --no-warnings=ExperimentalWarning ./server.ts
```

So `bridgent inspect` is the same as those commands; it just saves you the typing. See [Inspect](./inspect) for usage walkthrough.
```

- [ ] **Step 2: 写中文版**

文件:`apps/docs/zh/guide/cli.md`。要点:
- `# CLI` 保留(技术术语)
- `## A common point of confusion` → `## 一个常见误解`
- `## TypeScript without a build step` → `## TypeScript 无需构建`
- `## dev` / `## serve` / `## inspect` 保留命令名
- 表格表头:`Command` → `命令`、`What it does` → `做什么`、`Most common use` → `常见用法`
- 关键句翻译:
  - "**`bridgent dev` and `bridgent serve` are the same implementation.**" → "**`bridgent dev` 和 `bridgent serve` 是同一份实现。**"
  - "The transport is determined by **what your file does**, not by which CLI command runs it" → "传输由**你的文件做了什么**决定,而不是由哪个 CLI 命令启动它"
- 代码块全部保留;锚点链接 `[confusion note above](#a-common-point-of-confusion)` 中文版改为 `[上面的常见误解](#一个常见误解)`(注意 VitePress 中文 slug 是基于标题的拼音/字符派生,不能直接用英文锚)。**实操**:写中文版时,该锚点改为页内 link `[上面的常见误解](#一个常见误解)`,build 时由 VitePress 生成正确 slug——若 build 报死链,再调整。
- 链接 `[Inspect](./inspect)` → `[探查与调试](/zh/guide/inspect)`(完整 `/zh/` 前缀)

- [ ] **Step 3: 验证 build**

Run: `pnpm --filter @bridgent/docs build`
Expected: PASS。若中文版的页内锚点 `#一个常见误解` 报 dead link,改为 VitePress 生成的实际 slug(可在 dist HTML 里 `grep -o 'id="[^"]*常见误解[^"]*"'` 查看)或直接去掉锚点链接,改为引用 "见上面"。

- [ ] **Step 4: Commit**

```bash
git add apps/docs/guide/cli.md apps/docs/zh/guide/cli.md
git commit -m "docs: add CLI overview page (en + zh)"
```

---

## Task 4: transports.md 增 Web Handler 章节(en + zh)

**Files:**
- Modify: `apps/docs/guide/transports.md`(在 ## HTTP 章节后追加)
- Modify: `apps/docs/zh/guide/transports.md`(中文同步)

- [ ] **Step 1: 修英文版**

在 `apps/docs/guide/transports.md` 中两处改动:

**改动 1:** 顶部表格从 2 行扩为 3 行。找:

```
| Transport | API | When to use |
|---|---|---|
| **stdio** | `createStdioServer` | local IDE-agent integration (Claude Code / Cursor / Codex / Gemini CLI) |
| **HTTP (Streamable)** | `createHttpServer` | shared servers, headless inspection, future Cloud / serverless deployment |
```

替换为:

```
| Transport | API | When to use |
|---|---|---|
| **stdio** | `createStdioServer` | local IDE-agent integration (Claude Code / Cursor / Codex / Gemini CLI) |
| **HTTP (Streamable)** | `createHttpServer` | self-hosted Node, headless inspection |
| **Web Handler** | `createWebHandler` | Cloudflare / Deno / Bun / Vercel Edge — anywhere with a fetch handler runtime |
```

并把紧接的 `Both wrap the same` 一句改为 `All three wrap the same` 。

**改动 2:** 在文件**末尾**(`### Built on Node's built-in HTTP` 节之后)追加新的 `## Web Handler` 章节:

```md
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
```

(注意嵌套 fenced code 用 4 个反引号包裹外层时不必要——VitePress 支持单 ` ``` ` 内的 ` ``` ` 嵌套是不允许的;实操:`Web Handler` 章节作为 markdown 正文,内部 ` ``` ts ` 是普通代码块,正常即可。上面这一整段是要写入文件的内容,不是嵌套代码块。)

- [ ] **Step 2: 修中文版**

文件:`apps/docs/zh/guide/transports.md`。同样两处改动:

**改动 1**:同样把表格扩为 3 行,中文文案:

```
| 传输 | API | 何时使用 |
|---|---|---|
| **stdio** | `createStdioServer` | 本地 IDE-Agent 集成(Claude Code / Cursor / Codex / Gemini CLI) |
| **HTTP(Streamable)** | `createHttpServer` | 自托管 Node、无头探查 |
| **Web Handler** | `createWebHandler` | Cloudflare / Deno / Bun / Vercel Edge —— 任何带 fetch handler 的运行时 |
```

把"两者"措辞改为"这三种"。

**改动 2**:文件末尾追加 `## Web Handler` 章节,完整翻译英文版同名章节。子标题中文:
- `### Web Handler vs HTTP` → `### Web Handler 与 HTTP 的取舍`
- `### Stateful in serverless` → `### Serverless 下的 stateful`
- 5 个集成片段子标题(`Cloudflare Workers` / `Deno Deploy` / `Bun` / `Vercel Edge / Next.js Route Handler` / `Hono (any runtime)`)保留产品名,只把括号注释翻译:`(any runtime)` → `(任意运行时)`、`Vercel Edge / Next.js Route Handler` 保留(产品名)。
- 所有代码块逐字保留。
- 关键句:"The transport on the wire is identical" → "传输协议本身一致(都是 Streamable HTTP),区别只在集成点"

- [ ] **Step 3: 验证结构对齐**

```bash
echo -n "EN headings: "; grep -c '^#' apps/docs/guide/transports.md
echo -n "ZH headings: "; grep -c '^#' apps/docs/zh/guide/transports.md
echo -n "EN fences: "; grep -c '^```' apps/docs/guide/transports.md
echo -n "ZH fences: "; grep -c '^```' apps/docs/zh/guide/transports.md
```
EN/ZH 数字必须分别相等。

- [ ] **Step 4: 验证 build**

Run: `pnpm --filter @bridgent/docs build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/docs/guide/transports.md apps/docs/zh/guide/transports.md
git commit -m "docs(transports): add Web Handler section

createWebHandler ships in @bridgent/core but was undocumented.
Adds 5 runtime integrations (Cloudflare/Deno/Bun/Vercel Edge/Hono)
and clarifies HTTP vs Web Handler trade-off."
```

---

## Task 5: from-openapi.md 字段对齐(en + zh)

**Files:**
- Modify: `apps/docs/guide/from-openapi.md`
- Modify: `apps/docs/zh/guide/from-openapi.md`

**Ground truth:** 见 plan 顶部 "fromOpenApi 选项" 表;源文件 `packages/source-openapi/src/types.ts:11-46`。

**当前文档已经基本正确**(audit 判定 a/b)。本 task 只做精确化:

- [ ] **Step 1: 改英文版**

打开 `apps/docs/guide/from-openapi.md` 做 3 处微调:

**1. `## Spec sources` 节的 4 项 → 与 ground truth 对齐(去掉文档里没说的 URL,补上类型说明):**

找:

```
- **URL**: `'https://api.example.com/openapi.json'`
- **Local file**: `'./openapi.yaml'`
- **Inline object**: a parsed OpenAPI document
- **Raw string**: YAML or JSON text
```

替换为:

```
- **URL** (string starting with `http://` or `https://`): `'https://api.example.com/openapi.json'`
- **Local file path** (string): `'./openapi.yaml'`
- **Inline object**: a parsed OpenAPI document (`Record<string, unknown>`)
- **Raw string**: YAML or JSON text

The full TypeScript type is `string | Record<string, unknown>`.
```

**2. `## Filter pipeline` 表格保持原样**(已与代码一致),只在表格上方加一句话说明顺序的实施位置:

找:

```
## Filter pipeline

Each operation runs through this gate, in order:
```

替换为:

```
## Filter pipeline

Each operation runs through this gate, in order. The pipeline lives in `packages/source-openapi/src/filter.ts`.
```

**3. `## Tool name strategy` 节保持原样**(代码里 slug 上限确认是 64 — 见 `slug.ts:1`,如不确认可保留)。

- [ ] **Step 2: 改中文版**

打开 `apps/docs/zh/guide/from-openapi.md` 做对应 2 处微调(`## Spec sources` 节、`## Filter pipeline` 节)。子标题中文不变;只把对应英文段落的中文翻译同步更新。

- [ ] **Step 3: 验证(逐字对照源码)**

跑下面命令确认每个声明都能在源码中索引到:

```bash
grep -n 'spec' packages/source-openapi/src/types.ts
grep -n 'allowOperations\|denyOperations\|pathFilter\|respectExtensions' packages/source-openapi/src/types.ts
grep -n 'BearerAuth\|bearer' packages/source-openapi/src/types.ts
```

每项都应有匹配。如果文档里某字段在源码搜不到,就是漂移,要修。

- [ ] **Step 4: Build**

Run: `pnpm --filter @bridgent/docs build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/docs/guide/from-openapi.md apps/docs/zh/guide/from-openapi.md
git commit -m "docs(openapi): pin spec source types and filter pipeline location"
```

---

## Task 6: from-prisma.md 默认值精确化 + mutating 静默说明(en + zh)

**Files:**
- Modify: `apps/docs/guide/from-prisma.md`
- Modify: `apps/docs/zh/guide/from-prisma.md`

**Ground truth:** 见 plan 顶部 "fromPrisma 选项" 表;`packages/source-prisma/src/types.ts:55-94`、`filter.ts:4-12`、`tools/index.ts:10-21`。

- [ ] **Step 1: 改英文版**

打开 `apps/docs/guide/from-prisma.md` 做 2 处改动:

**1. `## Built-in guardrails` 表格的 "Default" 列必须显示精确数值。** 找:

```
| Guard | Default | Override |
|---|---|---|
| LIMIT clamp on `findMany.take` | 10000 | `maxTake`, `defaultTake` |
| Soft per-query timeout | 10000 ms | `queryTimeoutMs` |
| `Bytes` field stripping | enforced | `excludeFieldTypes` |
| Raw SQL (`findRaw` / `$queryRaw`) | **permanently disabled** | — |
```

(此表格当前默认值已精确——保留,无需改动。)

但需在表格下方追加一句说明:

```

Default values match `packages/source-prisma/src/types.ts`. `defaultTake` and `maxTake` are independent: `defaultTake` is what we apply when the caller omits `take`; `maxTake` is the hard cap clamped onto the caller's value.
```

**2. `## Mutating operations` 节当前措辞偏暧昧。改为更精确的版本:**

找:

```
## Mutating operations

Write tools (`create / update / delete / upsert / *Many`) are **disabled by default**. `mutating: true` will enable the flag in the API, but **v0.1 ships only read-side factories** — toggling it now is a no-op. v0.2 will land write tools alongside an audit log.
```

替换为:

```
## Mutating operations

Write tools (`create` / `update` / `delete` / `upsert` / `*Many`) are **not generated in v0.1.** The option is parsed by the API:

```ts
await fromPrisma({ client, allow: { mutating: true } })   // typechecks
```

…but the underlying tool factory only registers read-side operations, so mutating methods are **silently dropped** during tool generation. `fromPrisma` does **not** throw, so existing call sites stay valid; they just won't surface write tools until v0.2 ships them with an audit log.

If you need write access today, define the mutation as an explicit Zod tool — see [From Zod](./from-zod).
```

- [ ] **Step 2: 改中文版**

打开 `apps/docs/zh/guide/from-prisma.md`。同样 2 处:

**1. 在中文版 `## 内置护栏`(或对应译名)表格下方追加:**

```

默认值与 `packages/source-prisma/src/types.ts` 一致。`defaultTake` 和 `maxTake` 是两个独立选项:`defaultTake` 是调用方未传 `take` 时我们填入的值;`maxTake` 是钳制到调用方 `take` 之上的硬上限。
```

**2. 找现有 `## 写操作`(或类似中文标题),整段替换为:**

```
## 写操作

写工具(`create` / `update` / `delete` / `upsert` / `*Many`)在 **v0.1 不会生成**。该选项在 API 层被正常解析:

```ts
await fromPrisma({ client, allow: { mutating: true } })   // 类型检查通过
```

……但底层工具工厂只注册读侧的工具,因此写方法在工具生成时**被静默丢弃**。`fromPrisma` **不会**抛错,所以现有调用点保持有效——只是在 v0.2 落地审计日志之前看不到写工具。

如果今天就需要写,把这个变更定义成显式 Zod 工具——见 [从 Zod 接入](/zh/guide/from-zod)。
```

中文版的链接 `[从 Zod 接入](/zh/guide/from-zod)` 必须带 `/zh/` 前缀。

- [ ] **Step 3: 验证**

```bash
# 默认值在源码可索引到
grep -n 'defaultTake\|maxTake\|queryTimeoutMs\|excludeFieldTypes' packages/source-prisma/src/types.ts

# READ_FACTORIES 仅 5 类(确认 mutating 静默说法)
grep -n 'createReadTool\|READ_FACTORIES' packages/source-prisma/src/tools/index.ts
```

- [ ] **Step 4: Build**

Run: `pnpm --filter @bridgent/docs build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/docs/guide/from-prisma.md apps/docs/zh/guide/from-prisma.md
git commit -m "docs(prisma): pin guardrail defaults and clarify mutating no-op

mutating: true parses but is silently dropped during tool generation
in v0.1 (no mutating factory exists). Document this precisely so
users don't expect write tools to appear."
```

---

## Task 7: Sidebar 扩容(en.ts + zh.ts)

**Files:**
- Modify: `apps/docs/.vitepress/locales/en.ts`
- Modify: `apps/docs/.vitepress/locales/zh.ts`

- [ ] **Step 1: 改 en.ts**

找 `sidebar` 块,把 `Sources` 与 `Transports & Tooling` 两个分组改为:

```ts
{
  text: 'Sources',
  items: [
    { text: 'Overview', link: '/guide/sources-overview' },
    { text: 'From Zod', link: '/guide/from-zod' },
    { text: 'From OpenAPI', link: '/guide/from-openapi' },
    { text: 'From Prisma', link: '/guide/from-prisma' },
  ],
},
{
  text: 'Transports & Tooling',
  items: [
    { text: 'Transports', link: '/guide/transports' },
    { text: 'CLI', link: '/guide/cli' },
    { text: 'Inspect', link: '/guide/inspect' },
  ],
},
```

(其他分组 `Introduction` 与 `Hosts` 不动。)

- [ ] **Step 2: 改 zh.ts**

找 `sidebar` 块,把对应分组改为(注意 `link` 必须带 `/zh/` 前缀):

```ts
{
  text: '数据源',
  items: [
    { text: '总览', link: '/zh/guide/sources-overview' },
    { text: '从 Zod 接入', link: '/zh/guide/from-zod' },
    { text: '从 OpenAPI 接入', link: '/zh/guide/from-openapi' },
    { text: '从 Prisma 接入', link: '/zh/guide/from-prisma' },
  ],
},
{
  text: '传输与工具',
  items: [
    { text: '传输层', link: '/zh/guide/transports' },
    { text: 'CLI', link: '/zh/guide/cli' },
    { text: '探查与调试', link: '/zh/guide/inspect' },
  ],
},
```

注意 zh.ts 中其余条目(`引言`、`宿主`)的现有 `/zh/` 前缀已正确(commit `5ce1f77` 修过),保持不变。

- [ ] **Step 3: 路径前缀硬验证**

```bash
# 中文 locale 内不应有任何裸 /guide/ 链接
grep -n '"/guide/' apps/docs/.vitepress/locales/zh.ts && echo "FOUND BARE PATH — FIX" || echo OK
```
应输出 `OK`。

- [ ] **Step 4: typecheck + lint + build**

```bash
pnpm --filter @bridgent/docs typecheck
pnpm --filter @bridgent/docs lint
pnpm --filter @bridgent/docs build
```
全部 PASS。build 死链会在 sidebar 指向不存在页时立刻报。

- [ ] **Step 5: Commit**

```bash
git add apps/docs/.vitepress/locales/en.ts apps/docs/.vitepress/locales/zh.ts
git commit -m "docs(sidebar): add Overview / From Zod / CLI entries"
```

---

## Task 8: CLAUDE.md 更新

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: 替换 "What this is" 节**

找当前 CLAUDE.md 第 5-7 行(及其余的 "What this is" 段落):

```
Bridgent exposes existing APIs / databases / code (OpenAPI, SQL schema, Prisma, Drizzle, tRPC, Zod) as production-ready **MCP servers**. Currently in alpha — only the Zod-tools path (`@bridgent/core` + `bridgent dev`) is wired end-to-end. Source adapters (OpenAPI / Prisma / Drizzle / tRPC / GraphQL) are planned in subsequent phases.
```

替换为:

```
Bridgent exposes existing APIs / databases / code (OpenAPI, Prisma schema, Zod functions) as production-ready **MCP servers**. Alpha shipping today:

- **Sources**: `@bridgent/core` (hand-written Zod tools), `@bridgent/source-openapi`, `@bridgent/source-prisma` (read-only)
- **Transports**: stdio (`createStdioServer`), Streamable HTTP (`createHttpServer`), Web Standard fetch handler (`createWebHandler`)
- **CLI** (`bridgent`): `dev` / `serve` / `inspect`

Roadmap: `@bridgent/source-drizzle` / `@bridgent/source-trpc` / `@bridgent/source-graphql`, Prisma write tools + audit log, hosted control plane.
```

- [ ] **Step 2: 更新 "@bridgent/core data flow" 子节**

找当前 CLAUDE.md 中的:

```
The contract is intentionally narrow — three exported symbols:

1. `defineTool({ name, description?, inputSchema: ZodObject, run })` — identity function for type inference (`packages/core/src/define-tool.ts`).
2. `createStdioServer({ name, version, tools })` — wires tools into MCP SDK 1.29's `McpServer.registerTool` and connects a `StdioServerTransport` (`packages/core/src/server.ts`).
3. The wrapper passes `inputSchema.shape` (Zod v4 raw shape) to `registerTool`, and stringifies non-string `run` results into `{ content: [{ type: 'text', text }] }`.
```

替换为:

```
The contract is intentionally narrow. The full export surface (`packages/core/src/index.ts`):

1. `defineTool({ name, description?, inputSchema: ZodObject, run })` — identity function for type inference (`packages/core/src/define-tool.ts`).
2. `createStdioServer({ name, version, tools })` — wires tools into MCP SDK 1.29's `McpServer.registerTool` and connects a `StdioServerTransport` (`packages/core/src/server.ts`).
3. `createHttpServer({ name, version, tools, port?, path?, host?, stateful? })` — same registration over Streamable HTTP using Node's built-in `http.createServer` (`packages/core/src/http.ts`). Defaults: port 3333, path `/mcp`, host `127.0.0.1`, stateful.
4. `createWebHandler({ name, version, tools, stateful? })` — runtime-agnostic `(Request) => Promise<Response>` handler for Cloudflare / Deno / Bun / Vercel Edge / Hono (`packages/core/src/web.ts`).
5. `registerTools(mcpServer, tools)` — shared helper used by all three transports; stringifies non-string `run` results into `{ content: [{ type: 'text', text }] }`.

The wrapper passes `inputSchema.shape` (Zod v4 raw shape) to `registerTool`.
```

(其他段落,包括 "Key invariants"、`bridgent` CLI 节、Conventions、Known soft spots,**全部不动**。)

- [ ] **Step 3: 检查 ADR 引用未被破坏**

```bash
grep -n 'ADR-' CLAUDE.md
```
应仍能看到所有 ADR 引用(004 / 005 / 006 / 008 等)。

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(CLAUDE): reflect shipped sources and transports

Removes the stale 'only Zod is wired' claim; documents the actual
v0.1 surface area: 3 sources, 3 transports, 3 CLI commands."
```

---

## Task 9: 全套验证 + sidebar 跳转手测

- [ ] **Step 1: 静态全套**

```bash
pnpm turbo run build typecheck lint --filter=@bridgent/docs
```
必须全绿。

- [ ] **Step 2: 中文 link 前缀硬验证(防回归)**

```bash
grep -rn '"link":\s*"/guide/\|link: ['\''"]/guide/' apps/docs/zh/ apps/docs/.vitepress/locales/zh.ts && echo BAD || echo OK
```
应输出 `OK`。

- [ ] **Step 3: 中英结构对齐(对所有受影响文件)**

对以下 4 对文件:`transports.md` / `from-openapi.md` / `from-prisma.md` / `sources-overview.md` / `from-zod.md` / `cli.md`,分别跑:

```bash
for f in sources-overview from-zod cli transports from-openapi from-prisma; do
  en=$(grep -c '^#' apps/docs/guide/$f.md)
  zh=$(grep -c '^#' apps/docs/zh/guide/$f.md)
  enf=$(grep -c '^```' apps/docs/guide/$f.md)
  zhf=$(grep -c '^```' apps/docs/zh/guide/$f.md)
  echo "$f: heads en=$en zh=$zh; fences en=$enf zh=$zhf"
  [ "$en" = "$zh" ] && [ "$enf" = "$zhf" ] && echo "  OK" || echo "  MISMATCH"
done
```

任何 MISMATCH 都要调修。

- [ ] **Step 4: dev 抓取核验(自动化)**

启动 dev,build dist HTML 已经在 Step 1 跑过,直接对 dist 抓页面:

```bash
[ -f apps/docs/.vitepress/dist/guide/sources-overview.html ] && echo "EN sources-overview OK" || echo "FAIL"
[ -f apps/docs/.vitepress/dist/zh/guide/sources-overview.html ] && echo "ZH sources-overview OK" || echo "FAIL"
[ -f apps/docs/.vitepress/dist/guide/from-zod.html ] && echo "EN from-zod OK" || echo "FAIL"
[ -f apps/docs/.vitepress/dist/zh/guide/from-zod.html ] && echo "ZH from-zod OK" || echo "FAIL"
[ -f apps/docs/.vitepress/dist/guide/cli.html ] && echo "EN cli OK" || echo "FAIL"
[ -f apps/docs/.vitepress/dist/zh/guide/cli.html ] && echo "ZH cli OK" || echo "FAIL"

# Web Handler 章节存在
grep -q 'createWebHandler' apps/docs/.vitepress/dist/guide/transports.html && echo "EN transports has Web Handler OK" || echo "FAIL"
grep -q 'createWebHandler' apps/docs/.vitepress/dist/zh/guide/transports.html && echo "ZH transports has Web Handler OK" || echo "FAIL"

# 中文 sidebar 不再有裸 /guide/ 链接(检查任意一页 dist HTML)
grep -oE 'href="/guide/[^"]*"' apps/docs/.vitepress/dist/zh/guide/sources-overview.html && echo BAD || echo "ZH sidebar prefix OK"
```

- [ ] **Step 5: 例子可启动冒烟**

```bash
timeout 5 node packages/cli/dist/cli.mjs dev examples/01-zod-hello/server.ts < /dev/null
echo "exit=$?"
```
预期:进程在 timeout 时被 kill(stdio 阻塞读),`echo "exit=$?"` 大概率是 124(timeout 退出码)或非 0——**只要不是 cli 代码错误即可**。如果 stderr 看到 "File not found" 或 import 失败,说明 docs 改动意外破坏了 examples 引用——回头排查。

- [ ] **Step 6: 最终 git 状态干净**

```bash
git status -s
```
应空(若仍有 docs/superpowers/* 未 commit,看是不是新生成的 plan/spec,这些不在本 plan 范围,留给用户决定)。

- [ ] **Step 7: 最终 git log 摘要**

```bash
git log --oneline -10
```
最新 8 个 commit 应当包括(顺序大致):
- docs(sidebar): add Overview / From Zod / CLI entries
- docs(prisma): pin guardrail defaults...
- docs(openapi): pin spec source types...
- docs(transports): add Web Handler section
- docs: add CLI overview page (en + zh)
- docs: add From Zod source page (en + zh)
- docs: add sources overview page (en + zh)
- docs(CLAUDE): reflect shipped sources and transports

**本步不 commit。** 若 Step 1-5 任一项 FAIL,定位修复后追加单独的 fix 提交,不要 amend 已落地 commit。

---

## Self-Review

(plan 作者的自审记录,执行者可跳过)

**Spec 覆盖:**
- spec §4.1 6 个新文件 → Tasks 1/2/3 各覆盖一对
- spec §4.2 9 个修改文件 → Tasks 4/5/6/7/8 全覆盖
- spec §5.1 sources-overview 内容规范 → Task 1
- spec §5.2 from-zod 内容规范 → Task 2
- spec §5.3 cli 内容规范 → Task 3
- spec §5.4 Web Handler 章节 → Task 4
- spec §5.5 from-openapi/prisma 校准 → Tasks 5/6
- spec §5.6 sidebar → Task 7
- spec §5.7 链接前缀硬约束 → Tasks 1/2/3 中文步骤里都强调 `/zh/`,Task 7 与 Task 9 grep 验证
- spec §6 CLAUDE.md → Task 8
- spec §7 验证策略 → Task 9 全覆盖

**占位扫描:** 已检查。Tasks 1/2/3 给出英文完整内容(用户可逐字写入);中文版给出标题映射 + 关键句翻译 + 术语表。这不算 "TODO":翻译是工作内容,但每个任务都给了具体执行指引、不存在"按上面那样翻译"这种空头话。Tasks 5/6 的"找/替换为"片段都是逐字代码块,不存在含糊。

**类型一致性:**
- `BridgentTool` / `defineTool` / `createStdioServer` / `createHttpServer` / `createWebHandler` 在 plan 顶部 ground truth、Task 1/2/3 内容、Task 8 CLAUDE.md 替换段中名字一致
- 默认值 10000 / `'/mcp'` / `127.0.0.1` / `3333` / `true` 多处出现,值一致
- sidebar 路径在 Task 7、Task 1/2/3 的 commit 命令路径、Task 9 dist 验证路径之间逐字一致

无 self-review 修订。

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-06-docs-content-refresh.md`. Two execution options:

**1. Subagent-Driven (推荐)** — 每 task 派独立 subagent,主 session 在任务间 review,迭代快、上下文干净。本 plan 任务高度独立(每对页一个 task),subagent 模式很合适。

**2. Inline Execution** — 在当前 session 串行执行。

哪种?
