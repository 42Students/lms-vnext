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


## chat-12 replacement-lane continuation — registrations (2026-10-19)

**Synced baseline:** GitHub two-parent merge `b9d1af7b9cb799ac317e14ecdc6069d1aa0a19bc` incorporates inspected main `12ee0a58fd9af5e0e1f1ad975155f864966cb6c0` and preserved all five outstanding chat-12 files. This was a merge, not a destructive branch reset or a git rebase. Later changes below are pushed ONLY to `chatgpt/chat-12-b`. The owner forbids app execution, CI and typecheck. Source inspection is not a screenshot.

### File source-complete: `src/app/(authenticated)/tpo/batches/[batchId]/registrations/page.tsx`

| Property | Legacy source / actual value | vNext file source/value | Proof status |
|---|---|---|---|
| Sheet anatomy | `docs/design/old-lms-pages.md:9-10`: toolbar, compact continuous table, status pills, actions | `registrations/page.tsx:34-89`: existing validated GET filters, DataTable with Learner/Choice/Recorded source/Last recorded update/Consent evidence/Actions | Source-aligned; renderer's 640px mobile breakpoint remains cross-lane mismatch |
| One canvas, no tiles inside sampled funnel | `old-lms-pages.md:5,12`: single canvas, hairline separators and summary strip | `registrations/page.tsx:55-57`: single `border-b` section, small metrics on `border-l-2` instead of nested metric cards | Source-aligned |
| Status badge | `old-lms-pages.md:10`: compact coloured stage/status pills | `registrations/page.tsx:70-72`: shared Badge success for recorded choice, warning for unrecorded | Source-aligned; visual color/state measurements open |
| Export and privacy | `old-lms-pages.md:9-10`: Export from current list | `registrations/page.tsx:58-63`: unchanged scoped /api/placements/tpo/batches/:id/registrations/export with validated filter/page keys | Existing server behavior intact; no unscoped XLSX inferred |
| Link hover/focus | `docs/design/legacy-styles/components___common.scss:68-75`: teal link, underline on hover | `registrations/page.tsx:80-89`: lms-inline-link, text-link, underline + focus-visible outline; 44px target | Default/focus source matched; visited pixel proof open |
| Phone/tablet | `old-lms-shell.css:68-85`: phone <768px, tablet from 768px | `registrations/page.tsx:36`: filter grid 1 col then 2 at md/768, 3 at xl; metric grid md:4 | Authored breakpoint proven; DataTable renders table at sm/640, requires other owner/browser correction |

**File-scoped source scan** on fetched complete `registrations/page.tsx`: regexes `/<(button|input|select|textarea)(?:\\s|>)/g`, `/<svg(?:\\s|>)/g`, `/#[a-f0-9]{6}\\b/gi` each returned **0**. `<Link ` and `</Link>` are **4/4**; curly-brace counts **68/68**. No broad repository claim.

### File source-complete: `src/app/(authenticated)/tpo/batches/[batchId]/registrations/[membershipId]/history/page.tsx`

| Property | Legacy source/value | vNext file/value | Proof status |
|---|---|---|---|
| Continuous canvas timeline | `old-lms-pages.md:5,12`: ordinary sections use thin separators, not cards | `history/page.tsx:27-34`: ordered immutable history list now `divide-y` and `border-y` rather than cards | Source-aligned |
| Filter layout | `old-lms-shell.css:68-85`: 768px phone/tablet transition | `history/page.tsx:22`: 1-column phone, 2-column md, 3-column xl, 44px shared selectors/button | Authored breakpoint; no browser screenshot |
| Warning/availability | `old-lms-pages.md:11`: slim pale warning strips | `history/page.tsx:25-26`: left warning bar, subtle fill | Source-aligned, color rendered proof open |
| Links | `components___common.scss:68-75`: teal hover underline | `history/page.tsx:21,23`: Back and CSV links styled with text-link, visible keyboard focus and 44px targets | Source-aligned |
| Server scope / consent | Existing TPO history service provides tenant-scoped immutable events | Same service and filter parser unchanged; history still never reveals contact details or raw consent versions | Retained; not an authorization runtime test |

**File-scoped source scan:** raw native form controls **0**, six-digit hex **0**, inline SVG **0**; `<Link` / `</Link>` **3/3**, `<Select` / `</Select>` **2/2**, `<Button` / `</Button>` **1/1**. JSX curly braces **34/34**.

**E8 native grid dependency update:** Current main now contains `src/components/tpo/grid/tpo-grid.tsx` with `ag-grid-community`, `ag-grid-react` imports and `themeQuartz` (verified at source lines 10-31, 67); the former fallback-only note elsewhere in this audit is stale. This does **not** prove full native AG Grid row/column/export parity across all TPO sheets. The global E8 checkbox remains **[ ]** until complete coverage, legacy source evidence and rendered responsiveness are verified.

**Unticked follow-up:** `src/app/(authenticated)/tpo/batches/[batchId]/history/page.tsx`, then registration/eligibility import, all legacy-grid HEADER_ALIASES and complete TPO sheet list. No tests, runtime or CI were run.


### More source-complete files: decision history and native company sheets

| File | Legacy reference / value | Current vNext source evidence | Limit |
|---|---|---|---|
| `src/app/(authenticated)/tpo/batches/[batchId]/history/page.tsx` | `old-lms-pages.md:5-6`: continuous canvas, border-separated ordinary sections; `old-lms-shell.css:68-85`: phone <768px | :22 title, :25 mobile-first 1→2→3-column shared select filters, :26 44px export link, :28 audit events as `divide-y` rather than nested cards; existing undo component untouched | Source only; no browser visual proof or safety behavior test |
| `src/components/tpo/tpo-companies-spreadsheet.tsx` | `lms2-fe/src/components/tpo/grid/TpoGrid.jsx:1-24`: AG Grid community Quartz, 44px rows; `old-lms-pages.md:9`: toolbar, table | :16-19 dynamic native grid; :42-76 GridWorkspace with authorized rows, local column chooser/export, native Quartz, company open action, same Create drive route, status label and safe website link | Only current authorized server page; rendered grid and exports untested |
| `src/components/tpo/tpo-company-memory-drive-grid.tsx` | `lms2-fe/src/components/tpo/grid/GridWorkspace.jsx:1-35`: in-view search/export and AG Grid | :31-34 native Quartz dynamic mount; :42-54 existing local search + companyDriveCsv filename `-drives.csv` untouched; :56-69 GridWorkspace, local columns and drive open action | Rendered grid unverified; source-based parity not full E8 |

**File-scoped coverage proof:** GitHub-fetched complete files were inspected with equivalents of `grep -nE '<(button|input|select|textarea)([[:space:]]|>)|<svg([[:space:]]|>)|#[[:xdigit:]]{6}'`. Each of the three files returned **0** raw controls, **0** inline SVG and **0** hex color literals. JSX braces: decision history **43/43**, company directory **40/40**, company drives **35/35**. Decision-history `Link` tags **1/1**, directory `Link` **1/1**. Company grids both mount the AG Grid module through `next/dynamic` with `ssr:false`; phone/tablet fallback belongs to existing `TpoGrid` and remains unverified visually. No package or shared UI files changed.

**Privacy/behavior check from source:** Company directory still gets `rows` from its authorized page and `GridWorkspace` never fetches broader rows. Invalid or non-http(s) company URLs are displayed as text instead of being opened; verified outbound links still use `target=_blank rel=noopener noreferrer`. Memory drives retain the same `shown` controlled role/status/year filtering and existing `companyDriveCsv` CSV file naming. Native grid uses `TpoGrid` provided by chat-14 (not edited here). The original server query, permissions and API surfaces were not changed.

**Unclosed strict E8 evidence:** Native AG Grid cells compared value by value against running legacy, exact entire-repo sheet coverage, XLSX formatting, filtered selection and saved-view migrations, and screenshot proof are still missing. Do **not** tick global E8. Next: `src/components/tpo/tpo-recruiter-leads-spreadsheet.tsx` (if present), otherwise `src/components/tpo/tpo-company-memory-workspace.tsx` and import aliases / preview components.


### Legacy import HEADER_ALIASES and preview UI — replacement lane

| Check | Legacy literal source | vNext source / implementation | Status |
|---|---|---|---|
| Case/punctuation-insensitive aliases | `lms2-fe/src/components/tpo/tpoFiles.js:5-39`: 26 canonical fields with aliases including fullname, emailid, mobileno, companyname, foundvia, ctc, CGPA, passing year | Existing `src/modules/placements/tpo-import-header-aliases.ts:4-34` carries the same 26 canonical fields plus vNext UUID-only `studentCode` and `activeBacklogs` | Source mapped; utility was already present |
| Resolve duplicates and unknown | Legacy `tpoFiles.js:38-55`: header normalization before field whitelist | `tpo-import-header-aliases.ts:35-67` resolves only whitelisted fields and rejects ambiguous aliases/duplicates; academic import parser already calls it | vNext stricter fail-closed behavior retained |
| Recruiter CSV alias use | Legacy `tpoFiles.js:7-24`: name, email, phone, company, designation, source synonyms | `tpo-lead-csv-import-model.ts:137-153` now calls shared map, renames only `company` to recruiter schema `companyName`, retains old `foundThrough` spelling and rejects duplicate/missing six required columns | Source change; no CSV execution or parser tests |
| Import with preview | `lms2-fe/src/components/tpo/ImportPreviewModal.js:10-19`: upload → preview matched/unmatched → commit only after confirmation | `tpo-academic-import-workspace.tsx:107-181`: added visible import step copy (:116), 44px template link (:121-123), actual PREVIEW/IMPORT guarded actions and confirm Dialog retained | Text and toolbar source aligned; actual browser flow untested |
| Limits/identity | Legacy generic matcher accepts aliases such as roll/reference; vNext academic import deliberately requires tenant membership UUID | Existing `tpo-academic-preview-import-model.ts` and scoped TPO import API untouched; roll cannot be silently mapped to membership UUID | vNext security requirement takes precedence |

**File-scoped JSX proof (`tpo-academic-import-workspace.tsx`):** Button tags **5/5**, Dialog **1/1**, label **2/2**, section **1/1**, curly braces **97/97**; zero native button/input/select/textarea tags and no six-digit color literals. `tpo-lead-csv-import-model.ts` curly braces **39/39**, same server schema and duplicate-phone/email checks remain. New import aliases affect the six-column recruiter preview parser but no API contracts or permissions were changed.

**STRICT TICK RULE:** E8 remains **[ ]**; no runtime, CI, viewport or end-to-end preview / XLSX verification occurred. Next area: `src/components/tpo/recruiter-leads-workspace.tsx` for the still-generic Engage/Leads DataTable and its GridWorkspace composition; afterward full icon/link source inventory. Branch edits stayed limited to chat-12-owned TPO files and audit.


## 2026-10-19 chat-15 replacement — Recruiter Drives TpoGrid wiring (source-only)

- [ ] `src/components/placements/hr-recruiter-drives-grid.tsx`: **new authorized client projection**, TpoGrid with columns Drive / Job type / Pay / Shared applicants / Offers / Deadline / Status / Next; existing row action destinations are carried through, including applicants, offers, unanswered college requests, open hiring flow, hire again, and conversation. No new server fetch or mutation.
- [ ] `src/components/placements/recruiter-placement-portfolio.tsx`: when `sheetScopeKey` is provided, display `HrRecruiterDrivesGrid` only from 768px upward; preserve the original full-featured cards on narrow screens and for other existing callers. Existing server-sorted attention ordering remains the source for both.
- [ ] `src/app/(authenticated)/hr/drives/page.tsx`: passes `sheetScopeKey={context.user.id+":"+selectedCollege}`; existing exact employer/college authorization, request stage tabs, query-backed search/filter/sort, server CSV export route and pagination are untouched.

| Legacy reference | New source | Source comparison | Tick? |
| --- | --- | --- | --- |
| `docs/design/old-lms-pages.md:6,10`: one canvas, hairline table and compact rows | `src/components/tpo/grid/tpo-grid.tsx` with Quartz, via `hr-recruiter-drives-grid.tsx` | Shared native engine on desktop; phone retains full old recruiter cards | No — computed visuals absent |
| `docs/design/old-lms-pages.md:10`: Drive, Job type, Pay, Applied, Deadline, Status, row menu | `hr-recruiter-drives-grid.tsx` columns | Employer-safe **Shared applicants** substitutes broader TPO Applied metric; status/text and all direct actions remain | No — structural semantics differ |
| `docs/design/legacy-styles/components___listing-page-header.scss:131-158`: mobile max 767px | `recruiter-placement-portfolio.tsx`: `hidden md:block` / `md:hidden` | Exact source breakpoint 768px; never render a second visible list | No — viewport screenshot pending |
| Legacy export toolbar and filename contract | `hr/drives/page.tsx:147-153` existing `Export matching drives CSV` | Server-authorized download href retained; TpoGrid only supplies its copy/column chrome | No — legacy-grid filenames and UI not proven |
| Employer scope and saved layout | `hr/drives/page.tsx`, `hr-recruiter-drives-grid.tsx` | Only already-authorized `pageResult.rows` handed to client; storage key includes user+college | No — live tenant switching untested |

**Source scan:** the three touched/new files were fetched after the commits; `/<(button|input|select|textarea|table)(?=[\\s/>])/g` => 0 raw native controls each; `/#[0-9a-fA-F]{3,8}\\b/g` => 0 inline hex each. All paired JSX wrappers were inspected by source; no local TS compiler, app, CI, or browser executed. Existing legacy-grid directory not available through the connector at this checkpoint; exact old export filenames remain unverified. Existing package manifest lacks declared AG Grid packages despite native imports. **E8 remains [ ].**

**Next E8 file:** `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx` (applicant/offer/round sheet contract), after a runtime/dependency gate when permitted.


## 2026-10-19 chat-15 replacement — Shared applicants desktop AG Grid (source-wired, unticked)

- [ ] `src/components/hr/hr-job-applicants-grid.tsx`: new `TpoGrid` for the server-approved, already-paginated `applicants.rows`; columns Applicant, Role, Roll no., Branch, UG %, 10th %, 12th / diploma %, Application, Placement-cell screening, Applied; original `Review applicant` row route preserved. This component neither fetches nor persists applicant records.
- [ ] `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx`: shared applicant table visible at the `md` desktop breakpoint; all original detailed cards remain on phones. Existing focused review `RecruiterApplicantReviewDrawer`, server CSV button labelled `Export shared applicants CSV`, stage tabs and 25-row pagination unchanged. Storage key includes user, drive, stage; each sheet is built strictly from the authorized page rows. Employer-visible applicant detail fields unchanged.
- [ ] Exact Quartz/import/export/column/selection parity needs native dependency, runtime, viewport and legacy-grid source verification.

| Property/state | Old LMS source/value | vNext source/value | Match/evidence |
| --- | --- | --- | --- |
| One canvas with directly embedded dense table | `docs/design/old-lms-pages.md:6,10`: white canvas, hairline table | `hr/placements/jobs/[jobId]/page.tsx` uses `HrJobApplicantsGrid` through shared `TpoGrid` without another canvas | Source-level structure only |
| Responsive mobile boundary | `docs/design/legacy-styles/components___listing-page-header.scss:131-158`: mobile max-width 767px | Desktop `hidden md:block`; mobile `md:hidden`; 768px switch | Source breakpoint matches; viewport not tested |
| Applicant-scoped row action | `old-lms-pages.md:10`: row menu/actions | `hr-job-applicants-grid.tsx`: each row provides `Review applicant` to its original authorized route | Read-only action preserved |
| Search, CSV/export, page and status | `old-lms-pages.md:8-11`: filters, export, status pills | Existing `hr/placements/jobs/[jobId]/page.tsx` Tabs, `Export shared applicants CSV` and pagination retained; grid text fields instead of all pill renderers | Functional source only; visual/state parity open |
| Selected/detail privacy and server scope | Employer page's existing authorized `applicants.rows` only | No extra client retrieval; scoped storage preference, Drawer unchanged | No apparent scope broadening; untested |
| Keyboard, hover, active, focus, empty/error/loading | Legacy shared states require exact computed values | Native `TpoGrid` delegates states; mobile remains original cards | Missing complete source value table and browser capture |

Post-edit fetched-source checks: applicant page 0 native `button/input/select/textarea/table` tags, 0 literal hex, 0 custom `h1`; `<div>` / `</div>` counts 53/53, fragments 3/3. New grid 0 raw controls/hex/h1; no custom dialog. This is not a local grep or a TS/CI/Playwright verification. AG Grid packages are absent from the inspected manifest despite Quartz code; by instruction, `package.json` was not touched. **E8 remains unticked.**

