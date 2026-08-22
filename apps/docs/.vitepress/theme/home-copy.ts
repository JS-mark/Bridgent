// Shared EN/ZH copy for the custom home page. The active locale is resolved
// from VitePress `useData().lang` inside each section component.
export interface TerminalLine {
  cmd?: string
  out?: string
}

export interface Copy {
  hero: {
    badge: string
    titleTop: string
    titleGrad: string
    sub: string
    primary: string
    secondary: string
    github: string
    scroll: string
    terminal: TerminalLine[]
    features: { icon: string, title: string, text: string }[]
  }
  pipeline: {
    kicker: string
    title: string
    sub: string
    phases: { label: string, title: string, desc: string, chips: string[] }[]
    stats: { value: number, suffix: string, label: string }[]
  }
  sources: {
    kicker: string
    title: string
    sub: string
    youHave: string
    youGet: string
    items: { badge: string, name: string, have: string, get: string, status: string, tone: 'ship' | 'new' | 'plan' }[]
  }
  features: {
    kicker: string
    title: string
    sub: string
    items: { icon: string, title: string, text: string }[]
  }
  code: {
    kicker: string
    title: string
    sub: string
    tabs: { id: string, label: string, code: string }[]
  }
  hosts: {
    kicker: string
    title: string
    sub: string
    chips: string[]
    ctaTitle: string
    ctaSub: string
    ctaButton: string
  }
}

