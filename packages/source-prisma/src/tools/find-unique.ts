import type { BridgentTool } from '@bridgent/core'
import type { PrismaToolResult } from '../types'
import type { ToolFactoryArgs } from './find-many'
import { defineTool } from '@bridgent/core'
import { z } from 'zod'
import { packErrorResult, sanitizeSelect, withTimeout } from '../guard'
import { buildSelectSchema, buildUniqueWhereSchema } from '../schema'

export function createFindUniqueTool(args: ToolFactoryArgs): BridgentTool {
  const { model, modelCamel, toolName, client, opts } = args
  const inputSchema = z.object({
    where: buildUniqueWhereSchema(model).optional().describe(`Required: filter by an id or unique field of \`${model.name}\`.`),
    select: buildSelectSchema(model, opts.excludeFieldTypes).optional(),
  })

  return defineTool({
    name: toolName,
    description: `Look up a single \`${model.name}\` by id or unique field.`,
    inputSchema,
    run: async (input): Promise<PrismaToolResult> => {
      const where = input.where as Record<string, unknown> | undefined
      if (!where || Object.keys(where).length === 0) {
        return {
          ok: false,
          error: { kind: 'invalid_input', message: `${toolName}: \`where\` with at least one unique field is required` },
        }
      }
      const select = sanitizeSelect(input.select as Record<string, unknown> | undefined, model.fields, opts.excludeFieldTypes)
      try {
        const row = await withTimeout(
          () => (client[modelCamel] as any).findUnique({
            where,
            ...(select ? { select } : {}),
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
