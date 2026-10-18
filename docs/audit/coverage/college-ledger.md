# College Admin / tenant-directory coverage ledger — chat-4

Updated 2026-10-18 on `chatgpt/chat-4-b`. **In progress; not exhaustive or CI certified.** Tests in this ledger are authored, not executed by this lane. Source contracts are distinct from real PostgreSQL and browser acceptance. All tenant scope enforcement must remain server-authoritative.

## Tested module exports

| Source | Export | Test and behavioral cases |
| --- | --- | --- |
| `src/modules/colleges/admin-session-query-model.ts` | `parseAdminSessionHistoryPage` | `tests/unit/chat4-admin-college-session-history-journey.test.ts`: SA-colleges-admins-R01; valid page, rejected duplicates/foreign filters and nondecimal coercion |
| `src/modules/colleges/admin-readiness-filter.ts` | `parseSuperAdminReadinessParams`, `visibleReadinessChecks` | `tests/unit/chat4-admin-college-readiness-journey.test.ts`: SA-colleges-readiness-R01; invalid URL rejection, persisted-filter classification by area/status |
| `src/modules/colleges/readiness-model.ts` | `evaluateCollegeReadiness` | Same test: fail on zero, unknown when source unavailable, READY only with all ten passed; no runtime sign-off |
| `src/modules/colleges/readiness-remediation-links.ts` | `readinessRemediationLink` | Same test: domain link stays inside exact college; faculty/program remediation routes |
| `src/modules/colleges/validation.ts` | `collegeIdSchema`, `collegeOrganizationIdSchema`, `collegeCodeSchema`, `collegeNameSchema`, `createCollegeInputSchema`, `updateCollegeInputSchema` | `tests/unit/chat4-college-organization-validation.test.ts`: COL-tenant-validation-01–04; UUID, code, size, required fields, allowed updates |
| `src/modules/organizations/validation.ts` | `organizationIdSchema`, `organizationNameSchema`, `createOrganizationInputSchema`, `renameOrganizationInputSchema` | Same test: COL-tenant-validation-01/05; UUID, normalized whitespace and bounded mandatory names |
| `src/modules/colleges/admin-directory-query-model.ts` | `parseAdminDirectorySearchParams` | `tests/unit/chat4-admin-colleges-organizations-directory.test.ts`: SA-colleges-directory-01/02; trims q, preserves supported page sizes, rejects repeated, foreign/empty, out-of-range and malformed keys |
| `src/modules/colleges/admin-directory-query-model.ts` | `adminDirectoryQuerySchema` | Same tests through its public parser; edge inputs validated without a database read |
| `src/modules/colleges/admin-tenant-lifecycle-model.ts` | `tenantLifecycleQuerySchema`, `parseTenantLifecycleSearchParams`, `TENANT_LIFECYCLE_PAGE_SIZE`, `tenantLifecyclePaging`, `tenantLifecycleHref`, `tenantSetupLinksAvailable` | `tests/unit/chat4-tenant-lifecycle-signin-archive-policy.test.ts`: SA-colleges-directory-08/09/10; decimal-only URL pages, capped pagination, canonical href and archived parent/child setup restrictions |
| `src/modules/colleges/archive-policy.ts` | `hasCollegeDependencies`, `assertCollegeCanArchive`, `CollegeHasDependenciesError` | Same test: COL-tenant-archive-01; every dependency type independently forbids archival and carries the usage snapshot |
| `src/modules/colleges/signin-methods-model.ts` | `collegeSignInMethodSchema`, `updateCollegeSignInSchema`, `signInCapabilities` | Same test: COL-tenant-signin-01/02; channel-primary ordering, prohibited channels, exact update input, optimistic version and UUID validation |
| `src/modules/colleges/signin-policy-read-model.ts` | `signInPolicyReadState` | Same test: COL-tenant-signin-03; migration pending, unconfigured, corrupt and configured states |
| `src/modules/colleges/admin-directory-access-model.ts` | `canManageCollegeDirectoryRow` | Same tests, SA-colleges-directory-03/04/05; organization and selected-college isolation, disabled-user denial |
| `src/modules/projects/admin-college-scope.ts` | `getProjectAdminCollegeId` | `tests/unit/chat4-college-admin-projects-role-journey.test.ts`: PROJ-BREAK-COLLEGE-04-07/08; College Admin, TPO, disabled and unscoped Super Admin |
| `src/modules/projects/college-projects-query-model.ts` | `parseCollegeProjectsQuery` | Same test: PROJ-BREAK-COLLEGE-04-09/10; valid pagination, repeated/unknown keys, hostile numerical syntax, invalid states |
| `src/modules/people/college-legacy-tabs-model.ts` | `collegeLegacyNavigationPath`, `collegeLegacyGroupForPath`, `collegeAcademicSetupStep` | Same test: COL-academic-setup-R03; periods prerequisite stays linked while six legacy tabs remain intact |
| `src/modules/admin-ui/admin-dashboard-navigation.ts` | `COLLEGE_ADMIN_SETUP_PHASES` | Same test: COL-academic-setup-R03; required academic-period step precedes batches |
| `src/modules/projects/mentor-overload-model.ts` | `projectMentorWorkloadAverage`, `isProjectMentorOverloaded` | Same test: SA-placements-projects-58; strictly >150% of average, empty workload and equal-capacity cases |
| `src/modules/academics/college-directory-export-model.ts` | `exportParams`, `buildCollegeDirectoryCsv`, `collectCollegeExportRows` | `tests/unit/chat4-college-admin-export-boundaries.test.ts`: COL-export-01–05; duplicates, CSV formula neutralization, cap/paging, invalid internal job params |
| `src/modules/colleges/admin-history-export-model.ts` | `collegeAdminHistoryCsv`, `MAX_ADMIN_HISTORY_EXPORT_ROWS` | Same test: COL-export-06/07; IST, CSV injection, bounded export and explicit truncation |
| `src/modules/permissions/policy.ts` | `can`, `requirePermission` | `tests/unit/chat4-college-admin-projects-role-journey.test.ts`: PROJ-BREAK-COLLEGE-04-01–06; own/foreign college, other org, roles, disabled/ended membership, selected Super Admin scope; `chat4-admin-colleges-organizations-directory.test.ts`: denied admin routes |
| `src/modules/projects/access.ts` | `requireProjectManageAccess` | **Source-only** in `tests/unit/chat4-college-admin-project-route-journey.test.ts`: PROJ-BREAK-COLLEGE-04-14 checks detail service calls guard before reading a workspace. Persisted-role/IDOR integration test still required |

