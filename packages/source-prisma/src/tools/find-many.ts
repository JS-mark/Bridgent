import type { BridgentTool } from '@bridgent/core'
import type { IdempotencyStore } from '../idempotency'
import type { PreviewTokenStore } from '../preview-token'
import type { DmmfModel, FromPrismaOptions, PrismaClientLike, PrismaToolResult } from '../types'
import { defineTool } from '@bridgent/core'
import { z } from 'zod'
import { clampTake, packErrorResult, sanitizeSelect, withTimeout } from '../guard'
import { buildOrderBySchema, buildSelectSchema, buildWhereSchema } from '../schema'

export interface ToolFactoryArgs {
  model: DmmfModel
  modelCamel: string
  toolName: string
  client: PrismaClientLike
  opts: FromPrismaOptions
  previewTokens?: PreviewTokenStore
  idempotency?: IdempotencyStore
}

export function createFindManyTool(args: ToolFactoryArgs): BridgentTool {
  const { model, modelCamel, toolName, client, opts } = args
  const inputSchema = z.object({
    where: buildWhereSchema(model, opts.excludeFieldTypes).optional(),
    select: buildSelectSchema(model, opts.excludeFieldTypes).optional(),
    orderBy: buildOrderBySchema(model, opts.excludeFieldTypes).optional(),
    take: z.number().int().positive().optional().describe(`Max rows to return. Default ${opts.defaultTake ?? 10_000}, capped at ${opts.maxTake ?? 10_000}.`),
    skip: z.number().int().nonnegative().optional(),
  })

  return defineTool({
    name: toolName,
    description: `List rows of \`${model.name}\` (read-only, with row cap).`,
    inputSchema,
    run: async (input): Promise<PrismaToolResult> => {
      const clamp = clampTake(input.take, opts)
      const select = sanitizeSelect(input.select as Record<string, unknown> | undefined, model.fields, opts.excludeFieldTypes)
      try {
        const rows = await withTimeout(
          () => (client[modelCamel] as any).findMany({
            where: input.where,
            orderBy: input.orderBy,
            ...(select ? { select } : {}),
            take: clamp.take,
            skip: input.skip,
          }),
          opts.queryTimeoutMs,
          toolName,
        )
        const list = rows as unknown[]
        return {
          ok: true,
          result: list,
          meta: {
            count: list.length,
            takeApplied: clamp.applied,
            ...(clamp.warning ? { warning: clamp.warning } : {}),
          },
        }
      }
      catch (err) {
        return packErrorResult(err, toolName)
      }
    },
  })
}
