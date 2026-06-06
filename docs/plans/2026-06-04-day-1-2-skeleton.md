# Bridgent — Day 1-2 Monorepo 骨架 Plan

## Context

Bridgent 是一个 greenfield 开源项目，定位「**一行命令把已有 OpenAPI / Prisma / Drizzle / tRPC / Zod 暴露为 MCP Server**」，让 Claude Code、Codex、Cursor、Gemini CLI 等宿主即时可用。差异点是跨框架适配 + stdio/HTTP 双协议 + 内置权限矩阵，对标 `samchon/nestia`（绑 NestJS 单框架）。

仓库 `/Users/mark/myself/code/Bridgent` 当前只有 `.git`，**完全空仓**。本 plan 不试图一口气覆盖完整 v0.1，只做 **Day 1-2 骨架**：能跑通一个 hello-world Zod tool → stdio MCP server 的最小闭环，并把 monorepo / CI / docs 站点的地基打牢。后续 source-openapi / source-prisma / inspector UI / 跨宿主测试等留给下一轮 plan。

目标：**第二天结束时，能 `pnpm --filter @bridgent-examples/01-zod-hello start`，stdio 上响应 `tools/list` 并返回一个 `add(a,b)` 工具；同时 `pnpm docs:dev` 起得来 VitePress 站；`pnpm turbo run lint typecheck test build` 全绿**。

## 范围（Day 1-2 仅做这些）

| 模块 | 做什么 | 不做什么 |
|---|---|---|
| `packages/core` | `defineTool()` + `createStdioServer()` + 1 个 vitest smoke | source-* 任何导入器、HTTP transport、权限矩阵 |
| `packages/cli` (bin: `bridgent`) | `bridgent dev <file>`、`--version`、`--help` | `init`、`expose`、`inspect`、`publish`、`test` |
| `examples/01-zod-hello` | 一个 `add(a,b)` 的 server.ts | 其他 4 个示例 |
| `apps/docs` (VitePress) | 首页 + 2 页 guide（What is / Getting Started） | API 自动生成、暗色主题、搜索、i18n |
| 根 `/docs` | `progress.md`、`decisions.md`（AI 进度档案，不发布） | — |
| CI | Node 22.18 + 24 矩阵跑 lint / typecheck / test / build | e2e 跨宿主、release workflow |

## 关键技术决策（已锁定）

1. **包管理**：pnpm 10.x workspaces + `catalog:` 共享版本
2. **任务编排**：Turborepo 2.9.x（`turbo run build/dev/test/lint/typecheck`）
3. **Lib 打包**：tsdown 0.22.x（Rolldown 驱动，**ESM-only**，不出 CJS）
4. **MCP SDK**：`@modelcontextprotocol/sdk@^1.29.0`，**不被 bundle，进 `external`**
5. **CLI 框架**：citty 0.2.x + consola
6. **测试**：Vitest 4.x
7. **Lint**：`@antfu/eslint-config@^9`
8. **TypeScript 6.x，target ES2023，moduleResolution=Bundler，strict=true，noUncheckedIndexedAccess=true**
9. **不启用 project references**（与 tsdown 的 dts 输出冲突；turbo 拓扑缓存已够用）
10. **Node 引擎**：`>=22.18.0 || >=24`（tsdown 0.22 强制；`.npmrc` 设 `engines-strict=true`）
11. **包命名**：scoped lib 全部 `@bridgent/*`，CLI 入口 npm 名直接 `bridgent`（无 scope）
12. **Zod**：catalog 锁 v4（`^4.4.3`），peer 由 example/cli 提供
13. **TS runtime**（`bridgent dev <user-file>`）：方案 A 走 Node `--experimental-strip-types`（22.18+ 内置）；如实测不稳，回退方案 B `tsx` 子进程

## 仓库结构（落地清单）

