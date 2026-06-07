import type { BridgentTool } from './define-tool'
import { randomUUID } from 'node:crypto'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { renderLandingPage, wantsLandingPage } from './landing-page'
import { registerTools } from './register'

export interface CreateWebHandlerOptions {
  name: string
  version: string
  tools: BridgentTool<any, any>[]
  /** Default true. False enables stateless mode (recommended for serverless). */
  stateful?: boolean
}

export interface WebHandler {
  /** Web-standard fetch handler. Wire into Cloudflare/Deno/Bun/Hono/Vercel Edge. */
  fetch: (request: Request) => Promise<Response>
  /** Cleanly close the underlying MCP transport. */
  close: () => Promise<void>
}

async function createTransport(opts: CreateWebHandlerOptions, stateful: boolean): Promise<WebStandardStreamableHTTPServerTransport> {
  const mcp = new McpServer({ name: opts.name, version: opts.version })
  registerTools(mcp, opts.tools)

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: stateful ? () => randomUUID() : undefined,
  })
  await mcp.connect(transport)
  return transport
}

/**
 * Build a runtime-agnostic MCP handler that exposes Bridgent tools over the
 * Streamable HTTP spec using Web Standard `Request` / `Response`.
 *
 * Drop-in for Cloudflare Workers, Deno, Bun, Hono, Vercel Edge — anything that
 * accepts a `(request: Request) => Response` handler.
 */
export async function createWebHandler(opts: CreateWebHandlerOptions): Promise<WebHandler> {
  const stateful = opts.stateful ?? true

  const statefulTransport = stateful ? await createTransport(opts, true) : undefined

  return {
    fetch: async (req) => {
      // Browser hit → friendly landing page instead of MCP 406.
      if (wantsLandingPage(req.method, req.headers.get('accept'))) {
        return new Response(
          renderLandingPage({
            name: opts.name,
            version: opts.version,
            url: req.url,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          },
        )
      }

      const transport = statefulTransport ?? await createTransport(opts, false)
      return transport.handleRequest(req)
    },
    close: async () => {
      await statefulTransport?.close().catch(() => {})
    },
  }
}
