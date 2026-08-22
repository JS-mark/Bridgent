---
theme: default
title: 'Bridgent AI — 一行命令，任意 MCP'
info: Bridgent AI 宣传幻灯片：把现有 API / 数据库 / 代码暴露为生产可用的 MCP Server。
class: text-center
highlighter: shiki
lineNumbers: false
drawings:
  persist: false
transition: slide-left
mdc: true
slideNumbers: true
fonts: false
---

<div class="cover-anim">

<div class="cover-orbits" aria-hidden="true"><i /><i /><i /></div>

<LogoMark class="cover-logo" style="width: 128px" />

# Bridgent <span class="grad">AI</span>

<p class="cover-sub">一行命令，把现有 API / 数据库 / 代码<br>变成生产可用的 MCP Server</p>

<p class="cover-sub-line"><em>Alpha v0.3</em> · MIT · TypeScript · Node ≥ 22.18</p>

<p class="cover-links">github.com/js-mark/bridgent · js-mark.com/Bridgent</p>

</div>

---

<div class="sk"><span class="sk-num">00</span><span class="sk-sep">/</span><span class="sk-name">AGENDA · 议程</span></div>

# 议程

<div class="agenda">

<v-click>

**01 · 为什么** — 数据可见性与手写成本

</v-click>
<v-click>

**02 · 是什么** — 五类数据源直达工具面

</v-click>
<v-click>

**03 · 怎么用** — init / dev / serve / inspect

</v-click>
<v-click>

**04 · 技术架构** — 契约 · 传输 · 安全 · 决策

</v-click>
<v-click>

**05 · 路线图** — v0.4 与生态方向

</v-click>
</div>

---

<div class="sk"><span class="sk-num">01</span><span class="sk-sep">/</span><span class="sk-name">WHY · 为什么</span></div>

# AI Agent 无处不在<br><span class="dim">你的数据对它们却不可见</span>

<div class="hosts-row">

<v-click>

<div class="focus-card">
  <span class="badge-mono">CC</span>
  <b>Claude Code</b>
  <span class="focus-foot">speaks MCP</span>
</div>

</v-click>

<v-click>

<div class="focus-card">
  <span class="badge-mono">CU</span>
  <b>Cursor</b>
  <span class="focus-foot">speaks MCP</span>
</div>

</v-click>

<v-click>

<div class="focus-card">
  <span class="badge-mono">CD</span>
  <b>OpenAI Codex</b>
  <span class="focus-foot">speaks MCP</span>
</div>

</v-click>

<v-click>

<div class="focus-card">
  <span class="badge-mono">GC</span>
  <b>Gemini CLI</b>
  <span class="focus-foot">speaks MCP</span>
</div>

</v-click>

</div>

<div class="grid2 focus-pair">

<v-click>

<div class="focus-card">
  <span class="focus-value">MCP</span>
  <b>AI 应用的 USB-C</b>
  <span class="focus-foot">一次接入 · 所有宿主可用</span>
</div>

</v-click>

<v-click>

<div class="focus-card focus-danger">
  <span class="focus-value">0</span>
  <b>你的数据当前的 Agent 可见度</b>
  <span class="focus-foot">没有 MCP Server = 数据隐身</span>
</div>

</v-click>

</div>

---

<div class="sk"><span class="sk-num">01</span><span class="sk-sep">/</span><span class="sk-name">WHY · 为什么</span></div>

# 手写一个 MCP Server 的成本

<div class="pains">

<v-click>

<div class="pain"><span class="pain-num">01</span><b>学协议</b><div>JSON-RPC · SDK · 会话生命周期</div></div>

</v-click>

<v-click>

<div class="pain"><span class="pain-num">02</span><b>写 Schema</b><div>每个接口一份 JSON Schema</div></div>

</v-click>

<v-click>

<div class="pain"><span class="pain-num">03</span><b>做传输</b><div>stdio · HTTP · 鉴权 · 流式</div></div>

</v-click>

<v-click>

<div class="pain"><span class="pain-num">04</span><b>管分发</b><div>打包 · 发布 · 逐宿主配置</div></div>

</v-click>

</div>

<v-click>

<div class="callout callout-red">

价值 / 投入比太差 —— 多数团队选择放弃，数据继续对 Agent 隐身。

</div>

</v-click>

---

<div class="sk"><span class="sk-num">02</span><span class="sk-sep">/</span><span class="sk-name">WHAT · 是什么</span></div>

