import type { BridgentTool } from '@bridgent/core'
import type { PrismaToolResult } from '../types'
import type { ToolFactoryArgs } from './find-many'
import { defineTool } from '@bridgent/core'
import { z } from 'zod'
import { packErrorResult, sanitizeSelect, withTimeout } from '../guard'
import { buildOrderBySchema, buildSelectSchema, buildWhereSchema } from '../schema'

export function createFindFirstTool(args: ToolFactoryArgs): BridgentTool {
  const { model, modelCamel, toolName, client, opts } = args
  const inputSchema = z.object({
    where: buildWhereSchema(model, opts.excludeFieldTypes).optional(),
    select: buildSelectSchema(model, opts.excludeFieldTypes).optional(),
    orderBy: buildOrderBySchema(model, opts.excludeFieldTypes).optional(),
    skip: z.number().int().nonnegative().optional(),
  })

  return defineTool({
    name: toolName,
    description: `Return the first matching row of \`${model.name}\` (read-only).`,
    inputSchema,
    run: async (input): Promise<PrismaToolResult> => {
      const select = sanitizeSelect(input.select as Record<string, unknown> | undefined, model.fields, opts.excludeFieldTypes)
      try {
        const row = await withTimeout(
          () => (client[modelCamel] as any).findFirst({
            where: input.where,
            orderBy: input.orderBy,
            ...(select ? { select } : {}),
            skip: input.skip,
          }),
          opts.queryTimeoutMs,
          toolName,
        )
        return { ok: true, result: row }
      }
      catch (err) {
        return packErrorResult(err, toolName)
      }
    },
  })
}
