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

## chat-12 bounded turn — 2026-10-19 (recruiter-leads-workspace.tsx)

- **Baseline:** chat-12 fast-forwarded to origin/main head 8b8c39571765 before edits. The main branch continued to advance during the turn; do not claim this branch is perpetually up to date.
- **Legacy reference:** lms2-fe/src/components/tpo/grid/GridWorkspace.jsx:396-457 search, Filters, Views, Columns, Export toolbar; :458-494 count and selected act-bar; :499-508 Grid, filtered empty state; :513-516 paste rolls.
- **GridWorkspace port:** src/components/tpo/grid/grid-workspace.tsx:18-42 adds externally owned search, columns, filter toggle, Excel/CSV/copy handlers; :59-118 preserves URL mode for existing student/application/companies pages while avoiding query writes for controlled tables; :173-265 renders toolbar, controlled Filters, Views, Columns, CSV/Excel, counts and selection.
- **Recruiter Leads wiring:** src/components/tpo/recruiter-leads-workspace.tsx:986-1064, wraps *table view only* in GridWorkspace with existing authorized sortedVisible rows and selectedIds, existing client-side filters, saved-view controls, column preference callback, and established recruiterTableExportCsv/recruiterLeadsXlsx/recruiterTableExportTsv handlers. src/components/tpo/recruiter-roster-display-controls.tsx:6-35 keeps sorting controls and hides the redundant Columns dropdown in table view. The Board keeps its original export toolbar and Saved Views; Companies retain their separate service and table.
- **Icons and links:** original 16px white plus SVG now used on Add recruiter lead; contact/person/board links use canonical text-link, lms-inline-link and visible keyboard focus.
- **Safety:** no server APIs, database schemas, permissions, filters or bulk mutation logic were changed. The GridWorkspace never expands beyond supplied authorized rows. No src/components/ui or package.json edits.
- **Unresolved:** current src/components/tpo/grid/tpo-grid.tsx advertises TPO_GRID_ENGINE="shared-table-fallback"; package.json on the connected branch does not declare ag-grid-react/ag-grid-community. Native AG Grid themeQuartz migration belongs to chat-14 and remains **unticked**. Recruiter Leads still renders its existing DataTable under the workspace chrome; this is a behavior-preserving incremental port, not an AG Grid claim.
- **Strict tick rule:** E8 remains unticked. No dev runtime, typecheck, CI, browser screenshots or local grep were run, and component and page-wide zero-mismatch coverage was not established. Source line comparisons are partial only.

**Next E8 file:** src/components/tpo/tpo-company-memory-workspace.tsx (company/drive sheet chrome and contextual actions), after verifying Recruiter Leads column/selection behavior by source review. Then src/app/(authenticated)/tpo/batches/[batchId]/page.tsx for the roster workspace.


## chat-12 continuation — Company Memory / Students / Companies / Team (2026-10-19)

**Git sync:** lane branch fast-forwarded onto then-current main `3a77aebd651756d5a16b9fea375ffc276fa4404b` before edits. Other lanes continue landing main changes, so the branch may diverge afterwards.

