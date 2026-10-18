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
