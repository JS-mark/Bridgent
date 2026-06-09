# Changesets

Bridgent AI uses [Changesets](https://github.com/changesets/changesets) to drive npm releases.

## When to add a changeset

Whenever a PR changes anything user-visible in a publishable package
(`@bridgent/cli`, `@bridgent/core`, `@bridgent/source-openapi`, `@bridgent/source-prisma`, `@bridgent/source-drizzle`).

## How

```bash
pnpm changeset
```

Pick the affected packages, choose `patch` / `minor` / `major`, and write a one-paragraph
summary. Version numbers should follow the package that actually changed. Do not bump
unaffected packages just to keep every package on the same number; for example,
`@bridgent/source-prisma@0.2.3` is a source-prisma-only patch after
`@bridgent/source-prisma@0.2.2` had already shipped.

The resulting markdown lives in this directory and is consumed by the manual release flow:

1. Run `pnpm changeset version` only when there are pending changesets that still need
   to update `package.json` and `CHANGELOG.md`.
2. Run `pnpm changeset publish` from the maintainer machine after build verification.
3. Push tags with `git push --follow-tags` so package GitHub Releases are created.

See `docs/release-checklist.md` for the full release procedure.
