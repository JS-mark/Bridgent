# @bridgent/source-trpc

> Expose tRPC routers as MCP tools.

## Quick start

```ts
import { createStdioServer } from '@bridgent/core'
import { fromTrpc } from '@bridgent/source-trpc'
import { appRouter } from './router'

await createStdioServer({
  name: 'app',
  version: '0.0.1',
  tools: fromTrpc({
    router: appRouter,
    createContext: () => ({ userId: 'demo' }),
  }),
})
```

## Safety posture

Queries are exposed by default. Mutations and subscriptions are not.

To expose a mutation, opt in explicitly and allowlist the final generated tool name:

```ts
fromTrpc({
  router: appRouter,
  allow: {
    mutating: true,
    tools: ['trpc_user_updateName'],
  },
})
```

Subscriptions are intentionally out of scope because MCP tool calls are request/response.

## Options

| Option | Purpose |
|---|---|
| `router` | tRPC v10/v11 router object with `createCaller()` |
| `createContext` | Sync or async context factory called per tool invocation |
| `toolPrefix` | Prefix for generated tool names. Default: `trpc` |
| `procedureFilter` | RegExp or function filter for procedure paths |
| `allow.mutating` | Required before any mutation can be exposed |
| `allow.tools` | Final generated mutation tool names to expose |

Generated tool names use `<toolPrefix>_<procedure_path>`, for example `trpc_user_getById`.

Only Zod v4 object inputs can be exposed as MCP tool schemas. Procedures without input become an empty strict object schema. Unsupported parser shapes fail during tool generation instead of falling back to permissive `any`.
