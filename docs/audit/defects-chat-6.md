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
