# Bridgent Plan 2 — `@bridgent/source-openapi` + 两个真实 OpenAPI 示例

## Context

Plan 1 已经把 monorepo / core / cli / hello-world 跑通（见 `docs/plans/2026-06-04-day-1-2-skeleton.md`）。Plan 2 要交付 Bridgent 的**第一个真正有用的 source 适配器**：把任意 OpenAPI 3.x spec 一键转成 MCP tool 数组，让用户用 Claude Code / Cursor 等宿主直接调用现有 REST API。

完成本 plan 后，Bridgent 从「能跑 toy demo」升级到「能 expose 一个真实生产 SaaS 的 API」，是 Day 3-4 的核心里程碑。

## 范围

| 模块 | 做什么 | 不做什么 |
|---|---|---|
| `packages/source-openapi` | `fromOpenApi(opts)` → `BridgentTool[]`；解析、过滤、HTTP 调用、Bearer auth | OAuth2 / API key 多来源、流式响应、multipart upload、GraphQL |
| `examples/02-openapi-petstore` | 零 auth 的 PetStore 3.1，README 一行命令演示 | — |
| `examples/02-openapi-github` | GitHub REST API（`/repos/{owner}/{repo}/issues\|pulls\|releases` 子集）+ Bearer PAT | — |
| `docs/decisions.md` 增补 | ADR-009 ~ ADR-012（parser、jsonschema-to-zod、read-only 默认、native fetch） | — |
| `apps/docs/guide/` 增页 | `from-openapi.md` —— OpenAPI source 用法文档 | API reference 自动生成 |

**显式不做**：
- 修改 `@bridgent/core`（沿用现有 `BridgentTool` 接口；source-openapi 内部把 JSON Schema 转成 zod object 后产出符合接口的 tool）
- HTTP transport / inspector UI（留给 Plan 4）
- 跨宿主联通测试（留给 Plan 5）

## 关键技术决策（已锁定）

1. **OpenAPI parser**：`@scalar/openapi-parser` 0.28.x（ESM-only、TS 原生、自带 3.0→3.1 upgrader、自带 dereference + load 插件）
2. **JSON Schema → Zod**：**自写 ~150 行** narrow converter（不引入 `json-schema-to-zod`，因其 codegen 本质需 eval）。覆盖：object / array / string / number / integer / boolean / enum / const / oneOf / anyOf / allOf-merge / nullable / format（email/uuid/date-time）/ min-max / required / additionalProperties。`discriminator` 暂用 `z.union` fallback。
3. **HTTP client**：Node 22.18+ 原生 `fetch`，4xx/5xx **不 throw**，包成 `{ status, ok, body }` 喂回 LLM
4. **默认 read-only**：仅 GET/HEAD 暴露；要写需显式 `allow: { mutating: true }` 或 allowOperations 白名单
5. **Vendor extension**：`x-bridgent-allow`（不用 `x-mcp-allow` 防与他者冲突）；`respectExtensions: true` 默认开
6. **Auth v0.1**：仅 Bearer token；接受 string 或 `() => string | Promise<string>` 函数（支持动态 refresh）
7. **Tool name slug**：`operationId` 优先；缺失时 `${method}_${path-slugified}`，截断 64 字节，`^[a-zA-Z_][a-zA-Z0-9_-]{0,63}$`
8. **Examples 双开**：PetStore 3.1（零 auth，README 主推）+ GitHub REST（`pathFilter` 缩到 issues/pulls/releases 三个 namespace）

## 仓库新增（落地清单）

