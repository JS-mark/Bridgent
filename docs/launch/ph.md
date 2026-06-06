# Product Hunt — Bridgent AI

> **Channel**: <https://www.producthunt.com/posts/new>
> **Best window**: launch at 12:01 AM PT for the full day window.

---

## Tagline (≤ 60 chars)

```
One line to expose any API as an MCP server for AI agents.
```

## Description (≤ 260 chars)

```
Bridgent AI turns OpenAPI specs, Prisma schemas, and Zod-typed functions
into production-ready MCP servers — instantly usable in Claude Code,
Cursor, Codex, and Gemini CLI. Read-only by default, three transports,
zero glue code.
```

## Topics

- Developer Tools
- Artificial Intelligence
- Open Source
- API
- SaaS

## Maker comment (first comment, ~150 words)

```
Hi PH 👋 — maker here.

I kept watching teams skip writing MCP servers for their internal APIs
because the boilerplate (SDK + JSON schemas + auth + transport choice)
just wasn't worth the week of work. Their data stayed invisible to
Claude Code / Cursor / Codex / Gemini CLI even though the schema was
already sitting right there.

Bridgent AI reuses what you already have. One call to fromOpenApi() or
fromPrisma() (or hand-written Zod tools) and you get a server that
speaks MCP across stdio, Streamable HTTP, and a Web Standard fetch
handler — same tools, three transports, drops into Cloudflare /
Deno / Bun unchanged.

Read-only by default for databases. Row caps. Query timeouts. Raw SQL
permanently disabled.

Would love your feedback — particularly: what data source do you wish
your AI agents could see right now?

GitHub: https://github.com/js-mark/bridgent
Docs:   https://bridgent.ai
```

## Gallery (5 slots)

1. **Hero**: 4 IDE-Agent panes calling the same Bridgent server (re-use `assets/demo.gif` once recorded)
2. **Code**: a single screen of the 6-line server.ts
3. **DB safety**: showing read-only by default + LIMIT clamp warning in the response
4. **Transports**: same tools, 3 transports diagram
5. **Hosts**: 4 host config snippets side-by-side

## Topics + tags housekeeping

- Tag the maker as the user that built it
- Add `mcp`, `model-context-protocol`, `claude`, `cursor` to the tags input
