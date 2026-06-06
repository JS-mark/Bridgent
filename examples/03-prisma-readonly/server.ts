import { createStdioServer } from '@bridgent/core'
import { fromPrisma } from '@bridgent/source-prisma'
import { PrismaClient } from '@prisma/client'

const client = new PrismaClient()

// eslint-disable-next-line antfu/no-top-level-await
await createStdioServer({
  name: 'demo-db',
  version: '0.0.1',
  tools: await fromPrisma({
    client,
    namespace: 'db_',
    // mutating defaults to false → only read tools exposed
  }),
})