## Page and role journey contracts

| Page | Test | Cases |
| --- | --- | --- |
| `/admin/colleges/[collegeId]/readiness` | `chat4-admin-college-readiness-journey.test.ts` | SA-colleges-readiness-R01; invalid filters rejected before expensive scoped service read, ten-check go-live assessment and remediation |
| `/admin/colleges/[collegeId]/admins/[userId]/history` | `chat4-admin-college-session-history-journey.test.ts` | SA-colleges-admins-R01; hostile/ambiguous page rejection before persisted authorized history read; retry-safe revoke service source contract (not database execution) |
| `/admin/colleges` | `chat4-admin-colleges-organizations-directory.test.ts` | SA-colleges-directory-06/07; Super Admin gate before filter parsing, invalid/empty states, scope-aware mutation controls, create/import links, paging |
| `/admin/organizations` | Same | SA-colleges-directory-06/07; guard, create and restore, invalid/empty, paging |
| `/college/projects` | `chat4-college-admin-project-route-journey.test.ts` | PROJ-BREAK-COLLEGE-04-11–13; authorized college before read, invalid URL recovery, optional template service failure, archival navigation |
| `/college/projects/[projectId]/[section]` | Same | PROJ-BREAK-COLLEGE-04-14; shared persisted-tenant manage guard before detail read |
| `/college/departments`, `/college/academics` | `chat4-college-admin-projects-role-journey.test.ts`, `chat4-college-academic-people-gap-closure.test.ts` | COL-academic-setup-R03 navigation plus link and exact legacy six-step setup |

## Open certification / remaining work

This is an **initial lane slice**, not a complete module ledger. The repository's weak-areas report at `docs/audit/coverage/WEAK-AREAS.md` records significant remaining unreferenced exports in `colleges`, `academics`, `groups` and `people`. Exhaustive exported-service inventory, per-handler login/same-origin/permission matrix, stale-version/rollback/idempotency, real-PostgreSQL state/tenant cases, all `/admin/colleges*` and `/admin/organizations*` subpages, browser a11y/phone states and independent CI execution remain **OPEN**. No capability is marked release-ready on authored source tests alone.

The two names in `docs/orchestrator/unit-failures-latest.md` for chat-4, `COL-academic-setup-R03` and `SA-placements-projects-58`, were re-read against the latest `main` source after the branch fast-forward: their original assertions appeared already present in the current source, and the extra *behavioral* tests above now guard the six-step navigation and strictly-average mentor overload rule. The CI report may predate the latest source; **do not mark those failures green until the orchestrator reruns them**. The 2026-10-18 typecheck report lists no chat-4-owned TypeScript errors. Our new TypeScript/test files are also unexecuted.

## CI 834983cc continuation — behavioral corrections

The current orchestrator files report production typecheck and lint **PASS**. The source named CI unit failures were reconciled without deleting/weakening checks:

| CI case | Fix and reason |
| --- | --- |
| `COL-faculty-reassign-03` | `tests/unit/chat4-college-faculty-schedule-hardening.test.ts`: inspect the *write* transaction guard/locks rather than inadvertently reading the preview transaction's index |
| `COL-classes-tenant-02` | `tests/unit/chat4-college-section-workspace-tenant.test.ts`: the Drizzle SELECT/ORDER BY test mock must resolve as a Promise-like query, matching the real consumer's `Promise.all` behavior |
| `SA-placements-projects-55` | `tests/unit/chat4-super-admin-projects-gap-closure.test.ts`: preserve validated legacy search alias and **reject** conflicting `search`/`q` rather than silently first-value-wins |
| `SA-placements-projects-58` | Same file: assert the current accurate non-archived mentor reassignment wording while retaining true >150% mean workload behavior |
| `SA-placements-projects-71` | Same file: validate actual shared `projectAdminCsv` formula neutralization rather than requiring an obsolete local `csvField` |
| `COL-export-08` | `src/modules/colleges/admin-history-export-model.ts` plus `tests/unit/chat4-college-admin-export-boundaries.test.ts`: Unicode format controls and combining marks no longer conceal dangerous history formulas |
| `COL-export-09` | `src/modules/academics/college-directory-export-model.ts` plus same test: Unicode-hidden spreadsheet formulas are escaped in College Admin directory exports |

