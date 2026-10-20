# UI/UX polish verification — lane chat-19

## Surface 1 — `src/app/(authenticated)/college/faculty/[membershipId]/page.tsx`
- **Regressions found/fixed:** 0. Inspected imports, JSX, person-detail service contract, permission/404 path, original chat-9 polish proof, shared PageHeader/PageBackLink/Select/Button/StatusBadge/DataTable/EmptyState and CollegeFacultyScheduleReassign's loading, confirmation, retry, and receipt flows. Route `loading.tsx`, `error.tsx`, optional not-found/template (absent), and nearest `college/layout.tsx` checked. No dropped routes, IDs or wording identified.
- **Extra clutter/alignment fixes:** Demoted redundant h1-sized "Faculty record" section heading to a 16px section title and tightened the four metadata definition cells into an aligned, wrapping two-column rail. Preserved legacy heading text, record fields, filter links, staffing actions and status counts.
- **Files changed:** `src/app/(authenticated)/college/faculty/[membershipId]/page.tsx`; queue and verification proof. Source-only 375/768 inspection; no CI/runtime.

## Surface 2 — `src/app/(authenticated)/college/faculty/import/page.tsx`
- **Regressions found/fixed:** 0. Compared chat-9 proof; read authorized page and its loading/error/nearest layout, CollegeFacultyCsvImport, useGuardedAction, file/textarea/checkbox/table components and CSV draft-response model; checked preview/import lifecycle, file-size cap, headers, server route and row status. No missing import, broken tag, removed copy or permission bypass found.
- **Extra clutter/alignment fixes:** Clear a stale import error on raw CSV edits, consistent with uploaded-file draft changes; preserves the upload/validate/confirm sequence, accessible disclosure and 44px phone CTA. Reviewed empty, structural errors, row preview, partial success, 375/768 by source.
- **Files changed:** `src/components/college/college-faculty-csv-import.tsx`; queue and verification proof. No CI/runtime.

## Surface 3 — `src/app/(authenticated)/college/faculty/page.tsx`
- **Regressions found/fixed:** 0. Read the entire server-rendered CollegeRoleDirectoryWorkspace faculty branch, chat-9 polish proof, page/loading/error, parent college layout, role-directory parser/service and UI imports. Checked PersonOnboardDialog, FacultyLifecycleAction, PersonEditAction, Audit/Profile modals, shared DataTable/Disclosure/StatTile and search/form controls; confirmed retained roles, query parameters, CSV links, status and attendance disclaimers, pagination, responsive mobile detail rows, guarded mutations and dialogs.
- **Extra clutter/alignment fixes:** None necessary; existing main-action hierarchy (Register New Faculty), tools disclosure, advanced filters, mobile compact rows and recovery states are consistent with legacy. 375/768 source inspection only.
- **Files changed:** Queue and verification proof only (verified, no source change). No CI/runtime.

## Surface 4 — `src/app/(authenticated)/college/groups/[groupId]/import-preview/page.tsx`
- **Regressions found/fixed:** 1: an in-flight CSV read or preview request could overwrite a newer draft after the user replaces a file or edits the raw CSV. Guarded both async paths with a monotonically increasing draft revision; old results/errors are discarded, and errors clear on new edits. Read route page/loading/error/parent college layout, chat-9 proof, FileUpload/Textarea/DataTable/Alert/EmptyState/Button, payload mapping and preview-only endpoint. Route, role and group kind, copy, max rows and 128 KiB limits unchanged.
- **Extra clutter/alignment fixes:** Kept existing collapsed raw CSV editor, full-width phone preview CTA, hairline result table and viewport-bounded scroll; no extra card introduced. 375/768 source reviewed.
- **Files changed:** `src/components/groups/college-group-import-preview.tsx`, queue and verification proof. No CI/runtime.

## Surface 5 — `src/app/(authenticated)/college/groups/[groupId]/page.tsx`
- **Regressions found/fixed:** 0. Compared chat-9 polish proof, verified server context/GroupReadError and Zod 404 mapping, all group metrics, member and activity tables, existing rule link and preserved group/waitlist mutation APIs. Read CollegeStudyMemberActions (ADD, LOCK, REMOVE, REMOVE_AND_LOCK confirmation states), CollegeGroupDetailWrites (SAVE_RULE, PROMOTE_WAITLIST optimistic versions, validation/error/pending), shared DataTable/EmptyState/StatusBadge/Dropdown/ConfirmDialog plus loading/error and nearest College layout; absent optional template/not-found checked.
- **Extra clutter/alignment fixes:** Reduced a redundant page-sized Members section title to the legacy 16px section heading, leaving the sole PageHeader and all labels/routes untouched. Responsive density and confirmation actions reviewed at 375/768 by source; no CI.
- **Files changed:** `src/app/(authenticated)/college/groups/[groupId]/page.tsx`; queue and verification proof.

## Surface 6 — `src/app/(authenticated)/college/groups/[groupId]/rule-preview/page.tsx`
- **Regressions found/fixed:** 0. Verified the chat-9 proof against the read-only service, not-found/error guards, PageHeader/PageBackLink/ErrorState, Alert and SummaryStrip (steps, label, count fields, tablet scroll), route loading/error and parent layout. No missing import, broken JSX, lost read-only copy, permission or route changes observed.
- **Extra clutter/alignment fixes:** Verified, no change: the partial-sample warning is slim, criteria are disclosed on request and the result strip leads the page with responsive density.
- **Files changed:** Queue and verification proof only; no source modification. Source-only 375/768; no CI.

## Surface 7 — `src/app/(authenticated)/college/groups/page.tsx`
- **Regressions found/fixed:** 1 polish-parity regression: the chat-9 proof claimed group-row Edit/Activate/Close/Archive controls were collapsed under Manage, but the implementation exposed them all. Moved the row action launchers into shared Disclosure; kept Dialog and ConfirmDialog outside the collapsed subtree, preserving focus, controlled state and status mutations. Read page/loading/error/college layout, CollegeGroupActions, DataTable, Pagination, Select, Button, Dialog, ConfirmDialog, query/permission gates and 375/768 responsive behavior.
- **Extra clutter/alignment fixes:** One Manage disclosure per editable row reduces button clutter without changing status labels/confirmation/API routing. Header create action remains primary; filters and empty recovery stay intact.
- **Files changed:** `src/components/groups/college-group-actions.tsx`; queue and verification proof. No CI.

## Surface 8 — `src/app/(authenticated)/college/hiring-dashboard/page.tsx`
- **Regressions found/fixed:** 1. Route's `error.tsx` rendered GracefulErrorBoundary's full branded public shell inside authenticated AppShell, duplicating page landmarks and canvas. Enabled `insideShell` and HR-style local recovery href, preserving retry/security/error logging. Read authenticated layout, loading/error/no optional not-found or template, ReportFilters/ReportMetrics/ReportScopeNote, CollegeHiringFunnel and CollegeReportNavigation plus shared SummaryStrip, select/table/metric components and relevant query/tenant scope; no lost routes or copy.
- **Extra clutter/alignment fixes:** Recovery now uses the single college canvas with responsive primary retry and secondary home, without extra framed panel. Existing report filters, funnel and disclosures remain.
- **Files changed:** `src/app/(authenticated)/college/hiring-dashboard/error.tsx`; queue and proof. Source 375/768; no CI.
