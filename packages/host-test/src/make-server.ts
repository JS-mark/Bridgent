import type { BridgentTool } from '@bridgent/core'
import { defineTool } from '@bridgent/core'
import { z } from 'zod'

/** A tiny tool list reused across all transport tests. */
export function makeHelloTools(): BridgentTool<any, any>[] {
  return [
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
  ]
}
