import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { BridgentTool } from './define-tool'

/**
 * Wire a list of BridgentTools into an MCP server using `registerTool` (the
 * non-deprecated 1.29+ API). The handler stringifies non-string return values
 * into a single text content block.
 *
 * Used by both `createStdioServer` and `createHttpServer`.
 */
export function registerTools(server: McpServer, tools: BridgentTool<any, any>[]): void {
  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema.shape,
      },
      async (args: unknown) => {
        const result = await tool.run(args as never)
        const text = typeof result === 'string'
          ? result
          : JSON.stringify(result)
        return {
          content: [{ type: 'text' as const, text }],
        }
      },
    )
  }
}
