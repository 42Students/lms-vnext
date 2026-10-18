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
| PROJ-BREAK-MENTOR-16..20 | Service permission / concurrency proof | Mocked transactional service tests now check stale edit, active row-lock ordering, wrong role and cross-college/organization rejection, no audit event on denied/invalid state. These are isolated service tests, not a real PG race. | `b3085be4`, `6e860a32` | `PROJ-BREAK-chat14-mentor-notes-service.test.ts` | Real PostgreSQL two-user race, HTTP/session revocation, persistent audit exactly-once **pending** |
| PROJ-BREAK-MENTOR-13..15 | Mentor page coverage | The meeting outcome page has rendered matrix checks for active/completed, empty result and denial propagation. Mocked dependencies cannot prove real auth or HTTP error mapping. | Test `3fd63b82` | `PROJ-BREAK-chat14-mentor-notes-page.test.tsx` | Browser keyboard/phone/a11y + real auth **pending** |

### Cross-lane breaker reconciliation, source and regression status

- **chat-6:** `docs/audit/defects-chat-6.md` reports source fixes and authored tests for `PROJ-BREAK-state-04` and `grading-03`, `file-08/09/10`, plus file-readiness, submission, and notification boundary cases. These fixes have regression files, but the upload-completion / deletion CAS retry cases require concurrent PostgreSQL execution. **Open:** draft-update optimistic token (simultaneous team edits may overwrite each other); the lead has not implemented or certified client/API/DB CAS parity.
- **chat-9:** `docs/audit/defects-chat-9.md` records admin URL normalization, lifecycle close/lock guard, filtered export and bounded query fixes with adversarial source/runtime tests. **Open:** cross-tenant DB replay, archive race and independently reviewed source changes.
- **chat-13:** `docs/audit/defects-chat-13.md` records the tenant-scoped Super Admin lock actor fix, denied-action UI, invalid action gate and full status matrix. **Open S1 product parity:** Super Admin without College Admin membership cannot create an auditable delivery lock because `project_delivery_events.actor_membership_id` is non-null. Requires an approved actor-user schema/audit migration; do not impersonate a College Admin. Placement-policy / drive races are also not PostgreSQL-certified.
- **chat-17:** PostgreSQL fixtures and harness exist as source. Their mere presence does not prove integration tests executed. All raw HTTP/DB state machine checks remain release gates.

### Sign-off remains blocked

No runtime checkout or authenticated app/CI runner is exposed in this session. Every new test is **authored/unrun**, not green. The canonical ledger still has extensive GAP rows (module exports, API handlers, pages); rendered meeting-notes coverage is only one page. More than 90% Projects branch coverage, two-writer races, expired sessions, real signed URLs, device accessibility, full mentor permission matrix, release-notification exactly-once and external reviewer approval are not verified. No IIT Dharwad release approval can be inferred.


## New lead findings: IST calendar and history pagination (2026-10-18)

| ID | Severity | Source risk / observed divergence | Fix commits | Regression | Release proof |
|---|---|---|---|---|---|
| PROJ-DEF-014-05 / PROJ-BREAK-MENTOR-21 | S1 scheduling integrity | `mentorMeetingScheduleError` accepted calendar-shaped strings by constructing a `Date` and checking only finiteness, so some runtimes normalize nonexistent IST wall dates (February 30, April 31, 24:00). The UI could show one time while persisting another. | `96cef5d8`, `76c0aa16` | `tests/unit/PROJ-BREAK-chat14-mentor-time-history.test.ts`: leap day, impossible dates, 23:59 IST, exact now/end order | Run full Vitest and real meeting HTTP/DB replay; **not executed** |
| PROJ-DEF-014-06 / PROJ-BREAK-MENTOR-22 | S2 pagination resiliency | Review, task and team history exported pagination helpers accepted negative/NaN/infinite requested page, and team history accepted zero/huge page size. Callers normally validate URLs but helpers must not create invalid offsets on alternate direct calls. | `903f44fd`, `bc95f9c1`, `632a309c` | `tests/unit/PROJ-BREAK-chat14-mentor-time-history.test.ts`: direct-call abuse, query validation, normal 10/20 page sizes | Run cloud CI and DB bounded-offset integration; **not executed** |

### Rolling chat-14 CI failures: source-shape contract reconciliation

The rolling `docs/orchestrator/unit-failures-latest.md` listed seven failing chat-14 test files. This branch updated **assertions to preserve or strengthen the underlying safeguards rather than undoing the safer application code**: active `SUBMITTED` and column/college consent required before applicant PII or resume exposure; full verified-marks college visibility; `DataTable` mobile-priority/accessible `ScrollCue` semantics rather than removed local overflow markup; explicit `getProjectAdminCollegeId` scoped permission guard on create; parsed filters/error recovery and shared page controls for Projects admin surfaces. Fix test commits: `96986d6c`, `7d33e56f`, `5f7a99e1`, `df88f3bd`, `af6cc501`, `0ad65aca`, `d82e15ae`, `166f8296`. The cloud runner **has not verified these tests pass**; retain failure status until a new successful run.

