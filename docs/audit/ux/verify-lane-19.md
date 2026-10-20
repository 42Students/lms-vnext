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