# 复用你已有的定义

<div class="grid3">

<v-click>

<div class="bcard">
  <span class="bcard-top"><span class="badge-mono">{}</span><b>Zod</b></span>
  <p>Zod schema + 函数 → 完整 MCP 服务器，可发布到 npm</p>
</div>

</v-click>

<v-click>

<div class="bcard">
  <span class="bcard-top"><span class="badge-mono">API</span><b>OpenAPI 3.x</b></span>
  <p>每个操作一个工具 · Bearer / API-key 鉴权</p>
</div>

</v-click>

<v-click>

<div class="bcard">
  <span class="bcard-top"><span class="badge-mono">DB</span><b>Prisma 6.x</b></span>
  <p>find / findMany / aggregate / count · 审计写入可选开启</p>
</div>

</v-click>

<v-click>

<div class="bcard">
  <span class="bcard-top"><span class="badge-mono">DR</span><b>Drizzle</b></span>
  <p>只读 findMany 工具，自带行数上限</p>
</div>

</v-click>

<v-click>

<div class="bcard">
  <span class="bcard-top"><span class="badge-mono">RPC</span><b>tRPC</b></span>
  <p>每个 query 一个只读工具 · mutation 需白名单</p>
</div>

</v-click>

<v-click>

<div class="bcard">
  <span class="bcard-top"><span class="badge-mono">✕</span><b>不是框架</b></span>
  <p>没有提示词、链、记忆或 Agent 运行时 —— 只做 schema → MCP 这一件事</p>
</div>

</v-click>

</div>

---

<div class="sk"><span class="sk-num">02</span><span class="sk-sep">/</span><span class="sk-name">WHAT · 是什么</span></div>

# 用数字说话

<div class="num-grid">

<v-click>

<div class="num-card">
  <span class="num-value">637<span class="num-unit">个</span></span>
  <b>一个 GitHub API spec 的工具产出</b>
  <span class="num-foot">6.6 MB · 1221 个操作 · 1.6 秒生成 · 手写 schema 0 行</span>
</div>

</v-click>

<v-click>

<div class="num-card">
  <span class="num-value">15<span class="num-unit">个</span></span>
  <b>一份 38 行 schema.prisma 的工具产出</b>
  <span class="num-foot">3 个 model · find / count / aggregate · 默认只读</span>
</div>

</v-click>

<v-click>

<div class="num-card">
  <span class="num-value">12<span class="num-unit">KB</span></span>
  <b>@bridgent/core 完整产物体积</b>
  <span class="num-foot">运行时依赖 1 个 · SDK external · Zod 为 peer</span>
</div>

</v-click>

<v-click>

<div class="num-card">
  <span class="num-value">140<span class="num-unit">ms</span></span>
  <b>TypeScript 直跑冷启动耗时</b>
  <span class="num-foot">无 tsx · 无编译 · 无等待</span>
</div>

</v-click>

</div>

---

<div class="sk"><span class="sk-num">02</span><span class="sk-sep">/</span><span class="sk-name">WHAT · 是什么</span></div>

# 30 秒上手

<div class="cols-2">

<div class="col-left">

```bash
# 1. 安装（Node ≥ 22.18）
pnpm add -D @bridgent/cli @bridgent/core zod

# 2. 生成可编辑的服务文件
bridgent init ./server.ts

# 3. 直接跑起来
bridgent dev ./server.ts
```

<div class="term-out">✓ MCP server "hello" ready — 1 tool live over stdio</div>

</div>

<div class="col-right">

```ts
// server.ts — 也可以手写
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
      run: ({ a, b }) => a + b,
    }),
  ],
})
```

</div>

</div>

---

<div class="sk"><span class="sk-num">03</span><span class="sk-sep">/</span><span class="sk-name">ARCHITECTURE · 架构</span></div>

# 技术架构总览

<ArchFlow />

<div class="arch-note">

所有适配器产出同一种 <b>BridgentTool</b>，核心只认这一种形状 —— 换传输不动工具，加数据源不动核心。

</div>

---

<div class="sk"><span class="sk-num">03</span><span class="sk-sep">/</span><span class="sk-name">ARCHITECTURE · 架构</span></div>

# 核心契约：小到可以背下来

<div class="cols-2">

<div class="api-list">

<v-click>

<div class="api-card">
  <span class="api-name">defineTool</span>
  <span class="api-desc">Zod 工具定义 · 恒等包装保住类型推断</span>
