# Chat-6 Projects and Super Admin defect log

Branch: `chatgpt/chat-6-b`. Scope: IIT Dharwad Projects breaker (files, submissions, grading, notifications), Super Admin second-third, auth/sessions.

| ID | Severity | Evidence | Correction | Regression | Validation |
| --- | --- | --- | --- | --- | --- |
| PROJ-BREAK-state-04 | S1 | `mentorFinalDeliveryCanReview("SUBMITTED", "COMPLETED")` previously returned `true`, exposing a forbidden review action on a read-only completed workspace. PLANNED status also advertised review. | Require status `SUBMITTED` in an `ACTIVE` project. Commit `8137636`. | `tests/unit/PROJ-BREAK-chat6-delivery-grade-notices.test.ts` | Source-reviewed; cloud CI pending |
| PROJ-BREAK-grading-03 | S1 | `createProjectEvaluation` locked the project row but denied only `ARCHIVED`, allowing a new evaluation after project completion. | Deny both `ARCHIVED` and `COMPLETED` within the existing PostgreSQL transaction/row lock. Commit `2d2dcad`. | `tests/unit/PROJ-BREAK-chat6-delivery-grade-notices.test.ts` | Source-reviewed; cloud CI pending |
| PROJ-BREAK-file-01 | S2 | Prior adversarial test incorrectly required a verification-phase `FAIL` event to be ignored. That would hide a storage/scan rejection; the production reducer intentionally handles this failure with friendly copy. | Strengthen regression to require a sanitized FAILED state before verification and require a verified-success state to remain terminal. Commit `a50de02`. | `tests/unit/PROJ-BREAK-chat6-state-security.test.ts` | Source-reviewed; cloud CI pending |
| PROJ-BREAK-file-06/07 | Coverage | File declaration traversal, malformed names, MIME mismatch, object-header mismatch and signed-read readiness require hostile cases. | Add boundary, MIME, magic-header and read-grant contract tests. Commit `6daa3fe`. | `tests/unit/PROJ-BREAK-chat6-delivery-grade-notices.test.ts` | Cloud CI pending |
| PROJ-BREAK-submissions-06 | Coverage | Duplicate attachments, cross-project file IDs and URL scheme injection need explicit rejection assertions. | Add Zod and persisted project/resource-scope contract tests. Commit `6daa3fe`. | `tests/unit/PROJ-BREAK-chat6-delivery-grade-notices.test.ts` | Cloud CI pending |
| PROJ-BREAK-grading-04 | Coverage | Grade bounds, integer math, case-insensitive rubric duplicates, and review feedback requirement need hostile cases. | Add behavioural schema assertions. Commit `6daa3fe`. | `tests/unit/PROJ-BREAK-chat6-delivery-grade-notices.test.ts` | Cloud CI pending |
| PROJ-BREAK-notifications-01/02 | Coverage | Review notices must not expose raw feedback and delivery audiences must be active, same-college, deduplicated recipients. | Add notice payload and persisted-scope/deduplication contract checks. Commit `6daa3fe`. | `tests/unit/PROJ-BREAK-chat6-delivery-grade-notices.test.ts` | Cloud CI pending |

## Remaining verification

Cloud typecheck, Vitest, and PostgreSQL integration suite are **not runnable via this connected GitHub API session**. The checks here are source-level and must not be represented as executed passing tests. Project storage, notification, and evaluation flows also require concurrent integration tests and external-storage fault injection on the PostgreSQL harness before release sign-off.

## Additional findings (18 October 2026)

| ID | Severity | Evidence | Correction | Regression | Validation |
| --- | --- | --- | --- | --- | --- |
| PROJ-BREAK-file-08 | S1 | Learner listing previously excluded only linked resources with `MENTOR_ONLY` visibility. `TEAM` resources in `DRAFT`/`ARCHIVED` state, or missing linked resource rows, still exposed resource file metadata despite download grants rejecting those files. | Learner listing now positively allows unlinked READY files or linked files whose resource is `ACTIVE`, `TEAM`, and in the exact project. `bdf0ae7`. | `tests/unit/PROJ-BREAK-chat6-delivery-grade-notices.test.ts` `9b80a4b` | Cloud CI pending |
| AUTH-rate-limits-01 | S1 | Unauthenticated IP throttler cleared the *entire* active map after 50,000 different keys, resetting live account protection during a spoofed-address flood. | Bounded map and periodic expired-key cleanup; fail closed for new keys at capacity and preserve active quotas. `b1c0b70`. | `tests/unit/auth-ip-rate-limit.test.ts` `4ed3086` (50,000-key adversarial load) | Cloud CI pending |
| AUTH-sessions-04 | S2 | Atomic relogin's prior-session revocation matched only credential digest; a supplied token for someone else could be revoked even though authenticated user IDs differed. | Include `AND user_id = ${userId}` in same transaction's UPDATE. `6d5adf7`. | `tests/unit/chat6-auth-session-adversarial.test.ts` `3daa0f6` / `5564d26` | Cloud CI pending |
| SA-admin-middle-applications-export-01 | S1 | Shared College/Super Admin application CSV endpoint accepted only q/status/screening despite UI supplying stage, source, department, program and batch. Exports silently included candidates outside selected filters. | Parse all supported filter dimensions through the existing strict schema before the scoped CSV service. `d4ab84b`. | `tests/unit/chat6-superadmin-middle-third-adversarial.test.ts` `d330a26` | Cloud CI pending |
| SA-admin-middle-placements-settings-01 | S2 | The Super Admin drive deadline page displayed a UTC date fragment rather than the operating timezone, risking an off-by-one local date. | Render date and time explicitly in `Asia/Kolkata`. `7acfa97`. | `tests/unit/chat6-superadmin-middle-third-adversarial.test.ts` | Cloud CI pending |

