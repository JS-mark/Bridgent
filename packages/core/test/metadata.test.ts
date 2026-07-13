import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { createInspectSummary, defineTool, registerTools } from '../src'

describe('tool metadata', () => {
  it('keeps metadata additive on defined tools', async () => {
    const tool = defineTool({
      name: 'user_get',
      description: 'Read a user',
      metadata: {
        source: { kind: 'zod', name: 'manual', reference: 'user.get' },
        capability: 'read',
        safety: { requiresAuthOrContext: true },
      },
      inputSchema: z.object({ id: z.string() }),
      run: ({ id }) => ({ id }),
    })

    expect(tool.metadata?.source.kind).toBe('zod')
    expect(tool.run({ id: 'u1' })).toEqual({ id: 'u1' })
  })

  it('does not forward Bridgent metadata into MCP registration options', async () => {
    const registerTool = vi.fn()
    const tool = defineTool({
      name: 'add',
      description: 'Add numbers',
      metadata: {
        source: { kind: 'zod', reference: 'add' },
        capability: 'read',
      },
      inputSchema: z.object({ a: z.number(), b: z.number() }),
      run: ({ a, b }) => a + b,
    })

    registerTools({ registerTool } as never, [tool])

    expect(registerTool).toHaveBeenCalledWith(
      'add',
      {
        description: 'Add numbers',
        inputSchema: tool.inputSchema.shape,
      },
      expect.any(Function),
    )
  })

  it('creates serializable inspect summaries', () => {
    const tool = defineTool({
      name: 'user_findMany',
      metadata: {
        source: { kind: 'prisma', reference: 'User.findMany' },
        capability: 'read',
        limits: { rowLimit: 100 },
      },
      inputSchema: z.object({}),
      run: () => [],
    })

    expect(createInspectSummary({ name: 'app', version: '1.0.0', tools: [tool] })).toEqual({
      name: 'app',
      version: '1.0.0',
      tools: [{
        name: 'user_findMany',
        description: undefined,
        metadata: tool.metadata,
      }],
    })
    expect(createInspectSummary(
      { name: 'app', version: '1.0.0', tools: [tool] },
      { kind: 'http', host: '0.0.0.0', port: 4444, path: '/api/mcp' },
    ).transport).toEqual({ kind: 'http', host: '0.0.0.0', port: 4444, path: '/api/mcp' })
  })
})
