# Architecture Decisions

ADR-style 决策记录。每条带 **决策 / 上下文 / 后果 / 状态**。

---

## ADR-033 — v0.4 policy 使用 `withPolicy` 包装，并在调用前 fail closed

- **决策**：v0.4 在 `@bridgent/core` 新增 additive helper `withPolicy(tools, policy)`。它返回仍可传给现有 transport 的 `BridgentTool[]`，不改变 `defineTool`、source adapter 或 transport option。策略只接受可序列化的 declarative config，不接受 callback、正则或异步 evaluator。
- **上下文**：v0.3 metadata 只能提示风险，不能阻止调用。v0.4 需要在不分叉 stdio / HTTP / Web transport、不改变 adapter 输出形态的前提下，对同一组工具提供一致、可测试、默认 fail-closed 的本地执行边界。
- **后果**：策略是显式 opt-in；未调用 `withPolicy` 的现有服务完全保持原行为。包装后的工具仍会注册和出现在 `tools/list` 中，以便 Inspector 展示 enforced policy，直接调用被拒工具时也能得到可操作的 policy error。隐藏被拒工具的能力不在 v0.4 范围内。
- **状态**：✅ Accepted（2026-08-17）；这里只冻结契约，runtime / CLI / docs 实现仍属于 v0.4 后续工作，尚未 shipped

### Public TypeScript contract

以下是实现必须保持的 public shape；字段只包含 JSON-compatible 值：

```ts
export interface BridgentPolicy {
  tools?: BridgentPolicySelector<string>
  sourceKinds?: BridgentPolicySelector<BridgentSourceKind>
  readOnly?: boolean
  maxTools?: number
  limits?: {
    rows?: BridgentPolicyLimitRule
    outputBytes?: BridgentPolicyLimitRule
  }
  require?: {
    auditForWrites?: boolean
    previewTokenForWrites?: boolean
  }
}

export interface BridgentPolicySelector<T extends string> {
  allow?: readonly T[]
  deny?: readonly T[]
}

export interface BridgentPolicyLimitRule {
  max: number
  onMissing?: 'deny' | 'ignore'
}

export type BridgentPolicyViolationCode
  = | 'METADATA_MISSING'
    | 'METADATA_INVALID'
    | 'TOOL_DENIED'
    | 'TOOL_NOT_ALLOWED'
    | 'SOURCE_KIND_DENIED'
    | 'SOURCE_KIND_NOT_ALLOWED'
    | 'READ_ONLY'
    | 'AUDIT_REQUIRED'
    | 'PREVIEW_TOKEN_REQUIRED'
    | 'ROW_LIMIT_EXCEEDED'
    | 'OUTPUT_LIMIT_EXCEEDED'

export interface BridgentPolicyViolation {
  code: BridgentPolicyViolationCode
  tool: string
  message: string
}

export class BridgentPolicyError extends Error {
  readonly name: 'BridgentPolicyError'
  readonly code: 'BRIDGENT_POLICY_DENIED'
  readonly violation: BridgentPolicyViolation
  constructor(violation: BridgentPolicyViolation)
}

export type BridgentPolicySetupErrorCode
  = | 'BRIDGENT_POLICY_INVALID'
    | 'BRIDGENT_POLICY_MAX_TOOLS'

export class BridgentPolicySetupError extends Error {
  readonly name: 'BridgentPolicySetupError'
  readonly code: BridgentPolicySetupErrorCode
  readonly path?: string
  constructor(code: BridgentPolicySetupErrorCode, message: string, path?: string)
}

export function withPolicy<TTool extends BridgentTool<any, any>>(
  tools: readonly TTool[],
  policy: BridgentPolicy,
): TTool[]
```

`withPolicy` 保留每个 tool 的 `name`、`description`、`inputSchema`、`metadata` 与输入/输出泛型，只替换 `run`。返回数组带 core 内部的 non-enumerable policy marker，marker 不是 public API；`createInspectSummary` 用它输出 server-level `policy.enforced: true` 和规范化后的 declarative rules。CLI 因此可以明确区分「metadata advisory warning」与「runtime enforced policy」，而不把 policy 状态伪装成 source metadata。

### Config validation and selector semantics

`withPolicy` 首先复制并规范化 config，后续修改原始数组或 policy 对象不能改变已建立的决策。以下规则固定：

1. tool name 使用完整名称、区分大小写、无 glob；source kind 使用当前 `BridgentSourceKind` 精确匹配。
2. 配置了 `allow` 时必须命中；未配置时该维度 unrestricted。空 `allow: []` 合法，表示该维度不允许任何值。空 `deny: []` 无效果。
3. tool 与 source 两个 allowlist 同时存在时取交集（AND）。任一 denylist 命中即拒绝（OR）。
4. deny 永远高于 allow。`readOnly`、write safety 和 limit rule 也高于 allow；allowlist 不能豁免安全规则。
5. 同一个值同时出现在 allow / deny 不是 invalid config，按 deny 处理。重复项在规范化时去重。
6. `maxTools` 和 limit `max` 必须是非负 safe integer；未知 key、未知 enum、错误类型、`NaN`、负数或小数均在包装期抛 `BridgentPolicySetupError('BRIDGENT_POLICY_INVALID')`。实现不能静默忽略 typo。
7. 传入数组存在重复 tool name 时，即使 metadata 相同也抛 `BRIDGENT_POLICY_INVALID`；MCP 注册无法区分同名工具，policy 不能猜测应采用哪一份 metadata。
8. `maxTools` 统计传入 `withPolicy` 的原始工具总数，包括之后会被 allow / deny 拒绝的工具。超限时立即抛 `BRIDGENT_POLICY_MAX_TOOLS`，消息固定为 `Policy maxTools exceeded: received <actual> tools, maximum <max>.`，server 不进入注册阶段。