```
packages/source-openapi/
├── src/
│   ├── index.ts                    # re-export fromOpenApi + 类型
│   ├── from-openapi.ts             # 主入口编排
│   ├── parse-openapi.ts            # @scalar/openapi-parser 包装
│   ├── operation-to-tool.ts        # 单个 OperationObject → BridgentTool
│   ├── jsonschema-to-zod.ts        # ~150 行自写转换器
│   ├── http.ts                     # fetch 包装 + URL/query/header 拼装
│   ├── filter.ts                   # method / path / extension / allow / deny 过滤
│   ├── slug.ts                     # operationId / tool name slug
│   └── types.ts                    # FromOpenApiOptions / 内部类型
├── test/
│   ├── jsonschema-to-zod.test.ts   # 覆盖 9 类 schema 形态
│   ├── slug.test.ts                # operationId / fallback / 重复检测
│   ├── filter.test.ts              # 默认 read-only / mutating / extension
│   └── operation-to-tool.test.ts   # 用 PetStore 3.1 spec 的子集做 fixture
├── tsdown.config.ts
├── tsconfig.json
├── vitest.config.ts
├── package.json                    # name: @bridgent/source-openapi
└── README.md

examples/02-openapi-petstore/
├── server.ts                       # ~6 行调 fromOpenApi
├── package.json
└── README.md

examples/02-openapi-github/
├── server.ts                       # 带 Bearer + pathFilter
├── package.json
├── .env.example                    # GITHUB_TOKEN=
└── README.md

apps/docs/guide/
└── from-openapi.md                 # 新增一页 sidebar 入口

docs/
├── progress.md                     # Plan 2 进度补记
└── decisions.md                    # ADR-009 ~ ADR-012
```

## API 形态

```ts
// packages/source-openapi/src/types.ts
export interface FromOpenApiOptions {
  /** 文件路径 / URL / OpenAPI 文档对象 / YAML 字符串 */
  spec: string | OpenAPI.Document

  /** 覆盖 spec.servers[0].url（用于 sandbox vs prod 切换） */
  baseUrl?: string

  /** v0.1 仅支持 Bearer */
  auth?: { type: 'bearer', token: string | (() => string | Promise<string>) }

  /** Tool name 命名空间前缀，避免多 source 冲突 */
  namespace?: string

  /** 方法白名单。默认 ['GET','HEAD'] */
  allow?: {
    mutating?: boolean              // true 时合并加 POST/PUT/PATCH/DELETE
    methods?: HttpMethod[]
  }

  /** operationId 精确白名单；非空时只暴露这些 */
  allowOperations?: string[]

  /** operationId 黑名单；在 allowOperations 之后应用 */
  denyOperations?: string[]

  /** path 过滤，砍 GitHub-size spec */
  pathFilter?: RegExp | ((path: string) => boolean)

  /** 是否尊重 spec 内的 x-bridgent-allow 扩展。默认 true */
  respectExtensions?: boolean

  /** 自定义 fetch（注入 mock 或代理）。默认 globalThis.fetch */
  fetch?: typeof globalThis.fetch
}

export async function fromOpenApi(opts: FromOpenApiOptions): Promise<BridgentTool[]>
```

### 过滤决策顺序（写进 README，避免歧义）

```
1. method ∈ allow.methods?  (默认 GET/HEAD)        → 否则丢
2. pathFilter(path) 通过？                          → 否则丢
3. respectExtensions && op['x-bridgent-allow']===false → 丢
4. denyOperations 命中？                            → 丢
5. allowOperations 非空 && 未命中？                 → 丢
6. 通过 → operation-to-tool
```

### Tool input flatten 策略

OpenAPI 一个 operation 的入参分散在 path / query / header / body 四处，但 MCP tool 只有一个 inputSchema。统一 flatten：

```
input = z.object({
  // path params 直接 promote
  owner: z.string(),
  repo:  z.string(),
  // query params 直接 promote
  state: z.enum(['open','closed','all']).optional(),
  // body 嵌套在 .body
  body:  z.object({...}).optional(),
})
```

`run()` 时按原始 OperationObject 的 `parameters[].in` 把 args 拆回 path / query / header，body 单独发。冲突字段（path 与 query 同名）：path 优先，query 重命名为 `query_<name>` 并写日志。

## Examples

### `examples/02-openapi-petstore/server.ts`

```ts
import { createStdioServer } from '@bridgent/core'
import { fromOpenApi } from '@bridgent/source-openapi'

await createStdioServer({
  name: 'petstore',
  version: '0.0.1',
  tools: await fromOpenApi({
    spec: 'https://raw.githubusercontent.com/OAI/OpenAPI-Specification/main/examples/v3.1/petstore.yaml',
  }),
})
```

### `examples/02-openapi-github/server.ts`

