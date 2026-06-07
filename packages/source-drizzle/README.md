# @bridgent/source-drizzle

> Expose Drizzle tables as read-only MCP tools.

## Quick start

```ts
import { createStdioServer } from '@bridgent/core'
import { fromDrizzle } from '@bridgent/source-drizzle'
import { db } from './db'
import * as schema from './schema'

await createStdioServer({
  name: 'drizzle-readonly',
  version: '0.0.1',
  tools: await fromDrizzle({
    db,
    tables: {
      users: schema.users,
      posts: schema.posts,
    },
    maxLimit: 100,
  }),
})
```

## Safety posture

v0.2 exposes read-only `findMany` tools only. It calls the ordinary Drizzle select chain and never accepts raw SQL:

```ts
db.select().from(table).limit(n).offset(n)
```

Writes, arbitrary where builders, and raw SQL are intentionally out of scope for this first adapter.
