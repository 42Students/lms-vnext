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