No tests were run here. These are *pending cloud CI*, not green/verified claims. Exhaustive handler/route and all actual PostgreSQL concurrency races remain open.

## Further tenant lifecycle / branding coverage

| Export or route | Behavioral test | Contract |
| --- | --- | --- |
| `src/modules/colleges/admin-branding-preview-model.ts` `describeAdminCollegeBranding` | `tests/unit/chat4-admin-college-branding-preview-security.test.ts` SA-colleges-branding-01 | persisted versus default branding, reject credentials/token-like URL queries and fragments, private object keys, inappropriate schemes, fallback order, proper HTTPS policies, malformed contact suppression, contrast |
| `src/modules/colleges/admin-session-query-model.ts` `adminSessionHistoryPageSchema` | `tests/unit/chat4-admin-college-session-history-journey.test.ts` SA-colleges-admins-R01 | page one default, bounded decimal query, direct service validation rejects scientific and hex |
| `src/modules/colleges/admin-session-service.ts` `listCollegeAdminHistory` | `tests/unit/chat4-admin-college-session-history-journey.test.ts` (service source contract) | same tenant/user persisted access, 100-row pagination, shared strict page schema; no DB race executed |
| `src/app/api/admin/colleges/[collegeId]/admins/[userId]/history/route.ts` `GET` | `tests/unit/chat4-admin-history-export-route.test.ts` SA-colleges-admins-R02 | runtime mock: rejects nine malformed/duplicate/foreign page forms before any sensitive service call; valid scoped export checks CSV/Cache-Control and truncation |
| `src/modules/academics/college-directory-export-model.ts` `buildCollegeDirectoryCsv` | `tests/unit/chat4-college-admin-export-boundaries.test.ts` COL-export-09 | guards Unicode-hidden formulas |
| `src/modules/colleges/admin-history-export-model.ts` `collegeAdminHistoryCsv` | Same test COL-export-08 | guards Unicode-hidden formulas; client-visible truncation remains explicit |

The coverage still is **not exhaustive**: module-wide service and handler inventories, all role permutations, in-transaction races, real PostgreSQL and browser sign-off remain open. CI has not executed these branch changes.

## College academic weak-area closure — incremental, cloud CI pending

| Area | Export / reader | Test, evidence and pending stage |
| --- | --- | --- |
| `src/modules/academics/college-academic-export-service.ts` | `exportCollegeAcademicDirectory` | `tests/unit/chat4-college-academic-export-service.test.ts` (`COL-academic-export-service-01`): invalid semester/batch filters rejected before services, actor and normalized filters retained on pagination, Unicode-safe CSV, 1,000-row cap/truncation, service authorization failures bubble without substituting data; no DB run |
| `src/modules/academics/workspace.ts` | `mapAcademicWorkspaceInBatches`, `getAcademicsWorkspace` | `tests/unit/chat4-college-academics-workspace-service.test.ts` (`COL-academics-workspace-01`): 85 items with eight-flight read bound/order, invalid concurrency, failed batch stops later requests, joins the appropriate period by ID, same context in all services, corrupt period unknown, not foreign title; no DB run |
| `src/modules/academics/a2-scope.ts` | `loadLearnerEnrollmentScope`, `loadSectionEnrollmentScope` | `tests/unit/chat4-college-academic-cross-tenant-joins.test.ts` (`COL-academics-scope-tenant-01`): query joins now require cohort/program agreement, section/cohort agreement, section/enrollment period agreement, and membership/period same college; source contract only, real PostgreSQL corrupt-FK fixture outstanding |
| `src/modules/academics/roster-service.ts` | `listSectionRoster`, `listLearnerSectionHistory` | Same test (`COL-academics-scope-tenant-02`): roster membership college, cohort/program and period consistency; learner history section cohort and period must agree with authorized enrollment and college; source contract only, PG fixture outstanding |
| `src/modules/academics/a2-scope.ts` | `loadFacultyAssignmentScope`, `loadScheduleEventScope` | Same test (`COL-academics-scope-tenant-03`): prevents foreign faculty membership and academic-period scope joins; source contract only, PG corrupt-FK fixture outstanding |
| `src/modules/academics/college-directory-export-model.ts`, `src/modules/colleges/admin-history-export-model.ts` | Academic and admin history CSV encoding | `tests/unit/chat4-college-admin-export-boundaries.test.ts` (`COL-export-08/09`): Unicode format controls and combining marks cannot hide spreadsheet formulas. A doubled regex-escape defect discovered by read-through was corrected in both source files; CI has not been rerun on these corrections |

No route/page has been marked release-complete merely because its module export now has a named source contract. PostgreSQL concurrency, corrupt joins, and full tenant/journey role matrices remain separate, open gates.

## College sign-in policy paths

