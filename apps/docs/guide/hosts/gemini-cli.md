# Gemini CLI

[Gemini CLI](https://github.com/google-gemini/gemini-cli) supports MCP via its `~/.gemini/settings.json`.

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

Restart Gemini CLI → tools become available in agent prompts.

## HTTP

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

- Server registered but tools missing → verify `bridgent --version`; older Gemini CLI builds expected the legacy SSE transport — upgrade Gemini CLI or run Bridgent's `streamable-http` mode (default in v0.1+)
- Path issues on Windows → quote the path in `args` and use forward slashes
- See [Gemini CLI docs](https://github.com/google-gemini/gemini-cli) for the canonical schema
