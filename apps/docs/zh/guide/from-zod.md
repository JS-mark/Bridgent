# 从 Zod 接入

最简的 Bridgent 服务:一个函数加一个 Zod schema。`defineTool` 让 `run` 函数体获得完整的 TypeScript 类型推导;运行时会自动序列化你的返回值。

## 快速开始

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

`bridgent dev ./server.ts` 服务就跑起来了。

## `defineTool` 签名

```text
defineTool({
  name: string
  description?: string
  inputSchema: z.ZodObject<Shape>
  run: (input: z.infer<z.ZodObject<Shape>>) => Output | Promise<Output>
})
```

- **`name`** — MCP 工具名。起一个 LLM 能猜到的名字:`search_orders`,而不是 `so_v3`。
- **`description`** — 一句话讲清这个工具做什么。LLM 靠它决定**要不要**调用。
- **`inputSchema`** — 必须是 `ZodObject`(Zod v4)。Bridgent 把它的 `.shape` 传给 MCP SDK,这样每个输入字段都会单独以参数形式出现,带描述和类型。
- **`run`** — 同步或异步皆可。参数类型由 `inputSchema` 自动推导——你不必手写。

## 返回值规则

`run` 可以返回任何能 JSON 序列化的值:

| 你返回的 | LLM 看到的 |
|---|---|
| `'hello'` (字符串) | text content `"hello"` |
| `{ sum: 3 }` (对象) | text content `'{"sum":3}'` |
| `42` (数字) | text content `"42"` |
| `[1, 2, 3]` (数组) | text content `"[1,2,3]"` |

运行时通过 `JSON.stringify` 把非字符串转成字符串。如果需要更丰富的响应(多个 text 块、图片),请直接用 MCP SDK——`defineTool` 走的是最简路径。

## 错误处理

如果 `run` 抛错(同步或异步),MCP SDK 会向 host 返回错误响应;Bridgent 不会拦截或包装错误。对于希望模型推理处理的预期失败,**返回**一个错误信封,而不是抛错:

```ts
defineTool({
  name: 'lookup_user',
  inputSchema: z.object({ id: z.string() }),
  run: async ({ id }) => {
    const user = await db.user.findUnique({ where: { id } })
    if (!user) {
      return { ok: false, error: 'not_found' }
    }
    return { ok: true, user }
  },
})
```

这与 `@bridgent/source-openapi` 和 `@bridgent/source-prisma` 处理上游错误的模式一致——服务在失败时保持运行,同时给模型足够的信息去自我纠正。

## 类型推导

`inputSchema` 决定 `run` 的参数类型:

```ts
defineTool({
  name: 'echo',
  inputSchema: z.object({
    message: z.string(),
    repeat: z.number().int().min(1).default(1),
  }),
  run: ({ message, repeat }) => message.repeat(repeat),
  //     ^? message: string
  //                ^? repeat: number  (default applied)
})
```

`run` 上不需要手写类型注解——TypeScript 从 schema 自动推导。

## 组合使用

多个 `defineTool` 调用一起进同一个 `tools: []` 数组。可以与 `fromOpenApi` / `fromPrisma` 的结果自由混合——见 [数据源总览](/zh/guide/sources-overview)。
