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


| SA-colleges-sessions-QUERY-01 | S2 input ambiguity | GET device sessions relied on `URLSearchParams.get("userId")`, which silently accepted duplicate userId and unknown query keys. Replaced first-value parsing with strict one-element UUID array and unknown-key rejection using Zod before any private device read. | `chat4-superadmin-tenant-route-guards.test.ts` | Cloud test confirmation pending |


| COL-people-contacts-PERIOD-01 | S1 privacy / tenant integrity | College contacts academic filter inferred class scope from the cohort/program's department but did not verify the independent `sections.academic_period_id` belonged to the same college. A corrupt cross-college period could satisfy class-presence and combined-placement predicates. Three predicates now join `academic_periods` with `college_id` equality. | `chat4-college-contacts-period-sql.test.ts` | Disposable PostgreSQL injected FK fixture pending |


| COL-student-import-options-05 | S1 tenant integrity | CSV batch chooser used the cohort's program/department college, but did not validate independent `cohorts.start_period_id` belonged to that college. A corrupt cross-college start period could still be selectable. Added same-college `academicPeriods` join while retaining valid ongoing cohorts whose historical start period is CLOSED. | `chat4-college-student-import-options-hardening.test.ts` | PostgreSQL malformed FK fixture pending |


| COL-student-import-placement-START-PERIOD-01 | S1 cross-tenant IDOR | Protecting the CSV batch-picker did not protect the direct placement action for a manually supplied section ID. The class target query validated the current period's college but not cohort's independent startPeriodId FK. Added aliased same-college start period join to the row-locked write transaction. | `chat4-college-import-placement-authorization.test.ts` | PostgreSQL direct-action adversarial fixture pending |


| COL-student-import-ERROR-01 | S1 double-submit / error recovery | Two placement writes targeting different sections within the same term may both pass the pre-check, then PostgreSQL's partial unique index rejects the second. Raw database violation was not translated and could surface as HTTP 500 rather than a retry-safe conflict. Added typed `AcademicsServiceError` for all four expected placement failures and translated unique-index violation into `ALREADY_PLACED_IN_PERIOD` (409). | `tests/unit/chat4-college-student-placement-conflict-errors.test.ts` | Concurrent PostgreSQL integration still required |


## 2026-10-18 continuation — tenant directory, College Admin Projects and browser query contracts

The following entries are source commits on `chatgpt/chat-4-b`. Tests were authored but **not run** here. These are not runtime/CI or release acceptance claims.

| ID | Severity | Source defect / correction | Regression evidence | Outstanding |
| --- | --- | --- | --- | --- |
| SA-colleges-directory-01 | S1 access preflight | `/admin/colleges` did not explicitly enforce Super Admin access before returning the invalid-filter error screen (sibling organizations page did). Added `requirePermission(context,"admin-scope.select")` before URL processing (`9ae0a6c`). | `chat4-admin-colleges-organizations-directory.test.ts` SA-colleges-directory-05–07 | CI route and middleware test; browser denied view |
| SA-colleges-directory-02 | S2 input ambiguity | Admin college/organization query accepted unspecified keys and numeric coercion (`0x10`, `1e2`, whitespace). Rejected unknown/duplicate keys and required base-ten pagination (`ac75ccf`, `1e6bdc7`). | `chat4-admin-colleges-organizations-directory.test.ts` SA-colleges-directory-01/02 | CI + malformed-URL browser |
| PROJ-BREAK-COLLEGE-04 | S2 project URL ambiguity | College Admin project list accepted array-valued/unknown query parameters and silently selected first value. Reject ambiguous URL before costly project snapshot read (`b9c7c16`). Existing `getProjectAdminCollegeId` and service manage gate remain unchanged. | `chat4-college-admin-projects-role-journey.test.ts`, `chat4-college-admin-project-route-journey.test.ts` | DB role revocation/stale-session/double-submit tests, browser navigation |
| SA-colleges-directory-08 | S2 tenant URL validation | Tenant lifecycle directory page allowed exponent/hexadecimal/whitespace numeric page forms due to `z.coerce.number()`. Uses decimal-string validated union while retaining internal numeric callers (`0b27a3a`). | `chat4-tenant-lifecycle-signin-archive-policy.test.ts` | CI |
| SA-colleges-readiness-R01 | S2 resilience | Invalid readiness status/area query still called persisted college readiness service before reporting a recoverable URL error; validate before DB read (`778cc4e`). | `chat4-admin-college-readiness-journey.test.ts` | CI/DB/UX |
| SA-colleges-admins-R01 | S2 admin history query | Admin device-history page accepted numeric scientific/hex strings as URL pages; enforce decimal strings (`836fb79`). | `chat4-admin-college-session-history-journey.test.ts` | CI + persisted-role concurrency |
| COL-tenant-archive-01 | Coverage gap | No new archive mutation; tested `assertCollegeCanArchive` behavior for each of nine dependent resource types individually. | `chat4-tenant-lifecycle-signin-archive-policy.test.ts` | PostgreSQL archive race and rollback |
| COL-tenant-signin-01/02/03 | Coverage gap | No sign-in mutation or runtime channel change; exercise code-only valid policy, strict CAS update validation, and missing/corrupt persisted policy read states. | `chat4-tenant-lifecycle-signin-archive-policy.test.ts` | Signed host, provider, source-of-truth CAS integration |

