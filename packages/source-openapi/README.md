# @bridgent/source-openapi

> Turn any OpenAPI 3.x spec into a set of MCP tools.

## Quick start

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

## Default safety posture

By default Bridgent only exposes **read-only** operations (`GET`, `HEAD`).
To allow writes, opt in:

```ts
await fromOpenApi({
  spec: '…',
  allow: { mutating: true },
  // …or whitelist by operationId
  allowOperations: ['createIssue', 'updateLabel'],
})
```

## Filter pipeline

Each operation in the spec runs through this gate (top to bottom):

1. **Method**: must be in `allow.methods` (default `['GET','HEAD']`)
2. **`pathFilter`**: regex or `(path) => boolean`
3. **Vendor extension**: drops if `x-bridgent-allow: false` (and `respectExtensions` is true, which is default)
4. **`denyOperations`**: drops by `operationId`
5. **`allowOperations`**: when non-empty, **only** these `operationId`s pass

## Auth

v0.1 supports **Bearer** only. Pass a static string, or a thunk for dynamic refresh:

```ts
await fromOpenApi({
  spec: '…',
  auth: { type: 'bearer', token: () => fetchFreshToken() },
})
```

## Errors

4xx / 5xx are **not** thrown — they come back as a structured payload that LLMs can act on:

```json
{ "ok": false, "status": 401, "body": { "message": "Bad credentials" } }
```

This avoids killing the MCP server when the upstream API rejects a single call.
