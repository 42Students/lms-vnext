# UX-G170 — attendance outbound CSV acceptance

Scope: `src/modules/attendance/college-department-csv-model.ts`, `src/modules/attendance/college-department-csv-service.ts`, `src/modules/attendance/learner-attendance-history-csv-model.ts`.

## Review and improvements
- Department and learner data are serialized using the centralized `spreadsheetCsvCell` helper. This protects Unicode-hidden formula operators, including spacing and enclosing combining marks, while preserving literal text and RFC-style quoted cells.
- The learner export carries a UTF-8 BOM for Excel interoperability. Its 200-row cap and `truncated` signal are unchanged; no user, email, phone or other hidden row data is added.
- Department export still calls the authorized tenant-scoped insight service. Total/page-count changes and duplicate department IDs across pages now fail with `DEPARTMENT_ATTENDANCE_EXPORT_STALE` instead of silently delivering a confusing report.
- There is no claim of transaction-level database snapshot consistency across multiple queries. The new checks detect observable drift; a snapshot transaction would be needed to eliminate same-count replacements.
- Route-level step-up, permission enforcement, content-disposition, `private, no-store` and `nosniff` remain unchanged.

## Acceptance
- Unit: `npx vitest run tests/unit/ux-g170-g172-csv-acceptance.test.ts tests/unit/learner-attendance-history-csv-model.test.ts tests/unit/college-department-attendance-export.test.ts`
- Existing authorization integration: `tests/integration/college-department-attendance-export.test.ts` (requires database; not represented as passed without its own run).
- Browser: `npx playwright test tests/e2e/ux-g170-g172-csv.spec.ts --project=chromium` at desktop 1280×800 and mobile 390×844.
- Browser fixture only exposes synthetic content in development with `UX_EXPORT_FIXTURE=1`; it exercises real serializers and downloadable bytes. It does **not** replace deployed authorization/browser-user verification.
- Exact-SHA CI: [focused acceptance](https://github.com/42Students/lms-vnext/actions/runs/42392908781). Status and downloadable screenshots must be checked before DONE.

## Regression/security checks
- Preserved tenant-scoped authorization source and route privacy headers, query-key restrictions and export row caps.
- Negative assertions cover duplicate IDs, count drift, incomplete exports and hostile Unicode prefixes.
- Changes deliberately avoid shared `attendanceCsvCell` outside this group, which would change unrelated consumers.