</div>

</v-click>

<v-click>

<div class="api-card">
  <span class="api-name">createStdioServer</span>
  <span class="api-desc">stdio 传输 · 本地 IDE Agent</span>
</div>

</v-click>

<v-click>

<div class="api-card">
  <span class="api-name">createHttpServer</span>
  <span class="api-desc">Streamable HTTP · 自托管</span>
</div>

</v-click>

<v-click>

<div class="api-card">
  <span class="api-name">createWebHandler</span>
  <span class="api-desc">Web Standard fetch · 边缘运行时</span>
</div>

</v-click>

<v-click>

<div class="api-card">
  <span class="api-name">registerTools</span>
  <span class="api-desc">三种传输共享的注册逻辑</span>
</div>

</v-click>

</div>

<div>

```ts
const tool = defineTool({
  name: 'add',
  description: 'Add two numbers',
  inputSchema: z.object({
    a: z.number(),
    b: z.number(),
  }),
  run: ({ a, b }) => a + b,
})

// 同一份 tools —— 换传输只改一行
await createStdioServer({ name, version, tools })
await createHttpServer({ name, version, tools, port: 3333 })
const handler = createWebHandler({ name, version, tools })
```

</div>

</div>

---

<div class="sk"><span class="sk-num">03</span><span class="sk-sep">/</span><span class="sk-name">ARCHITECTURE · 架构</span></div>

# 三种传输，一份工具列表

<div class="grid3">

<v-click>

<div class="bcard">
  <span class="bcard-top"><span class="badge-mono">01</span><b>stdio</b></span>
  <p>本地 IDE Agent 集成首选，零配置直连</p>
  <span class="bcard-foot">createStdioServer · bridgent dev</span>
</div>

</v-click>

<v-click>

<div class="bcard">
  <span class="bcard-top"><span class="badge-mono">02</span><b>Streamable HTTP</b></span>
  <p>自托管 Node · 单端点 JSON-RPC + SSE · stateful / stateless 可选</p>
  <span class="bcard-foot">createHttpServer · 127.0.0.1:3333/mcp</span>
</div>

</v-click>

<v-click>

<div class="bcard">
  <span class="bcard-top"><span class="badge-mono">03</span><b>Web Handler</b></span>
  <p>Cloudflare / Deno / Bun / Vercel Edge —— 任何有 fetch 的运行时</p>
  <span class="bcard-foot">createWebHandler · (Request) => Response</span>
</div>

</v-click>

</div>

<v-click>

<div class="callout">HTTP 服务器基于 Node 内置 <code>http.createServer</code> —— 不引入 Express / Hono / Fastify，单一职责。</div>

</v-click>

---

<div class="sk"><span class="sk-num">03</span><span class="sk-sep">/</span><span class="sk-name">ARCHITECTURE · 架构</span></div>

# 一次工具调用的旅程

<div class="steps steps-fill">

<v-click>

<div class="step">
  <span class="step-top"><span class="step-num">01</span><span class="step-tag">tools/call</span></span>
  <b>宿主发起</b>
  <div>Claude Code 等任意 MCP 客户端发起调用</div>
</div>

</v-click>

<v-click>

<div class="step">
  <span class="step-top"><span class="step-num">02</span><span class="step-tag">transport</span></span>
  <b>进入传输层</b>
  <div>stdio · HTTP · fetch 汇入同一注册表</div>
</div>

</v-click>

<v-click>

<div class="step">
  <span class="step-top"><span class="step-num">03</span><span class="step-tag">zod parse</span></span>
  <b>Schema 校验</b>
  <div>Zod inputSchema 解析并校验入参</div>
</div>

</v-click>

<v-click>

<div class="step">
  <span class="step-top"><span class="step-num">04</span><span class="step-tag">run()</span></span>
  <b>执行工具</b>
  <div>源适配器查询你的 API 或数据库</div>
</div>

</v-click>

<v-click>

<div class="step step-last">
  <span class="step-top"><span class="step-num">05</span><span class="step-tag">response</span></span>
  <b>结果回传</b>
  <div>非字符串结果 JSON 化返回宿主</div>
</div>

</v-click>

</div>

<v-click>

<div class="resp-strip">

<span class="resp-arrow">→</span>
<pre><code>{ "content": [{ "type": "text", "text": "3" }] }</code></pre>
<span class="resp-note">add(\{ a: 1, b: 2 \})的真实响应</span>

</div>

</v-click>

