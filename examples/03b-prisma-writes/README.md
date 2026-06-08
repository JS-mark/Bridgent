# 03b-prisma-writes

SQLite + Prisma write-side example with Bridgent's two-step preview protocol.

## Setup

```bash
cd examples/03b-prisma-writes
cp .env.example .env
pnpm setup
```

## Run

```bash
pnpm start
```

This server exposes the normal read tools plus exactly these write tools:

- `db_user_create`
- `db_user_update`
- `db_post_updateMany`
- `db_comment_deleteMany`

All other Prisma write tools stay hidden because they are not listed in `writes.allowTools`.

## Preview then commit

First call a write tool with `dryRun: true`:

```json
{
  "data": {
    "email": "new@example.com",
    "name": "New User"
  },
  "dryRun": true
}
```

The result contains `preview.affectedCount`, `preview.exceedsThreshold`, and `previewToken`.
Commit by calling the same tool again with the same write arguments plus that token:

```json
{
  "data": {
    "email": "new@example.com",
    "name": "New User"
  },
  "previewToken": "pt_..."
}
```

If `preview.exceedsThreshold` is `true`, the commit call must also include:

```json
{ "confirmLargeImpact": true }
```

Audit events are written to stderr so they do not corrupt the stdio MCP stream.