The two lane failures still listed in `docs/orchestrator/unit-failures-latest.md` (`COL-academic-setup-R03` and `SA-placements-projects-58`) were re-read against current `main` source. Both requested behaviors appear already present; **no assertion was deleted or weakened**. `chat4-college-admin-projects-role-journey.test.ts` additionally exercises the real six-step map and the exact mentor-overload threshold. Need a fresh CI trace before claiming either preexisting failure has cleared. The lane's refreshed typecheck document lists no chat-4-owned compile errors.

## Post-CI 834983cc continuation — chat-4 source corrections

All entries below are committed to `chatgpt/chat-4-b`; they are **not** claims of a passing CI run.

| ID | Severity | Symptom and source of truth | Resolution and verification |
| --- | --- | --- | --- |
| COL-faculty-reassign-03 | Stale test, transaction ordering | Test scanned the *first* transaction in the file, which was the read-only options lookup. The actual reassignment write already SHARE-locks the source/replacement faculty, rechecks persisted `academics.manage`, advisory-locks replacement and audits only successful changes. | Scoped test search to `reassignFacultyUpcomingSchedules` transaction, preserving all existing lock and audit assertions. |
| COL-classes-tenant-02 | Stale test mock | The section workspace calls `listRoleChoices` with a Drizzle thenable `ORDER BY` query, but test mock's `orderBy` returned a non-Promise object. | Added Promise-like behavior in the unit mock; its tenant/role and all downstream service assertions stay unchanged. |
| SA-placements-projects-55 | Outdated test contract | Legacy `search` is retained, but contrasting simultaneous `search` and `q` must fail closed, not silently choose the first alias. | Updated the existing test to require conflict rejection and confirm matching aliases still work; source was already correct. |
| SA-placements-projects-58 | Outdated copy assertion | Reassignment page accurately covers selected non-archived workspaces; old test demanded an outdated active-only sentence. | Test now asserts current safe copy and retains dynamic >150% overload check. |
| SA-placements-projects-71 | Outdated helper assertion | CSV exporter moved to the shared `projectAdminCsv`, which neutralizes formula operators. | Test now proves shared encoding and retains header/export/UI checks rather than demanding removed `csvField`. |
| COL-export-08/09 | S1 spreadsheet-injection defense | Both College Admin history and academic-directory exports missed dangerous spreadsheet operators following Unicode format/combining prefixes. | Encoding neutralizes those prefixes, named regression vectors authored in `chat4-college-admin-export-boundaries.test.ts`. |
| SA-colleges-directory-02 | S2 malformed pagination | Explicit empty `page=` and `pageSize=` were dropped, silently reverting to default page/size. | Kept blank keys for strict Zod rejection, updated `chat4-admin-colleges-organizations-directory.test.ts`. |
| SA-colleges-admins-R01/R02 | S2 malformed and duplicated CSV export query | Admin session history UI had strict validation, but its CSV route called `URLSearchParams.get("page")`, silently ignoring duplicate, unknown and scientific-number params. | Route now validates the entire multimap via the same parser; `chat4-admin-history-export-route.test.ts` covers 9 rejection forms, early no-DB exit, successful scoped IST CSV with no-store. Explicit empty page rejected in model too. |

Cloud CI needs to rerun the changed test files before any of these entries can be closed as verified.

## Academic tenant-join hardening (CI pending; 2026-10-18)

