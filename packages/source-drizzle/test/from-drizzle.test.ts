import { describe, expect, it } from 'vitest'
import { fromDrizzle } from '../src/from-drizzle'

describe('fromDrizzle', () => {
  it('creates one read-only findMany tool per table', async () => {
    const db = createFakeDb([{ id: 1 }, { id: 2 }])

    const tools = await fromDrizzle({
      db,
      tables: { users: {} },
    })

    expect(tools).toHaveLength(1)
    expect(tools[0]?.name).toBe('users_find_many')

    const result = await tools[0]?.run({ limit: 1, offset: 1 })
    expect(result).toEqual({
      ok: true,
      result: [{ id: 2 }],
      meta: {
        count: 1,
        limitApplied: 1,
        warning: undefined,
      },
    })
    expect(db.calls).toEqual([{ table: {}, limit: 1, offset: 1 }])
  })

  it('clamps limits', async () => {
    const db = createFakeDb([{ id: 1 }, { id: 2 }, { id: 3 }])
    const [tool] = await fromDrizzle({
      db,
      tables: { users: {} },
      maxLimit: 2,
    })

    const result = await tool?.run({ limit: 100 })

    expect(result).toEqual({
      ok: true,
      result: [{ id: 1 }, { id: 2 }],
      meta: {
        count: 2,
        limitApplied: 100,
        warning: 'limit clamped from 100 to 2',
      },
    })
  })

  it('filters tables and detects duplicate names', async () => {
    const db = createFakeDb([])
    const tools = await fromDrizzle({
      db,
      tables: { users: {}, posts: {} },
      tableFilter: /^user/,
    })

    expect(tools.map(tool => tool.name)).toEqual(['users_find_many'])

    await expect(fromDrizzle({
      db,
      tables: { userProfile: {}, user_profile: {} },
    })).rejects.toThrow('duplicate tool name')
  })
})

function createFakeDb(rows: unknown[]): {
  select: () => { from: (table: object) => FakeQuery }
  calls: Array<{ table: object, limit?: number, offset?: number }>
} {
  const calls: Array<{ table: object, limit?: number, offset?: number }> = []
  return {
    calls,
    select: () => ({
      from: table => new FakeQuery(rows, calls, table),
    }),
  }
}

class FakeQuery implements PromiseLike<unknown[]> {
  private limitValue: number | undefined
  private offsetValue: number | undefined

  constructor(
    private readonly rows: unknown[],
    private readonly calls: Array<{ table: object, limit?: number, offset?: number }>,
    private readonly table: object,
  ) {}

  limit(limit: number): FakeQuery {
    this.limitValue = limit
    return this
  }

  offset(offset: number): FakeQuery {
    this.offsetValue = offset
    return this
  }

  then<TResult1 = unknown[], TResult2 = never>(
    onfulfilled?: ((value: unknown[]) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    this.calls.push({ table: this.table, limit: this.limitValue, offset: this.offsetValue })
    const offset = this.offsetValue ?? 0
    const limit = this.limitValue ?? this.rows.length
    return Promise.resolve(this.rows.slice(offset, offset + limit)).then(onfulfilled, onrejected)
  }
}
