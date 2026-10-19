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

**No authentic repository-wide grep was run.** Two direct source reads showed the requested consumer names; the two dynamic client imports have since replaced both. The original checklist lacked E8, so the category entry was added to the lane branch. GitHub indexed search for `ag-grid-react`, `themeQuartz`, `TpoGrid.jsx.txt`, `gridExport.js.txt`, `viewMemory.js.txt` and `legacy-grid` returned zero hits; current main and lane tree listings showed zero paths under `docs/design/legacy-grid/`. Direct source reads confirmed the two named spreadsheet consumers are migrated; this does not certify that all source patterns have zero exceptions.

Required future shell commands (not executed):

```bash
grep -Rnl 'TpoSpreadsheetGrid' src --include='*.tsx'
grep -Rnl 'ag-grid-react\|ag-grid-community' package.json package-lock.json src --include='*.tsx'
grep -Rnl 'themeQuartz\|ModuleRegistry.registerModules' src --include='*.tsx'
grep -RnlE '<table([[:space:]]|>)' src/components/tpo --include='*.tsx'
grep -Rnl 'grid/tpo-grid' src/components/tpo --include='*.tsx'
```

## Responsive and regression proof

- Phone: inherited cards, capped primary fields, optional details/actions disclosures, touch-sized selection. No AG Grid instance to screenshot.
- Tablet: `md` breakpoint switches to scrollable Table; sticky 48px checkbox column. Old Quartz tablet behavior unavailable.
- Desktop: per-column width/pin controls persist under storageKey, external filter panel remains, sort applied only to explicitly opted-in numeric/date fields.
- No CI, tests, app execution, or local screenshot comparison was performed by chat-14, per owner's development-only rule.
- **Safety**: vNext server responses, scope restrictions, URL filters, export permission checks, Row action callbacks, and existing saved-view APIs were not moved into the client adapter.
- **Main integration**: `main` has advanced independently and the lane has diverged; do not force-update or fake-rebase the lane, which would risk losing its unmerged UI commits. A normal conflict-aware merge/rebase in a checked-out worktree remains needed.

## Exact completion blockers, in order

1. Land the requested `docs/design/legacy-grid/*.txt` files in the accessible repository and the real AG Grid 36.2 package/lock declarations (owned by the party supplying the baseline; chat-14 did **not** change `package.json`).
2. Read the exact legacy `tpoGridTheme`, `TpoGrid`, export, memory, header-filter, choice-editor and saved-view sources and build an `AgGridReact` implementation in `grid/tpo-grid.tsx`.
3. Register `AllCommunityModule` once, map controlled row selection, selection pruning, column state, numeric/date-only sort, clipboard/export callbacks, option editors, and saved views without widening server permissions.
4. Resolve branch divergence against origin/main without discarding parallel lane edits; run the required greps in the checked-out repository, and record real counts.
5. Provide the complete, value-by-value legacy/vNext state table (default, hover, selected, focus, disabled, loading, empty, responsive). Only then tick E8.

## Continuation: fallback hardening (2026-10-19)

The AG Grid source remains unavailable and the package manifest does not declare either `ag-grid-community` or `ag-grid-react`. E8 is **[ ]**. This turn deliberately did not create unresolved imports, fabricate Quartz theme parameters, claim native AG Grid grid state, or run CI.

| Incremental contract | vNext evidence | Limit |
|---|---|---|
| Explicit engine identity | src/components/tpo/grid/tpo-grid.tsx:12 | `TpoGrid` still delegates to shared Table |
| Pinned checkbox separation | src/components/tpo/tpo-spreadsheet-grid.tsx:62 | 48px offset, no browser scroll proof |
| Safe clipboard fallback | src/components/tpo/tpo-spreadsheet-grid.tsx:160 | Browser clipboard permissions not executed |
| Deduplicated filtered selection | src/components/tpo/tpo-spreadsheet-grid.tsx:68 | Backend still owns authorized/filter-scoped `allIds` |
| Selection anchor cleanup | src/components/tpo/tpo-spreadsheet-grid.tsx:94 | No interactive keyboard test |
| Versioned data-free layout | src/components/tpo/tpo-spreadsheet-grid.tsx:50 | Sanitized `:layout-v3` storage on manual resize/pin; legacy `:layout-v2` restored when no valid v3 record, no AG Grid column API |
| v3 restore | src/components/tpo/tpo-spreadsheet-grid.tsx:104 | Saves widths/pins; URL column chooser remains source of visibility |

Source inspection was performed through GitHub file reads; **no** runtime, exhaustive repository grep, visual state matrix, or AG Grid integration evidence exists. Future continuation: `src/components/tpo/grid/tpo-grid.tsx` when upstream legacy-grid and declared AG Grid dependencies become available; otherwise work E1–E5 coverage.
