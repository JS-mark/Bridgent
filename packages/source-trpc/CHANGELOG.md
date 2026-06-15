# @bridgent/source-trpc

## 0.3.0

### Minor Changes

- Add the initial tRPC source adapter.
  - Query procedures are exposed as MCP tools by default.
  - Mutation procedures remain hidden unless `allow.mutating: true` and `allow.tools` explicitly allow final generated tool names.
  - Subscription procedures are not exposed.
  - Zod object inputs are reused as MCP input schemas.
  - Unsupported input parser shapes fail during tool generation instead of falling back to permissive `any`.