对单个 tool 的决定按以下优先级生成，第一条失败原因作为稳定 violation：

1. 当前配置所需 metadata 的完整性与值域；
2. tool deny；
3. source kind deny；
4. tool allow；
5. source kind allow；
6. `readOnly`；
7. `auditForWrites`；
8. `previewTokenForWrites`；
9. rows limit；
10. output bytes limit。

### Metadata and limit semantics

Metadata 仍是 adapter 声明的输入，不因存在而自动授予权限。只有实际配置了依赖该字段的 policy rule 时才读取对应字段：

- source selector 要求 `metadata.source.kind` 是当前 core 认识的 `BridgentSourceKind`；缺失为 `METADATA_MISSING`，未来或伪造的未知字符串为 `METADATA_INVALID`。
- `readOnly` 或任一 write safety rule 要求 `metadata.capability` 明确为 `read` / `write`；缺失或未知值均拒绝。`readOnly: true` 只允许 `read`。
- 对 write tool，`auditForWrites: true` 要求 `metadata.safety.hasAudit === true`，`previewTokenForWrites: true` 要求 `metadata.safety.hasPreviewToken === true`；`false` 与缺失都不能满足要求。对 read tool 这两条不适用。
- `metadata.limits.rowLimit` 表示 adapter 自己强制的最大返回行数；`metadata.limits.outputLimit` 从 v0.4 起统一表示 adapter 自己强制的、按最终 UTF-8 tool text 计算的最大 byte 数。policy 只比较这些已执行的上限，不根据实际 result 猜测，也不 clamp input、截断 output 或把 hint 当作 enforcement。
- `rows.max` / `outputBytes.max` 在相应 hint 存在且为非负 safe integer 时做 `hint <= max` 比较，超出分别返回 `ROW_LIMIT_EXCEEDED` / `OUTPUT_LIMIT_EXCEEDED`。
- limit rule 的 `onMissing` 默认是 `deny`：相应 hint 缺失时返回 `METADATA_MISSING`。只有用户显式写 `onMissing: 'ignore'` 才把「该 tool 没声明这种 limit」视为 not applicable；这是混合 tool surface 的显式兼容出口，不是默认降级。
- metadata 与显式 policy 冲突时 policy 永远胜出，例如 allowlisted tool 标成 `write` 仍会被 `readOnly` 拒绝。`capability: 'read'` 携带 write safety flag 不视为冲突，flag 对 read tool 不适用；同名工具携带不同 metadata 则按上面的 duplicate-name setup error 处理。实现不得从 tool name、description 或 source reference 推断、修补 metadata。
- 不依赖 metadata 的纯 tool-name policy 即使遇到无 metadata 的手写工具仍可求值。任何配置所需字段无法读取、类型错误或出现未知值时都 fail closed，不能回退为 allow。

### Construction, registration, and invocation boundary

- **包装期**：验证 config，执行全局 `maxTools` guard，读取所需 metadata 并为每个 tool 编译 immutable allow / deny decision。invalid config 与 `maxTools` 是 setup error，会阻止 server 启动。
- **transport 注册期**：所有 transport 继续调用同一个 `registerTools`；policy 不过滤、不重命名工具，也不执行原始 `run`。被拒工具仍注册，从而得到一致的 MCP policy error，而不是 transport 自己的 unknown-tool 文案。
- **调用期**：wrapper 在进入原始 `tool.run` 前读取已编译 decision。拒绝时抛 `BridgentPolicyError`，原始 `run` 调用次数必须为 0；允许时直接调用原始 `run`，不改 input 或 result。
- **MCP 映射**：`registerTools` 只捕获 `BridgentPolicyError`，返回 `isError: true`；其它既有异常继续交给 MCP SDK，避免无意改变现有错误语义。allowed result 继续使用现有规则：string 原样返回，非 string 只做一次 `JSON.stringify`。

Policy rejection 的 text content 是单行 JSON，稳定 shape 为：

```json
{"ok":false,"error":{"kind":"policy","code":"BRIDGENT_POLICY_DENIED","violation":"READ_ONLY","tool":"prisma_user_delete","message":"Policy denied tool \"prisma_user_delete\": readOnly requires metadata.capability \"read\"."}}
```

对应 MCP result 必须是：

```ts
{
  content: [{ type: 'text', text: JSON.stringify(payload) }],
  isError: true,
}
```

稳定 machine fields 是 `kind`、`code`、`violation`、`tool`；`message` 必须以 `Policy denied tool "<name>": ` 开头并说明期望值和观察值。后续版本可以增加 violation code，但不能在 minor / patch 中改变已有 code 的含义。setup error 不映射成 MCP result，因为它发生在 transport 可用之前。

