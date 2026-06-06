# apps/docs 内容完善设计

- 日期:2026-06-06
- 范围:`apps/docs`(VitePress 站点)+ `CLAUDE.md`(根)
- 前置:中英双语 i18n 已上线(commits 802b437..5ce1f77);本轮在双语基础上完善内容

## 1. 背景

通过对源码的审计(`packages/core`、`packages/cli`、`packages/source-openapi`、`packages/source-prisma`、`examples/`),发现:

- **CLAUDE.md 严重过时**:声称"仅 Zod 端到端打通,其余适配器是路线图",但 OpenAPI / Prisma 两个 source、Streamable HTTP 与 Web Standard fetch handler 两个 transport 已落地。
- **docs 主体准确但有缺口**:
  - 缺独立的 Zod source 页(目前只在 getting-started 提了一句)
  - `transports.md` 缺 `createWebHandler` 章节(examples/05 已存在)
  - 缺 CLI 总览页(`dev` / `serve` / `inspect` 的关系与误解)
  - 缺 sources 总览页(三 source 能力对比 + 路线图)
  - `from-openapi.md` / `from-prisma.md` 的字段签名未与源码逐字对照
- **Sidebar 当前 Sources 仅 2 条**(OpenAPI / Prisma)、Transports & Tooling 仅 2 条(Transports / Inspect),需要扩展。

## 2. 目标

让 `apps/docs` 与当前实际代码一致,补齐 Zod / Web Handler / CLI / Sources Overview 四个空缺,中英同步,顺手把 CLAUDE.md 更到位。

不做:README 重写、Drizzle/tRPC/GraphQL 的 stub 页、站内搜索 i18n。

## 3. 关键决策

| 决策 | 选项 | 结论 | 依据 |
| --- | --- | --- | --- |
| 范围深度 | 仅修明显错误 / 焦点补缺 / 全集 | **全集** | 用户选定;一次到位 |
| Sources IA | 加 Overview 伞页 / 直接平铺 / 重组 sidebar | **加 Overview** | 三 source 已落地、第 4+ source 即将到来,伞页能容纳能力矩阵与路线图 |
| CLI 是否独立页 | 独立 / 并入 transports.md | **独立 `cli.md`** | dev/serve 等价是常被误解的关键事实,值得专页澄清 |
| 是否同步中文 | 同步 / 仅英文 / 后续补 | **同步** | 双语已建立,放任漂移成本更高 |
| 是否动 CLAUDE.md | 动 / 只动 docs | **动** | 过时的 CLAUDE.md 会持续误导后续 agent 与新贡献者 |

## 4. File Structure

### 4.1 新增页(6 个 markdown:3 英 + 3 中)

```
apps/docs/guide/sources-overview.md          [新]   英文总览
apps/docs/guide/from-zod.md                  [新]   英文 Zod source
apps/docs/guide/cli.md                       [新]   英文 CLI 总览
apps/docs/zh/guide/sources-overview.md       [新]   中文镜像
apps/docs/zh/guide/from-zod.md               [新]   中文镜像
apps/docs/zh/guide/cli.md                    [新]   中文镜像
```

注:不放在 `guide/sources/` 子目录,与 `from-openapi.md`、`from-prisma.md` 平级,保持 sidebar `link` 路径风格统一,避免节内深一层子目录。

### 4.2 修订页(中英各 4 个,共 8 个文件)

```
apps/docs/guide/transports.md                [修]   增 ## Web Handler 章节
apps/docs/guide/from-openapi.md              [修]   字段签名逐字对齐源码
apps/docs/guide/from-prisma.md               [修]   字段签名 + guardrails 对齐
apps/docs/zh/guide/transports.md             [修]   中文同步
apps/docs/zh/guide/from-openapi.md           [修]   中文同步
apps/docs/zh/guide/from-prisma.md            [修]   中文同步
apps/docs/.vitepress/locales/en.ts           [修]   sidebar 增 3 条
apps/docs/.vitepress/locales/zh.ts           [修]   sidebar 增 3 条 + /zh/ 前缀
CLAUDE.md                                    [修]   What this is 节 + Architecture 节
```

### 4.3 不动

- `apps/docs/index.md` / `apps/docs/zh/index.md`(audit 判定 accurate)
- `apps/docs/guide/what-is-bridgent.md`(同上)
- `apps/docs/guide/getting-started.md`(同上)
- `apps/docs/guide/inspect.md`(同上;CLI 总览页中提到 inspect 时链入此页)
- `apps/docs/guide/hosts/*.md`(同上)
- `apps/docs/.vitepress/config.ts`、`shared.ts`(本轮无配置变化)

## 5. 内容规范

### 5.1 sources-overview.md

结构:
1. 一句话定位:Bridgent 把不同形态的"已有定义"统一成 MCP tools
2. **能力矩阵**(表格):
   - 列:**Zod** / **OpenAPI** / **Prisma** / *Drizzle (roadmap)* / *tRPC (roadmap)* / *GraphQL (roadmap)*
   - 行:状态、最少代码、tool 数量来源、命名策略、过滤/白名单、Auth 支持、Read/Write、当前限制
