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


## Additional College Admin tenant/race defects

| ID | Severity | Defect and correction | Commit(s) | Test | Status |
|---|---|---|---|---|---|
| COL-student-import-PG-01 | S1 tenant isolation | Student placement used only `learnerProgramEnrollments.status` and a matching cohort, without requiring the enrollment's member to be an active learner of the target college. Joined persisted membership, learner role and user; compare college ID and active account within locked section transaction. | `7efa5cc` | `chat4-college-import-placement-authorization.test.ts` | Fix committed, DB test pending |
| COL-student-import-PG-02 | S1 stale actor | Admin could lose membership/role after page preflight, then place a learner using stale context. Added transaction-local `assertPersistedPlatformPermission` before insertion. | `7efa5cc` | same | Fix committed, DB race test pending |
| COL-faculty-reassign-01 | S1 tenant isolation | Faculty upcoming-schedule query accepted arbitrary faculty UUID and counted sessions without college/section ownership; reassignment selected sessions by faculty ID alone. Added persisted source-faculty ownership check, joins to section→cohort→program→department, and current college filter. | `c8bd2b0` | `chat4-college-faculty-schedule-hardening.test.ts` | Fix committed, DB test pending |
| COL-faculty-reassign-02 | S2 duplicate audit | Retrying a faculty move with no updated scheduled events still wrote a misleading `REASSIGNED` audit record. Added no-write return to avoid repeated activity events. | `8dd889c` | same | Fix committed, DB test pending |
| COL-faculty-reassign-04 | S1 account lifecycle | Disabled replacement faculty could be selected for upcoming lectures if the college membership stayed ACTIVE. Current replacement must have an ACTIVE user and membership, and selectors omit disabled users. | `65c41e3` | same | Fix committed, DB test pending |
| COL-people-profile-ACTOR-01 | S1 privacy | Profile overview fetched parsed private faculty/learner document after an earlier authorization from the editor helper, with no persisted auth lock across the sensitive read. Added transaction-local persisted People permission before profile projection. | `07fceaa` | `chat4-college-profile-projection-revocation.test.ts` | Fix committed, DB race test pending |


| COL-faculty-reassign-RACE-01 | S1 concurrency | Two different source faculty could move overlapping upcoming sessions to the same replacement in parallel, each seeing no existing replacement collision and both committing. The service now acquires a transaction-scoped PostgreSQL advisory lock keyed on the replacement membership *before* reading slots or checking overlap. | `f2f572e` | `tests/unit/chat4-college-faculty-schedule-hardening.test.ts`, `tests/integration/chat4-college-faculty-schedule-reassignment.test.ts` | Fix and concurrent PostgreSQL test committed; CI pending |



## Super Admin tenant/session follow-through

| ID | Severity | Finding/fix | Test | Remaining |
|---|---|---|---|---|
| SA-colleges-bulk-input-01 | S2 data integrity | Bulk CSV parser accepted trailing junk after closing quotes, potentially reinterpreting a college name/code. Explicitly reject all non-delimiter characters after a closed quoted cell; preserve valid escaped quotes and CRLF. | `chat4-super-admin-colleges-bulk-csv-hardening.test.ts` | UI and PostgreSQL acceptance |
| SA-colleges-sessions-READ-01 | S1 privacy | Super Admin device session detail, target roster and admin history were read after preflight using an in-memory platform role. Role removal/account disable before the sensitive SELECT could expose session/IP and audit rows. Sensitive reads now run in transactions with `assertPersistedPlatformPermission` and held actor locks. | `chat4-super-admin-session-hardening.test.ts` | PG concurrent role revocation |
| SA-colleges-sessions-DISABLED-01 | S1 security operations | A disabled College Admin user was visible in the target roster but could not be selected for signing out everywhere, potentially leaving unexpired device sessions. The target lookup now permits disabled users while still requiring college-scoped membership/role and a persisted, ACTIVE acting Super Admin. | same | Live endpoint acceptance |
| SA-colleges-sessions-RETRY-01 | S2 audit integrity | Repeating sign-out-everywhere with zero live sessions previously generated a second misleading event. Zero-update return now skips audit emission. | same | DB audit dedupe/race |


| COL-academics-promotion-readiness-01 | S1 readiness integrity | Semester promotion advisory counted a teaching assignment from a disabled user, suspended membership, or removed FACULTY role as staffed, creating a false launch-ready signal. Added joins to persisted actor, membership role, college and ACTIVE states. Pure summary counts distinct mapped courses, including fail-closed no-course case. | `chat4-college-promotion-faculty-readiness.test.ts` | DB fixture needed |


