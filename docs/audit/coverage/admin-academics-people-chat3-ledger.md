# chat-3 — Super Admin Academics and People page audit

Snapshot: 2026-10-18, source branch `chatgpt/chat-3-b`. Role-journal and code-based audit only; no signed-in browser run, no database transactions executed. **Status: PARTIAL.** A test reference below means the named assertions are present, not that every branch or click path has been exercised.

| Page or service | Role, scope and UX contract reviewed | Test or outstanding gate |
|---|---|---|
| `/admin/academics` | Selected college required before academic workspace; no-scope recovery | `tests/unit/chat3-superadmin-academics-people-journeys.test.ts`, `chat3-superadmin-academics-people-audit-r2.test.ts` |
| `/admin/academics/sections/[sectionId]` | Super Admin scope checked, foreign section hidden, invalid UUID private 404 | `tests/unit/SA-ACADEMICS-PEOPLE-BREAK-chat3.test.ts`; PostgreSQL row-revocation test **GAP** |
| `/admin/people` | Selected college required before membership mutations, stable paging and no-scope call-to-action | `tests/unit/chat3-superadmin-academics-people-audit-r2.test.ts`; browser-role switch test **GAP** |
| `/admin/people/directory` | Tab-aware roles, selected-college contact visibility only, bounded paging and filters | `tests/unit/chat3-superadmin-academics-people-journeys.test.ts`, `SA-ACADEMICS-PEOPLE-BREAK-chat3-02.test.ts`; live DB export/read consistency **GAP** |
| `/admin/people/directory/[membershipId]` | Private missing member and masking outside selected college | `tests/unit/chat3-superadmin-academics-people-audit-r2.test.ts`; persisted member switch **GAP** |
| `/admin/people/directory/[membershipId]/audit` | Exact identity-scoped audit and truthful zero events | `tests/unit/chat3-superadmin-academics-people-audit-r2.test.ts`; real append-only audit chronology **GAP** |
| `/admin/people/unassigned` | Unassigned identities only in global scope, never exposes contact or sessions | `tests/unit/SA-ACADEMICS-PEOPLE-BREAK-chat3-02.test.ts`; direct DB authorization **GAP** |
| `/admin/recruiters` | Reuses canonical HR implementation; no alternate authorization path | `tests/unit/chat3-superadmin-academics-people-audit-r2.test.ts`; HR permission matrix belongs HR lane |
| `src/modules/people/admin-user-directory-model.ts` | Reject unsupported filters, role overrides on Faculty/Learner tabs, pagination caps | `tests/unit/SA-ACADEMICS-PEOPLE-BREAK-chat3-02.test.ts` |
| `src/modules/people/admin-unassigned-user-model.ts` | Global-only identity view, strict query, no-contacts page model | `tests/unit/SA-ACADEMICS-PEOPLE-BREAK-chat3-02.test.ts` |
| `src/modules/admin-ui/super-admin-section-detail.ts` | Scope, permission and foreign UUID denial before Section render | `tests/unit/SA-ACADEMICS-PEOPLE-BREAK-chat3.test.ts` |
| `src/modules/admin-ui/super-admin-scoped-people-service.ts` | Selected-college people guard and membership-scoped profile projection | **GAP**: mock tests and PostgreSQL wrong-organization evidence |
| `src/modules/people/admin-user-directory-service.ts` | Scoped membership row + conditional contact projection in SQL | **GAP**: query/role DB integration across global, org and college |
| `src/modules/people/admin-unassigned-user-service.ts` | No membership predicate and global-only guard before DB query | **GAP**: DB service test with identities having ended vs no membership |

## SA-people-scoped-01 — selected-college people query pagination

- `src/modules/admin-ui/super-admin-scoped-people-service.ts` now clamps a previously valid but stale deep-link page to the current filtered total **before** fetching rows. This prevents “page 999 of 1” from falsely reporting an empty faculty or learner list after a role change.
- `tests/unit/chat3-superadmin-scoped-people-pagination.test.ts` checks the actual service entrypoint with a bounded query collaborator: valid page 2, stale page 999, zero matches, invalid/forged filters and no query for disabled Super Admin, Mentor, Learner or missing selected college. Disposable PostgreSQL and browser evidence remain pending.

