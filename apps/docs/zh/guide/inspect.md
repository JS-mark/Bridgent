# 探查与调试

Bridgent 提供 `bridgent inspect` 命令,会启动接好你服务器的官方 **[MCP Inspector](https://github.com/modelcontextprotocol/inspector)**。

```bash
bridgent inspect ./server.ts
```

它在内部等价于:

```bash
pnpm dlx @modelcontextprotocol/inspector node --experimental-strip-types ./server.ts
```

Inspector 会打开一个浏览器窗口,你可以:

- 浏览所有已注册的工具及其输入模式
- 用任意参数发送 `tools/call` 并查看响应
- 回放一条 JSON-RPC trace
- 在 stdio(默认)与 HTTP 之间切换

::: tip 为什么不做自定义 UI?
v0.1 故意复用官方 Inspector —— 它能用、有人维护,且覆盖了 80% 的调试场景。一个 Bridgent 专属的 inspector(带数据源分组、鉴权提示、Prisma trace)仍在路线图上,但不应阻塞数据源与 onboarding 工作。
:::

## 探查远程 HTTP 服务器

如果你已经用 `bridgent serve` 启动了一个,可以直接通过 Inspector 的 UI 把 URL 喂给它:选择 **"Connect to URL"**,输入 `http://127.0.0.1:3333/mcp`。