```
bridgent/
├── apps/
│   └── docs/                       # VitePress 站
│       ├── .vitepress/config.ts
│       ├── index.md
│       ├── guide/what-is-bridgent.md
│       ├── guide/getting-started.md
│       └── package.json
├── packages/
│   ├── core/
│   │   ├── src/
│   │   │   ├── index.ts            # re-export
│   │   │   ├── define-tool.ts      # defineTool<I,O>()
│   │   │   └── server.ts           # createStdioServer()
│   │   ├── test/server.test.ts
│   │   ├── tsdown.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json            # name: @bridgent/core
│   └── cli/
│       ├── src/
│       │   ├── cli.ts              # citty entry, shebang via tsdown banner
│       │   └── commands/dev.ts     # bridgent dev <file>
│       ├── tsdown.config.ts
│       ├── tsconfig.json
│       └── package.json            # name: bridgent, bin: { bridgent: ./dist/cli.js }
├── examples/
│   └── 01-zod-hello/
│       ├── server.ts               # defineTool({ add })
│       └── package.json            # workspace deps: @bridgent/core, bridgent, zod
├── docs/                           # AI 进度档案（不发布）
│   ├── progress.md
│   ├── decisions.md
│   └── plans/                      # 后续 plan 文件归档处
├── .github/workflows/ci.yml
├── .gitignore
├── .npmrc                          # engines-strict=true, auto-install-peers=true
├── eslint.config.ts                # @antfu/eslint-config
├── tsconfig.base.json
├── tsconfig.json                   # IDE only, files: []
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── README.md
└── LICENSE                         # MIT
```

## 关键文件内容要点

### `pnpm-workspace.yaml`
- packages: `apps/*`, `packages/*`, `examples/*`
- catalog 共享：`@modelcontextprotocol/sdk`, `zod`, `typescript`, `tsdown`, `vitest`, `turbo`, `eslint`, `@antfu/eslint-config`, `citty`, `consola`, `vitepress`, `vue`, `@types/node`
- 命中规则：被 ≥2 个 package 用的 dep 必须进 catalog；只被 1 处用的不进

### `turbo.json` 任务图
- `build`: `dependsOn: ["^build"]`, `outputs: ["dist/**"]`
- `dev`: `cache: false`, `persistent: true`, `dependsOn: ["^build"]`
- `test`: `dependsOn: ["^build"]`, `outputs: ["coverage/**"]`
- `typecheck`: `dependsOn: ["^build"]`（消费 dts；如发现循环再切回 src 路径映射）
- `lint`: 无依赖
- VitePress build 的 outputs 含 `apps/docs/.vitepress/dist/**` 和 `.vitepress/cache/**`

### `tsconfig.base.json`
```jsonc
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2023"],
    "esModuleInterop": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### `packages/core` 关键代码
- `defineTool<I extends z.ZodTypeAny, O>({ name, description?, inputSchema: I, run: (input: z.infer<I>) => O | Promise<O> })`
- `createStdioServer({ name, version, tools })`：
  - `new McpServer({ name, version })`
  - 遍历 tools 调 `server.tool(name, description, schema.shape ?? schema, handler)`
  - handler 返回 `{ content: [{ type: 'text', text: ... }] }`
  - `await server.connect(new StdioServerTransport())`
- 关键 import 路径以实测为准（candidates: `@modelcontextprotocol/sdk/server/mcp.js` + `/server/stdio.js`）；进仓后第一件事是写 vitest smoke 验证 import 通

### `packages/cli`
- `citty` 定义根命令 `bridgent`，子命令 `dev`
- `dev <file>`：拼 `node --experimental-strip-types <abs-file>`，spawn 起来，stdio 透传
- tsdown 用 `outputOptions.banner: '#!/usr/bin/env node'` 注入 shebang，postbuild 加 `chmod +x dist/cli.js` 兜底
- external: `@bridgent/core`, `@modelcontextprotocol/sdk`, `zod`, `citty`, `consola`

### `examples/01-zod-hello/server.ts`
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
      inputSchema: z.object({ a: z.number(), b: z.number() }),
      run: ({ a, b }) => a + b,
    }),
  ],
})
```

### `.github/workflows/ci.yml`
- matrix `node: ['22.18', '24']`
- 步骤：`pnpm/action-setup@v4` → `actions/setup-node@v5`（cache: pnpm）→ `pnpm install --frozen-lockfile` → 缓存 `.turbo` → `pnpm turbo run lint typecheck test build`

### `/docs/progress.md` 与 `/docs/decisions.md`
- `progress.md`：按日记录 D1/D2 完成项与遗留项，模板留好
- `decisions.md`：固化本 plan §「关键技术决策」的 13 条 + §「风险与待实测项」做成 ADR 列表

## 实施顺序（执行时按此顺序落地，每步独立可测）

1. **根脚手架**：`package.json` / `pnpm-workspace.yaml` / `turbo.json` / `tsconfig.base.json` / `tsconfig.json` / `eslint.config.ts` / `.gitignore` / `.npmrc` / `LICENSE` / `README.md`
2. **`packages/core` 骨架**：`package.json` / `tsconfig.json` / `tsdown.config.ts` / `src/index.ts` / `src/define-tool.ts` / `src/server.ts` / 1 个 vitest smoke
3. **`packages/cli` 骨架**：同上 + `src/cli.ts` + `src/commands/dev.ts`
4. **example 01-zod-hello**：`package.json` + `server.ts`，本地手测 `pnpm --filter ... start` 能在 stdio 响应 `tools/list`
5. **`apps/docs`**：VitePress `config.ts` + `index.md` + 2 页 guide
6. **`/docs/progress.md` + `/docs/decisions.md`** 初稿
7. **CI workflow**：本地用 `act`（如装了）或直接 push PR 触发跑一遍

