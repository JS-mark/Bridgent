# Release Checklist

Bridgent AI ships through **manual `pnpm changeset publish` from the
maintainer's machine**. The previous GitHub Actions release workflow
was removed in favour of this flow because npm's 2FA + provenance
combination kept rejecting CI publishes; doing it locally with an
authenticator app is just simpler and more reliable.

---

## Pre-flight

- [ ] `main` is green (CI all checks pass)
- [ ] `pnpm turbo run lint typecheck test build` passes locally on Node 24
- [ ] `pnpm --filter @bridgent/host-test test` passes (cross-host protocol harness)
- [ ] `pnpm changeset status` shows the changeset(s) you expect
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

```bash
# 1) Bump versions + regenerate CHANGELOGs from pending changesets
pnpm changeset version
git add .
git commit -m "chore(release): version packages"
git push

# 2) Build everything fresh — `changeset publish` does NOT build for you
pnpm install
pnpm turbo run build

# 3) Publish — will prompt for OTP per package
pnpm changeset publish

# 4) Push tags created by changesets — this also triggers
#    .github/workflows/github-release.yml to create a GitHub Release
#    per package tag, with notes pulled from the matching CHANGELOG.md.
git push --follow-tags
```

Expected during step 3:

```
🦋  info Publishing "@bridgent/cli" at "0.X.0"
Enter OTP from your authenticator: ______
🦋  success @bridgent/cli@0.X.0
🦋  info Publishing "@bridgent/core" at "0.X.0"
Enter OTP: ______
...
```

## Post-release

- [ ] Verify packages on npm: `npm view @bridgent/cli version` etc — should match this release
- [ ] Smoke test: `pnpm dlx @bridgent/cli --version` → matches release
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
