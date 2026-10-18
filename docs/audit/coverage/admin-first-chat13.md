# chat-13 Super Admin source cross-audit — /admin first third

- **Date / owner:** 2026-10-18, chat-13.
- **Manifest:** `docs/orchestrator/ui-ux/pages-admin.md`, routes 1–37 of 111, from `/admin/academics` through `/admin/hr`.
- **Method:** each of the 37 native route sources fetched from the current branch and scanned; deeper review of academics/section resolver, college lifecycle service, companies directory/history, learner module access trace/student override and HR accounts.
- **Limit:** not a 320px browser, real session, 2-user Postgres, WebView, axe, or screenshot-based audit. Route wrappers may delegate to unaudited client components. The unqualified word “passed” would be misleading here.

## Page-group inventory and disposition

| Order | Exact route group | Count | Source observation | Result |
|---|---|---:|---|---|
| 1–2 | Academics and scoped section detail | 2 | Auth context, selected-college empty/redirect, persisted section scope, `resourceVisibleInAdminScope` | Source reviewed; security assertions `SA-ADMIN-FIRST-02` |
| 3–6 | Announcements, assignments, attendance, audit | 4 | Auth context present on each; no raw table, no short touch-target utility, no new-tab link in route source | Source scanned; delegated components still require browser check |
| 7–10 | Batch promotion, batches, student roster, classes | 4 | Shared responsive DataTable on all four; filtered empty states and context gate. Legacy inactive status presentation checked | Source reviewed; `SA-ADMIN-FIRST-08` |
| 11–20 | College directory/detail, admin roster and history, branding, readiness, sign-in, subdomain, verification | 10 | Auth context in all ten; directory/history use DataTable; detail via scoped lifecycle service; archived parent restore guidance. No raw table/new-tab in route source | Source reviewed; `SA-ADMIN-FIRST-03` |
| 21–22 | Companies directory and selected-college drive history | 2 | Strict parsed filters, read permission, selected college restriction, DataTable on history, capped history row count | Source reviewed; `SA-ADMIN-FIRST-04/05`; tenant aggregate leak fixed as `SA-COMPANY-SCOPE-01` |
| 23–28 | Course progress, courses/offering detail, departments, domains, electives | 6 | Auth context, selected identifiers in route services, no raw table or short touch-target class in route source | Source scanned; service mutation races still require integration |
| 29–30 | Faculty and faculty assignment | 2 | Auth context, selected college; delegated workspace components; no raw table or link trap in wrappers | Source scanned |
| 31–36 | Feature hierarchy, college rules, history, learner override/historical view, trace | 6 | Trace strict query and UUID parsing, selected membership verification, no learner contact data, read-only placements membership rule | Source reviewed; `SA-ADMIN-FIRST-06` |
| 37 | Recruiter accounts (HR) | 1 | Permission `admin-scope.select`, strict query parsing, friendly error, scope-keyed client | Source reviewed; `SA-ADMIN-FIRST-07` |

**Count:** 37/37 top-level route files inspected at source level. All 37 explicitly resolve `getCurrentRequestContext`. None of the 37 route source files contains a raw `<table>`, `min-h-7`…`min-h-10` touch target class or `target="_blank"`. This is NOT evidence that the nested widgets are all accessible.

## Defects and evidence

**SA-COMPANY-SCOPE-01 — addressed.** `src/modules/placements/admin-company-directory-service.ts` filtered employer relationships by selected org/college but fetched `companyCollegeCount` unscoped. This exposed the number of college relationships in other tenants even though those relationships were hidden. The count now joins to `colleges` and applies the same `selected?.collegeId` or `selected?.organizationId` condition.

**PROJ-BREAK-SA-01 — addressed, separate Projects pass.** A dual-role platform Super Admin could lock a B-college project with a College Admin actor membership from A. Backend actor check now verifies persisted project college and organization and rejects mismatched memberships; frontend hides a lock action the current schema cannot audit for membershipless Super Admin. See `docs/audit/defects-chat-13.md`.

**Residual UX / test debt.** Child forms, browser scroll affordances, keyboard focus order, session invalidation, all `/admin` placements-projects detail routes, and mutation transactions require live integration. The preexisting `docs/audit/ux/COVERAGE-MATRIX.md` marks broad coverage; this independent source pass does not substitute for a browser verdict. The specific regression file is `tests/unit/chat13-admin-first-third-audit.test.ts`: 37 per-route source contracts plus 8 role/tenant/feedback invariants, **unexecuted** here.

## P0 release acceptance still required

Run tests, typecheck and Postgres integration with A/B tenant, dual-role SA, inactive sessions and a concurrent offer acceptance. Verify all first-third pages at 320/360/390 px, overlays with keyboard navigation, browser back/forward, and failures on slow networks. Record actual pass/fail per test and screenshot before claiming release parity.


## Responsive overlay correction — SA-ADMIN-HISTORY-MODAL-10
The first-third Super Admin import-history overlay in `src/components/admin/super-admin-student-import-history.tsx` now returns focus to the Import History button when native dialog closes, including Escape, and uses a stationary header with one bounded vertical records scroller. Shared DataTable owns horizontal scrolling. `tests/unit/chat13-super-admin-history-modal-ux.test.ts` verifies the authored source contract; real browser/mobile inspection is still required.


## Faculty bulk import replacement-file fix — SA-FACULTY-CSV-17
On the first-third faculty pages, `SuperAdminFacultyBulkImport` clears an old selection when a new file is invalid or slow to read, rejects stale async text completions, revalidates the selection after the destructive confirm dialog and blocks duplicate submissions synchronously. `canSubmitFacultyBulkImport` behavior plus component constraints are covered by `tests/unit/chat13-faculty-bulk-stale-file-guard.test.ts`. Phone and real session acceptance remain pending.


## Bulk learner override UX — SA-STUDENT-BULK-18
The first-third Super Admin student-access widget now validates selected memberships against the currently visible college roster, prevents double submits using a synchronous pending ref, and freezes the confirmed module/action/membership IDs throughout the network request. Denied/stale/invalid server statuses are mapped to friendly guidance instead of raw error codes. Behavioral selection/feedback tests and component interaction contracts: `tests/unit/chat13-student-bulk-stale-roster.test.ts`; browser acceptance pending.


## Selected organization college bulk-import approval — SA-COLLEGE-CSV-20
`CollegeBulkImport` now invalidates confirmation when CSV or organization changes, sends the exact approved snapshot, refuses duplicate clicks with an in-flight ref, and retains the original organization-bound source validation. `canApplyConfirmedCollegeBulkImport` and `tests/unit/chat13-college-bulk-confirmation-snapshot.test.ts` cover version mismatch, empty/bad drafts, 200-record cap and double submit. No real browser or SQL acceptance is asserted.