<!--
京津
-->

---

<div class="sk"><span class="sk-num">03</span><span class="sk-sep">/</span><span class="sk-name">ARCHITECTURE · 架构</span></div>

# 数据源适配器与安全默认值

<div class="grid3">

<v-click>

<div class="bcard">
  <span class="bcard-top"><span class="badge-mono">{}</span><b>Zod</b></span>
  <p>恒等包装保住类型，手写即所得</p>
  <span class="bcard-foot">read + write</span>
</div>

</v-click>

<v-click>

<div class="bcard">
  <span class="bcard-top"><span class="badge-mono">API</span><b>OpenAPI</b></span>
  <p>默认只暴露 GET/HEAD · API-key 支持 header / query / cookie</p>
  <span class="bcard-foot">read-only default</span>
</div>

</v-click>

<v-click>

<div class="bcard">
  <span class="bcard-top"><span class="badge-mono">DB</span><b>Prisma</b></span>
  <p>默认只读 · 行数上限 · 查询超时 · 写入需 allowlist + 审计</p>
  <span class="bcard-foot">read-only default</span>
</div>

</v-click>

<v-click>

<div class="bcard">
  <span class="bcard-top"><span class="badge-mono">DR</span><b>Drizzle</b></span>
  <p>只读 findMany · 行数上限 · 无原生 SQL</p>
  <span class="bcard-foot">read-only</span>
</div>

</v-click>

<v-click>

<div class="bcard">
  <span class="bcard-top"><span class="badge-mono">RPC</span><b>tRPC</b></span>
  <p>query → 只读工具 · mutation 默认隐藏 · subscription 暂不暴露</p>
  <span class="bcard-foot">query only</span>
</div>

</v-click>

<v-click>

<div class="bcard">
  <span class="bcard-top"><span class="badge-mono">i</span><b>工具元数据</b></span>
  <p>v0.3 起每个工具携带来源类型、读写能力与安全标记</p>
  <span class="bcard-foot">source · capability · safety</span>
</div>

</v-click>

</div>

---

<div class="sk"><span class="sk-num">03</span><span class="sk-sep">/</span><span class="sk-name">ARCHITECTURE · 架构</span></div>

# 写操作安全：两步提交协议

<div class="cols-2">

<div class="h-full">

```ts
// 1. dryRun 预览 → 返回一次性 previewToken
const preview = await db_user_create({
  dryRun: true,
  data: { email: 'a@b.c' },
})

// 2. 凭 token 提交（限时 · 绑定参数哈希）
await db_user_create({
  previewToken: preview.token,
})
```

</div>
<div class="mini-grid">

<v-click>

<div class="mini-card"><b>fail-closed</b><span>审计写不进就不提交</span></div>

</v-click>

<v-click>

<div class="mini-card"><b>显式 allowlist</b><span>缺 writes 配置直接抛错</span></div>

</v-click>

<v-click>

<div class="mini-card"><b>空 where 拒绝</b><span>updateMany / deleteMany 拒绝空条件</span></div>

</v-click>

<v-click>

<div class="mini-card"><b>大影响确认</b><span>需 confirmLargeImpact: true</span></div>

</v-click>

<v-click>

<div class="mini-card"><b>JSONL 审计</b><span>createJsonlAuditSink 落轨迹</span></div>

</v-click>

<v-click>

<div class="mini-card"><b>幂等键</b><span>idempotencyKey 防宿主重试</span></div>

</v-click>

</div>

</div>

---

<div class="sk"><span class="sk-num">04</span><span class="sk-sep">/</span><span class="sk-name">TOOLING · 工具链</span></div>

# CLI 工具链：<span class="mono">bridgent</span>

<div class="cli-grid">

<v-click>

<div class="cli-cmd"><span class="c-name">bridgent init</span><span class="c-desc">生成最小可编辑 server.ts · 默认拒绝覆盖，--force 显式替换</span></div>

</v-click>

<v-click>

<div class="cli-cmd"><span class="c-name">bridgent dev</span><span class="c-desc">零编译直跑 TypeScript —— Node 22.18+ 类型剥离，无需 tsx</span></div>

</v-click>

<v-click>

<div class="cli-cmd"><span class="c-name">bridgent serve</span><span class="c-desc">以 Streamable HTTP 启动 · 默认 127.0.0.1:3333/mcp</span></div>

</v-click>

<v-click>