| Workspace | Legacy evidence | vNext evidence / preservation | Strict status |
|---|---|---|---|
| Company Memory drives | lms2-fe/src/components/tpo/grid/GridWorkspace.jsx:396-457, :458-508 — Search, Columns, Export, copy and view count | src/components/tpo/tpo-company-memory-drive-grid.tsx:1-69 builds GridWorkspace around authorized `company.drives`; src/components/tpo/tpo-company-memory-workspace.tsx Drives section replaces only duplicate inline controls | Partially ported; no AG engine |
| Company drive search | legacy GridWorkspace.jsx:92-101 controlled/debounced query | DriveGrid:48-65 uses local controlled filter by role, status and Asia/Kolkata year, without changing server scope | Functional, search remains page-local |
| Company drive CSV | legacy GridWorkspace.jsx:321-335 | DriveGrid:48-59 calls EXISTING companyDriveCsv with the shown drive records and unchanged company-specific `-drives.csv` filename. GridWorkspace receives onExportCsv callback | Existing export shape preserved, no XSLX endpoint invented |
| Company drive links | legacy typography `components___common.scss:69-74` | DriveGrid:29-35 accessible role links to original /tpo/placements/jobs/:id | Partial visual parity |
| Team People roster | legacy Team structure preserved | src/app/(authenticated)/tpo/team/page.tsx:101-110 — existing roles, workloads, handovers, permissions unchanged; 38×38px profile placeholders and improved link focus only | UI source fixes; not an AG sheet |
| Students XLSX | legacy Export dropdown, selected rows | src/components/tpo/tpo-students-spreadsheet.tsx:189-195 removes duplicate link but leaves limit warning; grid-workspace.tsx Export menu exposes existing xlsxHref from scoped student action | Duplicate eliminated; server route unchanged |
| Company directory search | legacy sheet single search control | src/components/tpo/tpo-companies-spreadsheet.tsx uses searchMode=hidden because server Companies page already owns the validated Search / Sort / Page Size form. Columns and page CSV remain in GridWorkspace | Deliberate duplicate-input removal |
| Company local columns | legacy chooser | Company Memory DriveGrid local storage and Companies directory local storage; no unsupported query key emitted to company API | Functional |
| Recruiter Leads export feedback | legacy download/copy action status | src/components/tpo/recruiter-leads-workspace.tsx table has role=status after GridWorkspace CSV/XLSX/TSV callbacks | Restored after toolbar consolidation |
| Contextual input label | legacy GridWorkspace.jsx:397-400 uses aria-label of searchPlaceholder | src/components/tpo/grid/grid-workspace.tsx Input aria-label=searchPlaceholder | Source match |

**Dependencies:** `src/components/tpo/grid/tpo-grid.tsx` is still `shared-table-fallback`. Current branch package manifest inspection did not find either ag-grid-community or ag-grid-react; chat-14 owns the native engine. No package.json, shared UI, or TpoGrid engine edits. **Never tick E8 as native AG Grid completed** until the dependency + themeQuartz integration, row/cell/pinned selection and responsive proof exist.

**Outstanding work:** Check underlying responsive cells, sorted/filtered selection interplay, stable column order across saved views, roster/batch/client Team permissions, legacy exact exports and the old AG Grid engine. No application execution, no CI, no screenshot, no repo-wide grep was performed; JSX files were reread from repository content after edits, with manual tag/stray-character checks. Thus no STRICT TICK RULE coverage checkboxes were closed.

**Next source files:** `src/components/tpo/tpo-roster-verification-bulk.tsx`, `src/app/(authenticated)/tpo/batches/[batchId]/page.tsx`, and `src/components/tpo/tpo-spreadsheet-grid.tsx` once native AG Grid imports land.

## 2026-10-19 chat-12 — scoped roster/batch file completion ledger

This pass began by fast-forwarding chatgpt/chat-12-b to origin/main `dba6bbd5456152d9acc1ba31601d9ca32bcab3aa`. No application/CI execution. **Source-level proof is recorded separately from rendered pixel proof** and does not close the global E8 AG Grid engine.

### src/components/tpo/tpo-roster-verification-bulk.tsx

- [x] *Scoped source migration:* responsive selectors, shared controls, single-canvas layout, selection/preflight/receipt preserved. **Global A5–A7/E8 parity remains unchecked.**

