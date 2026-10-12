# Direct-main build and database witness fixes — 2026-10-12

**Scope:** Independent non-migration repair work on latest `42Students/lms-vnext/main`. No task-claim reassignment, schema barrel, numbered Drizzle journal or force-push.

## Runtime corrections

- Academic HTTP forbidden mapping / merged concurrent additions: `987896c7`.
- Nullable academy module scope chain: `62d9cc8f`.
- Mentor attention project identity, four alert kinds and unit regression: `9ee13685`, `83798497`.
- Assessment action-state review property, nullable attendance nested grid and nullable mentor email: `34cc7a27`, `1b8eb1f1`, `fae90033`.
- Assignment FILE submission sequence/FILE mode: `7faa3ba4`, `8f61b00e`.
- Faculty delivery academic period bounds used by attendance: `66527078`.
- Learner course instructor/announcement null fallbacks: `be0be1c0`, `7335881e`, `b7756af1`.

## Hardening of test proof

- Skills catalog PostgreSQL fixture now rejects implicit app-DB fallback, checks disposable service target, and asserts expected result shape: `49a1c332`.
- Admin quick actions heterogeneous step fixtures: `78b88a36`.
- Permission matrix includes profile-verification.review and verifies TPO only with same-college delegation plus feature flag: `98ddb2d5`.
- Optional identity phone fixtures and legal DISABLED platform-state fixtures: `2d954127`, `40bc9672`, `3c4c884b`, `54ca6994`.
- DB03 cross-college fixture type: `c93237ad`.
- DB03 project-team negative test reaches correct parent-integrity guard using an independent BUS group, not an illegal immutable-kind UPDATE: `47fcd3e6`.

## Evidence, not invented certification

18/18 read-only in-process JavaScript source assertions passed against retrieved current-main files. This is **source-only evidence**. No native TypeScript, Vitest, Playwright, build, disposable PostgreSQL replay, or two-session race execution was performed in this execution environment. Historical failed CI reference: https://github.com/42Students/lms-vnext/actions/runs/38259723278 (53 compile diagnostics before this batch). High-frequency main pushes cancel many newer runs; require a completed pinned-head rerun for real acceptance. The original DATABASE phase, unverified DB implementation tasks and migration ownership remain unchanged by these fixes.

Other workers independently repaired `scripts/db-e2e-prepare.ts` environment typing and the DB06 PostgreSQL witness UUID argument narrowing; those are intentionally not credited to this batch.
