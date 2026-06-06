import { describe, expect, it } from 'vitest'
import { modelPasses, resolveAllowedMethods, toolNamePasses } from '../src/filter'

const baseClient = {} as any

describe('resolveAllowedMethods', () => {
  it('defaults to read-only 5-piece', () => {
    expect(resolveAllowedMethods({ client: baseClient }))
      .toEqual(['findUnique', 'findFirst', 'findMany', 'count', 'aggregate'])
  })

  it('expands when mutating: true', () => {
    const out = resolveAllowedMethods({ client: baseClient, allow: { mutating: true } })
    expect(out).toContain('create')
    expect(out).toContain('delete')
    expect(out).toContain('findMany')
  })

  it('explicit methods override mutating', () => {
    expect(resolveAllowedMethods({ client: baseClient, allow: { methods: ['count'] } }))
      .toEqual(['count'])
  })
})

describe('modelPasses', () => {
  it('admits all when no filter set', () => {
    expect(modelPasses('user', { client: baseClient })).toBe(true)
  })

  it('respects regex filter', () => {
    expect(modelPasses('user', { client: baseClient, modelFilter: /^user/ })).toBe(true)
    expect(modelPasses('post', { client: baseClient, modelFilter: /^user/ })).toBe(false)
  })

  it('respects function filter', () => {
    expect(modelPasses('user', { client: baseClient, modelFilter: name => name.startsWith('u') })).toBe(true)
    expect(modelPasses('post', { client: baseClient, modelFilter: name => name.startsWith('u') })).toBe(false)
  })
})

describe('toolNamePasses', () => {
  it('passes when no allow/deny set', () => {
    expect(toolNamePasses('user_findMany', { client: baseClient })).toBe(true)
  })

  it('honors allowTools gate', () => {
    expect(toolNamePasses('user_findMany', { client: baseClient, allowTools: ['user_count'] })).toBe(false)
    expect(toolNamePasses('user_count', { client: baseClient, allowTools: ['user_count'] })).toBe(true)
  })

  it('honors denyTools after allow', () => {
    expect(toolNamePasses('user_findMany', { client: baseClient, denyTools: ['user_findMany'] })).toBe(false)
  })
})