### Usage examples

OpenAPI server 只允许 read tool，并限制整个生成 surface：

```ts
const tools = withPolicy(await fromOpenApi({ spec }), {
  sourceKinds: { allow: ['openapi'] },
  readOnly: true,
  maxTools: 40,
})

await createStdioServer({ name: 'catalog', version: '1.0.0', tools })
```

Prisma writes 必须逐个 allow，并声明 audit 与 preview token：

```ts
const tools = withPolicy(await fromPrisma({
  client: prisma,
  namespace: 'prisma_',
  allow: { mutating: true },
  writes: {
    allowTools: ['prisma_user_update'],
    audit: { write: auditSink },
  },
}), {
  tools: { allow: ['prisma_user_findMany', 'prisma_user_update'] },
  sourceKinds: { allow: ['prisma'] },
  require: {
    auditForWrites: true,
    previewTokenForWrites: true,
  },
})
```

tRPC 只开放一个 query 和一个明确 allowlisted mutation：

```ts
const tools = withPolicy(fromTrpc({
  router,
  allow: { mutating: true, tools: ['trpc_user_update'] },
}), {
  tools: { allow: ['trpc_user_getById', 'trpc_user_update'] },
  sourceKinds: { allow: ['trpc'] },
})
```

对带 row hint 的 adapter 设 ceiling；混合 surface 中没有 row 语义的工具需显式选择 missing 行为：

```ts
const tools = withPolicy(await fromDrizzle({ db, tables }), {
  limits: {
    rows: { max: 100, onMissing: 'deny' },
    outputBytes: { max: 256_000, onMissing: 'ignore' },
  },
})
```

### v0.4 acceptance criteria mapping

| Acceptance criterion | Frozen contract |
| --- | --- |
| Mutating tool is rejected before `run` | `readOnly` / safety decision executes in wrapper before the original callback; rejected callback count is 0 |
| Explicit tool allowlist | Exact, case-sensitive `tools.allow`; empty allowlist denies all |
| Missing required safety metadata fails closed | Capability and write safety rules above return `METADATA_MISSING`, `AUDIT_REQUIRED`, or `PREVIEW_TOKEN_REQUIRED` |
| Existing adapters keep working without policy | `withPolicy` is opt-in and adapter / transport input remains `BridgentTool[]` |
| Allowed / rejected / missing metadata / no-policy tests | Follow-up core tests must cover all four, plus deny precedence, maxTools setup failure, limits, exact MCP payload, and original `run` call count |
| Existing full gate | Implementation is not complete until `pnpm turbo run build test typecheck lint` passes |
| Inspector distinguishes advisory vs enforced | Internal array marker feeds server-level `policy.enforced`; source metadata itself remains advisory |
| OpenAPI / Prisma / tRPC docs | The three examples above are the minimum public-doc scenarios for the implementation issue |

### Rejected alternatives

- **在三个 transport 各加 `policy` option**：会复制执行路径，允许直接调用 `registerTools` 时绕过，还使新增 transport 必须重新实现 policy；拒绝。
- **在 adapter 内执行 policy**：要求所有 adapter 改行为，手写 `defineTool` 仍无法覆盖，并把 cross-source 规则散落到各包；拒绝。
- **只在注册时过滤 denied tools**：客户端只能得到 generic unknown-tool，Inspector 也无法解释 enforced / denied，且不满足 actionable MCP error；v0.4 拒绝，未来可另加 hide mode。
- **predicate / callback / async evaluator**：不可序列化、无法稳定显示和复现，还会把 remote policy / auth runtime 偷渡进 MVP；拒绝。
- **自动 clamp rows 或截断 output**：core 不知道各 adapter 的 input 语义，截断 JSON 还可能破坏结构；v0.4 只验证 adapter 已声明并执行的 hint。
- **metadata 缺失时默认 allow**：会让旧手写工具或 metadata typo 绕过 `readOnly` / safety / limit；拒绝。limit 的 `onMissing: 'ignore'` 必须由用户逐条显式选择。

### Compatibility impact

- 不调用 `withPolicy` 时没有 runtime、类型或 MCP payload 变化；所有既有 source adapter 无需修改即可继续工作。
- `withPolicy` 返回普通结构兼容的 tool 数组，所以 stdio、HTTP、Web handler 和用户直接调用 `registerTools` 的代码不变。
- allowed calls 的 stringification 与 error propagation 保持当前行为。只有明确使用 policy 且被拒的调用新增 `isError: true` policy payload。
- 新的 source kind、metadata enum 或 limit unit 必须先由 core 版本认识；旧 core 遇到 policy 依赖的未知值会拒绝，这是有意的 forward fail-closed 行为。
- policy 仅约束传入 wrapper 的工具。把未包装的原数组传给 transport 是调用方显式绕过，不承诺全局或隐式 enforcement；v0.4 不引入 hosted config、环境变量 policy 或后台服务。

## ADR-028 — Prisma writes require explicit write controls

