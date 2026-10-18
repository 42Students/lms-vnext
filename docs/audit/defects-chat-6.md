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