| Export | Behavioral test | Boundaries and still-open evidence |
| --- | --- | --- |
| `src/modules/colleges/public-signin-policy-service.ts` `effectiveCollegeSignInMethod` and `effectiveCollegeSignInCapabilities` | `tests/unit/chat4-college-public-signin-policy-read.test.ts` (`COL-tenant-public-signin-01`) | Null host college does not open DB; pending staged table and absent row use documented dual-channel defaults; configured EMAIL_ONLY and PHONE_ONLY exclude other channel; malformed stored value fails closed instead of enabling forbidden sign-in. Host-based tenant resolution is an upstream assumption to verify separately |
| `src/modules/colleges/admin-signin-policy-service.ts` `saveAdminCollegeSignInPolicy` / `CollegeSignInPolicyError` | `tests/unit/chat4-superadmin-college-signin-service-cas.test.ts` (`SA-colleges-signin-01`) | Non-SA, disabled actor, wrong selected college, malformed method/version/unknown keys, migration-not-ready, in-transaction persisted revocation, inactive target, no-op retry, stale CAS, increment+single tenant audit. These exercise mocked transactions, **not** a simultaneous PostgreSQL write/revoke race |
| `src/modules/colleges/admin-signin-policy-service.ts` `readAdminCollegeSignInPolicy` | `tests/unit/chat4-superadmin-college-signin-service-cas.test.ts` (`SA-colleges-signin-02`) | Service mock: persisted actor scope before reading, migration-pending, unconfigured, configured and corrupt policy states, revoked actor and wrong selected tenant; real DB race/integration remains open |

All newly added test cases are authored, **not executed** by this lane.

### Disposable PostgreSQL cross-tenant fixture (authored; not executed)

`tests/integration/chat4-college-academic-cross-tenant-pg.test.ts` contains `COL-academics-scope-tenant-PG-01` cases under the repository's standard disposable DB03 guard. It creates two legitimate colleges' academic program/cohort/section/period chains plus independent synthetic learners, then inserts **foreign-key-valid but semantically corrupt** relationships directly: a learner linked to a foreign program's cohort, own enrollment placed in a foreign section, another college's learner placed on the authorized roster, a foreign faculty assignment, and a section whose period belongs to a different college.

Its three ID-named cases assert that healthy rows remain visible while those forged associations fail closed in `loadLearnerEnrollmentScope`, `loadSectionEnrollmentScope`, `listSectionRoster`, `listLearnerSectionHistory`, `loadFacultyAssignmentScope`, and `loadScheduleEventScope`. The fixture has independent IDs and dependency-ordered cleanup. **No PostgreSQL test execution or passing result is claimed**. A parallel role-revocation/transaction-race fixture remains unimplemented.

## Groups: persisted actor scope

| Export | Behavioral tests | Evidentiary limit |
| --- | --- | --- |
| `src/modules/groups/actor-access.ts` `assertPersistedGroupActor`, `GroupActorAccessError` | `tests/unit/chat4-college-group-persisted-actor.test.ts` (`COL-groups-actor-01`): mock transaction SHARE locks, absent/disabled actor, SELF wrong member/college/status/learner role, MANUAL wrong or revoked College Admin, Super Admin stale in-memory role and persisted-role revocation, typed error mapping | Exercises transaction-scoped actor decision with controlled query rows. Separate group resource-level caller `requirePermission` and simultaneous persisted role-revocation transaction tests still required; no CI execution performed |

## Super Admin directory and page continuation (2026-10-18; cloud CI pending)

| Route / page | Case / test | Coverage claim |
| --- | --- | --- |
| `/admin/organizations` | `SA-colleges-directory-06`, `tests/unit/chat4-admin-colleges-organizations-directory.test.ts` | Guards `admin-scope.select` before invalid URL response; permission expression normalized to the exact source contract without weakening test |
| `/admin/colleges/[collegeId]/admins/[userId]/history` | `SA-colleges-admins-R01`, `tests/unit/chat4-admin-college-session-history-journey.test.ts`; `tests/unit/chat4-superadmin-history-page-rendering.test.tsx` | Page authenticates Super Admin before even invalid-filter rendering, rejects duplicate/bogus pages before service reads, renders subject-scoped IST activity with next/previous and matching CSV URL; user summary escapes markup; static SSR tests authored |
| `/admin/colleges/[collegeId]/signin` | `SA-colleges-signin-page-01`, `tests/unit/chat4-superadmin-college-signin-page-states.test.tsx` | Page SSR verifies configured policy/version, migration-unavailable disabled action, malformed stored policy safe message, invalid college ID 404, College Admin denial before secret read |
| `/api/admin/tenants/export` | `SA-tenants-directory-export-01`, `tests/unit/chat4-superadmin-tenant-export-handler.test.ts` | Full parsed query rejection (duplicate, unexpected, invalid organization/status), authorized normalized export with same actor, 1000 cap headers, private no-store and Vary Cookie for success and denial. Request-specific error responses now explicitly not cacheable |
| `tests/unit/chat4-super-admin-colleges-bulk-service-behaviour.test.ts` | `SA-colleges-bulk-IMPORT-01/02/03` | Strict `AdminScope` typing corrected: organization-scoped Super Admin uses `collegeId:null` |
| `tests/unit/chat4-superadmin-tenant-lifecycle-actor.test.ts` | `SA-tenants-lifecycle-ACTOR-01/02/03/04` | Mock transaction callback type no longer refers recursively to its own parameter |

All above tests **authored but not executed**; existing latest CI report still references `SA-colleges-directory-06`, which requires a fresh CI rerun to close. Other College Admin module/page coverage remains open.

## College People additions: import and identity service behavior

| Export | Test | Covered behavior and remaining evidence |
| --- | --- | --- |
| `src/modules/people/college-student-import-options.ts` `listCollegeStudentImportOptions` | `tests/unit/chat4-college-student-import-options-service.test.ts` (`COL-student-import-OPTIONS-01`) | Wrong role/inactive actor rejected before DB, persisted college-admin role checked inside transaction, exact same-college options and query caps 500/2000/3000, empty choices; real PostgreSQL corrupt foreign-cohort fixture and role-revocation race still pending |
| `src/modules/people/local-identity-directory.ts` `localIdentityDirectory.findByPhone/findByEmail/createUser/updateUser` | `tests/unit/chat4-college-local-identity-directory.test.ts` (`COL-people-local-identity-01`) | Identity projection without internal user IDs, casefolded email SQL argument, missing lookup, unique opaque local IDs, no implicit DB creation, partial profile contact preservation; unique-index and concurrent create reconciliation still require PostgreSQL integration |

