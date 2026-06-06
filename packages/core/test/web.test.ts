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

    const initRes = await handler.fetch(new Request('http://test.invalid/mcp', {
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
    }))
    expect(initRes.status).toBe(200)
    const sessionId = initRes.headers.get('mcp-session-id')
    expect(sessionId).toBeTruthy()
    const initBody = await readSseFirstMessage(initRes) as { result: { serverInfo: { name: string } } }
    expect(initBody.result.serverInfo.name).toBe('web-test')

    const listRes = await handler.fetch(new Request('http://test.invalid/mcp', {
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
    }))
    expect(listRes.status).toBe(200)
    const listBody = await readSseFirstMessage(listRes) as { result: { tools: { name: string }[] } }
    expect(listBody.result.tools.map(t => t.name)).toContain('add')
  }, 15_000)
})
