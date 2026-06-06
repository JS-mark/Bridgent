import type { BridgentTool } from './define-tool'
import { randomUUID } from 'node:crypto'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
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

/**
 * Build a runtime-agnostic MCP handler that exposes Bridgent tools over the
 * Streamable HTTP spec using Web Standard `Request` / `Response`.
 *
 * Drop-in for Cloudflare Workers, Deno, Bun, Hono, Vercel Edge — anything that
 * accepts a `(request: Request) => Response` handler.
 */
export async function createWebHandler(opts: CreateWebHandlerOptions): Promise<WebHandler> {
  const stateful = opts.stateful ?? true

  const mcp = new McpServer({ name: opts.name, version: opts.version })
  registerTools(mcp, opts.tools)

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: stateful ? () => randomUUID() : undefined,
  })
  await mcp.connect(transport)

  return {
    fetch: req => transport.handleRequest(req),
    close: async () => {
      await transport.close().catch(() => {})
    },
  }
}
