import type { PrismaAuditEvent } from '@bridgent/source-prisma'
import { createStdioServer } from '@bridgent/core'
import { fromPrisma } from '@bridgent/source-prisma'
import { PrismaClient } from '@prisma/client'

const client = new PrismaClient()

function writeAudit(event: PrismaAuditEvent): void {
  console.error(JSON.stringify({ bridgentAudit: event }))
}

// eslint-disable-next-line antfu/no-top-level-await
await createStdioServer({
  name: 'demo-db-writes',
  version: '0.0.1',
  tools: await fromPrisma({
    client,
    namespace: 'db_',
    allow: { mutating: true },
    writes: {
      allowTools: [
        'db_user_create',
        'db_user_update',
        'db_post_updateMany',
        'db_comment_deleteMany',
      ],
      audit: { write: writeAudit },
      largeImpactThreshold: 1,
      redactor: rawArgs => ({
        where: rawArgs.where,
        dataKeys: rawArgs.data && typeof rawArgs.data === 'object'
          ? Object.keys(rawArgs.data)
          : undefined,
      }),
    },
  }),
})
