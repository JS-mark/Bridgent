import type { DmmfModel } from '../src/types'
import { describe, expect, it } from 'vitest'
import { buildCreateDataSchema, buildOrderBySchema, buildSelectSchema, buildUniqueWhereSchema, buildUpdateDataSchema, buildWhereSchema } from '../src/schema'

const userModel: DmmfModel = {
  name: 'User',
  dbName: null,
  fields: [
    { name: 'id', type: 'Int', kind: 'scalar', isId: true, isRequired: true },
    { name: 'email', type: 'String', kind: 'scalar', isUnique: true, isRequired: true },
    { name: 'name', type: 'String', kind: 'scalar' },
    { name: 'avatar', type: 'Bytes', kind: 'scalar' },
    { name: 'posts', type: 'Post', kind: 'object', isList: true },
    { name: 'createdAt', type: 'DateTime', kind: 'scalar', isRequired: true, hasDefaultValue: true },
    { name: 'updatedAt', type: 'DateTime', kind: 'scalar', isRequired: true, isUpdatedAt: true },
  ],
}

describe('buildSelectSchema', () => {
  it('exposes scalar fields, excludes Bytes and relations by default', () => {
    const s = buildSelectSchema(userModel)
    const result = s.safeParse({ id: true, email: true, name: false, createdAt: true })
    expect(result.success).toBe(true)
    expect(s.safeParse({ avatar: true }).success).toBe(false)
    expect(s.safeParse({ posts: true }).success).toBe(false)
  })
})

describe('buildWhereSchema', () => {
  it('supports string contains + numeric gte', () => {
    const s = buildWhereSchema(userModel)
    expect(s.safeParse({ email: { contains: '@example.com' } }).success).toBe(true)
    expect(s.safeParse({ id: { gte: 5 } }).success).toBe(true)
    expect(s.safeParse({ avatar: { equals: 'x' } }).success).toBe(false)
  })

  it('supports AND/OR/NOT pass-through', () => {
    const s = buildWhereSchema(userModel)
    expect(s.safeParse({
      AND: [{ id: { gt: 0 } }, { email: { endsWith: '.com' } }],
    }).success).toBe(true)
  })

  it('rejects DateTime when the value is not ISO', () => {
    const s = buildWhereSchema(userModel)
    expect(s.safeParse({ createdAt: { gt: '2024-01-01' } }).success).toBe(false)
    expect(s.safeParse({ createdAt: { gt: '2024-01-01T00:00:00Z' } }).success).toBe(true)
  })
})

describe('buildOrderBySchema', () => {
  it('only allows asc/desc on exposed scalar fields', () => {
    const s = buildOrderBySchema(userModel)
    expect(s.safeParse({ id: 'asc' }).success).toBe(true)
    expect(s.safeParse({ id: 'sideways' }).success).toBe(false)
    expect(s.safeParse({ avatar: 'asc' }).success).toBe(false)
  })
})

describe('buildUniqueWhereSchema', () => {
  it('lists only id and unique fields', () => {
    const s = buildUniqueWhereSchema(userModel)
    expect(s.safeParse({ id: 1 }).success).toBe(true)
    expect(s.safeParse({ email: 'a@b.co' }).success).toBe(true)
    expect(s.safeParse({ name: 'Alice' }).success).toBe(false)
  })
})

describe('write data schemas', () => {
  it('requires non-id required fields for create data', () => {
    const s = buildCreateDataSchema(userModel)
    expect(s.safeParse({ email: 'a@b.co' }).success).toBe(true)
    expect(s.safeParse({ email: 'a@b.co', createdAt: '2024-01-01T00:00:00Z' }).success).toBe(true)
    expect(s.safeParse({ name: 'Alice' }).success).toBe(false)
  })

  it('keeps update data partial and excludes unsafe fields', () => {
    const s = buildUpdateDataSchema(userModel)
    expect(s.safeParse({ name: 'Alice' }).success).toBe(true)
    expect(s.safeParse({ avatar: 'x' }).success).toBe(false)
    expect(s.safeParse({ id: 1 }).success).toBe(false)
    expect(s.safeParse({ email: 'new@example.com' }).success).toBe(false)
    expect(s.safeParse({ updatedAt: '2024-01-01T00:00:00Z' }).success).toBe(false)
  })
})