| File | Raw | Inline svg | Six-digit hex | JSX counts | Responsive source |
|---|---:|---:|---:|---|---|
| recruiter-leads-workspace.tsx | 0 | 0 | 0 | Button 25/25, Select 16/16, Link 8/8, braces 624/624, native grid 2, DataTable 0 | sm 0, md 5 |
| recruiter-roster-display-controls.tsx | 0 | 0 | 0 | Select 1/1, braces 18/18 | md 1, wrapping flex |
| recruiter-saved-view-controls.tsx | 0 | 0 | 0 | Button 9/9, Select 1/1, braces 97/97 | md 2, responsive grid |
| tpo-academic-import-preview.tsx | 0 | 0 | 0 | Button 1/1, braces 35/35 | DataTable 640px outstanding |
| tpo-batch-eligibility-import.tsx | 0 | 0 | 0 | Button 10/10, braces 141/141 | DataTable 640px outstanding |

No src/components/ui, package.json, server/permissions, or API files edited. Remaining: 40px vs 44px Quartz header (chat-14), 768px vs 640px shared DataTable (UI owner), full icon/link inventory, rendered phone/tablet and hover/focus/disabled/loading/empty screenshots, end-to-end export/selection verification. Global A5–A7/E8 unticked.

Exact next file: src/components/tpo/recruiter-lead-csv-import.tsx; after that src/components/tpo/tpo-audit-grid.tsx and remaining TPO drive sheet inventory.


## chat-12 follow-through — ten source-complete TPO files (2026-10-19)

Branch only: chatgpt/chat-12-b. Synced main by a two-parent non-force merge after the first ten scoped source updates; other owners' files were not touched. The checks below are source comparisons, not a rendered-browser, application, test or CI claim.

### File work queue (source complete; viewport signoff separately blocked)

- [x] src/components/tpo/recruiter-lead-csv-import.tsx — preview groups and skip/confirm/row-results retained, two 256px ScrollCue panes, visible 4-step guidance, shared Checkbox in 44px label, original template CSV and XLSX accepted, both profile links teal/focus-correct.
- [x] src/components/tpo/tpo-audit-grid.tsx — authenticated rows only, native Quartz audit grid, original person/text/date filters, source-shared copy handler, optional detail/about columns, native selected/all and original detail links.
- [x] src/components/tpo/tpo-company-memory-workspace.tsx — metrics joined into ONE bordered strip, original People/Documents/Drives/Timeline and private Company Team preserved, linked targets focus-correct, phone two-column metric strip → md three → xl five.
- [x] src/components/tpo/tpo-students-spreadsheet.tsx — existing Quartz unchanged, original bulk note/clipboard/after-college actions untouched, bulk note disclosure flattened, checkbox rows 44px and md (768px) columns, profile/history/participation links retained.
- [x] src/components/tpo/tpo-applications-spreadsheet.tsx — existing Quartz and authorized row payload unchanged; CGPA/backlog/10th/12th columns now use numeric-only comparators, applicant link teal/44px/focus and path encoding.
- [x] src/components/tpo/tpo-audit-saved-views.tsx — audit views no longer ordinary card, 44px phone / 36px tablet buttons, original revision-safe private saved-view commands untouched.
- [x] src/components/tpo/tpo-company-create-form.tsx — company identity form remains guarded by synchronous submission latch; shared primary submit and fields preserve 44px phone / 36px tablet; notice is narrow warning strip.
- [x] src/components/tpo/tpo-debounced-student-search.tsx — original search debounce, q/search redirect, page reset and URL handling retained; one shared field at 44px phone / 36px tablet.
- [x] src/components/tpo/tpo-company-team-conversation.tsx — existing mentions, idempotent sends, CRUD, assignee, privacy and ScrollCue preserved; team and pinned links get teal focus/touch, composer one-column phone → two at md, 44px action targets.
- [x] src/components/tpo/recruiter-lead-detail-workspace.tsx — profile routes, mailto/tel, duplicate lead and drive links focus-correct, pending/action/error warnings slim, follow-ups one separated list; form and mutation actions preserved.
- [ ] Remaining broad E8/A5-A7 parity: shared Quartz header 44px vs legacy 40px, shared DataTable 640px vs legacy 768px, whole repository inventory and rendered screenshots; do not globally tick.

### Legacy/vNext value comparison by file

| File | Legacy exact reference or rule | VNext current value/source locator | Source result |
|---|---|---|---|
| recruiter-lead-csv-import.tsx | lms2-fe/src/components/tpo/ImportPreviewModal.js:10-19: preview matched/unmatched before commit; old-lms-shell.css:68-85 phone <768px | :159-285: 4 steps, 2 ScrollCue max-h-56, guarded two-press review/confirm, min-h-11 md:min-h-9 and row checkbox label | Source aligned; execution pending |
| tpo-audit-grid.tsx | lms2-fe/src/components/tpo/grid/TpoGrid.jsx:2-24 AG Community Quartz with 44px rows, 48px pinned selection; old-lms-pages.md:9-10 single toolbar and compact table | :18-24 dynamic native Quartz; :32-48 authorized audit columns, :52-94 flat filters, filtered selection and link actions | Source aligned; header 44/40 gap unresolved |
| tpo-company-memory-workspace.tsx | old-lms-pages.md:5,8 single canvas, one metrics/funnel strip instead of five cards; old-lms-shell.css:68-85 768px threshold | :244-258 single hairline-bordered metric strip grid-cols-2 md:grid-cols-3 xl:grid-cols-5, People/Drives/Timeline remain | Source aligned; rendered proof pending |
| tpo-students-spreadsheet.tsx | old-lms-pages.md:5,9-10 table and compact expandable actions; shell.css:68-85 768px | :198-214 border-y note disclosure and md:grid-cols-2 selection list, min-h-11 checkbox rows; :221-245 native Quartz and original routes/actions | Source aligned |
| tpo-applications-spreadsheet.tsx | legacy TpoGrid.jsx:14-24 numeric/date sorting only; components___common.scss:68-75 teal underline hover | :21-25 five sortKind:number columns, :58-69 native Quartz; authorized applicant link 44px phone, 36px md, focus-visible teal | Source aligned |
| tpo-audit-saved-views.tsx | old-lms-pages.md:5 and 9: simple views toolbar inside canvas; shell.css:68-85 phone boundary | :122-158 border-y disclosure, five buttons min-h-11 md:min-h-9; original private saved views and revision tokens | Source aligned |
| tpo-company-create-form.tsx | legacy-styles/components___form.scss:117-143 field 10px radius, 14px/400/20px; old-lms-shell-spec.md:24-25 36px desktop action | :66-118 shared Button/Input and md:min-h-9, narrow warning confirmation strip; original untrusted-company semantics | Source aligned |
| tpo-debounced-student-search.tsx | legacy-styles/components___form.scss:117-143 searchable field; shell.css:68-85 768px | :11-26 shared Input focus ring, min-h-11 phone / md:min-h-9 desktop and original 350ms query | Source aligned |
| tpo-company-team-conversation.tsx | old-lms-pages.md:5-12 clean one-canvas language and teal text actions; shell.css:68-85 tablet from 768px | :134-266 preserved message thread and composer, md:grid-cols-2, shared link/focus/min-h-11 with md:min-h-9 | Source aligned; full legacy chat layout unknown |
| recruiter-lead-detail-workspace.tsx | components___common.scss:68-75 teal link hover underline; old-lms-pages.md:7 narrow alert, shell.css:68-85 44px phone target | :398-487 back/company/mailto/tel links underlined & focusable; :444-454 alerts; :649-666 follow-ups divide-y; original mutation dialogs | Source aligned |

### Complete-file source grep equivalents

All ten files fetched from GitHub and scanned for raw control opening elements matching /<(button|input|select|textarea)(?:\s|>)/g, inline SVG matching /<svg(?:\s|>)/g and six-digit literal colors matching /#[a-f0-9]{6}\b/gi. Equivalent local shell: grep -nE '<(button|input|select|textarea)([[:space:]]|>)|<svg([[:space:]]|>)|#[[:xdigit:]]{6}' each scoped file. Nothing repo-wide is claimed.

| File | Raw controls | Inline svg | Literal hex | JSX opening/closing; balanced braces | Responsive source |
|---|---:|---:|---:|---|---|
| recruiter-lead-csv-import.tsx | 0 | 0 | 0 | Button 7/7, Link 2/2, braces 132/132 | sm 0, md 9 |
| tpo-audit-grid.tsx | 0 | 0 | 0 | Button 2/2, Link 2/2, braces 53/53 | sm 0, md 3 |
| tpo-company-memory-workspace.tsx | 0 | 0 | 0 | Button 1/1, Link 10/10, braces 122/122 | sm 0, md 3 |
| tpo-students-spreadsheet.tsx | 0 | 0 | 0 | Button 3/3, Link 2/2, braces 212/212 | sm 0, md 1 |
| tpo-applications-spreadsheet.tsx | 0 | 0 | 0 | Link 1/1, braces 65/65 | sm 0, md 1 |
| tpo-audit-saved-views.tsx | 0 | 0 | 0 | Button 5/5, braces 76/76 | sm 0, md 5 |
| tpo-company-create-form.tsx | 0 | 0 | 0 | Button 3/3, braces 56/56 | sm 0, md 4 |
| tpo-debounced-student-search.tsx | 0 | 0 | 0 | braces 13/13, shared Input only | sm 0, md 1 |
| tpo-company-team-conversation.tsx | 0 | 0 | 0 | Button 10/10, Link 4/4, braces 180/180 | sm 0, md 12 |
| recruiter-lead-detail-workspace.tsx | 0 | 0 | 0 | Button 18/18, Link 7/7, braces 304/304 | sm 0, md 34 |

Responsive source proof: no sm: (<768px mismatches) in any of these ten edited components. md: uses Tailwind's 768px boundary from old-lms-shell.css:68-85. Source cannot substitute for actual phone/tablet screenshots, browser click/focus checks, runtime/CI or integration tests; leave global E8 unchecked.

Exact next scope: TPO remaining Team/Companies links and buttons and detailed icon review, starting with src/components/tpo/tpo-team-search.tsx and src/components/tpo/tpo-team-handover.tsx (coordinate with chat-11 if scope already claimed).


## chat-12 continued — inline/bulk recruiter and student action controls (2026-10-19)

Queue source-file status (the global E8 checkbox is still open; no app/browser/CI executed):

- [x] src/components/tpo/recruiter-bulk-stage-controls.tsx — retained 100-lead scoped selection, optimistic stage check, review/signature, undo and audit; converted five raw buttons, four native input/select controls to shared components, flattened ordinary stage panel and warning review.
- [x] src/components/tpo/recruiter-bulk-owner-controls.tsx — retained eligible owner lookup, selection/revision guards, undo/copy/retry; migrated seven raw buttons, select and checkbox to shared, flattened panel and warnings.
- [x] src/components/tpo/recruiter-bulk-invite-controls.tsx — retained preview/confirm/retry, one-time invite URLs and email-delivery disclaimer; converted raw Cancel action to shared Button, flattened panel and improved focus.
- [x] src/components/tpo/recruiter-inline-stage.tsx — retained original API, stage reason guard and mutation; shared reason input/select/buttons source-styled to legacy control radius and 44px phone/36px tablet.
- [x] src/components/tpo/recruiter-inline-owner.tsx — retained scoped owner loader/mutation; matching legacy select and 44px phone/36px tablet actions.
- [x] src/components/tpo/tpo-student-clipboard-actions.tsx — preserved CSV-safe TSV paste/copy and missing-roll notice; clipboard controls now sit on a plain border-separated section rather than a nested white card.
- [x] src/components/tpo/tpo-student-note-editor.tsx — retained guarded permanent-note API and Ctrl+Enter; nested card removed, multiline input has min-height 128px and width 100%.
- [x] src/components/tpo/tpo-student-nudge-panel.tsx — preserved message selection cap (25), template, dialog, confirmation, optimistic lock and audit; flat separator and 44px selection target.

### Value table (legacy source vs current source, each file)

| File | Legacy measured/source value | Current vNext source | Source comparison |
|---|---|---|---|
| recruiter-bulk-stage-controls.tsx | old-lms-pages.md:5 ordinary controls on one canvas; legacy-styles/components___form.scss:117-143 radius 10px, teal focus; shell.css:68-85 44px phone, md 768px | :26 fieldClass min-h-11 md:min-h-9, control radius token, :158 border-y, :177 44px selection row, :242 warning left-strip, shared Input/Select/Checkbox/Button | Matched source |
| recruiter-bulk-owner-controls.tsx | same SCSS field and white canvas rules, old-lms-pages.md:9 compact bulk/list | :25 fieldClass, :163 border-y, :174/180 shared buttons, :192 Select, :214 Checkbox labels, :229 slim review warning | Matched source |
| recruiter-bulk-invite-controls.tsx | old-lms-pages.md:5,7 no ordinary nested cards and pale-yellow notification | :56 border-y, :72 warning strip, :74 shared ghost link-style Cancel, :83 read-only results field, immutable invite guards untouched | Matched source |
| recruiter-inline-stage.tsx | old-lms-shell-spec.md:24-25: radius 9px buttons, 36px desktop; shell.css:68-85 phone min 44px | :33-45 Select/Input (radius token), Button primary/ghost, min-h-11 md:min-h-9, source stage mutation untouched | Matched source |
| recruiter-inline-owner.tsx | same 9px/36px desktop, 44px touch and shared form | :48-57 shared Select and primary/ghost Button, min-h-11 md:min-h-9; source-scoped owner request unchanged | Matched source |
| tpo-student-clipboard-actions.tsx | old-lms-pages.md:5,9 toolbar and advanced actions inside single canvas | :26-46 flat border-y section with shared Textarea/Buttons and raw roll-number matching unchanged | Matched source |
| tpo-student-note-editor.tsx | old-lms-pages.md:5 ordinary content no embedded card, form.scss:117-143 typed field | :31-45 flat border-t, :34 text area min-h-32, original locked save paths and keyboard handler | Matched source |
| tpo-student-nudge-panel.tsx | old-lms-pages.md:5,7 slim sections and confirmation, shell.css:31-32 44px touch | :50-94 flat border-y, :54/60 min-h-11 checkbox labels, original accessible Dialog and template action | Matched source |

### Scoped grep and JSX integrity

Full current branch files were individually fetched and inspected with source equivalents of:
grep -nE '<(button|input|select|textarea)([[:space:]]|>)|<svg([[:space:]]|>)|#[[:xdigit:]]{6}' FILE
and grep -nE 'sm:|md:' FILE.
All eight returned raw native form tags **0**, inline svg **0** and literal six-digit colors **0**. JSX and braces verified as follows:

| File | Shared Button open/close | Shared Select open/close | Curly braces | Responsive source |
|---|---|---|---|---|
| recruiter-bulk-stage-controls.tsx | 6/6 | 1/1 | 109/109 | sm 0; md 2 |
| recruiter-bulk-owner-controls.tsx | 8/8 | 1/1 | 106/106 | sm 0; md 1 |
| recruiter-bulk-invite-controls.tsx | 6/6 | 0/0 | 68/68 | sm 0; flex-wrapped content |
| recruiter-inline-stage.tsx | 3/3 | 1/1 | 38/38 | sm 0; md 4 |
| recruiter-inline-owner.tsx | 3/3 | 1/1 | 41/41 | sm 0; md 3 |
| tpo-student-clipboard-actions.tsx | 3/3 | 0/0 | 28/28 | sm 0; wrapping flex |
| tpo-student-note-editor.tsx | 1/1 | 0/0 | 32/32 | sm 0; 100%-width textarea |
| tpo-student-nudge-panel.tsx | 3/3 | 1/1 | 69/69 | sm 0; one-column mobile |

Source-only breakpoint basis: old-lms-shell.css:68-85 uses max-width 767px, whereas Tailwind md is min-width 768px; every edited explicit breakpoint uses md not sm. Exact rendered viewport, pointer, keyboard focus and end-to-end mutation verification remain unperformed; no tests/CI/app run. Shared Quartz 44px header versus legacy 40px and DataTable 640px fallback vs 768px remain unowned mismatches. Never globally tick A5/A6/A7/E8 for these scoped checks.

**Next queued area:** remaining TPO company/learner controls, legacy link/icon families and batch/team support components; begin with src/components/tpo/tpo-student-quick-panel.tsx.


## chat-12 continued — Engage sheets and import previews (2026-10-19)

