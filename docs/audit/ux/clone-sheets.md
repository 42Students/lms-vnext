# Lane chat-12 — E8 TPO sheets clone

Branch: chatgpt/chat-12-b. Original references: 42Students/lms2-fe, branch lms-dev-2026, src/components/tpo/grid/GridWorkspace.jsx (566 lines), TpoGrid.jsx, SavedViewsManager.jsx, gridExport.js, viewMemory.js; src/components/tpo/tpoFiles.js (141 lines), src/components/tpo/ui/rollParser.js. docs/design/old-lms-pages.md:1-9 is the vNext UI target. The requested docs/design/legacy-grid directory was absent on main; original source was read from the legacy frontend repo.

## Work queue and strict tick status

- [ ] E8 GridWorkspace toolbar and chrome — shared TS workspace created but not all legacy states/exports are complete; responsive tests and greps not run.
- [ ] E8 Students sheet — toolbar wired; saved views moved into Views while retaining existing manage permission; existing advanced filter/search and bulk action UI also remains.
- [ ] E8 Applications sheet — toolbar wired; existing review drawer, authorized server rows and links unchanged; Excel is unavailable without an approved existing export endpoint.
- [ ] E8 Companies sheet — not wired. Next: src/app/(authenticated)/tpo/companies/page.tsx uses a server DataTable with its own query form and role guards.
- [ ] E8 Drives list — not wired. Keep its server actions, lifecycle transitions, permissions and tabs.
- [ ] E8 Roster and batches sheets — not fully wired. Preserve cohort scoping and individual eligibility permissions.
- [ ] E8 AG Grid Community — chat-14 owns src/components/tpo/grid/tpo-grid.tsx, including ModuleRegistry, themeQuartz, pinned selection column and filtering/sorting.
- [ ] E8 HEADER_ALIASES and import preview — aliases ported to src/modules/placements/tpo-import-header-aliases.ts and adopted for allowed academic CSV columns; upload/preview language improved. Legacy roll-based matching and universal Excel import are NOT claimed: vNext's backend intentionally requires a membership UUID and current import supports CSV only.

## Legacy / vNext value comparisons (partial)

| Property | Legacy source and behaviour | vNext source and behaviour | Status |
|---|---|---|---|
| Search debounce | GridWorkspace.jsx:92-101; search retained in URL, 200ms debounce at :61-62, :93-101 | grid/grid-workspace.tsx:44,65-73; 200ms, searchParam defaults to search | Matches time, URL key differs legacy q by design; server compatibility kept |
| Filters button and chips | GridWorkspace.jsx:403-408,457; panel and active chips | grid/grid-workspace.tsx:129-131,145-159 and tpo-grid-filter-panel.tsx:12-54 | Partially matched; panel responsive pattern is vNext BottomSheet |
| Saved Views | GridWorkspace.jsx:410-438,518-525; pinned five, recent fallback, save/update/delete | tpo-student-saved-views.tsx:1-124 integrated through grid-workspace.tsx Views slot; tpo/students/page.tsx passes manageAllowed | Student server workflow retained; legacy menu and memory text not ported yet |
| Column chooser | GridWorkspace.jsx:342-350,442-444; popover, visibility, reset | grid-workspace.tsx:74-78,135-137,160-163 and tpo-grid-column-chooser.tsx:1-57 | Functional, not pixel-identical popover |
| CSV export | GridWorkspace.jsx:321-335,449-455; selection or shown rows | grid-workspace.tsx:79-90,163-170; CSV of authorized current page and selected rows; spreadsheet-safe quoting from tpo-grid-model.ts | Functional partial; original selected-students export remains |
| Excel export | GridWorkspace.jsx:321-335; Excel (.xlsx) menu | grid-workspace.tsx:167-168 takes an existing permission-controlled xlsxHref for students | Only existing authorized endpoint; no client-wide XLSX |
| Copy TSV | GridWorkspace.jsx:336,480-493; grid selection copy | grid-workspace.tsx:92-98,139-140; selected/visible authorized rows; formula-safe TSV | Partial; keyboard Ctrl/Cmd+C remains separately in student sheet |
| Paste roll numbers | GridWorkspace.jsx:310-318,513-516; one per line, comma or space | grid-workspace.tsx:99-117,141-142,170-178; case-insensitive, 500 input cap, ambiguous duplicate excluded | Functional, stricter fail-closed rule |
| Counts / actions | GridWorkspace.jsx:458-494; count and act bar | grid-workspace.tsx:179-185; items in view, selected count, page selection clear | Partial; custom legacy act bar not ported |
| Column headers and pinned select | TpoGrid.jsx:8-32; 48px pinned, themeQuartz, no header filters, number/date sort | chat-14 work pending; current tpo-spreadsheet-grid.tsx has shared Table fallback | Not matched |
| Search and filter empty results | GridWorkspace.jsx:461-471,506-508 | tpo-spreadsheet-grid.tsx empty state; grid-workspace.tsx notice status | Not fully matched |
| Import headers | tpoFiles.js:5-33; normalize punctuation and case | tpo-import-header-aliases.ts:1-62; alias map, allowed-field whitelist, duplicate rejection; academic parser uses mapTpoImportHeaders | Matches aliases; vNext-only studentCode and activeBacklogs added |
| Import preview wording | ImportPreviewModal.js:3-13,117-179; no save before confirm, Will update/Can't match | tpo-academic-import-workspace.tsx:97-152; exact review-before-commit and match headings | Partial; CSV-only and UUID-based workflow retained |

## Preservation and restrictions

GridWorkspace accepts only rows supplied by each server page, and CSV/clipboard/paste work only on those rows. It does not request additional PII or bypass server exports. Existing TPO row-actions, bulk editors, after-college decisions, review drawers and saved-view APIs are kept. The students Views control is shown only when manageAllowed, exactly as before. All new controls use shared Button, Input, Textarea and column chooser; no src/components/ui files were modified.

## STRICT TICK RULE gaps

No local code execution, grep, typecheck, tests, CI or responsive browser verification were performed per assignment. **Verified grep counts: UNKNOWN, not zero.** Required later commands:

- grep -rlE 'TpoSpreadsheetGrid|DataTable|AgGridReact|GridWorkspace' src/app src/components/tpo --include='*.tsx'
- grep -rnE '<button[ >]|<input[ >]|<select[ >]|<textarea[ >]' src/components/tpo/grid src/components/tpo --include='*.tsx'
- grep -rnE '#[[:xdigit:]]{6}' src/components/tpo/grid src/components/tpo --include='*.tsx'

Compare toolbar and sheet header/row measurements on phone and tablet, focus states, copy/export/selection with hidden filtered rows, pagination and saved-view permission failures; only then tick E8.

## Exact next file

src/app/(authenticated)/tpo/companies/page.tsx — adapt its existing server-backed directory table to the workspace chrome without changing its query, pagination, permissions, or company actions. Then drives roster, then remaining import-with-preview surfaces.
