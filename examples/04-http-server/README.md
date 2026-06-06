# 04-http-server

最小 HTTP MCP server 示例 — 让 example 01 的 `add` / `echo` 工具改走 Streamable HTTP。

## Run

```bash
pnpm install
pnpm --filter @bridgent-examples/04-http-server start
# → MCP HTTP server listening at http://127.0.0.1:3333/mcp
```

## Talk to it

把 MCP Inspector 连到 HTTP endpoint：

```bash
pnpm dlx @modelcontextprotocol/inspector
# 在 UI 中选择 "Connect to URL" → http://127.0.0.1:3333/mcp
```

或者直接 curl JSON-RPC（注意先 `initialize` 拿 `Mcp-Session-Id`）：

```bash
SID=$(curl -si -X POST http://127.0.0.1:3333/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"curl","version":"0"}}}' \
  | awk '/Mcp-Session-Id/ {print $2}' | tr -d '\r')

curl -s -X POST http://127.0.0.1:3333/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H "Mcp-Session-Id: $SID" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
```
