import type { BridgentTool } from './define-tool'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { registerTools } from './register'

export interface CreateStdioServerOptions {
  name: string
  version: string
  tools: BridgentTool<any, any>[]
}

export async function createStdioServer(opts: CreateStdioServerOptions): Promise<McpServer> {
  const server = new McpServer({ name: opts.name, version: opts.version })
  registerTools(server, opts.tools)
  await server.connect(new StdioServerTransport())
  return server
}