## SA-PEOPLE-SQL-01 — Super Admin directory SQL and contact privacy matrix

- `tests/unit/chat3-superadmin-people-directory-query-scope.test.ts` executes the real `listSuperAdminUsers` service with a query-capturing collaborator and compiles its Drizzle predicates. It verifies exact organization+college filters are present before contact visibility, and that **global** email and phone fields are generated as `CASE ... ELSE NULL` SQL expressions, not merely hidden in the rendered component.
- Disabled Super Admin, Learner, Mentor and Faculty contexts fail before database reads; injected URL college filters and invalid query shape fail before the query. This is a source/model unit regression, not a substitute for a PostgreSQL-backed account-role walkthrough.

## SA3-FAC-ASSIGNMENTS-01 and SA3-FAC-EXPORT-02 — Faculty assignment roster and CSV

- `src/modules/admin-ui/super-admin-faculty-assignments-service.ts` now joins course offerings and Sections by the **same cohort and academic period**, requires the Section's term and cohort-program department to match the selected college, and clamps stale deep-link pages before fetching rows.
- `src/modules/admin-ui/super-admin-faculty-assignments-csv-service.ts` rejects repeated `status`, `page`, or `q` selectors before `Object.fromEntries` can silently choose the last value.
- `tests/unit/chat3-sa-faculty-assignments-tenant-pages.test.ts` compiles actual Drizzle join predicates and checks role/scope refusal and bounded page recovery. `tests/unit/chat3-sa-faculty-assignments-csv-http.test.ts` exercises the export entry point, 300-row truncation, duplicate filters, private errors and no-store headers. Cloud CI and PostgreSQL verification pending.

## SA3-FAC-ORG-01 / SA3-PEOPLE-ORG-01 — selected organization integrity

- `getSuperAdminFacultyAssignmentClasses` now joins the persisted selected college row and requires its organization to match the selected organization before exposing class facet names. `tests/unit/chat3-sa-faculty-assignments-tenant-pages.test.ts` asserts the extra organization predicate, not just the class department/term college predicates.
- `getSuperAdminPeopleFilterOptions` now applies this organization/college ownership join in all four department, program, cohort and class facet readers. `tests/unit/chat3-sa-people-facets-organization-scope.test.ts` compiles every real Drizzle join predicate and rejects wrong-role/disabled accounts before reads.
- These are SQL-scoping unit contracts, not an assertion that an incorrectly paired college/organization was exercised on a real database. The PostgreSQL isolation journey and CI are pending.

## SA-ACADEMICS-SECTION-01 — explicit platform role on Super Admin Section detail

- `resolveSuperAdminSectionDetail` now requires an **active SUPER_ADMIN system role** before generic `academics.read` permission. The latter is also available to Faculty, Mentor and Learner in their own college; a stale or injected `adminScope` may never upgrade those actors into Super Admin Section pages.
- `tests/unit/chat3-sa-academics-section-platform-role.test.ts` exercises the real entry point against selected same-college Section, foreign organization/college, invalid IDs, missing selection, disabled Super Admin and wrong-role contexts. It also verifies unexpected database errors propagate to the error boundary rather than hiding as 404. Cloud CI and authenticated browser tests pending.

## SA-ACADEMICS-ROOT-01 / SA-PEOPLE-ROOT-01 — explicit root page Super Admin role

- `/admin/academics` and `/admin/people` now assert the active platform `SUPER_ADMIN` role immediately after obtaining the request context, **before** reading the academic workspace or college membership directory. Their selected-college prompt remains visible to authorized Super Admins without a selected college.
- `tests/unit/chat3-sa-academics-people-root-platform-roles.test.ts` checks the ordering of the role guard relative to data reads and the actual `isSuperAdmin` permission behavior against Faculty, Mentor, Learner, College Admin, disabled and legitimate Super Admin contexts. Cloud CI and full authenticated browser routing remain outstanding.

