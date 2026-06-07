# Progress Log

按日记录 Bridgent AI 的开发进度。最新日期在最上面。

---

## 2026-06-07 — v0.2 CLI init

**Plan**: [`superpowers/plans/2026-06-07-v0.2-cli-init.md`](./superpowers/plans/2026-06-07-v0.2-cli-init.md)

### 已完成

- ✅ 新增 `bridgent init [file] [--force]`
  - 默认生成 `server.ts`
  - 支持自定义路径并递归创建父目录
  - 默认保护已有文件,`--force` 才覆盖
  - 生成可编辑的 `@bridgent/core` + Zod + `createStdioServer` starter
- ✅ CLI 单测覆盖默认生成、嵌套路径、覆盖保护、force 覆盖、生成内容
- ✅ 英文/中文 getting-started、CLI 文档、README 同步 `init` 入口

### 后续规划

- v0.2 下一步不要同时开 Drizzle、tRPC、GraphQL;先根据实际用户路径选择一个主 source adapter。
- `bridgent expose` 仍等待配置模型稳定后再做。

---

## 2026-06-07 — Roadmap calibration

### 已完成

- ✅ 新增 [`roadmap.md`](./roadmap.md) 作为当前有效规划源；旧 proposal 与 `docs/plans/` 只保留历史背景
- ✅ ADR-027：CLI npm 包名确认使用 `@bridgent/cli`，安装后的 binary 继续叫 `bridgent`
- ✅ 修正文档口径：
  - v0.1 alpha 已发布范围固定为 Zod / OpenAPI / Prisma(read-only) + stdio / HTTP / Web handler + thin CLI
  - Drizzle / tRPC / GraphQL、Prisma writes、custom Inspector、hosted control plane 均为后续规划
  - OpenAPI v0.1 只承诺 Bearer auth；API key / OAuth2 后续再做

### 后续规划

- v0.2 优先级：CLI onboarding、Drizzle 或 tRPC source、OpenAPI API-key auth、Prisma write design（审计日志 + allowlist + dry-run 方案先行）
- v0.3+：Hub / private registry / hosted control plane / OTel trace / policy DSL / Python bridge

## 2026-06-06 — Plan 6: Bridgent AI 品牌 + changesets 发布流 + 发布渠道文案

**Plan**: [`plans/2026-06-06-plan-6-launch.md`](./plans/2026-06-06-plan-6-launch.md)

### 已完成

- ✅ **品牌升级 Bridgent → Bridgent AI**（仅显示名）
  - README hero + npm badge / VitePress title / docs 顶页 hero / what-is-bridgent.md / 4 个 publishable 包 metadata（description / keywords / homepage / repo / bugs）
  - npm 包名（`bridgent` / `@bridgent/*`）与 CLI binary 名保持不变（避免无收益 breaking change）
- ✅ **changesets 发布流**：
  - `.changeset/config.json` — `linked` 模式让 4 个 publishable 包同步版本，private 包（host-test / docs / examples）忽略
  - `.changeset/inaugural-release.md` — 0.0.1 → 0.1.0 首发 changeset，描述三 source + 三 transport
  - root devDeps 加 `@changesets/cli@^2.31` + `@changesets/changelog-github@^0.7`
  - 三个 npm script：`changeset` / `version-packages` / `release`
- ✅ **`.github/workflows/release.yml`**：`changesets/action@v1` 标准配置，PR 模式 + npm provenance
- ✅ **发布前 checklist + Release notes 模板**：
  - `docs/release-checklist.md` —— pre-flight、secret 二选一（NPM_TOKEN vs OIDC trusted publisher）、Version PR 流、回滚说明
  - `.github/RELEASE_TEMPLATE.md` —— 含 changelog placeholder 与 hosts 跳转
- ✅ **5 篇发布渠道文案**（中英双语）：
  - 英文：`docs/launch/{hn,ph,twitter}.md`（HN Show / Product Hunt / X thread）
  - 中文：`docs/launch/{v2ex,zhihu}.md`（V2EX 创意工坊 + 知乎专栏）
  - `docs/launch/README.md` 总 playbook，按时区编排发布顺序
- ✅ ADR-024 ~ ADR-026 进 `docs/decisions.md`

