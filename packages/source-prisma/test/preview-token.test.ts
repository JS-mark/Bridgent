import { describe, expect, it, vi } from 'vitest'
import { hashArgs, PreviewTokenStore } from '../src/preview-token'

describe('previewTokenStore', () => {
  it('issues single-use tokens bound to entries', () => {
    const store = new PreviewTokenStore(60_000)
    const issued = store.issue({
      toolName: 'user_create',
      argsHash: 'abc',
      affectedCount: 1,
      exceedsThreshold: false,
    })

    expect(issued.token).toMatch(/^pt_/)
    expect(store.redeem(issued.token)?.argsHash).toBe('abc')
    expect(store.redeem(issued.token)).toBeUndefined()
  })

  it('expires tokens', () => {
    vi.useFakeTimers()
    try {
      const store = new PreviewTokenStore(100)
      const issued = store.issue({
        toolName: 'user_create',
        argsHash: 'abc',
        affectedCount: 1,
        exceedsThreshold: false,
      })
      vi.advanceTimersByTime(101)
      expect(store.redeem(issued.token)).toBeUndefined()
    }
    finally {
      vi.useRealTimers()
    }
  })
})

describe('hashArgs', () => {
  it('ignores control fields and sorts object keys', () => {
    expect(hashArgs({ data: { b: 2, a: 1 }, dryRun: true })).toBe(hashArgs({
      dryRun: false,
      previewToken: 'pt_x',
      confirmLargeImpact: true,
      idempotencyKey: 'signup-1',
      data: { a: 1, b: 2 },
    }))
  })
})
