# chat-4 — Projects and College Admin adversarial defects

Date: 2026-10-18. This is the chat-4-owned defect record (not the squad-wide shared file).
Validation: source review and committed behavioural/source-guard tests; cloud test/typecheck result **pending**. The container has no repository checkout and cannot run the project suite.

| ID | Severity | Reproduction / invariant broken | Fix commit | Regression test | Status |
|---|---|---|---|---|---|
| PROJ-BREAK-COL-RETRY-01 | S1 — reliability / duplicate-submit | The same College Admin project-summary PATCH, retried after a lost successful HTTP response, compared the old `expectedUpdatedAt` before recognizing persisted equality and returned `PROJECT_SUBMISSION_CONFLICT`. No-op retries should return the existing row without another audit or notification. | `f9559af`, `53337d9` | `tests/unit/PROJ-BREAK-chat4-college-summary.test.ts` | Fixed; CI pending |
| PROJ-BREAK-COL-SCOPE-01 | S1 — scope | `requireTeamCreationAuthority` previously checked `projects.manage` but did not require a platform Super Admin to have a selected college. Because an unscoped Super Admin has broad policy permission, a forged `collegeId` could target a different college in this College Admin workspace flow. It now checks `getProjectAdminCollegeId(context)` against the DB-loaded college before proceeding. Organization is independently checked against the persisted college by `requirePermission`. | `7af06bc` | `tests/unit/PROJ-BREAK-chat4-college-create-scope.test.ts` | Fixed; CI pending |
| COL-academic-setup-R03 | S2 — navigation | Academic periods were required before batches/classes but had no own College Academic Setup tab; the tab was remapped to Departments, making prerequisite setup harder to discover. Kept the existing six numbered steps. | `dbda544` | `tests/unit/chat4-college-academic-people-gap-closure.test.ts` | Fixed; CI pending |
| COL-course-tabs-17 | S3 — accessibility | The content preview metadata list lacked the explicit accessible section label required by its page contract. No private storage identifiers were added. | `2da2701` | `tests/unit/chat4-college-course-tabs-gap-closure.test.ts` | Fixed; CI pending |

| SA-colleges-tenants-BREAK-02 | S1 — cross-tenant read | A Super Admin with `adminScope.collegeId` but missing `organizationId` could list all organizations in `listOrganizations`; selected-college branch now joins `colleges` to the persisted organization, requires active statuses, and caps to one. Conflicting organization selections return no rows. | `21ae292` | `tests/unit/PROJ-BREAK-chat4-superadmin-tenants.test.ts` | Fixed; CI pending |
| SA-colleges-tenants-BREAK-03 | S1 — scope mismatch | `listColleges` previously permitted a selected college whose persisted organization disagreed with the selected/requested organization. Added active parent join and both persisted-org predicates before returning a row. | `f6f1721` | `tests/unit/PROJ-BREAK-chat4-superadmin-tenants.test.ts` | Fixed; CI pending |
| SA-tenants-signin-RETRY-01 | S2 — duplicate submit / audit | Saving the same college sign-in method again after a successful response was lost advanced its CAS version and appended a duplicate audit event. Exact already-saved methods now return existing locked version without another write; changed methods still use CAS. | `65529eb` | `tests/unit/chat4-college-export-signin-ledger.test.ts` | Fixed; CI pending |
| COL-academic-export-INPUT-03 | S2 — bad input / resource exhaustion | `collectCollegeExportRows` accepted `pageSize=0`, `NaN`, infinity and `cap>1000` which could cause unbounded export page walks. Now validates safe integers and caps before fetching any page. | `230de1d` | `tests/unit/chat4-college-export-signin-ledger.test.ts` | Fixed; CI pending |
| SA-colleges-tenants-BREAK-01 | S3 — resilience | Invalid and repeated tenant directory filters previously still loaded college/organization DB lists before rendering validation error. Moved strict parsing before both queries. | `4f23d78`, `e09c753` | `tests/unit/PROJ-BREAK-chat4-superadmin-tenants.test.ts` | Fixed; CI pending |

| PROJ-BREAK-COL-STALE-02 | S2 — optimistic timestamp | The project-summary CAS compared `Date.toISOString()` text to client `z.iso.datetime({offset:true})` text. Equivalent instants with `+05:30` vs `Z` falsely conflict. It now compares millisecond epoch time after schema validation. | `253f38e` | `tests/unit/PROJ-BREAK-chat4-college-summary.test.ts` | Fixed; CI pending |

## Open verification and risks

- Run the repository's strict TypeScript check and targeted Vitest suite in cloud CI; this environment cannot perform them.
- Expand from model/route-guard tests to real PostgreSQL College Admin integration journeys using chat-17's fixtures: session expiry, membership revocation mid-transaction, cross-tenant IDs, concurrent PATCH and class-team creation, rollback, deduped notification delivery.
- Review unscoped Super Admin access on other project mutations with the squad lead; this fix intentionally narrows only the College Admin class-team entrypoint rather than rewriting global Super Admin permissions.
- Full College module ledger, Super Admin colleges/tenants audit and UX coverage remain partially open.


## Newly discovered actor race defects

| ID | Severity | Evidence and fix | Commit | Regression | Status |
|---|---|---|---|---|---|
| PROJ-BREAK-COL-ACTOR-01 | S1 security | `updateCollegeProjectSummary` and `replaceCollegeProjectLearners` originally checked the in-memory request context before beginning the project-row transaction. Role removal, membership suspension or user disable between authorization and mutation could still write and notify. Added `assertPersistedPlatformPermission` under project row lock and before no-op early returns. | `7cc7e95`, `0bbfd36` | `PROJ-BREAK-chat4-college-persisted-actor.test.ts` | Fix pushed; PostgreSQL race test pending |
| PROJ-BREAK-COL-ACTOR-02 | S1 security | `createClassTeamWorkspaces` checked DB membership before the SERIALIZABLE transaction; revocation during roster preview was not checked within the write transaction. A locked reauthorization now precedes all group/project inserts, and group creator type derives from the persisted role. | `28b5110` | same | Fix pushed; PostgreSQL race test pending |
| COL-people-export-ACTOR-01 | S1 privacy | Directory export performed private faculty profile/mobile enrichment after its original authorized directory transaction completed. Actor revocation during the gap could still expose enriched CSV. A second same-transaction persisted authorization now guards enrichment under held locks. | `195d40f` | `chat4-college-academics-people-weak-area.test.ts` | Fix pushed; DB race test pending |
