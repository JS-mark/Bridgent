import type { PrismaAuditEvent } from '../src/types'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createJsonlAuditSink } from '../src/jsonl-audit'

describe('createJsonlAuditSink', () => {
  it('appends audit events as JSONL', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'bridgent-audit-'))
    const path = join(dir, 'nested', 'audit.jsonl')
    const sink = createJsonlAuditSink({ path })
    const event: PrismaAuditEvent = {
      ts: '2026-06-08T00:00:00.000Z',
      toolName: 'user_create',
      model: 'User',
      method: 'create',
      phase: 'commit',
      status: 'ok',
      affectedCount: 1,
      idempotencyKey: 'signup-1',
    }

    await sink.write(event)
    await sink.write({ ...event, status: 'attempted' })

    const lines = (await readFile(path, 'utf8')).trim().split('\n')
    expect(lines).toHaveLength(2)
    expect(JSON.parse(lines[0]!)).toMatchObject(event)
    expect(JSON.parse(lines[1]!)).toMatchObject({ status: 'attempted' })
  })
})
