import type { PrismaToolResult } from './types'

export interface IdempotencyKeyInput {
  toolName: string
  key: string
  argsHash: string
}

interface IdempotencyEntry {
  result: PrismaToolResult
  expiresAt: number
}

export class IdempotencyStore {
  private readonly entries = new Map<string, IdempotencyEntry>()
  private readonly inFlight = new Map<string, Promise<PrismaToolResult>>()

  constructor(private readonly ttlMs = 10 * 60_000) {}

  get(input: IdempotencyKeyInput): PrismaToolResult | undefined {
    this.sweep()
    const entry = this.entries.get(cacheKey(input))
    if (!entry)
      return undefined
    if (Date.now() > entry.expiresAt) {
      this.entries.delete(cacheKey(input))
      return undefined
    }
    return markReplay(entry.result)
  }

  getInFlight(input: IdempotencyKeyInput): Promise<PrismaToolResult> | undefined {
    return this.inFlight.get(cacheKey(input))?.then(markReplay)
  }

  run(input: IdempotencyKeyInput, task: () => Promise<PrismaToolResult>): Promise<PrismaToolResult> {
    const key = cacheKey(input)
    const existing = this.inFlight.get(key)
    if (existing)
      return existing.then(markReplay)

    const promise = task()
      .then((result) => {
        if (result.ok)
          this.set(input, result)
        return result
      })
      .finally(() => {
        this.inFlight.delete(key)
      })
    this.inFlight.set(key, promise)
    return promise
  }

  set(input: IdempotencyKeyInput, result: PrismaToolResult): void {
    this.sweep()
    this.entries.set(cacheKey(input), {
      result,
      expiresAt: Date.now() + this.ttlMs,
    })
  }

  sweep(): void {
    const now = Date.now()
    for (const [key, entry] of this.entries) {
      if (now > entry.expiresAt)
        this.entries.delete(key)
    }
  }
}

function cacheKey(input: IdempotencyKeyInput): string {
  return `${input.toolName}\0${input.key}\0${input.argsHash}`
}

function markReplay(result: PrismaToolResult): PrismaToolResult {
  return {
    ...result,
    meta: {
      ...result.meta,
      idempotentReplay: true,
    },
  }
}