3. 何时选哪个(决策树式短段落)
4. 链接到三个具体 source 页
5. 路线图小节:已规划 source 的预期能力一句话陈述,不承诺时间

### 5.2 from-zod.md

完全基于 `packages/core/src/{define-tool,server,register}.ts` 与 `examples/01-zod-hello/server.ts` 实测内容。结构:
1. 一句话:为什么手写 Zod 还有用(精确、最小)
2. `defineTool` 完整签名 + 字段说明(每个字段都用 ts 代码块演示)
3. `inputSchema` 必须是 `ZodObject`(v4),工具内部传 `.shape` 给 SDK
4. `run` 返回值规则(对照 `register.ts` 实测):
   - 字符串 → 直接 `{ content: [{ type: 'text', text }] }`
   - 非字符串 → `JSON.stringify` 后包成同上结构
   - 抛错的处理(读源码后写明)
5. `createStdioServer({ name, version, tools })` 完整签名
6. 端到端 server.ts 示例
7. 类型推导演示:`run(input)` 中 `input` 类型由 `inputSchema` 自动推断,无需手写

### 5.3 cli.md

基于 `packages/cli/src/cli.ts` 与 `commands/{dev,serve,inspect}.ts` 实测。结构:
1. 三命令对比表(命令 / 用途 / 实参 / 主要差异 / 何时用)
2. **关键澄清**(重点小节):dev 与 serve 的实现几乎等价(spawn child Node 进程),**transport 由用户 server 文件决定**——CLI 不知道也不在意。这一节防止"我跑了 `bridgent serve` 怎么没起 HTTP"的误解
3. TS 直接运行机制:`--experimental-strip-types` + Node ≥ 22.18 的硬要求(ADR-006 链接)
4. inspect:透传 `@modelcontextprotocol/inspector`,等价于自己 `npx @modelcontextprotocol/inspector <你的命令>`,只是 Bridgent 帮你少敲一行

### 5.4 transports.md 新增 Web Handler 章节

放在已有 stdio / HTTP 章节之后(同级 `##`),不动现有章节内容,除非发现与代码不符。

内容(基于 `packages/core/src/web.ts` + `examples/05-web-handler/server.ts`):
1. 一句话定位:`createWebHandler` 返回 Web Standard `{ fetch, close }`,可直接接到 Cloudflare Workers / Deno Deploy / Bun / Vercel Edge / Hono 等运行时
2. `createWebHandler({ tools, stateful? })` 签名;stateful 默认值与代码一致
3. 5 段最小集成片段:
   - Cloudflare Workers
   - Deno Deploy
   - Bun
   - Vercel Edge Runtime
   - Hono(任何 runtime)
4. 与 `createHttpServer` 何时选哪个的一句话指引(自托管 Node → HTTP;部署到 Web 平台 → Web Handler)

### 5.5 from-openapi.md / from-prisma.md 校准

逐字对照源码,**只改不一致或缺漏处**,**不**做风格重写。校准对象:

`from-openapi.md` 对照 `packages/source-openapi/src/types.ts`(`FromOpenApiOptions`)与 `index.ts` 导出:
- `spec` 类型(`string | object | URL`?)
- `namespace` 字段名与默认行为
- `auth` 形状(Bearer-only 在 v0.1 是否仍然成立)
- `pathFilter` 形状
- `allow` / `allowOperations` / `denyOperations` 是否都存在
- `respectExtensions` 默认值
- `x-bridgent-allow` 扩展约定

`from-prisma.md` 对照 `packages/source-prisma/src/{from-prisma,filter}.ts`:
- 5 类工具是否仍然是 `findUnique` / `findFirst` / `findMany` / `count` / `aggregate`
- `maxTake` / `queryTimeoutMs` 字段名、默认值、单位
- `Bytes` 字段剥离机制
- `raw` 永禁声明是否仍属实
- `mutating: true` 是否仍是 no-op,文档应明确警示

每处不一致的修正附 commit 消息中(例:`docs(openapi): 'allow' renamed to 'allowOperations' to match source`)。

### 5.6 sidebar 配置(en.ts / zh.ts)

en.ts 的 `sidebar['/guide/']` 改为:

```
Introduction
  - What is Bridgent? → /guide/what-is-bridgent
  - Getting Started   → /guide/getting-started
Sources
  - Overview          → /guide/sources-overview        [新]
  - From Zod          → /guide/from-zod                [新]
  - From OpenAPI      → /guide/from-openapi
  - From Prisma       → /guide/from-prisma
Transports & Tooling
  - Transports        → /guide/transports
  - CLI               → /guide/cli                     [新]
  - Inspect           → /guide/inspect
Hosts
  - (4 项不变)
```

zh.ts 同结构,所有 `link` 必须带 `/zh/` 前缀(吸取 commit 5ce1f77 修过的 bug;本 spec §5.7 写入硬约束)。新页中文标题:

- Overview → 总览
- From Zod → 从 Zod 接入
- CLI → CLI

### 5.7 链接路径硬约束(防回归)