## SA-PEOPLE-ROOT-02 — Faculty assignments and People read-only root privilege

- `/admin/faculty-assignment`, `/admin/people/directory`, and `/admin/people/unassigned` now explicitly reject active non-Super-Admin users before loading Faculty assignments, membership contact lists, or global unassigned identities. This supplements their service-layer checks and prevents a stale `adminScope` from turning generic academic reads into platform-admin pages.
- `tests/unit/chat3-sa-academics-people-root-platform-roles.test.ts` includes `SA-PEOPLE-ROOT-02`, covering the preflight guard ordering relative to each service call. Cloud CI and browser role-switch tests remain necessary.

## SA3-PEOPLE-CLASS-01 — learner class labels scoped to cohort, period and college

- `src/modules/admin-ui/super-admin-scoped-people-service.ts` previously selected a learner's latest Section name through raw `section_enrollments` and `sections` joins with no college or cohort/academic-period consistency check. The correlated class display now validates that Section cohort/term match the current program enrollment, and the cohort's program department belongs to the selected college.
- `tests/unit/chat3-superadmin-scoped-people-pagination.test.ts` compiles the actual class label SQL via `PgDialect`, checks the scoped program/cohort/term and selected college predicates, and retains the original page and role matrix. PostgreSQL mismatched-FK fixtures and browser acceptance remain pending.

### SA-ACADEMICS-BATCH-PERIOD-05 — historical Section period isolation

For a selected batch, active class occupancy includes an enrollment only if its `academicPeriodId` equals the actual Section's period. The roster's `classId` now projects from a Section join constrained to the selected cohort and matching period rather than trusting a possibly stale Section enrollment reference. `tests/unit/chat3-sa-academics-batch-roster-privacy.test.ts` asserts those exact Drizzle joins. Browser/dirty-data DB acceptance pending.

### SA-ACADEMICS-BATCH-ROLE-04 — learner identity integrity

The selected-college batch overview now requires a persisted `membership_roles.role = LEARNER` join in both aggregated active class occupancy and the returned learner roster. Its active-user counting query can no longer include otherwise active Faculty/TPO accounts due to inconsistent imported learner-program rows. The actual Drizzle SQL/param assertions live in `tests/unit/chat3-sa-academics-batch-roster-privacy.test.ts`. PostgreSQL import-corruption fixtures and browser evidence pending.

### SA-ACADEMICS-BATCH-EMPTY-03 — no-Section cohort privacy

`getSuperAdminBatchRosterOverview` now short-circuits after scoped class aggregation if no authorized Sections exist. It returns a truthful empty learner roster without running the sensitive membership projection. `tests/unit/chat3-sa-academics-batch-roster-privacy.test.ts` asserts exact two-query behavior and zero roster join activity. Source validated; PostgreSQL fixture and cloud CI pending.

### SA-ACADEMICS-BATCH-COUNT-02 — duplicate enrollment safety

`getSuperAdminBatchRosterOverview` uses `countDistinct(users.id)` for active Section occupancy, so anomalous duplicate learner-program enrollment joins cannot overcount available seats. `tests/unit/chat3-sa-academics-batch-roster-privacy.test.ts` compiles the actual COUNT DISTINCT expression and the authorized active-college/active-account predicates. PostgreSQL duplicate-join fixture still required.

## SA-ACADEMICS-BATCH-COUNT-01 / SA-ACADEMICS-BATCH-CSV-02 — roster and export integrity

- `getSuperAdminBatchRosterOverview` now counts **active platform users** rather than just active memberships in its Section occupancy aggregate. This aligns displayed Section counts with its active, same-college roster query, avoiding disabled accounts inflating capacity numbers. `tests/unit/chat3-sa-academics-batch-roster-privacy.test.ts` compiles the Drizzle count and active account/membership predicates while checking missing cohort and permission-denied no-read paths.
- `superAdminBatchRosterCsv` now neutralizes spreadsheet formulas prefixed by zero-width or bidirectional formatting characters as well as whitespace and control characters. `tests/unit/chat3-sa-batch-roster-csv-formula-protection.test.ts` exercises quotes, commas, Unicode, every CSV field, class membership labels, and invalid cohort IDs.
- Real PostgreSQL class-count reconciliation and large-roster export browser evidence remain pending.

