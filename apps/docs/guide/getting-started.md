# Getting Started

::: warning Prerequisites
- Node **≥ 22.18** (Bridgent uses native `--experimental-strip-types` to run TS without a build step)
- pnpm **≥ 10**
:::

## 1. Install

```bash
pnpm add -D @bridgent/cli @bridgent/core zod
```

## 2. Define your first tool

Create `server.ts`:

```ts
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
      run: ({ a, b }) => ({ sum: a + b }),
    }),
  ],
})
```

## 3. Run it

```bash
bridgent dev ./server.ts
```

That's it — your file is now an MCP server speaking stdio.

## 4. Try it from Claude Code

Add this to `~/.claude.json` (or your IDE-agent config):

```json
{
  "mcpServers": {
    "hello": {
      "command": "bridgent",
      "args": ["dev", "./server.ts"]
    }
  }
}
```

Restart Claude Code, and you'll see `add` show up in the tool picker.

## 5. Verify with the official inspector

```bash
pnpm dlx @modelcontextprotocol/inspector bridgent dev ./server.ts
```

The inspector lets you list tools, send `tools/call`, and inspect results without an LLM in the loop.

## Next steps

- Browse [examples](https://github.com/js-mark/bridgent/tree/main/examples)
- Roadmap: OpenAPI / Prisma / Drizzle / tRPC sources, HTTP transport, policy DSL
