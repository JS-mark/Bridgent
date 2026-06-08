import type { DmmfModel } from '../src/types'
import { describe, expect, it } from 'vitest'
import { isEffectivelyEmptyWhere } from '../src/empty-where'
import { assertWhereOnlyUniqueFields } from '../src/unique-where'

const userModel: DmmfModel = {
  name: 'User',
  dbName: null,
  fields: [
    { name: 'id', type: 'Int', kind: 'scalar', isId: true },
    { name: 'email', type: 'String', kind: 'scalar', isUnique: true },
    { name: 'name', type: 'String', kind: 'scalar' },
  ],
}

describe('isEffectivelyEmptyWhere', () => {
  it('treats empty logical wrappers as empty', () => {
    expect(isEffectivelyEmptyWhere({})).toBe(true)
    expect(isEffectivelyEmptyWhere({ AND: [] })).toBe(true)
    expect(isEffectivelyEmptyWhere({ OR: [{}] })).toBe(true)
    expect(isEffectivelyEmptyWhere({ AND: [{ id: { gt: 1 } }] })).toBe(false)
  })
})

describe('assertWhereOnlyUniqueFields', () => {
  it('accepts id and unique fields only', () => {
    expect(assertWhereOnlyUniqueFields({ id: 1 }, userModel)).toBeUndefined()
    expect(assertWhereOnlyUniqueFields({ email: 'a@example.com' }, userModel)).toBeUndefined()
    expect(assertWhereOnlyUniqueFields({ name: 'Alice' }, userModel)).toContain('invalid keys')
  })
})
