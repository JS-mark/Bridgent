import type { WebHandler } from '@bridgent/core'
import { createWebHandler } from '@bridgent/core'
import { afterEach, describe, expect, it } from 'vitest'
import { makeHelloTools } from '../src/make-server'

let handler: WebHandler | undefined

afterEach(async () => {
  if (handler) {
    await handler.close()
    handler = undefined
  }
})

async function readSse(res: Response): Promise<unknown> {
  const text = await res.text()
  const dataLine = text.split('\n').find(line => line.startsWith('data:'))
  if (!dataLine)
    throw new Error(`No data: line:\n${text}`)
  return JSON.parse(dataLine.slice(5).trim())
}

describe('host-test Web Standard handler', () => {
  it('handles initialize + tools/list + tools/call via fetch()', async () => {
    handler = await createWebHandler({
      name: 'host-test-web',
      version: '0.0.1',
      tools: makeHelloTools(),
    })

    const url = 'http://test.invalid/mcp'
    const baseHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    }

    const initRes = await handler.fetch(new Request(url, {
      method: 'POST',
      headers: baseHeaders,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'host-test', version: '0.0.1' },
        },
      }),
    }))
    expect(initRes.status).toBe(200)
    const sessionId = initRes.headers.get('mcp-session-id')
    expect(sessionId).toBeTruthy()

    const sessionHeaders = { ...baseHeaders, 'Mcp-Session-Id': sessionId! }

    const listRes = await handler.fetch(new Request(url, {
      method: 'POST',
      headers: sessionHeaders,
      body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }),
    }))
    const listBody = await readSse(listRes) as { result: { tools: { name: string }[] } }
    expect(listBody.result.tools.map(t => t.name).sort()).toEqual(['add', 'echo'])

    const callRes = await handler.fetch(new Request(url, {
      method: 'POST',
      headers: sessionHeaders,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'add', arguments: { a: 7, b: 8 } },
      }),
    }))
    const callBody = await readSse(callRes) as { result: { content: { text: string }[] } }
    expect(callBody.result.content[0]?.text).toBe('15')
  })
})
