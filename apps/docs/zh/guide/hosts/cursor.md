# Cursor

[Cursor](https://cursor.sh) 通过 **设置 → MCP → 添加新 MCP 服务器** 配置 MCP(它会写入 `~/.cursor/mcp.json`)。

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

保存后,点绿色圆点连接;Cursor 会在聊天输入框的 "@" 菜单中列出工具。

## HTTP

支持远程 MCP 的 Cursor 版本同样接受:

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

- 服务显示红点 → 点击查看 stderr;十次有九次是路径写错或 Node 低于 22.18
- "没有工具" 但服务是绿色 → 确认你在 **Agent** 模式(不是旧的 "Chat" 模式);多数版本的 MCP 工具只在 Agent 模式可用
- 若 schema 不一致,以 [Cursor 的 MCP 文档](https://docs.cursor.com/) 为准