- **决策**：`@bridgent/source-prisma` 的写工具必须同时满足 `allow.mutating: true`、非空 `writes.allowTools`、以及 `writes.audit.write`。单独传 `allow.mutating: true` 或单独传 `writes` 都抛错。
- **上下文**：数据库写入是强副作用能力,不能沿用只读工具的宽松默认。早期设计已经明确 Prisma writes 不应是一个 boolean toggle。
- **后果**：默认仍只读。用户必须按最终工具名逐个开放写能力,`denyTools` 继续在 allowlist 后生效。
- **状态**：✅ Accepted（2026-06-08）

## ADR-029 — Prisma write commits use one-use preview tokens

- **决策**：写工具使用单工具两阶段协议:`dryRun: true` 返回 `previewToken`;commit 必须重复相同写参数并附带该 token。Token 使用 `pt_` 前缀、32 字节随机数、内存存储、默认 60000 ms TTL、一次性使用,并绑定工具名和参数 hash。
- **上下文**：单步写入容易被 LLM 误触发或被宿主重试放大副作用。拆成独立 preview/commit 工具会增加工具数量和选择歧义;单工具控制字段更容易放进现有 MCP schema。
- **后果**：多进程/重启后 token 失效,这是 alpha 可接受的安全默认。大影响写入还需要 `confirmLargeImpact: true`。
- **状态**：✅ Accepted（2026-06-08）

## ADR-030 — Prisma write audit is fail-closed before commit

- **决策**：所有写 preview/commit 都调用用户提供的 audit sink。commit 前先记录 `attempted` 事件;该 audit sink 抛错时,数据库写入不执行。数据库写入成功后再记录最终 `ok`;Prisma 失败时记录最终 `error`。
- **上下文**：写操作的可追溯性是生产数据库暴露给 agent 的前提。如果 audit 失败仍继续写入,系统会进入"发生了副作用但没有记录"的不可接受状态。
- **后果**：生产用户可以把 audit sink 接到 JSONL、数据库、SIEM 或日志平台;第一版不提供默认文件 sink,避免 runtime 包替用户决定落盘路径和合规策略。最终 `ok` audit 发生在数据库写入之后,如果这个最终事件失败,工具返回成功结果并带 warning,避免宿主因为 audit 后置失败而重试造成重复写入。
- **状态**：✅ Accepted（2026-06-08）

## ADR-031 — Prisma writes support local JSONL audit and short-lived idempotent replay

- **决策**：`@bridgent/source-prisma` 提供 `createJsonlAuditSink({ path })` 作为本地文件审计 helper,并在写工具控制字段中支持可选 `idempotencyKey`。同进程内正在执行的相同 commit 会按 `(toolName, idempotencyKey, argsHash)` 去重;成功 commit 结果会短期内存缓存,默认 10 分钟。
- **上下文**：v0.2.2 已经有 preview token 防误触发,但真实宿主可能在网络抖动或最终 audit warning 后重试同一次工具调用。单纯的一次性 token 会让重试失败;直接再次 dryRun/commit 又可能造成重复写入。
- **后果**：用户可以无样板代码落地 JSONL 审计;宿主可用业务 idempotency key 安全等待同进程内正在执行的提交,或重放已成功提交的结果。该缓存仍是进程内能力,重启/多实例不会共享;持久幂等与分布式去重留给后续 hosted/control-plane 设计。
- **状态**：✅ Accepted（2026-06-08）

## ADR-032 — Publishable packages use independent versions

- **决策**：changesets `linked` 配置移除,发布包按实际改动独立升版。`@bridgent/source-prisma@0.2.3` 作为 Prisma writes hardening 单包补丁发布,不带动 `@bridgent/cli`、`@bridgent/core`、`@bridgent/source-openapi`、`@bridgent/source-drizzle` 空 bump。
- **上下文**：v0.2.2 线上后,继续把所有包强行 linked 会让 changelog 与 npm 实际版本不一致,也会制造无功能变更的版本号。用户明确要求根据包版本写 changelog,不要乱增加版本。
- **后果**：发布文档和 changelog 必须写清具体包版本;跨包兼容关系由 `peerDependencies`、workspace 测试和 release checklist 保证,不再依赖"所有包同版本"这个弱约定。
- **状态**：✅ Accepted（2026-06-09）；supersedes ADR-025

## ADR-024 — Bridgent → Bridgent AI 仅品牌显示名升级

- **决策**：v0.1 alpha 发布前把品牌名从「Bridgent」升级为「Bridgent AI」，**仅改面向人的位置**（README hero / VitePress title / 4 个 publishable 包的 description / 营销文案）；import 包名 `@bridgent/*` 与 CLI 命令 `bridgent` 全部保持。
- **上下文**：「Bridgent」单独立项时辨识度足，但落地"AI agent 工具"赛道的传播阶段，加 AI 后缀显著降低首次接触者的认知成本。改 npm 名是无收益的 breaking change（README/example/host docs 已经深度引用）；改 CLI 名同理。
- **后果**：用户初次看到的是「Bridgent AI」，`import { ... } from '@bridgent/core'` 与二进制命令 `bridgent` 保持不变。CLI npm 包名后来由 ADR-027 修正为 `@bridgent/cli`。
- **状态**：✅ Superseded for CLI package name by ADR-027（2026-06-06）

## ADR-027 — CLI npm 包名改为 `@bridgent/cli`，binary 仍为 `bridgent`

