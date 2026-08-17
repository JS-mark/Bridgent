import { describe, expect, it, vi } from 'vitest'
import { createPolicyFixtureTools } from './fixtures/policy-tools'

describe('v0.4 policy no-policy baseline', () => {
  it('preserves current calls and results without policy [POL-C-001]', async () => {
    const runs = {
      read: vi.fn(({ id }: { id: string }) => ({ id, operation: 'read' })),
      unsafeWrite: vi.fn(({ id }: { id: string }) => ({ id, operation: 'unsafe-write' })),
      safeWrite: vi.fn(({ id }: { id: string }) => ({ id, operation: 'safe-write' })),
      noMetadata: vi.fn(({ id }: { id: string }) => ({ id, operation: 'legacy-read' })),
    }
    const tools = createPolicyFixtureTools(runs)

    expect(await tools.read.run({ id: 'u1' })).toEqual({ id: 'u1', operation: 'read' })
    expect(await tools.unsafeWrite.run({ id: 'u2' })).toEqual({ id: 'u2', operation: 'unsafe-write' })
    expect(await tools.safeWrite.run({ id: 'u3' })).toEqual({ id: 'u3', operation: 'safe-write' })
    expect(await tools.noMetadata.run({ id: 'u4' })).toEqual({ id: 'u4', operation: 'legacy-read' })

    expect(runs.read).toHaveBeenCalledOnce()
    expect(runs.unsafeWrite).toHaveBeenCalledOnce()
    expect(runs.safeWrite).toHaveBeenCalledOnce()
    expect(runs.noMetadata).toHaveBeenCalledOnce()
  })

  it('locks representative metadata and metadata-less fixture shapes', () => {
    const run = vi.fn()
    const tools = createPolicyFixtureTools({
      read: run,
      unsafeWrite: run,
      safeWrite: run,
      noMetadata: run,
    })

    expect(tools.read.metadata).toEqual({
      source: { kind: 'zod', name: 'manual', reference: 'user.get' },
      capability: 'read',
      limits: { rowLimit: 25, outputLimit: 4096 },
    })
    expect(tools.unsafeWrite.metadata?.safety).toEqual({
      requiresAuthOrContext: true,
      hasAudit: false,
      hasPreviewToken: false,
    })
    expect(tools.safeWrite.metadata?.safety).toEqual({
      hasAudit: true,
      hasPreviewToken: true,
    })
    expect(tools.noMetadata.metadata).toBeUndefined()
  })
})