Completed source-level item: src/components/tpo/tpo-spreadsheet-grid.tsx (the phone fallback of src/components/tpo/grid/tpo-grid.tsx). The per-column Pin/Unpin pressed Button was migrated to FilterChip while retaining updateLayout(col.key,{pinned:...}), aria-pressed, the localized column name in aria-label, and existing selected state.

| Property | Legacy value / reference | Current source value and proof | Result |
|---|---|---|---|
| Selection column width | E8 owner requirement ui-clone-checklist.md:57 — 48px pinned selection | tpo-spreadsheet-grid.tsx:186,209 contains sticky left-0 with inline width/minWidth/maxWidth each 48px (2 occurrences) | Exact width preserved in phone fallback |
| Interactive pin chip on phone | components___antddesign.scss:1092-1100 — min-height 44px; padding 0 12px | tpo-spreadsheet-grid.tsx:200-202 FilterChip; ui/filter-chip.tsx:27-36 44px and 12px | Static touch/padding match |
| Interactive chip on tablet | No authoritative legacy pin-control measurement supplied; E8 needs live legacy viewport source | ui/filter-chip.tsx:27-36 md:min-h-8 (32px), md:px-[15px] | Unverified legacy parity |
| Selection/sort and copy | E8 owner requirements include filtered select-all, Shift/Ctrl selection, numeric/date sort only and TSV copying | tpo-spreadsheet-grid.tsx:183-210 retains filtered checkbox, sort indicator + aria-sort, CSV/TSV handler, original helpers; ag-grid source keeps numeric/date comparator | Source contracts preserved, behavior not executed |
| AG Grid integration | Quartz, 48px pinned select, column layout persistence, mobile fallback | tpo-grid.tsx desktop AG Grid; tpo-students-spreadsheet and tpo-applications-spreadsheet both use next/dynamic with ssr:false and responsive fallback | Source wired, compile still blocked |

Fetched-file grep-equivalent: src/components/tpo/tpo-spreadsheet-grid.tsx has exactly 1 opening <FilterChip and 1 closing </FilterChip>, 0 native <button> tags, and 2 exact width:48,minWidth:48,maxWidth:48 occurrences. Its original sort, row actions and selection callbacks were not changed. This is a source inspection, NOT an executed shell grep or browser/CI run. E8 remains [ ]: legacy-grid/TpoGrid.jsx.txt was not retrievable via GitHub connector (404); package.json still lacks declared ag-grid-community and ag-grid-react despite imported AG Grid 36 source. Under the explicit manifest prohibition, do not modify package.json or falsely claim installed dependency or build.

All ten files fetched from GitHub and scanned for raw control opening elements matching /<(button|input|select|textarea)(?:\s|>)/g, inline SVG matching /<svg(?:\s|>)/g and six-digit literal colors matching /#[a-f0-9]{6}\b/gi. Equivalent local shell: grep -nE '<(button|input|select|textarea)([[:space:]]|>)|<svg([[:space:]]|>)|#[[:xdigit:]]{6}' each scoped file. Nothing repo-wide is claimed.

| File | Raw controls | Inline svg | Literal hex | JSX opening/closing; balanced braces | Responsive source |
|---|---:|---:|---:|---|---|
| recruiter-lead-csv-import.tsx | 0 | 0 | 0 | Button 7/7, Link 2/2, braces 132/132 | sm 0, md 9 |
| tpo-audit-grid.tsx | 0 | 0 | 0 | Button 2/2, Link 2/2, braces 53/53 | sm 0, md 3 |
| tpo-company-memory-workspace.tsx | 0 | 0 | 0 | Button 1/1, Link 10/10, braces 122/122 | sm 0, md 3 |
| tpo-students-spreadsheet.tsx | 0 | 0 | 0 | Button 3/3, Link 2/2, braces 212/212 | sm 0, md 1 |
| tpo-applications-spreadsheet.tsx | 0 | 0 | 0 | Link 1/1, braces 65/65 | sm 0, md 1 |
| tpo-audit-saved-views.tsx | 0 | 0 | 0 | Button 5/5, braces 76/76 | sm 0, md 5 |
| tpo-company-create-form.tsx | 0 | 0 | 0 | Button 3/3, braces 56/56 | sm 0, md 4 |
| tpo-debounced-student-search.tsx | 0 | 0 | 0 | braces 13/13, shared Input only | sm 0, md 1 |
| tpo-company-team-conversation.tsx | 0 | 0 | 0 | Button 10/10, Link 4/4, braces 180/180 | sm 0, md 12 |
| recruiter-lead-detail-workspace.tsx | 0 | 0 | 0 | Button 18/18, Link 7/7, braces 304/304 | sm 0, md 34 |

Responsive source proof: no sm: (<768px mismatches) in any of these ten edited components. md: uses Tailwind's 768px boundary from old-lms-shell.css:68-85. Source cannot substitute for actual phone/tablet screenshots, browser click/focus checks, runtime/CI or integration tests; leave global E8 unchecked.

Exact next scope: TPO remaining Team/Companies links and buttons and detailed icon review, starting with src/components/tpo/tpo-team-search.tsx and src/components/tpo/tpo-team-handover.tsx (coordinate with chat-11 if scope already claimed).


## chat-12 continued — inline/bulk recruiter and student action controls (2026-10-19)

Queue source-file status (the global E8 checkbox is still open; no app/browser/CI executed):

- [x] src/components/tpo/recruiter-bulk-stage-controls.tsx — retained 100-lead scoped selection, optimistic stage check, review/signature, undo and audit; converted five raw buttons, four native input/select controls to shared components, flattened ordinary stage panel and warning review.
- [x] src/components/tpo/recruiter-bulk-owner-controls.tsx — retained eligible owner lookup, selection/revision guards, undo/copy/retry; migrated seven raw buttons, select and checkbox to shared, flattened panel and warnings.
- [x] src/components/tpo/recruiter-bulk-invite-controls.tsx — retained preview/confirm/retry, one-time invite URLs and email-delivery disclaimer; converted raw Cancel action to shared Button, flattened panel and improved focus.
- [x] src/components/tpo/recruiter-inline-stage.tsx — retained original API, stage reason guard and mutation; shared reason input/select/buttons source-styled to legacy control radius and 44px phone/36px tablet.
- [x] src/components/tpo/recruiter-inline-owner.tsx — retained scoped owner loader/mutation; matching legacy select and 44px phone/36px tablet actions.
- [x] src/components/tpo/tpo-student-clipboard-actions.tsx — preserved CSV-safe TSV paste/copy and missing-roll notice; clipboard controls now sit on a plain border-separated section rather than a nested white card.
- [x] src/components/tpo/tpo-student-note-editor.tsx — retained guarded permanent-note API and Ctrl+Enter; nested card removed, multiline input has min-height 128px and width 100%.
- [x] src/components/tpo/tpo-student-nudge-panel.tsx — preserved message selection cap (25), template, dialog, confirmation, optimistic lock and audit; flat separator and 44px selection target.

### Value table (legacy source vs current source, each file)

| File | Legacy measured/source value | Current vNext source | Source comparison |
|---|---|---|---|
| recruiter-bulk-stage-controls.tsx | old-lms-pages.md:5 ordinary controls on one canvas; legacy-styles/components___form.scss:117-143 radius 10px, teal focus; shell.css:68-85 44px phone, md 768px | :26 fieldClass min-h-11 md:min-h-9, control radius token, :158 border-y, :177 44px selection row, :242 warning left-strip, shared Input/Select/Checkbox/Button | Matched source |
| recruiter-bulk-owner-controls.tsx | same SCSS field and white canvas rules, old-lms-pages.md:9 compact bulk/list | :25 fieldClass, :163 border-y, :174/180 shared buttons, :192 Select, :214 Checkbox labels, :229 slim review warning | Matched source |
| recruiter-bulk-invite-controls.tsx | old-lms-pages.md:5,7 no ordinary nested cards and pale-yellow notification | :56 border-y, :72 warning strip, :74 shared ghost link-style Cancel, :83 read-only results field, immutable invite guards untouched | Matched source |
| recruiter-inline-stage.tsx | old-lms-shell-spec.md:24-25: radius 9px buttons, 36px desktop; shell.css:68-85 phone min 44px | :33-45 Select/Input (radius token), Button primary/ghost, min-h-11 md:min-h-9, source stage mutation untouched | Matched source |
| recruiter-inline-owner.tsx | same 9px/36px desktop, 44px touch and shared form | :48-57 shared Select and primary/ghost Button, min-h-11 md:min-h-9; source-scoped owner request unchanged | Matched source |
| tpo-student-clipboard-actions.tsx | old-lms-pages.md:5,9 toolbar and advanced actions inside single canvas | :26-46 flat border-y section with shared Textarea/Buttons and raw roll-number matching unchanged | Matched source |
| tpo-student-note-editor.tsx | old-lms-pages.md:5 ordinary content no embedded card, form.scss:117-143 typed field | :31-45 flat border-t, :34 text area min-h-32, original locked save paths and keyboard handler | Matched source |
| tpo-student-nudge-panel.tsx | old-lms-pages.md:5,7 slim sections and confirmation, shell.css:31-32 44px touch | :50-94 flat border-y, :54/60 min-h-11 checkbox labels, original accessible Dialog and template action | Matched source |

### Scoped grep and JSX integrity

Full current branch files were individually fetched and inspected with source equivalents of:
grep -nE '<(button|input|select|textarea)([[:space:]]|>)|<svg([[:space:]]|>)|#[[:xdigit:]]{6}' FILE
and grep -nE 'sm:|md:' FILE.
All eight returned raw native form tags **0**, inline svg **0** and literal six-digit colors **0**. JSX and braces verified as follows:

| File | Shared Button open/close | Shared Select open/close | Curly braces | Responsive source |
|---|---|---|---|---|
| recruiter-bulk-stage-controls.tsx | 6/6 | 1/1 | 109/109 | sm 0; md 2 |
| recruiter-bulk-owner-controls.tsx | 8/8 | 1/1 | 106/106 | sm 0; md 1 |
| recruiter-bulk-invite-controls.tsx | 6/6 | 0/0 | 68/68 | sm 0; flex-wrapped content |
| recruiter-inline-stage.tsx | 3/3 | 1/1 | 38/38 | sm 0; md 4 |
| recruiter-inline-owner.tsx | 3/3 | 1/1 | 41/41 | sm 0; md 3 |
| tpo-student-clipboard-actions.tsx | 3/3 | 0/0 | 28/28 | sm 0; wrapping flex |
| tpo-student-note-editor.tsx | 1/1 | 0/0 | 32/32 | sm 0; 100%-width textarea |
| tpo-student-nudge-panel.tsx | 3/3 | 1/1 | 69/69 | sm 0; one-column mobile |

Source-only breakpoint basis: old-lms-shell.css:68-85 uses max-width 767px, whereas Tailwind md is min-width 768px; every edited explicit breakpoint uses md not sm. Exact rendered viewport, pointer, keyboard focus and end-to-end mutation verification remain unperformed; no tests/CI/app run. Shared Quartz 44px header versus legacy 40px and DataTable 640px fallback vs 768px remain unowned mismatches. Never globally tick A5/A6/A7/E8 for these scoped checks.

**Next queued area:** remaining TPO company/learner controls, legacy link/icon families and batch/team support components; begin with src/components/tpo/tpo-student-quick-panel.tsx.


## 2026-10-19 chat-14 E8 fallback pin-control static parity

Completed source-level item: src/components/tpo/tpo-spreadsheet-grid.tsx (the phone fallback of src/components/tpo/grid/tpo-grid.tsx). The per-column Pin/Unpin pressed Button was migrated to FilterChip while retaining updateLayout(col.key,{pinned:...}), aria-pressed, the localized column name in aria-label, and existing selected state.

| Property | Legacy value / reference | Current source value and proof | Result |
|---|---|---|---|
| Selection column width | E8 owner requirement ui-clone-checklist.md:57 — 48px pinned selection | tpo-spreadsheet-grid.tsx:186,209 contains sticky left-0 with inline width/minWidth/maxWidth each 48px (2 occurrences) | Exact width preserved in phone fallback |
| Interactive pin chip on phone | components___antddesign.scss:1092-1100 — min-height 44px; padding 0 12px | tpo-spreadsheet-grid.tsx:200-202 FilterChip; ui/filter-chip.tsx:27-36 44px and 12px | Static touch/padding match |
| Interactive chip on tablet | No authoritative legacy pin-control measurement supplied; E8 needs live legacy viewport source | ui/filter-chip.tsx:27-36 md:min-h-8 (32px), md:px-[15px] | Unverified legacy parity |
| Selection/sort and copy | E8 owner requirements include filtered select-all, Shift/Ctrl selection, numeric/date sort only and TSV copying | tpo-spreadsheet-grid.tsx:183-210 retains filtered checkbox, sort indicator + aria-sort, CSV/TSV handler, original helpers; ag-grid source keeps numeric/date comparator | Source contracts preserved, behavior not executed |
| AG Grid integration | Quartz, 48px pinned select, column layout persistence, mobile fallback | tpo-grid.tsx desktop AG Grid; tpo-students-spreadsheet and tpo-applications-spreadsheet both use next/dynamic with ssr:false and responsive fallback | Source wired, compile still blocked |

Fetched-file grep-equivalent: src/components/tpo/tpo-spreadsheet-grid.tsx has exactly 1 opening <FilterChip and 1 closing </FilterChip>, 0 native <button> tags, and 2 exact width:48,minWidth:48,maxWidth:48 occurrences. Its original sort, row actions and selection callbacks were not changed. This is a source inspection, NOT an executed shell grep or browser/CI run. E8 remains [ ]: legacy-grid/TpoGrid.jsx.txt was not retrievable via GitHub connector (404); package.json still lacks declared ag-grid-community and ag-grid-react despite imported AG Grid 36 source. Under the explicit manifest prohibition, do not modify package.json or falsely claim installed dependency or build.

Next exact E8 file: src/components/tpo/grid/tpo-grid.tsx; require legacy source and dependency verification before ticking E8.


## 2026-10-19 chat-14 — Quartz grid sorting, export, chooser and status-chip evidence

This batch reviewed the native `src/components/tpo/grid/tpo-grid.tsx` and its `src/components/tpo/grid/grid-export.ts` helper without touching `package.json`. Work was committed only to `chatgpt/chat-14-b`; when `main` advanced, upstream audit additions were retained and the prior chat-14 E8 ledger was replayed after them.

| Property / state | Legacy value (source) | Current vNext (source:line) | Source verdict |
| --- | --- | --- | --- |
| Accent / active emphasis | Owner primary control #0a7c88 (`docs/design/ui-clone-checklist.md:47`, `globals.css:24`) | `tpo-grid.tsx:32` `accentColor:var(--lms-button-primary)` = #0a7c88 | Exact token |
| Canvas and header | White, hairline #e5e9f0 (`old-lms-pages.md:5,11`) | `tpo-grid.tsx:33-40` white background/header/hover, border `--lms-canvas-border`; globals.css maps #e5e9f0 | Exact mapped tokens; computed CSS untested |
| Text and header label | `globals.css:35,37` neutral-700 #54505d, neutral-400 #a9a7ae | `tpo-grid.tsx:34,37` foreground/header text use corresponding CSS variables | Exact token |
| Row / header heights | Existing Quartz local grid 44px; old TPO table described as compact, no verified exact height in legacy-grid source | `tpo-grid.tsx:41-42,238` both 44px | Source retained; legacy numerical equality **unverified** |
| Pinned select | E8 owner requirement `ui-clone-checklist.md:57` pinned 48px | `tpo-grid.tsx:193` `width:minWidth:maxWidth:48`, locked pinned left; fallback `tpo-spreadsheet-grid.tsx:186,209` 48px | Exact owner contract |
| Numeric/date sorting only | `ui-clone-checklist.md:57` numbers/dates only | `tpo-grid.tsx:206-210` `sortable:Boolean(col.sortKind)`, `compareNumberDate`; string columns lack sortKind | Source match |
| Shift/Ctrl selection | `ui-clone-checklist.md:57` shift/control range and multi-select | `tpo-grid.tsx:143-172` delegates `gridSelectionCheckbox`/`gridSelectionClick` with modifiers; copy of authorized visible IDs only | Source behavior preserved; interaction untested |
| Clipboard and formula safety | TSV copy, never widen authorized export | `tpo-grid.tsx:174-188` now follows `forEachNodeAfterFilterAndSort` order, then joins only authorized Row map; `grid-export.ts:4-6` strips ASCII C0/DEL and neutralizes spreadsheet formula prefixes | Stronger output safety, source only |
| Layout memory | Per-storageKey, permitted keys, 100-500px widths (`ui-clone-checklist.md:57`) | `tpo-grid.tsx:120-140,240-253` uses `GRID_LAYOUT_SUFFIX` and allowed-column filters; `view-memory.ts` rounds/clamps 100-500 | Static contract matched |
| Responsive phone/tablet | Legacy mobile breakpoint max-width 767px (`components___antddesign.scss:243`) | `tpo-grid.tsx:228,262` AG Grid `hidden md:block`, fallback `md:hidden`: 768px handoff | Exact breakpoint; rendered parity unverified |
| Chooser controls | Legacy phone interactive action floor 44px (`components___antddesign.scss:1081-1100`) | `tpo-grid-column-chooser.tsx:39-53` four actionable order/show/reset buttons `min-h-11 md:min-h-9`; labels already `min-h-11` | Phone touch match; desktop height uses 36px |

