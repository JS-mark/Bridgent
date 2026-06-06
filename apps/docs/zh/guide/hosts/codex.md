# OpenAI Codex CLI

[OpenAI Codex CLI](https://github.com/openai/codex) 从 `~/.codex/config.toml` 读取配置。

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

重新加载 Codex(`/reload` 或重启)—— `add` 和 `echo` 会出现在工具列表中。

## HTTP

```toml
[[mcp_servers]]
name = "bridgent-hello"
transport = "streamable-http"
url = "http://127.0.0.1:3333/mcp"
```

## 故障排查

- Codex 看不到服务器 → 用 `codex --version` 对照最新版本;较旧的构建可能尚未支持 MCP
- TOML 解析错误 → 确认 `args` 是一个字符串数组,而不是单个字符串
- 配置 schema 以 [Codex CLI 文档](https://github.com/openai/codex) 为准
