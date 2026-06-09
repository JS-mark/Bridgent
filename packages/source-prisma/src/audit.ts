import type { FromPrismaOptions, PrismaAuditEvent, PrismaMutatingMethod, PrismaToolResult } from './types'

export async function writeAuditEvent(input: {
  opts: FromPrismaOptions
  toolName: string
  model: string
  method: PrismaMutatingMethod
  phase: PrismaAuditEvent['phase']
  args: Record<string, unknown>
  affectedCount?: number
  status: PrismaAuditEvent['status']
  errorKind?: PrismaAuditEvent['errorKind']
}): Promise<PrismaToolResult | undefined> {
  try {
    const event: PrismaAuditEvent = {
      ts: new Date().toISOString(),
      toolName: input.toolName,
      model: input.model,
      method: input.method,
      phase: input.phase,
      whereKeys: objectKeys(input.args.where),
      dataKeys: objectKeys(input.args.data ?? input.args.create ?? input.args.update),
      affectedCount: input.affectedCount,
      status: input.status,
      errorKind: input.errorKind,
      idempotencyKey: typeof input.args.idempotencyKey === 'string' ? input.args.idempotencyKey : undefined,
    }
    const redacted = input.opts.writes?.redactor?.(input.args, {
      toolName: input.toolName,
      model: input.model,
      method: input.method,
    })
    if (redacted !== undefined)
      event.args = redacted

    await input.opts.writes?.audit.write(event)
    return undefined
  }
  catch (error) {
    return {
      ok: false,
      error: {
        kind: 'unknown',
        message: `audit sink failed: ${(error as Error).message}`,
      },
    }
  }
}

function objectKeys(value: unknown): string[] | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? Object.keys(value as Record<string, unknown>)
    : undefined
}
