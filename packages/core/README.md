# @bridgent/core

> Bridgent core runtime — Zod tool definition + MCP stdio server.

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
      inputSchema: z.object({ a: z.number(), b: z.number() }),
      run: ({ a, b }) => a + b,
    }),
  ],
})
```

See [Bridgent docs](https://github.com/js-mark/bridgent) for full guide.
