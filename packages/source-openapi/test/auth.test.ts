import { describe, expect, it } from 'vitest'
import { invokeRequest } from '../src/http'

describe('openAPI auth', () => {
  it('applies API key auth in headers', async () => {
    const calls = await invokeWithAuth({
      type: 'apiKey',
      in: 'header',
      name: 'X-API-Key',
      value: 'secret',
    })

    expect(calls[0]?.url).toBe('https://api.example.test/pets')
    expect(calls[0]?.headers['X-API-Key']).toBe('secret')
  })

  it('applies API key auth in query params', async () => {
    const calls = await invokeWithAuth({
      type: 'apiKey',
      in: 'query',
      name: 'api_key',
      value: async () => 'secret',
    })

    expect(calls[0]?.url).toBe('https://api.example.test/pets?api_key=secret')
  })

  it('applies API key auth in cookies', async () => {
    const calls = await invokeWithAuth({
      type: 'apiKey',
      in: 'cookie',
      name: 'session',
      value: 'secret',
    })

    expect(calls[0]?.headers.Cookie).toBe('session=secret')
  })
})

async function invokeWithAuth(auth: Parameters<typeof invokeRequest>[1]['auth']): Promise<Array<{
  url: string
  headers: Record<string, string>
}>> {
  const calls: Array<{ url: string, headers: Record<string, string> }> = []
  await invokeRequest({
    url: 'https://api.example.test/pets',
    method: 'GET',
    headers: { Accept: 'application/json' },
  }, {
    baseUrl: 'https://api.example.test',
    auth,
    fetch: (async (url, init) => {
      calls.push({
        url: String(url),
        headers: init?.headers as Record<string, string>,
      })
      return new Response('{}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }) as typeof globalThis.fetch,
  })
  return calls
}