No local execution. The module-wide College Admin and Super Admin coverage gate is not complete.

## College People export safety and revocation (source + unit authored)

| Export / model | Test | Evidence |
| --- | --- | --- |
| `src/modules/people/college-visible-directory-export.ts` `exportVisibleCollegePeople` | `tests/unit/chat4-college-people-visible-export-security.test.ts` (`COL-people-export-ACTOR-02`) | Faculty private phone requires same-college persisted actor verification during its enrichment transaction; student phone column remains blank despite stored mobile; no private read occurs when actor's role was revoked between list and enrichment or when no rows are visible; UTF-8 BOM retained |
| `src/modules/people/college-role-directory-export.ts` `escapeRoleDirectoryCsvCell`, `renderCollegeRoleDirectoryCsv` | Same test (`COL-people-export-formula-01`) | Escapes `= + - @` spreadsheet formulas even after Unicode format/combining marks, ordinary whitespace/control prefixes; numeric and quoted cells preserve CSV shape, active roster labels remain unmodified |

This corrects the earlier blind spot in the People directory CSV encoder (which had recognized ASCII whitespace/control prefixes but not Unicode format and combining marks). **Tests were not run**. Database-role races and browser/spreadsheet import checks are still required.

## Admin staff roster + devices page execution contracts

| Page | New rendered regression test | Cases |
| --- | --- | --- |
| `/admin/colleges/[collegeId]/admins` | `tests/unit/chat4-superadmin-college-admins-list-page.test.tsx` (`SA-colleges-admins-list-01`) | Empty roster, College Admin/TPO onboarding actions, persisted suspended/role flags, scoped devices/history links, truthful 500-role cap disclosure, denied service without a rendered page |
| `/admin/colleges/[collegeId]/admins/[userId]` | `tests/unit/chat4-superadmin-college-admin-sessions-page.test.tsx` (`SA-colleges-admins-sessions-01`) | Empty device state, persisted per-device labels, user agent HTML escaped, IP and IST timestamp, matching revoke count, no cross-tenant render after service denial |

Both use isolated service mocks and server-rendered markup, **not** end-to-end browser or database races. Verification of device revocation persistence, pagination and accessibility remains outstanding. No CI execution performed.

## College student import history read service

| Export | Test | Coverage / outstanding |
| --- | --- | --- |
| `src/modules/people/college-import-history-service.ts` `listCollegeStudentImportHistory` | `tests/unit/chat4-college-student-import-history.test.ts` (`COL-people-import-history-01`) | Reject malformed/ambiguous numeric strings before SQL, deny ordinary learner/inactive College Admin, recheck persisted `people.manage` before any event rows, page by 20 with 21-row lookahead and correct offset, map metadata counts safely and suppress negative, fractional, infinite or NaN counts. No real PostgreSQL race or UI browser run. |

## Faculty CSV registration and preview

| Export | Behavioral test | Coverage / caveats |
| --- | --- | --- |
| `src/modules/people/college-faculty-csv-service.ts` `runCollegeFacultyCsv`, `FACULTY_CSV_COLUMNS` | `tests/unit/chat4-college-faculty-csv-import.test.ts` (`COL-people-faculty-csv-01`) | PREVIEW has no mutations, 500-row structural cap, explicit confirmation/unknown-field validation, wrong role/deactivated account denial, duplicate mobile/email/casefolding, invalid type, normalized +91 phone and legacy faculty title, successful College-scoped onboarding/profile, distinct safe FAILED vs PARTIAL receipts without exposing exception details. Real identity/index conflicts and cross-request rate limits remain PostgreSQL/integration gates. |

New tests have not been executed.

## Super Admin per-person audit private read

| Export | Test | Evidence and remaining stage |
| --- | --- | --- |
| `src/modules/people/super-admin-person-audit-service.ts` `listSuperAdminPersonAudit` | `tests/unit/chat4-superadmin-person-audit-actor.test.ts` (`SA-people-audit-ACTOR-01`) | Denies without selected college or authorized membership; rechecks live `people.manage` Super Admin permission *inside the activity-events transaction*, holding actor lock until private event read finishes; returns only membership-specific 100-row audit projection; no raw metadata. Live PostgreSQL concurrent role/scope revocation remains open. |

## College faculty bulk membership import

| Export | Behavioral test | Test coverage and boundary |
| --- | --- | --- |
| `src/modules/people/faculty-bulk-import-service.ts` `importFacultyCsv` | `tests/unit/chat4-college-faculty-bulk-service.test.ts` (`COL-people-faculty-bulk-01`) | Strict confirmation and shape, selected College Admin college must match request, Indian E.164 normalization, duplicate mobile skip, faculty role only, 500-row parser safety, collision/unknown exception mapped to safe per-row FAILED, later valid rows continue. No PostgreSQL identity index race executed. |

## Academic contacts filtering and strict role directory paging