<div class="cli-cmd"><span class="c-name">bridgent inspect</span><span class="c-desc">拉起官方 MCP Inspector · 附带源/能力提示</span></div>

</v-click>

</div>

---

<div class="sk"><span class="sk-num">04</span><span class="sk-sep">/</span><span class="sk-name">TOOLING · 工具链</span></div>

# 工程决策（ADR 精选）

<div class="adr-grid">

<v-click>

<div class="adr"><b>ESM-only</b>tsdown 只产 .mjs / .d.mts —— 不背 CJS 历史包袱</div>

</v-click>

<v-click>

<div class="adr"><b>SDK 打依赖，Zod 打 peer</b>包体小，SDK 传递依赖不进 bundle</div>

</v-click>

<v-click>

<div class="adr"><b>Zod v4 only</b>inputSchema.shape 直通 MCP SDK</div>

</v-click>

<v-click>

<div class="adr"><b>无 project references</b>typecheck 消费上游 .d.mts，靠 turbo 编排</div>

</v-click>

<v-click>

<div class="adr"><b>pnpm catalog 单一版本源</b>所有依赖版本只在一处声明</div>

</v-click>

<v-click>

<div class="adr"><b>Turborepo 门禁</b>build · test · typecheck · lint 全绿才算完成</div>

</v-click>

</div>

---

<div class="sk"><span class="sk-num">05</span><span class="sk-sep">/</span><span class="sk-name">OUTLOOK · 展望</span></div>

# 跨宿主验证靶场

<div class="harness">

<v-click>

<div class="host">Claude Code</div>

</v-click>

<v-click>

<div class="host">Cursor</div>

</v-click>

<v-click>

<div class="host">OpenAI Codex</div>

</v-click>

<v-click>

<div class="host">Gemini CLI</div>

</v-click>

</div>

<v-click>

<div class="callout">

<code>@bridgent/host-test</code> 在 <b>协议层</b>驱动真实 stdio / HTTP / Web handler 服务器 —— 验证的是行为，不是模拟。任何符合 MCP 1.x 的客户端都能接入。

</div>

</v-click>

---

<div class="sk"><span class="sk-num">05</span><span class="sk-sep">/</span><span class="sk-name">OUTLOOK · 展望</span></div>

# 路线图

<div class="grid3">

<v-click>

<div class="rm-col rm-col-now">
  <span class="rm-tag rm-now">v0.3 · 已发布</span>
  <b style="color: var(--ink)">适配器与元数据</b>
  <ul>
    <li>tRPC 源适配器</li>
    <li>工具元数据</li>
    <li>inspect 源提示</li>
  </ul>
</div>

</v-click>

<v-click>

<div class="rm-col rm-col-next">
  <span class="rm-tag rm-next">v0.4 · 进行中</span>
  <b style="color: var(--ink)">策略执行</b>
  <ul>
    <li>生成工具面的本地 policy enforcement</li>
    <li>更细粒度的读写控制</li>
  </ul>
</div>

</v-click>

<v-click>

<div class="rm-col">
  <span class="rm-tag rm-later">生态方向</span>
  <b style="color: var(--ink)">更远的图</b>
  <ul>
    <li>GraphQL 源</li>
    <li>宿主控制平面</li>
    <li>注册与分发</li>
  </ul>
</div>

</v-click>

</div>

---

<div class="cover-anim">

<LogoMark class="cover-logo" style="width: 84px" />

# 谢谢<span class="grad">观看</span>

<p class="cover-sub-line"><em>Bridgent AI</em> · 一行命令，任意 MCP</p>

</div>

---

<div class="cover-anim">

# <span class="grad">Q&amp;A</span>

<p class="cover-sub">欢迎提问 —— 或者现在就跑第一条命令试试</p>

<div class="cta-cmd">

```bash
pnpm add -D @bridgent/cli @bridgent/core zod
```

</div>

<p class="cover-sub-line"><em>github.com/js-mark/bridgent</em> · js-mark.com/Bridgent</p>

</div>

---
layout: center
class: cover-anim
---

<div class="cover-anim">

<LogoMark class="cover-logo" style="width: 92px" />

# 今晚就发布你的<br><span class="grad">第一个 MCP Server</span>

<div class="cta-cmd">

```bash
pnpm add -D @bridgent/cli @bridgent/core zod && bridgent init ./server.ts
```

</div>

<p class="cover-sub-line"><em>github.com/js-mark/bridgent</em> · js-mark.com/Bridgent · MIT License</p>

</div>