- **决策**：CLI 发布包名使用 `@bridgent/cli`，与其他 publishable 包同 scope；安装后暴露的 binary 仍是 `bridgent`。
- **上下文**：alpha 阶段实际发布配置、README badge、release checklist、host-test workspace 依赖已经切到 `@bridgent/cli`。继续保留无 scope `bridgent` 作为包名会让 changesets linked、npm provenance、release checklist 与实际 package.json 分叉。
- **后果**：安装文档统一写 `pnpm add -D @bridgent/cli @bridgent/core zod` 或 `pnpm dlx @bridgent/cli ...`；host 配置仍写 `"command": "bridgent"`。旧 proposal 中的 `npx bridgent` 是历史目标，不再作为 v0.1 alpha 的发布要求。
- **状态**：✅ Accepted（2026-06-07）

## ADR-025 — changesets `linked` 同步版本号

- **决策**：5 个 publishable 包（`@bridgent/cli`、`@bridgent/core`、`@bridgent/source-openapi`、`@bridgent/source-prisma`、`@bridgent/source-drizzle`）用 changesets `linked`，alpha 阶段保持版本号同步。
- **上下文**：用户记不住 `@bridgent/cli@0.2 + @bridgent/core@0.1.5 + @bridgent/source-prisma@0.0.7` 这种零碎组合；alpha 阶段「全套同版本」是显著降低 onboarding 摩擦的姿势。
- **后果**：任意一个包的 minor 改动会带动其他 3 个一起 bump；早期改动密集时会出现"空 bump"，可接受。v0.5+ 用户量起来后再 unlink。
- **状态**：✅ Superseded by ADR-032（2026-06-09）；CLI 包名由 ADR-027 更新

## ADR-026 — 发布渠道文案中英双语并行

- **决策**：`docs/launch/` 5 篇文案分两类语言：HN / Product Hunt / Twitter 走英文（国际开发者主战场），V2EX / 知乎 走中文（国内 AI Agent / Claude Code 生态）。
- **上下文**：选题阶段的「先发优势」数据采样里中文社区命中度显著高（V2EX、知乎、掘金对 MCP 主题已有持续讨论）；放弃中文渠道等于放弃一半潜在用户。两套文案分别对应渠道读者预期，不做硬翻译。
- **后果**：维护成本翻倍但 ROI 正；每次大版本发布需更新两组文案。
- **状态**：✅ Accepted（2026-06-06）

## ADR-021 — WebStandard transport：纯 Web Handler，运行时无关

- **决策**：`createWebHandler` 基于 SDK 1.29 `WebStandardStreamableHTTPServerTransport`，返回 `(request: Request) => Promise<Response>` 形态的 fetch handler；Node-HTTP adapter 用 ~25 行 `Readable.toWeb / fromWeb` 自写，**不依赖** `@hono/node-server`、cors、koa 等。
- **上下文**：Cloudflare Workers / Deno / Bun / Vercel Edge / Hono 都期望 fetch handler；提供这个层让 Bridgent 不再绑死 Node `http.Server`，为 Plan 6+ 的 Cloud 版预热。
- **后果**：Node 22.18+ 提供原生 `Request`/`Response`/`Readable.toWeb` — 路径稳；旧版 Node 装不上（与 ADR-006 已对齐）。
- **状态**：✅ Accepted（2026-06-06）

## ADR-022 — 跨宿主验证 = 协议层 harness + 配置文档（不做 GUI 自动化）

- **决策**：用 private 包 `@bridgent/host-test`，跑 SDK 自家 `Client` + `StdioClientTransport` / `StreamableHTTPClientTransport` / Web fetch 三种 transport 的 vitest e2e；正确性等价于"任何 1.x 客户端"。**不做** Claude Code / Cursor / Codex / Gemini CLI 的 GUI 自动化。
- **上下文**：GUI 自动化在 CI 不可行（需要图形 + 真账号）+ 维护成本极高；MCP 协议 1.x 是 spec，符合 spec 的 server 任何宿主都能消费 — 协议层 harness 是更高 ROI 的回归方式。
- **后果**：发布前 `pnpm --filter @bridgent/host-test test` 是必跑步骤；如未来 spec 升级 1.x → 2.x，host-test 跟着升 SDK 即可。
- **状态**：✅ Accepted（2026-06-06）

## ADR-023 — 4 个 host 的配置文档放 `apps/docs/guide/hosts/`，README 仅留 hero

- **决策**：Claude Code / Cursor / Codex / Gemini CLI 各自的 mcp.json 片段进 VitePress sidebar "Hosts" 一级分组；README 只放 demo GIF placeholder + 4 个跳转链接。
- **上下文**：每个 host 的 schema / 路径 / 故障点不同，塞进 README 会让首页超长；放文档站 sidebar 既能 SEO 又能用 search 检索。
- **后果**：用户 onboarding 路径变成「README → Hosts 文档」两跳；可接受。
- **状态**：✅ Accepted（2026-06-06）

## ADR-018 — HTTP transport 用 SDK 内置 `StreamableHTTPServerTransport`

