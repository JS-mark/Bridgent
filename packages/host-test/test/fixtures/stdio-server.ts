import { createStdioServer, defineTool } from '@bridgent/core'
import { z } from 'zod'

// Standalone fixture — Node strip-types ESM resolver doesn't follow
// extension-less local imports, so we inline the hello tools here instead
// of importing from `../../src/make-server`.
// eslint-disable-next-line antfu/no-top-level-await
await createStdioServer({
  name: 'host-test-fixture',
  version: '0.0.1',
  tools: [
    defineTool({
      name: 'add',
      description: 'Add two numbers',
      inputSchema: z.object({ a: z.number(), b: z.number() }),
      run: ({ a, b }) => a + b,
    }),
    defineTool({
      name: 'echo',
      description: 'Echo a message back',
      inputSchema: z.object({ message: z.string() }),
      run: ({ message }) => message,
    }),
  ],
})
