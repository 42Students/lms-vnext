# chat-4 — Projects and College Admin adversarial defects

Date: 2026-10-18. This is the chat-4-owned defect record (not the squad-wide shared file).
Validation: source review and committed behavioural/source-guard tests; cloud test/typecheck result **pending**. The container has no repository checkout and cannot run the project suite.

| ID | Severity | Reproduction / invariant broken | Fix commit | Regression test | Status |
|---|---|---|---|---|---|
| PROJ-BREAK-COL-RETRY-01 | S1 — reliability / duplicate-submit | The same College Admin project-summary PATCH, retried after a lost successful HTTP response, compared the old `expectedUpdatedAt` before recognizing persisted equality and returned `PROJECT_SUBMISSION_CONFLICT`. No-op retries should return the existing row without another audit or notification. | `f9559af`, `53337d9` | `tests/unit/PROJ-BREAK-chat4-college-summary.test.ts` | Fixed; CI pending |
| PROJ-BREAK-COL-SCOPE-01 | S1 — scope | `requireTeamCreationAuthority` previously checked `projects.manage` but did not require a platform Super Admin to have a selected college. Because an unscoped Super Admin has broad policy permission, a forged `collegeId` could target a different college in this College Admin workspace flow. It now checks `getProjectAdminCollegeId(context)` against the DB-loaded college before proceeding. Organization is independently checked against the persisted college by `requirePermission`. | `7af06bc` | `tests/unit/PROJ-BREAK-chat4-college-create-scope.test.ts` | Fixed; CI pending |
| COL-academic-setup-R03 | S2 — navigation | Academic periods were required before batches/classes but had no own College Academic Setup tab; the tab was remapped to Departments, making prerequisite setup harder to discover. Kept the existing six numbered steps. | `dbda544` | `tests/unit/chat4-college-academic-people-gap-closure.test.ts` | Fixed; CI pending |
| COL-course-tabs-17 | S3 — accessibility | The content preview metadata list lacked the explicit accessible section label required by its page contract. No private storage identifiers were added. | `2da2701` | `tests/unit/chat4-college-course-tabs-gap-closure.test.ts` | Fixed; CI pending |

## Open verification and risks

- Run the repository's strict TypeScript check and targeted Vitest suite in cloud CI; this environment cannot perform them.
- Expand from model/route-guard tests to real PostgreSQL College Admin integration journeys using chat-17's fixtures: session expiry, membership revocation mid-transaction, cross-tenant IDs, concurrent PATCH and class-team creation, rollback, deduped notification delivery.
- Review unscoped Super Admin access on other project mutations with the squad lead; this fix intentionally narrows only the College Admin class-team entrypoint rather than rewriting global Super Admin permissions.
- Full College module ledger, Super Admin colleges/tenants audit and UX coverage remain partially open.
