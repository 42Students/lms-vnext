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