### 关键技术决策（详见 ADR-024 ~ ADR-026）

1. 品牌仅改显示名，npm 名 / CLI 名 / import 名保持
2. 4 个 publishable 包用 changesets `linked` 同步版本，alpha 期降低用户记忆成本
3. 发布渠道文案中英双语并行，覆盖国际 + 国内开发者两个战场

### 端到端验证（全绿 ✅）

| 步 | 命令 | 结果 |
|---|---|---|
| 1 | `pnpm install`（catalog 加 `@changesets/cli` + `@changesets/changelog-github`） | ✅ |
| 2 | `@changesets/read` 解析 `.changeset/*.md` | ✅ 1 个 pending changeset，影响 4 个 publishable 包，全部 minor |
| 3 | `pnpm turbo run lint typecheck test build` | ✅ **22/22 tasks**，host-test 3 transport e2e 仍全过 |
| 4 | VitePress build / 标签栏 title | ✅ "Bridgent AI" |
| 5 | publishable 包 metadata（description / keywords / homepage / repository / bugs） | ✅ 4 包全部带新品牌 |
| 6 | `.changeset/config.json` linked + ignore 私包 | ✅ |
| 7 | `.github/workflows/release.yml` 静态合法（YAML） | ✅ |

> `pnpm changeset status` 在仓库尚未有任何 git commit 时会因为找不到 `main` 分支基线报错；首个 commit 后即可正常使用。这是 changesets 的预期行为（有记录在 `docs/release-checklist.md` 的 pre-flight）。

### 下一步

- Plan 7+：自写 Bridgent Inspector（差异化 web UI）+ source-prisma v0.2（写操作 + audit log）
- Plan 8+：source-drizzle / source-trpc / source-graphql

---

## 2026-06-06 — Plan 5: 跨宿主 harness + WebStandard transport + 4 份 host 配置

**Plan**: [`plans/2026-06-06-plan-5-cross-host.md`](./plans/2026-06-06-plan-5-cross-host.md)

### 已完成

- ✅ `packages/core/src/web.ts` — `createWebHandler({ tools, stateful? })` → `{ fetch, close }`，基于 SDK `WebStandardStreamableHTTPServerTransport`，可贴进 Cloudflare/Deno/Bun
- ✅ `packages/core/test/web.test.ts` — fetch() 直打 handler 验证 init + tools/list（无端口监听）
- ✅ `packages/host-test`（**private** workspace 包）— 跨 stdio / HTTP / Web 三 transport 的协议层 e2e harness，用官方 SDK Client 直连，等价"任何 1.x 客户端"
- ✅ `examples/05-web-handler` — 纯 fetch handler + ~25 行 Node http adapter，README 演示 Cloudflare/Deno/Bun 一行集成
- ✅ 4 份 host 配置文档：`apps/docs/guide/hosts/{claude-code,cursor,codex,gemini-cli}.md`；sidebar 增 "Hosts" 分组
- ✅ README hero 加 `assets/demo.gif` placeholder + Hosts 跳转区
- ✅ `docs/recording.md` — vhs 录制配方（demo GIF 留给后续手工交付）
- ✅ ADR-021 ~ ADR-023 进 `docs/decisions.md`

### 关键技术决策（详见 ADR-021 ~ ADR-023）

1. WebStandard transport：纯 Web Handler，Node-HTTP adapter 自写 ~25 行（零额外 framework）
2. 跨宿主验证 = 协议层 harness + 配置文档（不做 GUI 自动化）
3. Host 配置进 docs sidebar，README 只留 hero + 跳转

### 端到端验证（全绿 ✅）

| 步 | 命令 | 结果 |
|---|---|---|
| 1 | `pnpm turbo run lint typecheck test build` | ✅ **22/22 tasks** |
| 2 | core 6 单测（含 web.test.ts SSE init+list） | ✅ 全过 |
| 3 | host-test 三 transport e2e | ✅ stdio + HTTP + Web 各 1 case 全过（3/3） |
| 4 | example 05 e2e curl | ✅ initialize → session id → `tools/list` → `tools/call add{a:7,b:8}` → `{"sum":15}` |
| 5 | 25 行 Node-HTTP→Web-Standard adapter | ✅ Readable.toWeb / fromWeb + duplex:'half' 工作正常 |