| Property | Old LMS source value | vNext source evidence | Source check |
|---|---|---|---|
| Page canvas: one white surface; section separators | `docs/design/old-lms-pages.md:5-6`: no internal card for ordinary sections | `tpo-roster-verification-bulk.tsx:62`: `border-b border-border py-4`, no inner root card | Match to page anatomy |
| Section heading hierarchy | `old-lms-pages.md:6` page title distinct from internal heading | :63 `h2` 18px `font-semibold text-foreground` | Match to section role |
| Compact / tablet selector | `old-lms-shell.css:68-85` phone breakpoint 767px; `old-lms-pages.md:6-10` compact internal workspace | :71 `grid-cols-1 md:grid-cols-2` (phone single column, 768px+ two); `min-w-0`, `max-h-64`, scroll containment | Source-breakpoint coverage; not screenshot |
| Selection controls | `old-lms-shell.css:27,31` interactive rail rows `min-height:44px` | :66,72 `min-h-11` (44px at 4px spacing), input via shared Checkbox | Global touch size aligned; section-specific legacy geometry not independently measured |
| Hover/focus | `old-lms-shell.css:32,47-48` teal hover and 2px focus state | :72 `hover:bg-primary-subtle focus-within:outline-2 focus-within:outline-primary` | Intent/source match; rendered comparison open |
| Confirmation/results | `old-lms-pages.md:5,11` slim strips inside single canvas | :102-118 border-top strips, confirmation highlighted via `bg-primary-subtle` | No nested cards |

**Scoped grep-equivalent proof:** Full current branch GitHub file content was scanned with equivalent regexes for
`grep -nE '<(button|select|input|textarea)([[:space:]]|>)'`, `#[[:xdigit:]]{6}`,
`<svg([[:space:]]|>)` and `rounded-\\[var\\(--lms-canvas-radius\\)\\].*border.*bg-surface`.
Counts in this file respectively **0, 0, 0, 0**. Shared component tags: Button **4**, Checkbox **3**, Select **1**, Textarea **1**. No raw controls reintroduced. The `collegeBulkReviewPayload` and guarded API mutation remain intact; status/invalid/preview/acknowledge/results paths not removed.

**Responsive source proof:** :71 `grid-cols-1` on narrow viewports and `md:grid-cols-2` on wider layouts; :72 `min-w-0 break-words` for long names and 44px labelled hit areas; :85 flex wrapping for correction-reason presets. Actual viewport screenshots are pending; do not treat this as visually measured parity.

### src/app/(authenticated)/tpo/batches/[batchId]/page.tsx

- [x] *Scoped source migration:* one Tabs strip, compact funnel and plain section canvas, styled links/banners, preserved server state. **Global E8 remains unchecked.**

| Property | Old LMS source value | vNext source evidence | Source check |
|---|---|---|---|
| One active tabs strip directly on canvas | `old-lms-pages.md:8` tab strip under header, not repeated | `page.tsx:47` TpoBatchWorkspaceTabs, removed duplicate bottom nav and tabs constant | Match |
| Internal section borders | `old-lms-pages.md:5,12` canvas without card-in-card; funnel strip | :63,91,117 `border-b border-border py-4`, :100 per-metric left separator | Match to page anatomy |
| Slim warning banner | `old-lms-pages.md:11` pale yellow strip and action | :48-56 `border-l-2 border-warning bg-warning-subtle px-3 py-3` | Tokenized, browser tone still to compare |
| Link default and hover | `legacy-styles/components___common.scss:68-75` `.ln-lnk-ul` teal and hover underline | :38,49-56,59,69,113,122-127 `text-link`, `lms-inline-link`, `hover:bg-primary-subtle` for actions | Match source intent |
| Keyboard focus / tap size | `old-lms-shell.css:31-32` 44px row, 2px teal focus treatment | :38,59,69,113,122-127 `min-h-11`, `focus-visible:outline-2` | Source state present |
| Phone/tablet metrics | `old-lms-shell.css:68-85` phone under 768px, tablet ≥768px | :96 `grid-cols-2 md:grid-cols-4`, :100 `min-w-0 [overflow-wrap:anywhere]`; :64 and :121 flex-wrap action rows | Source-breakpoint coverage; not screenshot |

