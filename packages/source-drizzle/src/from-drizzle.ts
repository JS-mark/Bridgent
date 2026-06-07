import type { BridgentTool } from '@bridgent/core'
import type { DrizzleQueryLike, DrizzleToolResult, FromDrizzleOptions } from './types'
import { defineTool } from '@bridgent/core'
import { z } from 'zod'
import { clampLimit, packErrorResult } from './guard'
import { buildToolName } from './slug'

export async function fromDrizzle(options: FromDrizzleOptions): Promise<BridgentTool[]> {
  if (!options.db || typeof options.db.select !== 'function')
    throw new Error('@bridgent/source-drizzle: `db` with select() is required.')
  if (!options.tables || typeof options.tables !== 'object')
    throw new Error('@bridgent/source-drizzle: `tables` is required.')

  const tools: BridgentTool[] = []
  const seen = new Set<string>()

  for (const [tableName, table] of Object.entries(options.tables)) {
    if (!tablePasses(tableName, options))
      continue

    const toolName = buildToolName({ tableName, namespace: options.namespace })
    if (seen.has(toolName))
      throw new Error(`@bridgent/source-drizzle: duplicate tool name "${toolName}". Provide a different namespace.`)
    seen.add(toolName)

    tools.push(createFindManyTool({ tableName, table, toolName, options }))
  }

  return tools
}

function createFindManyTool(input: {
  tableName: string
  table: object
  toolName: string
  options: FromDrizzleOptions
}): BridgentTool {
  return defineTool({
    name: input.toolName,
    description: `Read rows from Drizzle table ${input.tableName}`,
    inputSchema: z.object({
      limit: z.number().int().positive().optional().describe('Maximum rows to return. Clamped by maxLimit.'),
      offset: z.number().int().nonnegative().optional().describe('Rows to skip before returning results.'),
    }),
    run: async (args): Promise<DrizzleToolResult> => {
      const { limit, applied, warning } = clampLimit((args as { limit?: unknown }).limit, input.options)
      const offset = (args as { offset?: number }).offset
      try {
        let query = input.options.db.select().from(input.table)
        query = applyLimit(query, limit)
        query = applyOffset(query, offset)
        const result = await query
        return {
          ok: true,
          result,
          meta: {
            count: Array.isArray(result) ? result.length : undefined,
            limitApplied: applied,
            warning,
          },
        }
      }
      catch (error) {
        return packErrorResult(error)
      }
    },
  })
}

function applyLimit(query: DrizzleQueryLike, limit: number): DrizzleQueryLike {
  return typeof query.limit === 'function' ? query.limit(limit) : query
}

function applyOffset(query: DrizzleQueryLike, offset: number | undefined): DrizzleQueryLike {
  if (offset === undefined)
    return query
  return typeof query.offset === 'function' ? query.offset(offset) : query
}

function tablePasses(tableName: string, options: FromDrizzleOptions): boolean {
  if (!options.tableFilter)
    return true
  return options.tableFilter instanceof RegExp
    ? options.tableFilter.test(tableName)
    : options.tableFilter(tableName)
}
