import type { BridgentTool } from '@bridgent/core'
import type { PrismaToolResult } from '../types'
import type { ToolFactoryArgs } from './find-many'
import { defineTool } from '@bridgent/core'
import { z } from 'zod'
import { packErrorResult, withTimeout } from '../guard'
import { buildWhereSchema } from '../schema'

export function createCountTool(args: ToolFactoryArgs): BridgentTool {
  const { model, modelCamel, toolName, client, opts } = args
  const inputSchema = z.object({
    where: buildWhereSchema(model, opts.excludeFieldTypes).optional(),
    take: z.number().int().positive().optional(),
    skip: z.number().int().nonnegative().optional(),
  })

  return defineTool({
    name: toolName,
    description: `Count rows of \`${model.name}\` matching an optional where filter.`,
    inputSchema,
    run: async (input): Promise<PrismaToolResult> => {
      try {
        const value = await withTimeout(
          () => (client[modelCamel] as any).count({
            where: input.where,
            take: input.take,
            skip: input.skip,
          }),
          opts.queryTimeoutMs,
          toolName,
        )
        return { ok: true, result: value as number }
      }
      catch (err) {
        return packErrorResult(err, toolName)
      }
    },
  })
}