**Whole-file source grep equivalents after GitHub re-fetch:** `tpo-grid.tsx` has 0 literal six-digit hex values and 0 raw `<button>` nodes; the Quartz theme retains 1 `AgGridReact<Row>` and pinned selection definition. `grid-export.ts` contains one C0/DEL sanitizer, one formula-prefix safeguard, and the same CRLF TSV serializer. `tpo-grid-column-chooser.tsx` retains **4 opening/4 closing** shared Button tags, **1** self-closing Checkbox, and **0** raw buttons. The `tpo-students-spreadsheet.tsx` and `tpo-applications-spreadsheet.tsx` callers both retain `next/dynamic` `ssr:false` and their loading placeholders. These counts were derived from full-file GitHub source reads, **not shell grep executed in a checkout**.

**Next E8 file:** `src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/page.tsx` to compare round list/editor against shipped `TpoGrid` and legacy sheet action patterns.


## chat-15 rounds editor E8 wiring — 2026-10-19

- [ ] `src/components/hr/hr-round-editor-grid.tsx`: read-only `TpoGrid` displays employer-authorized sequence / round name / type / mode / duration / status / editability and links to existing edit form anchor and removal confirmation route. Row source is the existing `listHrRoundEditorRows(context,jobId)` and never discloses candidate results, attendance or slots.
- [ ] `src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/page.tsx`: desktop reads the shared grid; editable rounds retain the original server-post forms below with `expectedUpdatedAt`, round ID and all original fields. Mobile remains the exact existing per-round form/list at max 767px. Noneditable desktop rounds render only the sheet. No double editing surface in a single breakpoint.
- [ ] `src/app/(authenticated)/hr/drives/[jobId]/interview-slots/page.tsx`: time blocks are **interactive forms**, not yet a sheet. They are flattened from per-object cards to hairline canvas rows and use existing `RecruiterInterviewSlotActions`. A grid cannot safely replace those actions without preserving multi-button layout and optimistic version semantics.

Exact next optional audit: src/components/tpo/tpo-team-search.tsx, src/components/tpo/tpo-team-open-read.tsx and TPO page-level icon/link inventory.

## chat-12 bounded continuation, 2026-10-20 — batch 1

- [x] src/components/tpo/tpo-team-open-read.tsx — Previously error text referred to missing retry button; now explicit shared Retry Button, 44px phone/36px md, slim warning strip; real same-origin POST remains.
- [x] src/components/tpo/tpo-team-search.tsx — Shared search Input min-h-11/w-full/min-w-0; 36px md at 768px; original slash shortcut and 200ms URL filter retained.
- [x] src/components/tpo/tpo-after-college-bulk-editor.tsx — One flat border-t workspace, 44px label/row targets and min-h-11/md:min-h-9 Select and confirm/undo; version-checked bulk mutations retained.
- [x] src/components/tpo/tpo-batch-decision-control.tsx — No nested card, border-y action area, responsive min-h-11/md:min-h-9 Select/save, guarded optimistic API and undo intact.
- [x] src/components/tpo/tpo-batch-instant-search.tsx — Search and Clear use 44px phone and 36px md; preserves q/page and 250ms debounce.
- [x] src/components/tpo/tpo-batch-student-keyboard-actions.tsx — Compact border-b toolbar, original Ctrl/Cmd shortcuts, responsive 44px/36px copy, CSV link teal underline and 2px keyboard outline.
- [x] src/components/tpo/tpo-participation-decision-form.tsx — Shared Select/Input/save at 44px phone/36px md; registration caveat appears in slim warning strip, guarded decision API unchanged.

### Value comparison (legacy measured versus vNext source)
Baseline: docs/design/old-lms-pages.md:6 one canvas not nested ordinary cards, lines 9 and 18-20 one compact toolbar; docs/design/old-lms-shell.css:23 and 73 specifies phone max 767px, tablet >=768px, min interactive 44px (lines 26-32); docs/design/old-lms-shell-spec.md:24-25 compact desktop 36px; legacy-styles/components___common.scss:68-75 teal underline. TPO changes use shared controls and original form actions.
| File | VNext authored property, source line(s) and retained behavior | Result |
|---|---|---|
| tpo-team-open-read.tsx | tpo-team-open-read.tsx:25,27 — Previously error text referred to missing retry button; now explicit shared Retry Button, 44px phone/36px md, slim warning strip; real same-origin POST remains | Source-aligned, screenshot unverified |
| tpo-team-search.tsx | tpo-team-search.tsx:29 — Shared search Input min-h-11/w-full/min-w-0; 36px md at 768px; original slash shortcut and 200ms URL filter retained | Source-aligned, screenshot unverified |
| tpo-after-college-bulk-editor.tsx | tpo-after-college-bulk-editor.tsx:90,98,103 — One flat border-t workspace, 44px label/row targets and min-h-11/md:min-h-9 Select and confirm/undo; version-checked bulk mutations retained | Source-aligned, screenshot unverified |
| tpo-batch-decision-control.tsx | tpo-batch-decision-control.tsx:39,43,53 — No nested card, border-y action area, responsive min-h-11/md:min-h-9 Select/save, guarded optimistic API and undo intact | Source-aligned, screenshot unverified |
| tpo-batch-instant-search.tsx | tpo-batch-instant-search.tsx:26,30 — Search and Clear use 44px phone and 36px md; preserves q/page and 250ms debounce | Source-aligned, screenshot unverified |
| tpo-batch-student-keyboard-actions.tsx | tpo-batch-student-keyboard-actions.tsx:36,40,44 — Compact border-b toolbar, original Ctrl/Cmd shortcuts, responsive 44px/36px copy, CSV link teal underline and 2px keyboard outline | Source-aligned, screenshot unverified |
| tpo-participation-decision-form.tsx | tpo-participation-decision-form.tsx:81,108,155 — Shared Select/Input/save at 44px phone/36px md; registration caveat appears in slim warning strip, guarded decision API unchanged | Source-aligned, screenshot unverified |

### File-scoped grep and responsive source proof
Each fetched file was scanned for literal raw button/input/select/textarea opening tags, inline svg and six-digit hex, equivalent to `grep -nE '<(button|input|select|textarea)([[:space:]]|>)|<svg([[:space:]]|>)|#[[:xdigit:]]{6}' FILE`, and for `sm:|md:` breakpoints. JSX Button/Link opening and closing tags plus raw curly counts were compared, not compiled.
| File | Raw controls/SVG/hex | Button; Link open/close | Curly braces | Breakpoint source |
|---|---|---|---|---|
| tpo-team-open-read.tsx | 0/0/0 | 1/1; 0/0 | 16/16 | sm 0; md 1 |
| tpo-team-search.tsx | 0/0/0 | 0/0; 0/0 | 16/16 | sm 0; md 1 |
| tpo-after-college-bulk-editor.tsx | 0/0/0 | 4/4; 0/0 | 75/75 | sm 0; md 3 |
| tpo-batch-decision-control.tsx | 0/0/0 | 1/1; 0/0 | 41/41 | sm 0; md 2 |
| tpo-batch-instant-search.tsx | 0/0/0 | 1/1; 0/0 | 15/15 | sm 0; md 2 |
| tpo-batch-student-keyboard-actions.tsx | 0/0/0 | 4/4; 0/0 | 38/38 | sm 0; md 5 |
| tpo-participation-decision-form.tsx | 0/0/0 | 3/3; 0/0 | 55/55 | sm 0; md 3 |

All entries are strictly **source-complete** only. No rendered phone/tablet screenshots, app execution, CI or browser focus/hover verification. A5/A6/A7/E8 remain unchecked; do not infer global parity.

## chat-12 bounded continuation, 2026-10-20 — batch 2

- [x] src/components/tpo/tpo-batch-class-decision.tsx — Inherited class eligibility Select and save button min-h-11/md:min-h-9; responsive flex, guarded confirmation unchanged.
- [x] src/components/tpo/tpo-after-college-editor.tsx — Outcome Select w-full min-w-0, all Save/Undo/Dialog controls min-h-11 md:min-h-9, original versioned update and undo retained.
- [x] src/components/tpo/tpo-debar-control.tsx — Debar screen flat border-y, required reason Input 44px phone/36px md and reviewed Checkbox 44px row; original restrictions/confirmation unchanged.
- [x] src/components/tpo/tpo-timed-debar-control.tsx — Timed restrictions/history moved from nested cards to one border-y panel and divided rows; date/count/duration input 44px phone/36px md; same guarded record/undo flow.
- [x] src/components/tpo/tpo-roster-verification-bulk.tsx — 20-selected profile verification, preview and guard unchanged; preview responsive inset moves from sm (640px) to md (768px), aligns legacy shell phone boundary.
- [x] src/components/tpo/tpo-batch-inline-decision.tsx — Learner override Select 44px phone/36px md, confirmation Checkbox label 44px, save button responsive; reason preset and undo protected.
- [x] src/components/tpo/tpo-batch-student-saved-views.tsx — Private scoped/pinned batch views preserved; name Input 44px/36px md, download CSV teal underlined and keyboard outline, no raw link duplicate.

### Value comparison — old shell/legacy source versus actual vNext property
Old reference: docs/design/old-lms-pages.md:6-10 single 12px-radius white canvas and compact rows rather than per-section ordinary cards; old-lms-shell.css:23,26-32,73 44px phone touch and 768px media switch; old-lms-shell-spec.md:24-25 36px desktop actions; components___common.scss:68-75 teal link and visible hover underline.
| File | Source/value and preserved behavior | Status |
|---|---|---|
| tpo-batch-class-decision.tsx | tpo-batch-class-decision.tsx:42,49 — Inherited class eligibility Select and save button min-h-11/md:min-h-9; responsive flex, guarded confirmation unchanged | Source aligned; browser pending |
| tpo-after-college-editor.tsx | tpo-after-college-editor.tsx:68,78,81 — Outcome Select w-full min-w-0, all Save/Undo/Dialog controls min-h-11 md:min-h-9, original versioned update and undo retained | Source aligned; browser pending |
| tpo-debar-control.tsx | tpo-debar-control.tsx:83,127,132 — Debar screen flat border-y, required reason Input 44px phone/36px md and reviewed Checkbox 44px row; original restrictions/confirmation unchanged | Source aligned; browser pending |
| tpo-timed-debar-control.tsx | tpo-timed-debar-control.tsx:43,52,57 — Timed restrictions/history moved from nested cards to one border-y panel and divided rows; date/count/duration input 44px phone/36px md; same guarded record/undo flow | Source aligned; browser pending |
| tpo-roster-verification-bulk.tsx | tpo-roster-verification-bulk.tsx:62,66,72 — 20-selected profile verification, preview and guard unchanged; preview responsive inset moves from sm (640px) to md (768px), aligns legacy shell phone boundary | Source aligned; browser pending |
| tpo-batch-inline-decision.tsx | tpo-batch-inline-decision.tsx:49,85,91 — Learner override Select 44px phone/36px md, confirmation Checkbox label 44px, save button responsive; reason preset and undo protected | Source aligned; browser pending |
| tpo-batch-student-saved-views.tsx | tpo-batch-student-saved-views.tsx:64,74,75 — Private scoped/pinned batch views preserved; name Input 44px/36px md, download CSV teal underlined and keyboard outline, no raw link duplicate | Source aligned; browser pending |

### Grep-equivalent and phone/tablet breakpoint proof
Used full current branch file text. Regular expression equivalent to `grep -nE '<(button|input|select|textarea)([[:space:]]|>)|<svg([[:space:]]|>)|#[[:xdigit:]]{6}' FILE`, plus `grep -nE 'sm:|md:' FILE`. Paired Button/Link tags and literal brace counts were checked, not TypeScript compiled.
| File | Raw/SVG/hex | Button; Link open/close | Curly | Source breakpoints |
|---|---|---|---|---|
| tpo-batch-class-decision.tsx | 0/0/0 | 1/1; 0/0 | 40/40 | sm 0; md 2 |
| tpo-after-college-editor.tsx | 0/0/0 | 4/4; 0/0 | 58/58 | sm 0; md 5 |
| tpo-debar-control.tsx | 0/0/0 | 1/1; 0/0 | 43/43 | sm 0; md 2 |
| tpo-timed-debar-control.tsx | 0/0/0 | 4/4; 0/0 | 74/74 | sm 0; md 3 |
| tpo-roster-verification-bulk.tsx | 0/0/0 | 4/4; 0/0 | 89/89 | sm 0; md 2 |
| tpo-batch-inline-decision.tsx | 0/0/0 | 4/4; 0/0 | 75/75 | sm 0; md 2 |
| tpo-batch-student-saved-views.tsx | 0/0/0 | 6/6; 0/0 | 78/78 | sm 0; md 3 |

Source matching is not a substitute for responsive screenshots or clicking/typing in the app; visual/behavioral acceptance for phone 360px, 767px, 768px and tablet 1024px remains open. Global A5/A6/A7/E8 unticked.

## chat-12 bounded continuation, 2026-10-20 — batch 3

- [x] src/components/tpo/tpo-new-recruiter-conversation.tsx — Recruiter selector, preset buttons, textarea and actions min-h-11 phone/36px md; quick reply radius token; multiline text switches only at md; original target-route and draft/send guard unchanged.
- [x] src/components/tpo/tpo-recruiter-message-reply.tsx — Reply quick buttons 44px phone/36px md, 9px token radius; original auto-draft, discard confirmation and read actions retained.
- [x] src/components/tpo/tpo-public-join-link-card.tsx — Public and company join-link enabling/replace flow preserved; shared domain Input and link actions min-h-11 md:min-h-9, 44px toggle row.
- [x] src/components/tpo/tpo-inbox-search.tsx — Original search debounce and keyboard actions retained; shared Input min-h-11 44px phone/md 36px at old 768px.
- [x] src/components/tpo/tpo-new-followup-modal.tsx — Original review and guarded new follow-up retained; field shared Select/Input/Textarea 44px phone /36px md; teal underlined launch link and focus.
- [x] src/components/tpo/tpo-due-followup-workspace.tsx — Original recruiter follow-up/complete conditional workflow and 25-row slice retained; white single-canvas border-y panels, md 768px two-column, 44px phone buttons, teal underlined recruiter/mail/phone links and 2px keyboard outline.

### Old LMS versus vNext value table
Old reference: docs/design/old-lms-pages.md:6-10 white 12px outer canvas, hairline row separators, compact table/list and slim warnings; old-lms-shell.css:23,31-32,73 phone below 768px with 44px touch; old-lms-shell-spec.md:24-25 36px desktop action and 9px radius; components___common.scss:68-75 teal link and underline hover; no change to server-authorized row scope.
| File | Authored source value and retained behavior | Status |
|---|---|---|
| tpo-new-recruiter-conversation.tsx | tpo-new-recruiter-conversation.tsx:76,94,117 — Recruiter selector, preset buttons, textarea and actions min-h-11 phone/36px md; quick reply radius token; multiline text switches only at md; original target-route and draft/send guard unchanged | Source-aligned, rendered check open |
| tpo-recruiter-message-reply.tsx | tpo-recruiter-message-reply.tsx:70,84,86 — Reply quick buttons 44px phone/36px md, 9px token radius; original auto-draft, discard confirmation and read actions retained | Source-aligned, rendered check open |
| tpo-public-join-link-card.tsx | tpo-public-join-link-card.tsx:146,147,160 — Public and company join-link enabling/replace flow preserved; shared domain Input and link actions min-h-11 md:min-h-9, 44px toggle row | Source-aligned, rendered check open |
| tpo-inbox-search.tsx | tpo-inbox-search.tsx:27 — Original search debounce and keyboard actions retained; shared Input min-h-11 44px phone/md 36px at old 768px | Source-aligned, rendered check open |
| tpo-new-followup-modal.tsx | tpo-new-followup-modal.tsx:14,91,117 — Original review and guarded new follow-up retained; field shared Select/Input/Textarea 44px phone /36px md; teal underlined launch link and focus | Source-aligned, rendered check open |
| tpo-due-followup-workspace.tsx | tpo-due-followup-workspace.tsx:38,39,127 — Original recruiter follow-up/complete conditional workflow and 25-row slice retained; white single-canvas border-y panels, md 768px two-column, 44px phone buttons, teal underlined recruiter/mail/phone links and 2px keyboard outline | Source-aligned, rendered check open |

