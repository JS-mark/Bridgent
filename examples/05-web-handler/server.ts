import type { IncomingMessage, ServerResponse } from 'node:http'
import { createServer } from 'node:http'
import process from 'node:process'
import { Readable } from 'node:stream'
import { createWebHandler, defineTool } from '@bridgent/core'
import { z } from 'zod'

// eslint-disable-next-line antfu/no-top-level-await
const handler = await createWebHandler({
  name: 'hello-web',
  version: '0.0.1',
  tools: [
    defineTool({
      name: 'add',
      description: 'Add two numbers',
      inputSchema: z.object({ a: z.number(), b: z.number() }),
      run: ({ a, b }) => ({ sum: a + b }),
    }),
    defineTool({
      name: 'echo',
      description: 'Echo a message back',
      inputSchema: z.object({ message: z.string() }),
      run: ({ message }) => message,
    }),
  ],
})

// Tiny Node-HTTP → Web-Standard adapter (~25 lines).
async function adapt(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = `http://${req.headers.host ?? '127.0.0.1'}${req.url ?? '/'}`
  const headers = new Headers()
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === 'string') headers.set(k, v)
    else if (Array.isArray(v)) headers.set(k, v.join(','))
  }
  const method = (req.method ?? 'GET').toUpperCase()
  const hasBody = method !== 'GET' && method !== 'HEAD'
  const init: RequestInit & { duplex?: 'half' } = { method, headers }
  if (hasBody) {
    init.body = Readable.toWeb(req) as unknown as ReadableStream<Uint8Array>
    init.duplex = 'half'
  }

  const response = await handler.fetch(new Request(url, init as RequestInit))
  res.statusCode = response.status
  response.headers.forEach((value, key) => res.setHeader(key, value))
  if (response.body) {
    for await (const chunk of Readable.fromWeb(response.body as never))
      res.write(chunk)
  }
  res.end()
}

const PORT = Number(process.env.PORT ?? 3334)
const server = createServer((req, res) => {
  adapt(req, res).catch((err) => {
    if (!res.writableEnded) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: { message: String(err?.message ?? err) } }))
    }
  })
})

server.listen(PORT, '127.0.0.1', () => {
  console.error(`Web-handler MCP server listening at http://127.0.0.1:${PORT}/mcp (any path also works)`)
})

const shutdown = async (): Promise<void> => {
  console.error('Shutting down…')
  await handler.close()
  server.close(() => process.exit(0))
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