```ts
import process from 'node:process'
import { createStdioServer } from '@bridgent/core'
import { fromOpenApi } from '@bridgent/source-openapi'

await createStdioServer({
  name: 'github-readonly',
  version: '0.0.1',
  tools: await fromOpenApi({
    spec: 'https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.json',
    namespace: 'gh_',
    auth: { type: 'bearer', token: process.env.GITHUB_TOKEN! },
    pathFilter: /^\/repos\/\{owner\}\/\{repo\}\/(issues|pulls|releases)/,
    // mutating defaults to false → only GET/HEAD
  }),
})
```

## 实施顺序（每步可独立测试）

1. **`packages/source-openapi` 骨架**
   - `package.json`（catalog 引 zod、@scalar/openapi-parser；deps 列 @bridgent/core 为 workspace；tsdown/typescript/vitest 入 catalog）
   - `tsconfig.json` / `tsdown.config.ts`（ESM-only、deps.neverBundle 含 zod、@scalar/openapi-parser、@bridgent/core）
   - `vitest.config.ts`
   - 把 `@scalar/openapi-parser` 加进 `pnpm-workspace.yaml` catalog（先 `npm view` 锁版本）
2. **`jsonschema-to-zod.ts`** + 单测（先这步，最容易解耦）
3. **`slug.ts`** + 单测
4. **`filter.ts`** + 单测（用 mock OperationObject）
5. **`parse-openapi.ts`**：包 `@scalar/openapi-parser` 的 `load()` + `dereference()`，统一返回 dereferenced spec；进 pkg 后 30min 实测 API（Plan agent 报告 U1）
6. **`http.ts`**：`buildRequest(operation, args, baseUrl, auth)` → `{ url, method, headers, body }`；`callHttp()` 发请求 + 包错误结构
7. **`operation-to-tool.ts`**：编排 #2-#6；输出符合 `BridgentTool` 接口的对象
8. **`from-openapi.ts`** 主入口：load → dereference → filter → map → namespace 前缀 → 重名检测
9. **PetStore example**（零 auth，先验证 happy path）
10. **GitHub example**（加 Bearer + pathFilter；进 pkg 后实测 GitHub spec 3.0→3.1 升级是否丢字段，Plan agent 报告 U2）
11. **`apps/docs/guide/from-openapi.md`**：用法 + 决策顺序 + 重名错误处理
12. **`docs/decisions.md`** 增 ADR-009 ~ ADR-012
13. **`docs/progress.md`** 增 Plan 2 章节

## 验证（端到端）

按顺序跑、全部为绿才算 Plan 2 完成：

1. `pnpm install` 不报 engines / peer 错（catalog 新加 @scalar/openapi-parser 后）
2. `pnpm turbo run lint typecheck test build` 11→14 packages 全绿（新增 source-openapi + 2 examples）
3. **PetStore 联通性手测**：
   - `pnpm --filter @bridgent-examples/02-openapi-petstore start`
   - 用 Plan 1 的 stdio JSON-RPC 探针（或 `npx @modelcontextprotocol/inspector`）发 `tools/list` 应看到 PetStore 的 GET 操作（`findPetsByStatus`、`getPetById` 等）
   - 发 `tools/call findPetsByStatus { status: 'available' }`，应真正发 HTTP 出去（即便 PetStore 在线版可能 offline，也要看到 `{ ok: false, status: ..., body: ... }` 而不是 throw）
4. **GitHub 联通性手测**（需 PAT）：
   - `GITHUB_TOKEN=ghp_xxx pnpm --filter @bridgent-examples/02-openapi-github start`
   - `tools/list` 应只看到 `gh_*` 前缀且全是 issues/pulls/releases 的 GET 操作
   - `tools/call gh_issues_list_for_repo { owner: 'cli', repo: 'cli' }` 应返回真实 issues JSON
5. **写操作默认拒绝**：把 PetStore example 临时加 `mutating: true`，应能看到 `addPet` 等 POST tool；去掉则看不到（验证默认安全姿态）
6. **vitest 单测覆盖率**：jsonschema-to-zod 9 类 schema、slug 命名、filter 决策顺序，至少 80% 覆盖

## 风险与待实测项（进 pkg 后立即验证）