**Scoped grep-equivalent proof:** Full fetched file counted raw controls **0**, literal six-digit hex **0**, inline SVG **0**, manual rounded card wrappers with the audited exact root pattern **0**, shared tab strips **1**, duplicate bottom nav **0**; Link opening/closing tags **9/9**; `focus-visible:outline-2` occurs **9** times. Checks use the exact file content returned by GitHub rather than a local shell grep. Browser/phone/tablet rendered evidence remains pending.

**Next E8 file:** `src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx` for authorized roster table and local filters. The `TpoGrid` engine remains a shared-table fallback until chat-14 integrates AG Grid and dependencies; keep that global checkbox unticked.

## chat-12 follow-on: batch Students and companion actions (2026-10-19)

**Branch sync:** Before the file pass, `chatgpt/chat-12-b` was merged with the latest checked `origin/main` tree (`2d3438d241385b3e913ac27e3908758fc0212294`) using a two-parent GitHub commit `b71fffc28f065456a1b477df5988fbac504a8945`. This retained the unmerged chat-12 roster/batch changes. No local application, typecheck or CI was executed.

### Source-finished file 1 — `src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx`

| Property | Legacy source/value | vNext file:line/source value | Outcome |
|---|---|---|---|
| TPO list chrome | `docs/design/old-lms-pages.md:9-10`: search and filters, then outlined export, compact table with status pills | :103-160 validated GET form with six dimensions; `details` Export has filtered/unfiltered choices | Source-aligned, existing URLs retained |
| One page canvas, no nested ordinary cards | `old-lms-pages.md:5,12` one white canvas, compact funnel/summary strip | :56-74 Journey and :163 summary use `border-b` / `border-l-2`, no nested surface cards | Source-aligned |
| Legacy status pills | `old-lms-pages.md:10` small coloured status labels | :68-69 and :179-184 shared `Badge` for undecided, gap and per-row eligibility | Shared implementation |
| Compact data rows | `old-lms-pages.md:10` hairline table with student, status and actions | :166-206 `DataTable`: Student/roll/class/branch, Eligibility, Registration, Decision source, Actions | Source-aligned; underlying `DataTable` is not AG Grid |
| Authorized row actions | `lms2-fe/src/components/tpo/grid/GridWorkspace.jsx:476-494` actions on current selected/shown rows | :47,167-206 uses `selectTpoBatchStudentView`, `TpoBatchInlineDecision` with original snapshot; participation route preserved | Permissions and scoped model unchanged |
| CSV exports | legacy `GridWorkspace.jsx:321-335,449-455` one Export menu with chosen/visible options | :153-160 details menu links to existing `batchStudentViewExportHref` and current-page CSV API; same page bounds and order | Exports preserved; no speculative Excel |
| Search vs pagination | `GridWorkspace.jsx:400-405,461-470` query and in-view count | :38-48,103-152 server validated search; :161 count explains global search vs 25-person slice; :207-208 server page links retained | Scoped and explained |
| Phone/tablet custom controls | `docs/design/old-lms-shell.css:68-85` phone width below 768px | :58 `md:grid-cols-4`, :104 `grid-cols-1 md:grid-cols-2 xl:grid-cols-3`, :163 `md:grid-cols-3`; all filter selectors `min-h-11` | Authored layout boundary matches 768px |

### Source-finished file 2 — `src/components/tpo/tpo-batch-student-keyboard-actions.tsx`

