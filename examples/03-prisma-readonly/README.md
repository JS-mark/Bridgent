# 03-prisma-readonly

把一个 SQLite + Prisma schema 一行命令暴露为 read-only MCP server。

## Setup

```bash
cd examples/03-prisma-readonly
cp .env.example .env

# 第一次运行：generate client、apply migrations、灌假数据
pnpm setup
```

## Run

```bash
pnpm start
```

预期能看到 `db_user_findMany` / `db_post_count` / `db_comment_aggregate` 等工具。
**`db_*_create` / `db_*_delete` / `findRaw` 等永远不会出现**（v0.1 仅 read-only，且 raw SQL 永久禁用）。

## Inspect

```bash
pnpm dlx @modelcontextprotocol/inspector \
  bridgent dev ./server.ts
```

测试用例：

- `tools/call db_user_findMany { take: 5 }` → 返回 alice + bob
- `tools/call db_post_count { where: { published: { equals: true } } }` → 返回 1
- `tools/call db_user_findMany { take: 999999 }` → 返回所有用户 + `meta.warning: take clamped from 999999 to 10000`

## 想暴露写操作？

```ts
fromPrisma({ client, allow: { mutating: true } })
```

⚠️ **v0.1 还没实现写工具工厂**，这条 flag 现在是 no-op；v0.2 会加上 create/update/delete/upsert，但配合 audit log。
