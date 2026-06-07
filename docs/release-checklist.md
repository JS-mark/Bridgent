# Release Checklist

Bridgent AI ships through Changesets. This is the full path from a green
`main` to npm + a GitHub Release.

---

## Pre-flight

- [ ] `main` is green (CI all checks pass)
- [ ] `pnpm turbo run lint typecheck test build` passes locally on Node 24
- [ ] `pnpm --filter @bridgent/host-test test` passes (cross-host protocol harness)
- [ ] `pnpm changeset status` shows the changeset(s) you expect
- [ ] All 5 examples (`examples/0{1..5}-*`) start without errors
- [ ] `apps/docs` builds locally (`pnpm docs:build`)

## secret setup (one-time per repo)

The release workflow needs **one of**:

1. **`NPM_TOKEN`** secret — Personal Access Token from <https://www.npmjs.com/settings/REFID_009Q/tokens> with `Automation` granular scope, scoped to `@bridgent/*`.
2. **OIDC trusted publisher** (preferred for security) — configure on each npm package via `npm pkg edit` ↔ `npmjs.com/package/<name>/access` ↔ "Publishing access" → enable trusted publisher targeting `js-mark/bridgent` workflow `release.yml`.

Either way, `GITHUB_TOKEN` is provided automatically by Actions.

## Version PR flow

1. Land changeset(s) into `main`
2. `release.yml` opens / updates a PR titled **`chore(release): version packages`**
3. Review the PR — it bumps versions, regenerates `CHANGELOG.md`, and updates `workspace:*` deps to the new exact versions
4. Merge the PR
5. `release.yml` runs again on `main` — this time it publishes to npm and creates a GitHub Release per package

## Post-release

- [ ] Verify `@bridgent/cli`, `@bridgent/core`, `@bridgent/source-openapi`, `@bridgent/source-prisma`, `@bridgent/source-drizzle` are visible on npm with the right version
- [ ] Smoke test: `pnpm dlx @bridgent/cli --version` → matches release
- [ ] GitHub Release notes look right (changesets-rendered changelog)
- [ ] Re-record demo GIF if the headline UX changed (`docs/recording.md`)
- [ ] Open the launch playbook: `docs/launch/{hn,ph,twitter,v2ex,zhihu}.md` — pick channels, schedule the post

## Rollback

If a publish goes out broken:

```bash
npm deprecate @bridgent/cli@<bad-version> "Broken release; use <previous-version>"
npm deprecate @bridgent/core@<bad-version> "Broken release; use <previous-version>"
npm deprecate @bridgent/source-openapi@<bad-version> "Broken release; use <previous-version>"
npm deprecate @bridgent/source-prisma@<bad-version> "Broken release; use <previous-version>"
npm deprecate @bridgent/source-drizzle@<bad-version> "Broken release; use <previous-version>"
```

Don't `npm unpublish` — npm restricts unpublish after 72h. Use `deprecate` and ship a fix release.
