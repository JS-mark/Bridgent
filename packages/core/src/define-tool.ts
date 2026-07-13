import type { z } from 'zod'

export type BridgentSourceKind = 'zod' | 'openapi' | 'prisma' | 'drizzle' | 'trpc'

export type BridgentToolCapability = 'read' | 'write'

export interface BridgentToolMetadata {
  source: {
    kind: BridgentSourceKind
    name?: string
    reference?: string
  }
  capability: BridgentToolCapability
  safety?: {
    requiresAuthOrContext?: boolean
    hasAudit?: boolean
    hasPreviewToken?: boolean
  }
  limits?: {
    rowLimit?: number
    outputLimit?: number
  }
}

export interface BridgentTool<
  TShape extends z.ZodRawShape = z.ZodRawShape,
  TOutput = unknown,
> {
  name: string
  description?: string
  metadata?: BridgentToolMetadata
  inputSchema: z.ZodObject<TShape>
  run: (input: z.infer<z.ZodObject<TShape>>) => TOutput | Promise<TOutput>
}

export function defineTool<
  TShape extends z.ZodRawShape,
  TOutput,
>(tool: BridgentTool<TShape, TOutput>): BridgentTool<TShape, TOutput> {
  return tool
}
