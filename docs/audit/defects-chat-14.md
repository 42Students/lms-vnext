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


## 2026-10-18 lead hardening delta (merged `main` into lane before editing)

| ID | Severity | Evidence / behavioural risk | Lead fix commit | Regression (authored, not executed) | Verification |
|---|---|---|---|---|---|
| PROJ-DEF-014-02 / PROJ-BREAK-MENTOR-05 | S1 lifecycle | `meetingNotesEditable` previously permitted edits on a COMPLETED project; the write service delegates directly to this helper under project + meeting row locks, and the page rendered the editor for the same disallowed state. | `3637306d`, `ddbcfc6f` | `PROJ-BREAK-chat14-mentor-lead-hardening.test.ts` (state matrix), `PROJ-BREAK-chat14-mentor-notes-page.test.tsx` (rendered role/state visibility) | Real PostgreSQL revoked-role / completed-project write test and cloud CI **pending** |
| PROJ-DEF-014-03 / PROJ-BREAK-MENTOR-06 | S2 defensive boundary | The exported activity pagination helper accepted zero, negative and nonfinite pages, producing invalid offsets if called outside the request schema. | `87269084` | `PROJ-BREAK-chat14-mentor-lead-hardening.test.ts` page clamps and schema rejection | CI **pending** |
| PROJ-DEF-014-04 / PROJ-BREAK-MENTOR-07 | S2 export capacity | The portfolio CSV model trusted the caller-supplied row length; the current route caps at 200, but a future service/route caller could emit an unlimited CSV. | `7af1c979` | `PROJ-BREAK-chat14-mentor-lead-hardening.test.ts` 203-row cap, omitted count, formula injection and invalid dates | CI and large-export perf **pending** |
| PROJ-BREAK-MENTOR-08..12 | Behavioural proof expansion | New runtime assertions for latest delivery version selection, project subject ID precedence over untrusted metadata, persisted review evidence, write-schema tenant/actor injection rejection and CSV/URL privacy. No source defect claimed for these cases. | Test `76c70310` | `PROJ-BREAK-chat14-mentor-lead-hardening.test.ts` | Service-backed test / CI / DB **pending** |
| PROJ-BREAK-MENTOR-13..15 | Mentor page coverage | The meeting outcome page has rendered matrix checks for active/completed, empty result and denial propagation. Mocked dependencies cannot prove real auth or HTTP error mapping. | Test `3fd63b82` | `PROJ-BREAK-chat14-mentor-notes-page.test.tsx` | Browser keyboard/phone/a11y + real auth **pending** |

### Cross-lane breaker reconciliation, source and regression status

- **chat-6:** `docs/audit/defects-chat-6.md` reports source fixes and authored tests for `PROJ-BREAK-state-04` and `grading-03`, `file-08/09/10`, plus file-readiness, submission, and notification boundary cases. These fixes have regression files, but the upload-completion / deletion CAS retry cases require concurrent PostgreSQL execution. **Open:** draft-update optimistic token (simultaneous team edits may overwrite each other); the lead has not implemented or certified client/API/DB CAS parity.
- **chat-9:** `docs/audit/defects-chat-9.md` records admin URL normalization, lifecycle close/lock guard, filtered export and bounded query fixes with adversarial source/runtime tests. **Open:** cross-tenant DB replay, archive race and independently reviewed source changes.
- **chat-13:** `docs/audit/defects-chat-13.md` records the tenant-scoped Super Admin lock actor fix, denied-action UI, invalid action gate and full status matrix. **Open S1 product parity:** Super Admin without College Admin membership cannot create an auditable delivery lock because `project_delivery_events.actor_membership_id` is non-null. Requires an approved actor-user schema/audit migration; do not impersonate a College Admin. Placement-policy / drive races are also not PostgreSQL-certified.
- **chat-17:** PostgreSQL fixtures and harness exist as source. Their mere presence does not prove integration tests executed. All raw HTTP/DB state machine checks remain release gates.

### Sign-off remains blocked

No runtime checkout or authenticated app/CI runner is exposed in this session. Every new test is **authored/unrun**, not green. The canonical ledger still has extensive GAP rows (module exports, API handlers, pages); rendered meeting-notes coverage is only one page. More than 90% Projects branch coverage, two-writer races, expired sessions, real signed URLs, device accessibility, full mentor permission matrix, release-notification exactly-once and external reviewer approval are not verified. No IIT Dharwad release approval can be inferred.
