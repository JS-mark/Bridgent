# 01-zod-hello

最小 Bridgent 示例：用 Zod 描述两个工具（`add`, `echo`），通过 stdio 暴露为 MCP server。

## 跑

```bash
pnpm install
pnpm --filter @bridgent-examples/01-zod-hello start
```

## 用 MCP Inspector 验证

```bash
pnpm dlx @modelcontextprotocol/inspector \
  bridgent dev ./examples/01-zod-hello/server.ts
```
