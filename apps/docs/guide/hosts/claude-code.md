# Claude Code

[Claude Code](https://www.anthropic.com/claude-code) consumes MCP servers through its `~/.claude.json` config.

## stdio (recommended for local dev)

Add to `~/.claude.json` (macOS / Linux) or `%USERPROFILE%\.claude.json` (Windows):

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

Restart Claude Code → its tool picker now shows `add` and `echo`.

## HTTP (Streamable)

Already running `bridgent serve ./server.ts`?

```jsonc
{
  "mcpServers": {
    "bridgent-hello": {
      "transport": "streamable-http",
      "url": "http://127.0.0.1:3333/mcp"
    }
  }
}
```

## Troubleshooting

- Tool not in the picker → confirm `bridgent --version` works (i.e. it's on PATH)
- `command not found: bridgent` → `pnpm i -g @bridgent/cli`
- HTTP not connecting → check that server logged `127.0.0.1:3333`, not `0.0.0.0`
- Verify schema in [Claude Code docs](https://docs.anthropic.com/) if your version differs
