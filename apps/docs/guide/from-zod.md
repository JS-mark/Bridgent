# From Zod

The smallest possible Bridgent server: a function plus a Zod schema. `defineTool` gives you full TypeScript inference on the `run` body; the runtime serializes whatever you return.

## Quick start

```ts
import { createStdioServer, defineTool } from '@bridgent/core'
import { z } from 'zod'

await createStdioServer({
  name: 'hello',
  version: '0.0.1',
  tools: [
    defineTool({
      name: 'add',
      description: 'Add two numbers',
      inputSchema: z.object({
        a: z.number(),
        b: z.number(),
      }),
      run: ({ a, b }) => ({ sum: a + b }),
    }),
  ],
})
```

`bridgent dev ./server.ts` and you're live.

## `defineTool` signature

```ts
defineTool({
  name: string
  description?: string
  inputSchema: z.ZodObject<Shape>
  run: (input: z.infer<z.ZodObject<Shape>>) => Output | Promise<Output>
})
```

- **`name`** — the MCP tool name. Choose something the LLM can guess: `search_orders`, not `so_v3`.
- **`description`** — what the tool does, in one sentence. The LLM uses this to decide *whether* to call.
- **`inputSchema`** — must be a `ZodObject` (Zod v4). Bridgent passes its `.shape` to the MCP SDK so each input field shows up as its own argument with description and type.
- **`run`** — sync or async. The argument type is inferred from `inputSchema` — you don't need to write it.

## Return value rules

`run` can return any JSON-serializable value:

| You return | LLM sees |
|---|---|
| `'hello'` (string) | text content `"hello"` |
| `{ sum: 3 }` (object) | text content `'{"sum":3}'` |
| `42` (number) | text content `"42"` |
| `[1, 2, 3]` (array) | text content `"[1,2,3]"` |

The runtime stringifies non-strings via `JSON.stringify`. For richer responses (multiple text blocks, images), use the MCP SDK directly — `defineTool` is the simple path.

## Errors

If `run` throws (sync or async), the MCP SDK returns an error response to the host; Bridgent does not catch or transform errors. For expected failures the model should reason about, **return** an error envelope rather than throwing:

```ts
defineTool({
  name: 'lookup_user',
  inputSchema: z.object({ id: z.string() }),
  run: async ({ id }) => {
    const user = await db.user.findUnique({ where: { id } })
    if (!user) {
      return { ok: false, error: 'not_found' }
    }
    return { ok: true, user }
  },
})
```

This is the same pattern `@bridgent/source-openapi` and `@bridgent/source-prisma` use for upstream errors — keeps the server alive across failures and gives the model enough info to course-correct.

## Type inference

`inputSchema` drives the `run` parameter type:

```ts
defineTool({
  name: 'echo',
  inputSchema: z.object({
    message: z.string(),
    repeat: z.number().int().min(1).default(1),
  }),
  run: ({ message, repeat }) => message.repeat(repeat),
  //     ^? message: string
  //                ^? repeat: number  (default applied)
})
```

No manual type annotations on `run` — TypeScript infers from the schema.

## Composition

Multiple `defineTool` calls go into the same `tools: []` array. Mix freely with `fromOpenApi` / `fromPrisma` results — see [Sources Overview](./sources-overview).
