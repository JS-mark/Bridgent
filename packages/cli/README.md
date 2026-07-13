# @bridgent/cli

> Bridgent CLI — create, run, and inspect MCP server files.

```bash
pnpm add -D @bridgent/cli @bridgent/core zod
bridgent init ./server.ts
bridgent dev ./server.ts
bridgent inspect ./server.ts
```

`bridgent inspect` prints best-effort source/capability hints and host config snippets, then launches the official MCP Inspector.

Requires Node `>= 22.18` (uses native `--experimental-strip-types` for TypeScript).
