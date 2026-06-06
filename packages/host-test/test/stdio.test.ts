import { fileURLToPath } from 'node:url'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { describe, expect, it } from 'vitest'

const FIXTURE = fileURLToPath(new URL('./fixtures/stdio-server.ts', import.meta.url))

describe('host-test stdio', () => {
  it('any 1.x client can list + call tools over stdio', async () => {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [
        '--experimental-strip-types',
        '--no-warnings=ExperimentalWarning',
        FIXTURE,
      ],
    })
    const client = new Client({ name: 'host-test', version: '0.0.1' }, { capabilities: {} })

    try {
      await client.connect(transport)
      const list = await client.listTools()
      const names = list.tools.map(t => t.name).sort()
      expect(names).toEqual(['add', 'echo'])

      const result = await client.callTool({
        name: 'add',
        arguments: { a: 2, b: 3 },
      }) as { content: { type: string, text: string }[] }
      expect(result.content[0]?.text).toBe('5')
    }
    finally {
      await client.close().catch(() => {})
    }
  })
})