- 英文 locale 下所有内部 `link` 写裸路径(如 `/guide/cli`)
- 中文 locale 下所有内部 `link` **必须**带 `/zh/` 前缀(如 `/zh/guide/cli`)
- 中文 markdown 文件内的相对链接同样带 `/zh/` 前缀
- 验证命令:`grep -rn 'link.*"/guide/' apps/docs/zh/ apps/docs/.vitepress/locales/zh.ts` 必须返回空

## 6. CLAUDE.md 更新

### 6.1 What this is 节(替换)

旧:
> Currently in alpha — only the Zod-tools path (`@bridgent/core` + `bridgent dev`) is wired end-to-end. Source adapters (OpenAPI / Prisma / Drizzle / tRPC / GraphQL) are planned in subsequent phases.

新:
> Bridgent 在 alpha 阶段已交付以下能力(由 monorepo 内的 packages 体现):
> - **Sources**:`@bridgent/core`(手写 Zod 工具)、`@bridgent/source-openapi`、`@bridgent/source-prisma`(只读)
> - **Transports**:stdio、Streamable HTTP(`createHttpServer`)、Web Standard fetch handler(`createWebHandler`)
> - **CLI**(`bridgent`):`dev` / `serve` / `inspect`
> - **路线图**:`@bridgent/source-drizzle` / `@bridgent/source-trpc` / `@bridgent/source-graphql`、Prisma 写入 + 审计、托管控制台

### 6.2 Architecture 节(`@bridgent/core` data flow 子节)增补

把现有的"three exported symbols"扩展为反映实际导出:`defineTool` / `createStdioServer` / `createHttpServer` / `createWebHandler` / `registerTools`,并简述每个的用途。其他不动(ADR 引用、tsdown 约束、lint 规则、known soft spots 保留)。

### 6.3 不动

- Commands 节(命令清单未变)
- Architecture 的 monorepo 布局描述、catalog 政策、TypeScript 配置说明
- Conventions / 已知软点 / 提交流程相关内容

## 7. 验证策略

### 7.1 静态(每提交前必跑)

```
pnpm turbo run build typecheck lint --filter=@bridgent/docs
```
全绿。VitePress build 在 dead-link 上失败;新增的 sidebar `link` 全部必须真实指向已存在的 markdown 页。

### 7.2 结构对齐(中英每对文件)

```
grep -c '^#' <en>; grep -c '^#' <zh>           # 标题数相等
grep -c '^```' <en>; grep -c '^```' <zh>       # 代码栅栏数相等
```

### 7.3 链接前缀(防 sidebar 回归)

```
grep -rn '"/guide/' apps/docs/zh/ apps/docs/.vitepress/locales/zh.ts || echo OK
```
应输出 `OK`(无任何裸路径残留)。

### 7.4 内容真伪验证

`from-openapi.md` / `from-prisma.md` 中每个字段名、默认值、行为约定,在 `packages/source-openapi/src/` 或 `packages/source-prisma/src/` 中可被 `grep` 直接索引到。

### 7.5 例子可运行(冒烟)

```
node packages/cli/dist/cli.mjs dev examples/01-zod-hello/server.ts
```
仍可启动(`docs` 改动不应触及 examples,但确认引用未漂移)。

## 8. 风险与缓解

| 风险 | 缓解 |
| --- | --- |
| 中文 sidebar `link` 再次漏 `/zh/` 前缀(commit 5ce1f77 bug 重现) | §5.7 硬约束 + §7.3 grep 验证写入计划任务 |
| from-openapi / from-prisma 的字段名"看起来对但其实漂移" | 每处声明需在源码中 grep 命中,不命中即修;不做"看起来差不多就放过" |
| 新增 6 个中英对页与现有页风格不一致 | 复用上轮 i18n 翻译规范术语表(spec §5.4):tool→工具、transport→传输层、host→宿主、source adapter→数据源适配器、production-ready→生产可用、read-only by default→默认只读 |
| CLAUDE.md 改动后破坏既有 ADR 引用 | 仅替换"What this is"段落与 data flow 子节的导出列表,不动 ADR 编号、known soft spots、commands 清单 |
| docs build 缓存导致 sidebar 不更新 | 必要时 `pnpm --filter @bridgent/docs build --force` 或清 `.vitepress/cache`(只清缓存不清 dist) |

## 9. 交付物清单

新建 6:
- `apps/docs/guide/{sources-overview,from-zod,cli}.md`
- `apps/docs/zh/guide/{sources-overview,from-zod,cli}.md`

修改 9:
- `apps/docs/guide/{transports,from-openapi,from-prisma}.md`
- `apps/docs/zh/guide/{transports,from-openapi,from-prisma}.md`
- `apps/docs/.vitepress/locales/{en,zh}.ts`
- `CLAUDE.md`

不改:其他所有文件。

## 10. 范围外(YAGNI)

- README.md 翻新(独立任务)
- changeset 入口、release-checklist 暴露到 apps/docs sidebar
- Drizzle / tRPC / GraphQL 的 stub 页
- 站内搜索 i18n
- API 参考文档生成(typedoc 等)
- 视频/动图/截图教程