## SA-ACADEMICS-ROLE-01 — privileged batch overview and Student Register facet readers

- `getSuperAdminBatchRosterOverview` and `getSuperAdminStudentRegisterOptions` now explicitly verify an **active system SUPER_ADMIN** role before delegating to `resolveActingCollege`. That shared helper also supports College Admin actions, so relying upon it alone gave these Super Admin-only services an unnecessarily wide actor surface.
- `tests/unit/chat3-sa-academics-batch-roster-privacy.test.ts` covers wrong-role/disabled early denial plus active same-college cohort census. `tests/unit/chat3-sa-student-register-options-role-scope.test.ts` invokes the real registration-options service, compiles all three persisted-college Drizzle joins, and checks every wrong-role/disabled actor and an invalid selected college.
- No change to College Admin's own Student Register endpoints. PostgreSQL fixture and page acceptance pending.

## SA-LEARNING-FILTER-ROLE-01 — college-wide teaching filter authority

- `getSuperAdminLearningFilterOptions` now explicitly requires an active platform `SUPER_ADMIN` role before calling `resolveActingCollege`. Ordinary Faculty receive college-scoped `courses.read` for their **own assigned courses**, which is not authority to enumerate every college course and cohort through Super Admin filter controls.
- `tests/unit/chat3-sa-learning-facets-platform-role.test.ts` executes the actual service with Drizzle join compilation, verifies two bounded 2,000-row same-college queries, and denies Faculty/Mentor/Learner/College Admin/disabled platform actors before any database access. Cloud CI and authenticated page tests pending.

## SA-ACADEMICS-SPACE-01 / SA-ACADEMICS-PROGRAM-READ-01 — large college workspace and program deletion previews

- `tests/unit/chat3-sa-academics-workspace-bounded-concurrency.test.ts` directly exercises `mapAcademicWorkspaceInBatches` with out-of-order microtask completion, maximum concurrent reads, stable program ordering, validation of 1–32 workers, empty college and partial failure.
- `listProgramContents` now requires `academics.manage`, not generic `academics.read`. Delete-readiness counts of semesters, batches and classes are an administrative capability and should not be returned to ordinary Faculty, Mentor or Learner callers who know program IDs. `tests/unit/chat3-sa-program-dependency-count-roles.test.ts` exercises the real service and three Drizzle tenant predicates, maps dependent totals and denies wrong roles/tenant.
- No new database schema and no migration. Real PostgreSQL capacity and 1,000+ cohort scale acceptance remains pending.

## SA-ACADEMICS-SECTION-OPS-01 — privileged Section operations service

- `getSectionOperationsWorkspace` now denies Faculty, Mentor, Learner and inactive/nonadministrative principals **before** resolving a potentially private Section ID, while still requiring the persisted selected college's `academics.manage` permission afterward.
- `tests/unit/chat3-sa-section-workspace-permission-matrix.test.ts` invokes the real workspace service, checks period-college SQL, all dependent roster/assignment/schedule reads, malformed IDs, disabled actors, wrong tenant and foreign academic-period denial. Cloud CI and PostgreSQL foreign-period fixture pending.

## SA-PEOPLE-DIRECTORY-QUERY-02 — exact directory URL state

- `/admin/people/directory` now refuses duplicate search/page/status keys and extra untrusted tenant selectors before reading any membership rows. Strict query fields remain role, membership state, platform state, search, tab and page; invalid links show the existing clear-filters UI. `tests/unit/chat3-sa-people-directory-strict-url-ssr.test.tsx` renders actual SSR invalid, empty and wrong-actor states. No CI/browser tests executed.

## SA-RECRUITERS-PARTIAL-01 — recruiter summary independent failure

