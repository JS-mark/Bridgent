# From OpenAPI

Take any **OpenAPI 3.x** spec and turn it into a Bridgent MCP server in one call.

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

## Spec sources

`spec` accepts:

- **URL** (string starting with `http://` or `https://`): `'https://api.example.com/openapi.json'`
- **Local file path** (string): `'./openapi.yaml'`
- **Inline object**: a parsed OpenAPI document (`Record<string, unknown>`)
- **Raw string**: YAML or JSON text

The full TypeScript type is `string | Record<string, unknown>`.

OpenAPI **3.0** specs are auto-upgraded to 3.1 by [`@scalar/openapi-parser`](https://github.com/scalar/scalar) before tool generation.

## Read-only by default

Bridgent **only exposes safe HTTP methods** (`GET`, `HEAD`) unless you opt in:

```ts
await fromOpenApi({
  spec: '…',
  allow: { mutating: true }, // enables POST/PUT/PATCH/DELETE
})
```

For finer control, prefer an explicit allowlist by `operationId`:

```ts
await fromOpenApi({
  spec: '…',
  allowOperations: ['createIssue', 'addComment'],
})
```

## Filter pipeline

Each operation runs through this gate, in order. The pipeline lives in `packages/source-openapi/src/filter.ts`.

| Step | Check | Default |
|---|---|---|
| 1 | Method is in `allow.methods` | `['GET','HEAD']` |
| 2 | `pathFilter(path)` passes | (no filter) |
| 3 | `op['x-bridgent-allow']` ≠ `false` | enforced |
| 4 | Not in `denyOperations` | empty |
| 5 | If `allowOperations` non-empty, must be in it | empty |

Use `respectExtensions: false` to ignore `x-bridgent-allow` on the spec.

## Auth

v0.1 supports **Bearer** auth only. Pass a static token or a thunk for dynamic refresh:

```ts
await fromOpenApi({
  spec: '…',
  auth: { type: 'bearer', token: () => fetchFreshToken() },
})
```

OAuth2 / API key in arbitrary headers / OAuth2 PKCE will arrive in a later release.

## Errors

4xx / 5xx responses are **not** thrown — they come back as a structured payload your LLM can act on:

```json
{
  "ok": false,
  "status": 401,
  "statusText": "Unauthorized",
  "body": { "message": "Bad credentials" }
}
```

This keeps the MCP server alive across upstream failures and gives the model enough info to course-correct.

## Tool name strategy

- Prefer `operationId` (slugified, capped at 64 chars to play nicely with all hosts)
- Fallback: `${method}_${pathWithoutBraces}` (e.g. `GET /users/{id}` → `get_users_id`)
- A `namespace` prefix (e.g. `gh_`) is recommended when stitching multiple sources together
- Duplicate names trigger a fail-fast error with a hint to set `namespace`
