import type { HttpServerHandle } from '@bridgent/core'
import type { AddressInfo } from 'node:net'
import { createHttpServer } from '@bridgent/core'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { afterEach, describe, expect, it } from 'vitest'
import { makeHelloTools } from '../src/make-server'

let server: HttpServerHandle | undefined

afterEach(async () => {
  if (server) {
    await server.close()
    server = undefined
  }
})

describe('host-test HTTP', () => {
  it('any 1.x client can list + call tools over Streamable HTTP', async () => {
    server = await createHttpServer({
      name: 'host-test-http',
      version: '0.0.1',
      port: 0,
      tools: makeHelloTools(),
    })

    const port = (server.raw.address() as AddressInfo).port
    const url = new URL(`http://127.0.0.1:${port}/mcp`)

    const transport = new StreamableHTTPClientTransport(url)
    const client = new Client({ name: 'host-test', version: '0.0.1' }, { capabilities: {} })

    try {
      await client.connect(transport)
      const list = await client.listTools()
      expect(list.tools.map(t => t.name).sort()).toEqual(['add', 'echo'])

      const result = await client.callTool({
        name: 'echo',
        arguments: { message: 'hello' },
      }) as { content: { type: string, text: string }[] }
      expect(result.content[0]?.text).toBe('hello')
    }
    finally {
      await client.close().catch(() => {})
    }
  })
})
