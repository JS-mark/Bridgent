# 从 tRPC 接入

把 tRPC router procedure 暴露为 MCP 工具,无需把它们重写成手写 Zod 工具。

## 快速开始

```ts
import { createStdioServer } from '@bridgent/core'
import { fromTrpc } from '@bridgent/source-trpc'
import { appRouter } from './router'

await createStdioServer({
  name: 'trpc-app',
  version: '0.0.1',
  tools: fromTrpc({
    router: appRouter,
    createContext: () => ({ userId: 'demo-user' }),
  }),
})
```

## 会暴露什么

- `query` procedure 默认变成只读工具。
- `mutation` procedure 默认隐藏。
- `subscription` procedure 不会暴露。

Procedure 路径 `user.getById` 会变成工具名 `trpc_user_getById`。用 `toolPrefix` 可以替换默认前缀:

```ts
fromTrpc({
  router: appRouter,
  toolPrefix: 'app',
})
```

这会生成类似 `app_user_getById` 的工具名。

## 显式开启 mutation

Mutation 必须同时经过总开关和最终工具名 allowlist:

```ts
fromTrpc({
  router: appRouter,
  allow: {
    mutating: true,
    tools: ['trpc_user_updateName'],
  },
})
```

Allowlist 使用最终生成的工具名,与 Prisma 写工具 allowlist 保持一致。

## 输入 schema

Bridgent 会把 Zod v4 object 输入映射为 MCP input schema。没有输入的 procedure 会得到空的 strict object schema。

不支持的 opaque parser shape 会在工具生成阶段失败。这是有意设计:Bridgent 不会生成宽泛的 `any` 工具输入。

## 选项

| 选项 | 用途 |
|---|---|
| `router` | tRPC v10/v11 router 对象 |
| `createContext` | 每次工具调用时执行的同步或异步 context factory |
| `toolPrefix` | 生成工具名的前缀。默认 `trpc` |
| `procedureFilter` | 针对 procedure path 的 RegExp 或函数过滤器 |
| `allow.mutating` | 暴露 mutation procedure 前必须开启 |
| `allow.tools` | 允许暴露的最终 mutation 工具名 |