| Export / route | Coverage evidence | Security claim / unfinished work |
| --- | --- | --- |
| `src/modules/people/college-role-directory-model.ts` `collegeRoleDirectoryQuerySchema`, `parseCollegeRoleDirectorySearchParams` | `tests/unit/chat4-college-role-directory-decimal-page.test.ts` (`COL-people-directory-PAGE-01`) | Supports existing 10/25/50 page sizes and bounded pages while rejecting hex, exponent, fractional, whitespace, duplicate and explicit blank numeric parameters; canonically preserves authorized filters and page size |
| `src/modules/people/college-contacts-academic-scope.ts` `inProgram`, `activeEnrollment` | `tests/integration/chat4-college-academic-cross-tenant-pg.test.ts` (`COL-contacts-scope-PG-01`) | The filters now require a learner enrollment's declared program and cohort to agree before counting same-college academic participation. Disposable PostgreSQL fixtures exercise a separate synthetic learner with only a foreign cohort while the valid local learner remains visible; cloud CI not run |

No in-memory preview may be considered tenant proof without the persisted membership/context and PostgreSQL fixture. Integration execution is still pending.

## College student import placement: coherent program, cohort and college

| Source | Tests | Required integrity |
| --- | --- | --- |
| `src/modules/people/college-student-import-placement.ts` `placeImportedLearnerInSection` | `tests/unit/chat4-college-student-import-placement-integrity.test.ts` (`COL-student-import-placement-tenant-01`); `tests/integration/chat4-college-academic-cross-tenant-pg.test.ts` (`COL-student-import-placement-tenant-PG-01`) | The section's program, academic period, cohort start period and learner member must all belong to the same college; learner enrollment's declared program must actually own its referenced cohort before the locked capacity check, membership insert, and single audit. Disposable DB fixture for a College A member with a College B declared program and College A cohort expects CLASS_BATCH_MISMATCH and zero inserted class memberships. CI/test execution pending. |

## Further weakest-module tests (College Admin, authored and pending CI)

| Export | Behavioral test | Cases and remaining evidence |
| --- | --- | --- |
| `src/modules/people/college-person-profile-overview-service.ts` `getCollegePersonProfileOverview` | `tests/unit/chat4-college-person-profile-overview.test.ts` (`COL-people-profile-overview-01`) | Validates UUID/kind before reads, permits authorized same-college editor, rejects stale actor within private profile read transaction, absent/foreign row denied, strips learner Aadhaar/PAN numbers and faculty masked PAN/private receipt IDs in the returned view model |
| `src/modules/people/e2e-identity-directory.ts` `e2eIdentityDirectory.findByPhone/findByEmail/createUser/updateUser` | `tests/unit/chat4-college-e2e-identity-directory.test.ts` (`COL-people-e2e-identity-01`) | Stable opaque SHA-derived synthetic test identity, does not expose raw contact in UID, email casefolding, no user-row writes from fixture directory, missing and existing identity paths |
| `src/modules/people/identity-profile.staged.ts` `loadOwnIdentityProfileStaged`, `saveOwnPersonNameStaged` | `tests/unit/chat4-college-staged-identity-profile-safety.test.ts` (`COL-people-staged-profile-01`) | Explicit staging disclaimer, live persisted `identity.self.manage`, actor UPDATE lock, safe positive CAS, atomic version increment, no email/phone/identity UID overwrite in name-only SQL. Intentionally **not** a runtime route; migration not promoted |
| `src/modules/academics/college-promotion-faculty-readiness.ts` `getPromotionFacultyReadiness` | `tests/unit/chat4-college-promotion-faculty-service-behavior.test.ts` (`COL-promotion-faculty-02`) and existing `chat4-college-promotion-faculty-readiness.test.ts` | Wrong/revoked actor denied before read, unknown cohort and unmapped target term return truthful incomplete, all mapped courses must have eligible staff, duplicate assignments do not inflate distinct courses, empty/staffed state. Database readiness/cross-tenant role revocation race remains open |

Tests were authored but not executed. On no account should a staged adapter be promoted to a live route solely because its model has source-contract tests.

## Super Admin tenant landing pages (rendered, CI pending)

| Page | Test file | Paths exercised |
| --- | --- | --- |
| `/admin/colleges/[collegeId]` | `tests/unit/chat4-superadmin-college-detail-page-states.test.tsx` (`SA-colleges-detail-01`) | Active selected college's setup and verification links, archived college restoration only with an active parent, archived parent restore-first notice, no unsafe setup on archived tenants, missing/forbidden tenant denial |
| `/admin/organizations` | `tests/unit/chat4-superadmin-organizations-page-journey.test.tsx` (`SA-organizations-page-01`) | Super Admin permission before invalid URL errors, duplicate/unknown/invalid pagination, truthful page 2 of 2 from twelve scoped records, archived organization restore choices, create action and empty scope without fabrication |

These SSR mock journeys supplement, not replace, persisted actor authorization in the respective services and PostgreSQL tenant-scope fixtures. They are authored and **not run**.

### Synthetic E2E identity missing-contact collision prevention

`src/modules/people/e2e-identity-directory.ts` now rejects direct `createUser` invocations with neither phone nor email via `IDENTITY_CONTACT_REQUIRED`. Its old deterministic `e2eUid("missing-contact")` branch could map unrelated fixture users onto the same synthetic UID if bypassing the outer identity resolver. `tests/unit/chat4-college-e2e-identity-directory.test.ts` now includes `COL-people-e2e-identity-02` with no database read. Cloud CI pending.

