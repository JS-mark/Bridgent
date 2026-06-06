# CLI

Bridgent ships three commands, all thin wrappers around `node`:

| Command | What it does | Most common use |
|---|---|---|
| [`bridgent dev <file>`](#dev) | Spawn `node <file>`, with TS support | local IDE-agent integration over stdio |
| [`bridgent serve <file>`](#serve) | Spawn `node <file>`, with TS support | shared HTTP server (when the file calls `createHttpServer`) |
| [`bridgent inspect <file>`](#inspect) | Open the official MCP Inspector against your server | debugging tool calls without an LLM |

## A common point of confusion

**`bridgent dev` and `bridgent serve` are the same implementation.** They both `spawn` Node on your file with stdio inherited. The transport is determined by **what your file does**, not by which CLI command runs it:

- File calls `createStdioServer` → speaks stdio
- File calls `createHttpServer` → listens on HTTP
- File calls `createWebHandler` and adapts to a Node listener → also HTTP

`dev` and `serve` exist as separate names purely to match user intent (local hacking vs. running a process). They produce the same child process. If `bridgent serve foo.ts` doesn't bind a port, the server file never called `createHttpServer`.

## TypeScript without a build step

For `.ts`, `.tsx`, `.mts` files, all three commands pass these flags to Node:

```
--experimental-strip-types --no-warnings=ExperimentalWarning
```

This requires **Node ≥ 22.18**. Lower versions fail at install (the workspace has `engines-strict=true`). No `tsx`, no `ts-node`, no compile step — Bridgent uses Node's built-in stripper.

If you hit a project that doesn't yet have Node 22.18, switch with `nvm use 22.18` or `volta install node@22.18`.

## `dev`

```bash
bridgent dev ./server.ts
# or
bridgent dev ./server.js
```

- Inherits stdio (your `console.log` shows up in the host's logs)
- Forwards `SIGINT` / `SIGTERM` to the child
- Exits with the child's exit code

Use this from the IDE's `command` config — Claude Code, Cursor, Codex CLI, Gemini CLI all support spawning a binary.

## `serve`

```bash
bridgent serve ./server.ts
```

Identical to `dev` — see the [confusion note above](#a-common-point-of-confusion). The name exists so launchd / systemd / pm2 / Docker units can use the more conventional verb.

## `inspect`

```bash
bridgent inspect ./server.ts
```

Wraps the official [`@modelcontextprotocol/inspector`](https://github.com/modelcontextprotocol/inspector) and connects it to your server file over stdio. It opens a browser window letting you list tools, send `tools/call` payloads, and view traces — no LLM in the loop.

Under the hood:

```bash
# pnpm shells:
pnpm dlx @modelcontextprotocol/inspector node --experimental-strip-types --no-warnings=ExperimentalWarning ./server.ts

# fallback:
npx -y @modelcontextprotocol/inspector node --experimental-strip-types --no-warnings=ExperimentalWarning ./server.ts
```

So `bridgent inspect` is the same as those commands; it just saves you the typing. See [Inspect](./inspect) for usage walkthrough.
