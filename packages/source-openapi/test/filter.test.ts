import type { OperationObject } from '../src/types'
import { describe, expect, it } from 'vitest'
import { resolveAllowedMethods, shouldExposeOperation } from '../src/filter'

function op(extra: Partial<OperationObject> = {}): OperationObject {
  return {
    operationId: 'getThing',
    ...extra,
  }
}

describe('resolveAllowedMethods', () => {
  it('defaults to GET/HEAD', () => {
    expect(resolveAllowedMethods({ spec: {} })).toEqual(['GET', 'HEAD'])
  })

  it('expands when mutating: true', () => {
    expect(resolveAllowedMethods({ spec: {}, allow: { mutating: true } }))
      .toEqual(['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'])
  })

  it('explicit methods override mutating', () => {
    expect(resolveAllowedMethods({ spec: {}, allow: { methods: ['POST'] } }))
      .toEqual(['POST'])
  })
})

describe('shouldExposeOperation', () => {
  it('drops POST by default (read-only)', () => {
    expect(shouldExposeOperation(
      { path: '/x', method: 'POST', operation: op() },
      { spec: {} },
    )).toBe(false)
  })

  it('exposes GET by default', () => {
    expect(shouldExposeOperation(
      { path: '/x', method: 'GET', operation: op() },
      { spec: {} },
    )).toBe(true)
  })

  it('respects pathFilter (regex)', () => {
    expect(shouldExposeOperation(
      { path: '/admin/users', method: 'GET', operation: op() },
      { spec: {}, pathFilter: /^\/public/ },
    )).toBe(false)
  })

  it('drops when x-bridgent-allow: false', () => {
    expect(shouldExposeOperation(
      { path: '/x', method: 'GET', operation: op({ 'x-bridgent-allow': false }) },
      { spec: {} },
    )).toBe(false)
  })

  it('honors denyOperations', () => {
    expect(shouldExposeOperation(
      { path: '/x', method: 'GET', operation: op({ operationId: 'dangerous' }) },
      { spec: {}, denyOperations: ['dangerous'] },
    )).toBe(false)
  })

  it('honors allowOperations gate', () => {
    expect(shouldExposeOperation(
      { path: '/x', method: 'GET', operation: op({ operationId: 'a' }) },
      { spec: {}, allowOperations: ['b', 'c'] },
    )).toBe(false)
    expect(shouldExposeOperation(
      { path: '/x', method: 'GET', operation: op({ operationId: 'b' }) },
      { spec: {}, allowOperations: ['b', 'c'] },
    )).toBe(true)
  })

  it('exposes mutating when explicitly allowed', () => {
    expect(shouldExposeOperation(
      { path: '/x', method: 'POST', operation: op() },
      { spec: {}, allow: { mutating: true } },
    )).toBe(true)
  })
})
