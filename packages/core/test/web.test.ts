import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createWebHandler, defineTool } from '../src'

let cleanup: (() => Promise<void>) | undefined

afterEach(async () => {
  if (cleanup) {
    await cleanup()
    cleanup = undefined
  }
})

async function readSseFirstMessage(res: Response): Promise<unknown> {
  const text = await res.text()
  const dataLine = text.split('\n').find(line => line.startsWith('data:'))
  if (!dataLine)
    throw new Error(`No data: line in response\n${text}`)
  return JSON.parse(dataLine.slice(5).trim())
}

function initializeRequest(id: number): Request {
  return new Request('http://test.invalid/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'vitest', version: '0.0.1' },
      },
    }),
  })
}

function listToolsRequest(id: number, sessionId?: string): Request {
  return new Request('http://test.invalid/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      ...(sessionId ? { 'Mcp-Session-Id': sessionId } : {}),
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id,
      method: 'tools/list',
      params: {},
    }),
  })
}

describe('createWebHandler', () => {
  it('handles initialize → tools/list over Web Standard fetch', async () => {
    const handler = await createWebHandler({
      name: 'web-test',
      version: '0.0.1',
      tools: [
        defineTool({
          name: 'add',
          description: 'Add two numbers',
          inputSchema: z.object({ a: z.number(), b: z.number() }),
          run: ({ a, b }) => a + b,
        }),
      ],
    })
    cleanup = handler.close

    const initRes = await handler.fetch(initializeRequest(1))
    expect(initRes.status).toBe(200)
    const sessionId = initRes.headers.get('mcp-session-id')
    expect(sessionId).toBeTruthy()
    const initBody = await readSseFirstMessage(initRes) as { result: { serverInfo: { name: string } } }
    expect(initBody.result.serverInfo.name).toBe('web-test')

    const listRes = await handler.fetch(listToolsRequest(2, sessionId!))
    expect(listRes.status).toBe(200)
    const listBody = await readSseFirstMessage(listRes) as { result: { tools: { name: string }[] } }
    expect(listBody.result.tools.map(t => t.name)).toContain('add')
  }, 15_000)

  it('returns the landing page for browser GET (Accept: text/html)', async () => {
    const handler = await createWebHandler({
      name: 'web-landing-test',
      version: '0.1.0',
      tools: [
        defineTool({
          name: 'add',
          inputSchema: z.object({ a: z.number(), b: z.number() }),
          run: ({ a, b }) => a + b,
        }),
      ],
    })
    cleanup = handler.close

    const browserGet = await handler.fetch(new Request('http://test.invalid/mcp', {
      method: 'GET',
      headers: { Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' },
    }))

    expect(browserGet.status).toBe(200)
    expect(browserGet.headers.get('content-type')).toMatch(/text\/html/)
    const html = await browserGet.text()
    expect(html).toContain('web-landing-test')
    expect(html).toContain('v0.1.0')
    expect(html).toContain('Streamable HTTP')
    expect(html).toContain('http://test.invalid/mcp')
  })

  it('still routes MCP-shaped GET (Accept: text/event-stream) to the transport', async () => {
    const handler = await createWebHandler({
      name: 'web-mcp-get',
      version: '0.1.0',
      tools: [],
    })
    cleanup = handler.close

    // MCP clients can issue GET /mcp to open the server-initiated SSE
    // stream. They advertise text/event-stream in Accept, so this MUST
    // hit the transport (not the landing page).
    const mcpGet = await handler.fetch(new Request('http://test.invalid/mcp', {
      method: 'GET',
      headers: { Accept: 'application/json, text/event-stream' },
    }))

    // Response shape comes from the transport, not the landing page.
    expect(mcpGet.headers.get('content-type')).not.toMatch(/text\/html/)
  })

  it('handles repeated requests in stateless mode', async () => {
    const handler = await createWebHandler({
      name: 'web-stateless-test',
      version: '0.0.1',
      stateful: false,
      tools: [
        defineTool({
          name: 'add',
          inputSchema: z.object({ a: z.number(), b: z.number() }),
          run: ({ a, b }) => a + b,
        }),
      ],
    })
    cleanup = handler.close

    const first = await handler.fetch(initializeRequest(1))
    expect(first.status).toBe(200)
    expect(first.headers.get('mcp-session-id')).toBeNull()

    const second = await handler.fetch(initializeRequest(2))
    expect(second.status).toBe(200)
    expect(second.headers.get('mcp-session-id')).toBeNull()

    const list = await handler.fetch(listToolsRequest(3))
    expect(list.status).toBe(200)
    const listBody = await readSseFirstMessage(list) as { result: { tools: { name: string }[] } }
    expect(listBody.result.tools.map(t => t.name)).toContain('add')
  }, 15_000)
})
