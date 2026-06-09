import { createHash, randomBytes } from 'node:crypto'

export interface PreviewTokenEntry {
  toolName: string
  argsHash: string
  affectedCount: number
  exceedsThreshold: boolean
  expiresAt: number
}

export class PreviewTokenStore {
  private readonly entries = new Map<string, PreviewTokenEntry>()

  constructor(private readonly ttlMs = 60_000) {}

  issue(entry: Omit<PreviewTokenEntry, 'expiresAt'>): { token: string, expiresAt: Date } {
    this.sweep()
    const token = `pt_${randomBytes(32).toString('base64url')}`
    const expiresAt = Date.now() + this.ttlMs
    this.entries.set(token, { ...entry, expiresAt })
    return { token, expiresAt: new Date(expiresAt) }
  }

  redeem(token: string): PreviewTokenEntry | undefined {
    const entry = this.entries.get(token)
    this.entries.delete(token)
    if (!entry)
      return undefined
    if (Date.now() > entry.expiresAt)
      return undefined
    return entry
  }

  sweep(): void {
    const now = Date.now()
    for (const [token, entry] of this.entries) {
      if (now > entry.expiresAt)
        this.entries.delete(token)
    }
  }
}

export function hashArgs(input: Record<string, unknown>): string {
  const nativeArgs = { ...input }
  delete nativeArgs.dryRun
  delete nativeArgs.previewToken
  delete nativeArgs.confirmLargeImpact
  delete nativeArgs.idempotencyKey
  return createHash('sha256').update(stableStringify(nativeArgs)).digest('hex')
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object')
    return JSON.stringify(value)
  if (Array.isArray(value))
    return `[${value.map(stableStringify).join(',')}]`
  const obj = value as Record<string, unknown>
  return `{${Object.keys(obj).sort().map(key => `${JSON.stringify(key)}:${stableStringify(obj[key])}`).join(',')}}`
}
