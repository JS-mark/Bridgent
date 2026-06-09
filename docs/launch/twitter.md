# X / Twitter thread — Bridgent AI

> **Best window**: weekday 09:00–11:00 PT or 18:00–20:00 PT.
> Aim for 8–10 tweets. Lead with the strongest hook. End with the link.

---

## 1/ Hook

```
I've been quietly watching most engineering teams *skip* writing MCP
servers for their existing APIs and databases. The boilerplate is just
too much for the value.

So I shipped Bridgent AI — one line to expose any API or DB as a
production-ready MCP server. 🧵
```

## 2/ Sources

```
It reuses the schema you already have:

• fromOpenApi(spec) — any OpenAPI 3.x → MCP tools
• fromPrisma({ client }) — Prisma schema → read tools by default,
  optional audited writes with preview tokens
• fromDrizzle({ db, tables }) — Drizzle tables → read-only findMany
• defineTool({ inputSchema: zod }) — hand-written Zod functions
```

## 3/ Code

```
The whole "expose a database to my agents" story:

  await createStdioServer({
    name: 'demo',
    version: '0.1.0',
    tools: await fromPrisma({
      client: new PrismaClient(),
      namespace: 'db_'
    }),
  })

  bridgent dev ./server.ts
```

## 4/ Transports

```
Same tools, three transports:

• stdio (local IDE-agent integration)
• Streamable HTTP (shared servers, future Cloud)
• Web Standard fetch handler — drop into Cloudflare Workers / Deno /
  Bun / Vercel Edge unchanged.
```

## 5/ Hosts

```
Verified working with:

• Claude Code
• Cursor
• OpenAI Codex CLI
• Gemini CLI

(Plus a protocol-level harness in the repo that runs the official MCP
SDK Client against the server — anything 1.x-compliant works.)
```

## 6/ Safety

```
Read-only by default for databases:

• LIMIT clamped to 10000
• Query timeouts (default 10s)
• Bytes fields silently stripped from select/where (no agent slurping
  blobs into context)
• findRaw / $queryRaw permanently disabled — there's no escape hatch
```

## 7/ Why this matters

```
Every team I talked to has 50–200 internal API operations or 30+ DB
tables that *would* be valuable to their AI agents — if there were a
zero-effort way to expose them.

Bridgent AI is that zero-effort way.
```

## 8/ Ask

```
Draft for the v0.2.3 alpha launch after publishing to npm. The repo includes
examples for Petstore, GitHub REST, Prisma read-only, Prisma writes, Drizzle,
HTTP, and Web handlers.

Try it: https://js-mark.com/Bridgent/

Most curious about: what source do you wish your AI agents could see
right now that they can't?

GitHub: https://github.com/js-mark/bridgent
```

## Optional 9-10/ Replies / quote-tweets

- Quote-tweet a Claude Code / Cursor / Codex / Gemini CLI release tweet showing how Bridgent integrates
- Reply to the OP with the Cloudflare Worker example as a code-screenshot to give the thread a second wind
