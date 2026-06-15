# From tRPC

Expose tRPC router procedures as MCP tools without rewriting them as hand-written Zod tools.

## Quick start

```ts
import { createStdioServer } from '@bridgent/core'
import { fromTrpc } from '@bridgent/source-trpc'
import { appRouter } from './router'

await createStdioServer({
  name: 'trpc-app',
  version: '0.0.1',
  tools: fromTrpc({
    router: appRouter,
    createContext: () => ({ userId: 'demo-user' }),
  }),
})
```

## What gets exposed

- `query` procedures become read tools by default.
- `mutation` procedures are hidden by default.
- `subscription` procedures are not exposed.

Procedure path `user.getById` becomes tool name `trpc_user_getById`. Set `toolPrefix` to replace the default prefix:

```ts
fromTrpc({
  router: appRouter,
  toolPrefix: 'app',
})
```

This produces names such as `app_user_getById`.

## Mutation opt-in

Mutations require both a broad safety switch and a final tool-name allowlist:

```ts
fromTrpc({
  router: appRouter,
  allow: {
    mutating: true,
    tools: ['trpc_user_updateName'],
  },
})
```

The allowlist uses final generated tool names, matching Prisma write-tool allowlists.

## Input schemas

Bridgent maps Zod v4 object inputs to MCP input schemas. Procedures without input get an empty strict object schema.

Unsupported or opaque parser shapes fail during tool generation. This is intentional: Bridgent does not generate permissive `any` tool inputs.

## Options

| Option | Purpose |
|---|---|
| `router` | tRPC v10/v11 router object |
| `createContext` | Sync or async context factory called per tool invocation |
| `toolPrefix` | Generated tool-name prefix. Default: `trpc` |
| `procedureFilter` | RegExp or function filter for procedure paths |
| `allow.mutating` | Required before exposing mutation procedures |
| `allow.tools` | Final generated mutation tool names to expose |