## College semester/batch directory query boundaries

| Exports | Test | Exercised behavior |
| --- | --- | --- |
| `src/modules/academics/college-academic-directory-model.ts` `collegeSemesterDirectorySchema`, `collegeBatchDirectorySchema`, `academicDirectorySearchParams`, `academicDirectoryHref`, `academicDirectoryPageCount` | `tests/unit/chat4-college-academic-directory-strict-filter.test.ts` (`COL-academics-directory-FILTER-01`) | True decimal-only page, pageSize, term, credits and year parsing for URL filters; rejects foreign college/org/unknown keys and arrays; preserves legacy 10/25/50/100 page-size options; enforces credit bounds and batch progression/date contradictions; round-trip authenticated filter URLs without query resets, 1-page empty directory |

No runtime CI execution. Numeric internally validated number callers remain supported.

## Local first-party identity contact boundary

`src/modules/people/local-identity-directory.ts` `createUser` now raises `IDENTITY_CONTACT_REQUIRED` if a direct caller supplies neither email nor phone. This enforces the same login-recoverability rule as `resolveOrCreateIdentity` at the adapter boundary rather than creating unreachable anonymous accounts. `tests/unit/chat4-college-local-identity-directory.test.ts` includes the `COL-people-local-identity-02` negative case; existing ordinary phone/email creation and unique opaque ID cases remain. Cloud CI pending.

## Super Admin verified web address page

`/admin/colleges/[collegeId]/subdomain` has a new actual SSR route test, `tests/unit/chat4-superadmin-college-domain-page-journey.test.tsx` (`SA-colleges-domains-page-01`), exercising selected-college management permission before private domain/verification-token calls, empty and verified hosts, managed subdomain routing, missing/out-of-scope tenant 404, and non-Super Admin denial without domain metadata reads. All rendered tests are mocked, not an actual DNS/TLS check. Cloud CI and staging deployment verification remain required.

## Super Admin college verification page

`/admin/colleges/[collegeId]/verification` now rejects nondecimal `page`/`pageSize` URL values (scientific/hex/whitespace/blank) *after* authorized college selection but *before* queue and policy reads. `tests/unit/chat4-superadmin-college-verification-page.test.tsx` (`SA-colleges-verification-FILTER-01`) covers malformed paging, repeated values, denied persisted Super Admin preflight, scoped valid queue, persisted TPO policy and safe scan-cap retry state. Authored, not run; actual verification table/storage, full filter matrix and browser profile-review workflows remain separate gates.

## Super Admin college branding page (rendered route behavior)

`/admin/colleges/[collegeId]/branding` is covered by `tests/unit/chat4-superadmin-branding-page-journey.test.tsx` (`SA-colleges-branding-page-01`): deny non-Super Admin before loading private branding/upload receipts, 404 malformed and foreign-scoped college IDs, no fallback to another college's branding, stored preview and optimistic version 7, signed/uploaded logo manager scoped to the same tenant, and propagate storage failures instead of inventing a successful preview. All assertions use mocked service projections and SSR, **not** actual file uploads or browser-domain appearance; CI execution pending.

### Promotion faculty readiness now holds persisted actor authorization

`getPromotionFacultyReadiness` now executes the full trusted-cohort, target-term and active-faculty read inside one PostgreSQL transaction protected by `assertPersistedPlatformPermission(tx,context,"academics.read",{collegeId,organizationId})`. `tests/unit/chat4-college-promotion-faculty-service-behavior.test.ts` adds `COL-promotion-faculty-ACTOR-03`: revoking the actor between request-context scope preflight and the first database SELECT must deny with no private read. Still requires CI and real concurrent role-revocation PG integration.

## Projects hardening — College Admin role journey (owner priority; 2026-10-18)

| Export or UI | Behavioral test | Security / UX evidence |
| --- | --- | --- |
| `src/modules/projects/admin-insights-service.ts` `listProjectAdminSnapshots` | `tests/unit/chat4-project-admin-directory-persisted-actor.test.ts` (`PROJ-BREAK-COLLEGE-04-READ-01`, `PROJ-BREAK-COLLEGE-04-IDOR-05`) | College Admin own tenant and zero-row page, selected Super Admin, forbidden TPO/Learner/inactive memberships, foreign college ID refused **before** scope lookup; persisted `projects.manage` rechecked inside one transaction holding role locks through count, page, and eight aggregate reads |
| Same service `listProjectAdminRiskQueue` | `tests/unit/chat4-project-admin-risk-submissions-live-actor.test.ts` (`PROJ-BREAK-COLLEGE-04-READ-02`, `PROJ-BREAK-COLLEGE-04-IDOR-05`) | At-risk private queue blocked on revoked College Admin and foreign IDs before data/existence read, same transaction spans query and risk evidence |
| Same service `getProjectAdminSubmissionSummary` | Same test (`PROJ-BREAK-COLLEGE-04-READ-03`, `PROJ-BREAK-COLLEGE-04-IDOR-05`) | Persisted actor guard on summary projection, known active/review/return counts, forbidden membership and wrong tenant |
| Same service `listProjectAdminSubmissionQueue` | Same test (`PROJ-BREAK-COLLEGE-04-READ-04`, `PROJ-BREAK-COLLEGE-04-IDOR-05`) | Persisted actor guard through count/page reads; malformed query and foreign college rejected before private SELECT |
| `src/modules/people/college-import-history-request-model.ts` `isCurrentCollegeImportHistoryRequest` and `src/components/college/college-student-import-history.tsx` | `tests/unit/chat4-college-import-history-response-race.test.ts` (`COL-people-import-history-RACE-02`) | Rapid page changes, close/reopen, old aborted network responses never replace newer table data; explicit AbortController, page bounds, safe generic errors, existing rows remain until new page succeeds |