- **决策**：`createHttpServer` 基于 SDK 1.29 内置 `StreamableHTTPServerTransport`，**不引入 express / hono / fastify**；底层用 Node `http.createServer`。
- **上下文**：MCP 1.x 官方推荐 transport 是 Streamable HTTP（自带 SSE chunked 流）；额外 web framework 会膨胀依赖矩阵 + 与 ADR-003/004 最小依赖不一致。Auth / rate limit / TLS 由 user 通过 reverse proxy 处理。
- **后果**：用户要 mount middleware（cors/auth/logging）需要自己拿 `handle.raw` 直接挂；这是 trade-off。
- **状态**：✅ Accepted（2026-06-05）

## ADR-019 — HTTP server 默认安全姿态：stateful + 127.0.0.1 + 3333/`/mcp`

- **决策**：`createHttpServer` 默认 `stateful: true` / `host: '127.0.0.1'` / `port: 3333` / `path: '/mcp'`。
- **上下文**：与 SDK 默认 / 官方 inspector / Claude Code 默认对齐；loopback bind 防止意外暴露；3333 与常见 dev 端口（3000/4000/5000/8080）冲突最小；`/mcp` 与 MCP 社区习惯路径一致。
- **后果**：要远端访问需显式 `host: '0.0.0.0'` —— 这是有意为之。
- **状态**：✅ Accepted（2026-06-05）

## ADR-020 — `bridgent inspect` 是官方 MCP Inspector 的薄包装

- **决策**：v0.1 的 `bridgent inspect <file>` = `pnpm dlx @modelcontextprotocol/inspector + node strip-types <file>`，不重写 web UI。
- **上下文**：官方 inspector 已经覆盖 80% 调试场景（schema 表单、tool 调用、trace）；自写一个完整 web UI 是 2-3 天工作量但产品价值低。Bridgent 自家 inspector（带 source-grouping / auth 提示 / Prisma trace）留给 Plan 7+ 当差异化卖点。
- **后果**：用户机器需要 `pnpm` 或 `npx`；`pickLauncher` 自动嗅探。
- **状态**：✅ Accepted（2026-06-05）

## ADR-001 — TypeScript-first，Python 二期

- **决策**：v0.1 仅 TypeScript SDK / CLI；Python 留给二期，通过 node-bridge 或独立实现暴露同等能力。
- **上下文**：MCP SDK、OpenAPI 解析、Zod、tRPC 生态都集中在 TS。CLI/agent harness 类目里 TS 也已是事实标准。
- **后果**：放弃部分 ML 工程师早期市场，但换来更快的发布速度和更窄的兼容矩阵。
- **状态**：✅ Accepted（2026-06-04）

## ADR-002 — pnpm workspaces + Turborepo（不是 Nx，不是裸 pnpm）

- **决策**：用 pnpm 10 workspaces 管 deps，Turborepo 2.9 编排任务图。
- **上下文**：Nx 偏重，TS-first 项目里非首选；裸 pnpm 缺缓存与拓扑感知。Turborepo 的 `^build` 拓扑 + 远程缓存能力对 monorepo 增长曲线友好。
- **后果**：多一份 `turbo.json` 配置；CI 上需要缓存 `.turbo` 目录。
- **状态**：✅ Accepted（2026-06-04）

## ADR-003 — tsdown ESM-only

- **决策**：所有 lib 包用 tsdown 0.22 打包，**仅输出 ESM**，不出 CJS。
- **上下文**：MCP SDK 自身 ESM-first，下游全是 ESM 应用；同时输出 dual package 易触发 hazard。tsdown 比 tsup 更快、原生 dts。
- **后果**：旧 CJS 用户无法直接 require；如有诉求再开 `@bridgent/core-cjs` 子包，不污染 main。
- **状态**：✅ Accepted（2026-06-04）

## ADR-004 — `@modelcontextprotocol/sdk` 不被 bundle

- **决策**：tsdown 配置中将 `@modelcontextprotocol/sdk` 全路径加入 `external`。
- **上下文**：SDK 直接依赖 hono / express / cors / ajv / jose 等，bundle 进 dist 会导致包体积爆炸且失去 peer 升级灵活性。
- **后果**：`@bridgent/core` 把 SDK 列在 `dependencies`，`zod` 列在 `peerDependencies`。
- **状态**：✅ Accepted（2026-06-04）

## ADR-005 — 不启用 TypeScript project references

- **决策**：跨包不用 `composite: true` + `references`，只用 `tsconfig.base.json` 继承。
- **上下文**：tsdown 自带 dts 输出；project references 的 outDir/rootDir 强约束会与 bundle 模式打架；turbo 拓扑 + 缓存已能拿到 90% 收益。
- **后果**：`typecheck` 任务依赖 `^build`（消费上游 dts），开发期需先 build 一次 core 才能 typecheck cli/example；为日常 watch 体验留 `pnpm dev` 的伴生 build。
- **状态**：✅ Accepted（2026-06-04）

## ADR-006 — Node 引擎 ≥ 22.18

- **决策**：`engines.node = >=22.18.0`，`.npmrc` 设 `engines-strict=true`。
- **上下文**：tsdown 0.22 强制 `^22.18 || >=24`；`bridgent dev <file>.ts` 走 Node 原生 `--experimental-strip-types` 而不是 tsx 子进程，省一份依赖。
- **后果**：低于 22.18 的开发者 install 阶段直接报错——README 显著标注。
- **状态**：✅ Accepted（2026-06-04）；若 strip-types 在 ESM + workspace link 场景不稳，回退方案：把 `tsx` 加进 CLI deps 走子进程。

