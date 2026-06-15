import { describe, expect, it } from 'vitest'
import { stdioUsageHints } from '../src/commands/dev'

describe('dev command helpers', () => {
  it('explains stdio usage instead of implying an HTTP URL', () => {
    expect(stdioUsageHints('/tmp/my server.ts')).toEqual([
      'Transport: stdio (no HTTP URL is exposed).',
      'Inspect tools: bridgent inspect \'/tmp/my server.ts\'',
    ])
  })
})
