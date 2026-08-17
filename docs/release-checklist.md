# Release Checklist

Bridgent AI ships through **manual `pnpm changeset publish` from the
maintainer's machine**. The previous GitHub Actions release workflow
was removed in favour of this flow because npm's 2FA + provenance
combination kept rejecting CI publishes; doing it locally with an
authenticator app is just simpler and more reliable.

---

## Pre-flight

- [ ] `main` is green (CI all checks pass)
- [ ] `pnpm check` passes locally on Node 24 (the same build, test, typecheck,
      and lint gate used by CI)
- [ ] `pnpm audit:prod` reports no high-severity production dependency advisories
- [ ] `pnpm --filter @bridgent/host-test test` passes (cross-host protocol harness)
- [ ] Before running `pnpm changeset version`, `pnpm changeset status` shows
      the changeset(s) you expect. After versioning, this command is expected
      to report changed packages without changeset files; verify `package.json`,
      `CHANGELOG.md`, and `npm pack --dry-run` instead.
- [ ] All examples (`examples/0{1..5}-*`) start without errors
- [ ] `apps/docs` builds locally (`pnpm docs:build`)

## Maintainer machine setup (one-time)

```bash
npm login --registry=https://registry.npmjs.org/
# → opens browser → authenticate as `js-mark` → enter OTP → done
npm whoami --registry=https://registry.npmjs.org/
# → js-mark
```

Make sure your authenticator app is to hand — every `npm publish`
will prompt for an OTP because the npm account has 2FA scope set to
"Authorization and publishing".

## Release flow

Bridgent uses independent package versions (`fixed` and `linked` are empty in
`.changeset/config.json`), so version skew between packages is expected. Treat
`pnpm changeset status` as the source of truth for the packages and versions in
each release; do not reuse a package list from an earlier release.

```bash
# 1) If there are pending changesets, bump versions + regenerate CHANGELOGs.
#    If package.json + CHANGELOG.md have already been versioned, skip this command.
pnpm changeset version

# 2) Commit version/changelog/docs changes, then push after review
git add .
git commit -m "chore(release): version packages"
git push

# 3) Reinstall from the committed lockfile and run the same full gate as CI.
#    `changeset publish` does not build or test for you.
pnpm install --frozen-lockfile
pnpm check

# 4) Publish unpublished package versions — will prompt for OTP per package
pnpm changeset publish

# 5) Push tags created by changesets — this also triggers
#    .github/workflows/github-release.yml to create a GitHub Release
#    per package tag, with notes pulled from the matching CHANGELOG.md.
git push --follow-tags
```

Expected during step 4 (the exact package names and versions come from
`pnpm changeset status`):

```
🦋  info Publishing "@bridgent/<package>" at "<version>"
Enter OTP: ______
```

## GitHub Actions configuration

The current manual npm publishing flow requires no repository secret to be
configured. `GITHUB_TOKEN` is supplied automatically by GitHub and is used only
by `github-release.yml` after a maintainer pushes package tags. `DOCS_BASE` and
`NPM_CONFIG_REGISTRY` are non-secret workflow configuration values.

If CI publishing is reintroduced, configure exactly one of these authentication
paths manually under repository Settings → Secrets and variables → Actions:

- OIDC trusted publishing: no npm token; grant the release job
  `id-token: write` and configure each package's trusted publisher on npm.
- Token publishing: add `NPM_TOKEN` as a repository or environment secret.

Never commit either credentials or one-time passwords.

## Post-release

- [ ] For every package reported by `pnpm changeset status`, verify the published
      version with
      `npm view @bridgent/<package> version --registry=https://registry.npmjs.org/`
- [ ] Smoke test the installed CLI, metadata probe, and changed source adapters from a clean temp project
- [ ] Confirm <https://github.com/JS-mark/Bridgent/releases> auto-created one Release per package tag (the `github-release.yml` workflow handles it). Tweak titles or add highlights at the top of any Release if the auto-extracted CHANGELOG section needs polish.
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

Don't `npm unpublish` — npm restricts unpublish after 72h. Use
`deprecate` and ship a fix release.

## When (if ever) to re-introduce CI publishing

Two paths each remove the rough edges that pushed us to manual:

1. **OIDC trusted publishing** — configure each package on npm
   (`https://www.npmjs.com/package/<name>/access` → "Add a trusted
   publisher" → GitHub Actions / Org `JS-mark` / Repo `Bridgent` /
   Workflow filename / Environment). Then publish from a workflow
   with `id-token: write`; no `NPM_TOKEN` needed.
2. **Granular access token with the "Allow this token to bypass
   two-factor authentication" toggle ENABLED** when generating it.
   The toggle defaults to OFF, which is exactly what trips up CI runs
   on accounts that have publish-scope 2FA.

Either way, restore `release.yml` from git history (it lived at
`.github/workflows/release.yml` before this commit) and adapt.

The `github-release.yml` workflow is unaffected — it only reacts to
tag pushes and doesn't touch npm, so it stays useful regardless of
whether npm publishing is local or CI-driven.
