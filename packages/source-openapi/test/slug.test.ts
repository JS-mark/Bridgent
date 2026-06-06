import { describe, expect, it } from 'vitest'
import { isValidToolName, operationToToolName } from '../src/slug'

describe('operationToToolName', () => {
  it('uses operationId verbatim when valid', () => {
    expect(operationToToolName({ operationId: 'getPet', method: 'GET', path: '/pets/{id}' })).toBe('getPet')
  })

  it('slugifies operationId with disallowed chars', () => {
    expect(operationToToolName({ operationId: 'GET /v1/users', method: 'GET', path: '/v1/users' })).toBe('GET_v1_users')
  })

  it('builds fallback name from method + path', () => {
    expect(operationToToolName({ method: 'GET', path: '/repos/{owner}/{repo}/issues' })).toBe('get_repos_owner_repo_issues')
  })

  it('applies namespace prefix', () => {
    expect(operationToToolName({ operationId: 'listIssues', method: 'GET', path: '/x', namespace: 'gh_' })).toBe('gh_listIssues')
  })

  it('caps name length at 64 chars', () => {
    const long = `a${'b'.repeat(100)}`
    const out = operationToToolName({ operationId: long, method: 'GET', path: '/' })
    expect(out.length).toBeLessThanOrEqual(64)
  })

  it('always returns a valid tool name', () => {
    for (const op of [
      { operationId: '123-bad-start', method: 'GET', path: '/' },
      { operationId: '$$$', method: 'GET', path: '/' },
      { method: 'POST', path: '/' },
    ]) {
      expect(isValidToolName(operationToToolName(op))).toBe(true)
    }
  })
})
