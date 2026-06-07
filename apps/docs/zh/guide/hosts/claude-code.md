# Claude Code

[Claude Code](https://www.anthropic.com/claude-code) 通过 `~/.claude.json` 配置消费 MCP 服务器。

## stdio(本地开发推荐)

在 `~/.claude.json`(macOS / Linux)或 `%USERPROFILE%\.claude.json`(Windows)中添加:

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

重启 Claude Code → 它的工具选择器现在会显示 `add` 和 `echo`。

## HTTP(Streamable)

已经在跑 `bridgent serve ./server.ts`?

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

## 故障排查

- 工具不在选择器里 → 确认 `bridgent --version` 能跑通(也就是它在 PATH 上)
- `command not found: bridgent` → `pnpm i -g @bridgent/cli`
- HTTP 连不上 → 检查服务日志输出的是 `127.0.0.1:3333`,而不是 `0.0.0.0`
- 若你的版本不一样,以 [Claude Code 文档](https://docs.anthropic.com/) 为准核对 schema
