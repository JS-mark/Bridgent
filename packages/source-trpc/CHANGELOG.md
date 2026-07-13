# @bridgent/source-trpc

## 0.3.1

### Patch Changes

- Add optional Bridgent tool metadata for source identity, read/write capability, safety controls, and limits.

  Generated OpenAPI, Prisma, Drizzle, and tRPC tools now attach low-risk metadata for CLI/docs/inspector consumers. `bridgent inspect --probe` explicitly enables a short best-effort metadata probe before launching the official MCP Inspector, then prints grouped source/tool hints, copyable host snippets, and warnings for mutating tools, missing audit metadata, or very large generated tool surfaces when metadata is available.

### Patch Changes

- Updated dependencies
  - @bridgent/core@0.3.0

## 0.3.0

### Minor Changes

- Add the initial tRPC source adapter.
  - Query procedures are exposed as MCP tools by default.
  - Mutation procedures remain hidden unless `allow.mutating: true` and `allow.tools` explicitly allow final generated tool names.
  - Subscription procedures are not exposed.
  - Zod object inputs are reused as MCP input schemas.
  - Unsupported input parser shapes fail during tool generation instead of falling back to permissive `any`.
