import type { AddressInfo } from 'node:net'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createHttpServer, defineTool } from '../src'

let cleanup: (() => Promise<void>) | undefined

afterEach(async () => {
  if (cleanup) {
    await cleanup()
    cleanup = undefined
  }
})

describe('createHttpServer', () => {
  it('serves tools over Streamable HTTP', async () => {
    const handle = await createHttpServer({
      name: 'http-test',
      version: '0.0.1',
      port: 0, // ephemeral
      tools: [
        defineTool({
          name: 'add',
          description: 'Add two numbers',
          inputSchema: z.object({ a: z.number(), b: z.number() }),
          run: ({ a, b }) => a + b,
        }),
      ],
    })
    cleanup = handle.close

    const port = (handle.raw.address() as AddressInfo).port
    const url = `http://127.0.0.1:${port}/mcp`

    // 1) initialize
    const init = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'vitest', version: '0.0.1' },
        },
      }),
    })

    expect(init.status).toBe(200)
    const sessionId = init.headers.get('mcp-session-id')
    expect(sessionId).toBeTruthy()

    // 2) tools/list with the session header
    const list = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Mcp-Session-Id': sessionId!,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {},
      }),
    })

    expect(list.status).toBe(200)
    const text = await list.text()
    expect(text).toMatch(/"name":\s*"add"/)
  }, 15_000)

  it('returns 404 for non-MCP paths', async () => {
    const handle = await createHttpServer({
      name: 'http-test',
      version: '0.0.1',
      port: 0,
      tools: [],
    })
    cleanup = handle.close

    const port = (handle.raw.address() as AddressInfo).port
    const res = await fetch(`http://127.0.0.1:${port}/some-other-path`)
    expect(res.status).toBe(404)
  })
})