### Super Admin second-third review

All 37 identified page entrypoints in `docs/orchestrator/ui-ux/pages-admin.md` (positions 38–74, `/admin/inbound-mail` through `/admin/placements/seasons/[seasonId]`) were source-retrieved. Full interactive, cross-role and browser accessibility sign-off is **not** claimed: that requires running the application, a test database and instrumented browser against live authenticated sessions. Existing shared `AdminScopedReadPage` and `requireSuperAdminSelectedCollege` guards were inspected. Additional source-level adversarial coverage targets invalid filters, selected-college safety, export fidelity, tenant predicates and deadlines.

### Auth and session review

Source-reviewed `start`, `email`, `verify` login routes; keyed code MAC verification and atomic challenge consumption; device session creation, targeted revocation, all-other-devices sign-out, logout cookie invalidation, per-IP and DB-backed OTP rate budgets. Added `tests/unit/chat6-auth-session-adversarial.test.ts` for cryptographic separation, key-space saturation, active quota independence, tenant handoff and ownership. Multi-replica and transaction-concurrency testing is outstanding, as are complete device/browser flow automation and cloud execution.

### Validation gate

This connected GitHub session supports source fetches and commits but cannot run `tsc`, `vitest`, E2E tests, PostgreSQL or object-store fault injection. No claim is made that these additions pass CI, or that the IIT Dharwad hardening brief is entirely satisfied. The final branch requires cloud CI and independent review before merging.

## Latest concurrency findings

| ID | Severity | Evidence | Correction | Regression | Validation |
| --- | --- | --- | --- | --- | --- |
| PROJ-BREAK-file-09 | S1 | Two parallel upload-completion requests can both verify a pending object. Previously the loser of the database compare-and-swap threw `STORAGE_INVALID_STATE`, even if the winner had already moved the object to `READY`. A WAIT response racing the same successful completion was also a false upload-not-found. | Re-read the winner after CAS loss and treat `READY` as successful idempotent completion; skip duplicate `SCAN_ATTESTED` and storage cleanup on that path. Recheck READY on verification WAIT. Commit `4b3d242`. | `tests/unit/PROJ-BREAK-chat6-delivery-grade-notices.test.ts` `60a7553` | Source contract only; concurrent PostgreSQL integration pending |
| PROJ-BREAK-file-10 | S1 | Two parallel delete requests can read an active file, one soft-delete and the second get `STORAGE_INVALID_STATE` despite successful deletion; retry could show misleading failure. | On CAS loss, return the already `DELETED` row without duplicate audit event/object cleanup. Commit `6fd83eb`. | `tests/unit/PROJ-BREAK-chat6-delivery-grade-notices.test.ts` `60a7553` | Source contract only; concurrent PostgreSQL integration pending |

**Open hardening lead follow-up:** Submission draft updates currently have no client-supplied optimistic edit token, so concurrent team-member edits may use last-writer-wins. This needs coordinated client/API/DB validation by the Projects lead before release; do not count this as resolved.

## Current lane follow-up (auth + Super Admin)

