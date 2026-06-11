# Prisma relation writes v0.2.4 design

## Context

`@bridgent/source-prisma@0.2.2` introduced audited Prisma write tools.
`@bridgent/source-prisma@0.2.3` hardened that path with JSONL audit and
same-process idempotent replay. The remaining documented gap is relation input
coverage: create/update schemas currently expose only scalar fields, so valid
Prisma nested writes such as `author: { connect: { id: 1 } }` are rejected by
the generated Zod schema before Prisma can run.

## Goal

Add narrow relation write input support for the mutating tools that Prisma
supports with nested writes:

- `create.data`
- `update.data`
- `upsert.create`
- `upsert.update`

The feature must preserve the existing safety model:

- writes remain opt-in through `allow.mutating: true`
- final tool names still require `writes.allowTools`
- preview token, audit, idempotency, and large-impact guardrails remain unchanged
- no raw SQL or arbitrary relation traversal is introduced

## Supported nested relation shape

For object relation fields whose target model is present in DMMF:

```ts
// single relation
author: {
  connect: { id: 1 },
  create: { email: 'a@example.com' },
}

// list relation
posts: {
  connect: [{ id: 1 }],
  create: [{ title: 'First post' }],
}
```

Rules:

- `connect` uses the target model's existing unique-where schema.
- `create` uses a shallow create-data schema for the target model.
- The shallow nested create schema contains scalar create fields only; it does
  not recursively include relation fields.
- List relations accept either a single value or an array for `connect` /
  `create`; Prisma accepts array form and the single-value form is ergonomic for
  LLM tools.
- Relation fields are optional.

## Explicit non-goals

- No nested relation writes for `createMany`; Prisma does not support them.
- No nested relation writes for `updateMany`; Prisma does not support them.
- No nested `disconnect`, `set`, `delete`, `deleteMany`, `update`, `updateMany`,
  `upsert`, or `connectOrCreate` in this patch.
- No recursive nested create graph. The first patch is intentionally one level.
- No relation `include` / nested read support.

## Implementation notes

1. Extend the local DMMF field subset with optional Prisma relation metadata:
   `relationName`, `relationFromFields`, `relationToFields`.
2. Add helpers in `schema.ts`:
   - object relation field discovery
   - target-model lookup by `field.type`
   - shallow create-data schema builder
   - relation operation schema builder
3. Split update-data schema usage:
   - `update` and `upsert.update` use relation-aware update data.
   - `updateMany` stays scalar-only.
4. Keep `createMany` scalar-only.
5. Cover with schema tests and one tool-level test that proves nested relation
   args pass through unchanged to Prisma.

## Documentation updates

- `packages/source-prisma/CHANGELOG.md`
- `packages/source-prisma/README.md`
- `apps/docs/changelog.md`
- `apps/docs/zh/changelog.md`
- `apps/docs/guide/from-prisma.md`
- `apps/docs/zh/guide/from-prisma.md`
- `docs/roadmap.md`
- `docs/progress.md`
- `docs/design/prisma-writes-v0.2.md`
