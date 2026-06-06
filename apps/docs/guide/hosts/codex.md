# OpenAI Codex CLI

[OpenAI Codex CLI](https://github.com/openai/codex) reads its config from `~/.codex/config.toml`.

## stdio

```toml
[[mcp_servers]]
name = "bridgent-hello"
command = "bridgent"
args = [
  "dev",
  "/abs/path/to/server.ts"
]
```

Reload Codex (`/reload` or restart) — `add` and `echo` show up in the tool list.

## HTTP

```toml
[[mcp_servers]]
name = "bridgent-hello"
transport = "streamable-http"
url = "http://127.0.0.1:3333/mcp"
```

## Troubleshooting

- Codex doesn't see the server → check `codex --version` against the latest release; older builds might not yet support MCP
- TOML parse error → make sure `args` is a string array, not a single string
- See [Codex CLI docs](https://github.com/openai/codex) for the canonical config schema