| ID | Severity | Evidence | Fix | Regression | Verification |
|---|---|---|---|---|---|
| PROJ-BREAK-pages-02 | Test repair | An earlier test assumed a removed page-local `if(!membership)` gate while the current page uses `getProjectAdminCollegeId(context)` and centrally verifies `can(projects.manage)`. | Assert the actual helper and the central authorization boundary before the snapshot query (`b4f9871`). | `tests/unit/PROJ-BREAK-chat6-role-journeys.test.ts` | Cloud CI pending |
| AUTH-sessions-05 | S1 | Sign-out swallowed a PostgreSQL revocation failure and returned `{ok:true}`; client cookies were removed but stolen tokens could remain live until expiry. | Preserve client cookie/storage cleanup; return retryable HTTP 503 `LOGOUT_REVOKE_FAILED` instead of false success (`1c016b0`). | `tests/unit/chat6-auth-logout-revocation.test.ts` | Mocked HTTP behavioural test written, CI pending |
| AUTH-tenant-failclosed-01 | S1 | A domain resolver can return `{kind:"unavailable"}` during DB outage. `guardLoginRequest` only rejected `unknown`, so it admitted the request as `tenantCollegeId:null` (platform-scope fallback). | Treat `unavailable` as HTTP 503, Retry-After 30, no-store; retain explicitly configured platform hosts (`14a9879`). | `tests/unit/chat6-auth-tenant-failclosed.test.ts`; `tests/unit/chat6-auth-request-tenant-cache.test.ts` | Behavioural mocked host/route tests written, CI pending |
| GR-31 / SA-tenants-branding-01 | S2 | Branding form used `useTransition` but no synchronous lock; duplicate submits before re-render could send multiple PUTs, and network rejection could leak unhandled promise. | `savingRef` lock plus network-error toast and `finally` release (`326fb2e`). | `tests/unit/chat6-admin-write-safety-guards.test.ts` | Source assertion only, component interaction pending |
| GR-31 / SA-academics-people-batch-01 | S1 | Super Admin batch roster class move used only async React state for duplicate protection and printed arbitrary JSON error codes to users. | Add synchronous `pendingRef` lock, existing real capacity/period checks, and generic friendly fallback without raw API code (`884f0b1`). | `tests/unit/chat6-admin-write-safety-guards.test.ts` | Source assertion only, authenticated UI pending |
| AUTH-retention-01/02/03 | Coverage | Login challenge and session purge code lacked a route-specific failure/parameter regression. | Add behavioural fake-DB tests of deletion predicates, null rowCount and partial failure, plus browser notice tests (`83b3af7`). | `tests/unit/chat6-auth-retention-network.test.ts` | CI pending |

The global `GR-09/GR-31` unit gate remains unverified: additional offenders may live in other lanes' components. No allowlist changes or scanner relaxations were made. Current auth ledger is `docs/audit/coverage/chat6-auth-sessions-ledger.md`.

## Final delivery and file WAIT hardening follow-up

| ID | Severity | Evidence | Fix | Test | Remaining |
|---|---|---|---|---|---|
| PROJ-BREAK-file-11 | S1 | After an expired WAIT read but before the transaction's status update, another request could successfully transition the file to READY. The loser still returned STORAGE_UPLOAD_EXPIRED, potentially prompting a duplicate upload. | Compare-and-swap returns the current READY winner and suppresses the expired failure (`51a32f5`). | `tests/unit/PROJ-BREAK-chat6-delivery-grade-notices.test.ts` (`6dec147`) | Real concurrent PG and object-store WAIT fault injection |
| PROJ-BREAK-submissions-07 | S1 | Manual save, debounced autosave and submit were protected only by asynchronous React pending state. A rapid user sequence could dispatch overlapping PATCH/POST or submit an unsaved state. | Synchronous pendingRef serializes writes; `savedDeliverySubmissionReadiness` requires exact server-acknowledged snapshot (`0f90fcb`, `b5e4ffd`, `90bb21f`). | `tests/unit/PROJ-BREAK-chat6-saved-delivery-ui.test.ts` (`2e10611`) | Real mobile and stale-tab browser flows, version-aware draft updates |
| PROJ-BREAK-submissions-08 | S2 | Native window.confirm for final delivery did not use shared focus-managed confirmation; React passed click events to a potential confirmation boolean. | Shared ConfirmDialog with explicit `submitDraft(true)` only on confirm; event-safe click handler (`e25a4eb`, `8c47136`). | `tests/unit/PROJ-BREAK-chat6-saved-delivery-ui.test.ts` | WebView Back/Escape E2E |
| PROJ-BREAK-submissions-09 | S1 | Reopen after successful autosave could reset inputs to stale initial server props despite a newer acknowledged save, risking user-visible data loss. | Reset from latest persisted success snapshot, never old draft prop (`014d52d`). | `tests/unit/PROJ-BREAK-chat6-saved-delivery-ui.test.ts` | Full prop-refresh and multi-tab concurrency acceptance |

**Explicit outstanding S1:** Final-delivery PATCH still has no server-mandatory optimistic version token. The client-only lock prevents same-tab overlap but cannot stop **two different devices** writing stale drafts. The Projects lead must coordinate the API/schema/UI version protocol and PostgreSQL race coverage before any IIT Dharwad release sign-off.

## Shared final-delivery multi-device version protection