Release status remains **BLOCKED**: hundreds of ledger GAP symbols/pages/handlers still lack complete behavioural proof, PostgreSQL integration and cross-lane review are unavailable, and chat-6 draft update CAS and chat-13 membershipless Super Admin delivery lock actor migration remain unresolved.


## Mentor board export direct-call defense

| ID | Severity | Evidence | Change | Regression | CI |
|---|---|---|---|---|---|
| PROJ-DEF-014-07 / PROJ-BREAK-MENTOR-27 | S2 export resiliency | `mentorBoardReview` hands the current routes 500 tasks / 100 Sprints, but the exported `mentorBoardExportCsv` and `mentorSprintSummaryCsv` formatters previously trusted an unbounded caller array and inconsistent `omitted` values. Any future route/service bypass could generate oversized reports and erase the truncation indicator. | `12c97f77`: defensive 500 / 100 cap and internally computed excess, finite nonnegative omitted counts; caller-facing project headings unchanged. | `38b12afc`: 503-task/103-Sprint inputs, formula injection, stable status and sprint totals, hostile query, scoped export URLs. | Authored, **NOT run**; PostgreSQL and report UI comparison pending |

The coverage ledger maps these six previously unmapped board-review exports to authored behavioural assertions but still contains many GAP entries. The independent review/CI/blocking release gates above remain unchanged.


## Follow-up: Mentor services, calendar and scoped exports — 18 October 2026

| Defect / gap | Severity | Evidence and correction | Change / regression | Remaining gate |
|---|---|---|---|---|
| PR-S2-11 | S1 regression contract | Earlier cloud failure still demanded a negated `MENTOR_ONLY` filter although learner list now correctly uses a **positive** ACTIVE + TEAM linked-resource allowlist. Kept the stricter production check and replaced the outdated test with list + direct guessed-UUID grant contract coverage, including scan cleanliness and expiring read URLs. | `1242d6a2`, `tests/unit/projects-phase2-file-visibility-guard.test.ts` | HTTP wrong-role and PostgreSQL orphan/archived resource tests unrun |
| PROJ-BREAK-MENTOR-32 | S1 fail-open enum handling | Meeting reschedule predicate allowed unknown string project statuses because it only excluded ARCHIVED and COMPLETED. Restrict to PLANNED/ACTIVE with scheduled/rescheduled meeting. | `72b29cd1`, `PROJ-BREAK-chat14-mentor-reports-attention.test.ts` | Cloud CI, actual meeting routes, complete project transition tests |
| PROJ-BREAK-MENTOR-33 | S2 direct helper pagination | `mentorTaskReviewSummary` accepted zero/negative/nonfinite pages or sizes from direct callers; clamp to valid 1–50 sizes, nonnegative totals and finite bounded page. | `286a0415`, `PROJ-BREAK-chat14-mentor-reports-attention.test.ts` | Cloud CI and DB limit-offset |
| PROJ-BREAK-MENTOR-34 | S2 export hardening | Mentor report CSV formatter trusted an unbounded caller array and threw on an invalid Date, despite 100-row cap in report projection. Formatter now independently caps at 100, reports all excess, renders unknown times safely and neutralizes formulas. | `085f1524`, `PROJ-BREAK-chat14-mentor-reports-attention.test.ts` | Cloud CI, export and page exact-count comparison |
| PROJ-BREAK-MENTOR-40 | S2 unsafe link | `safeMentorMeetingJoinUrl` accepted credential-bearing http(s) URLs; rejects embedded usernames and passwords before exposing the link. | `ccded102`, `PROJ-BREAK-chat14-mentor-calendar-resources.test.ts` | Browser opening and same-origin/destination tests |
| PROJ-BREAK-MENTOR-35..39,41..45 | Behavioural coverage, not separate source defects | Tests cover roster-scoped attention options, report filters/counts, escaped literal query text, IST wall-time conversion, midnight calendar filters, pending-vs-missed semantics, 500-meeting export cap, 200-resource export cap, data-only CSV and rejected hostile tenant filters. | `289b64ee`, `9645b374`; mapped to `docs/audit/coverage/projects-ledger.md` | Every test authored/unrun; PostgreSQL, real service permission matrix and browser tests pending |

**Certification:** The rolling cloud report may predate these commits. No check status was delivered for these commits through the connected repository session, and tests must not be marked green. The canonical ledger retains remaining behavioural service/route/page GAPs; role/session/tenancy races, signed URL fault injection, PostgreSQL migration/rollback, independent reviewer and accessibility runs remain required.


## Lead export-handler and persisted-review hardening