## ADR-007 — 包命名：`@bridgent/*` lib + `bridgent` CLI（无 scope）

- **决策**：所有 lib 用 scoped 名（`@bridgent/core`, 后续 `@bridgent/source-openapi` 等）；CLI 入口用无 scope 的 `bridgent`，方便 `npx bridgent` / `pnpm dlx bridgent`。
- **上下文**：用户敲命令的频率远高于 require lib，CLI 名要短。
- **后果**：需要在 npm 上抢注 `bridgent` 顶级名（**待办**：Day 0 Pre-flight）。
- **状态**：✅ Superseded by ADR-027（2026-06-07）

## ADR-009 — OpenAPI parser = `@scalar/openapi-parser`

- **决策**：source-openapi 用 `@scalar/openapi-parser@^0.28`。
- **上下文**：ESM-only、TS 原生、自带 3.0→3.1 upgrader、自带 dereference 和 load 插件（`fetchUrls` / `readFiles`）；体积比 `@redocly/openapi-core` 小，与 ADR-003 ESM-only 对齐。`@apidevtools/swagger-parser` 是 CJS-first，被排除。
- **后果**：peer 依赖 `ajv@^8` 和 `yaml@^2` 进 `node_modules`；不显著增加产物体积（external 不打包）。
- **状态**：✅ Accepted（2026-06-04）

## ADR-010 — JSON Schema → Zod 自写 narrow converter

- **决策**：在 source-openapi 内部自写 ~150 行的 JSON Schema → Zod 转换器，**不引入** `json-schema-to-zod` npm 包。
- **上下文**：`json-schema-to-zod` 本质是 codegen（输出 Zod 源码字符串），运行时跑要 `eval` 或 `new Function`，不干净、调试困难。OpenAPI 的 schema 子集很窄（object / array / string / number / boolean / enum / const / oneOf / anyOf / allOf / nullable / format），自写易读易调试。
- **后果**：`discriminator` 暂用 `z.union` fallback；多类型 union（如 `type: ['string','number']`）只取第一种类型。这是已知 trade-off，写进 README。
- **状态**：✅ Accepted（2026-06-04）

## ADR-011 — OpenAPI source 默认 read-only

- **决策**：`fromOpenApi()` 默认仅暴露 `GET` / `HEAD`；写操作（POST/PUT/PATCH/DELETE）需显式 `allow: { mutating: true }` 或 `allowOperations` 白名单。
- **上下文**：LLM agent 误操作风险高（"删除 issue 1" 可能被误解为"删除所有 issue"）；安全 by default 是 Bridgent 的产品差异点之一。OPTIONS / TRACE 永不暴露。
- **后果**：用户首次跑通 GitHub example 时只能查、不能写——但这正是我们想要的 onboarding 姿势。
- **状态**：✅ Accepted（2026-06-04）

## ADR-012 — OpenAPI source 用 Node 原生 fetch + 结构化错误

- **决策**：HTTP 调用走 Node 22.18+ 原生 `fetch`，4xx/5xx **不 throw**，而是返回 `{ ok, status, statusText, body, headers }` 结构喂给 LLM。
- **上下文**：throw 会让 MCP server 进程 fatal，LLM 失去恢复机会；结构化返回让 LLM 看到错误状态码和响应体，自行决定下一步（重试 / 改参数 / 放弃）。
- **后果**：用户必须自己判断 `result.ok`；这写进了 README 的 "Errors" 节。Streaming 响应（SSE / chunked）暂不支持，后续 Plan 处理。
- **状态**：✅ Accepted（2026-06-04）

## ADR-013 — Vendor extension 命名空间 `x-bridgent-*`

- **决策**：所有 Bridgent 特有的 OpenAPI extension 用 `x-bridgent-*` 前缀（首先是 `x-bridgent-allow`）。
- **上下文**：`x-mcp-*` 命名空间太通用，未来可能与其它 MCP 周边工具冲突；`x-bridgent-*` 品牌专属、无冲突风险。
- **后果**：用户在 spec 里要写 `x-bridgent-allow: false` 而不是 `x-mcp-allow: false`。
- **状态**：✅ Accepted（2026-06-04）

## ADR-014 — Prisma 锁 6.19.x，不支持 7.x

- **决策**：`@bridgent/source-prisma` peerDependency `@prisma/client: ^6.19.0`，**不支持 Prisma 7.x**。
- **上下文**：Prisma 7 重构了 datasource 层（url 从 schema.prisma 移除，必须走 `prisma.config.ts` + `new PrismaClient({ adapter })`）—— 是 breaking change，example 复杂度大幅上升。生产环境主流仍是 6.x。`Prisma.dmmf.datamodel.models[]` 在 6.19.3 实测稳定。
- **后果**：用户用 7.x 装不上；在 README 显著标注。等 7.x 普及后单独发 v0.2 跟进。
- **状态**：✅ Accepted（2026-06-04）

## ADR-015 — v0.1 仅 5 个只读方法

