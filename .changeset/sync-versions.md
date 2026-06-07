---
"@bridgent/core": patch
"@bridgent/source-prisma": patch
---

Catch `@bridgent/core` and `@bridgent/source-prisma` up to the rest of
the workspace. Linked versioning bumps every publishable package in
lockstep, so `@bridgent/cli`, `@bridgent/source-openapi`, and
`@bridgent/source-drizzle` also receive a no-op patch release that
exists purely to keep all five packages on the same version line.

No behaviour changes in this release.