| ID | Priority | Root cause and treatment | Source / test | Status |
| --- | --- | --- | --- | --- |
| COL-academics-scope-tenant-01 | S1 privacy/integrity | Independent FKs did not establish that a learner's declared cohort belongs to the enrolled program, nor that a section enrollment points to the same learner cohort, academic period, college membership, and section. Scope reads now join these as one trust chain; malformed associations return not found. | `src/modules/academics/a2-scope.ts`; `tests/unit/chat4-college-academic-cross-tenant-joins.test.ts` | Source corrected; source-contract test authored; real PostgreSQL corrupt-association fixture OPEN |
| COL-academics-scope-tenant-02 | S1 privacy | `listSectionRoster` previously selected display names by `section_enrollments.section_id` without requiring the *learner's membership* to belong to the authorized section college/cohort; `listLearnerSectionHistory` similarly joined arbitrary section IDs to an authorized learner record. Added same-college membership/academic-period checks and cohort/program agreement before returning names or history. | `src/modules/academics/roster-service.ts`; same test | Source corrected; PG IDOR/transaction fixture OPEN |
| COL-academics-scope-tenant-03 | S1 privacy | Faculty assignment scope resolved college from *section* but did not verify the faculty membership college or referenced academic-period college. Schedule scope could also follow a corrupted cross-college period. Both now verify the period's college, and assignment joins faculty membership to the same college. | `src/modules/academics/a2-scope.ts`; same test | Source corrected; PG fixture OPEN |
| COL-export-08/09 | S1 spreadsheet safety | Newly added Unicode formula guard had incorrectly doubled regex backslashes, so format/combining marks were not processed as intended. Corrected literal character-class escapes and formula-operator class in both academic and administrator-history CSV exporters; retained existing named payload tests. | `src/modules/academics/college-directory-export-model.ts`, `src/modules/colleges/admin-history-export-model.ts`, `tests/unit/chat4-college-admin-export-boundaries.test.ts` | Source corrected; CI pending |

Exports `exportCollegeAcademicDirectory`, `mapAcademicWorkspaceInBatches` and `getAcademicsWorkspace` also have new behavior tests; see `docs/audit/coverage/college-ledger.md`. No test run or PostgreSQL verification was performed in this lane.

### Disposable integration evidence added

The three `COL-academics-scope-tenant-PG-01` cases in `tests/integration/chat4-college-academic-cross-tenant-pg.test.ts` now encode the cross-college enrollment/roster/faculty/academic-period defects above against independently created, foreign-key-valid PostgreSQL data. Standard `DB03_ISOLATED_TEST_DATABASE` guard protects against use of a non-disposable DB. **Authored only** — execution, schema migration compatibility, cleanup, and assertions must be independently verified by cloud CI. No S1 defect should be declared production-certified solely from source or authored fixtures.

## COL-people-import-history-01 — invalid history page and metadata resilience

The College student import history service used `z.coerce.number()` for page input, accepting scientific notation/hex/boolean coercion in direct calls, and passed corrupt negative/fractional/non-finite metadata counters to page statistics. Replaced with bounded decimal-only URL strings or already validated positive integer pages (1–500), plus `safeCount` requiring nonnegative safe integers. `tests/unit/chat4-college-student-import-history.test.ts` verifies input, role, persisted actor revocation, lookahead pagination and safe counts; **authored, not run**.

## SA-people-audit-ACTOR-01 — S1 sensitive read after actor revocation

`listSuperAdminPersonAudit` previously fetched the person's selected-college membership, then independently selected private identity and platform audit records without another persisted Super Admin authorization. A session's role could be revoked between these reads. Now the final audit query runs in a transaction with `assertPersistedPlatformPermission(tx,context,"people.manage",{collegeId,organizationId})`, holding the actor lock until the event data is read. `tests/unit/chat4-superadmin-person-audit-actor.test.ts` covers stale-role rejection, no global fallback, missing target, audit query bounds. **Source committed; CI and PostgreSQL race pending.**

## COL-contacts-scope-01 — S1 cross-program contacts predicate

`collegeContactAcademicScope.inProgram` and `activeEnrollment` previously matched the independently referenced `learner_program_enrollments.program_id` without verifying that its `cohort_id` belongs to that same program. A foreign-key-valid forged learner/cohort association could make a college contact appear academically enrolled in the wrong program. Both predicates now join through `cohorts` and require `cohorts.program_id = learner_program_enrollments.program_id`. The `COL-contacts-scope-PG-01` disposable Postgres fixture uses a separate synthetic College A learner with only an invalid College B cohort to detect any false inclusion. Authored, not run.

## COL-people-directory-PAGE-01 — malformed list pagination

The College People roster's `z.coerce.number()` accepted unambiguous but non-URL-decimal inputs such as `0x19` and `2.5e1`. Replaced with strict decimal-string parsing (retaining validated numeric internal callers), explicit blank-page rejection, and `chat4-college-role-directory-decimal-page.test.ts` covering canonical query round trips. Authored, not run.

