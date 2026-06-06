# Cursor

[Cursor](https://cursor.sh) configures MCP via **Settings → MCP → Add new MCP server** (which writes to `~/.cursor/mcp.json`).

## stdio

```jsonc
{
  "mcpServers": {
    "bridgent-hello": {
      "command": "bridgent",
      "args": ["dev", "/abs/path/to/server.ts"]
    }
  }
}
```

After saving, hit the green dot to connect; Cursor will list the tools in the chat composer's "@" menu.

## HTTP

Cursor versions that support remote MCP also accept:

```jsonc
{
  "mcpServers": {
    "bridgent-hello": {
      "url": "http://127.0.0.1:3333/mcp"
    }
  }
}
```

## Troubleshooting

- Server shows red dot → click it to see stderr; nine times out of ten the path is wrong or Node is below 22.18
- "No tools" but server is green → make sure you're in **Agent** mode (not the legacy "Chat" mode); MCP tools are agent-mode only on most builds
- Confirm with [Cursor's MCP docs](https://docs.cursor.com/) for the latest schema if it differs
