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

Pass `--probe` to run a short metadata probe before the browser opens. If the server file reaches a Bridgent transport, the CLI prints source-grouped tool hints, copyable stdio/default-HTTP host snippets, and warnings for mutating tools, missing audit metadata, or a large generated surface. The probe executes the server module before Inspector executes it again, so only enable it when initialization is idempotent and safe to run twice. It is best-effort and fails open: if metadata is unavailable, the official Inspector still starts.

::: tip Why not a custom UI?
Bridgent deliberately reuses the official Inspector — it works, it's maintained, and it covers 80% of the debugging surface. A Bridgent-specific inspector (with source-grouping, auth hints, Prisma trace) remains on the roadmap, but it should not block source and onboarding work.
:::

## Inspecting a remote HTTP server

If you've already started one with `bridgent serve`, you can pass the URL to Inspector directly via its UI: select **"Connect to URL"** and enter `http://127.0.0.1:3333/mcp`.