## COL-student-import-placement-tenant-01 — S1 foreign program admission defect

The College Admin CSV student-placement service previously checked that `learner_program_enrollments.cohort_id = target section cohort_id`, but not that `learner_program_enrollments.program_id` actually owned that cohort. Because these are independent PostgreSQL FKs, a learner membership in College A referencing a College B program and College A cohort could be admitted to a College A section. The enrollment read now INNER JOINs `cohorts` with both `cohort.id` and `cohort.program_id` constraints, and checks the program's department college before class capacity, insert and audit. A real disposable PG negative case `COL-student-import-placement-tenant-PG-01` and source-order test are authored; not run.

## COL-people-e2e-identity-02 — deterministic UID collision without contact

The E2E identity adapter used a literal `"missing-contact"` hash fallback when called directly without phone/email, which would generate the same UID for unrelated people and could cause test-fixture identity aliasing. It now fails with `PeopleServiceError("IDENTITY_CONTACT_REQUIRED")`, matching the production identity resolver's required-contact invariant. A behavioral negative case was appended to `chat4-college-e2e-identity-directory.test.ts`; **not run**.

## COL-academics-directory-FILTER-01 — S2 malformed academic directory filters

Semester/batch directory numeric schemas used `z.coerce.number()`, interpreting user URL values such as hexadecimal and exponent notation as real pages, terms, credits and academic years. `academicDirectorySearchParams` also silently discarded unsupported foreign query keys. The schemas now accept only decimal digit strings or already validated internal numbers, and the extractor rejects unknown/array keys rather than broadening the filter. `tests/unit/chat4-college-academic-directory-strict-filter.test.ts` verifies malformed cases, range/progression contradictions and canonical filters. Authored, not run.

## COL-people-local-identity-02 — orphaned first-party account creation

The first-party identity directory adapter generated a fresh `lms_*` identity even on direct `createUser` calls lacking both phone and email; such a person has no OTP sign-in or recovery contact. It now throws `PeopleServiceError("IDENTITY_CONTACT_REQUIRED")`, mirroring the higher-level resolver. A regression test was appended to the local directory suite; not executed.

## SA-colleges-verification-FILTER-01 — S2 numeric query ambiguity

The Super Admin college verification page passed `page`/`pageSize` directly to a shared Zod coercion schema, accepting strings like `1e2` or `0x10` as valid pages. It now rejects nondecimal input explicitly before queue/policy database access, retaining existing strict unknown-key/array rejection and user-visible Reset recovery. A rendered route test covers invalid, denied, policy and scan-cap states; not run.

## COL-promotion-faculty-ACTOR-03 — stale actor academic readiness reads

`getPromotionFacultyReadiness` previously authorized only against the in-memory `RequestContext` via `resolveActingCollege`, then read cohort, target courses, and eligible active faculty over separate non-transactional queries. A user whose college role was revoked after session issuance could still read the readiness advisory. The service now holds persisted actor row locks for the entire read transaction. The unit mock verifies denial before the first read; concurrency/postgres CI pending.

## PROJ-BREAK-COLLEGE-04-READ-01/02/03/04 and IDOR-05 — S1 stale-role and private ID existence

College Admin Projects insights were built from `RequestContext` `requirePermission` only, then read project count/page, at-risk, submissions and rollup details on separate DB queries. A revoked College Admin or Super Admin could still access private project summaries until their session refreshed. All four `admin-insights-service` exports now reauthorize `projects.manage` in one database transaction and hold persisted actor SHARE locks through the entire read. Before looking up a caller-provided College ID, they now check the actor's exact selected college via `getProjectAdminCollegeId`; foreign IDs cannot be used to distinguish a hidden tenant from a nonexistent one. Tests `chat4-project-admin-directory-persisted-actor.test.ts` and `chat4-project-admin-risk-submissions-live-actor.test.ts` cover denied/valid contexts and no private query on revoked actors; real PG races pending.

## COL-people-import-history-RACE-02 — S2 closed dialog and stale page overwrite

Bulk import history previously left concurrent GET responses unversioned. After fast next/previous clicks, close/reopen or a slow network, an old page could overwrite a newly selected page, including error text from the outdated request. The College import-history dialog now aborts the prior request, advances a request token on next load and close, applies data/errors only for the latest non-aborted token, checks array response shape and hides raw upstream error strings. `isCurrentCollegeImportHistoryRequest` is tested for out-of-order completions and cancellation; browser integration pending.