### File-scoped grep and responsive source proof
All six complete files fetched from branch and checked for raw `<button|input|select|textarea>`, literal SVG, six-digit colors, JSX Button/Link pair balance, curly counts and `sm:`/`md:` breakpoints; equivalent CLI grep `grep -nE '<(button|input|select|textarea)([[:space:]]|>)|<svg([[:space:]]|>)|#[[:xdigit:]]{6}' FILE`.
| File | Raw/SVG/hex | Button; Link pairs | Curly | Source breakpoints |
|---|---|---|---|---|
| tpo-new-recruiter-conversation.tsx | 0/0/0 | 4/4; 0/0 | 70/70 | sm 0; md 6 |
| tpo-recruiter-message-reply.tsx | 0/0/0 | 4/4; 0/0 | 61/61 | sm 0; md 4 |
| tpo-public-join-link-card.tsx | 0/0/0 | 4/4; 0/0 | 102/102 | sm 0; md 5 |
| tpo-inbox-search.tsx | 0/0/0 | 0/0; 0/0 | 17/17 | sm 0; md 1 |
| tpo-new-followup-modal.tsx | 0/0/0 | 3/3; 0/0 | 83/83 | sm 0; md 4 |
| tpo-due-followup-workspace.tsx | 0/0/0 | 3/3; 1/1 | 113/113 | sm 0; md 10 |

The TPO recruiter/message/follow-up scoped visual text is **source reviewed**, not pixel-certified. No app, CI, typecheck, lint, browser clicks, screenshot at 360px/767px/768px/1024px or real clipboard/send testing. Global A5–A7 and E8 remain unchecked.

## chat-12 TPO server page parity — 2026-10-20

- [x] src/app/(authenticated)/tpo/batches/page.tsx — protected membership/filter and server data untouched; six batch selects, paging, status links and link actions use 44px phone/36px md, list and metric strip cross at legacy 768px, numbers consolidated into one bordered strip rather than four independent cards.
- [x] src/app/(authenticated)/tpo/team/page.tsx — authenticated people/conversation data untouched; sort/filter tabs, conversation and paging links get 44px phone tap, keyboard focus and md 768px classes; existing avatar sizing left unchanged for global A6.

