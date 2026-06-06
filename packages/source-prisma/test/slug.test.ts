import { describe, expect, it } from 'vitest'
import { buildToolName, isValidToolName } from '../src/slug'

describe('buildToolName', () => {
  it('builds {model}_{method} by default', () => {
    expect(buildToolName({ modelCamel: 'user', method: 'findMany' })).toBe('user_findMany')
  })

  it('applies namespace prefix', () => {
    expect(buildToolName({ modelCamel: 'user', method: 'count', namespace: 'db_' })).toBe('db_user_count')
  })

  it('always returns a valid tool name', () => {
    for (const opts of [
      { modelCamel: '123badStart', method: 'findMany' as const },
      { modelCamel: 'normal', method: 'aggregate' as const, namespace: '!!' },
    ]) {
      expect(isValidToolName(buildToolName(opts))).toBe(true)
    }
  })

  it('caps name at 64 chars', () => {
    const out = buildToolName({ modelCamel: 'a'.repeat(80), method: 'findMany', namespace: 'x_' })
    expect(out.length).toBeLessThanOrEqual(64)
  })
})
