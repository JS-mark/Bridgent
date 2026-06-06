import process from 'node:process'
import { createHttpServer, defineTool } from '@bridgent/core'
import { z } from 'zod'

// eslint-disable-next-line antfu/no-top-level-await
const handle = await createHttpServer({
  name: 'hello-http',
  version: '0.0.1',
  tools: [
    defineTool({
      name: 'add',
      description: 'Add two numbers',
      inputSchema: z.object({ a: z.number(), b: z.number() }),
      run: ({ a, b }) => ({ sum: a + b }),
    }),
    defineTool({
      name: 'echo',
      description: 'Echo a message back',
      inputSchema: z.object({ message: z.string() }),
      run: ({ message }) => message,
    }),
  ],
})

console.error(`MCP HTTP server listening at ${handle.url}`)

const shutdown = async (): Promise<void> => {
  console.error('Shutting down…')
  await handle.close()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