### 下一步

- Plan 6：发布流（changesets）+ awesome-* PR + HN/PH 文案 + 真录 demo GIF

---

## 2026-06-05 — Plan 4: HTTP/SSE 双协议 + `bridgent serve` / `inspect`

**Plan**: [`plans/2026-06-04-plan-4-http-inspect.md`](./plans/2026-06-04-plan-4-http-inspect.md)

### 已完成

- ✅ `packages/core` 新增：
  - `register.ts` — 抽出 `registerTools(server, tools)` helper（stdio / http 共享）
  - `http.ts` — `createHttpServer({ tools, port, path, host, stateful })`（基于 SDK `StreamableHTTPServerTransport` + Node 内置 http.createServer，零额外 framework 依赖）
  - `http.test.ts` — vitest 跑 ephemeral 端口，验证 `initialize → tools/list` 走 HTTP；2 cases 全过
  - `server.ts` 瘦身（用 `registerTools`）
- ✅ `packages/cli` 新增：
  - `serve <file>` — 跑 user 的 createHttpServer 文件
  - `inspect <file>` — spawn 官方 `@modelcontextprotocol/inspector` 走 stdio（pickLauncher 自动嗅探 pnpm/npx）
- ✅ `examples/04-http-server` — 最小 HTTP MCP server + curl JSON-RPC 用法 README
- ✅ VitePress: `transports.md` + `inspect.md` + sidebar "Transports & Tooling" 分组
- ✅ ADR-018 ~ ADR-020 进 `docs/decisions.md`

### 关键技术决策（详见 ADR-018 ~ ADR-020）

1. HTTP transport 用 SDK 内置 `StreamableHTTPServerTransport`，零额外 web framework
2. 默认 stateful + 127.0.0.1 + 3333 + `/mcp`（安全 by default）
3. `bridgent inspect` 是官方 MCP Inspector 的薄包装（自写 inspector 留给 v0.5+ 差异化）

### 端到端验证（全绿 ✅）

| 步 | 命令 | 结果 |
|---|---|---|
| 1 | `pnpm turbo run lint typecheck test build` | ✅ **19/19 tasks** |
| 2 | core HTTP vitest（initialize → tools/list） | ✅ 2/2 cases |
| 3 | example 04 e2e curl | ✅ initialize 拿 `mcp-session-id` |
| 4 | `tools/list` over SSE event-stream | ✅ 返回 `add` + `echo` 完整 inputSchema |
| 5 | `tools/call add {a:2,b:3}` | ✅ `{"sum":5}` |
| 6 | 404 path / SIGTERM clean shutdown | ✅ |

### 下一步

- Plan 5：跨宿主 e2e（Claude Code / Codex / Cursor / Gemini CLI）+ 30s demo GIF + WebStandard transport（Cloudflare/Deno）

---

## 2026-06-04 — Plan 3: `@bridgent/source-prisma`

**Plan**: [`plans/2026-06-04-plan-3-source-prisma.md`](./plans/2026-06-04-plan-3-source-prisma.md)

### 已完成

- ✅ 新增 `packages/source-prisma@0.0.1`：
  - `dmmf.ts` — Prisma 6.19.3 的公开稳定 API `Prisma.dmmf.datamodel.models[]`，模型/字段筛选、Bytes 排除
  - `schema.ts` — DMMF field → zod 三件套（where / select / orderBy）+ 单测 4 cases
  - `slug.ts` — `{namespace}{modelCamel}_{method}` + 64 字节截断
  - `filter.ts` — method / model / tool 三段过滤
  - `guard.ts` — `withTimeout` + `clampTake` + `sanitizeSelect` + 错误打包
  - `tools/{find-many,find-first,find-unique,count,aggregate}.ts` — 5 个只读方法
  - `from-prisma.ts` — 主入口编排
- ✅ Example `examples/03-prisma-readonly`：SQLite + User/Post/Comment 三表 + seed + setup 脚本
- ✅ VitePress: `apps/docs/guide/from-prisma.md` + sidebar Sources 增条目
- ✅ ADR-014 ~ ADR-017 进 `docs/decisions.md`
- ✅ pnpm catalog 增 `prisma + @prisma/client ^6.19.3`