| Property | Legacy source/value | vNext file:line/source value | Outcome |
|---|---|---|---|
| Ctrl/Cmd selection and copy | `lms2-fe/src/components/tpo/grid/TpoGrid.jsx:59-62,224-228` select/copy shortcuts and TSV | :9-34 preserves `tpoBatchShortcut` and `tpoBatchSelectedClipboard` over visible rows | Functional source retained, runtime untested |
| Visible selection cap | `TpoGrid.jsx:89-102` do not carry hidden selected rows into actions | :13-19 `tpoBatchVisibleSelection(rows,selected)`, select up to 25 authorized rows | Preserved |
| Shared controls and keyboard | `old-lms-pages.md:9-10` compact toolbar, `old-lms-shell.css:31-32` 44px interactive size | :1-2 Button + **added missing Checkbox import**, :35-65 shared Buttons/Checkboxes; 44px `min-h-11` | Strict TS import defect fixed, source aligned |
| Responsive | `old-lms-shell.css:68-85` tablet at 768px | :43 `md:hidden` mobile Actions trigger, :45-50 desktop action row, :56 `grid-cols-1 md:grid-cols-2` with wrapping learner names | Authored breakpoints aligned |
| CSV consolidation | `GridWorkspace.jsx:449-455` Export control | :7 `downloadHref?` optional, :49 link conditional; parent now owns CSV Export menu | Existing component still supports its old caller API |

### Source-finished file 3 — `src/components/tpo/tpo-batch-student-saved-views.tsx`

| Property | Legacy source/value | vNext file:line/source value | Outcome |
|---|---|---|---|
| Pinned saved views | `GridWorkspace.jsx:410-438,518-525`: pinned/recent and save/manage flows | :14-58 same vNext account/batch saved-view API and open/CRUD logic untouched | Source behaviour retained |
| Compact panel | `old-lms-pages.md:5,9`: no redundant nested card; Views accessible from list chrome | :64 border-separated panel, :85 `grid-cols-1 md:grid-cols-2` saved-view rows | Source-aligned |
| Named CSV per saved filter | `GridWorkspace.jsx:294-303,321-335` export via chosen view | :94-95 uses existing server `batchStudentViewExportHref(batchId,1,view.query)` with 44px focusable link | Same authorized endpoint |
| Per-account privacy | legacy saved views are user-scoped `GridWorkspace.jsx:170-194` | :15-34 calls existing batch + current-account API, shows private context copy | No change to authorization |

### Exact file-scoped grep-equivalent counts

The complete current GitHub text of each file was scanned with JS regexes equivalent to the following greps (NOT a local repository-wide shell scan):

`grep -nE '<(button|input|select|textarea)([[:space:]]|>)|<svg([[:space:]]|>)|#[[:xdigit:]]{6}' <file>` and search for `rounded-[var(--lms-canvas-radius)] ... border ... bg-surface`.

| File | Raw controls | Inline SVG | Six-digit hex | Nested canvas cards | Bad quote patterns | Notes |
|---|---:|---:|---:|---:|---:|---|
| batch Students page | 0 | 0 | 0 | 0 | 0 | DataTable 1, Badge 3, Select 5, Next Link open/close 6/6 |
| keyboard-actions | 0 | 0 | 0 | 0 | 0 | Checkbox 2, Button 4; matching open/close tags |
| saved-views | 0 | 0 | 0 | 0 | 0 | Checkbox 1, Button 6; matching open/close tags |

### Responsive and remaining strict-tick evidence

Phone source path: custom forms and saved-view/selection lists are one column, wrap names, and provide `min-h-11` (44px) controls. Tablet: `md:` applies from 768px, matching `old-lms-shell.css:68-85`; summary and grid selectors expand to two/three/four columns as documented. The shared `src/components/ui/data-table.tsx` still uses `sm:table` (640px) rather than the legacy 768px transition. That component is owned by another lane and was not edited.

**STRICT TICK RULE:** These three files are **source-finished**, but global E8 remains **[ ]** (native AG Grid engine still a `shared-table-fallback`; rendered phone/tablet screenshots not performed; shared DataTable breakpoints differ; repo-wide grep coverage missing). Do not claim that source-only checks constitute pixel-level proof.

**Exact next file:** `src/app/(authenticated)/tpo/batches/[batchId]/registrations/page.tsx` — compact registration records and filter/export chrome, then `src/components/tpo/tpo-batch-student-saved-views.tsx` visual verification when real browser proof is available.