- The canonical `/admin/hr` handler, also exported by `/admin/recruiters`, now keeps a successfully scoped recruiter directory usable if the independent account-status summary query fails. The UI displays **Unavailable**, a concise explanation and a Retry totals action instead of fabricated `0` accounts.
- `tests/unit/chat3-sa-recruiter-directory-partial-service.test.tsx` exercises actual server-page props and legacy alias, service outage states, and wrong/disabled-role denial before private queries. CI and browser React client error flow remain pending.

## SA-PEOPLE-UNASSIGNED-URL-01 — global no-membership identities

- `/admin/people/unassigned` now rejects extra URL keys and repeated query fields before parsing the global identity directory's page/status/role selectors. Real Super Admin role and **cleared organization/college scope** remain prerequisites for this intentionally limited no-contact view.
- `tests/unit/chat3-sa-unassigned-global-identity-ssr.test.tsx` checks actual server rendering for forged selectors, global/selected scopes, Faculty/Mentor/Learner/disabled Super Admin denial, and empty text. No live CI or browser execution yet.

## Targeted repairs and further release gates

- `COL-people-24`: exact legacy mentor-reassignment confirmation description restored at `src/components/projects/project-admin-reassign-mentor-page.tsx`; must rerun its failing test, and real keyboard/retry browser checks remain.
- `COL-people-20` permission protection and `TPO-drives-51` create-route authority appeared source-correct in the current snapshot; the published unit-failure report may be stale. Neither test was weakened or deleted.
- Remaining: full click/action matrix, authenticated wrong-tenant/expired-session browser journeys, current on-screen/CSV reconciliation, responsive keyboard/phone tests, and real PostgreSQL tenancy checks.

## COL-people-20 service-level behavioral permission matrix (new, CI pending)

- `tests/unit/chat3-col-people-20-role-authorization.test.ts` invokes both real service functions using an injected repository, rather than relying only on source-string presence: College Admin, Faculty, Mentor and Learner cannot grant or revoke `COLLEGE_ADMIN` even before a target lookup; disabled Super Admin also fails before lookup; foreign selected scope fails before a write; active, correctly scoped Super Admin can grant and revoke existing privileged membership roles while retaining other roles.
- The existing `college-people-gap-closure.test.ts` `COL-people-20` source assertions all match the current implementation; the published failure entry needs a fresh CI run to confirm the outcome. No test was weakened, skipped or removed.
## Membership UI failure resilience (SA-PEOPLE-BREAK-01)

- The Super Admin / College Admin membership controls now require validated, action-specific mutation receipts before updating role checkboxes, changing the lifecycle badge, dismissing confirmation dialogs, or erasing a typed suspension reason.
- A synchronous in-flight ref prevents duplicate requests and overlapping role/lifecycle commands, even before React commits pending state; network and invalid-JSON failures show actionable recovery and do not announce success.
- Direct behavioural tests: `tests/unit/SA-PEOPLE-BREAK-chat3-01.test.ts` covers grant/revoke, duplicate/invalid/contradictory receipts and each lifecycle transition; browser/network and real PostgreSQL concurrency coverage remains **GAP**.
- The previous unit-failure report's `TPO-drives-51`, `COL-people-20`, and `COL-people-24` expectations all match the current exact source strings. Cloud CI rerun is still required; see `docs/audit/defects-chat-3.md`.

| `src/modules/people/super-admin-person-audit-service.ts` | `listSuperAdminPersonAudit` | `tests/unit/chat3-sa-people-audit-service-live-scope.test.ts` | SA3-PEOPLE-AUDIT-SERVICE-01 | selected college/membership preflight, no read after persisted role revocation, exact same-college actor/subject audit SQL, transactional projection and DB outage propagation; tests authored, not executed |

| `src/app/(authenticated)/admin/people/directory/page.tsx` | `SuperAdminUserDirectory` | `tests/unit/chat3-sa-people-directory-auth-before-query.test.tsx` | SA3-PEOPLE-PREFLIGHT-01 | Super Admin role checks execute before hostile/pending URL parsing; Faculty, Mentor, Learner and disabled platform identities redirect without data read; valid Super Admin receives recoverable invalid-filter state; not executed |
