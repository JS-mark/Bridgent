const DEFAULT_LIMIT = 100
const DEFAULT_MAX_LIMIT = 1_000

export interface LimitOutcome {
  limit: number
  applied: number
  warning?: string
}

export function clampLimit(input: unknown, defaults: { defaultLimit?: number, maxLimit?: number } = {}): LimitOutcome {
  const fallback = defaults.defaultLimit ?? DEFAULT_LIMIT
  const max = defaults.maxLimit ?? DEFAULT_MAX_LIMIT

  if (typeof input !== 'number' || !Number.isFinite(input) || input <= 0)
    return { limit: fallback, applied: fallback }

  const integer = Math.floor(input)
  if (integer > max) {
    return {
      limit: max,
      applied: integer,
      warning: `limit clamped from ${integer} to ${max}`,
    }
  }

  return { limit: integer, applied: integer }
}

export function packErrorResult(error: unknown): {
  ok: false
  error: { kind: 'drizzle' | 'unknown', message: string }
} {
  const err = error as { message?: string }
  return {
    ok: false,
    error: {
      kind: 'unknown',
      message: err?.message ?? 'Unknown Drizzle source error',
    },
  }
}
