# CLI

Bridgent 提供三个命令,都是 `node` 的轻量包装:

| 命令 | 做什么 | 常见用法 |
|---|---|---|
| [`bridgent dev <file>`](#dev) | 用 TS 支持 spawn `node <file>` | 通过 stdio 做本地 IDE Agent 集成 |
| [`bridgent serve <file>`](#serve) | 用 TS 支持 spawn `node <file>` | 共享 HTTP 服务器(当文件调用 `createHttpServer` 时) |
| [`bridgent inspect <file>`](#inspect) | 对你的服务器打开官方 MCP Inspector | 不带 LLM 调试工具调用 |

## 一个常见误解

**`bridgent dev` 和 `bridgent serve` 是同一份实现。** 两者都在你的文件上 `spawn` Node 并继承 stdio。传输由**你的文件做了什么**决定,而不是由哪个 CLI 命令启动它:

- 文件调用 `createStdioServer` → 走 stdio
- 文件调用 `createHttpServer` → 监听 HTTP
- 文件调用 `createWebHandler` 再适配到 Node listener → 也是 HTTP

`dev` 和 `serve` 作为两个名字存在,仅仅是为了贴合用户意图(本地试玩 vs. 跑进程)。它们产生的是同一个子进程。如果 `bridgent serve foo.ts` 没绑定端口,那是因为 server 文件根本没调 `createHttpServer`。

## TypeScript 无需构建

对于 `.ts`、`.tsx`、`.mts` 文件,三个命令都把这些 flag 传给 Node:

```
--experimental-strip-types --no-warnings=ExperimentalWarning
```

需要 **Node ≥ 22.18**。更低版本会在安装时失败(workspace 设置了 `engines-strict=true`)。没有 `tsx`、没有 `ts-node`、不需要构建步骤 —— Bridgent 用 Node 内置的 stripper。

如果你的项目还没用 Node 22.18,用 `nvm use 22.18` 或 `volta install node@22.18` 切换。

## `dev`

```bash
bridgent dev ./server.ts
# or
bridgent dev ./server.js
```

- 继承 stdio(你的 `console.log` 会出现在 host 日志里)
- 把 `SIGINT` / `SIGTERM` 转发给子进程
- 用子进程的退出码退出

在 IDE 的 `command` 配置里使用——Claude Code、Cursor、Codex CLI、Gemini CLI 都支持 spawn 一个二进制。

## `serve`

```bash
bridgent serve ./server.ts
```

与 `dev` 实现一致 —— 见上面的 [一个常见误解](#一个常见误解)。这个名字存在是为了让 launchd / systemd / pm2 / Docker 单元能用更常见的动词。

## `inspect`

```bash
bridgent inspect ./server.ts
```

包装官方的 [`@modelcontextprotocol/inspector`](https://github.com/modelcontextprotocol/inspector),通过 stdio 连接到你的 server 文件。它会打开浏览器窗口,让你列出工具、发送 `tools/call` 载荷、查看 trace —— 全程不需要 LLM。

底层是这样:

```bash
# pnpm shells:
pnpm dlx @modelcontextprotocol/inspector node --experimental-strip-types --no-warnings=ExperimentalWarning ./server.ts

# fallback:
npx -y @modelcontextprotocol/inspector node --experimental-strip-types --no-warnings=ExperimentalWarning ./server.ts
```

所以 `bridgent inspect` 等价于上面那些命令,只是帮你省了几下敲键。使用走查见 [探查与调试](/zh/guide/inspect)。
