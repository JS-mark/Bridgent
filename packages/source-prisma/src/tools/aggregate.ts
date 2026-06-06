import type { BridgentTool } from '@bridgent/core'
import type { PrismaToolResult } from '../types'
import type { ToolFactoryArgs } from './find-many'
import { defineTool } from '@bridgent/core'
import { z } from 'zod'
import { packErrorResult, withTimeout } from '../guard'
import { aggregatableNumericFields, buildWhereSchema } from '../schema'

export function createAggregateTool(args: ToolFactoryArgs): BridgentTool {
  const { model, modelCamel, toolName, client, opts } = args

  const numericFields = aggregatableNumericFields(model, opts.excludeFieldTypes)
  const numericPicker = (() => {
    if (numericFields.length === 0)
      return z.object({}).optional()
    const shape: Record<string, z.ZodTypeAny> = {}
    for (const f of numericFields)
      shape[f.name] = z.boolean().optional()
    return z.object(shape).optional()
  })()

  const inputSchema = z.object({
    where: buildWhereSchema(model, opts.excludeFieldTypes).optional(),
    _count: z.boolean().optional().describe('Total row count over the filter.'),
    _sum: numericPicker,
    _avg: numericPicker,
    _min: numericPicker,
    _max: numericPicker,
    take: z.number().int().positive().optional(),
    skip: z.number().int().nonnegative().optional(),
  })

  return defineTool({
    name: toolName,
    description: `Aggregate over \`${model.name}\` (count/sum/avg/min/max).`,
    inputSchema,
    run: async (input): Promise<PrismaToolResult> => {
      try {
        const result = await withTimeout(
          () => (client[modelCamel] as any).aggregate({
            where: input.where,
            _count: input._count,
            _sum: input._sum,
            _avg: input._avg,
            _min: input._min,
            _max: input._max,
            take: input.take,
            skip: input.skip,
          }),
          opts.queryTimeoutMs,
          toolName,
        )
        return { ok: true, result }
      }
      catch (err) {
        return packErrorResult(err, toolName)
      }
    },
  })
}
