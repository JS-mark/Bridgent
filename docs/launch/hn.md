# Show HN: Bridgent AI

> **Channel**: <https://news.ycombinator.com/submit>
> **Type**: Show HN — text post (not link).
> **Best windows** (US weekday mornings, PT): Tue–Thu 06:00–09:00 PT.

---

## Title (≤ 80 chars)

```
Show HN: Bridgent AI – one line to expose any API or DB as an MCP server
```

## Self-text

```
Bridgent AI turns existing OpenAPI 3.x specs, Prisma schemas, or Zod-typed
functions into a production-ready MCP server in one line. Works in Claude
Code, Cursor, OpenAI Codex CLI, Gemini CLI, or any MCP 1.x client over
stdio, Streamable HTTP, or a Web Standard fetch handler (drop into
Cloudflare Workers / Deno / Bun unchanged).

Why I built this: most teams have a perfectly good API or DB but skip
writing an MCP server because the SDK + JSON schemas + auth boilerplate
isn't worth a week of work. Bridgent AI reuses the schema you already have.

Quick start (Prisma read-only, with row caps + query timeouts + raw-SQL
permanently disabled):

  import { createStdioServer } from '@bridgent/core'
  import { fromPrisma } from '@bridgent/source-prisma'
  import { PrismaClient } from '@prisma/client'

  await createStdioServer({
    name: 'demo',
    version: '0.1.0',
    tools: await fromPrisma({ client: new PrismaClient(), namespace: 'db_' }),
  })

  bridgent dev ./server.ts

Five example servers in the repo, including a real GitHub REST surface
(read-only issues/pulls/releases) you can wire in with a personal access
token.

Code: https://github.com/js-mark/bridgent
Docs: https://bridgent.ai

It's alpha. Most curious about: which sources do you wish your AI agents
could see right now that they currently can't?
```

## Notes for the poster

- Don't sign your name in the body; HN convention is hands-off.
- Reply to comments within the first hour — single biggest signal for the algorithm.
- Don't ask for upvotes anywhere on the internet ahead of submission; HN aggressively de-ranks coordinated voting.