export const en: Copy = {
  hero: {
    badge: 'v0.3 Alpha — tRPC source is live',
    titleTop: 'One line to expose',
    titleGrad: 'any API as MCP',
    sub: 'Turn the definitions you already have — OpenAPI specs, Prisma schemas, Drizzle tables, tRPC routers, Zod functions — into a production-ready Model Context Protocol server, instantly usable in Claude Code, Codex, Cursor and Gemini CLI.',
    primary: 'Get Started',
    secondary: 'What is Bridgent?',
    github: 'GitHub',
    scroll: 'scroll',
    terminal: [
      { cmd: 'pnpm add -D @bridgent/cli @bridgent/core zod' },
      { cmd: 'bridgent init ./server.ts' },
      { cmd: 'bridgent dev ./server.ts' },
      { out: '✓ MCP server "hello" ready — 1 tool live over stdio' },
    ],
    features: [
      {
        icon: 'shield',
        title: 'Type-safe to the bone',
        text: 'Zod objects are the tool inputs — the same types flow from your code to the host.',
      },
      {
        icon: 'file',
        title: 'One file, zero config',
        text: 'A server file you can read in one sitting. No YAML, no hidden state, no lock-in.',
      },
      {
        icon: 'globe',
        title: 'Runs anywhere',
        text: 'stdio for IDE agents, Streamable HTTP for self-hosting, a fetch handler for the edge.',
      },
    ],
  },
  pipeline: {
    kicker: 'Live architecture',
    title: 'From schema to running MCP',
    sub: 'A live pipeline — every stage of exposing your stack as MCP tools, rendered in real time.',
    phases: [
      {
        label: '01',
        title: 'Connect your sources',
        desc: 'Point Bridgent at the definitions you already have — no rewrites, no new schema language.',
        chips: ['Zod', 'OpenAPI', 'Prisma', 'Drizzle', 'tRPC'],
      },
      {
        label: '02',
        title: 'Tools are generated',
        desc: 'Each adapter emits typed MCP tools with source kind, capability and safety metadata attached.',
        chips: ['defineTool', 'tool metadata', 'read-only defaults'],
      },
      {
        label: '03',
        title: 'Pick your transports',
        desc: 'The same tool list serves stdio, Streamable HTTP, or a Web Standard fetch handler — switch with one call.',
        chips: ['stdio', 'Streamable HTTP', 'Web fetch'],
      },
      {
        label: '04',
        title: 'Hosts come online',
        desc: 'Data flows to Claude Code, Cursor, Codex and Gemini CLI — or any MCP 1.x client. That is the whole product.',
        chips: ['Claude Code', 'Cursor', 'Codex', 'Gemini CLI'],
      },
    ],
    stats: [
      { value: 637, suffix: ' tools', label: 'from one GitHub spec — 0 lines of schema' },
      { value: 15, suffix: ' tools', label: 'from a 38-line Prisma schema' },
      { value: 12, suffix: ' KB', label: 'core bundle · 1 runtime dependency' },
      { value: 140, suffix: ' ms', label: 'cold start · TypeScript direct' },
    ],
  },
  sources: {
    kicker: 'Sources',
    title: 'You already have the schema',
    sub: 'Bridgent reuses it instead of asking you to write another one. Each adapter ships with safety defaults baked in.',
    youHave: 'You have',
    youGet: 'Bridgent gives you',
    items: [
      {
        badge: '{}',
        name: 'Zod',
        have: 'Zod schema + function',
        get: 'A complete MCP server, packaged for npm',
        status: 'Shipped',
        tone: 'ship',
      },
      {
        badge: 'API',
        name: 'OpenAPI 3.x',
        have: 'openapi.json / yaml spec',
        get: 'One tool per operation · Bearer & API-key auth',
        status: 'Shipped',
        tone: 'ship',
      },
      {
        badge: 'DB',
        name: 'Prisma 6.x',
        have: 'schema.prisma',
        get: 'find / findMany / aggregate / count · audited writes opt-in',
        status: 'Shipped',
        tone: 'ship',
      },
      {
        badge: 'DR',
        name: 'Drizzle',
        have: 'Drizzle table definitions',
        get: 'Read-only findMany tools with row caps',
        status: 'Shipped',
        tone: 'ship',
      },
      {
        badge: 'RPC',
        name: 'tRPC',
        have: 'Existing tRPC router',
        get: 'One read tool per query procedure · mutations allowlisted',
        status: 'New · v0.3',
        tone: 'new',
      },
      {
        badge: 'GQL',
        name: 'GraphQL',
        have: 'GraphQL schema',
        get: 'Schema-driven tool generation',
        status: 'Roadmap',
        tone: 'plan',
      },
    ],
  },
  features: {
    kicker: 'Why Bridgent',
    title: 'Production-ready, not a demo',
    sub: 'The boring parts — safety, metadata, transports, verification — are the product.',
    items: [
      {
        icon: 'shield',
        title: 'Safe by default',
        text: 'Read-only defaults, row limits, query timeouts and explicit allowlists keep your data layer in check even when an agent goes off-script.',
      },
      {
        icon: 'tag',
        title: 'Tool metadata',
        text: 'Source kind, read/write capability and safety flags travel with every generated tool — for hosts, docs and the inspector.',
      },
      {
        icon: 'clipboard',
        title: 'Audited writes',
        text: 'Prisma writes commit through a two-step dryRun / previewToken protocol, with JSONL audit trails and idempotency keys.',
      },
      {
        icon: 'swap',
        title: 'Three transports',
        text: 'stdio, Streamable HTTP and a Web Standard fetch handler. Same tool list — switching is changing one factory call.',
      },
      {
        icon: 'zap',
        title: 'Zero-compile dev',
        text: 'bridgent dev runs your TypeScript server directly on Node 22.18+ type stripping. No tsx, no build step, no waiting.',
      },
      {
        icon: 'check',
        title: 'Cross-host verified',
        text: 'A protocol-level harness verifies the server against Claude Code, Cursor, Codex and Gemini CLI on every release.',
      },
    ],
  },
  code: {
    kicker: 'Code',
    title: 'A server file, not a framework',
    sub: 'Compose source adapters in plain TypeScript. The CLI does the rest.',
    tabs: [
      {
        id: 'zod',
        label: 'Zod',
        code: `import { createStdioServer, defineTool } from '@bridgent/core'
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
})`,
      },
      {
        id: 'openapi',
        label: 'OpenAPI',
        code: `import { createStdioServer } from '@bridgent/core'
import { fromOpenApi } from '@bridgent/source-openapi'

await createStdioServer({
  name: 'petstore',
  version: '0.0.1',
  tools: await fromOpenApi({
    spec: './openapi.json',
    // mutating defaults to false → only GET/HEAD operations are exposed
  }),
})`,
      },
      {
        id: 'prisma',
        label: 'Prisma',
        code: `import { createStdioServer } from '@bridgent/core'
import { fromPrisma } from '@bridgent/source-prisma'
import { PrismaClient } from '@prisma/client'

const client = new PrismaClient()

await createStdioServer({
  name: 'demo-db',
  version: '0.0.1',
  tools: await fromPrisma({
    client,
    namespace: 'db_',
    // mutating defaults to false → only read tools exposed
  }),
})`,
      },
      {
        id: 'trpc',
        label: 'tRPC',
        code: `import { createStdioServer } from '@bridgent/core'
import { fromTrpc } from '@bridgent/source-trpc'
import { appRouter } from './router.ts'

await createStdioServer({
  name: 'trpc-router',
  version: '0.0.1',
  tools: fromTrpc({
    router: appRouter,
    createContext: () => ({ userId: 'demo-user' }),
  }),
})`,
      },
    ],
  },
  hosts: {
    kicker: 'Hosts',
    title: 'Speaks MCP, works everywhere',
    sub: 'Verified at the protocol level against the hosts teams actually use.',
    chips: ['Claude Code', 'Cursor', 'OpenAI Codex', 'Gemini CLI', 'MCP Inspector', 'Any MCP 1.x client', 'Claude Code', 'Cursor', 'OpenAI Codex', 'Gemini CLI', 'MCP Inspector', 'Any MCP 1.x client'],
    ctaTitle: 'Ship your first MCP server tonight',
    ctaSub: 'MIT licensed · TypeScript · Node ≥ 22.18 · Alpha v0.3',
    ctaButton: 'Get Started',
  },
}

