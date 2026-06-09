# From Drizzle

Expose Drizzle tables as read-only MCP tools.

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

`@bridgent/source-drizzle@0.2.0` added one read-only `findMany` tool per table:

```ts
db.select().from(table).limit(n).offset(n)
```

The adapter does not accept raw SQL and does not generate write tools.

## Options

| Option | Purpose |
|---|---|
| `db` | Instantiated Drizzle database object with `select()` |
| `tables` | Map of public table names to Drizzle table objects |
| `namespace` | Prefix generated tool names |
| `tableFilter` | RegExp or function filter for table names |
| `defaultLimit` | Limit used when the caller omits `limit` |
| `maxLimit` | Hard cap for caller-provided `limit` |

Generated tool names use `<namespace?><table>_find_many`.
