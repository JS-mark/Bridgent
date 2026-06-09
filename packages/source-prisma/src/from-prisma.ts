import type { BridgentTool } from '@bridgent/core'
import type { FromPrismaOptions, PrismaMethod } from './types'
import { modelNameToClientKey, readDefaultDmmf } from './dmmf'
import { modelPasses, resolveAllowedMethods, toolNamePasses } from './filter'
import { IdempotencyStore } from './idempotency'
import { PreviewTokenStore } from './preview-token'
import { buildToolName } from './slug'
import { createPrismaTool } from './tools'

/**
 * Turn an instantiated PrismaClient into a list of BridgentTools.
 *
 * Defaults to the read-only 5-piece (findUnique/findFirst/findMany/count/aggregate)
 * with LIMIT clamping, soft per-query timeout, and Bytes-field stripping.
 */
export async function fromPrisma(opts: FromPrismaOptions): Promise<BridgentTool[]> {
  if (!opts.client || typeof opts.client !== 'object')
    throw new Error('@bridgent/source-prisma: `client` is required (a PrismaClient instance).')
  validateWritesOptions(opts)

  const dmmf = opts.dmmf ?? (await readDefaultDmmf())
  const allowedMethods = resolveAllowedMethods(opts)
  const previewTokens = opts.writes ? new PreviewTokenStore(opts.writes.previewTokenTTLMs) : undefined
  const idempotency = opts.writes ? new IdempotencyStore(opts.writes.idempotencyKeyTTLMs) : undefined
  const tools: BridgentTool[] = []
  const seen = new Set<string>()

  for (const model of dmmf.models) {
    const modelCamel = modelNameToClientKey(model.name)
    if (!modelPasses(modelCamel, opts))
      continue
    if (typeof (opts.client as Record<string, unknown>)[modelCamel] !== 'object')
      continue

    for (const method of allowedMethods) {
      const tool = build(model, modelCamel, method, opts, previewTokens, idempotency)
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
  previewTokens: PreviewTokenStore | undefined,
  idempotency: IdempotencyStore | undefined,
): BridgentTool | undefined {
  const toolName = buildToolName({ modelCamel, method, namespace: opts.namespace })
  if (isWriteMethod(method)) {
    if (!opts.writes?.allowTools.includes(toolName))
      return undefined
  }
  return createPrismaTool(method, {
    model: model as any,
    modelCamel,
    toolName,
    client: opts.client,
    opts,
    previewTokens,
    idempotency,
  })
}

function validateWritesOptions(opts: FromPrismaOptions): void {
  const mutating = opts.allow?.mutating === true
  const requestsWriteMethods = opts.allow?.methods?.some(isWriteMethod) === true
  if (requestsWriteMethods && !mutating)
    throw new Error('@bridgent/source-prisma: `allow.mutating: true` is required when write methods are requested.')
  if (mutating && !opts.writes)
    throw new Error('@bridgent/source-prisma: `writes` is required when `allow.mutating` is true.')
  if (opts.writes && !mutating)
    throw new Error('@bridgent/source-prisma: `allow.mutating: true` is required when `writes` is configured.')
  if (!opts.writes)
    return
  if (!Array.isArray(opts.writes.allowTools) || opts.writes.allowTools.length === 0)
    throw new Error('@bridgent/source-prisma: `writes.allowTools` must be a non-empty array.')
  if (!opts.writes.audit || typeof opts.writes.audit.write !== 'function')
    throw new Error('@bridgent/source-prisma: `writes.audit.write` is required.')
}

function isWriteMethod(method: PrismaMethod): boolean {
  return method === 'create'
    || method === 'createMany'
    || method === 'update'
    || method === 'updateMany'
    || method === 'upsert'
    || method === 'delete'
    || method === 'deleteMany'
}
