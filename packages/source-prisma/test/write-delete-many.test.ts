import type { DmmfModel, PrismaToolResult } from '../src/types'
import { describe, expect, it, vi } from 'vitest'
import { fromPrisma } from '../src/from-prisma'

const userModel: DmmfModel = {
  name: 'User',
  dbName: null,
  fields: [
    { name: 'id', type: 'Int', kind: 'scalar', isId: true },
    { name: 'email', type: 'String', kind: 'scalar', isUnique: true },
  ],
}

describe('write deleteMany tool', () => {
  it('rejects empty where', async () => {
    const [tool] = await fromPrisma({
      client: { user: { count: vi.fn(), deleteMany: vi.fn() } },
      dmmf: { models: [userModel] },
      allow: { mutating: true, methods: ['deleteMany'] },
      writes: { allowTools: ['user_deleteMany'], audit: { write: vi.fn() } },
    })

    const result = await tool!.run({ dryRun: true, where: {} }) as PrismaToolResult
    expect(result.ok).toBe(false)
    expect(result.error?.kind).toBe('invalid_input')
  })

  it('requires confirmation for large impact commits', async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 101 })
    const [tool] = await fromPrisma({
      client: { user: { count: vi.fn().mockResolvedValue(101), deleteMany } },
      dmmf: { models: [userModel] },
      allow: { mutating: true, methods: ['deleteMany'] },
      writes: {
        allowTools: ['user_deleteMany'],
        largeImpactThreshold: 100,
        audit: { write: vi.fn() },
      },
    })

    const preview = await tool!.run({ dryRun: true, where: { id: { gt: 0 } } }) as PrismaToolResult
    expect(preview.preview?.exceedsThreshold).toBe(true)

    const blocked = await tool!.run({ where: { id: { gt: 0 } }, previewToken: preview.previewToken }) as PrismaToolResult
    expect(blocked.error?.kind).toBe('confirmation_required')
    expect(deleteMany).not.toHaveBeenCalled()

    const nextPreview = await tool!.run({ dryRun: true, where: { id: { gt: 0 } } }) as PrismaToolResult
    const committed = await tool!.run({
      where: { id: { gt: 0 } },
      previewToken: nextPreview.previewToken,
      confirmLargeImpact: true,
    }) as PrismaToolResult
    expect(committed.ok).toBe(true)
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: { gt: 0 } } })
  })
})
