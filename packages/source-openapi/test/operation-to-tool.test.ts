import type { NormalizedOperation } from '../src/types'
import { describe, expect, it, vi } from 'vitest'
import { operationToTool } from '../src/operation-to-tool'

describe('operationToTool', () => {
  it('uses collision-safe input keys when building the outgoing request', async () => {
    const op: NormalizedOperation = {
      operationId: 'getThing',
      method: 'GET',
      path: '/things/{id}',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        { name: 'id', in: 'query', required: true, schema: { type: 'string' } },
        { name: 'id', in: 'header', required: true, schema: { type: 'string' } },
      ],
      raw: { operationId: 'getThing' },
    }
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))

    const tool = operationToTool(op, {
      baseUrl: 'https://api.example.test',
      fetch,
      toolName: 'getThing',
    })

    await tool.run({
      id: 'path-id',
      query_id: 'query-id',
      header_id: 'header-id',
    } as never)

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.test/things/path-id?id=query-id',
      expect.objectContaining({
        headers: expect.objectContaining({ id: 'header-id' }),
      }),
    )
  })
})
