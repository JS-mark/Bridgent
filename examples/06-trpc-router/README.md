# 06-trpc-router

tRPC router example for `@bridgent/source-trpc`.

## Run

```bash
pnpm start
```

`bridgent dev` starts a stdio MCP server, so there is no HTTP URL to open.
Use Inspector to list and call tools:

```bash
pnpm exec bridgent inspect ./server.ts
```

The default server exposes only query procedures:

- `trpc_user_getById`

Mutations stay hidden by default.

## Mutating variant

```bash
pnpm start:mutating
```

Inspect it with:

```bash
pnpm exec bridgent inspect ./server-mutating.ts
```

The mutating variant opts in explicitly and allowlists exactly one final generated tool name:

- `trpc_user_updateName`
