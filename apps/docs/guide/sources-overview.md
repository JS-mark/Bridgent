# Sources Overview

Bridgent normalizes different shapes of "definitions you already have" into a single MCP tool surface. Pick the source that matches your codebase; the runtime (transport, CLI, hosts) is the same regardless.

## Capability matrix

| | **From Zod** | **From OpenAPI** | **From Prisma** | *From Drizzle* | *From tRPC* | *From GraphQL* |
|---|---|---|---|---|---|---|
| Status | shipped (`@bridgent/core`) | shipped (`@bridgent/source-openapi`) | shipped (`@bridgent/source-prisma`) | roadmap | roadmap | roadmap |
| Min code | `defineTool` per tool | `await fromOpenApi({ spec })` | `await fromPrisma({ client })` | — | — | — |
| Tools come from | each `defineTool` call | each operation in the spec | each model × 5 read methods | schema tables | router procedures | resolver fields |
| Naming | author-provided `name` | `operationId` (slugified) or `${method}_${path}` | `<namespace?><modelCamel>_<method>` | TBD | TBD | TBD |
| Filtering | not applicable | `allow` / `allowOperations` / `denyOperations` / `pathFilter` / `respectExtensions` | `allow` / `modelFilter` / `allowTools` / `denyTools` | TBD | TBD | TBD |
| Auth (v0.1) | author-provided in `run` | Bearer (static or thunk) | reuse PrismaClient's datasource creds | — | — | — |
| Read / Write | author-controlled | read-only by default; opt-in via `allow.mutating` | read-only 5-piece; `mutating: true` silently ignored in v0.1 | — | — | — |

## When to pick which

- **From Zod** — you already have a function and want to expose exactly that, with the precise input shape you want the LLM to see. Smallest possible surface.
- **From OpenAPI** — you have an HTTP API documented with a spec. Bridgent generates one tool per operation; you control which subset.
- **From Prisma** — you want the LLM to read a database safely. Default is read-only with row caps, soft timeouts, and `Bytes`-field stripping.

## Roadmap

- **From Drizzle** — same shape as Prisma: schema → read tools, with the same guardrails.
- **From tRPC** — one tool per procedure, fully typed, no schema rewrite.
- **From GraphQL** — operations and field-level resolvers as tools.

These are scoped for post-v0.1; track progress in [the GitHub repo](https://github.com/js-mark/bridgent).

## Mixing sources

A single Bridgent server can stitch tools from multiple sources together:

```ts
import { createStdioServer, defineTool } from '@bridgent/core'
import { fromOpenApi } from '@bridgent/source-openapi'
import { fromPrisma } from '@bridgent/source-prisma'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const client = new PrismaClient()

await createStdioServer({
  name: 'mixed',
  version: '0.0.1',
  tools: [
    ...await fromPrisma({ client, namespace: 'db_' }),
    ...await fromOpenApi({
      spec: 'https://api.example.com/openapi.json',
      namespace: 'api_',
    }),
    defineTool({
      name: 'echo',
      inputSchema: z.object({ msg: z.string() }),
      run: ({ msg }) => msg,
    }),
  ],
})
```

Use `namespace` on each generated batch to avoid name collisions; duplicates throw fail-fast at startup.
