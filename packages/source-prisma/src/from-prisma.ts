import type { BridgentTool } from '@bridgent/core'
import type { FromPrismaOptions, PrismaMethod } from './types'
import { modelNameToClientKey, readDefaultDmmf } from './dmmf'
import { modelPasses, resolveAllowedMethods, toolNamePasses } from './filter'
import { buildToolName } from './slug'
import { createReadTool } from './tools'

/**
 * Turn an instantiated PrismaClient into a list of BridgentTools.
 *
 * Defaults to the read-only 5-piece (findUnique/findFirst/findMany/count/aggregate)
 * with LIMIT clamping, soft per-query timeout, and Bytes-field stripping.
 */
export async function fromPrisma(opts: FromPrismaOptions): Promise<BridgentTool[]> {
  if (!opts.client || typeof opts.client !== 'object')
    throw new Error('@bridgent/source-prisma: `client` is required (a PrismaClient instance).')

  const dmmf = opts.dmmf ?? (await readDefaultDmmf())
  const allowedMethods = resolveAllowedMethods(opts)
  const tools: BridgentTool[] = []
  const seen = new Set<string>()

  for (const model of dmmf.models) {
    const modelCamel = modelNameToClientKey(model.name)
    if (!modelPasses(modelCamel, opts))
      continue
    if (typeof (opts.client as Record<string, unknown>)[modelCamel] !== 'object')
      continue

    for (const method of allowedMethods) {
      const tool = build(model, modelCamel, method, opts)
      if (!tool)
        continue
      if (seen.has(tool.name))
        throw new Error(`@bridgent/source-prisma: duplicate tool name "${tool.name}". Provide a different namespace.`)
      if (!toolNamePasses(tool.name, opts))
        continue
      seen.add(tool.name)
      tools.push(tool)
    }
  }

  return tools
}

function build(
  model: { name: string, dbName: string | null, fields: { name: string, type: string, kind: 'scalar' | 'object' | 'enum' }[] },
  modelCamel: string,
  method: PrismaMethod,
  opts: FromPrismaOptions,
): BridgentTool | undefined {
  const toolName = buildToolName({ modelCamel, method, namespace: opts.namespace })
  return createReadTool(method, {
    model: model as any,
    modelCamel,
    toolName,
    client: opts.client,
    opts,
  })
}