| ID | Severity | Root cause | Correction | Evidence/test | Validation |
| --- | --- | --- | --- | --- | --- |
| PROJ-BREAK-submissions-10 | S1 | Multiple learner clients could PATCH the same team draft with no optimistic token, silently overwriting the earlier writer despite transaction locks. | Distinct strict create vs update schemas; PATCH requires `expectedUpdatedAt`. Check token on locked submission row before attachments/activity. Revision strictly increases by at least 1 millisecond even in same-ms concurrent edits. Manual/autosave transmit the last acknowledged server timestamp and refuse an acknowledgement without a new revision. | `tests/unit/PROJ-BREAK-chat6-draft-revision-race.test.ts` | Source + pure policy assertions; concurrent PostgreSQL integration and CI remain required |
| PROJ-BREAK-submissions-11 | S1 | A stale tab could finalize a teammate's newer draft without noticing changes. | POST /submit now demands `expectedUpdatedAt` from the current saved snapshot and rejects a stale timestamp while holding the submission lock, before advancing to SUBMITTED or notifying the mentor. | Same test plus request-origin and route assertions | CI and parallel-tab browser workflow remain required |

### Compatibility and release gate

Final-delivery clients must send the most recent `updatedAt` returned by the server on each write; old clients are intentionally rejected rather than silently overwriting team data. HTTP PATCH/submit routes remain same-origin and server-authorized. The stale-write error is `PROJECT_SUBMISSION_CONFLICT`; friendly error mapping and wrong-college behavior require cloud regression. Independent PostgreSQL reviewer approval remains necessary before IIT Dharwad release.

### Teammate-created draft conflict

| ID | Severity | Evidence | Fix | Regression | Validation |
|---|---|---|---|---|---|

| PROJ-BREAK-submissions-12 | S1 | A router refresh could introduce a draft created by a different team member while this tab held unsaved local inputs. Automatically adopting its `updatedAt` would turn an unauthorized stale edit into an apparently current PATCH. | Do **not** advance any draft revision from refreshed props after mount. Only the response to this tab's successful POST/PATCH may advance the token; otherwise the user receives an explicit refresh-first error instead of overwriting teammate work (`bdcf057`). | `tests/unit/PROJ-BREAK-chat6-draft-revision-race.test.ts` (`7605b1a`) | Cloud CI + two-client integration required |


## 2026-10-19 independent auth/second-third review — new findings

| ID | Priority | Reproduction/source flaw | Committed correction | Regression | Acceptance status |
|---|---|---|---|---|---|
| AUTH-audit-metadata-01 | S2 audit integrity | `auditLogin(event,context,fields)` originally spread `...fields` **after** `component:"auth-audit"`, canonical `route` and derived `ipTag`. A future handler supplying metadata named `route` or `ipTag` could overwrite protected audit provenance with attacker-influenced values. | `src/modules/auth/http.ts`: spread free-form metadata first; security-owned fields overwrite them. Commit `8e596191`. | `tests/unit/chat6-auth-http-guard.test.ts` checks field-spoof attempt | Mocked logger unit authored, not executed; live structured-log pipeline remains unverified |
| AUTH-device-date-01 | S2 account recovery | `/account/security` mapped persisted `created_at` / `last_seen_at` through `new Date(value).toISOString()` without a validity guard. A malformed/null imported timestamp throws `RangeError` and blocks all device revocation controls for that session list. | `deviceTimestampIso` pure parse guard; page mapping and `DeviceList` fall back to `Time unavailable`. Commits `35695668`, `2cec6a99`, `fa251c82`. | `tests/unit/chat6-auth-device-date-resilience.test.ts` | Unit authored, not run. Browser device rows and real DB fixtures pending |

### Second-third Super Admin audit follow-through

All 37 routes defined by the second third of `docs/orchestrator/ui-ux/pages-admin.md` were source retrieved. The item-by-item review/coverage evidence and known missing live action tests are in `docs/audit/coverage/chat6-admin-second-third-ledger.md`. New behavior-oriented tests cover inbox, people directory, organization/college scope, lecture halls, placements and CSV query models; **no claim of 37 passing UI tests or defect-free page actions** is made.

### IIT Dharwad Projects breaker continuation

Adversarial `PROJ-BREAK-backlog-12/13` and `PROJ-BREAK-readiness-12/13` test cases were added to cover forged task/sprint IDs, strict optimistic revision, selected-college permission, locked writes, current memberships, readiness event precedence and selected-tenant audit. They are source-contract plus Zod tests, **not** a real PostgreSQL race demonstration. Source review did not justify a new Projects defect row; a real replay of stale-user revocation, cross-college selector changes and simultaneous sprint pulls is still required.

**Release status:** not signed off. Strict TypeScript, Vitest, PostgreSQL integration, browser/mobile focus and screen-reader journeys remain unexecuted per current no-CI builder directive. Do not equate authored tests with PASS.
