import type { DmmfField, PrismaToolResult } from './types'
import { exposedScalarFields } from './dmmf'

const DEFAULT_TAKE = 10_000
const DEFAULT_TIMEOUT_MS = 10_000

export interface ClampOutcome {
  take: number
  applied: number
  warning?: string
}

export function clampTake(input: unknown, defaults: { defaultTake?: number, maxTake?: number } = {}): ClampOutcome {
  const max = defaults.maxTake ?? DEFAULT_TAKE
  const fallback = defaults.defaultTake ?? DEFAULT_TAKE

  if (typeof input !== 'number' || !Number.isFinite(input) || input <= 0) {
    return { take: fallback, applied: fallback }
  }

  const integer = Math.floor(input)
  if (integer > max) {
    return {
      take: max,
      applied: integer,
      warning: `take clamped from ${integer} to ${max}`,
    }
  }
  return { take: integer, applied: integer }
}

/** Strip Bytes (and other excluded types) from a user-provided select. */
export function sanitizeSelect(
  select: Record<string, unknown> | undefined,
  fields: DmmfField[],
  excludeTypes?: string[],
): Record<string, unknown> | undefined {
  if (!select)
    return undefined
  const allowed = new Set(exposedScalarFields(fields, excludeTypes).map(f => f.name))
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(select)) {
    if (allowed.has(k))
      out[k] = v
  }
  return Object.keys(out).length === 0 ? undefined : out
}

/** Race a promise against a soft timeout. Underlying query keeps running. */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  ms: number = DEFAULT_TIMEOUT_MS,
  label = 'query',
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(`Query "${label}" exceeded ${ms}ms timeout`)), ms)
  })
  try {
    return await Promise.race([fn(), timeout])
  }
  finally {
    if (timer)
      clearTimeout(timer)
  }
}

export class TimeoutError extends Error {
  override name = 'TimeoutError'
}

export function packErrorResult(err: unknown, label: string): PrismaToolResult {
  if (err instanceof TimeoutError)
    return { ok: false, error: { kind: 'timeout', message: err.message } }

  const e = err as { code?: string, message?: string }
  if (e?.code && typeof e.code === 'string' && e.code.startsWith('P'))
    return { ok: false, error: { kind: 'prisma', message: e.message ?? String(err) } }

  return {
    ok: false,
    error: {
      kind: 'unknown',
      message: e?.message ?? `Unknown error in ${label}`,
    },
  }
}
