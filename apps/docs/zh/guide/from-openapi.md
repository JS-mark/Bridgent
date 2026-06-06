# 从 OpenAPI 接入

拿任何 **OpenAPI 3.x** 规范,一次调用就把它变成一个 Bridgent MCP 服务器。

## 快速开始

```ts
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
  }),
})
```

## 规范来源

`spec` 接受:

- **URL**(以 `http://` 或 `https://` 开头的字符串):`'https://api.example.com/openapi.json'`
- **本地文件路径**(字符串):`'./openapi.yaml'`
- **内联对象**:已解析的 OpenAPI 文档(`Record<string, unknown>`)
- **原始字符串**:YAML 或 JSON 文本

完整的 TypeScript 类型是 `string | Record<string, unknown>`。

OpenAPI **3.0** 规范在生成工具前会被 [`@scalar/openapi-parser`](https://github.com/scalar/scalar) 自动升级到 3.1。

## 默认只读

Bridgent **只暴露安全的 HTTP 方法**(`GET`、`HEAD`),除非你显式开启:

```ts
await fromOpenApi({
  spec: '…',
  allow: { mutating: true }, // enables POST/PUT/PATCH/DELETE
})
```

如需更细粒度的控制,推荐用 `operationId` 显式列白名单:

```ts
await fromOpenApi({
  spec: '…',
  allowOperations: ['createIssue', 'addComment'],
})
```

## 过滤管道

每个 operation 按顺序通过以下闸门。这条管道位于 `packages/source-openapi/src/filter.ts`。

| 步骤 | 检查 | 默认值 |
|---|---|---|
| 1 | 方法在 `allow.methods` 中 | `['GET','HEAD']` |
| 2 | `pathFilter(path)` 通过 | (无过滤) |
| 3 | `op['x-bridgent-allow']` ≠ `false` | 默认生效 |
| 4 | 不在 `denyOperations` 中 | 空 |
| 5 | 若 `allowOperations` 非空,则必须在其中 | 空 |

用 `respectExtensions: false` 可以忽略规范中的 `x-bridgent-allow`。

## 鉴权

v0.1 仅支持 **Bearer** 鉴权。可以传一个静态 token,也可以传一个用于动态刷新的 thunk:

```ts
await fromOpenApi({
  spec: '…',
  auth: { type: 'bearer', token: () => fetchFreshToken() },
})
```

OAuth2 / 任意 header 中的 API key / OAuth2 PKCE 会在后续版本到来。

## 错误

4xx / 5xx 响应**不会**被抛出 —— 它们以结构化负载的形式回来,LLM 可以据此采取行动:

```json
{
  "ok": false,
  "status": 401,
  "statusText": "Unauthorized",
  "body": { "message": "Bad credentials" }
}
```

这样 MCP 服务器能在上游故障期间存活,同时也给模型足够的信息去自我纠正。

## 工具名策略

- 优先使用 `operationId`(slug 化,截断到 64 字符,以兼容所有宿主)
- 回退:`${method}_${pathWithoutBraces}`(例如 `GET /users/{id}` → `get_users_id`)
- 当多个数据源拼到一起时,推荐加 `namespace` 前缀(例如 `gh_`)
- 重名会触发 fail-fast 错误,并提示设置 `namespace`