### Legacy/vNext value comparison
Reference docs/design/old-lms-pages.md:6,9,14-17 one canvas, contiguous metric strip, hairlines; docs/design/old-lms-shell.css:23,73 phone <768px and 44px touch; old-lms-shell-spec.md:24-25 36px action; components___common.scss:68-75 teal links.
| File | VNext authored values/source | Result |
|---|---|---|
| src/app/(authenticated)/tpo/batches/page.tsx | 43:return <div role="alert">Invalid batch filters. <Link className="lms-inline-link inline-flex min-h-11 items-center text-link underline ; 50:if(!pageParsed.success)return <div role="alert">Invalid batch page. <Link className="lms-inline-link inline-flex min-h-11 items-center ; 51:if(!deadlineParsed.success)return <div role="alert">Invalid deadline filter. <Link className="lms-inline-link inline-flex min-h-11 item; 52:if(!departmentParsed.success)return <div role="alert">Invalid department filter. <Link className="lms-inline-link inline-flex min-h-11 ; 53:if(!programParsed.success)return <div role="alert">Invalid program filter. <Link className="lms-inline-link inline-flex min-h-11 items- | Source-aligned; screenshots pending |
| src/app/(authenticated)/tpo/team/page.tsx | 101:{people.length?<ul className="grid gap-3 md:grid-cols-2">; 119:{ownerWorkload?.ready?<dl aria-label="Placement workload" className="mt-3 grid grid-cols-2 gap-2 text-xs md:grid-cols-3">; 130:className="lms-inline-link inline-flex min-h-11 items-center text-link underline underline-offset-2 focus-visible:outline-2 focus-visib; 158:<Link href="/tpo/team/everyone" className="lms-inline-link mt-3 block min-h-11 border-b border-border py-4 font-semibold text-link unde; 165:<Link className="lms-inline-link ml-2 inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus | Source-aligned; screenshots pending |

### Scoped grep and responsive source proof
Full contents scanned using regex equivalent of grep -nE '<(button|input|select|textarea)([[:space:]]|>)|<svg([[:space:]]|>)|#[[:xdigit:]]{6}' FILE, paired JSX Button/Link tokens and braces; responsive tokens `sm:` and `md:`.
| File | Raw/SVG/hex | Button/Link pairs | Braces | sm/md |
|---|---|---|---|---|
| src/app/(authenticated)/tpo/batches/page.tsx | 0/0/0 | 1/1; 15/15 | 145/145 | 0/24 |
| src/app/(authenticated)/tpo/team/page.tsx | 0/0/0 | 0/0; 10/10 | 140/140 | 0/7 |

No app execution or CI/browser/screenshot verification. Global A5–A7/E8 remain unchecked; changed scoped file styles only.

**Next unticked TPO page:** src/app/(authenticated)/tpo/students/page.tsx (large source file; whole-file UI and source parity, not patched/ticked in this batch).

## chat-15 HR recruiter results — desktop summary sheet continuation (2026-10-20)

- [ ] `src/components/placements/recruiter-result-review-grid.tsx`: new read-only `TpoGrid` sheet of authorized recruiter candidate result rows. No independent client fetch, no mutating cell editor, no release/grading API. `rowActions` links to existing editor row ID.
- [ ] `src/components/placements/recruiter-result-controls.tsx`: authorized page already passes round/participant metadata; a `hidden md:block` sheet per evaluative round lists Candidate, Contact, Outcome, Score %, Waitlist #, Result status. All original inline result forms, validation, optimistic workflow and bulk selection remain below it. No duplication of input controls across viewports.
  
| Property / state | Old LMS reference and value | New vNext source and value | Result |
| --- | --- | --- | --- |
| Canvas structure | `docs/design/old-lms-pages.md:6` single white 12px-radius bordered canvas, no nested per-row cards | `recruiter-result-controls.tsx:385,393` per-round `article` with `border-b`, no card-specific bg/radius; grid inherited canvas | Structural match; outer shared canvas unmodified |
| Sheet columns | `old-lms-pages.md:10` bordered compact cells, row navigation | `recruiter-result-review-grid.tsx:22-30` six read-only columns plus Review row; no custom table markup | Uses shared `TpoGrid`; runtime/pixel not verified |
| Read-only sort | `docs/design/ui-clone-checklist.md:66` numeric/date-only sort | `recruiter-result-review-grid.tsx:26-29` Score % and Waitlist # sortKind number; text no sortKind | Source match |
| Row click / review action | `old-lms-pages.md:10` row action; `components___common.scss` shared hover/focus rules | `recruiter-result-review-grid.tsx:39-43` Review row goes to in-page anchor; `recruiter-result-controls.tsx:513+` matching ID plus scroll margin | Source reachability; actual focus/scroll still pending |
| Phone and tablet | `components___listing-page-header.scss:131-158` mobile <=767px | `recruiter-result-controls.tsx:460` sheet `hidden md:block`, editable stacked row controls persist in phone; editor fields `md:grid-cols-2` | Source threshold matches; physical widths untested |
| Busy/disabled | Shared `Button` loading/disabled tokens, legacy form guard | Bulk Send `loading={bulkPending===round.id}`, Stage `loading={pendingKey===key}`, guarded writes left unchanged | Source busy-state behavior preserved; keyboard runtime missing |
| Empty and error | `old-lms-pages.md:11-12` shared empty/error panels | `EmptyState` for no rounds/no participants; mutation error remains existing `useToast` | Shared semantics, pixel comparison incomplete |

**Post-write source scans** for `recruiter-result-controls.tsx` (829 lines), `recruiter-result-review-grid.tsx` (46 lines), `known-errors-workspace.tsx` (274 lines): native control/table, inline 3–8-digit hex, authored `h1`, custom overlay counts **0/0/0/0 for each**. Result editor tag pairs: `div` 11/11, `article` 1/1, `label` 6/6. New grid has no intrinsic JSX row/control element (one shared TpoGrid and row-action Link only). Source proves `md:` starts at 768px, with single-column candidates and form controls below 768px. **No CI, TypeScript compile, Playwright, screenshots, or old-LMS measured states were run. E8 stays unticked.**

**Remaining dependency:** `src/components/tpo/grid/tpo-grid.tsx` imports ag-grid 36.x, while `package.json` has no declared `ag-grid-react` or `ag-grid-community` dependency as read on this lane. This is an upstream integration blocker; no package manifest or shared UI file was modified.


## chat-15 — employer discussion proposals sheet, 2026-10-20

- [ ] `src/components/hr/hr-proposal-history-grid.tsx`: read-only `TpoGrid` with Role, Proposal reference, Sent for discussion (date-sort), Status; one Open discussion action per scoped row. It receives only the pre-authorized server page; no client fetch/export or mutating selection.
- [ ] `src/app/(authenticated)/hr/drives/proposals/page.tsx`: desktop `hidden md:block` grid of current page; original mobile `ol` remains `md:hidden`. The existing URL filters, college guard, server cursor/pagination, CSV export and conversation links remain unchanged.

| Old LMS value/property | Exact reference | Current vNext value | Gap |
| --- | --- | --- | --- |
| One white canvas and compact hairline rows | `docs/design/old-lms-pages.md:6,10` | `hr/drives/proposals/page.tsx` uses one white parent canvas; separate cards absent, `TpoGrid` shared bordered grid on desktop | Runtime row heights unknown |
| External filters, paging and safe CSV | `old-lms-pages.md:10` search, sort, export, row actions | Existing server-side search/sort/page/CSV URLs unchanged, shared `TpoGrid` gets only visible approved rows | No off-page or unauthorized export |
| Numeric/date sorts only | `docs/design/ui-clone-checklist.md:66` | `hr-proposal-history-grid.tsx`: only Sent date has `sortKind:"date"` and timestamp `sortValue` | Source match; runtime sort untested |
| Status / action | `old-lms-pages.md:10-12` status column and row link | Status says "Discussion only — not an approval request"; row action opens existing authenticated conversation | Specific HR text preserved elsewhere; new sheet label reviewed |
| Phone<=767px vs desktop>=768px | `components___listing-page-header.scss:131-158` | `hidden md:block` sheet desktop and `md:hidden` original touch list mobile. Mobile action hit areas 44px via `min-h-11` | Source threshold matches; screenshots outstanding |

Post-edit complete source scans: `hr/drives/proposals/page.tsx` (106 lines), `hr-proposal-history-grid.tsx` (40 lines) have 0 raw input/select/button/textarea/table, 0 hex, 0 custom `h1`, 0 handmade overlays each. JSX pair counts route: `div` 2/2, `ol` 1/1, fragments 2/2. No changes to shared UI, no CI/build/test/Playwright. **Sheet E8 and this visible page are unticked** pending full pixel interaction-state and AG Grid install proof.


## chat-12 2026-10-20 — 15 source-complete TPO pages/components (North Star)

Legacy evidence: `docs/design/old-lms-shell-spec.md:19-24` (one white 12px/1px canvas, 36px and radius-9 buttons), `docs/design/old-lms-shell.css:23,31-32,73` (44px phone tap / max 767px), `docs/design/old-lms-pages.md:6,7,9,11` (continuous canvas, slender warnings and compact tables), `docs/design/legacy-styles/components___common.scss:68-75` (teal hover/underline) and `components___form.scss:117-143` (14px/400/20px shared form, 10px radius/focus). VNext inheritance: `src/app/globals.css:352` (`--lms-control-radius:9px`), `src/styles/legacy-skin.css:110-133,411-423` (form and links).

### File work queue (source-complete; live visual verification remains open)
- [x] `src/components/tpo/recruiter-roster-display-controls.tsx` — 3 value/property rows, scoped grep raw 0, SVG 0, hex 0, JSX 0/0 Button / 0/0 Link; responsive md 2, sm 0; actual screenshots outstanding.
- [x] `src/components/tpo/recruiter-saved-view-controls.tsx` — 4 value/property rows, scoped grep raw 0, SVG 0, hex 0, JSX 9/9 Button / 0/0 Link; responsive md 8, sm 0; actual screenshots outstanding.
- [x] `src/components/tpo/tpo-academic-import-preview.tsx` — 4 value/property rows, scoped grep raw 0, SVG 0, hex 0, JSX 1/1 Button / 0/0 Link; responsive md 1, sm 0; actual screenshots outstanding.
- [x] `src/components/tpo/tpo-academic-import-workspace.tsx` — 4 value/property rows, scoped grep raw 0, SVG 0, hex 0, JSX 5/5 Button / 0/0 Link; responsive md 5, sm 0; actual screenshots outstanding.
- [x] `src/components/tpo/tpo-batch-eligibility-import.tsx` — 4 value/property rows, scoped grep raw 0, SVG 0, hex 0, JSX 10/10 Button / 0/0 Link; responsive md 8, sm 0; actual screenshots outstanding.
- [x] `src/components/tpo/tpo-batch-undo-control.tsx` — 4 value/property rows, scoped grep raw 0, SVG 0, hex 0, JSX 1/1 Button / 0/0 Link; responsive md 1, sm 0; actual screenshots outstanding.
- [x] `src/components/tpo/tpo-everyone-controls.tsx` — 4 value/property rows, scoped grep raw 0, SVG 0, hex 0, JSX 2/2 Button / 0/0 Link; responsive md 0, sm 0; actual screenshots outstanding.
- [x] `src/components/tpo/tpo-keyboard-shortcuts.tsx` — 3 value/property rows, scoped grep raw 0, SVG 0, hex 0, JSX 1/1 Button / 0/0 Link; responsive md 2, sm 0; actual screenshots outstanding.
- [x] `src/components/tpo/tpo-mobile-footer.tsx` — 4 value/property rows, scoped grep raw 0, SVG 0, hex 0, JSX 1/1 Button / 2/2 Link; responsive md 1, sm 0; actual screenshots outstanding.
- [x] `src/components/tpo/tpo-safe-csv-download.tsx` — 4 value/property rows, scoped grep raw 0, SVG 0, hex 0, JSX 1/1 Button / 0/0 Link; responsive md 1, sm 0; actual screenshots outstanding.
- [x] `src/components/tpo/tpo-students-selection.tsx` — 4 value/property rows, scoped grep raw 0, SVG 0, hex 0, JSX 0/0 Button / 0/0 Link; responsive md 0, sm 0; actual screenshots outstanding.
- [x] `src/components/tpo/tpo-student-outcome-pill.tsx` — 3 value/property rows, scoped grep raw 0, SVG 0, hex 0, JSX 0/0 Button / 0/0 Link; responsive md 0, sm 0; actual screenshots outstanding.
- [x] `src/components/tpo/recruiter-leads-workspace.tsx` — 4 value/property rows, scoped grep raw 0, SVG 0, hex 0, JSX 25/25 Button / 8/8 Link; responsive md 7, sm 0; actual screenshots outstanding.
- [x] `src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx` — 4 value/property rows, scoped grep raw 0, SVG 0, hex 0, JSX 1/1 Button / 6/6 Link; responsive md 21, sm 0; actual screenshots outstanding.
- [x] `src/components/tpo/tpo-company-memory-drive-grid.tsx` — 4 value/property rows, scoped grep raw 0, SVG 0, hex 0, JSX 0/0 Button / 0/0 Link; responsive md 0, sm 0; actual screenshots outstanding.

### Property-by-property source comparison: old LMS vs current VNext
| File | Value/state/property | Old LMS file/line and measured source reference | VNext file/line/source property | Result |
|---|---|---|---|---|
| `src/components/tpo/recruiter-roster-display-controls.tsx` | field / focus | docs/design/legacy-styles/components___form.scss:117-143 — input 14px/400/20px, 10px radius, focus halo (inherited shared field) | src/components/tpo/recruiter-roster-display-controls.tsx:14 — `<Select className="mt-1 block min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] border borde` | Source inspected; browser unverified |
| `src/components/tpo/recruiter-roster-display-controls.tsx` | phone/tablet height | docs/design/old-lms-shell-spec.md:23-24 — action 9px radius/36px desktop; old-lms-shell.css:23,31-32,73 — 44px touch below 768px | src/components/tpo/recruiter-roster-display-controls.tsx:14 — `<Select className="mt-1 block min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] border borde` | Source inspected; browser unverified |
| `src/components/tpo/recruiter-roster-display-controls.tsx` | option hover/active | docs/design/old-lms-shell.css:47-48 — subtle teal hover; no hardcoded rgba in component | src/components/tpo/recruiter-roster-display-controls.tsx:31 — `(column==="Contact"?"cursor-not-allowed opacity-50":"hover:bg-muted active:bg-primary-subtle")}>` | Source inspected; browser unverified |
| `src/components/tpo/recruiter-saved-view-controls.tsx` | control heights | docs/design/old-lms-shell-spec.md:23-24 — action 9px radius/36px desktop; old-lms-shell.css:23,31-32,73 — 44px touch below 768px | src/components/tpo/recruiter-saved-view-controls.tsx:11 — `const button="min-h-11 max-w-full break-words px-3 text-sm md:min-h-9";` | Source inspected; browser unverified |
| `src/components/tpo/recruiter-saved-view-controls.tsx` | editable view field | docs/design/legacy-styles/components___form.scss:117-143 — input 14px/400/20px, 10px radius, focus halo (inherited shared field) | src/components/tpo/recruiter-saved-view-controls.tsx:92 — `onChange={e=>setName(e.target.value)} className="min-h-11 w-full min-w-0 rounded-[var(--lms-control-ra` | Source inspected; browser unverified |
| `src/components/tpo/recruiter-saved-view-controls.tsx` | section separators | docs/design/old-lms-shell-spec.md:19-20; old-lms-pages.md:6,11 — one canvas, 1px hairline row separators | src/components/tpo/recruiter-saved-view-controls.tsx:86 — `return <section aria-label="Saved recruiter views" className="min-w-0 space-y-3 border-y border-border` | Source inspected; browser unverified |
| `src/components/tpo/recruiter-saved-view-controls.tsx` | empty/loading | docs/design/old-lms-pages.md:7,11 — slim notice, preserved loading/empty/error/disabled state and compact list status | src/components/tpo/recruiter-saved-view-controls.tsx:88 — `{ready===null?<p role="status" className="text-sm">Loading views…</p>:` | Source inspected; browser unverified |
| `src/components/tpo/tpo-academic-import-preview.tsx` | section | docs/design/old-lms-shell-spec.md:19-20; old-lms-pages.md:6,11 — one canvas, 1px hairline row separators | src/components/tpo/tpo-academic-import-preview.tsx:20 — `return <section className="min-w-0 space-y-3 border-y border-border py-3">` | Source inspected; browser unverified |
| `src/components/tpo/tpo-academic-import-preview.tsx` | multiline field | docs/design/legacy-styles/components___form.scss:117-143 — input 14px/400/20px, 10px radius, focus halo (inherited shared field) | src/components/tpo/tpo-academic-import-preview.tsx:24 — `<label className="block text-sm print:hidden">CSV data<Textarea value={text} onChange={e=>{setText(e.t` | Source inspected; browser unverified |
| `src/components/tpo/tpo-academic-import-preview.tsx` | preview action | docs/design/old-lms-shell-spec.md:23-24 — action 9px radius/36px desktop; old-lms-shell.css:23,31-32,73 — 44px touch below 768px | src/components/tpo/tpo-academic-import-preview.tsx:25 — `<Button variant="secondary" type="button" onClick={preview} className="min-h-11 md:min-h-9 print:hidde` | Source inspected; browser unverified |
| `src/components/tpo/tpo-academic-import-preview.tsx` | error | docs/design/old-lms-pages.md:7,11 — slim notice, preserved loading/empty/error/disabled state and compact list status | src/components/tpo/tpo-academic-import-preview.tsx:26 — `{error?<p role="alert" className="border-l-2 border-warning bg-warning-subtle px-3 py-3 text-sm text-e` | Source inspected; browser unverified |
| `src/components/tpo/tpo-academic-import-workspace.tsx` | panel | docs/design/old-lms-shell-spec.md:19-20; old-lms-pages.md:6,11 — one canvas, 1px hairline row separators | src/components/tpo/tpo-academic-import-workspace.tsx:108 — `className="mt-3 w-full min-w-0 max-w-4xl space-y-3 border-y border-border py-4">` | Source inspected; browser unverified |
| `src/components/tpo/tpo-academic-import-workspace.tsx` | CSV textarea | docs/design/legacy-styles/components___form.scss:117-143 — input 14px/400/20px, 10px radius, focus halo (inherited shared field) | src/components/tpo/tpo-academic-import-workspace.tsx:130 — `className="mt-1 min-h-32 w-full min-w-0 font-mono text-xs" />` | Source inspected; browser unverified |
| `src/components/tpo/tpo-academic-import-workspace.tsx` | download CTA | docs/design/legacy-styles/components___common.scss:68-75 — teal link, 500 weight and underline hover; accessibility focus halo inherited | src/components/tpo/tpo-academic-import-workspace.tsx:121 — `className="lms-inline-link inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] borde` | Source inspected; browser unverified |
| `src/components/tpo/tpo-academic-import-workspace.tsx` | failure | docs/design/old-lms-pages.md:7,11 — slim notice, preserved loading/empty/error/disabled state and compact list status | src/components/tpo/tpo-academic-import-workspace.tsx:179 — `{error && <p role="alert" className="border-l-2 border-warning bg-warning-subtle px-3 py-3 text-sm tex` | Source inspected; browser unverified |
| `src/components/tpo/tpo-batch-eligibility-import.tsx` | import action | docs/design/old-lms-shell-spec.md:23-24 — action 9px radius/36px desktop; old-lms-shell.css:23,31-32,73 — 44px touch below 768px | src/components/tpo/tpo-batch-eligibility-import.tsx:94 — `<Button variant="secondary" type="button" className="min-h-11 md:min-h-9 print:hidden" disabled={busy}` | Source inspected; browser unverified |
| `src/components/tpo/tpo-batch-eligibility-import.tsx` | CSV paste | docs/design/legacy-styles/components___form.scss:117-143 — input 14px/400/20px, 10px radius, focus halo (inherited shared field) | src/components/tpo/tpo-batch-eligibility-import.tsx:115 — `<Textarea className="mt-1 min-h-32 w-full min-w-0 font-mono text-xs"` | Source inspected; browser unverified |
| `src/components/tpo/tpo-batch-eligibility-import.tsx` | warning | docs/design/old-lms-pages.md:7,11 — slim notice, preserved loading/empty/error/disabled state and compact list status | src/components/tpo/tpo-batch-eligibility-import.tsx:121 — `{unresolved>0?<p role="alert" className="border-l-2 border-warning bg-warning-subtle px-3 py-3 text-sm` | Source inspected; browser unverified |
| `src/components/tpo/tpo-batch-eligibility-import.tsx` | review guard | docs/design/old-lms-pages.md:7,11 — slim notice, preserved loading/empty/error/disabled state and compact list status | src/components/tpo/tpo-batch-eligibility-import.tsx:36 — `const [acknowledged,setAcknowledged]=useState(false);` | Source inspected; browser unverified |
| `src/components/tpo/tpo-batch-undo-control.tsx` | flat section | docs/design/old-lms-shell-spec.md:19-20; old-lms-pages.md:6,11 — one canvas, 1px hairline row separators | src/components/tpo/tpo-batch-undo-control.tsx:29 — `return <div className="min-w-0 space-y-2 border-t border-border pt-3 print:hidden"><label className="f` | Source inspected; browser unverified |
| `src/components/tpo/tpo-batch-undo-control.tsx` | selection target | docs/design/old-lms-shell-spec.md:23-24 — action 9px radius/36px desktop; old-lms-shell.css:23,31-32,73 — 44px touch below 768px | src/components/tpo/tpo-batch-undo-control.tsx:29 — `return <div className="min-w-0 space-y-2 border-t border-border pt-3 print:hidden"><label className="f` | Source inspected; browser unverified |
| `src/components/tpo/tpo-batch-undo-control.tsx` | disabled undo | docs/design/old-lms-pages.md:7,11 — slim notice, preserved loading/empty/error/disabled state and compact list status | src/components/tpo/tpo-batch-undo-control.tsx:29 — `return <div className="min-w-0 space-y-2 border-t border-border pt-3 print:hidden"><label className="f` | Source inspected; browser unverified |
| `src/components/tpo/tpo-batch-undo-control.tsx` | API error | docs/design/old-lms-pages.md:7,11 — slim notice, preserved loading/empty/error/disabled state and compact list status | src/components/tpo/tpo-batch-undo-control.tsx:31 — `{error?<InlineNotice tone="error" message={error}/>:null}</div>;` | Source inspected; browser unverified |
| `src/components/tpo/tpo-everyone-controls.tsx` | composer layout | docs/design/old-lms-shell-spec.md:19-20; old-lms-pages.md:6,11 — one canvas, 1px hairline row separators | src/components/tpo/tpo-everyone-controls.tsx:82 — `className="min-w-0 space-y-3 border-y border-border py-4">` | Source inspected; browser unverified |
| `src/components/tpo/tpo-everyone-controls.tsx` | multiline field | docs/design/legacy-styles/components___form.scss:117-143 — input 14px/400/20px, 10px radius, focus halo (inherited shared field) | src/components/tpo/tpo-everyone-controls.tsx:85 — `<Textarea className="mt-2 min-h-32 w-full min-w-0" name="body" required maxLength={4000} rows={4} valu` | Source inspected; browser unverified |
| `src/components/tpo/tpo-everyone-controls.tsx` | disabled send | docs/design/old-lms-pages.md:7,11 — slim notice, preserved loading/empty/error/disabled state and compact list status | src/components/tpo/tpo-everyone-controls.tsx:91 — `<Button type="submit" disabled={busy//!message.trim()}` | Source inspected; browser unverified |
| `src/components/tpo/tpo-everyone-controls.tsx` | failure | docs/design/old-lms-pages.md:7,11 — slim notice, preserved loading/empty/error/disabled state and compact list status | src/components/tpo/tpo-everyone-controls.tsx:97 — `{error?<p role="alert" className="border-l-2 border-warning bg-warning-subtle px-3 py-3 text-sm text-e` | Source inspected; browser unverified |
| `src/components/tpo/tpo-keyboard-shortcuts.tsx` | trigger touch height | docs/design/old-lms-shell-spec.md:23-24 — action 9px radius/36px desktop; old-lms-shell.css:23,31-32,73 — 44px touch below 768px | src/components/tpo/tpo-keyboard-shortcuts.tsx:30 — `className="min-h-11 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-prima` | Source inspected; browser unverified |
| `src/components/tpo/tpo-keyboard-shortcuts.tsx` | tablet layout | docs/design/old-lms-shell.css:23,73 — phone <=767px and tablet >=768px | src/components/tpo/tpo-keyboard-shortcuts.tsx:34 — `<ul className="mt-2 grid min-w-0 grid-cols-1 gap-2 text-sm md:grid-cols-2">{Object.entries(go).map(([k` | Source inspected; browser unverified |
| `src/components/tpo/tpo-keyboard-shortcuts.tsx` | drawer | docs/design/old-lms-shell-spec.md:19-20; old-lms-pages.md:6,11 — one canvas, 1px hairline row separators | src/components/tpo/tpo-keyboard-shortcuts.tsx:31 — `<Drawer title="Keyboard shortcuts" open={open} onOpenChange={setOpen}` | Source inspected; browser unverified |
| `src/components/tpo/tpo-mobile-footer.tsx` | mobile boundary | docs/design/old-lms-shell.css:23,73 — phone <=767px and tablet >=768px | src/components/tpo/tpo-mobile-footer.tsx:43 — `<nav aria-label="TPO mobile footer" className="lms-tpo-mobile-footer fixed inset-x-0 bottom-0 z-40 gri` | Source inspected; browser unverified |
| `src/components/tpo/tpo-mobile-footer.tsx` | icon family / 24px | docs/design/old-lms-pages.md:24; old LMS MobileFooter.jsx:175-191 — legacy nav icon family | src/components/tpo/tpo-mobile-footer.tsx:51 — `<Image src={link.icon} alt="" width={24} height={24} className="lms-tpo-mobile-footer-icon"/>` | Source inspected; browser unverified |
| `src/components/tpo/tpo-mobile-footer.tsx` | link radius | docs/design/old-lms-shell-spec.md:23-24 — action 9px radius/36px desktop; old-lms-shell.css:23,31-32,73 — 44px touch below 768px | src/components/tpo/tpo-mobile-footer.tsx:66 — `className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border ` | Source inspected; browser unverified |
| `src/components/tpo/tpo-mobile-footer.tsx` | link and focus | docs/design/legacy-styles/components___common.scss:68-75 — teal link, 500 weight and underline hover; accessibility focus halo inherited | src/components/tpo/tpo-mobile-footer.tsx:66 — `className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border ` | Source inspected; browser unverified |
| `src/components/tpo/tpo-safe-csv-download.tsx` | action height | docs/design/old-lms-shell-spec.md:23-24 — action 9px radius/36px desktop; old-lms-shell.css:23,31-32,73 — 44px touch below 768px | src/components/tpo/tpo-safe-csv-download.tsx:40 — `className="min-h-11 max-w-full whitespace-normal break-words text-left focus-visible:outline-2 focus-v` | Source inspected; browser unverified |
| `src/components/tpo/tpo-safe-csv-download.tsx` | long labels | docs/design/old-lms-shell-spec.md:19-20; old-lms-pages.md:6,11 — one canvas, 1px hairline row separators | src/components/tpo/tpo-safe-csv-download.tsx:40 — `className="min-h-11 max-w-full whitespace-normal break-words text-left focus-visible:outline-2 focus-v` | Source inspected; browser unverified |
| `src/components/tpo/tpo-safe-csv-download.tsx` | failure | docs/design/old-lms-pages.md:7,11 — slim notice, preserved loading/empty/error/disabled state and compact list status | src/components/tpo/tpo-safe-csv-download.tsx:43 — `{error?<InlineNotice tone="error" message={error}/>:null}` | Source inspected; browser unverified |
| `src/components/tpo/tpo-safe-csv-download.tsx` | pending | docs/design/old-lms-pages.md:7,11 — slim notice, preserved loading/empty/error/disabled state and compact list status | src/components/tpo/tpo-safe-csv-download.tsx:41 — `{pending?"Preparing export…":label}` | Source inspected; browser unverified |
| `src/components/tpo/tpo-students-selection.tsx` | hairline summary | docs/design/old-lms-shell-spec.md:19-20; old-lms-pages.md:6,11 — one canvas, 1px hairline row separators | src/components/tpo/tpo-students-selection.tsx:44 — `return <p role="status" aria-live="polite" className="min-w-0 border-b border-border py-2 text-sm text` | Source inspected; browser unverified |
| `src/components/tpo/tpo-students-selection.tsx` | text style | docs/design/old-lms-shell-spec.md:19-20; old-lms-pages.md:6,11 — one canvas, 1px hairline row separators | src/components/tpo/tpo-students-selection.tsx:44 — `return <p role="status" aria-live="polite" className="min-w-0 border-b border-border py-2 text-sm text` | Source inspected; browser unverified |
| `src/components/tpo/tpo-students-selection.tsx` | hidden-selection warning | docs/design/old-lms-pages.md:7,11 — slim notice, preserved loading/empty/error/disabled state and compact list status | src/components/tpo/tpo-students-selection.tsx:46 — `{selection.notice?<span className="ml-2 inline-block break-words font-semibold text-warning-text">{sel` | Source inspected; browser unverified |
| `src/components/tpo/tpo-students-selection.tsx` | authorized IDs | docs/design/old-lms-pages.md:7,11 — slim notice, preserved loading/empty/error/disabled state and compact list status | src/components/tpo/tpo-students-selection.tsx:24 — `if(Array.isArray(parsed))setSelected(parsed.filter((id):id is string=>typeof id==="string"&&allowed.ha` | Source inspected; browser unverified |
| `src/components/tpo/tpo-student-outcome-pill.tsx` | badge family | docs/design/old-lms-pages.md:11 — small status pills in table rows | src/components/tpo/tpo-student-outcome-pill.tsx:6 — `return <Badge title={placed?"Derived from recorded accepted/external placement evidence.":` | Source inspected; browser unverified |
| `src/components/tpo/tpo-student-outcome-pill.tsx` | label wrap | docs/design/old-lms-shell-spec.md:19-20; old-lms-pages.md:6,11 — one canvas, 1px hairline row separators | src/components/tpo/tpo-student-outcome-pill.tsx:8 — `tone="neutral" className="max-w-full whitespace-normal break-words text-left">` | Source inspected; browser unverified |
| `src/components/tpo/tpo-student-outcome-pill.tsx` | source labels | docs/design/old-lms-pages.md:7,11 — slim notice, preserved loading/empty/error/disabled state and compact list status | src/components/tpo/tpo-student-outcome-pill.tsx:4 — `const label=placed?(recorded==="PLACED_ON_CAMPUS"//recorded==="PLACED_OFF_CAMPUS"?AFTER_COLLEGE_LABELS` | Source inspected; browser unverified |
| `src/components/tpo/recruiter-leads-workspace.tsx` | filter field | docs/design/legacy-styles/components___form.scss:117-143 — input 14px/400/20px, 10px radius, focus halo (inherited shared field) | src/components/tpo/recruiter-leads-workspace.tsx:151 — `const inputStyle = "min-h-11 w-full min-w-0 rounded-[var(--lms-control-radius)] border border-border b` | Source inspected; browser unverified |
| `src/components/tpo/recruiter-leads-workspace.tsx` | fresh link warning | docs/design/old-lms-pages.md:7,11 — slim notice, preserved loading/empty/error/disabled state and compact list status | src/components/tpo/recruiter-leads-workspace.tsx:684 — `{phase==="ready"&&error?<div role="alert" className="border-l-2 border-warning bg-warning-subtle px-3 ` | Source inspected; browser unverified |
| `src/components/tpo/recruiter-leads-workspace.tsx` | teal link | docs/design/legacy-styles/components___common.scss:68-75 — teal link, 500 weight and underline hover; accessibility focus halo inherited | src/components/tpo/recruiter-leads-workspace.tsx:723 — `<Link className="lms-inline-link inline-flex min-h-11 items-center text-sm text-link underline focus-v` | Source inspected; browser unverified |
| `src/components/tpo/recruiter-leads-workspace.tsx` | authorized bulk action | docs/design/old-lms-pages.md:7,11 — slim notice, preserved loading/empty/error/disabled state and compact list status | src/components/tpo/recruiter-leads-workspace.tsx:23 — `import { RecruiterBulkStageControls } from "./recruiter-bulk-stage-controls";` | Source inspected; browser unverified |
| `src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx` | KPI strip | docs/design/old-lms-shell-spec.md:19-20; old-lms-pages.md:6,11 — one canvas, 1px hairline row separators | src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx:59 — `<dl className="grid min-w-0 grid-cols-2 gap-0 overflow-hidden border-y border-border md:grid-cols-4">` | Source inspected; browser unverified |
| `src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx` | tablet counts | docs/design/old-lms-shell.css:23,73 — phone <=767px and tablet >=768px | src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx:59 — `<dl className="grid min-w-0 grid-cols-2 gap-0 overflow-hidden border-y border-border md:grid-cols-4">` | Source inspected; browser unverified |
| `src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx` | participation link | docs/design/legacy-styles/components___common.scss:68-75 — teal link, 500 weight and underline hover; accessibility focus halo inherited | src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx:35 — `if(!parsed.success)return <p role="alert">Invalid page number. <Link className="lms-inline-link inline` | Source inspected; browser unverified |
| `src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx` | data grid | docs/design/old-lms-pages.md:9-11; legacy lms2-fe/src/components/tpo/grid/TpoGrid.jsx:2-24 — Quartz grid, typed sort/selection | src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx:168 — `<DataTable rows={visible} getRowKey={student=>student.membershipId}` | Source inspected; browser unverified |
| `src/components/tpo/tpo-company-memory-drive-grid.tsx` | Quartz source | docs/design/old-lms-pages.md:9-11; legacy lms2-fe/src/components/tpo/grid/TpoGrid.jsx:2-24 — Quartz grid, typed sort/selection | src/components/tpo/tpo-company-memory-drive-grid.tsx:33 — `()=>import("./grid/tpo-grid").then(module=>module.TpoGrid<CompanyMemoryDriveRow>),` | Source inspected; browser unverified |
| `src/components/tpo/tpo-company-memory-drive-grid.tsx` | loading border | docs/design/old-lms-shell-spec.md:19-20; old-lms-pages.md:6,11 — one canvas, 1px hairline row separators | src/components/tpo/tpo-company-memory-drive-grid.tsx:34 — `{ssr:false,loading:()=> <p role="status" className="border-y border-border py-4 text-sm text-muted-for` | Source inspected; browser unverified |
| `src/components/tpo/tpo-company-memory-drive-grid.tsx` | typed sorting | docs/design/old-lms-pages.md:9-11; legacy lms2-fe/src/components/tpo/grid/TpoGrid.jsx:2-24 — Quartz grid, typed sort/selection | src/components/tpo/tpo-company-memory-drive-grid.tsx:27 — `{key:"applied",label:"Applied",sortKind:"number",sortValue:row=>row.applied,` | Source inspected; browser unverified |
| `src/components/tpo/tpo-company-memory-drive-grid.tsx` | safe CSV | docs/design/old-lms-pages.md:7,11 — slim notice, preserved loading/empty/error/disabled state and compact list status | src/components/tpo/tpo-company-memory-drive-grid.tsx:48 — `const blob=new Blob([companyDriveCsv(shown)],{type:"text/csv;charset=utf-8"});` | Source inspected; browser unverified |

### Source grep and responsive proof — entire file bodies

All 15 files were fetched from the current branch and scanned using expression equivalents of `grep -nE '<(button|input|select|textarea)([[:space:]]|>)|<svg([[:space:]]|>)|#[[:xdigit:]]{6}' FILE` and `grep -nE 'sm:|md:' FILE`. Also compared `<Button>`/`</Button>`, `<Link>`/`</Link>` and literal opening/closing curly counts; these are structural checks, **not** TypeScript parsing, compilation or CI. No raw form opening tags, no literal 6-digit hex colours or inline SVG appear in any of these 15 modified files.
| File | Raw native controls / SVG / six-digit hex | Button; Link opening/closing | Curly brackets | `sm:` / `md:` token count |
|---|---|---|---|---|
| `src/components/tpo/recruiter-roster-display-controls.tsx` | 0/0/0 | 0/0; 0/0 | 19/19 | 0/2 |
| `src/components/tpo/recruiter-saved-view-controls.tsx` | 0/0/0 | 9/9; 0/0 | 97/97 | 0/8 |
| `src/components/tpo/tpo-academic-import-preview.tsx` | 0/0/0 | 1/1; 0/0 | 35/35 | 0/1 |
| `src/components/tpo/tpo-academic-import-workspace.tsx` | 0/0/0 | 5/5; 0/0 | 97/97 | 0/5 |
| `src/components/tpo/tpo-batch-eligibility-import.tsx` | 0/0/0 | 10/10; 0/0 | 142/142 | 0/8 |
| `src/components/tpo/tpo-batch-undo-control.tsx` | 0/0/0 | 1/1; 0/0 | 30/30 | 0/1 |
| `src/components/tpo/tpo-everyone-controls.tsx` | 0/0/0 | 2/2; 0/0 | 52/52 | 0/0 |
| `src/components/tpo/tpo-keyboard-shortcuts.tsx` | 0/0/0 | 1/1; 0/0 | 28/28 | 0/2 |
| `src/components/tpo/tpo-mobile-footer.tsx` | 0/0/0 | 1/1; 2/2 | 39/39 | 0/1 |
| `src/components/tpo/tpo-safe-csv-download.tsx` | 0/0/0 | 1/1; 0/0 | 22/22 | 0/1 |
| `src/components/tpo/tpo-students-selection.tsx` | 0/0/0 | 0/0; 0/0 | 27/27 | 0/0 |
| `src/components/tpo/tpo-student-outcome-pill.tsx` | 0/0/0 | 0/0; 0/0 | 7/7 | 0/0 |
| `src/components/tpo/recruiter-leads-workspace.tsx` | 0/0/0 | 25/25; 8/8 | 630/630 | 0/7 |
| `src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx` | 0/0/0 | 1/1; 6/6 | 122/122 | 0/21 |
| `src/components/tpo/tpo-company-memory-drive-grid.tsx` | 0/0/0 | 0/0; 0/0 | 35/35 | 0/0 |

### Responsive and state limitations

Source uses `md:` at 768px where a breakpoint is required (zero `sm:` from these file scans). `min-h-11` supplies 44px phone control target; `md:min-h-9` supplies 36px desktop where the control requires explicit sizing. Other controls inherit the shared Button/Input responsive skins. Phone footer `md:hidden` ends at 767px, and recruiter column selector wraps. Source preserves existing domain-guarded actions, selection limits, read-only cases, CSV safety, guarded confirmations and empty/error/loading copy.

**STRICT GLOBAL STATUS:** A5 icons, A6 avatars/brand/browser title, A7 complete link family, and E8 global AG Grid parity are **still unticked**. Shared topbar/avatar ownership and actual responsive/raster proof are outside this scoped source pass. No application execution, CI, tests, browser focus testing or 360/767/768/1024px screenshots were performed. These 15 file ticks describe source comparison only, not pixel-certified visual acceptance.

Next unreviewed TPO area: `src/components/tpo/tpo-bell-panel.tsx` (check topbar ownership first); otherwise `src/components/tpo/tpo-company-memory-workspace.tsx` company activity states and the related TPO pages.

## 2026-10-20 [chat-14] fifteen-file E1/E4/E8 visual-source closure

**Scope and proof level.** Every item below is an actual source-file change on `chatgpt/chat-14-b`, with unchanged business authorization and navigation. Counts come from complete GitHub-fetched source text after the commits. They are `grep`-equivalent scans, **not shell grep executed locally**. No TypeScript compiler, test suite, CI, browser, pixel snapshot, or runtime AG Grid verification was performed. Pixel-level acceptance remains open under STRICT TICK RULE.

### 1. `src/components/placements/hr-recruiter-drives-grid.tsx` — HR drive sheet inline actions

| Comparison | Exact/reference value and evidence |
|---|---|
| Old LMS | legacy-styles/components___variables.scss:10 ($clrThird #26bac7); antddesign.scss:1081-1100 (>=44px phone hitbox) |
| New vNext | 6 protected row links now text-link (#26bac7), min-h-11 (44px) on <=767, md:min-h-9 (36px) from 768; authorized server row hrefs remain supplied unchanged |
| Responsive <=767px | six existing inline actions wrap and meet 44px tap area; TpoGrid uses mobile cards below md |
| Responsive >=768px | six actions return to compact 36px in Quartz from 768px |
| States / permission invariants | Open/applicants/offers/requests/hire-again/messages destinations and conditional unanswered request link preserved |

**Source grep proof:** blob `aa3a147112f0`, 76 lines; raw `<button>/<input>/<select>/<textarea>/<details>/<table>` tags **0**; inline 6-digit hex literals **0**; Link opens **6**; Button opens/closes **0/0**; explicit `sortKind` **2**, `sortValue` **2**; `md:` tokens **6**, `sm:` **0**; relevant source lines **37,39,53,55,58,61**.

### 2. `src/components/hr/hr-round-editor-grid.tsx` — HR round metadata actions

| Comparison | Exact/reference value and evidence |
|---|---|
| Old LMS | legacy-styles/components___variables.scss:10; components___antddesign.scss:1081-1100 |
| New vNext | 2 links (Edit round, Review round removal) text-link #26bac7; 44px phone/36px desktop; original editable-only guard intact |
| Responsive <=767px | only authorized editable rows present 2 tappable links in phone row cards |
| Responsive >=768px | 36px action lines from md; numeric sequence/duration sortable |
| States / permission invariants | readonly state still renders no edit/remove actions; unchanged workflow routes |

**Source grep proof:** blob `e2af1c3f0e1f`, 52 lines; raw `<button>/<input>/<select>/<textarea>/<details>/<table>` tags **0**; inline 6-digit hex literals **0**; Link opens **2**; Button opens/closes **0/0**; explicit `sortKind` **2**, `sortValue` **2**; `md:` tokens **2**, `sm:` **0**; relevant source lines **22,23,28,41,43,46**.

### 3. `src/components/hr/hr-job-applicants-grid.tsx` — Recruiter shared-applicant review action

| Comparison | Exact/reference value and evidence |
|---|---|
| Old LMS | legacy-styles/components___variables.scss:10 teal ink; components___antddesign.scss:1081-1100 phone 44px |
| New vNext | Review applicant link is min-h-11 md:min-h-9 and text-link, replacing compact 36px/darker-teal always |
| Responsive <=767px | 44px link inside applicant card; columns still applicant/role/application/screening |
| Responsive >=768px | 36px link, same 4 sortKind source columns, no widened data scope |
| States / permission invariants | reviewHref server authorization unchanged; no unauthorised action |

**Source grep proof:** blob `d0d693855b90`, 55 lines; raw `<button>/<input>/<select>/<textarea>/<details>/<table>` tags **0**; inline 6-digit hex literals **0**; Link opens **1**; Button opens/closes **0/0**; explicit `sortKind` **4**, `sortValue` **3**; `md:` tokens **1**, `sm:` **0**; relevant source lines **29,31,33,37,48,50**.

### 4. `src/components/hr/hr-company-reports-grid.tsx` — Company hiring report row action

| Comparison | Exact/reference value and evidence |
|---|---|
| Old LMS | old-lms-pages.md:6 status pill + link; legacy teal #26bac7; phone 44px |
| New vNext | Open drive action now canonical text-link #26bac7 and 44/36px; original StatusBadge and seven numeric sortable columns retained |
| Responsive <=767px | 44px link and status badge in TpoGrid cards |
| Responsive >=768px | compact 36px link in Quartz from 768px |
| States / permission invariants | PUBLISHED success vs neutral status tone preserved; encoded drive route untouched |

**Source grep proof:** blob `466e77341f41`, 50 lines; raw `<button>/<input>/<select>/<textarea>/<details>/<table>` tags **0**; inline 6-digit hex literals **0**; Link opens **1**; Button opens/closes **0/0**; explicit `sortKind` **7**, `sortValue` **7**; `md:` tokens **1**, `sm:` **0**; relevant source lines **16,20,22,24,26,28**.

### 5. `src/components/tpo/tpo-grid-column-chooser.tsx` — Visible-column checkbox row and reorder controls

| Comparison | Exact/reference value and evidence |
|---|---|
| Old LMS | legacy-styles/components___antddesign.scss:1081-1100 phone >=44px; shell max 767 cutoff |
| New vNext | checkbox label now min-h-11 md:min-h-9 (44px/36px), matching 4 pre-existing reorder/reset Button controls |
| Responsive <=767px | 44px checkbox row and reorder buttons wrap without squeezing |
| Responsive >=768px | 36px compact chooser controls from md |
| States / permission invariants | cannot hide last visible column, disabled boundaries, reset/show-all callbacks unchanged |

**Source grep proof:** blob `7cfa66d36cf3`, 57 lines; raw `<button>/<input>/<select>/<textarea>/<details>/<table>` tags **0**; inline 6-digit hex literals **0**; Link opens **0**; Button opens/closes **4/4**; explicit `sortKind` **0**, `sortValue` **0**; `md:` tokens **5**, `sm:` **0**; relevant source lines **19,39,42,49,52**.

### 6. `src/components/placements/recruiter-result-review-grid.tsx` — Recruiter result mobile summary card metric

| Comparison | Exact/reference value and evidence |
|---|---|
| Old LMS | old-lms-pages.md:6-7 compact cards/important statuses; E8 mobile fallback at 768 |
| New vNext | mobilePrimaryKeys includes score beside applicant, outcome and status; number/date sort remains explicit only on score/waitlist; Review row retains 44px phone/36px md |
| Responsive <=767px | authorized percentage score visible in summary, not buried in overflow |
| Responsive >=768px | Quartz columns unchanged; local storage key still employer/drive scoped |
| States / permission invariants | read-only summary; no release or edit action created |

**Source grep proof:** blob `5da0d0dfeca4`, 46 lines; raw `<button>/<input>/<select>/<textarea>/<details>/<table>` tags **0**; inline 6-digit hex literals **0**; Link opens **1**; Button opens/closes **0/0**; explicit `sortKind` **2**, `sortValue` **2**; `md:` tokens **1**, `sm:` **0**; relevant source lines **26,28,38**.

### 7. `src/components/hr/hr-job-offers-grid.tsx` — Recruiter offer phone summary

| Comparison | Exact/reference value and evidence |
|---|---|
| Old LMS | old-lms-pages.md:6 compact card details, E8 768px breakpoint; offer value appears in source column model |
| New vNext | mobilePrimaryKeys now exposes CTC (LPA) with candidate/type/status/reply-by; CTC numeric sortValue unchanged |
| Responsive <=767px | CTC remains in primary card projection under 768px |
| Responsive >=768px | Quartz seven-column original display unmodified |
| States / permission invariants | read-only company-shared offer rows; no extra fetch or mutable actions |

**Source grep proof:** blob `760d89e79f1e`, 39 lines; raw `<button>/<input>/<select>/<textarea>/<details>/<table>` tags **0**; inline 6-digit hex literals **0**; Link opens **0**; Button opens/closes **0/0**; explicit `sortKind` **1**, `sortValue` **1**; `md:` tokens **0**, `sm:` **0**; relevant source lines **24,36**.

### 8. `src/components/hr/hr-round-results-grid.tsx` — Recruiter round outcomes summary

| Comparison | Exact/reference value and evidence |
|---|---|
| Old LMS | old-lms-pages.md:6 compact row/card; E8 mobile primary fields and numeric/date sort contract |
| New vNext | mobilePrimaryKeys includes numeric score and waitlist rank with candidate/outcome/status; both numeric sorts unchanged |
| Responsive <=767px | score and waitlist no longer hidden from concise result card |
| Responsive >=768px | full columns and rows are unchanged from 768px |
| States / permission invariants | null/not-recorded numbers still handled by common grid; no extra permissions |

**Source grep proof:** blob `8f773c10b973`, 35 lines; raw `<button>/<input>/<select>/<textarea>/<details>/<table>` tags **0**; inline 6-digit hex literals **0**; Link opens **0**; Button opens/closes **0/0**; explicit `sortKind` **2**, `sortValue` **2**; `md:` tokens **0**, `sm:` **0**; relevant source lines **21,23,32**.

### 9. `src/components/hr/hr-job-selection-grid.tsx` — Pre-issue selection summary

| Comparison | Exact/reference value and evidence |
|---|---|
| Old LMS | old-lms-pages.md:6 row data with key value; E8 mobile card switch at 768 |
| New vNext | mobilePrimaryKeys includes CTC alongside candidate, role and status; CTC numeric sortValue unchanged |
| Responsive <=767px | CTC visible in first-card summary without expanding |
| Responsive >=768px | existing sortable Quartz CTC and status columns untouched |
| States / permission invariants | read-only, no HR approval or release controls created |

**Source grep proof:** blob `66b3f3d28425`, 33 lines; raw `<button>/<input>/<select>/<textarea>/<details>/<table>` tags **0**; inline 6-digit hex literals **0**; Link opens **0**; Button opens/closes **0/0**; explicit `sortKind` **1**, `sortValue` **1**; `md:` tokens **0**, `sm:` **0**; relevant source lines **20,30**.

### 10. `src/components/tpo/tpo-company-memory-drive-grid.tsx` — TPO company historical drives and chronological labels

| Comparison | Exact/reference value and evidence |
|---|---|
| Old LMS | E8 only number/date sort; old-lms-pages.md:6 white compact rows; owner IST for timestamp display |
| New vNext | year/date display guards invalid timestamps as 'Not recorded', 2 date sortValue callbacks return timestamp or null, 1 applied numeric sortValue retains count |
| Responsive <=767px | company drilldown card still uses TpoGrid fallback and safe date labels |
| Responsive >=768px | Quartz sorts dates by instants rather than formatted IST year/date |
| States / permission invariants | invalid date cannot crash page or leak broadened data; column/local export scope preserved |

**Source grep proof:** blob `bb1d689a6cb7`, 78 lines; raw `<button>/<input>/<select>/<textarea>/<details>/<table>` tags **0**; inline 6-digit hex literals **0**; Link opens **0**; Button opens/closes **0/0**; explicit `sortKind` **3**, `sortValue` **3**; `md:` tokens **0**, `sm:` **0**; relevant source lines **19,25,32,33,35**.

### 11. `src/components/tpo/tpo-audit-grid.tsx` — TPO audit filters, event time and TSV clipboard

| Comparison | Exact/reference value and evidence |
|---|---|
| Old LMS | components___form.scss:117-143 input 10px radius, 14px/20px; old-lms-pages.md:5 search/filter toolbar; E8 numeric/date sorting |
| New vNext | removed custom rounded/padding overrides on 2 Inputs + 1 Select to use shared field chrome; guarded IST event date sortValue; common formula-safe grid clipboard sanitizer |
| Responsive <=767px | fields retain min 44px from shared Input/Select; audit cards from TpoGrid before 768px |
| Responsive >=768px | legacy border/field focus and 36px default from shared controls at md; chronological column sortable |
| States / permission invariants | invalid date displays 'Not recorded'; selection/filters/reset and copy failure notice intact |

**Source grep proof:** blob `a090f847d53e`, 95 lines; raw `<button>/<input>/<select>/<textarea>/<details>/<table>` tags **0**; inline 6-digit hex literals **0**; Link opens **2**; Button opens/closes **2/2**; explicit `sortKind` **1**, `sortValue` **1**; `md:` tokens **3**, `sm:` **0**; relevant source lines **10,21,38,43,44,54**.

### 12. `src/components/tpo/tpo-spreadsheet-grid.tsx` — TPO mobile fallback header and column-width controls

| Comparison | Exact/reference value and evidence |
|---|---|
| Old LMS | legacy-styles/components___common.scss:831-837,858-860 headers white with neutral-400 text; antddesign.scss:1081-1100 phone 44px controls |
| New vNext | fallback header uses --lms-white, --lms-neutral-400; sortable label and narrow/widen buttons explicit min-h-11 md:min-h-9; width controls min-w-11 md:min-w-9 |
| Responsive <=767px | header hidden by md-only table while cards retain 44px action controls, 48px selection checkbox and details disclosure |
| Responsive >=768px | table header white/neutral-400, 36px sort/narrow/widen tools; 48px pinned selection preserved |
| States / permission invariants | numeric/date-only sorts, width bounds 100..500, pin toggles, indeterminate selection remain |

**Source grep proof:** blob `f881a6122aab`, 237 lines; raw `<button>/<input>/<select>/<textarea>/<details>/<table>` tags **0**; inline 6-digit hex literals **0**; Link opens **0**; Button opens/closes **8/8**; explicit `sortKind` **0**, `sortValue` **0**; `md:` tokens **9**, `sm:` **0**; relevant source lines **187,190,210,212,215**.

### 13. `src/modules/placements/tpo-grid-model.ts` — Legacy CSV safe table data

| Comparison | Exact/reference value and evidence |
|---|---|
| Old LMS | old-lms-pages.md:5-6 Export on existing authorized page; E8 server-safe clipboard/export restriction |
| New vNext | csvSafeGridCell normalizes ASCII C0, DEL, Unicode line/paragraph separators U+2028/U+2029 to spaces then guards =,+,-,@ formulas and quotes RFC CSV cells |
| Responsive <=767px | pure serializer, no viewport-dependent DOM; identical output in phone fallback and desktop GridWorkspace |
| Responsive >=768px | same server-authorized column/row boundaries; no CSS changes |
| States / permission invariants | preserves quoting and header/data order; prevents multiline injection and formula leaders |

**Source grep proof:** blob `3ddc7e04be35`, 80 lines; raw `<button>/<input>/<select>/<textarea>/<details>/<table>` tags **0**; inline 6-digit hex literals **0**; Link opens **0**; Button opens/closes **0/0**; explicit `sortKind` **0**, `sortValue` **0**; `md:` tokens **0**, `sm:` **0**; relevant source lines **67,69**.

### 14. `src/components/tpo/grid/grid-export.ts` — Legacy TSV clipboard safe output

| Comparison | Exact/reference value and evidence |
|---|---|
| Old LMS | E8 TSV clipboard requirement, no unauthorized row broadened; old-lms-pages.md:5 Export/Columns |
| New vNext | safeGridClipboardCell now removes ASCII controls + U+2028/U+2029 paragraph separators before formula neutralization; common gridClipboardTsv keeps tab separator and CRLF line endings |
| Responsive <=767px | pure serializer used by fallback clipboard actions |
| Responsive >=768px | same normalizer used by native Quartz and GridWorkspace clipboard; no layout difference |
| States / permission invariants | number 0 retained, null -> empty, dangerous formula prefix escaped, selected row projection unchanged |

**Source grep proof:** blob `09894128e4e4`, 19 lines; raw `<button>/<input>/<select>/<textarea>/<details>/<table>` tags **0**; inline 6-digit hex literals **0**; Link opens **0**; Button opens/closes **0/0**; explicit `sortKind` **0**, `sortValue` **0**; `md:` tokens **0**, `sm:` **0**; relevant source lines **4,5,14,16**.

### Full-file grep reproduction commands (not executed)

```sh
grep -nE '<(button|input|select|textarea|details|table)([[:space:]>])|#[[:xdigit:]]{6}|<Button|</Button>|<Link|sortKind:|sortValue:|min-h-11|md:' src/components/{hr,placements,tpo}/**/*grid*.tsx
grep -nE 'mobilePrimaryKeys|safeGridClipboardCell|Number.isFinite|<thead|text-link|sm:min-h-8|md:min-h-8' src/components/ui/needs-doing-chips.tsx src/components/tpo/tpo-spreadsheet-grid.tsx src/components/tpo/tpo-audit-grid.tsx src/modules/placements/tpo-grid-model.ts src/components/tpo/grid/grid-export.ts
```

**STRICT TICK RULE:** E1 table category, E4 chips/status and E8 native/HR spreadsheets remain [ ] globally. These fifteen source files have source-backed value comparisons and responsive contracts, **not browser-proven pixel parity**. Exact legacy TpoGrid source/AG Grid dependency and per-state measured screenshots remain unresolved.

**Next exact source file:** `src/components/tpo/grid/grid-sort.ts` — reconcile null ordering, float parsing and fallback/native comparator direction against legacy numerical/date grid sorting.


### 2026-10-20 [chat-14] native/fallback whitespace-null comparator parity

Two additional completed files (bringing this batch to **16 E8 source files**, plus the shared E4 needs-doing chip):

| File | Legacy state/value | Current authored comparison | Source grep / responsive proof |
|---|---|---|---|
| `src/components/tpo/grid/grid-sort.ts` | E8 old sheet numeric/date-only sorting, missing/empty stays last, stable row order | `:18` now considers whitespace-only strings absent, like `""`, null and undefined; sortValue still used and number/date only sorts | GitHub full-file read: 34 lines, 1 trimmed-empty guard, 0 raw JSX/inline hex. Pure fallback comparator: same phone and desktop where fallback applies; no browser proof |
| `src/components/tpo/grid/tpo-grid.tsx` | E8 native Quartz should sort identically to fallback, including whitespace/invalid numbers and no blank-first regression in descending order | `:49-64` comparator now treats whitespace-only string as null; prior `descending` compensates AG Grid reverse so null remains last in both directions; sortValue still read for formatted date/number | GitHub full-file read: 279 lines; 1 trimmed-empty guard, 2 Button open/close, 0 raw button/inline six-digit hex, `md:` twice. Native grid hidden below 768px; fallback above already guards whitespace. No compilation/viewport comparison |

Reproducible source grep (NOT executed):
```sh
grep -nE 'value\.trim\(\)|sortKind|sortValue|descending|av===null|bv===null' src/components/tpo/grid/grid-sort.ts src/components/tpo/grid/tpo-grid.tsx
```

Legacy context: `docs/design/ui-clone-checklist.md:57` specifies only numeric/date sorts and E8 Quartz parity; `docs/design/old-lms-shell.css:23,73` gives mobile/desktop 767/768 boundary. No source claim of exact old grid comparator when the legacy TpoGrid JSX is unavailable. **E8 stays unticked**; runtime empty/ascending/descending screenshots and AG Grid dependency remain open.

**Next exact file:** `src/components/tpo/grid/grid-selection.ts` — static review of Shift/Ctrl authorization and phone-checkbox consistency, then browser test handoff.


## 2026-10-20 [chat-14] fifteen-file parity batch — E8 selection/export

**Method:** All modifications committed only on chatgpt/chat-14-b. Value comparisons use docs/design/old-lms-shell.css:23,73 (phone <=767px, desktop >=768px), legacy-styles/components___antddesign.scss:1081-1100 (phone 44px targets), docs/design/ui-clone-checklist.md:E8 (Quartz grid, 48px pinned selection). File-level grep results are computed from complete GitHub-fetched source, not command execution; no browser/TS/CI test was run.

### `src/components/tpo/grid/grid-selection.ts` — Authorized Shift-range anchor

| Legacy / state | Implemented source comparison |
|---|---|
| Exact legacy requirement | Legacy E8 requires filtered selected/visible authorized IDs and Ctrl/Shift multi-select; 48px pinned row checkbox |
| Updated source | New line 26 rejects a Shift anchor absent from allowedIds; line 58 rejects revoked checkbox anchor; no mutation to row IDs or scope |
| Phone/tablet/wide | Pure selector shared by phone fallback and desktop Quartz. All rows remain keyed by authorized IDs; no viewport styling added. |
| Active/disabled/error/empty | Permission change drops stale anchor, keeps still-authorized out-of-filter selections on Ctrl/Meta; checked/unchecked ranges exclude disallowed IDs. |

**Whole-file grep-equivalent:** SHA `3efd7d956bc35b96e9ad2338a69b9c56dcb17127`, 67 lines; 0 inline hex=0; raw HTML controls=0; Button pairs=0/0; FilterChip pairs=0/0; md: tokens=0; sm: tokens=0.

### `src/components/tpo/grid/grid-workspace.tsx` — Off-filter selected rows and TSV/CSV export

| Legacy / state | Implemented source comparison |
|---|---|
| Exact legacy requirement | Old LMS toolbar Search / Filters / Views / Columns / Export; E8 exports only selected authorized visible rows |
| Updated source | New line 93 uses selection?.selected.length to distinguish a hidden selection from no selection. Hidden selections now produce zero data rows, not all visible unrelated rows. |
| Phone/tablet/wide | Phone action labels already use min-h-11 (44px), desktop md:min-h-9 (36px); this data-scope fix is identical for both viewport branches. |
| Active/disabled/error/empty | Loading/clipboard blocked notices retained, CSV builder and API export source untouched; no widening when no selected IDs remain in view. |

**Whole-file grep-equivalent:** SHA `30bf4a69cfaf24292bf676b7a2836fd0c2460ada`, 267 lines; 0 inline hex=0; raw HTML controls=0; Button pairs=14/14; FilterChip pairs=1/1; md: tokens=1; sm: tokens=0.

### `src/components/tpo/tpo-spreadsheet-grid.tsx` — Fallback Select all filtered row scope

| Legacy / state | Implemented source comparison |
|---|---|
| Exact legacy requirement | Legacy E8 header/phone selection must affect filtered visible authorized rows; checkbox pinned at 48px; old shell mobile <=767px |
| Updated source | Select-all now derives unique current visibleRowIds filtered against allowedIds; allowed IDs declared before use. Other page/hidden selected IDs remain untouched when checkbox toggles. |
| Phone/tablet/wide | Below 768px the md:hidden card uses 44px labels and indeterminate checkbox; from 768px the md:block table's sticky 48px selection header reflects the same visible set. |
| Active/disabled/error/empty | Shift/Ctrl still delegated to shared grid-selection; legacy 100..500px resizing, 44/36px sort controls, null/empty and unauthorized rows unchanged. |

**Whole-file grep-equivalent:** SHA `ad167dbd7b8e5272971e432874ea74467e19d7b6`, 238 lines; 0 inline hex=0; raw HTML controls=0; Button pairs=8/8; FilterChip pairs=1/1; md: tokens=9; sm: tokens=0.

### Source grep reproduction (not executed in this turn)
```sh
grep -nE 'allowedIds|anchorIndex|const anchor|gridSelectionClick|gridSelectionCheckbox' src/components/tpo/grid/grid-selection.ts
grep -nE 'selectedPage|exportedRows|gridClipboardTsv|scroll:false|<Button|<FilterChip' src/components/tpo/grid/grid-workspace.tsx
grep -nE 'visibleRowIds|allowedIds|selectAllIds|fullySelected|partlySelected|indeterminate|width:48|md:hidden|md:block' src/components/tpo/tpo-spreadsheet-grid.tsx
```

**STRICT TICK:** E8 remains [ ] because no real old-vNext screenshots at phone/tablet/wide, measured hover/focus/pressed states, or compiled AG Grid (dependencies undeclared in package.json) are available. This closes only the three named source-file fixes. Do not claim pixel-level visual parity.