| COL-faculty-reassign-ROLE-RACE-01 | S1 concurrency | Faculty reassignment originally locked only membership records, not joined replacement user or role rows. A concurrent account disable or FACULTY role revocation could race assignment after eligibility was read. Changed SELECT to FOR SHARE on joined membership, user and role rows until transaction commit. | `chat4-college-faculty-schedule-hardening.test.ts` | PostgreSQL concurrent revocation race still required |


| SA-tenants-signin-READ-01 | S1 tenant information isolation | Admin college sign-in policy details were fetched using an in-memory Super Admin snapshot after tenant preflight, with no persisted check in the read operation. Added same-transaction persisted permission check before either migration/table state or policy row query. | `chat4-super-admin-signin-and-history-guard.test.ts` | PG concurrent disable test pending |
| SA-tenants-admin-history-CSV-01 | S2 export bounds | Admin history CSV builder accepted arbitrarily many rows although its caller displays a max 100. Enforced defensive 100-event cap and a clear truncated footer; retained existing <=100 CSV cells and legacy header text unchanged. | `chat4-super-admin-signin-and-history-guard.test.ts` | Browser CSV delivery pending |


| SA-colleges-at-glance-01 | S2 accuracy / S1 stale access | Tenant summary counted learner/faculty memberships as active even when the user was disabled, and trusted a Super Admin session snapshot without persisted authorization while reading. Count now joins ACTIVE users and locks persisted `college.read` permission through the scoped queries. | `tests/unit/chat4-superadmin-at-glance-tenant.test.ts` | PostgreSQL offboarding/race verification pending |


| COL-student-import-options-01 | S2 UX/security | Student CSV selector could offer batches of archived programs, classes of archived cohorts and classes in CLOSED/foreign academic periods, then fail on import; also read options with a stale admin RequestContext after role revocation. Filters now track import eligibility and check persisted authority in transaction before private query. | `chat4-college-student-import-options-hardening.test.ts` | PostgreSQL+browser acceptance pending |
| COL-classes-tenant-01/04 | S1 IDOR/data isolation | A section's academicPeriodId references an independent FK; class workspace and central loadSectionScope derived tenant only through cohort/program and could expose/accept another college's academic period when referential data is malformed. Both scope and details now require academicPeriod.collegeId to equal persisted cohort/program department college. | `chat4-college-section-workspace-tenant.test.ts` | PostgreSQL corrupt-FK tenant fixture pending |


| COL-academics-workspace-PERF-01 | S2 performance | College Academics workspace dispatched an unbounded Promise.all of separate cohort and section queries for every program/batch. Large college tenants could exhaust pooled DB connections, causing timeouts and inaccessible setup pages. Introduced order-preserving eight-at-a-time parallel batches, no data truncation and explicit query error propagation. | `tests/unit/chat4-college-academics-workspace-fanout.test.ts` | 1,000+ cohorts DB performance verification pending |


| SA-tenants-directory-QUERY-01 | S2 input / ambiguous tenancy | Tenant page manually cherry-picked known query keys before invoking a strict schema; repeated `?page=1&page=2` and unknown params could be silently coerced/ignored, bypassing the same validation as tenant CSV export. Added strict full-key query parser with explicit rejection of arrays and unknowns before DB access and kept the recoverable error page. | `tests/unit/chat4-superadmin-tenant-directory-query.test.ts` | Browser malformed-URL acceptance pending |


| COL-classes-tenant-05 | S1 least privilege | Section Operations previously accepted broad `academics.read`, granted to Faculty/Learner roles, while composing full college learner/faculty pickers and administrative schedule/assignment data. Restricts this combined operations workspace to `academics.manage` (College Admin), leaving role-specific learner/faculty views to dedicated scoped services. | `chat4-college-section-workspace-tenant.test.ts` | Full route journey CI pending |


| SA-tenants-lifecycle-ACTOR-01 | S1 tenant isolation | Tenant directory, detail and CSV export trusted a previously captured Super Admin role at service preflight, so disabling the user or revoking the system role before the actual read could still expose tenant names and organization data. Added transaction-local `assertPersistedPlatformPermission` before each SELECT with SHARE locks held through the scoped read. Organization filter choices are loaded before the transaction to avoid deadlock on one-connection pools; the persisted denial still prevents returning them. | `chat4-superadmin-tenant-lifecycle-actor.test.ts` | PostgreSQL role race and long-running connection verification pending |
