# 快速开始

::: warning 先决条件
- Node **≥ 22.18**(Bridgent 使用原生 `--experimental-strip-types` 直接运行 TS,无需构建步骤)
- pnpm **≥ 10**
:::

## 1. 安装

```bash
pnpm add -D bridgent @bridgent/core zod
```

## 2. 定义你的第一个工具

创建 `server.ts`:

```ts
import { createStdioServer, defineTool } from '@bridgent/core'
import { z } from 'zod'

await createStdioServer({
  name: 'hello',
  version: '0.0.1',
  tools: [
    defineTool({
      name: 'add',
      description: 'Add two numbers',
      inputSchema: z.object({
        a: z.number(),
        b: z.number(),
      }),
      run: ({ a, b }) => ({ sum: a + b }),
    }),
  ],
})
```

## 3. 运行它

```bash
bridgent dev ./server.ts
```

搞定 —— 你的文件现在就是一个走 stdio 的 MCP 服务器。

## 4. 在 Claude Code 中使用

把这段加到 `~/.claude.json`(或你的 IDE-agent 配置):

```json
{
  "mcpServers": {
    "hello": {
      "command": "bridgent",
      "args": ["dev", "./server.ts"]
    }
  }
}
```

重启 Claude Code,你就能在工具选择器里看到 `add`。

## 5. 用官方 Inspector 验证

```bash
pnpm dlx @modelcontextprotocol/inspector bridgent dev ./server.ts
```

Inspector 让你列出工具、发送 `tools/call`、查看结果,全程不需要 LLM 介入。

## 后续步骤

- 浏览[示例](https://github.com/js-mark/bridgent/tree/main/examples)
- 路线图:OpenAPI / Prisma / Drizzle / tRPC 数据源、HTTP 传输、策略 DSL