| ID | Severity | Evidence and correction | Commit / regression | Outstanding |
|---|---|---|---|---|
| PROJ-BREAK-MENTOR-55..58 | S2 input bypass / export integrity | Four Mentor GET exports (board, Sprint summary, reports, final-delivery review) used `URLSearchParams.get`; repeating `status` silently selected the first value and unrecognized/forged `projectId`, `collegeId`, `page` were ignored. The routes now use `singleValueMentorExportFilters` with explicit individual allowlists and a cache-disabled 400 on duplicates or unknown fields; immutable project scope always comes from the path + service authorization. | `93aa9df7`, `3be747e8`, `b5572392`, `a8be4258`; mocked HTTP runtime tests `e96b1154`, heading assertion `d30e2af2`. | Real auth/cross-tenant GET, malformed value mapping and browser CSV tests not run |
| PROJ-BREAK-MENTOR-59 | S2 grade/report integrity | Review overview count treated any non-null decision as a persisted review, even unrecognized values; restrict to APPROVED/CHANGES_REQUESTED. Direct delivery audit CSV accepted unbounded arrays and could throw on malformed Date; 200-record cap, explicit truncated count, and safe date text now enforced. | `6b66d422`, `tests/unit/PROJ-BREAK-chat14-mentor-delivery-meetings.test.ts`. | PostgreSQL verification and screen/export comparison unrun |
| PROJ-BREAK-MENTOR-60..63 | S2 resilience / hostile query | Direct team-meeting pagination now clamps invalid pages; runtime tests exercise persisted review labeling, URL scope preservation, percent/underscore/backslash SQL pattern escaping and duplicate/unrecognized export filters. | `1b05fd6f`, test `3b3d3655`. | Real DB/HTTP and accessibility unrun |

Cloud tests/typecheck and independent review remain required. These are authored fixes and assertions, not certification.


## Mentor page runtime tests and legacy transition correction

| Gap | Severity | Evidence / result | Fix and regression | Verification |
|---|---|---|---|---|
| PROJ-BREAK-MENTOR-64..75 | S2 page trust and UX | Mentor reports and Team coverage pages previously collapsed repeated query values by taking the first (including conflicting same-value duplicates). Both now reject multi-value filters with an actionable invalid-filter view before any data fetch. Render tests exercise malformed/duplicated query, unauthorized role, disabled module, empty roster, populated scoped data, safe navigation, partial export and service denial. | `146f49a9`, `a1b982db`, `c1af67bb`, `018b6d4b` | Mocked server-render tests authored/unrun; true HTTP session expiry, mobile keyboard and browser tests pending |
| PROJ-BREAK-MENTOR-76..82 | Coverage | Added runtime state matrix for recognized task estimate units, permitted SUBMITTED/ACTIVE review, version rendering, closeout readiness (including archived and negative counts), review-token/confirmation, and archive-last sorting with unknown progress. | `05e09da6` | Behaviour authored/unrun; actual PostgreSQL services and E2E still open |
| PROJ-BREAK-state-04 | S1 stale regression test | `mentor-final-delivery-decision-model.test.ts` still expected a Mentor to review a SUBMITTED final delivery on a COMPLETED project; current hardening policy correctly forbids this. Retained the ACTIVE success case and added explicit COMPLETED/PLANNED denials rather than reverting the fix. | `ee5ba6e8` | New cloud Vitest feedback pending |

The canonical ledger additionally links existing inspected runtime assertions for 12 previously incorrectly unmapped portfolio, activity, export and work-filter symbols. Mapping a test is **not** proof of 90% branch coverage or a passing CI build.


## Export GET and Mentor JSON mutation follow-up (2026-10-18)

| ID | Severity | Reproduced source gap and correction | Fix and test | Verification |
|---|---|---|---|---|
| PROJ-BREAK-MENTOR-99..101 | S2 request ambiguity | Remaining sprint-progress and task-review-history CSV routes silently used the first repeated key from `URLSearchParams.get` and ignored unknown scope parameters; now reject duplicate/unrecognized controls with a no-store 400 and parse only explicit supported filters. | `44299cc8`, `50efb0ec`, `tests/unit/PROJ-BREAK-chat14-mentor-more-export-routes.test.ts` | Mocked route test authored/unrun, actual session/tenant/PG snapshot tests pending |
| PROJ-BREAK-MENTOR-103..107 | S1 unbounded input and error UX | Mentor Project Overview PATCH and Final Delivery Lock POST called unbounded `request.json()` unlike other mentor mutation routes. Both now use strict UTF-8 `readMentorProjectCommandBody` (128 KiB cap, JSON content type, explicit 400/413/415 friendly errors) after same-origin guard. | `f6ba33e5`, `fdddf553`, `tests/unit/PROJ-BREAK-chat14-mentor-command-routes.test.ts` | Authored origin-first/malformed/over-limit/unsupported/valid-once tests, unrun; DB, server status/error mappings and revoked-session E2E pending |
| PROJ-BREAK-MENTOR-83..98 | Coverage expansion | Rendered role-denied/disabled/invalid/partial Mentor Reviews/Task Reviews and service authorization matrices for assigned vs foreign project, role revocation and no read when module disabled. | `e2431ba5`, `5fd952d6`; mapped canonical ledger | Runtime assertions authored but not executed; underlying PostgreSQL permissions, exact tenancy race and browser keyboard remain open |

The lead inspected existing PostgreSQL integration sources `mentor-project-closeout.test.ts`, `projects-p7b-meetings.test.ts`, `mentor-project-activity-export.test.ts` and mapped their four service exports to the ledger. These tests require a disposable `TEST_DATABASE_URL`; mapping them does not imply execution, transaction concurrency proof or IIT Dharwad release readiness.
