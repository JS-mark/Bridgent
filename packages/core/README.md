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
      metadata: {
        source: { kind: 'zod', reference: 'add' },
        capability: 'read',
      },
      run: ({ a, b }) => a + b,
    }),
  ],
})
```

`metadata` is optional and additive. Transports keep the same MCP behavior, while the CLI can use metadata for inspect-time hints.

See [Bridgent docs](https://github.com/js-mark/bridgent) for full guide.