## 验证（端到端）

按顺序跑、全部为绿才算 Day 1-2 完成：

1. `pnpm install` 不报 engines 错误
2. `pnpm turbo run build` 全包产出 `dist/`
3. `pnpm turbo run test` Vitest 全绿（至少 core 的 smoke）
4. `pnpm turbo run typecheck` 无 ts 错误
5. `pnpm turbo run lint` 无 eslint 错误
6. **MCP 联通性手测**：`pnpm --filter @bridgent-examples/01-zod-hello start`，另一终端用 `npx @modelcontextprotocol/inspector` 或手写 JSON-RPC 通过 stdio 发 `{"method":"tools/list"}`，应返回包含 `add` 的列表；再发 `tools/call` 用 `{a:2,b:3}` 应返回 `5`
7. `pnpm --filter @bridgent/docs dev` 起 VitePress，访问首页 + 2 页 guide 可达
8. CI 在 GitHub 上 Node 22.18 / 24 矩阵全绿

## 风险与待实测项（进仓后立即验证）

- ⚠️ **MCP SDK 1.29 的 stdio 子路径是否仍是 `/server/stdio.js`、`/server/mcp.js`**：以实测为准，写错了立即 grep `node_modules/@modelcontextprotocol/sdk/dist` 修正
- ⚠️ **`server.tool()` 签名（4-arg vs options 对象）**：1.x 内部演进过几次，example 跑通时验证
- ⚠️ **Zod v4 `.shape` 行为**：v3→v4 略有差异，smoke 时确认 input schema 解析 OK
- ⚠️ **Node 22.18 `--experimental-strip-types`** 在 ESM + workspace 链接场景下的稳定性：若 `bridgent dev` 报错回退 `tsx` 子进程方案
- ⚠️ **tsdown 0.22 是否自动给 bin 产物加 `+x`**：postbuild `chmod +x dist/cli.js` 兜底
- ⚠️ **tsdown engines `>=22.18`**：旧机器开发者会被拦在 install 阶段，README 必须显著标注

## 后续 plan 预告（不在本次范围）

- **Plan 2 (Day 3-4)**：`packages/source-openapi` + Linear OpenAPI 跑通示例 02
- **Plan 3 (Day 4-5)**：`packages/source-prisma` 只读 4 件套 + LIMIT 护栏
- **Plan 4 (Day 5-6)**：`bridgent inspect` web UI + HTTP/SSE 双协议
- **Plan 5 (Day 6-7)**：`packages/adapter-host` 跨宿主 e2e + 30 秒 demo GIF
- **Plan 6**：发布流（changesets）、awesome-* PR 串投放、HN/PH 文案

## Critical Files

- `/Users/mark/myself/code/Bridgent/package.json`
- `/Users/mark/myself/code/Bridgent/pnpm-workspace.yaml`
- `/Users/mark/myself/code/Bridgent/turbo.json`
- `/Users/mark/myself/code/Bridgent/tsconfig.base.json`
- `/Users/mark/myself/code/Bridgent/.npmrc`
- `/Users/mark/myself/code/Bridgent/eslint.config.ts`
- `/Users/mark/myself/code/Bridgent/packages/core/src/server.ts`
- `/Users/mark/myself/code/Bridgent/packages/core/src/define-tool.ts`
- `/Users/mark/myself/code/Bridgent/packages/core/tsdown.config.ts`
- `/Users/mark/myself/code/Bridgent/packages/cli/src/cli.ts`
- `/Users/mark/myself/code/Bridgent/packages/cli/src/commands/dev.ts`
- `/Users/mark/myself/code/Bridgent/packages/cli/tsdown.config.ts`
- `/Users/mark/myself/code/Bridgent/examples/01-zod-hello/server.ts`
- `/Users/mark/myself/code/Bridgent/apps/docs/.vitepress/config.ts`
- `/Users/mark/myself/code/Bridgent/.github/workflows/ci.yml`
- `/Users/mark/myself/code/Bridgent/docs/progress.md`
- `/Users/mark/myself/code/Bridgent/docs/decisions.md`