| # | 项 | 验证方法 |
|---|---|---|
| R1 | `@scalar/openapi-parser@0.28` 的 `load()` / `dereference()` 实际签名 | 写一个 src/probe.ts 直接 import 跑通 PetStore 后删 |
| R2 | GitHub spec 3.0→3.1 自动升级的字段完整性 | 取 GitHub spec dereference 后随机抽 10 个 operation 看 schema |
| R3 | `text/event-stream` / `multipart/form-data` 响应取舍 | 遇到时直接 toString 截断到 64KB；写进 README "non-JSON response handling" |
| R4 | path / query 同名冲突 | 在 GitHub spec 中确实存在；filter 时 detect → query 重命名为 `query_<name>` + warn log |
| R5 | 重名 tool（多个 source 拼装）| from-openapi 内部 dedupe；多个 fromOpenApi 调用之间由 user 通过 namespace 区分；提供 fail-fast 错误 + actionable msg |
| R6 | `discriminator` 转 `z.union` 在 LLM 调用时丢失类型选择信息 | 验证一个有 discriminator 的真实 spec（GitHub 没用太多）；不行就 fallback 到 `z.any().describe(...)` |
| R7 | Node 22.18+ `fetch` 在 stdio 模式下 keep-alive 连接是否 leak | 单测里 `--detect-open-handles` |

## ADR 增补（写进 docs/decisions.md）

- **ADR-009** OpenAPI parser = `@scalar/openapi-parser`（ESM-only / TS 原生 / 带 upgrader）
- **ADR-010** JSON Schema → Zod 自写 narrow converter（不依赖 codegen 包，可读可调试）
- **ADR-011** OpenAPI source 默认 read-only，写操作需显式 `allow.mutating: true`
- **ADR-012** OpenAPI source 用 Node 原生 fetch；4xx/5xx 不 throw，结构化错误喂给 LLM
- **ADR-013** Vendor extension 命名 `x-bridgent-*`（避开 `x-mcp-*` 命名空间）

## 后续 plan 预告（不在本次范围）

- **Plan 3 (Day 4-5)**：`packages/source-prisma` 只读 4 件套（find / findMany / aggregate / count）+ `LIMIT 10000` + query timeout 护栏
- **Plan 4 (Day 5-6)**：`bridgent inspect` web UI + HTTP/SSE 双协议
- **Plan 5 (Day 6-7)**：`packages/adapter-host` 跨宿主 e2e（Claude Code / Codex / Cursor / Gemini CLI）+ 30 秒 demo GIF
- **Plan 6**：发布流（changesets）+ awesome-* PR 串投放 + HN/PH 文案

## Critical Files

- `/Users/mark/myself/code/Bridgent/packages/source-openapi/src/from-openapi.ts`
- `/Users/mark/myself/code/Bridgent/packages/source-openapi/src/jsonschema-to-zod.ts`
- `/Users/mark/myself/code/Bridgent/packages/source-openapi/src/operation-to-tool.ts`
- `/Users/mark/myself/code/Bridgent/packages/source-openapi/src/parse-openapi.ts`
- `/Users/mark/myself/code/Bridgent/packages/source-openapi/src/http.ts`
- `/Users/mark/myself/code/Bridgent/packages/source-openapi/src/filter.ts`
- `/Users/mark/myself/code/Bridgent/packages/source-openapi/src/slug.ts`
- `/Users/mark/myself/code/Bridgent/packages/source-openapi/test/*.test.ts`
- `/Users/mark/myself/code/Bridgent/examples/02-openapi-petstore/server.ts`
- `/Users/mark/myself/code/Bridgent/examples/02-openapi-github/server.ts`
- `/Users/mark/myself/code/Bridgent/pnpm-workspace.yaml`（catalog 增 @scalar/openapi-parser）
- `/Users/mark/myself/code/Bridgent/apps/docs/guide/from-openapi.md`
- `/Users/mark/myself/code/Bridgent/apps/docs/.vitepress/config.ts`（sidebar 增 from-openapi 入口）
- `/Users/mark/myself/code/Bridgent/docs/decisions.md`
- `/Users/mark/myself/code/Bridgent/docs/progress.md`