### 关键技术决策（详见 ADR-014 ~ ADR-017）

1. Prisma 6.19.x 锁定（不支持 7.x，datasource 重构 breaking change）
2. v0.1 仅 5 个只读方法；groupBy / include / 写操作 → v0.2
3. 三件套护栏：LIMIT clamp + soft timeout + raw SQL 永久禁用
4. Bytes 排除 + DateTime/BigInt/Decimal 字符串透传

### 端到端验证（全绿 ✅）

| 步 | 命令 | 结果 |
|---|---|---|
| 1 | `pnpm install`（catalog 增 prisma + @prisma/client；workspace 加 onlyBuiltDependencies 让 prisma 跑 postinstall） | ✅ |
| 2 | `pnpm turbo run lint typecheck test build` | ✅ **19/19 tasks** |
| 3 | source-prisma 单测 | ✅ **26 passed**（schema 6 / slug 4 / filter 9 / find-many 7） |
| 4 | example 03 setup（generate + migrate + seed） | ✅ SQLite `prisma/dev.db` 三表已建 + 假数据 |
| 5 | MCP 联通性 e2e | ✅ 15 个工具（3 model × 5 method），写操作 100% 隐藏 |
| 6 | **真实查询**：`db_user_findMany take=3` | ✅ 返回 alice + bob |
| 7 | **LIMIT clamp**：`take=999999` | ✅ `meta.warning: "take clamped from 999999 to 10000"` |
| 8 | **where filter**：`db_post_count where: { published: { equals: true } }` | ✅ `result: 1` |

### 下一步

- Plan 4：`bridgent inspect` web UI + HTTP/SSE 双协议

---

## 2026-06-04 (later) — Plan 2: `@bridgent/source-openapi`

**Plan**: [`plans/bridgent-plan-2-source-openapi.md`](./plans/bridgent-plan-2-source-openapi.md)（待归档）

### 已完成

- ✅ 新增 `packages/source-openapi@0.0.1`：
  - `jsonschema-to-zod.ts` — ~150 行 narrow converter（覆盖 9 类 schema 形态，含 3.0/3.1 nullable、enum/const、oneOf/anyOf、allOf-merge、format）
  - `slug.ts` — operationId 优先 + `${method}_${path}` fallback + 64 字节截断 + 重名检测
  - `filter.ts` — method/pathFilter/extension/deny/allow 五段过滤管线
  - `parse-openapi.ts` — `@scalar/openapi-parser` 包装：URL/file/object/string 四种 spec 来源统一 dereference
  - `http.ts` — fetch 包装；4xx/5xx 不 throw，结构化错误喂给 LLM
  - `operation-to-tool.ts` — flatten path/query/header/body 到一个 `z.object()`
  - `from-openapi.ts` — 主入口编排
  - 单测：`jsonschema-to-zod`（12 cases）/ `slug`（6 cases）/ `filter`（7 cases）
- ✅ 两个 example：
  - `examples/02-openapi-petstore` —— 零 auth、PetStore 3.1 spec
  - `examples/02-openapi-github` —— Bearer auth + pathFilter 缩到 issues/pulls/releases
- ✅ VitePress 文档：`apps/docs/guide/from-openapi.md` + sidebar 增 "Sources" 分组
- ✅ ADR-009 ~ ADR-013 落 `docs/decisions.md`
- ✅ pnpm catalog 增 `@scalar/openapi-parser ^0.28.5`

### 关键技术决策（详见 ADR-009 ~ ADR-013）

1. Parser = `@scalar/openapi-parser` 0.28.x（ESM、3.0→3.1 自动升、内置 dereference/load）
2. JSON Schema → Zod 自写 narrow converter，不引入 codegen 包
3. 默认 read-only（仅 GET/HEAD），写需显式 `allow: { mutating: true }`
4. HTTP 走原生 fetch，4xx/5xx 结构化返回不 throw
5. Vendor extension 用 `x-bridgent-*` 命名空间（首个是 `x-bridgent-allow`）

### 端到端验证（全绿 ✅）

