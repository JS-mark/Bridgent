import type { PrismaAuditEvent } from './types'
import { appendFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'

export interface JsonlAuditSinkOptions {
  path: string
}

export function createJsonlAuditSink(options: JsonlAuditSinkOptions): {
  write: (event: PrismaAuditEvent) => Promise<void>
} {
  return {
    async write(event) {
      await mkdir(dirname(options.path), { recursive: true })
      await appendFile(options.path, `${JSON.stringify(event)}\n`, 'utf8')
    },
  }
}
