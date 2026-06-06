# 02-openapi-petstore

把 OpenAPI 3.1 官方的 PetStore spec 一行命令暴露为 MCP server。零 auth，最快出 demo。

## Run

```bash
pnpm install
pnpm --filter @bridgent-examples/02-openapi-petstore start
```

## Inspect

```bash
pnpm dlx @modelcontextprotocol/inspector \
  bridgent dev ./examples/02-openapi-petstore/server.ts
```

预期能看到 `findPetsByStatus`、`getPetById` 等 GET 工具；`addPet` / `updatePet` 等写操作**默认不暴露**（read-only by default）。
