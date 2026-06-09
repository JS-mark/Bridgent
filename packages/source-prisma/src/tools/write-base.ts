import type { BridgentTool } from '@bridgent/core'
import type { PrismaMethod, PrismaMutatingMethod, PrismaToolResult } from '../types'
import type { ToolFactoryArgs } from './find-many'
import { defineTool } from '@bridgent/core'
import { z } from 'zod'
import { writeAuditEvent } from '../audit'
import { isEffectivelyEmptyWhere } from '../empty-where'
import { packErrorResult, withTimeout } from '../guard'
import { hashArgs } from '../preview-token'
import { buildCreateDataSchema, buildCreateManyDataSchema, buildUniqueWhereSchema, buildUpdateDataSchema, buildWhereSchema } from '../schema'
import { assertWhereOnlyUniqueFields } from '../unique-where'

const WRITE_METHODS = new Set<PrismaMethod>(['create', 'createMany', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany'])
const PROTOCOL_DESCRIPTION = `Mutating tool. Two-step protocol:
  1) Call with dryRun:true to get { preview, previewToken }.
  2) Call again with the SAME args plus previewToken to commit.
If preview.exceedsThreshold is true, commit must also pass confirmLargeImpact:true.`

export function createWriteTool(method: PrismaMethod, args: ToolFactoryArgs): BridgentTool | undefined {
  if (!WRITE_METHODS.has(method))
    return undefined
  if (!args.previewTokens)
    return undefined

  const writeMethod = method as PrismaMutatingMethod
  const inputSchema = buildWriteInputSchema(writeMethod, args)

  return defineTool({
    name: args.toolName,
    description: `${writeMethod} \`${args.model.name}\` records.\n\n${PROTOCOL_DESCRIPTION}`,
    inputSchema,
    run: async (rawInput): Promise<PrismaToolResult> => {
      const input = rawInput as Record<string, unknown>
      const invalid = validateInput(writeMethod, input, args)
      if (invalid)
        return invalid

      if (input.dryRun === true)
        return preview(writeMethod, input, args)

      const token = typeof input.previewToken === 'string' ? input.previewToken : undefined
      const idempotencyKey = getIdempotencyKey(input)
      const idempotencyInput = idempotencyKey
        ? { toolName: args.toolName, key: idempotencyKey, argsHash: hashArgs(input) }
        : undefined
      if (idempotencyInput) {
        const replay = args.idempotency?.get(idempotencyInput)
        if (replay)
          return replay
        const inFlight = args.idempotency?.getInFlight(idempotencyInput)
        if (inFlight)
          return inFlight
      }
      if (!token)
        return previewRequired(args.toolName)

      const entry = args.previewTokens?.redeem(token)
      if (!entry || entry.toolName !== args.toolName)
        return previewRequired(args.toolName)
      if (entry.argsHash !== hashArgs(input))
        return previewRequired(args.toolName, 'preview token does not match current args; rerun dryRun')
      if (entry.exceedsThreshold && input.confirmLargeImpact !== true)
        return confirmationRequired(args.toolName)

      const commit = (): Promise<PrismaToolResult> => commitWrite(writeMethod, input, args, entry.affectedCount)
      return idempotencyInput
        ? args.idempotency?.run(idempotencyInput, commit) ?? commit()
        : commit()
    },
  })
}

function buildWriteInputSchema(method: PrismaMutatingMethod, args: ToolFactoryArgs): z.ZodObject<z.ZodRawShape> {
  const createData = buildCreateDataSchema(args.model, args.opts.excludeFieldTypes)
  const updateData = buildUpdateDataSchema(args.model, args.opts.excludeFieldTypes)
  const uniqueWhere = buildUniqueWhereSchema(args.model)
  const where = buildWhereSchema(args.model, args.opts.excludeFieldTypes)
  const control = {
    dryRun: z.boolean().optional(),
    previewToken: z.string().optional(),
    confirmLargeImpact: z.boolean().optional(),
    idempotencyKey: z.string().min(1).optional(),
  }

  switch (method) {
    case 'create':
      return z.object({ data: createData, ...control })
    case 'createMany':
      return z.object({ data: buildCreateManyDataSchema(args.model, args.opts.excludeFieldTypes), skipDuplicates: z.boolean().optional(), ...control })
    case 'update':
      return z.object({ where: uniqueWhere, data: updateData, ...control })
    case 'updateMany':
      return z.object({ where, data: updateData, ...control })
    case 'upsert':
      return z.object({ where: uniqueWhere, create: createData, update: updateData, ...control })
    case 'delete':
      return z.object({ where: uniqueWhere, ...control })
    case 'deleteMany':
      return z.object({ where, ...control })
  }
}

async function preview(method: PrismaMutatingMethod, input: Record<string, unknown>, args: ToolFactoryArgs): Promise<PrismaToolResult> {
  try {
    const affectedCount = await previewAffectedCount(method, input, args)
    const threshold = args.opts.writes?.largeImpactThreshold ?? 100
    const exceedsThreshold = affectedCount > threshold
    const auditFailure = await writeAuditEvent({
      opts: args.opts,
      toolName: args.toolName,
      model: args.model.name,
      method,
      phase: 'preview',
      args: input,
      affectedCount,
      status: 'ok',
    })
    if (auditFailure)
      return auditFailure

    const issued = args.previewTokens!.issue({
      toolName: args.toolName,
      argsHash: hashArgs(input),
      affectedCount,
      exceedsThreshold,
    })
    return {
      ok: true,
      preview: {
        affectedCount,
        exceedsThreshold,
        expiresAt: issued.expiresAt.toISOString(),
      },
      previewToken: issued.token,
    }
  }
  catch (error) {
    const packed = packErrorResult(error, args.toolName)
    await writeAuditEvent({
      opts: args.opts,
      toolName: args.toolName,
      model: args.model.name,
      method,
      phase: 'preview',
      args: input,
      status: 'error',
      errorKind: packed.error?.kind,
    })
    return packed
  }
}

async function previewAffectedCount(method: PrismaMutatingMethod, input: Record<string, unknown>, args: ToolFactoryArgs): Promise<number> {
  const delegate = args.client[args.modelCamel] as any
  switch (method) {
    case 'create':
      return 1
    case 'createMany':
      return Array.isArray(input.data) ? input.data.length : 0
    case 'update':
    case 'upsert':
    case 'delete': {
      const row = await withTimeout(() => delegate.findUnique({ where: input.where }), args.opts.queryTimeoutMs, args.toolName)
      return row ? 1 : 0
    }
    case 'updateMany':
    case 'deleteMany':
      return await withTimeout(() => delegate.count({ where: input.where }), args.opts.queryTimeoutMs, args.toolName) as number
  }
}

async function commitWrite(
  method: PrismaMutatingMethod,
  input: Record<string, unknown>,
  args: ToolFactoryArgs,
  affectedCount: number,
): Promise<PrismaToolResult> {
  const auditFailure = await writeAuditEvent({
    opts: args.opts,
    toolName: args.toolName,
    model: args.model.name,
    method,
    phase: 'commit',
    args: input,
    affectedCount,
    status: 'attempted',
  })
  if (auditFailure)
    return auditFailure

  try {
    const result = await withTimeout(
      () => (args.client[args.modelCamel] as any)[method](nativeArgs(input)),
      args.opts.queryTimeoutMs,
      args.toolName,
    )
    const count = resultCount(result, affectedCount)
    const finalAuditFailure = await writeAuditEvent({
      opts: args.opts,
      toolName: args.toolName,
      model: args.model.name,
      method,
      phase: 'commit',
      args: input,
      affectedCount: count,
      status: 'ok',
    })
    return {
      ok: true,
      result,
      meta: {
        count,
        warning: finalAuditFailure?.error?.message,
      },
    }
  }
  catch (error) {
    const packed = packErrorResult(error, args.toolName)
    await writeAuditEvent({
      opts: args.opts,
      toolName: args.toolName,
      model: args.model.name,
      method,
      phase: 'commit',
      args: input,
      affectedCount,
      status: 'error',
      errorKind: packed.error?.kind,
    })
    return packed
  }
}

function validateInput(method: PrismaMutatingMethod, input: Record<string, unknown>, args: ToolFactoryArgs): PrismaToolResult | undefined {
  if (method === 'update' || method === 'upsert' || method === 'delete') {
    const error = assertWhereOnlyUniqueFields(input.where, args.model)
    if (error)
      return invalidInput(args.toolName, error)
  }
  if ((method === 'updateMany' || method === 'deleteMany') && isEffectivelyEmptyWhere(input.where))
    return invalidInput(args.toolName, '`where` must contain at least one scalar condition')
  if ('idempotencyKey' in input && !getIdempotencyKey(input))
    return invalidInput(args.toolName, '`idempotencyKey` must be a non-empty string')
  return undefined
}

function nativeArgs(input: Record<string, unknown>): Record<string, unknown> {
  const args = { ...input }
  delete args.dryRun
  delete args.previewToken
  delete args.confirmLargeImpact
  delete args.idempotencyKey
  return args
}

function getIdempotencyKey(input: Record<string, unknown>): string | undefined {
  return typeof input.idempotencyKey === 'string' && input.idempotencyKey.length > 0
    ? input.idempotencyKey
    : undefined
}

function resultCount(result: unknown, fallback: number): number {
  if (result && typeof result === 'object' && 'count' in result && typeof (result as { count?: unknown }).count === 'number')
    return (result as { count: number }).count
  return fallback
}

function invalidInput(toolName: string, message: string): PrismaToolResult {
  return { ok: false, error: { kind: 'invalid_input', message: `${toolName}: ${message}` } }
}

function previewRequired(toolName: string, message = 'call with dryRun:true before committing'): PrismaToolResult {
  return { ok: false, error: { kind: 'preview_required', message: `${toolName}: ${message}` } }
}

function confirmationRequired(toolName: string): PrismaToolResult {
  return { ok: false, error: { kind: 'confirmation_required', message: `${toolName}: confirmLargeImpact:true is required for this preview` } }
}
