import type { DmmfModel, PrismaToolResult } from '../src/types'
import { describe, expect, it, vi } from 'vitest'
import { fromPrisma } from '../src/from-prisma'

const userModel: DmmfModel = {
  name: 'User',
  dbName: null,
  fields: [
    { name: 'id', type: 'Int', kind: 'scalar', isId: true, isRequired: true },
    { name: 'email', type: 'String', kind: 'scalar', isUnique: true, isRequired: true },
    { name: 'name', type: 'String', kind: 'scalar' },
    { name: 'avatar', type: 'Bytes', kind: 'scalar' },
  ],
}

function makeClient(impl: Record<string, (args: any) => Promise<unknown>>) {
  return {
    user: impl,
  }
}

async function callRun(tools: Awaited<ReturnType<typeof fromPrisma>>, name: string, input: unknown): Promise<PrismaToolResult> {
  const tool = tools.find(t => t.name === name)
  if (!tool)
    throw new Error(`tool ${name} not found in ${tools.map(t => t.name).join(', ')}`)
  return tool.run(input as never) as Promise<PrismaToolResult>
}

describe('fromPrisma → findMany', () => {
  it('exposes read tools with namespace', async () => {
    const client = makeClient({ findMany: async () => [{ id: 1 }] })
    const tools = await fromPrisma({
      client,
      namespace: 'db_',
      dmmf: { models: [userModel] },
    })
    const names = tools.map(t => t.name).sort()
    expect(names).toEqual([
      'db_user_aggregate',
      'db_user_count',
      'db_user_findFirst',
      'db_user_findMany',
      'db_user_findUnique',
    ])
  })

  it('hides mutating methods by default', async () => {
    const client = makeClient({})
    const tools = await fromPrisma({ client, dmmf: { models: [userModel] } })
    expect(tools.find(t => t.name.includes('create') || t.name.includes('delete'))).toBeUndefined()
  })

  it('clamps take above maxTake and emits a warning', async () => {
    const findMany = vi.fn().mockResolvedValue([])
    const client = makeClient({ findMany })
    const tools = await fromPrisma({ client, dmmf: { models: [userModel] }, maxTake: 100, defaultTake: 50 })

    const out = await callRun(tools, 'user_findMany', { take: 999 })
    expect(out.ok).toBe(true)
    expect(out.meta?.takeApplied).toBe(999)
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }))
    expect(out.meta?.warning).toMatch(/clamped/)
  })

  it('strips Bytes from select before forwarding', async () => {
    const findMany = vi.fn().mockResolvedValue([])
    const client = makeClient({ findMany })
    const tools = await fromPrisma({ client, dmmf: { models: [userModel] } })

    await callRun(tools, 'user_findMany', { select: { id: true, avatar: true } })
    const call = findMany.mock.calls[0]?.[0]
    expect(call?.select).toEqual({ id: true })
  })

  it('soft-times-out a slow query', async () => {
    const findMany = () => new Promise(resolve => setTimeout(resolve, 200, []))
    const client = makeClient({ findMany })
    const tools = await fromPrisma({ client, dmmf: { models: [userModel] }, queryTimeoutMs: 50 })
    const out = await callRun(tools, 'user_findMany', {})
    expect(out.ok).toBe(false)
    expect(out.error?.kind).toBe('timeout')
  })

  it('packs Prisma errors as { ok: false, kind: prisma }', async () => {
    const err = Object.assign(new Error('Unique constraint failed'), { code: 'P2002' })
    const findMany = vi.fn().mockRejectedValue(err)
    const client = makeClient({ findMany })
    const tools = await fromPrisma({ client, dmmf: { models: [userModel] } })
    const out = await callRun(tools, 'user_findMany', {})
    expect(out.ok).toBe(false)
    expect(out.error?.kind).toBe('prisma')
  })

  it('clamps count take before forwarding', async () => {
    const count = vi.fn().mockResolvedValue(100)
    const client = makeClient({ count })
    const tools = await fromPrisma({ client, dmmf: { models: [userModel] }, maxTake: 10, defaultTake: 5 })

    const out = await callRun(tools, 'user_count', { take: 99 })
    expect(out.ok).toBe(true)
    expect(count).toHaveBeenCalledWith(expect.objectContaining({ take: 10 }))
    expect(out.meta?.takeApplied).toBe(99)
    expect(out.meta?.warning).toMatch(/clamped/)
  })

  it('clamps aggregate take before forwarding', async () => {
    const aggregate = vi.fn().mockResolvedValue({ _count: 10 })
    const client = makeClient({ aggregate })
    const tools = await fromPrisma({ client, dmmf: { models: [userModel] }, maxTake: 10, defaultTake: 5 })

    const out = await callRun(tools, 'user_aggregate', { _count: true, take: 99 })
    expect(out.ok).toBe(true)
    expect(aggregate).toHaveBeenCalledWith(expect.objectContaining({ take: 10 }))
    expect(out.meta?.takeApplied).toBe(99)
    expect(out.meta?.warning).toMatch(/clamped/)
  })
})

describe('fromPrisma → mutating opt-in', () => {
  it('does NOT expose mutating tools even with allow.mutating (v0.1 only ships read factories)', async () => {
    const client = makeClient({})
    const tools = await fromPrisma({ client, dmmf: { models: [userModel] }, allow: { mutating: true } })
    // Currently no factory for mutating methods → silently skipped.
    expect(tools.every(t => /(?:findMany|findFirst|findUnique|count|aggregate)$/.test(t.name))).toBe(true)
  })
})
