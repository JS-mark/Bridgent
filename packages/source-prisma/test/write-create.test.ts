import type { DmmfModel, PrismaToolResult } from '../src/types'
import { describe, expect, it, vi } from 'vitest'
import { fromPrisma } from '../src/from-prisma'

const userModel: DmmfModel = {
  name: 'User',
  dbName: null,
  fields: [
    { name: 'id', type: 'Int', kind: 'scalar', isId: true },
    { name: 'email', type: 'String', kind: 'scalar', isUnique: true, isRequired: true },
    { name: 'name', type: 'String', kind: 'scalar' },
  ],
}

describe('write create tool', () => {
  it('uses dryRun then previewToken to commit', async () => {
    const create = vi.fn().mockResolvedValue({ id: 1, email: 'a@example.com' })
    const audit = vi.fn()
    const [tool] = await fromPrisma({
      client: { user: { create } },
      dmmf: { models: [userModel] },
      allow: { mutating: true, methods: ['create'] },
      writes: { allowTools: ['user_create'], audit: { write: audit } },
    })

    const preview = await tool!.run({ dryRun: true, data: { email: 'a@example.com' } }) as PrismaToolResult
    expect(preview.ok).toBe(true)
    expect(preview.preview?.affectedCount).toBe(1)
    expect(preview.previewToken).toMatch(/^pt_/)
    expect(create).not.toHaveBeenCalled()

    const committed = await tool!.run({ data: { email: 'a@example.com' }, previewToken: preview.previewToken }) as PrismaToolResult
    expect(committed.ok).toBe(true)
    expect(create).toHaveBeenCalledWith({ data: { email: 'a@example.com' } })
    expect(audit).toHaveBeenCalledTimes(3)
    expect(audit.mock.calls.map(call => call[0].status)).toEqual(['ok', 'attempted', 'ok'])
  })

  it('rejects changed args for a preview token', async () => {
    const [tool] = await fromPrisma({
      client: { user: { create: vi.fn() } },
      dmmf: { models: [userModel] },
      allow: { mutating: true, methods: ['create'] },
      writes: { allowTools: ['user_create'], audit: { write: vi.fn() } },
    })

    const preview = await tool!.run({ dryRun: true, data: { email: 'a@example.com' } }) as PrismaToolResult
    const committed = await tool!.run({ data: { email: 'b@example.com' }, previewToken: preview.previewToken }) as PrismaToolResult

    expect(committed.ok).toBe(false)
    expect(committed.error?.kind).toBe('preview_required')
  })

  it('replays successful commits with the same idempotency key', async () => {
    const create = vi.fn().mockResolvedValue({ id: 1, email: 'a@example.com' })
    const audit = vi.fn()
    const [tool] = await fromPrisma({
      client: { user: { create } },
      dmmf: { models: [userModel] },
      allow: { mutating: true, methods: ['create'] },
      writes: { allowTools: ['user_create'], audit: { write: audit } },
    })

    const args = { data: { email: 'a@example.com' }, idempotencyKey: 'signup-a@example.com' }
    const preview = await tool!.run({ ...args, dryRun: true }) as PrismaToolResult
    const first = await tool!.run({ ...args, previewToken: preview.previewToken }) as PrismaToolResult
    const replay = await tool!.run({ ...args, previewToken: preview.previewToken }) as PrismaToolResult

    expect(first.ok).toBe(true)
    expect(replay.ok).toBe(true)
    expect(replay.meta?.idempotentReplay).toBe(true)
    expect(create).toHaveBeenCalledTimes(1)
    expect(audit).toHaveBeenCalledTimes(3)
  })

  it('deduplicates concurrent commits with the same idempotency key', async () => {
    let resolveCreate!: (value: { id: number, email: string }) => void
    const create = vi.fn().mockImplementation(() => new Promise((resolve) => {
      resolveCreate = resolve
    }))
    const audit = vi.fn()
    const [tool] = await fromPrisma({
      client: { user: { create } },
      dmmf: { models: [userModel] },
      allow: { mutating: true, methods: ['create'] },
      writes: { allowTools: ['user_create'], audit: { write: audit } },
    })

    const args = { data: { email: 'a@example.com' }, idempotencyKey: 'signup-a@example.com' }
    const previewA = await tool!.run({ ...args, dryRun: true }) as PrismaToolResult
    const previewB = await tool!.run({ ...args, dryRun: true }) as PrismaToolResult
    const first = tool!.run({ ...args, previewToken: previewA.previewToken }) as Promise<PrismaToolResult>
    const second = tool!.run({ ...args, previewToken: previewB.previewToken }) as Promise<PrismaToolResult>

    for (let i = 0; i < 10 && create.mock.calls.length === 0; i++)
      await Promise.resolve()
    expect(create).toHaveBeenCalledTimes(1)
    resolveCreate({ id: 1, email: 'a@example.com' })
    const [firstResult, secondResult] = await Promise.all([first, second])

    expect(firstResult.ok).toBe(true)
    expect(secondResult.ok).toBe(true)
    expect(secondResult.meta?.idempotentReplay).toBe(true)
    expect(create).toHaveBeenCalledTimes(1)
    expect(audit.mock.calls.map(call => call[0].phase)).toEqual(['preview', 'preview', 'commit', 'commit'])
  })
})
