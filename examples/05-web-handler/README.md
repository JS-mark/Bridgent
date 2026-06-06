# 05-web-handler

把 `createWebHandler` 包成 fetch handler，再用 ~25 行 Node `http` adapter 暴露成本地 HTTP 服务 — 同样的 handler 可以**原样**贴进 Cloudflare Workers / Deno / Bun / Hono / Vercel Edge。

## Run on Node

```bash
pnpm install
pnpm --filter @bridgent-examples/05-web-handler start
# → Web-handler MCP server listening at http://127.0.0.1:3334/mcp
```

## Drop into Cloudflare Workers

```ts
import { createWebHandler, defineTool } from '@bridgent/core'
import { z } from 'zod'

const handler = await createWebHandler({
  name: 'hello-web',
  version: '0.0.1',
  tools: [/* ... */],
})

export default {
  fetch(request: Request): Promise<Response> {
    return handler.fetch(request)
  },
}
```

## Drop into Deno

```ts
Deno.serve(req => handler.fetch(req))
```

## Drop into Bun

```ts
Bun.serve({ fetch: req => handler.fetch(req), port: 3334 })
```