- **决策**：`fromPrisma` v0.1 只暴露 `findUnique` / `findFirst` / `findMany` / `count` / `aggregate`；`groupBy` / `include` / 写操作（create/update/delete/upsert）推迟到 v0.2。
- **上下文**：groupBy 的 `by` + `having` 组合 schema 在 LLM 视角下复杂度高、易翻车；`include` 引入无限嵌套和大查询风险。先把 80% 数据查询场景跑稳，再扩。写操作需要 audit log + dry-run 工具支持，工作量大。
- **后果**：v0.1 的护栏简单清晰；写操作 `allow.mutating: true` 暂为 no-op，文档明确写。v0.2.2 已由 ADR-028/029/030 更新为显式 `writes` 配置 + preview token + audit fail-closed。
- **状态**：✅ Superseded for writes by ADR-028/029/030（2026-06-08）

## ADR-016 — 三件套护栏：LIMIT clamp + soft timeout + raw SQL 永久禁用

- **决策**：
  1. `findMany.take` 默认 10000，超出 hard-clamp 到 `maxTake` 并在 `meta.warning` 提示
  2. 每个 query 走 `Promise.race([call, sleep])` 的 soft timeout（默认 10000ms），超时返回 `{ ok: false, error: { kind: 'timeout' } }`
  3. `findRaw` / `aggregateRaw` / `$queryRaw` / `$executeRaw` **永久不暴露**
- **上下文**：LLM agent 误操作风险在数据库场景比 API 场景高一个数量级（一次 `delete` 比一次 GET 严重）。这三条是 Bridgent 在数据团队场景的安全基线。
- **后果**：soft timeout 不取消底层 query（连接池占用直到自然结束），文档明确告知用户；这是 trade-off。
- **状态**：✅ Accepted（2026-06-04）

## ADR-017 — Bytes 排除 + DateTime/BigInt/Decimal 字符串透传

- **决策**：
  - DMMF field 的 `type === 'Bytes'` 在 where / select / orderBy 派生时直接过滤掉
  - DateTime input 使用 ISO 8601 字符串（Prisma 自动转 Date）
  - BigInt / Decimal input 使用字符串（避免 `JSON.stringify` 抛 "Do not know how to serialize a BigInt"）
- **上下文**：让 LLM 拉一张图片字段会在 context 里塞几 MB base64；ISO 字符串是 LLM 友好且 Prisma 接受的输入格式；BigInt/Decimal 的 JSON 序列化问题是已知坑。
- **后果**：用户可以用 `excludeFieldTypes` 选项扩展屏蔽列表（默认 `['Bytes']`）。
- **状态**：✅ Accepted（2026-06-04）

## ADR-008 — Zod v4

- **决策**：catalog 锁 `zod ^4.4.3`，作为 `@bridgent/core` 的 peer。
- **上下文**：MCP SDK 1.29 同时兼容 v3.25+ 和 v4；v4 是 TS 生态当前主流；v4 的 `.shape` 与 v3 略有差异，已验证 `registerTool(name, { inputSchema: zodObject.shape }, cb)` 在 v4 下 work。
- **后果**：用 v3 的下游需自行 pin。
- **状态**：✅ Accepted（2026-06-04）

---

## 待实测 / 风险（进仓后立即验证）

| # | 项 | 验证方法 | 状态 |
|---|---|---|---|
| R1 | MCP SDK 1.29 子路径 `/server/mcp.js` `/server/stdio.js` 可 import | 已在 `/tmp/mcp-probe` 实测 ✅ | 已闭环 |
| R2 | `McpServer.registerTool` 签名（1.29 推荐 API） | 已查 dts ✅ | 已闭环 |
| R3 | Zod v4 `.shape` 行为 | `pnpm --filter @bridgent/core test` smoke | ✅ 通过（zod-to-json-schema 输出 draft-07 schema 正确） |
| R4 | Node 22.18 `--experimental-strip-types` 在 workspace link 下加载 `@bridgent/core` | stdio JSON-RPC 联通性手测 | ✅ `initialize`/`tools/list`/`tools/call` 全过 |
| R5 | tsdown 0.22 是否给 `bin` 产物自动 +x | tsdown 自动 grant + 不需要 chmod 兜底 | ✅ 已确认，已删 chmod |
| R6 | catalog 协议在 pnpm 10 + workspace 中正常 resolve | `pnpm install` 后 `node_modules/.pnpm` 链路检查 | ✅ 通过 |
| R7 | 弱网下 rolldown 平台 binding optional dep 跳过 | 临时把 `@rolldown/binding-darwin-arm64` 写进 root devDeps 兜底 | 🟡 待替换为 pnpm `supportedArchitectures` |
| R8 | vitest 4 + vitepress 1.x 的 vite peer 冲突 | 降 vitest 到 `^3.2.6` | ✅ 已解 |
| R9 | `@scalar/openapi-parser` 0.28.5 的 `load`/`dereference` 实际 API | `/tmp/scalar-probe` 实测 ✅ | 已闭环 |
| R10 | GitHub spec 3.0 → 3.1 升级字段完整性 | example 02-github 跑通 + tools/list 抽查 | ⏳ 待手测 |
| R11 | discriminator 用 z.union fallback 在 LLM 调用时是否丢失类型选择 | 真实 spec 命中时观察 | ⏳ 待手测 |