| 步 | 命令 | 结果 |
|---|---|---|
| 1 | `pnpm install`（catalog 增 @scalar/openapi-parser@^0.28.5） | ✅ |
| 2 | `pnpm turbo run lint typecheck test build` | ✅ 15/15 tasks（7 packages × 4 task 减去 examples 没 lint/test 的） |
| 3 | source-openapi 单测 | ✅ 29 passed（jsonschema-to-zod 13 / slug 6 / filter 10） |
| 4 | MCP 联通性 e2e（用内联 PetStore 子集 spec） | ✅ `tools/list` 返回 `getPet` + `listPets`；`createPet`（POST）**默认隐藏**，验证 read-only by default 生效 |

### 处置中的非阻塞坑

- 🟡 GitHub example 实测需要 PAT + 网络访问 `raw.githubusercontent.com`，留给用户自验
- 🟡 远程 PetStore yaml 拉取在国内 npmmirror 环境下可能慢或超时；改用本地内联 spec 验证通过；建议用户用 `npx @modelcontextprotocol/inspector` 直接挂上 example，看实际行为

### 下一步

- Plan 3：`packages/source-prisma` 只读 4 件套 + LIMIT 10000 + query timeout 护栏

---

## 2026-06-04 — Day 1-2 Monorepo 骨架

**Plan**: [`plans/2026-06-04-day-1-2-skeleton.md`](./plans/2026-06-04-day-1-2-skeleton.md)

### 已完成

- ✅ 仓库根脚手架：`package.json` / `pnpm-workspace.yaml` / `turbo.json` / `tsconfig.base.json` / `eslint.config.ts` / `.npmrc` / `.gitignore` / `LICENSE` / `README.md`
- ✅ `packages/core@0.0.1`：`defineTool` + `createStdioServer`（基于 MCP SDK 1.29 `registerTool` API）+ vitest smoke 测试
- ✅ `packages/cli@0.0.1`（npm 名 `bridgent`）：citty 入口 + `bridgent dev <file>` 子命令，TS 文件通过 Node 22.18+ 原生 `--experimental-strip-types` 运行
- ✅ `examples/01-zod-hello`：`add` + `echo` 两个工具的最小示例
- ✅ `apps/docs` (VitePress)：首页 + 2 页 guide（What is / Getting Started）
- ✅ `.github/workflows/ci.yml`：Node 22.18 / 24 矩阵跑 lint / typecheck / test / build
- ✅ AI 进度档案：本目录初始化

### 端到端验证（全绿 ✅）

| 步 | 命令 | 结果 |
|---|---|---|
| 1 | `pnpm install`（catalog + workspace link） | ✅ |
| 2 | `pnpm turbo run build` | ✅ 11/11 tasks，core/cli `dist/*.mjs + *.d.mts`，docs `.vitepress/dist` |
| 3 | `pnpm turbo run test` | ✅ core 3 tests passed |
| 4 | `pnpm turbo run typecheck` | ✅ |
| 5 | `pnpm turbo run lint` | ✅ |
| 6 | MCP stdio 联通性 | ✅ `initialize` / `tools/list` / `tools/call add(2,3)` → `{"sum":5}` |
| 7 | `bridgent --version` / `--help` | ✅ |

### 处置中的非阻塞坑

- 🟡 **rolldown 平台 binding 在弱网 install 时可能 ECONNRESET 跳过**：临时把 `@rolldown/binding-darwin-arm64` 写进 root devDeps（catalog 同步声明）当本机兜底；CI 跑 Linux/Win 时此 dep 走 optional resolution 不影响。**TODO**：等 npm 镜像稳定后改用 pnpm `supportedArchitectures` / `onlyBuiltDependencies` 替代。
- 🟡 **antfu 的 `no-top-level-await` 规则**：`examples/01-zod-hello/server.ts` 用 file-level disable 注释绕过；后续 source-* 包内不再 top-level await，这条注释自然消失。
- 🟡 **vitest 4.x 与 vitepress 1.x 的 vite peer 不兼容**：降到 `vitest@^3.2.6`（接受 vite ^5/^6/^7）。等 vitepress 2.x 稳定再升 vitest 4。

### 下一步

- 准备 Plan 2：`packages/source-openapi` + Linear OpenAPI 跑通示例 02
