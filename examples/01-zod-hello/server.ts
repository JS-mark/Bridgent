import { createStdioServer, defineTool } from '@bridgent/core'
import { z } from 'zod'

// eslint-disable-next-line antfu/no-top-level-await
await createStdioServer({
  name: 'hello',
  version: '0.0.1',
  tools: [
    defineTool({
      name: 'add',
      description: 'Add two numbers',
      inputSchema: z.object({
        a: z.number().describe('First operand'),
        b: z.number().describe('Second operand'),
      }),
      run: ({ a, b }) => ({ sum: a + b }),
    }),
    defineTool({
      name: 'echo',
      description: 'Echo a message back',
      inputSchema: z.object({
        message: z.string().describe('The message to echo'),
      }),
      run: ({ message }) => message,
    }),
  ],
})
