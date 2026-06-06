import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { defineTool } from '../src/define-tool'

describe('defineTool', () => {
  it('returns the tool unchanged with strong inference', () => {
    const tool = defineTool({
      name: 'add',
      description: 'Add two numbers',
      inputSchema: z.object({ a: z.number(), b: z.number() }),
      run: ({ a, b }) => a + b,
    })

    expect(tool.name).toBe('add')
    expect(tool.description).toBe('Add two numbers')
    expect(tool.run({ a: 2, b: 3 })).toBe(5)
  })

  it('supports async run handlers', async () => {
    const tool = defineTool({
      name: 'echo',
      inputSchema: z.object({ msg: z.string() }),
      run: async ({ msg }) => msg.toUpperCase(),
    })

    await expect(tool.run({ msg: 'hi' })).resolves.toBe('HI')
  })
})

describe('mcp sdk surface', () => {
  it('exposes McpServer and StdioServerTransport', async () => {
    const mcp = await import('@modelcontextprotocol/sdk/server/mcp')
    const stdio = await import('@modelcontextprotocol/sdk/server/stdio')
    expect(mcp.McpServer).toBeTypeOf('function')
    expect(stdio.StdioServerTransport).toBeTypeOf('function')
  })
})
