import type { Server as HttpServerInstance } from 'node:http'
import type { BridgentTool } from './define-tool'
import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { renderLandingPage, wantsLandingPage } from './landing-page'
import { registerTools } from './register'

export interface CreateHttpServerOptions {
  name: string
  version: string
  tools: BridgentTool<any, any>[]
  /** Default 3333. */
  port?: number
  /** Default '/mcp'. */
  path?: string
  /** Default '127.0.0.1' (loopback only). Pass '0.0.0.0' to expose. */
  host?: string
  /** Default true. False enables stateless mode. */
  stateful?: boolean
}

export interface HttpServerHandle {
  /** The Node http.Server instance. */
  raw: HttpServerInstance
  /** Resolved URL (e.g. http://127.0.0.1:3333/mcp). */
  url: string
  /** Cleanly close the server (and its underlying MCP transport). */
  close: () => Promise<void>
}

function createMcp(opts: CreateHttpServerOptions): McpServer {
  const mcp = new McpServer({ name: opts.name, version: opts.version })
  registerTools(mcp, opts.tools)
  return mcp
}

async function createTransport(opts: CreateHttpServerOptions, stateful: boolean): Promise<StreamableHTTPServerTransport> {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: stateful ? () => randomUUID() : undefined,
  })
  await createMcp(opts).connect(transport)
  return transport
}

/**
 * Start an MCP server over Streamable HTTP (1.29 spec — superset of SSE).
 *
 * Uses Node's built-in `http.createServer` (no express / hono / fastify).
 * Default mode is stateful: the server generates a `Mcp-Session-Id` per client
 * and demands it on subsequent requests. Pass `stateful: false` for serverless.
 */
export async function createHttpServer(opts: CreateHttpServerOptions): Promise<HttpServerHandle> {
  const port = opts.port ?? 3333
  const host = opts.host ?? '127.0.0.1'
  const path = opts.path ?? '/mcp'
  const stateful = opts.stateful ?? true

  const statefulTransport = stateful ? await createTransport(opts, true) : undefined

  const landingUrl = `http://${host === '0.0.0.0' ? '127.0.0.1' : host}:${port}${path}`

  const httpServer = createServer((req, res) => {
    const reqPath = (req.url ?? '').split('?')[0]
    if (reqPath !== path) {
      res.statusCode = 404
      res.setHeader('Content-Type', 'text/plain')
      res.end(`Not Found. MCP endpoint is at ${path}.`)
      return
    }

    // Browser hit (GET + Accept: text/html, no application/json or
    // text/event-stream) → friendly landing page instead of MCP 406.
    if (wantsLandingPage(req.method ?? '', req.headers.accept ?? null)) {
      res.statusCode = 200
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.end(renderLandingPage({ name: opts.name, version: opts.version, url: landingUrl }))
      return
    }

    const handle = async (): Promise<void> => {
      const transport = statefulTransport ?? await createTransport(opts, false)
      if (!statefulTransport) {
        res.once('close', () => {
          transport.close().catch(() => {})
        })
      }
      await transport.handleRequest(req, res)
    }

    handle().catch((err) => {
      if (!res.writableEnded) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: { message: String(err?.message ?? err) } }))
      }
    })
  })

  await new Promise<void>((resolve) => {
    httpServer.listen(port, host, () => resolve())
  })

  return {
    raw: httpServer,
    url: `http://${host}:${port}${path}`,
    close: async () => {
      await statefulTransport?.close().catch(() => {})
      await new Promise<void>((resolve, reject) => {
        httpServer.close(err => (err ? reject(err) : resolve()))
      })
    },
  }
}
