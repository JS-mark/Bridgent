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
})
