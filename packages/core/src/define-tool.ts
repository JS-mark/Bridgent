import type { z } from 'zod'

export interface BridgentTool<
  TShape extends z.ZodRawShape = z.ZodRawShape,
  TOutput = unknown,
> {
  name: string
  description?: string
  inputSchema: z.ZodObject<TShape>
  run: (input: z.infer<z.ZodObject<TShape>>) => TOutput | Promise<TOutput>
}

export function defineTool<
  TShape extends z.ZodRawShape,
  TOutput,
>(tool: BridgentTool<TShape, TOutput>): BridgentTool<TShape, TOutput> {
  return tool
}
