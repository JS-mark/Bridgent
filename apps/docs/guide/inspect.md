# Inspect

Bridgent ships a `bridgent inspect` command that opens the official **[MCP Inspector](https://github.com/modelcontextprotocol/inspector)** wired to your server.

```bash
bridgent inspect ./server.ts
```

Internally this is equivalent to:

```bash
pnpm dlx @modelcontextprotocol/inspector node --experimental-strip-types ./server.ts
```

Inspector opens a browser window where you can:

- Browse all registered tools and their input schemas
- Send a `tools/call` with arbitrary arguments and see the response
- Replay a JSON-RPC trace
- Switch between stdio (default) and HTTP

::: tip Why not a custom UI?
v0.1 deliberately reuses the official Inspector — it works, it's maintained, and it covers 80% of the debugging surface. A Bridgent-specific inspector (with source-grouping, auth hints, Prisma trace) remains on the roadmap, but it should not block source and onboarding work.
:::

## Inspecting a remote HTTP server

If you've already started one with `bridgent serve`, you can pass the URL to Inspector directly via its UI: select **"Connect to URL"** and enter `http://127.0.0.1:3333/mcp`.
