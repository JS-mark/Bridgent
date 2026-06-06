# Changesets

Bridgent AI uses [Changesets](https://github.com/changesets/changesets) to drive npm releases.

## When to add a changeset

Whenever a PR changes anything user-visible in a publishable package
(`bridgent`, `@bridgent/core`, `@bridgent/source-openapi`, `@bridgent/source-prisma`).

## How

```bash
pnpm changeset
```

Pick the affected packages, choose `patch` / `minor` / `major`, and write a one-paragraph
summary. The four packages are **linked** — they always release the same version, so a
single bump on any of them moves them all forward.

The resulting markdown lives in this directory and gets consumed by `changesets/action`
(see `.github/workflows/release.yml`):

1. Push to `main` with new changeset(s) → Action opens / updates a "Version Packages" PR
2. Merge the Version PR → packages are published to npm and a GitHub Release is created

See `docs/release-checklist.md` for the full release procedure.