All cases are authored, not executed. Remaining project acceptance gates: concurrent PostgreSQL role revoke/commit visibility, full mutation state-machine races and actual mobile browser interactions.

## College Admin UX: responsive academic directory (2026-10-18)

| Component | Behavioral test | Coverage |
| --- | --- | --- |
| `src/components/academics/college-academic-directory.tsx` `CollegeAcademicDirectory` | `tests/unit/chat4-college-academic-responsive-data-table.test.tsx` (`COL-UX-ACADEMIC-TABLE-01`) | Native semester/batch tables replaced by the shared `DataTable`: keyboard-labelled horizontal scroll cue, sticky first column, mobile primary/secondary/actions priorities, collapsible remaining metadata and legacy wording. Semester Edit actions, batch Students/Manage actions, IST-independent academic-year labels and honest empty-filter recovery retained. SSR mock cases authored; browser accessibility and phone visual verification still pending. |

| `src/components/academics/college-structure-directory.tsx` `CollegeStructureDirectory` | `tests/unit/chat4-college-structure-responsive-data-table.test.tsx` (`COL-UX-STRUCTURE-TABLE-02`) | Classes and elective-slot native tables replaced by one responsive `DataTable` each, retaining batch, period, capacity, active learner and elective choices facts, scheduling, archive, offerings and eligible-students actions. Shared scroll cue and phone details disclosure; SSR tests authored, mobile browser test pending. |

| `src/components/college/college-role-directory-workspace.tsx` `CollegeRoleDirectoryWorkspace` | `tests/unit/chat4-college-people-responsive-directory.test.tsx` (`COL-UX-PEOPLE-TABLE-03`) | Replaces desktop People native table with labelled `DataTable` (stable membership-ID row keys, sticky first column, scroll cue), while retaining independently optimized existing `md:hidden` phone cards. Faculty teaching/role actions, learner program/batch/class, contact card, verification, modal and lifecycle actions retained. Denied-scoped service case, rendered learner/faculty cases authored; browser keyboard and 320px audit pending. |
| `src/modules/people/college-faculty-csv-draft-model.ts` `facultyCsvResponseBelongsToDraft`; `src/components/college/college-faculty-csv-import.tsx` | `tests/unit/chat4-college-faculty-csv-draft-race.test.ts` (`COL-people-faculty-csv-RACE-03`) | Valid preview only for the same CSV revision, cancel stale file reads, disable edits while request is pending, preserve draft on failed submit, show safe errors without backend details, prevent an outdated preview from authorizing a different draft. Browser double-submit and API races remain integration gates. |

## IIT Dharwad Projects archive conflict safety — COL role journey

| Surface | Test | Evidence and unfinished gate |
| --- | --- | --- |
| `src/modules/projects/instance-archive-model.ts` `archiveProjectInstanceInputSchema`, `projectArchiveTokenMatches`; `src/modules/projects/instance-service.ts` `archiveProjectInstance` | `tests/unit/chat4-project-archive-cas-handler.test.ts` (`PROJ-BREAK-COLLEGE-04-ARCHIVE-07`) | User-submitted stale tabs compare the expected updated timestamp against the row-locked project before archive. Already archived repeats remain idempotent, persisted role checked even for no-ops. Internal no-body callers still use legacy service path; all-caller CAS migration remains. |
| `src/app/api/projects/[projectId]/archive/route.ts` POST | Same test | Same-origin, bounded strict JSON ISO timestamp, no unexpected fields, malformed/oversize body rejected before mutation, service authorizes tenant/role. |
| `src/components/projects/project-archive-control.tsx` | Same test and source | Now sends the exact timestamp in the confirmation, URL-encodes project ID, and displays refresh/try-again message on failure. |

PostgreSQL concurrent archive/edit and exactly-once event/notification assertions remain final integration gates. Tests authored, deliberately not executed per owner.

## Further College Admin Projects and curriculum resilience

| Export/surface | Behavioral evidence | Scope |
| --- | --- | --- |
| `src/components/projects/project-archive-control.tsx` `ProjectArchiveControl` | `tests/unit/chat4-project-archive-dialog-guard.test.tsx` (`PROJ-BREAK-COLLEGE-04-ARCHIVE-08`) | A synchronous ref prevents double POST before React paints, blocks dialog dismissal during the pending archive/restore, uses CAS timestamp for both; state-specific Archive/Restore SSR coverage. Browser click-race still pending. |
| `src/components/academics/college-term-mapping-manager.tsx` `CollegeTermMappingManager`; `src/modules/academics/college-term-mapping-model.ts` `reorderTermCourseIds`, `collegeTermCourseUpdateSchema`, `collegeTermMappingErrorMessage` | `tests/unit/chat4-college-term-mapping-phone-actions.test.tsx` (`COL-UX-TERM-MAPPINGS-04`) | Existing drag and keyboard arrow reordering, Edit/Remove, credits and status, exact legacy mapping columns and confirmations preserved in responsive `DataTable`. Single-flight mutations; unsafe backend strings replaced by friendly messages; ordering bounds/rejections asserted. Still pending real mobile and postgres concurrent reorder. |
