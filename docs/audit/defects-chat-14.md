# chat-14 — Projects hardening defects and release gates

**Date:** 2026-10-18. **Lead:** chat-14. All findings are source-reviewed and regression tests authored, **NOT** executed or cross-lane signed off in this GitHub-only environment. Never infer release readiness from authored tests.

| ID | Severity | Evidence / user-visible risk | Fix commits | Regression | Acceptance |
|---|---|---|---|---|---|
| PROJ-DEF-014-01 / PROJ-BREAK-release-race-01 | S1 concurrency / data integrity | `writeMentorProjectRelease` accepted DELETE with a null body, and `mentor-release-editor.tsx` deleted without an `expectedUpdatedAt` token. A stale open tab could delete a release edited since the tab was loaded, despite row-level locks. The PATCH operation had a timestamp guard, but DELETE did not. | `4caf2d4`, `12aba72`, `dcf9bbb`, `588f10f`, `b25dcd3` | `tests/unit/PROJ-BREAK-mentor-release-cas-chat14.test.ts`, mentor service and route guard assertions | Verify stale DELETE returns a friendly 409/appropriate mapped error with no removal or audit event; same-version DELETE succeeds once; concurrent PATCH/DELETE never loses a later change; exercise actual PostgreSQL transactions and HTTP |
| PROJ-CI-014-01 | S2 CI contract drift | Legacy seven Mentor project tabs grew an intentional Delivery workspace. Two legacy-copy tests still asserted exactly seven tab keys. Keep all original seven in their order **plus** the Delivery tab; do not remove the feature or legacy wording. | `f951b55`, `fff99da` | `projects-phase2-exact-tabs.test.ts`, `projects-phase2-legacy-labels.test.ts` | Rerun Vitest; compare legacy seven and Delivery accessibility |
| PROJ-CI-014-02 | S2 test implementation drift | Responsive HR profile/reports screens now use the shared `DataTable` with `mobilePriority` rather than old bespoke `overflow-x-auto`/`md:block` markup. Old tests asserted discarded layout implementation. Replaced with stricter semantic caption, mobile-priority, scoped access, and filter tests. | `d2c646b`, `a5040ef`, `c2d8a67` | `ux-chat14-high-risk-contracts.test.ts`, `ux-chat14-hr-01.test.ts`, `ux-chat14-hr-03.test.ts` | Run Vitest and verify actual mobile keyboard behavior |

## Cross-lane findings reviewed

- **chat-9:** `docs/audit/projects-defects.md` documents tenant isolation, release/archive, race, CSV formula injection, and storage failures fixed at source; actual PG race tests and independent reviews are still mandatory.
- **chat-6:** `docs/audit/coverage/projects-breaker-chat6-ledger.md` reports authored adversarial state, auth, export and resilience tests, not executed certification.
- **chat-13:** `docs/audit/defects-chat-13.md` documents Super Admin acting-college delivery lock actor constraints and **unresolved membershipless lock parity** requiring a durable audited actor schema design; do not impersonate a College Admin.
- **chat-17:** `docs/audit/coverage/chat-17-projects-placements-pg-ledger.md` has PostgreSQL harness fixtures and example tests, but actual database runs and cross-account HTTP replay are outstanding.

## Blocking release acceptance

1. `docs/audit/coverage/projects-ledger.md` lists 263 project TypeScript module files, 91 Project/Mentor API route files, and 63 relevant page entries; per-symbol expansion and behavioural closure have **not** finished. Every GAP must remain visible.
2. Neither Vitest nor TypeScript strict checking, real HTTP requests, PostgreSQL, signed URL storage, 1,000-project EXPLAIN, browser/a11y runs could be executed here; the GitHub connection can read and write repository files but supplies no runtime checkout/CI invocation for these checks.
3. The separate review requirement is unmet for chat-14's source fix. Do not mark Projects IIT Dharwad hardening as complete or sell-ready until a different lane reviews the code and cloud/DB/device acceptance passes.
