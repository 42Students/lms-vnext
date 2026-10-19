# HR/recruiter sheet and AG Grid parity (chat-15)

Baseline: `42Students/lms-vnext` main `d915bd67b20838f496d2a5b25b4365e748a35dd5` (2026-10-19). Scope: applicant, offers, hiring rounds, drives and recruiter sheet/table workspaces only. Keep the current HR/TPO wording, layout, filters, auth and server state; AG Grid is a widget replacement, not content redesign.

## Dependency gate — unresolved

- [ ] `src/components/tpo/grid/tpo-grid.tsx` from chat-14: not present on the inspected main commit, so its exported API/props and selection/filter behavior cannot yet be verified.
- [ ] `grid-workspace.tsx` from chat-12: not present in inspected `src/components/tpo`; inspect its actual path and props after merge.
- [ ] `docs/design/legacy-grid/*.txt`: directory absent on inspected main. No exact import/export wording or filenames can be certified from absent source files.
- [ ] No speculative AG Grid import, schema or filename strings were added. Existing shared `DataTable` usages remain intact until replacement can retain behaviors.

## HR sheet work queue

- [ ] `src/app/(authenticated)/hr/drives/page.tsx` — drives list / filters / export wording.
- [ ] `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx` — shared applicants and offers; verify any table sections before changing.
- [ ] `src/app/(authenticated)/hr/round-results/page.tsx` — hiring round results.
- [ ] `src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/page.tsx` — round editing.
- [ ] `src/app/(authenticated)/hr/company/reports/page.tsx` — reports table and export.
- [ ] `src/components/placements/recruiter-placement-portfolio.tsx` — recruiter drives workspace links; retain authorization and summary card content.
- [ ] `src/components/placements/recruiter-result-controls.tsx` — result actions; no change until grid row semantics are verified.
- [ ] `src/components/hr/recruiter-applicant-review-drawer.tsx` — review/detail interaction, retain route-backed Drawer.
- [ ] `src/components/hr/recruiter-round-inline-editor.tsx` — author-only rounds, preserve optimistic tokens and pending checks.
- [ ] `src/app/(authenticated)/recruiter/drives/page.tsx` and `src/app/(authenticated)/recruiter/drives/[jobId]/page.tsx` — aliases of HR pages; wire only at source.

## Integration contract to verify when dependency lands

- Only import the actual shipped `TpoGrid` / grid-workspace exports, using the established dynamic client boundary where required; do not invent prop names.
- Preserve server-authorized recruiter/college scope, querystring filters, CSV export names, column titles, empty, loading and error behavior and modal focus.
- Verify pinned 48px selection column, filtered-row checkbox selection, keyboard multi-select/copy, numeric/date-only sort, persistence by scoped storageKey and deselection of filtered-out rows against legacy-grid source. Never leak rows between employer/college contexts.
- Document import/export buttons and filenames with old-LMS `file:line` and vNext `file:line` evidence before any tick.

## Strict tick status

- [ ] E8 HR AG Grid wiring (missing: both shared components, legacy-grid source, full value table, grep coverage and responsive proof).

Next check after merging origin/main: `src/components/tpo/grid/tpo-grid.tsx`, then `src/components/tpo/grid-workspace.tsx` or whichever path chat-12 actually exports. Do not mark done for absence.

## Bounded continuation — 2026-10-19

Branch fast-forwarded from b1d0962 to then-current main b275ca0 BEFORE changes. Subsequent main activity may advance further. No CI/test/runtime execution.

### Additional source evidence and status

| Property | Legacy file:line | vNext file:line and observation | Result |
|---|---|---|---|
| AG Grid engine | lms2-fe/src/components/tpo/grid/TpoGrid.jsx:2-4 imports ag-grid-react, AllCommunityModule, themeQuartz | src/components/tpo/grid/tpo-grid.tsx:1-12 is still fallback to TpoSpreadsheetGrid. package.json lookup on branch returned no ag-grid-community or ag-grid-react declaration | OPEN: chat-14 engine blocked; package untouched |
| Students sheet | GridWorkspace.jsx:396-457 toolbar | src/components/tpo/tpo-students-spreadsheet.tsx:214-237 has GridWorkspace around TpoGrid; /tpo/students/page.tsx:963 passes canManageViews=manageAllowed | Partially wired |
| Applicant sheet | GridWorkspace.jsx:396-457 | src/components/tpo/tpo-applications-spreadsheet.tsx:51-62 wraps existing review drawer and row links | Partially wired |
| Company sheet | GridWorkspace.jsx:396-457 | src/components/tpo/tpo-companies-spreadsheet.tsx:17-78 with local column preference; tpo/companies/page.tsx renders it within existing authorized pagination and export | Partially wired, DataTable fallback |
| Company URL keys | legacy grid's local layout | src/modules/placements/tpo-company-url-validation.ts:3-9 forbids columns query; grid/grid-workspace.tsx:18-20,62-111 stores column preference locally | Preserves strict server guard |
| Student saved views | GridWorkspace.jsx:410-438,518-525 | tpo-student-saved-views.tsx:31-72 embedded mode loads existing views on open; permissions checked in parent page | API retained, memory descriptions incomplete |
| Page-scoped act bar | GridWorkspace.jsx:458-494 | grid/grid-workspace.tsx:212 onward selects authorized shown page, offers Copy and Clear, optional act slot | Functional, pending pixel checks |
| Roll paste | legacy ui/rollParser.js:3-18 | grid/grid-workspace.tsx:132-155 handles numbered lists, roll aliases, case-folded matching, ambiguous duplicates fail-closed | Functional variation |
| Zero result recovery | GridWorkspace.jsx:461-471 | grid/grid-workspace.tsx:84-100 and below count strip have Clear search and filters | Functional partial |
| Website external link | legacy-styles/components___common.scss:69-74 | tpo-companies-spreadsheet.tsx:50-58 and tpo-safe-company-url.ts:1-11 allow only credential-free http(s), new-tab disclosed | Safe, style not fully verified |

### Unticked items and blockers

- [ ] AG Grid themeQuartz parity. TpoGrid is a wrapper to the old TpoSpreadsheetGrid. The user says packages are installed, but the connected package.json currently declares neither package. Per instructions, package.json was NOT changed.
- [ ] Duplicate Columns selector: the old spreadsheet fallback renders a chooser even while GridWorkspace provides a toolbar chooser. Needs chat-14 component seam to suppress one.
- [ ] Wire remaining Drives, batches and roster page grids while keeping server permissions, query guards and actions.
- [ ] Exact responsive, hover/focus/loading/export/selection checks and valid JSX proof. No grep or screenshot was run; do not fabricate counts. Source reads are not grep coverage.

**Next file:** src/components/tpo/recruiter-leads-workspace.tsx after confirming current Engage/Drives sheet routing; then src/app/(authenticated)/tpo/batches/[batchId]/page.tsx for eligibility and roster sheets.
