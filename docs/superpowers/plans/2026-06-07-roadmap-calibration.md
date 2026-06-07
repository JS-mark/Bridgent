# Roadmap calibration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish `docs/roadmap.md` as the current planning source, supersede stale CLI package-name decisions, and align public/agent/release docs with the actual v0.1 alpha scope.

**Architecture:** Keep historical plans immutable; add a current roadmap and superseding ADR. Public docs should describe shipped features conservatively and route future scope into roadmap language.

**Tech Stack:** Markdown, VitePress docs, existing docs archive layout.

**Source spec:** `docs/superpowers/specs/2026-06-07-roadmap-calibration-design.md`.

**Pre-flight:**
- This is a documentation/planning task.
- Runtime code should not be changed by this plan.
- Existing dirty runtime changes may be present from adjacent work; do not revert them.

---

## Ground Truth

### Current v0.1 alpha

- Shipped sources: Zod, OpenAPI 3.x, Prisma 6.x read-only.
- Shipped transports: stdio, Streamable HTTP, Web Standard fetch handler.
- Shipped CLI commands: `bridgent dev`, `bridgent serve`, `bridgent inspect`.
- CLI npm package: `@bridgent/cli`.
- CLI binary: `bridgent`.

### Roadmap, not shipped

- `bridgent init`
- `bridgent expose`
- Drizzle source
- tRPC source
- GraphQL source
- Prisma writes
- API-key auth and OAuth2 PKCE
- custom inspector UI
- hosted control plane

---

## Task 1: Create Current Roadmap

- [x] Add `docs/roadmap.md`.
- [x] State that old proposal files and archived plans are historical context.
- [x] List v0.1 shipped capabilities.
- [x] List v0.1 non-goals explicitly.
- [x] Define v0.2 priorities:
  - CLI onboarding
  - source expansion
  - OpenAPI API-key auth
  - Prisma write design
  - inspector improvements
- [x] Define v0.3+ ecosystem directions.
- [x] Add planning rules for future docs and ADR usage.

## Task 2: Supersede Stale ADRs

- [x] Add ADR-027 for `@bridgent/cli` package + `bridgent` binary.
- [x] Mark ADR-007 superseded by ADR-027.
- [x] Update ADR-024 to point to ADR-027 for CLI package naming.
- [x] Update ADR-025 publishable package list to use `@bridgent/cli`.

## Task 3: Align Internal Docs

- [x] Update `docs/README.md` to link the active roadmap.
- [x] Add a roadmap calibration entry to `docs/progress.md`.
- [x] Update `docs/release-checklist.md` to use `@bridgent/cli` for release verification and rollback.
- [x] Update `AGENTS.md` and `CLAUDE.md`:
  - link `docs/roadmap.md`
  - use `@bridgent/cli` in filter/build commands
  - document package name vs binary name

## Task 4: Align Public English Docs

- [x] Update `README.md` roadmap copy.
- [x] Update `apps/docs/index.md` to describe only shipped sources as shipped.
- [x] Update `apps/docs/guide/what-is-bridgent.md`:
  - remove shipped claims for Drizzle/tRPC/GraphQL
  - state OpenAPI v0.1 Bearer auth only
  - update roadmap language
- [x] Update `apps/docs/guide/getting-started.md` next steps.
- [x] Update `apps/docs/guide/inspect.md` to avoid stale v0.5 timing.

## Task 5: Align Public Chinese Docs

- [x] Update `apps/docs/zh/index.md` to describe only shipped sources as shipped.
- [x] Update `apps/docs/zh/guide/what-is-bridgent.md`.
- [x] Update `apps/docs/zh/guide/getting-started.md` install command and next steps.
- [x] Update `apps/docs/zh/guide/inspect.md`.
- [x] Update `apps/docs/zh/guide/hosts/claude-code.md` global install hint.

## Task 6: Add Superpowers Tracking

- [x] Add `docs/superpowers/specs/2026-06-07-roadmap-calibration-design.md`.
- [x] Add `docs/superpowers/plans/2026-06-07-roadmap-calibration.md`.
- [x] Ensure both files distinguish current roadmap from historical plans.

## Task 7: Validation

- [x] Run `pnpm --filter @bridgent/docs lint`.
- [x] Run `pnpm --filter @bridgent/docs build`.
- [x] Search public docs for stale package/install claims.
- [x] Leave historical `docs/plans/` and older `docs/superpowers/` content unchanged.

---

## Completion Notes

This plan was created after the roadmap calibration edits so it records the final execution state. Future planning changes should start with a matching Superpowers spec and plan before editing docs.
