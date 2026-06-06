# Gemini CLI

[Gemini CLI](https://github.com/google-gemini/gemini-cli) 通过 `~/.gemini/settings.json` 支持 MCP。

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

重启 Gemini CLI → 工具会在 Agent 提示中可用。

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

## 故障排查

- 服务已注册但工具缺失 → 验证 `bridgent --version`;较旧的 Gemini CLI 构建期望旧的 SSE 传输 —— 升级 Gemini CLI 或运行 Bridgent 的 `streamable-http` 模式(v0.1+ 默认)
- Windows 上的路径问题 → 在 `args` 中给路径加引号,并使用正斜杠
- 配置 schema 以 [Gemini CLI 文档](https://github.com/google-gemini/gemini-cli) 为准