export const zh: Copy = {
  hero: {
    badge: 'v0.3 Alpha — tRPC 数据源已上线',
    titleTop: '一行命令，把任意',
    titleGrad: 'API 暴露为 MCP',
    sub: '把你已有的 OpenAPI 规范、Prisma schema、Drizzle 表、tRPC 路由与 Zod 函数，转换成生产可用的 Model Context Protocol 服务器 —— 在 Claude Code、Codex、Cursor 与 Gemini CLI 中即刻可用。',
    primary: '快速开始',
    secondary: '什么是 Bridgent？',
    github: 'GitHub',
    scroll: '向下滚动',
    terminal: [
      { cmd: 'pnpm add -D @bridgent/cli @bridgent/core zod' },
      { cmd: 'bridgent init ./server.ts' },
      { cmd: 'bridgent dev ./server.ts' },
      { out: '✓ MCP 服务器 "hello" 已就绪 — 1 个工具经 stdio 提供' },
    ],
    features: [
      {
        icon: 'shield',
        title: '类型安全到底',
        text: 'Zod 对象即工具入参 —— 同一套类型从你的代码流到宿主。',
      },
      {
        icon: 'file',
        title: '一个文件，零配置',
        text: '一份一眼能读完的服务文件。没有 YAML，没有隐藏状态，没有锁定。',
      },
      {
        icon: 'globe',
        title: '到处运行',
        text: 'stdio 给 IDE Agent，Streamable HTTP 给自托管，fetch handler 给边缘。',
      },
    ],
  },
  pipeline: {
    kicker: '动态架构',
    title: '从 schema 到运行中的 MCP',
    sub: '一条实时管线 —— 把你的技术栈暴露为 MCP 工具的每个阶段，实时渲染。',
    phases: [
      {
        label: '01',
        title: '接入你的数据源',
        desc: '把 Bridgent 指向你已有的定义 —— 不重写、不学新的 schema 语言。',
        chips: ['Zod', 'OpenAPI', 'Prisma', 'Drizzle', 'tRPC'],
      },
      {
        label: '02',
        title: '工具面自动生成',
        desc: '每个适配器产出带类型的 MCP 工具，并附着来源类型、读写能力与安全元数据。',
        chips: ['defineTool', '工具元数据', '默认只读'],
      },
      {
        label: '03',
        title: '选择你的传输',
        desc: '同一份工具列表走 stdio、Streamable HTTP 或 Web Standard fetch —— 换传输只改一个调用。',
        chips: ['stdio', 'Streamable HTTP', 'Web fetch'],
      },
      {
        label: '04',
        title: '宿主上线，数据流动',
        desc: '数据流向 Claude Code、Cursor、Codex 与 Gemini CLI —— 或任意 MCP 1.x 客户端。这就是产品的全部。',
        chips: ['Claude Code', 'Cursor', 'Codex', 'Gemini CLI'],
      },
    ],
    stats: [
      { value: 637, suffix: ' 个工具', label: '单个 GitHub spec · 0 行手写 schema' },
      { value: 15, suffix: ' 个工具', label: '一份 38 行的 Prisma schema' },
      { value: 12, suffix: ' KB', label: 'core 产物 · 1 个运行时依赖' },
      { value: 140, suffix: ' ms', label: '冷启动 · TS 直跑' },
    ],
  },
  sources: {
    kicker: '数据源',
    title: 'Schema 你早就有了',
    sub: 'Bridgent 直接复用它，而不是让你再写一份。每个适配器都内置安全默认值。',
    youHave: '你已有',
    youGet: 'Bridgent 给你',
    items: [
      {
        badge: '{}',
        name: 'Zod',
        have: 'Zod schema + 函数',
        get: '一个完整的、可发布到 npm 的 MCP 服务器',
        status: '已发布',
        tone: 'ship',
      },
      {
        badge: 'API',
        name: 'OpenAPI 3.x',
        have: 'openapi.json / yaml 规范',
        get: '每个操作一个工具 · 支持 Bearer 与 API-key 鉴权',
        status: '已发布',
        tone: 'ship',
      },
      {
        badge: 'DB',
        name: 'Prisma 6.x',
        have: 'schema.prisma',
        get: 'find / findMany / aggregate / count · 写操作需显式开启并审计',
        status: '已发布',
        tone: 'ship',
      },
      {
        badge: 'DR',
        name: 'Drizzle',
        have: 'Drizzle 表定义',
        get: '只读 findMany 工具，自带行数上限',
        status: '已发布',
        tone: 'ship',
      },
      {
        badge: 'RPC',
        name: 'tRPC',
        have: '已有的 tRPC 路由',
        get: '每个 query procedure 一个只读工具 · mutation 需白名单',
        status: '新增 · v0.3',
        tone: 'new',
      },
      {
        badge: 'GQL',
        name: 'GraphQL',
        have: 'GraphQL schema',
        get: '基于 schema 的工具生成',
        status: '规划中',
        tone: 'plan',
      },
    ],
  },
  features: {
    kicker: '为什么选 Bridgent',
    title: '生产可用，不是玩具 Demo',
    sub: '安全、元数据、传输、跨宿主验证 —— 这些“枯燥”的部分才是产品本身。',
    items: [
      {
        icon: 'shield',
        title: '默认安全',
        text: '默认只读、行数限制、查询超时与显式 allowlist，即便 Agent 行为走样也能守住数据层。',
      },
      {
        icon: 'tag',
        title: '工具元数据',
        text: '来源类型、读写能力与安全标记随每个生成的工具一起下发 —— 供宿主、文档与 Inspector 使用。',
      },
      {
        icon: 'clipboard',
        title: '审计写入',
        text: 'Prisma 写操作通过 dryRun / previewToken 两步提交，带 JSONL 审计轨迹与幂等键。',
      },
      {
        icon: 'swap',
        title: '三种传输',
        text: 'stdio、Streamable HTTP 与 Web Standard fetch handler。工具列表不变，换传输只改一个工厂函数。',
      },
      {
        icon: 'zap',
        title: '零编译开发',
        text: 'bridgent dev 直接用 Node 22.18+ 的类型剥离跑 TypeScript。不需要 tsx，不需要构建步骤。',
      },
      {
        icon: 'check',
        title: '跨宿主验证',
        text: '协议级测试靶场在每次发布前验证 Claude Code、Cursor、Codex 与 Gemini CLI 的兼容性。',
      },
    ],
  },
  code: {
    kicker: '代码',
    title: '一个服务文件，不是一个框架',
    sub: '用纯 TypeScript 组合数据源适配器，其余交给 CLI。',
    tabs: [
      {
        id: 'zod',
        label: 'Zod',
        code: `import { createStdioServer, defineTool } from '@bridgent/core'
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
})`,
      },
      {
        id: 'openapi',
        label: 'OpenAPI',
        code: `import { createStdioServer } from '@bridgent/core'
import { fromOpenApi } from '@bridgent/source-openapi'

await createStdioServer({
  name: 'petstore',
  version: '0.0.1',
  tools: await fromOpenApi({
    spec: './openapi.json',
    // mutating 默认 false → 只暴露 GET/HEAD 操作
  }),
})`,
      },
      {
        id: 'prisma',
        label: 'Prisma',
        code: `import { createStdioServer } from '@bridgent/core'
import { fromPrisma } from '@bridgent/source-prisma'
import { PrismaClient } from '@prisma/client'

const client = new PrismaClient()

await createStdioServer({
  name: 'demo-db',
  version: '0.0.1',
  tools: await fromPrisma({
    client,
    namespace: 'db_',
    // mutating 默认 false → 只暴露读工具
  }),
})`,
      },
      {
        id: 'trpc',
        label: 'tRPC',
        code: `import { createStdioServer } from '@bridgent/core'
import { fromTrpc } from '@bridgent/source-trpc'
import { appRouter } from './router.ts'

await createStdioServer({
  name: 'trpc-router',
  version: '0.0.1',
  tools: fromTrpc({
    router: appRouter,
    createContext: () => ({ userId: 'demo-user' }),
  }),
})`,
      },
    ],
  },
  hosts: {
    kicker: '宿主',
    title: '说 MCP 的地方，都能用',
    sub: '在协议层面对团队真正在用的宿主逐一验证。',
    chips: ['Claude Code', 'Cursor', 'OpenAI Codex', 'Gemini CLI', 'MCP Inspector', '任意 MCP 1.x 客户端', 'Claude Code', 'Cursor', 'OpenAI Codex', 'Gemini CLI', 'MCP Inspector', '任意 MCP 1.x 客户端'],
    ctaTitle: '今晚就发布你的第一个 MCP 服务器',
    ctaSub: 'MIT 开源 · TypeScript · Node ≥ 22.18 · Alpha v0.3',
    ctaButton: '快速开始',
  },
}