## COL-UX-ACADEMIC-TABLE-01 — phone keyboard accessibility of academic directory

The College Admin semesters/batches directory rendered a wide native `<table>` inside a horizontal scroller, requiring phone users to pan across 6–8 columns and find edit actions at the trailing edge. It now uses the shared `DataTable` with a labelled `ScrollCue`, semantic column captions, primary fields and actions visible on phones, and extra metadata in the accessible More details disclosure. Existing Actions and legacy labels remain. SSR tests cover both directory modes; not run, phone/browser audit pending.

## COL-UX-STRUCTURE-TABLE-02 — S2 horizontal-only Class/Elective directory access

Class and elective-slot directories were wide native tables where the Schedule/Manage actions and confirmed-student fields required horizontal scanning on phones. Replaced with the shared responsive `DataTable`, marking the record as primary, actions as permanently phone-visible, and remaining fields as secondary accessible through More details. All original legacy action routes and row permission gates remain. Added SSR rendered class/elective regression cases; cloud/mobile verification pending.

## COL-UX-PEOPLE-TABLE-03 — S2 People directory desktop table maintenance and phone scroll affordance

The College Admin Faculty/Student directory had two independently maintained row presentations: a hand-written desktop-only native table and mobile cards. The desktop table was not using shared `DataTable` semantics or its sticky heading, keyboard-labelled scroll cue and per-field formatter handling. It is now rendered by the shared responsive `DataTable`, wrapped `hidden md:block` to retain the existing richer mobile cards and avoid duplicating cards on phones. All actions, field visibility and tenant filter service calls remain unchanged. SSR tests written, not run.

## COL-people-faculty-csv-RACE-03 — S1 preview of a replaced CSV could enable registration

The faculty bulk-registration form did not bind an async preview response to its source CSV. Editing the textarea or choosing a new file while a slow validation was in flight could allow the old `report.preview` to reappear next to new contents, then register a different set of people than the preview showed. The form now increments a CSV draft revision on every file/text edit, accepts only same-revision previews and file reads, resets preview/confirmation immediately, disables editing during pending operations, and uses safe generic network errors. `facultyCsvResponseBelongsToDraft` carries the cross-request decision and is behavior-tested; browser/API race execution pending.

## PROJ-BREAK-COLLEGE-04-ARCHIVE-07 — S1 stale tab could archive freshly edited workspace

The College Admin archive button received `expectedUpdatedAt` but discarded it before sending the archive request; the endpoint accepted no version. Another tab's edit could be silently archived. The UI now passes the exact timestamp, the POST endpoint accepts only a bounded strict body, and `archiveProjectInstance` checks it under the row lock before transitioning and notifying. Already-archived retries are idempotent; old internal service callers still permit omitted tokens, which is tracked for all-caller CAS hardening. `tests/unit/chat4-project-archive-cas-handler.test.ts` covers route/contract scenarios; database race proof pending.

## PROJ-BREAK-COLLEGE-04-ARCHIVE-08 — S2 double archive/restore submit during first render

`ProjectArchiveControl` previously relied only on asynchronous React `pending` state and left the dialog dismissible during the write. Two rapid clicks in one frame could submit twice, or dismiss the modal while a mutation remained in flight. Both Archive and Restore now use an immediate `inFlight` ref guard, unlock in `finally` and block Escape/backdrop/cancel while committing. Server archive remains idempotent and CAS-protected; frontend test authored, browser race pending.

## COL-UX-TERM-MAPPINGS-04 — S2 raw semester table and raw API error leaks

College semester-course mappings used a scroll-only native table that required finding end-of-row Edit/Remove on a phone, although keyboard reordering buttons existed. The mapping list is now a shared `DataTable` with phone-visible action cells and accessible headers while retaining drag and keyboard controls. Duplicate submissions are stopped by a synchronous request guard; unknown API errors no longer show raw provider strings. Source and pure order behavior tests authored; not executed.

## SA-ORGANIZATIONS-ACTOR-09 / SA-COLLEGES-ACTOR-10 — S1 stale privileged session tenant enumeration

`listOrganizations` and `listColleges` relied on cached Super Admin/College Admin request-context role checks, then queried organization and college names without checking persisted user status or role membership at read time. A revoked actor could continue enumerating tenant records until session refresh. Both list exports now hold `assertPersistedPlatformPermission` SHARE locks for the entire read transaction, with exact selected college/organization scope. Each has a denial-before-first-SELECT regression test; PostgreSQL concurrent revocation and service integration still require final validation.
