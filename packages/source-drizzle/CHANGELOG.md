# @bridgent/source-drizzle

## 0.3.0

### Minor Changes

- Add optional Bridgent tool metadata for source identity, read/write capability, safety controls, and limits.

  Generated OpenAPI, Prisma, Drizzle, and tRPC tools now attach low-risk metadata for CLI/docs/inspector consumers. `bridgent inspect --probe` explicitly enables a short best-effort metadata probe before launching the official MCP Inspector, then prints grouped source/tool hints, copyable host snippets, and warnings for mutating tools, missing audit metadata, or very large generated tool surfaces when metadata is available.

### Patch Changes

- Updated dependencies
  - @bridgent/core@0.3.0

## 0.2.1

### Patch Changes

- Updated dependencies [c5eebf2]
  - @bridgent/core@0.2.1

## 0.2.0

### Minor Changes

- [#2](https://github.com/JS-mark/Bridgent/pull/2) [`54c9773`](https://github.com/JS-mark/Bridgent/commit/54c9773773bb091b4f9dfe0532db55b3e97f1f38) Thanks [@JS-mark](https://github.com/JS-mark)! - Complete v0.2 scope with atomic `bridgent init` writes, OpenAPI API-key auth, and a read-only Drizzle source adapter.
