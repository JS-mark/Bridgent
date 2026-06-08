import type { DmmfModel } from '../src/types'
import { describe, expect, it, vi } from 'vitest'
import { fromPrisma } from '../src/from-prisma'

const userModel: DmmfModel = {
  name: 'User',
  dbName: null,
  fields: [
    { name: 'id', type: 'Int', kind: 'scalar', isId: true },
    { name: 'email', type: 'String', kind: 'scalar', isUnique: true, isRequired: true },
  ],
}

const client = { user: {} }

describe('fromPrisma writes allowlist', () => {
  it('requires both mutating opt-in and write controls', async () => {
    await expect(
      fromPrisma({ client, dmmf: { models: [userModel] }, allow: { mutating: true } }),
    ).rejects.toThrow('writes')
    await expect(fromPrisma({
      client,
      dmmf: { models: [userModel] },
      writes: { allowTools: ['user_create'], audit: { write: vi.fn() } },
    })).rejects.toThrow('allow.mutating')
    await expect(fromPrisma({
      client,
      dmmf: { models: [userModel] },
      allow: { methods: ['create'] },
      writes: { allowTools: ['user_create'], audit: { write: vi.fn() } },
    })).rejects.toThrow('allow.mutating')
    await expect(fromPrisma({
      client,
      dmmf: { models: [userModel] },
      allow: { mutating: true },
      writes: { allowTools: [], audit: { write: vi.fn() } },
    })).rejects.toThrow('allowTools')
  })

  it('generates only explicitly allowed write tools', async () => {
    const tools = await fromPrisma({
      client,
      dmmf: { models: [userModel] },
      allow: { mutating: true },
      writes: { allowTools: ['user_create'], audit: { write: vi.fn() } },
    })

    expect(tools.map(tool => tool.name)).toContain('user_create')
    expect(tools.map(tool => tool.name)).not.toContain('user_delete')
  })
})
