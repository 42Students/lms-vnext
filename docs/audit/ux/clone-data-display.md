# Data display UI clone: E1–E5 — chat-14

Checked against `docs/design/ui-clone-checklist.md` (WORK STYLE and STRICT TICK RULE) and the OWNER GOAL/NORTH STAR. Scope is the *skin* of existing pages, not their contents, routes, sorting, authorization or form behavior. Source of truth: `docs/design/legacy-styles/` and `docs/design/old-lms-pages.md`. This is an **in-progress audit**, not a declaration of pixel parity.

## STRICT TICK RULE — results

- [ ] **E1 Tables** (missing: legacy header/background and hover parity, sorting/filter/selection/expand coverage, exhaustive source grep, complete phone/tablet comparison and state/property proof)
- [ ] **E2 Pagination** (missing: all instances consolidated, page-size behavior at phone breakpoint and full legacy selected/disabled/focus/hover value matrix)
- [ ] **E3 Tabs** (missing: all hand-rolled route strips migrated, `>=1600px` 40px gap, legacy 0.2s underline animation and exact focus/disabled states)
- [ ] **E4 Badges, statuses, tags and needs-doing chips** (missing: legacy `.ln-status` padding/radius/min-width/weight match; hand-rolled `rounded-full` pills remain; all tone/interactive states not proven)
- [ ] **E5 Accordions, steppers, timelines, description/list rows** (missing: shared Disclosure styling does not match some legacy `.ant-collapse` contexts; many native `details` remain; all responsive/keyboard states and all source usages not exhaustively inspected)

**No boxes are ticked** because one missing value, coverage proof, responsive proof, or behavior proof blocks a tick. No app execution, CI, runtime visual side-by-side check, or locally executed ripgrep was performed.

## Value comparison: E1 tables

| Property / state | Legacy source and value | vNext branch source and value | Result |
|---|---|---|---|
| Body cell separator | `legacy-styles/components___common.scss:700-708` — `1px solid $neutral-200` | `src/components/ui/table.tsx:16` and `data-table.tsx:108` — `1px solid var(--lms-canvas-border)` | **Unproven token equality** |
| Final row divider | `components___common.scss:711-713` — none | `table.tsx:16`, `data-table.tsx:95` — last-row divider removed on desktop | Matched selector intent; mobile variant needs proof |
| Body cell vertical padding | `components___common.scss:724-727` — 12px | `table.tsx:16`, `data-table.tsx:108` — 12px on desktop | **CSS cascade mismatch**: `src/app/globals.css:569-574` still declares 10px for data-table |
| Body background | `components___common.scss:708` — white | `table.tsx:14` — shared surface; `data-table.tsx:103` — surface mobile | Verify surface token computed value |
| Header text | `components___common.scss:831-836` — `$neutral-400` | `table.tsx:16`, `data-table.tsx:99` — `var(--lms-neutral-400)`, 12px/600 | Token mapping needs proof |
| Header background | `components___common.scss:858-860` — white in `.ln-table` | `data-table.tsx:97-99`; `globals.css:323,559-562` — `#fafbfc` | **Mismatch for `.ln-table`** |
| Row hover | `components___common.scss:851-855` — no body-cell fill override | `table.tsx:16`; `data-table.tsx:103` — teal `--lms-table-hover` | **Mismatch in override context**; legacy variants require individual audit |
| Zebra | `components___common.scss:810-815` — specific exam table odd-row `#f8fbff` | `table.tsx:16` striped mode odd row `--lms-table-header` | **Mismatch on zebra variant** |
| Phone/tablet overflow | `components___antddesign.scss:75-80` — horizontal scroll / max 100% | `table.tsx:15`, `data-table.tsx:94` — ScrollCue; mobile data-table cards at `data-table.tsx:95-108` | Mechanism exists; visual parity unverified |
| Sticky header / checkbox / filter / actions / expansion / loading | Legacy site and page anatomy: `old-lms-pages.md:5-7`, `components___common.scss:700-874` | `data-table.tsx:17-31,97-119` and page-owned cell renderers | **Incomplete**; no universal shared sort/filter/checkbox/expand API proven |
| Toolbar / selection strip | `old-lms-pages.md:5-6` — search, Filters, Views, Columns, Export; N items in view + Act on all | `src/components/ui/list-toolbar.tsx:46-57` — slots/callbacks, count and bulk slot | Presence verified; page-by-page use incomplete |
| Empty state | Legacy page: blank list state (`old-lms-pages.md:6`) | `src/components/ui/data-table.tsx:38` — caller-supplied empty JSX | State API preserved; styling not fully matched |

## Value comparison: E2 pagination

| Property / state | Legacy source and value | vNext source and value | Result |
|---|---|---|---|
| Active color/border | `components___antddesign.scss:233-240` — `$clrThird` | `pagination.tsx:67-69` — `var(--lms-primary)`; `globals.css:576-579` | Token equality unproven |
| Phone min hit target | `components___antddesign.scss:242-255` — 44px square | `pagination.tsx:52` — min-height/min-width 44px | Value matches |
| Phone radius | `components___antddesign.scss:256` — 8px | `pagination.tsx:52` — 8px below md | Value matches |
| Phone line height | `components___antddesign.scss:255` — 42px | `pagination.tsx:52` — text 14px line-height 20px centered flex | Rendering differs; compare computed state |
| Phone numbers | `components___antddesign.scss:272-280` — active only, no jump links | `pagination.tsx:60-80` — nonactive hidden at md threshold | Logical behavior matches for phone, tablet boundary unverified |
| Page-size popup phone | `components___antddesign.scss:268-270` — options hidden on phones | `page-size-select.tsx:15-20` — native select visible | **Mismatch**; preserve necessary page filtering semantics until owner confirms |
| Disabled / focus | Legacy Ant design state not fully specified | `pagination.tsx:54-84` — disabled span, focus outline, URL-safe links | Incomplete value comparison |
| GET form integration | Legacy page selectors | `page-size-select.tsx:5-20` — native select with untouched name/defaultValue; migrated examples | Preserved semantics, runtime check outstanding |

## Value comparison: E3 tabs

| Property / state | Legacy source and value | vNext source and value | Result |
|---|---|---|---|
| Font | `components___common.scss:365-374` — 13px / 600 / 16px | `tabs.tsx:83,90` — 13px / 600 / 16px | Matches |
| Inactive text | `components___common.scss:374` — `$neutral-400` | `tabs.tsx:84,91` — `--lms-neutral-400` | Token equality unproven |
| Active text | `components___common.scss:403-410` — `$clrThird` | `tabs.tsx:84,91` — `--lms-primary-text` | Token equality unproven |
| Underline | `components___common.scss:381-392` — centered pseudo-element, height 3px | `tabs.tsx:83,90` — 3px bottom border | **Mechanism differs** |
| Underline motion | `components___common.scss:388-390` — width/opacity `0.2s ease-in-out` | `tabs.tsx:83` — `transition-colors duration-[var(--lms-motion-fast)]` | **Mismatch** |
| Tab spacing | `components___common.scss:465-475` — 20px, 40px at 1600+ | `tabs.tsx:71,88`; `globals.css:325` — 20px everywhere | **Mismatch >=1600px** |
| Overflow | `components___common.scss:444-451` — horizontal scrolling, hidden bar | `tabs.tsx:71,88` — ScrollCue horizontal | Mechanism exists, bar presentation unverified |
| Keyboard, selection, disabled | Legacy Ant tabs behaviors unverified | `tabs.tsx:37-94` — Home/End/arrows, disabled, aria-current/aria-selected | Must compare state-by-state |

## Value comparison: E4 pills/chips

| Property / state | Legacy source and value | vNext source and value | Result |
|---|---|---|---|
| Legacy neutral status background | `components___common.scss:995-996` — `#fafbfc` | `badge.tsx:5-12`; `status-badge.tsx:6-13` — neutral-100 | **Mismatch/unproven** |
| Vertical/horizontal padding | `components___common.scss:997` — 2px / 15px | `badge.tsx:17`, `status-badge.tsx:17` — 1px / var(--lms-space-2)=8px | **Mismatch** |
| Radius | `components___common.scss:998` — 6px | `badge.tsx:17`, `status-badge.tsx:17` — pill radius token | **Mismatch** |
| Font and min width | `components___common.scss:1002-1005` — 12px / 700 / min-width 90px | `status-badge.tsx:17` — xs/600/no 90px minimum | **Mismatch** |
| Interactive tag phone target | `components___antddesign.scss:1092-1100` — 44px for clickable tags | `needs-doing-chips.tsx:34` — min-height 32px | **Mismatch below 768px** |
| Needs-doing quick filter | `old-lms-pages.md:3` — compact counts and quick filters | `needs-doing-chips.tsx:34-55` — links or callback filters, counts | Structural match; exact colors/states pending |

## Value comparison: E5 disclosure, stepper, timelines and list rows

| Property / state | Legacy source and value | vNext source and value | Result |
|---|---|---|---|
| Collapse header padding (legacy small-section variant) | `components___common.scss:1323-1325` — 5px | `disclosure.tsx:14` — 8px/8px plus min-height44 | **Mismatch in compact variant** |
| Disclosure focus, hover, open | No exhaustive SCSS state matrix yet | `disclosure.tsx:12-18` — details summary, focus outline, hover, rotate | Not fully proven |
| Timeline grouping | `old-lms-pages.md:3,9` — hairline separated list rows | `timeline.tsx:5-16` — semantic ol/li border strips | Layout reference only; exact pixel measurements pending |
| List row composition | `old-lms-pages.md:3,9` — icon, title, detail, pill, chevron | `list-row.tsx:15-26` — icon/title/detail/pill/action slots | Slots match anatomy; chevron optional via action, responsive comparison pending |
| Step progression | Legacy old-page academic setup navigation; see `old-lms-pages.md` | `step-indicator.tsx:11-21` — accessible `Step n of m` label | Value proof incomplete |

## Coverage discovery: commands and counts

Search commands required by the owner (not executed in a local repo in this connector-only turn):

```sh
grep -rnE '<table([[:space:]]|>)' src --include='*.tsx'
grep -rnE 'role=["\x27]tablist["\x27]' src --include='*.tsx'
grep -rnE 'rounded-full' src --include='*.tsx'
grep -rnE '<details([[:space:]]|>)' src --include='*.tsx'
grep -rnE 'border-b-\[3px\]' src --include='*.tsx'
grep -rnE '<(Pagination|Tabs|Table|DataTable|Badge|StatusBadge|Disclosure)' src --include='*.tsx'
```

**Actual repo-wide grep counts:** not available / not performed. Therefore **no item qualifies for a coverage tick**. GitHub code search for `<table` on *main* returned 7 relevant source paths, 2 shared primitives and 5 potential other paths. Of these, College Admin attendance and TPO spreadsheet were confirmed raw and migrated; Faculty attendance and TPO students page/requests already used `<Table>`. This does **not** prove zero on the updated branch. Indexed code-search candidate counts, also not authoritative branch grep: `role="tablist"` 9 search hits (some tests/non-TSX), `rounded-full` 59 hits, `<details` 87 hits, `border-b-[3px]` 23 hits. `src` has 2,327 TSX paths in the fetched branch tree; every source instance was not loaded or inspected. Exemptions require individual behavior/rationale (e.g. decorative avatar circles are not status chips; native `details` may implement a menu instead of an accordion).

## Migration ledger (committed to chatgpt/chat-14-b)

- Raw tables: `src/components/attendance/admin-attendance-workspace.tsx` and `src/components/tpo/tpo-spreadsheet-grid.tsx` moved to shared Table and its single ScrollCue wrapper.
- Tab strips: learner project, TPO batch, learner course, college drive, Super Admin drive, Tracker admin, College Admin group, faculty course.
- Pagination/selector: PeoplePagination -> Pagination; PageSizeSelect added and applied to mentor reviews, platform people and TPO audit.
- Mentor lane filter pills -> NeedsDoingChips; task/backlog details -> Disclosure; release/sprint timeline filters -> NeedsDoingChips/StatusBadge; releases -> Timeline/TimelineEntry.
- College setup rows -> ListRow; setup sections -> Disclosure; Super Admin/College academic step labels -> StepIndicator.
- Shared Table and DataTable desktop cell padding 12px; Pagination min 44px/radius8 phone; inactive Tab color neutral-400. Shared CSS cascade and breakpoint differences above remain open.

## Known exclusions, risks and next sweep

- **No claim of side-by-side verification**. The orchestrator owns section J.
- The `src/app/globals.css` table and tab overrides may supersede JSX utility classes; a computed-style audit is required. Global stylesheet is owned by a separate lane and was not modified here.
- Do not force decorative `rounded-full` circles, actual popover menus, or dense day-grid data cells into badge/disclosure components without preserving their semantics.
- Source-only change control: no application execution, tests, CI, or deployment were performed; open/close tags were compared in changed snippets, but compilation is unverified.
- Suggested next scan: `src/components/placements/learner-placements-tabs.tsx` (preserve touch-swipe listener while moving to Tabs), then `src/components/projects/project-workspace-readiness.tsx`, then `src/app/(authenticated)/hr/drives/page.tsx` and the remaining indexed `border-b-[3px]` source paths. Resolve each legacy mismatch and re-run the repository-wide greps before ticking E1–E5.

## Bounded 2026-10-19 continuation — E1–E5 (40-commit turn including E8)

- **E3:** Recruiter notifications inline bottom-border toggle became two genuine route-based `Tabs` links (All notifications/Unread only); query college and search stay encoded in both links. Wide-display gap now `40px` at `min-width:1600px` (src/components/ui/tabs.tsx:71), matching `docs/design/legacy-styles/components___common.scss:473-475`. Underline remains a border rather than legacy animated `::after`; **E3 remains unticked**.
- **E4:** Interactive quick-filter chip minimum height is `44px` on phones and returns to `32px` at sm (src/components/ui/needs-doing-chips.tsx:41), compared with legacy interactive tags `components___antddesign.scss:1092-1100`. Non-interactive label-only chips keep compact styling; neutral badge/pill padding, weight and radius mismatches remain. **E4 unticked**.
- **E5:** Native content disclosure instances migrated to shared `Disclosure` while preserving children and runtime text counts: 4 project-workspace, 2 faculty-course-list, 3 learner-course-list, 1 each TPO student bulk note, TPO bulk action review, request column chooser, college quiz answers, archived organizations, faculty learner risk, faculty assessment course counts, college academic filters, college structure filters, learner submitted quiz count, tracker browser context and TPO grid mobile details. Examples: src/components/courses/faculty-course-list.tsx:67, src/app/(authenticated)/admin/organizations/page.tsx:99, src/components/academics/college-academic-directory.tsx:80. Native `details` retained intentionally where it implements a dropdown/menu, nested responsive row-action control, or customized expandable chart rather than a plain content disclosure. **E5 unticked**.
- **E1/E2:** TPO request sort and column reset use shared `Select`/`Button`; legacy-form styling and raw-usage exhaustive coverage are still open. Spreadsheet fallback remains a shared `Table`; selection checkbox is 48px and pinned data columns are offset past it (src/components/tpo/tpo-spreadsheet-grid.tsx:62).
- **Static source inspection only:** 19 changed TSX files were fetched back from GitHub after updates. `<Disclosure>` opening/closing counts were equal in each inspected file; all new JSX count labels were checked for expression preservation and corresponding closing tags. This is **not** a repository-wide grep, a TypeScript compile, CI, or runtime comparison. Existing raw button/select and native-details instances outside the inspected scope remain unverified.
- **Owner strict tick status:** E1–E5 all **[ ]**. Do not turn source-level incremental replacements into completion claims without the full legacy value matrix, responsive proof, exhaustive grep counts and regression verification. Next targeted audit: `src/components/courses/faculty-course-home-signals.tsx` remaining expandable learner-risk bucket, then `src/components/placements/learner-jobs-browse.tsx` raw filter pills and pagination.

## Codemod inventory (chat-14, 2026-10-19)

- Pattern: raw semantic `<table>` outside `src/components/ui` becomes shared `<Table>` only when not nested in a scroll/table context; explicit noninteractive `data-status` / `data-chip` rounded status spans with recognizable tone become `<Badge>`. Stateful hand-rolled `role="tablist"` strips and pagination navigation are **reported for manual review** (not blindly rewritten). Expected files: `src/**/*.tsx` excluding `src/components/ui/**`. Dry-run: `node scripts/codemods/chat14-tables-tabs.cjs`; orchestrator application: `node scripts/codemods/chat14-tables-tabs.cjs --apply`. The script uses the TypeScript TSX AST, changes both opening/closing tags, checks output parse diagnostics, and reports files/patterns for subsequent regression and responsive review. Not executed by this lane. E1–E5 remain unchecked pending required value/coverage proofs.
- E8 blocker (verified on `main`, 2026-10-19): `package.json` does **not** list `ag-grid-community` or `ag-grid-react`; `docs/design/legacy-grid/TpoGrid.jsx.txt` is absent, whereas `src/components/tpo/grid/tpo-grid.tsx` is a shared-table fallback. The requested `next/dynamic` + native Quartz import cannot be strictly type-safe without those repository assets. Preserve authorized selection/export behavior and do not invent a passing native AG Grid migration; owner/orchestrator must restore those assets (do not edit package.json in this lane).

## chat-14 incremental source value proof (bounded turn, 2026-10-19)

These rows supersede the earlier **changed values only**; they do not close E1–E5, because full state matrices, repository-wide grep and phone/tablet render proofs remain outstanding.

| Scope/property | Legacy source | vNext value now | Proof status |
|---|---|---|---|
| E1 normal \`.ln-table\` header fill | \`docs/design/legacy-styles/components___common.scss:858-860\`, white | \`src/components/ui/table.tsx:16\`, \`--lms-white\` = white | Source value matched; striped/exam variant still open |
| E1 \`.ln-table\` row hover | \`components___common.scss:851-855\`, body cells reset to no hover fill on white base | \`table.tsx:16\`, white body cells on hover | Normal variant source intent matched; mixed zebra and global cascade open |
| E2 phone control hitbox until 767px | \`components___antddesign.scss:242-256\`, 44px and 8px radius | \`page-size-select.tsx:17\`, \`min-h-11 md:min-h-9\`; \`pagination.tsx:52\` 44px / 8px | Breakpoint now aligned; selector visibility and focus remain open |
| E3 active indicator height, position and motion | \`components___common.scss:381-390,403-410\`, centered 3px width/opacity transition 0.2s ease-in-out | \`src/components/ui/tabs.tsx:83-84,90-91\`, centered 3px \`::after\`, 200ms width/opacity easing, active full width | Source rule matched for active state; browser computed values not compared |
| E3 wide gap | \`components___common.scss:465-475\`, 20px default / 40px from 1600px | \`tabs.tsx:71,88\`, tokenized 20px / \`min-[1600px]:gap-[40px]\` | Source breakpoints matched |
| E4 neutral status fill/text | \`components___common.scss:995-1005\`, #fafbfc and #84828b | \`src/components/ui/status-badge.tsx:9\`, \`--lms-neutral-50\` (#fafbfc) and \`--lms-neutral-400\` (#a9a7ae) | **Text shade still differs**; do not tick |
| E4 status radius, pad, min-width, weight | \`components___common.scss:996-1005\`, 6px / 2px 15px / 90px / 12px 700 | \`status-badge.tsx:17\`, 6px / 2px 15px / 90px / 12px 700 | These discrete source values match; custom variants still open |
| E8 spreadsheet client rendering | Legacy reference \`legacy-grid/TpoGrid.jsx.txt\` absent; E8 requests dynamic \`ssr:false\` | \`tpo-students-spreadsheet.tsx:29-32\`; \`tpo-applications-spreadsheet.tsx:17-20\`; both typed and lazy client-only | Done only for dynamic boundary, **not AG Grid Quartz** |
| E8 shared list toolbar | \`old-lms-pages.md:5-6\`, one Columns/Copy workflow | \`tpo-spreadsheet-grid.tsx:23,30,172-173\`; \`tpo-students-spreadsheet.tsx:226\`; \`tpo-applications-spreadsheet.tsx:60\` | Duplicate inline chooser/Copy button suppressed when workspace handles it; keyboard TSV remains |

Updated explicit work queue:
- [ ] Verify the E4 neutral status text shade (#84828b) against existing token options; do not add hard-coded hex outside globals.
- [ ] Check E1 zebra/stripes, header/body CSS cascade, mobile layout and scroll; locate all \`<table>\` JSX before tick.
- [ ] Run the committed codemod **dry-run first** and inspect candidate list; orchestrator owns \`--apply\`; manually migrate stateful tabs and pagination.
- [ ] E8 native Quartz implementation after the missing AG Grid packages and legacy-grid sources are restored; keep fallback, authorized rows and server export intact.
- [ ] Verify keyboard/focus/disabled and runtime responsive behavior before changing any checkboxes to [x].

**Repository-wide grep counts:** not performed. **Compilation/app/CI:** not run. All edited TSX files were fetched again from the branch; the inspected changes showed matching opening/closing tags, no stray quote before className, and no newline-before-as cast in the edited files. This is static inspection, not typecheck.

- E1 follow-up: `src/components/ui/data-table.tsx:97-103` now uses white desktop heading/cell-hover paint, matching the `.ln-table` normal variant (`docs/design/legacy-styles/components___common.scss:851-860`). Mobile card layout and `sm` breakpoint remain intentionally unchanged pending the responsive comparison; E1 **remains unticked**. No runtime verification.

## chat-14 source migration follow-up (2026-10-19, 21:35 IST)

### AG Grid E8 — source delivered, **not build/visual parity**

- \`src/components/tpo/grid/tpo-grid.tsx\` is now a native AG Grid Quartz implementation and was pushed **directly to main** as [chat-14] commits \`1308e7c\` and \`bda9e98\`. It retains \`TpoSpreadsheetGridProps<Row>\` so existing TPO and HR consumers can wire without changing their authorized row contracts.
- Present in source: \`AllCommunityModule\` registration, Quartz styling, 48px pinned selection column, current-filter select-all, Shift/Ctrl row selection, safe clipboard TSV, numeric/date-only sorting, data-free versioned layout persistence per \`storageKey\`, row action callbacks, keyboard copy, and mobile fallback. TPO students and applications use \`next/dynamic({ssr:false})\` at their call sites.
- **Blocking dependency:** \`package.json\` and \`package-lock.json\` on main still do not declare \`ag-grid-community\` or \`ag-grid-react\` (despite the original task saying they are installed). \`docs/design/legacy-grid/TpoGrid.jsx.txt\` is also absent. Per the original prohibition, this lane did **not** alter either package manifest. The native import cannot be claimed TypeScript/build clean until those dependencies are restored. **E8 remains [ ]**.
- AG Grid 36.2 reference: official React cell renderer and column-state documentation; static implementation only, no app/test/CI execution. Existing exports stay with the authorized page/workspace.

### Source edits completed in this continuation

| File | Specific source-level work | Strict parity |
|---|---|---|
| \`src/components/tpo/grid/tpo-grid.tsx\` | Replaced fallback engine with AG Grid Quartz, published to main | Open: dependencies, legacy source and runtime |
| \`src/components/ui/filter-chip.tsx\` | Added shared keyboard/aria-pressed toggle chip around Button | Open: full state/responsive comparison |
| \`scripts/codemods/chat14-tables-tabs.cjs\` | Expanded TypeScript-AST candidates across all portals: safe status-pill spans, pressed rounded buttons, table wrappers; reports stateful tabs and pagination for review | Open: \`--apply\` was not executed and no full grep count available |
| \`src/components/tpo/tpo-grid-filter-panel.tsx\` | Active filter removal chips to FilterChip | Source migration done; E4 globally open |
| \`src/components/tpo/grid/grid-workspace.tsx\` | Active filter removal chips to FilterChip | Source migration done; E4 globally open |
| \`src/components/placements/learner-career-calendar.tsx\` | Event-kind filter chips to FilterChip | Other view controls remain |
| \`src/app/(authenticated)/tpo/placements/lifecycle/page.tsx\` | Drive status/count tabs to shared Tabs | Source migration done |
| \`src/app/(authenticated)/admin/inbound-mail/page.tsx\` | Inbound mail route tabs and counts to shared Tabs | Source migration done |
| \`src/app/(authenticated)/admin/people/directory/page.tsx\` | People directory route tabs to shared Tabs | Source migration done |
| \`src/components/placements/tpo-drive-workspace-nav.tsx\` | Primary drive route tabs to shared Tabs; retained mobile Select and More dropdown | Source migration done |
| \`src/components/placements/learner-save-drive-button.tsx\` | Raw pressed bookmark toggle to shared Button | Source migration done |
| \`src/components/placements/tpo-request-decision-control.tsx\` | Rejection-reason toggles to shared FilterChip | Source migration done |

### Still open: do not tick E1–E5 globally

- [ ] Run \`node scripts/codemods/chat14-tables-tabs.cjs\` in the repository, inspect the dry-run candidate list, then execute \`--apply\` through the orchestrator and hand-review skipped dynamic \`className\` cases. The script excludes \`src/components/ui\`.
- [ ] Migrate remaining \`aria-pressed\` category controls, \`border-b-2\` route/tab strips and semantically real \`rounded-full\` pills across all portals; avoid changing avatars, spinners, notification dots, or progress bars into badges. Source-index searches found additional examples in recruiter leads, teacher contacts, learner career view controls, and several admin/placement pages. Code-search results are not exhaustive counts.
- [ ] Compare all visual properties/states and phone/tablet responses with legacy SCSS file:line pairs and computed-style parity report; no browser side-by-side test was done. Keep E1–E5 unchecked until STRICT TICK RULE proofs are complete.
- [ ] Native AG Grid compile and smoke validation after the missing dependencies/legacy-grid reference are restored; verify save/restore and selection in the browser before marking E8 done.

No CI, app execution, or bulk codemod execution was run. Files manually edited this turn were fetched back for structural re-reading and stray-character inspection; that inspection is **not** TypeScript typechecking.

Additional source migrations: `src/components/tpo/recruiter-leads-workspace.tsx` now uses shared `FilterChip` for its attention/Unassigned counts; `src/components/placements/learner-career-calendar.tsx` also uses shared `Button` for all calendar view toggles. `scripts/codemods/chat14-tables-tabs.cjs` now discovers files containing only raw `<button>` or `<Button>` presses and recognizes `bg-primary`/`bg-muted` tone candidates. Strict category checkboxes remain unchanged; these are source-file completions, not verified pixel parity.

More source-file migrations committed on this lane branch: `src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-audit/page.tsx` (company-share tabs), `src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx` (application pipeline tabs with counts), and `src/app/(authenticated)/teacher/report/assignment/[contentId]/submissions/page.tsx` (grading, publication, order tabs) now use shared `Tabs`. These were fetched back from GitHub; all replaced tab groups use self-closing `<Tabs />`, no altered unmatched JSX closing tags, and no stray quoted className or newline-before-as forms were observed. This still does not establish exhaustive all-portal coverage or runtime parity, so E3 stays unticked.

## chat-14 next-file batch — source-level completion ledger (2026-10-19)

**This is a per-file source inspection, not category closure or a browser comparison.** Each edited file was fetched back from the branch in full. The counts below are from applying the exact regular expressions to those fetched TSX strings (GitHub API), not from executing shell `grep`, running the application, or running CI. To independently rerun the equivalent source grep in the repository:

```sh
grep -nE '<button([[:space:]]|>)|<table([[:space:]]|>)|border-b-2|rounded-full|aria-pressed=|<details([[:space:]]|>)' PATH
grep -nE '<(Pagination|Tabs|FilterChip|SegmentedControl)([[:space:]]|>)|</FilterChip>' PATH
```

### File-level pattern proof and exemptions

| File (relative to `src/`) | Shared migration | Raw button | `border-b-2` | `rounded-full` | Raw `details` | Shared chip pairs | Exemption or source result |
|---|---|---:|---:|---:|---:|---:|---|
| `components/placements/learner-jobs-browse.tsx` | Pagination line 289, SegmentedControl lines 104/156; all 4 remaining raw action buttons converted to Button | 0 | 0 | 0 | 1 | 0 | `details` line 273 retains **dynamic open state** tied to filter availability, a nonstandard content disclosure; replacing with generic Disclosure would lose its controlled and named summary behavior |
| `components/tpo/tpo-student-quick-panel.tsx` | Controlled shared Tabs line 106; preserves asynchronous `chooseTab`, request waiting wording, drawer rows and detail caching | 0 | 0 | 0 | 0 | 0 | One Tabs strip, no hand-rolled underline; note external panel semantics need runtime a11y verification |
| `components/tpo/tpo-batch-inline-decision.tsx` | FilterChip lines 64/68 for six presets and Other | 0 | 0 | 0 | 0 | 2/2 | Preserves disabled, reason selection, guarded save and audit confirmation |
| `components/placements/tpo-drive-cancel-form.tsx` | FilterChip line 92 for cancellation reasons | 0 | 0 | 0 | 0 | 1/1 | Preserves reason selection, pending, reviewed acknowledgment and controlled textarea |
| `components/placements/learner-career-rounds-workspace.tsx` | FilterChip lines 307/325/330/335/340/350, including dynamic assessment counts | 0 | 0 | 0 | 0 | 6/6 | Preserves existing schedule and due-bucket URL state, selected toggles and multiple filter groups |
| `components/academics/learner-class-schedule.tsx` | FilterChip lines 544/599 for upcoming-only and course selection | 1 | 0 | 2 | 0 | 2/2 | The remaining native `button` at line 634 is a **calendar date cell**, not a filter chip; both remaining rounded circles are event dots and a highlighted calendar date, not status pills |
| `components/courses/faculty-course-home-signals.tsx` (inspected, unchanged) | Existing StatusBadge, Disclosure, MetricBar and StatTile are shared | 0 | 0 | 0 | 1 | 0 | Custom grade-bucket `details` at line 232 has a permanent three-column label/bar/count summary; generic string-title Disclosure cannot preserve it. Written **semantic exemption**, not an E5 tick |

`FilterChip` counts above mean source occurrences, including one map that renders many actual choices. In every modified file, the number of opening and closing `<FilterChip>` tags is identical. File reads found **zero** suspect stray quote-before-`className` forms or newline-before-`as` casts. These are bounded static checks, not compilation or runtime proof.

### Legacy value comparison for this batch

| Property/state | Legacy source, exact rule | Updated vNext source, exact rule | Assessment |
|---|---|---|---|
| Interactive chip phone touch target | `legacy-styles/components___antddesign.scss:1090-1102`: tagged buttons at 44px minimum up to 767px; 12px horizontal padding | `src/components/ui/filter-chip.tsx:28-33`: `min-h-11` (44px) until `md` 768px; `px-[15px]` | **Height/breakpoint match; horizontal padding differs 3px**. Requires owner decision about legacy clickable-tag subtype |
| Status label geometry | `components___common.scss:994-1005`: background #fafbfc, radius 6px, padding 2px 15px, min width 90px, 12px/700 | `filter-chip.tsx:28-33`: radius 6px, 2px/15px, 12px/700; interactive width based on content | **Shared status-like geometry**; do not conflate interactive chips with 90px status badge |
| Selected chip indication | `components___common.scss:389-410`: primary teal active foreground for tabbed selection; interactive tag state depends on Ant variant | `filter-chip.tsx:33-34`: `aria-pressed` plus primary border/subtle fill/primary text | State preserved; **exact Ant tag computed paint unverified** |
| Chip hover/focus/disabled | `components___antddesign.scss:1073-1102`: 44px target; Ant defaults govern focus/disabled/hover | `filter-chip.tsx:29-34` + `button.tsx`: hover brightness, visible outline, disabled pointer/opacity | Accessible behavior present; complete legacy value matrix **open** |
| Active and inactive tabs | `components___common.scss:365-410`: 13px, weight 600, line 16px; neutral inactive and teal active | `src/components/ui/tabs.tsx:83-91`: same font size, weight, line height; tokenized inactive and active paint | Static values mostly mapped; token equality not exhaustively proven |
| Tab underline and motion | `components___common.scss:381-392`: centered 3px pseudo-element, 0.2s ease-in-out width/opacity | `tabs.tsx:83-91`: same centered 3px pseudo-element, 200ms ease-in-out | Source rule matches |
| Tab spacing/overflow | `components___common.scss:444-475`: scrollable overflow with hidden scrollbar, 20px gap and 40px at 1600px | `tabs.tsx:71,88`: ScrollCue horizontal, 20px token gap, 40px at 1600px | Gap matches; hidden-scrollbar computed paint unverified |
| Phone page buttons | `components___antddesign.scss:242-280`: 44px minimum square, 8px radius, only active numeric visible, prev/next visible | `src/components/ui/pagination.tsx:52-84`: 44px square until md, 8px radius, non-active links hidden until md, prev/next always present | Height/radius and visibility match; 42px line-height Ant mechanism differs |
| Page URL preservation | Legacy page filters and paging persist together | `learner-jobs-browse.tsx:289-294`: `learnerDriveQueryWithChanges(params.toString(),{page:String(target)})` | Preserves all other query keys per model; browser navigation untested |
| Dynamic disclosure summary | `old-lms-pages.md:5-7`: expanded rows and in-row explanatory content remain visible | `learner-jobs-browse.tsx:273-283` and `faculty-course-home-signals.tsx:232-250` | Deliberate native disclosure exemptions to retain page content and the always-visible metric bar |

### Responsive source proof and regression limits

- **Phone through 767px:** filter-chip minimum height 44px (`filter-chip.tsx:28`), page controls 44px (`pagination.tsx:52`); schedule month view remains selected on phone via `matchMedia("(max-width: 767px)")` in `learner-class-schedule.tsx`; native calendar dates retain their minimum-height 64px and 96px at `sm` rather than being converted into chip controls.
- **Tablet 768–1599px:** chips compact at `md:min-h-8`; shared Tabs keep 20px gap and horizontal scrolling; pager numeric links appear at `md`.
- **Wide 1600px+:** shared Tabs use 40px gap (`tabs.tsx:71,88`) matching legacy SCSS.
- **Behavior carried forward:** TPO panel still awaits detail on relevant tab selection and still keys cache to membership; batch decisions and cancellation still guard async mutation; learner pagination retains every URL filter; calendar date buttons and both native rich disclosures retain their original behavior.
- **No regression limitation:** no browser, TypeScript, CI, interaction automation, exact computed-style audit or full repo grep run under the requested dev-only/no-CI constraint. The strict category checkboxes E1–E5 and E8 stay **[ ]**; the completed list here records **source-file migration**, not finished pixel parity.

**Remaining work queue:** other dynamic tabs and pills across portals; E4 computed-state and padding equality; scroll/cascade and mobile disclosure comparisons; exhaustive repo-wide greps; AG Grid dependency and visual check. Exact next candidate: `src/components/placements/learner-applications-browse.tsx` for any remaining custom tab/filter state, then `src/components/placements/tpo-drive-cancel-form.tsx` UI capture in the later browser verification phase.

## 2026-10-19 replacement-lane source migration — bounded continuation

Starting point was `origin/chatgpt/chat-14-b` (`f6e1af3`), which was 1,409 commits behind `origin/main` and two commits ahead. Rebased by replaying the branch-only 48 audit lines onto the inspected `main` head (`12ee0a5`), with lease-protected branch update; main was **not** modified. Existing `scripts/codemods/chat14-tables-tabs.cjs` is already committed and must be run by the orchestrator (dry-run first); this lane did **not** run it.

### Complete source-level conversions in this continuation

| File | Old local pattern | Shared component/behavior preserved | Source grep / static responsive proof |
|---|---|---|---|
| `src/components/admin/super-admin-placement-oversight-nav.tsx` | Two custom `<Link>` nav groups with `border-b-2`, no route-active underline | Two shared `Tabs` navigation strips retaining all primary and disclosure destinations, now matching exact and nested paths via `usePathname` | In this file: hand-rolled `border-b-2` occurrences **0**. `Tabs` uses horizontal ScrollCue; legacy tab underline 3px / 200ms; 20px gap until 1600px, 40px afterward (`src/components/ui/tabs.tsx:71-91`; legacy `components___common.scss:365-410,443-475`) |
| `src/components/tpo/recruiter-lead-detail-workspace.tsx` | Raw pressed activity-type and call-outcome `<button>` groups with variable color classes | `FilterChip` retains both group labels, all four activity types/five call outcomes, `aria-pressed`, state reset and handlers | **2** source `<FilterChip>` pairs in map expressions, opening and closing tags matched; shared phone touch 44px through 767px, compact at 768px (`filter-chip.tsx:28-34`; legacy `components___antddesign.scss:1092-1100`); file's unrelated raw buttons still open |
| `src/components/courses/learner-course-list.tsx` | `Continue learning only` pressed primary/secondary Button | Shared `FilterChip` retaining pressed state and `PAGE_SIZE` reset | **1** balanced FilterChip pair; chip geometry shared, but exact per-state computed legacy paint unverified |
| `src/components/verification/VerificationFilterPanel.tsx` | Three large custom waiting-age shortcut Buttons | Shared `FilterChip` for Today, This week, Over a week, preserving IST date presets, applied query and validation | **3** balanced FilterChip pairs; no selection claim because each shortcut applies an immediate action |
| `src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/page.tsx` | Hand-rolled offer status `border-b-2` tabs with counts and hand-rolled Previous/Next pager | Shared `Tabs` with count property and `Pagination`; all existing `status`, search and joining/kind/expiry/pay query filters retained in generated hrefs; server authorization and rows untouched | Hand-rolled `border-b-2` occurrences **0**, one shared Tabs navigation, one shared Pagination; phone pager 44px, hides non-active numbers, retains Previous/Next (`pagination.tsx:52-84`, legacy `components___antddesign.scss:242-280`) |

The five committed source files were fetched back from GitHub after writes. JSX chips in the three files have equal opening/closing tag counts; the navigation and pager replacements use self-closing `<Tabs />`/`<Pagination />`. No app, browser, CI, TypeScript compiler, or local codemod was run. Source-level inspection alone is insufficient to tick a category.

### Next exact files and documented exemptions

- [ ] `src/components/placements/placement-calendar-workspace.tsx`: linked event-type pills with colored dot labels require a shared chip/link representation preserving each href, indicator dot and active route/filter state; do not swap them for non-link FilterChip buttons.
- [ ] `src/components/placements/learner-applications-browse.tsx`: already uses shared Tabs and SegmentedControl; its custom pager uses `router.push(...,{scroll:false})`. Shared Pagination's ordinary links may change scroll behavior, so **defer** until that semantic can be retained. This is a file-specific navigation exemption, not an E2 tick.
- [ ] `src/components/tpo/recruiter-lead-detail-workspace.tsx`: remaining dynamic raw controls require a deliberate Button/control codemod or manual behavior review, not blind JSX rewriting.
- [ ] Native AG Grid Quartz E8: component and client-only TPO call sites exist on main, but the inspected main `package.json` still has no `ag-grid-community` or `ag-grid-react` entries; `legacy-grid/TpoGrid.jsx.txt` was not available in the inspected tree. With the user prohibition on manifest changes and app/CI execution, do not claim build/visual parity.

**STRICT TICK RULE:** E1, E2, E3, E4, E5 and E8 remain **unchecked**. This batch proves narrow component replacement and static responsive rules, not an exhaustive repo-wide grep or browser/state/value equivalence.

### Replacement-lane linked-chip and disclosure follow-up

| File | Exact change | Static proof / limitation |
|---|---|---|
| `src/components/ui/filter-chip.tsx` | Added `FilterChipLink` that uses a validated internal `href`, native Next Link, `aria-current` and shared semantic tone/selection classes; retains rich indicator children | Safe route link, focus-visible ring, min-height 44px through 767px and 32px from md; desktop status-chip width tracks content. Changed interactive-chip phone horizontal padding from 15px to **12px**, per `legacy-styles/components___antddesign.scss:1092-1100`; from md uses 15px status-chip spacing per `components___common.scss:995-1005`. Full actual pixel/hover computed comparison remains open. |
| `src/components/placements/placement-calendar-workspace.tsx` | Converted company-name link pills, All events pill and map of event-kind quick-filter links to `FilterChipLink` | **3** balanced JSX link-chip pairs in source (one map creates multiple rendered chips). Each retains its `calendarHref`, selected state and accessible name; event-type dot (red/yellow/green/teal) and counts preserved. Previous raw `rounded-full` link-pill classes in these three places removed. Other `rounded-full` circles are genuine colored indicators and intentionally remain. |
| `src/components/courses/learner-course-list.tsx` | Converted Semester Details, All Courses and Credits Breakdown native `details` elements to shared `Disclosure` | **3** balanced `<Disclosure>` pairs, **0** native `<details>` in this file. Kept each title, scrollable list, recorded-credit totals and conditional rendering; native keyboard disclosure behavior remains in the shared component. Browser CSS/keyboard verification still required. |

Legacy clickable-chip state matrix is not fully proven beyond the explicitly matched mobile padding/min-height rule. Do not tick E4 or E5. Prior audit instruction to inspect `placement-calendar-workspace.tsx` is complete at the source-migration level; exact next file: `src/components/tpo/recruiter-lead-detail-workspace.tsx` (remaining dynamic variable-class controls), then `src/components/placements/learner-applications-browse.tsx` pager semantics review. Source commits are already on the lane branch, not on main. `E1–E5` and `E8` remain [ ] pending strict coverage, visual/behavior and missing dependency/source checks. No app/code execution or CI was performed.

## Replacement lane — second source-file batch, 2026-10-19

This continuation merged the latest inspected main commit (0744985) into the lane branch while preserving lane-only work and audit history. Main was not written. The evidence below is **GitHub-fetched source regex inspection only** (not locally executed shell grep, a compiler run, or browser verification).

### Completed source-file conversions / static coverage

| File | Work completed; existing behavior retained | Full-file source grep-equivalent results |
|---|---|---|
| src/components/tpo/recruiter-lead-detail-workspace.tsx | 18 raw buttons converted to shared Button, 3 selects to Select, 6 inputs to Input, 4 textareas to Textarea. Overdue label to StatusBadge; activity and call-outcome groups remain 2 shared FilterChip pairs. Saved, disabled, form submission, invite/copy, follow-up and navigation behavior preserved; anchor/link button geometry now tokenized. Obsolete input/primary style constants removed. | Raw JSX button/input/select/textarea/details **0/0/0/0/0**; Button **18 opens/18 closes**, Select **3/3**, FilterChip **2/2**, StatusBadge **1/1**; Input **6 self-closing**, Textarea **4 self-closing**; border-b-2 **0**, rounded-full **0**. |
| src/components/placements/learner-applications-browse.tsx | Hand-built Previous/Next replaced by shared Pagination; status/view search/segment filters and authorized paged data unchanged. Uses the existing sanitized updateLearnerApplicationUrl for page links with scroll=false, restoring previous router.push scroll behavior. | One self-closing Pagination; old Application results pages nav **0**; raw button/input/select/textarea/details **0**; existing Button **11 opens/11 closes**. |
| src/components/verification/VerificationFilterPanel.tsx | More-filters native details/summary replaced with Disclosure, keeping three date preset chips, all filter controls and apply callbacks. | Native details/summary **0/0**; Disclosure **1/1**; FilterChip **3/3**; Button **2/2**. |
| src/components/courses/college-lesson-visibility-controls.tsx | Bulk lesson visibility details/summary replaced with Disclosure; selection, failed-row retry, update guards, server behavior and scrolling list retained. | Native details/summary **0/0**; Disclosure **1/1**; Button **4/4**. |
| src/components/projects/learner-project-mobile-filters.tsx | Mobile Search & filters accordion moved to Disclosure with a ReactNode title that retains the active-count badge; GET form, search, selects, Apply and Clear are unchanged. | Native details/summary **0/0**; Disclosure **1/1**; Button **1/1**; Select **5/5**; parent sm:hidden preserved. |
| src/components/ui/pagination.tsx | Optional scroll property defaults true and is forwarded to all five Link render variants; existing callers are unchanged. | scroll={scroll} **5** source instances; raw buttons/details **0**. |
| src/components/ui/disclosure.tsx | ReactNode title replaces string-only type without changing defaultOpen, semantic details, summary markup, keyboard behavior or existing strings. | One native details element intentionally **inside** the shared Disclosure primitive, no extra bespoke page instance. |

Reproduce the source grep in the repository (shell commands **not executed by this lane**):

    grep -nE '<(button|input|select|textarea|details|summary)([[:space:]>])' src/components/tpo/recruiter-lead-detail-workspace.tsx src/components/placements/learner-applications-browse.tsx src/components/verification/VerificationFilterPanel.tsx src/components/courses/college-lesson-visibility-controls.tsx src/components/projects/learner-project-mobile-filters.tsx
    grep -nE '<(Button|FilterChip|Disclosure|Pagination)([[:space:]>])|</(Button|FilterChip|Disclosure)>|scroll=\{false\}' src/components/tpo/recruiter-lead-detail-workspace.tsx src/components/placements/learner-applications-browse.tsx src/components/verification/VerificationFilterPanel.tsx src/components/courses/college-lesson-visibility-controls.tsx src/components/projects/learner-project-mobile-filters.tsx

### Exact legacy-to-vNext property/state comparisons

| Property / state | Legacy source, value | Current source, value | Result |
|---|---|---|---|
| E2 active page border | legacy-styles/components___antddesign.scss:233-239 — $clrThird | ui/pagination.tsx:66-69 — var(--lms-primary) | Token equality not fully proven |
| E2 phone page target/radius | components___antddesign.scss:242-256 — 44×44px, 8px radius through 767px | ui/pagination.tsx:54 — min-h-11, min-w-11, rounded-[8px] until md (768px) | Geometry and breakpoint match |
| E2 phone numeric line-height | components___antddesign.scss:255 — 42px | ui/pagination.tsx:54 — flex center with leading-5 (20px) | **Mismatch**, leave E2 open |
| E2 visible page numbers | components___antddesign.scss:272-280 — active only, hide jump controls on phone | ui/pagination.tsx:60-82 — inactive numbers/boundaries hidden below md | Source rule matches |
| E2 URL and scroll preservation | Previously learner-applications-browse.tsx:356-368 — updateQuery uses router.push with scroll:false | learner-applications-browse.tsx:357-361 uses updateLearnerApplicationUrl + scroll=false; ui/pagination.tsx:59-84 forwards scroll to all Link variants | Static behavior matched, browser not checked |
| E4 neutral status shape | components___common.scss:995-1005 — radius 6px, padding 2/15px, min-width 90px, font 12px/700, fill #fafbfc, ink #84828b | ui/status-badge.tsx:17 — same geometry and font; fill --lms-neutral-50, ink --lms-neutral-400 | Color token equality pending; neutral ink previously differed |
| E4 clickable chip phone target/padding | components___antddesign.scss:1092-1100 — min-height 44px, 12px horizontal padding through 767px | ui/filter-chip.tsx:27-36 — min-h-11 and px-[12px] until md, desktop px-[15px] | Exact phone size/padding match; tone states still open |
| E5 disclosure keyboard | Legacy native details/summary and Ant collapse; Enter/Space expected | ui/disclosure.tsx:11-19 retains native details/summary | Semantics retained; browser not checked |
| E5 accordion phone touch | components___antddesign.scss:1081-1100 — 44px clickable-element floor, not a specific Ant collapse metric | ui/disclosure.tsx:14 — min-h-11 (44px); learner-project-mobile-filters.tsx:23 retains 48px original summary minimum | Accessibility floor met; **full collapse value table missing** |
| E5 focus/hover/motion | Legacy Ant collapse computed states not available in inspected SCSS | ui/disclosure.tsx:14-17 — 2px primary focus ring, subtle hover, motion-reduce | **Unproven**, leave E5 open |

### Responsive source proof and regression limits

- **Phone up to 767px:** Pagination link hitboxes are 44px with 8px radius, only active number/Previous/Next appear. Recruiter controls use min-h-11 (44px); FilterChip uses 44px min height. Mobile-only project filters remain under sm:hidden with their original 48px summary.
- **Tablet 768–1599px:** Pagination changes to 36px controls and numeric links reappear; recruiter action controls use md:min-h-9 (36px). Project mobile section remains hidden at sm and above. Shared Tabs gap stays 20px and horizontally scrollable.
- **Wide at least 1600px:** Tabs keep the legacy 40px gap; this batch does not change authorized tables/rows/page layout.
- **Failure/behavior states:** recruiter submit/disable, invite, follow-ups, validation and messages unchanged; learner withdrawal and URL debounce untouched; Disclosure forms and selectors unchanged. JSX open/close pairs were re-fetched and checked statically.
- **Verification limits:** browser computed styles, keyboard interactions, TypeScript strict typecheck, CI, application runtime and repository-wide grep were **not** run. Source migration does not imply pixel parity.

### Strict category tick status and next queue

- [ ] E1 tables — exhaustive value/state/coverage proof still missing.
- [ ] E2 pagination — legacy 42px line-height differs; all-page coverage and runtime proof missing.
- [ ] E3 tabs — exhaustive route/state coverage still open.
- [ ] E4 statuses/chips — neutral status ink/tone/focus exactness and all-page coverage open.
- [ ] E5 accordions/steppers — exact Ant collapse computed values and all-instance census open.
- [ ] E8 AG Grid — both TPO callers use next/dynamic with ssr:false and native Quartz source exists, but the checked package.json still omits ag-grid-community and ag-grid-react; user prohibits package.json edits. No build/visual proof.

**Next exact file:** src/components/placements/tpo-drive-cancel-form.tsx for a source-state audit and any remaining display patterns; then the broader hand-rolled disclosure and tab inventory. No unchecked category was prematurely ticked.


## chat-14 E5 accordion census, source batch (2026-10-19)

Source of truth: `docs/design/legacy-styles/components___common.scss`, `components___antddesign.scss`, `old-lms-pages.md`. This turn started by fast-forwarding the lane to inspected `origin/main` because the lane had no unmerged commits. The established script `scripts/codemods/chat14-tables-tabs.cjs` remains available; not executed by this lane (owner-directed dev-only/no app or CI execution).

### File-level completed work queue (source migration, not global E5 tick)

For each entry the complete modified TSX file was fetched again after its GitHub commit. The literal JSX-pattern counters count shared-opening / shared-closing and remaining raw `<details` respectively:

| Completed | File | Shared Disclosure openings/closings | Raw details | Preserved content, state and mobile behavior |
|---|---|---:|---:|---|
| [x] | `src/components/placements/placement-drive-workspace.tsx` | 1 / 1 | 0 | Dynamic Set/Extend deadline heading and form; no route/permission changes |
| [x] | `src/components/courses/quiz-attempt-control.tsx` | 1 / 1 | 0 | Question anchor links; phone/tablet `lg:hidden` collapse versus desktop full list unchanged |
| [x] | `src/components/tpo/tpo-students-spreadsheet.tsx` | 1 / 1 | 0 | Bulk Add a note, filtered page selection limit, checkboxes and note editor unchanged |
| [x] | `src/components/projects/learner-project-board-search.tsx` | 1 / 1 | 0 | Rich title with active-filter count; GET filters and links intact |
| [x] | `src/components/courses/faculty-course-home-signals.tsx` | 2 / 2 | 0 | Grade-bucket three-column summary including MetricBar and count; other existing Disclosure retained |
| [x] | `src/components/courses/learner-course-workspace.tsx` | 1 / 1 | 1 documented exemption | Simple mobile Jump to lesson migrated; focused lesson's dynamic `open`, badges, description and lesson anchor remain native (do not alter focus/expanded behavior without browser parity proof) |
| [x] | `src/app/(authenticated)/admin/features/page.tsx` | 1 / 1 | 0 | Per-college Change module rule editor, localized in-row action preserved |
| [x] | `src/app/(authenticated)/tpo/students/[membershipId]/history/page.tsx` | 1 / 1 | 0 | Recorded round result versions and count remain visible in summary |
| [x] | `src/app/(authenticated)/mentor/projects/[projectId]/page.tsx` | 1 / 1 | 0 | Additional project tools and all mentor deep links retained |
| [x] | `src/app/(authenticated)/college/contacts/page.tsx` | 1 / 1 | 0 | Advanced filters `defaultOpen={activeCollegeContactFilterCount(filter)>0}` and full filter form kept |
| [x] | `src/app/(authenticated)/tpo/students/page.tsx` | 3 / 3 | 0 | Profile strength, marks/passing year, More placement outcomes; all filters and report rows retained |
| [x] | `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx` | 1 / 1 | 0 | Per-bucket metric bar, count, learner attempts retained in a rich Disclosure title |
| [x] | `src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx` | 1 / 1 | 0 | Same three-column graphic plus score/submission details retained |

All displayed pairs above were counted from whole-file GitHub reads, not merely snippet search. Another native rich lesson accordion remains in `src/components/courses/faculty-course-workspace.tsx`; its selected-lesson open state and semantic `aria-label` need a controlled migration plan. Neither rich lesson accordion should be blindly converted by the codemod. The E5 repository-wide shell grep is **not yet executed**, so no zero-instances claim.

Reproduce the file-level grep and structural count:

```sh
grep -nE '<details([[:space:]>])|<summary([[:space:]>])' src/components/{placements/placement-drive-workspace,courses/quiz-attempt-control,tpo/tpo-students-spreadsheet,projects/learner-project-board-search,courses/faculty-course-home-signals,courses/learner-course-workspace}.tsx
grep -nE '<Disclosure([[:space:]>])|</Disclosure>' src/components/{placements/placement-drive-workspace,courses/quiz-attempt-control,tpo/tpo-students-spreadsheet,projects/learner-project-board-search,courses/faculty-course-home-signals,courses/learner-course-workspace}.tsx
grep -rnE '<details([[:space:]>])|<summary([[:space:]>])' src --include='*.tsx'
```

### E1/E2/E4 high-leverage source corrections and value proof

| Property/state | Legacy exact rule (file:line) | Updated vNext (file:line) | Assessment |
|---|---|---|---|
| E1 exam-table zebra odd-row | `docs/design/legacy-styles/components___common.scss:810-815` — `#f8fbff` in cells and row | `src/components/ui/table.tsx:16` — optional `striped` odd-row fill `#f8fbff` | **Value matches** optional variant; no claim of generic zebra runtime/cascade equality |
| E1 normal body/header background | `components___common.scss:700-708,851-860` — white table body/header and hover reset | `src/components/ui/table.tsx:16` — white header and hovered cells | Source paint mapped; global canvas CSS and table variant cascade not browser-tested |
| E4 neutral status fill | `components___common.scss:995-996` — `#fafbfc` | `src/components/ui/status-badge.tsx:9`; `src/app/globals.css:38` — `var(--lms-neutral-50) = #fafbfc` | **Exact token match** |
| E4 neutral status ink | `components___common.scss:1005` — `#84828b` | `src/components/ui/status-badge.tsx:9` — `text-[#84828b]` | **Exact color match**, correcting previous `--lms-neutral-400 = #a9a7ae` mismatch |
| E4 status dimensions | `components___common.scss:997-1004` — pad 2/15px, radius 6px, 12px/700, min-width 90px | `src/components/ui/status-badge.tsx:17` — same values; min-height 22px derived from line-height18 + vertical padding | Static match; empty/loading not applicable to passive badge |
| E2 phone pager line-height | `components___antddesign.scss:250-256` — 42px line-height in 44px control | `src/components/ui/pagination.tsx:54` — `leading-[42px] md:leading-5` in 44px hitbox | **Exact mobile line-height and target match**; desktop remains 20px leading |
| E2 phone pager radius and density | `components___antddesign.scss:242-280` — 8px corners, active-only number, next/prev visible | `pagination.tsx:54-84` — 8px until 767px, hides other page numbers, retains next/prev | Static match; actual responsive rendering not performed |

### Responsive proof by source and remaining strict-tick blockers

- Phone under 768px: Disclosure `summary` supplies minimum 44px target, semantic native keyboard Enter/Space and focus styling; quiz question jump collapses below `lg` (1024px); learner lesson index collapses only below `md` (768px); college filters, TPO roster bulk notes and score distributions remain wrap-safe in the existing page layout. StatusBadge keeps inline 90px minimum and wrapping.
- Tablet 768–1023px: learner mobile Jump-to-lesson hides at md; quiz mobile question links stay available until lg; standard Disclosure follows shared `min-h-11` summary geometry. Pagination becomes 36px at md with numeric links visible.
- Wide 1600px+: existing shared Tabs retains 40px gap; no alterations to page layout/authorized content; all changed disclosures keep their original surrounding grids/sections.
- Keyboard/focus/default/active: newly unified native details have native open/closed behavior and a shared 2px focus-visible primary outline; college Advanced filters starts open for existing active filters; other ordinary disclosures start closed. Counts and meta text are inside the focusable summary where present.
- Pending verification: no application or CI was run, no TypeScript compiler/test invocation, no real phone/tablet/browser side-by-side, and no exhaustive repo-wide grep; user asked for dev-only source changes. **Do not tick E1–E5 or E8 globally** until full state/property matrix, coverage, responsive and runtime proofs meet STRICT TICK RULE. E8 still blocked by missing `ag-grid-community` and `ag-grid-react` manifest entries (do not modify `package.json`).

**Next exact file:** `src/components/courses/faculty-course-workspace.tsx` (rich selected-lesson accordion; preserve dynamic open and summary `aria-label`). Then `src/components/courses/learner-course-workspace.tsx` (rich focused-lesson accordion exemption) and remaining E2 action pagers such as `src/components/verification/CollegeVerificationPanel.tsx`.

### Rich lesson accordion continuation (chat-14, same bounded turn)

After the initial E5 file census, both previously documented rich-lesson exceptions were migrated **without discarding their explicit open condition, focus anchor, label, progress metadata or content**. This uses a backward-compatible extension to the shared `src/components/ui/disclosure.tsx`, not a generic text-only replacement.

| Completed file | Before | After / exact source static proof |
|---|---|---|
| [x] `src/components/courses/faculty-course-workspace.tsx` | 1 rich native details with `open={selectedLessonId?true:lessonIndex===0?true:undefined}`, accessible summary label, lesson description and item count | `<Disclosure>` **1 opening / 1 closing**, native `<details>` **0**; `defaultOpen={Boolean(selectedLessonId \|\| lessonIndex === 0)}`, exact lesson-count summary `summaryAriaLabel`, rich title fragment, original `min-h-11 sm:min-h-9` summary classes. Authoring controls unchanged |
| [x] `src/components/courses/learner-course-workspace.tsx` | 1 mobile jump disclosure and 1 rich lesson disclosure with `id=lesson-...`, focused-lesson/default-first open logic, badges and progress | `<Disclosure>` **2 openings / 2 closings**, native `<details>` **0**; retained `id={\`lesson-\${lesson.id}\`}`, focus expression, rich lesson summary contents, progress badges, expandable body and `group-open` arrow |
| [x] `src/components/ui/disclosure.tsx` | String/ReactNode titles, native details, defaultOpen and generic chevron | Added optional `id`, `summaryAriaLabel`, `summaryClassName`, `contentClassName`, and `preserveSummary`. Defaults unchanged for existing call sites. `preserveSummary` keeps rich summary layout/own arrow without a second indicator; native details still supplies Enter/Space and semantic open/closed state. Exactly **1** native details and **1** native summary intentionally remain *inside* this shared primitive |

**Responsive source comparison:** Faculty rich lesson summary retains minimum 44px through phones and 36px from `sm`, and its flex-wrap + badge position; learner rich summary retains 16px padding on phone and 20px from `md`, while the simpler mobile outline still uses `md:hidden`. Neither layout was redesigned. Source static inspection found no newline-before-`as` cast or extra `title={<>{{` sequence in these two files. These are source assertions, **not** a TS compiler or browser output.

**Earlier audit correction:** The neutral 50 token in `src/app/globals.css` is at approximately line 40 in the inspected source, not the previously recorded line 38; its literal value is confirmed `#fafbfc`. The matched legacy neutral status text color is now the literal `#84828b` inside `src/components/ui/status-badge.tsx` (allowed UI-component-local legacy value).

**Unresolved category status:** E1/E2/E3/E4/E5/E8 global checklist entries remain unticked: exhaustive repo-wide grep, full state-by-state legacy computed values, phone/tablet rendered snapshots, and runtime interaction/strict TS checks were not run. E8 has the preexisting undeclared AG Grid packages in the repository manifest. Individual files above can be marked source-migrated only.

**Next exact file after this batch:** `src/components/verification/CollegeVerificationPanel.tsx` (action-based pagination: preserve `navigate` selection-reset guard and page-size change; not safe to replace directly with href-only Pagination).

### Guarded E2 action pagination (chat-14, same bounded turn)

| Completed file | Legacy/client behavior and value mapping | GitHub source grep-equivalent proof |
|---|---|---|
| [x] `src/components/ui/action-pagination.tsx` (new E2 sibling) | A client-only button pager for list pages requiring local state cleanup before navigation. Shares `paginationWindow` and `normalizedPageCount` with the link-based Pagination without turning the server-safe link component into a client boundary. Phone: 44px square, 8px radius, 42px numeric line-height, active-only page number. Tablet/desktop: 36px controls, nonactive numbers visible. Disabled, focus-visible and current-page accessibility states included. | `min-h-11` ×1; `min-w-11` ×1; `rounded-[8px]` ×1; `leading-[42px]` ×1; `md:min-h-9` ×1; route-less `onPageChange` called only from genuine button click, never an effect. |
| [x] `src/components/verification/CollegeVerificationPanel.tsx` | Converted native Previous/Next ghost-buttons to one `ActionPagination` (not Link) so all page changes still go through guarded `navigate`, which clears selected/sequence/bulk feedback and then `router.push`. Sort and per-page Select inputs and showing-count text retained. `hasMore` remains the authoritative next-page condition; disabled while bulk mutation is in progress. | Shared `<ActionPagination>` **1 self-closing occurrence**, old `<nav aria-label="Verification pagination"` **0**, old standalone Previous/Next `<Button>` **0**; pageCount derived from current page plus one only when `hasMore`. |

Legacy E2 evidence: `docs/design/legacy-styles/components___antddesign.scss:242-280` (mobile 44×44, 8px corners, 42px line-height, only active page number and prev/next). Source implementation: `src/components/ui/action-pagination.tsx:27-52`; `src/components/verification/CollegeVerificationPanel.tsx:216-227`. All phone geometric values match statically, not by rendered screenshot. On larger screens shared Button may retain existing secondary hover/disabled treatment; Ant computed hover/cascade still requires later browser verification.

Reproduce the source-scoped grep (not run locally in this turn):

```sh
grep -nE '<ActionPagination|Previous page</Button>|Next page</Button>|pageCount=|hasMore=|onPageChange=' src/components/verification/CollegeVerificationPanel.tsx
grep -nE 'min-h-11|min-w-11|rounded-\[8px\]|leading-\[42px\]|md:min-h-9|onPageChange' src/components/ui/action-pagination.tsx
```

Strict E2 global checklist still **[ ]** pending all portal pagination, full state coverage and side-by-side responsive proof. E1/E3/E4/E5/E8 also remain **[ ]**. Next file after this source batch: `src/components/placements/report-interactive-table.tsx` — assess sort-pressed states and show-more versus actual pagination without changing authorized report rows.


## chat-14 replacement E1/E4/E5 continuation — sort states, chips and final simple disclosures

Baseline: chatgpt/chat-14-b was a clean ancestor of inspected origin/main 6807f03 at the start; the branch was fast-forwarded to main (main was never written). Work is exclusively committed/pushed to chatgpt/chat-14-b. No repository code, tests, typecheck, browser, app or CI were executed; all grep-equivalent counts below were obtained from full GitHub-fetched file text after each edit.

### E1 table sorting — value/state/coverage proof

| Property / state | Legacy exact source | Current vNext source | Result |
|---|---|---|---|
| Compact header, table hairline and white canvas | old-lms-pages.md:5-11: white canvas, hairlines, compact table with sort icons | src/components/ui/data-table.tsx:96-104: canvas-transparent table, sticky white header from sm, one-pixel bottom line via --lms-canvas-border (#e5e9f0, globals.css:39/339) | Static legacy-token match for hairline; exact sort icon graphic not yet proven |
| Sorted heading, ascending/descending | old-lms-pages.md:11 and legacy-styles/components___antddesign.scss: table sorter treatment | DataTableColumn.sortDirection optional at data-table.tsx:13; th aria-sort at :100; report-interactive-table.tsx:143 calculates ascending/descending/none from sort+descending | Accessible state correctly propagated, visual computed icon still open |
| Search / filters / columns / export toolbar | old-lms-pages.md:10-11 toolbar search, Filters, Views, Columns, Export | report-interactive-table.tsx:68-120 includes search, per-column filters, column selector, copy and CSV, reset; original views remain model-specific | Preserved behavior and current page content; not a claim of full global toolbar parity |
| Mobile table layout | old-lms-pages.md:11 table compact, WCAG touch target legacy-styles/components___antddesign.scss:1081-1100 | ui/data-table.tsx:92-142 existing card projection below sm; report sort choice Select and chip below sm (:121-136) | Source responsive behavior preserved; pixel snapshot pending |
| Report sort pressed chip | legacy-styles/components___antddesign.scss:1092-1100 role=button tag: min-height 44px and padding 0 12px on phone | report-interactive-table.tsx:131-134 uses FilterChip; ui/filter-chip.tsx:27-35: min-h-11, px-[12px], md:min-h-8, md:px-[15px] | Exact touch/padding rule matched; selected/focus computed states pending |

### E4 source-migrated choice chips — full-file JSX counts and behavior

| Completed source file | New FilterChip opening/closing pairs in fetched file | Raw native button tags | Handler/disabled/selected state still retained |
|---|---:|---:|---|
| src/components/tpo/tpo-custom-job-type-placed.tsx | 2 / 2 | 0 | Yes/No counts-as-placed PATCH flow, confirm prompt, version token, not-decided fallback, error; pressed value true/false; busy disable |
| src/components/tpo/tpo-team-follow-controls.tsx | 2 / 2 | 0 | Follow and Mute choices, ready/pending guards, state updates and API actions; aria-pressed state preserved |
| src/components/tpo/tpo-team-decision-toggle.tsx | 1 / 1 | 0 | Mark/unmark decision, optimistic expectedMarked payload, pending guard and error; aria-pressed preserved |
| src/components/tpo/recruiter-leads-workspace.tsx | 3 / 3 | 0 | Existing Needs doing chips remain; newly migrated active filter-clear chip keeps per-key updateFilter and active selected state |
| src/components/courses/assignment-submission-control.tsx | 3 / 3 | 0 | Written response / External Link / File or multipart combine; all allowed-method/submitting/mayWrite/mayLink/mayUpload guards and setSubmissionType callbacks preserved |
| src/components/placements/report-interactive-table.tsx | 1 / 1 | 0 | Ascending/descending toggle disabled without sort and aria-pressed preserved; the 7 other Button pairs and source sorting still present |
| src/components/ui/needs-doing-chips.tsx | 0 / 0 (uses one shared Button open/close) | 0 | Existing chip count/disabled/selected/href/no-inert-action behavior preserved; interactive onSelect uses keyboard Button |

Value table for these chips: legacy mobile tagged actions at components___antddesign.scss:1092-1100 are >=44px and horizontal padding 12px; shared FilterChip at src/components/ui/filter-chip.tsx:27-36 uses min-h-11 = 44px, px-[12px], md:min-h-8 = 32px and md:px-[15px]. Radius 6px, 12px bold, 18px line-height also match legacy .ln-status at components___common.scss:995-1005 for *badge geometry*, but interactive hover/active/backgrounds must be checked against legacy actual tagged-action colors before ticking E4. These replacements did not touch business logic, network writes, or row data.

### E5 final ordinary accordions — fetched-file structural evidence

| Completed file | Shared Disclosure opening/closing | Raw page-level details/summary | State and semantics preserved |
|---|---:|---:|---|
| src/components/placements/learner-jobs-browse.tsx | 1 / 1 | 0 / 0 | Not open to you summary count, role list and defaultOpen when availability filter is not-open |
| src/app/(authenticated)/hr/conversations/page.tsx | 1 / 1 | 0 / 0 | General placement cell message preview/history, reply form, full-conversation link, responsive summary touch |
| src/app/(authenticated)/tpo/batches/[batchId]/page.tsx | 1 / 1 | 0 / 0 | Undo last decision action, immutable audit consequence copy, original summary tooltip now passed as summaryTitle |
| src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx | 1 / 1 | 0 / 0 | Batch student exports region label now passed as ariaLabel; current filtered and unfiltered CSV hrefs unchanged |
| src/components/ui/disclosure.tsx | Shared primitive itself (not a caller) | 1 / 1 intentionally | Optional summaryTitle and details ariaLabel are backward-compatible; native details/summary keyboard, defaultOpen and previous rich title behavior remain |

### Responsive and exact source grep proof

Static file reads show all migrated page disclosures listed in the E5 table have 0 native opening <details and 0 native opening <summary tags and exactly 1 shared opening/closing Disclosure pair. Source-level chip table files have 0 native <button tags and equal shared chip closing tag counts. The report source has native aria-sort exposed on the table header and per-column sort state; its existing DataTable empty state and infinite/show-more boundary remain.

Reproduction commands (NOT executed by this lane; the numbers above come from text inspection of the fetched files):

```sh
grep -nE '<(button|details|summary)([[:space:]>])' src/components/{tpo/tpo-custom-job-type-placed,tpo/tpo-team-follow-controls,tpo/tpo-team-decision-toggle,tpo/recruiter-leads-workspace,courses/assignment-submission-control,placements/report-interactive-table,placements/learner-jobs-browse}.tsx
grep -nE '<FilterChip([[:space:]>])|</FilterChip>|aria-pressed|sortDirection|aria-sort=' src/components/{placements/report-interactive-table,tpo/tpo-custom-job-type-placed,tpo/tpo-team-follow-controls,tpo/tpo-team-decision-toggle,courses/assignment-submission-control}.tsx src/components/ui/data-table.tsx
grep -nE '<details([[:space:]>])|<summary([[:space:]>])|<Disclosure([[:space:]>])|</Disclosure>' 'src/app/(authenticated)/hr/conversations/page.tsx' 'src/app/(authenticated)/tpo/batches/[batchId]/page.tsx' 'src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx' src/components/placements/learner-jobs-browse.tsx
```

- Phone <=767px: interactive chips are min-height 44px with 12px horizontal padding; simple shared disclosure summary min-height 44px with native focus/Enter/Space; table switches to its existing mobile DataTable projection and report mobile sort Select.
- Tablet 768–1599px: chip min-height 32px and padding 15px; table headers become sticky from sm (640px), report column sort action remains keyboard-operable; disclosure content keeps its original surrounding widths and scroll regions.
- Wide >=1600px: no canvas/toolbar/column width overrides introduced; shared Tabs continue gap 40px and scroll cue, unaffected by these source changes.
- Error, loading, disabled and empty: API busy guards, warnings and feedback in migrated choice files remain intact. Shared chips preserve disabled and aria-pressed. DataTable no-data fallback and CSV/clipboard errors remain unchanged. Disclosure messages and forms remain inside the same conditional gates.

### STRICT TICK RULE

- [ ] E1 tables still open: not all table implementations/legacy sorted hover states exhaustively covered or browser-verified.
- [ ] E2 pagination still open: remaining page-specific pagers, all page-size selectors and runtime behavior not exhaustively proven.
- [ ] E3 tabs still open: other tab/vertical variant census and rendered states pending.
- [ ] E4 chips/pills still open: full hover/active/disabled color equality and global grep not executed.
- [ ] E5 accordions/steppers still open: existing shared Dropdown/Tooltip native details are intentional primitive exceptions; exhaustive stepper/timeline state coverage and rendered proof pending.
- [ ] E8 AG Grid still open: native source and dynamic TPO callers exist, but package.json lacks ag-grid-community / ag-grid-react; user prohibits manifest edits. No dependency/build/visual proof.

Exact next file: src/components/tpo/tpo-spreadsheet-grid.tsx — compare pin/resize/sort affordances and 48px selection column against legacy TpoGrid before further E8 changes. Do not edit package.json.


## 2026-10-19 chat-14 replacement continuation: pressed chips and faculty roster pagination

This batch resumed on `chatgpt/chat-14-b` after reconciling concurrent `main` advances. This section documents **file-level source migrations**, not completed E2/E4 categories. No application, browser, typecheck, tests or CI were run. All JSX counts were computed by scanning the **complete saved file text fetched again from GitHub**, not by running the shell commands below.

### E2 source migration and strict value matrix

| Value/state | Legacy source and exact value | vNext source and value | Static result |
|---|---|---|---|
| Phone pager hit box | `docs/design/legacy-styles/components___antddesign.scss:242-256`: 44px min width/height, 8px corner, 42px line-height | `src/components/ui/action-pagination.tsx:27`: `min-h-11 min-w-11 rounded-[8px] leading-[42px]` | Match |
| Tablet pager | Legacy mobile rule stops at max-width 767px | `action-pagination.tsx:27` switches to `md:min-h-9 md:min-w-9` at 768px | Breakpoint match; desktop exact geometry still unverified |
| Phone numeric density | `components___antddesign.scss:272-280`: only active page number shown | `action-pagination.tsx:40-48`: current page remains visible, inactive numbered buttons are `hidden md:inline-flex` | Match |
| Disabled ends | Ant pagination disables first Previous and final Next | `action-pagination.tsx:35,50` disables boundaries; `go()` additionally validates target | Static state match |
| Current page accessibility | Ant active page selected | `action-pagination.tsx:40` has `aria-current="page"` and accessible current-page label | Semantic match |
| Faculty roster filtering | Existing Faculty roster local search resets to page 1 | `src/components/courses/faculty-course-roster.tsx:57-85,160-175` retains search, page clamp and data projection | Original behavior untouched |
| Faculty roster pager | Former hand-rolled Previous / Page n of m / Next navigation | `faculty-course-roster.tsx:234` now single `ActionPagination` with `page={currentPage}`, `pageCount={totalPages}`, `onPageChange={setPage}`, print-hidden class | Source-converted, browser not tested |

**File-scoped JSX grep evidence:** `src/components/courses/faculty-course-roster.tsx` has **one self-closing ActionPagination** and **zero** remaining `aria-label="Student roster pages"` native nav instances. The roster retains **two paired shared Button controls**, the photo Dialog, and `DataTable`; zero raw `<button>`, `<details>`, `<input>`, or `<select>`. No change to photo authorization, CSV export, selection or course data. All page links remain local control actions; no bogus URL introduced.

### E4 source migration and strict value matrix

| Value/state | Legacy source and exact value | Shared vNext / migrated callers | Static result |
|---|---|---|---|
| Interactive status-chip phone hit target | `legacy-styles/components___antddesign.scss:1092-1100`: min-height 44px, 12px horizontal padding through 767px | `src/components/ui/filter-chip.tsx:32`: `min-h-11 px-[12px]` before md | Match |
| Compact legacy pill paint/geometry | `legacy-styles/components___common.scss:995-1005`: 6px radius, 2px/15px padding, 12px/700 ink | `filter-chip.tsx:32`: 6px radius, 2px vertical padding, 12px bold, 18px leading; md:15px horizontal padding | Source shape match, actual interactive hover/pressed color equality unverified |
| Filter selected state | Legacy pressed quick filters track selection | `learner-notifications-inbox.tsx:125-149` category `aria-pressed={active===key}` and unread `aria-pressed={unread==="unread"}` | State/handlers retained |
| Saved drive selected state | Legacy quick-action saved toggle | `learner-save-drive-button.tsx:31-35` `FilterChip` with saved `aria-pressed`, busy disabled, same POST/DELETE and errors | State/behavior source retained |
| Presentation mode selected state | Pressed toggle for fullscreen | `tpo-report-presentation.tsx:25-28` `FilterChip`, `aria-pressed={active}`, print:hidden, browser fullscreen listener/error unchanged | State/behavior source retained |
| Focus/hover/disabled/empty | Interactive chips need real button semantics and visible focus, disabled guards | `filter-chip.tsx:29-38` delegates to shared Button; call sites pass disabled and handlers. Notifications retain zero/empty/error and reset fallbacks | Source-level matching only; computed-state proof pending |

**File-scoped grep counts after GitHub re-fetch:** `learner-notifications-inbox.tsx` has **two FilterChip opening/closing pairs** (one category map and one unread toggle), **eight shared Button pairs**, **zero raw buttons**; the original navigation, query-backed category filters, quick search and mark-all notices remain. `learner-save-drive-button.tsx` and `tpo-report-presentation.tsx` each have **one FilterChip opening/closing pair**, **zero raw buttons**, no mismatched tags. No `as` casts were split across lines in edited JSX.

Reproduction commands (commands provided for the orchestrator; **not executed** in this turn):

```sh
grep -nE '<ActionPagination|aria-label="Student roster pages"|<button([ >])' src/components/courses/faculty-course-roster.tsx
grep -nE '<FilterChip([ >])|</FilterChip>|aria-pressed=|<button([ >])' src/components/activity/learner-notifications-inbox.tsx src/components/placements/learner-save-drive-button.tsx src/components/placements/tpo-report-presentation.tsx
grep -nE 'min-h-11|rounded-\[8px\]|leading-\[42px\]|md:min-h-9' src/components/ui/action-pagination.tsx
```

**Responsive source proof:** Through 767px, all migrated chip buttons have min-height 44px and 12px horizontal padding; notification category chips remain horizontally scrollable with `shrink-0`, unread filter is 44px, and faculty pager shows only active page plus Previous/Next. From 768px, shared pager changes to 36px with five-number window and the chip geometry becomes 32px; notification list retains desktop wrapping. No page shell widths, underlying data ordering, form validation, role scope or back-end queries changed.

**STRICT TICK STATUS:** E1–E5 and E8 remain **[ ]** because these are narrow file-level proofs, not complete repo-wide grep, fully enumerated legacy hover/loading/disabled/error/empty computed states, or side-by-side viewport verification. E8 also remains blocked by undeclared AG Grid dependencies and unavailable legacy TpoGrid source.

**Next exact E2/E4 file after these completed files:** `src/components/academics/learner-class-schedule.tsx` for the day-grid pressed controls and schedule view switch (preserve layout classes and date selection).


### 2026-10-19 chat-14 — calendar pressed-day cell source closure

One remaining page-level native `<button>` in `src/components/academics/learner-class-schedule.tsx` rendered the 42-day calendar cells. It is now a shared Button, **not a FilterChip**: a calendar-day cell needs its existing square grid layout, date label, and three tiny event dots rather than compact tag geometry.

| Property/state | Before/legacy reference | After/source proof | Static result |
|---|---|---|---|
| Day cell geometry | `src/components/academics/learner-class-schedule.module.css:186-197`: `display:block`, min-height **96px**, 8px padding, no border/radius, left-aligned | `learner-class-schedule.tsx:639-645`: shared ghost Button, original `styles.monthDay`, additional `!block !w-full !min-h-[96px] !justify-start` to retain grid tile size | Source values preserved, CSS computed precedence unverified |
| Active/selected | `learner-class-schedule.module.css:200-203`: selected day teal inset outline/fill, `aria-pressed=true` | `learner-class-schedule.tsx:642-644`: original `aria-pressed={selected}` and day class unchanged | Active semantics retained |
| Keyboard/focus | Legacy native button focus and `module.css:199` teal focus-visible outline | Shared Button remains a native keyboard-operable button; existing `styles.monthDay` focus rule retained | Semantic match, actual focus paint untested |
| Day labels/dots | Three small urgency-coded marks, class count, day number | `learner-class-schedule.tsx:645-654` content and day agenda callback untouched | Unchanged |
| Phone/tablet breakpoint | Legacy phone actionable targets at least 44px (`components___antddesign.scss:1081-1100`) | Shared day Button retains 96px min-height; calendar grid breakpoint and monthKeys unchanged | Meets phone target; day width/overflow browser proof still needed |
| Loading/empty/error | Existing calendar and agenda logic handles empty month days and schedule events | Both original count + conditional dots untouched; selected agenda still displayed below | Existing state logic unchanged |

**Whole-file re-fetch/grep-equivalent:** `src/components/academics/learner-class-schedule.tsx` has **8 opening and 8 closing `<Button>` tags**, **zero raw `<button>` opening or closing tags**, and three `aria-pressed` sites, with no broken JSX tag names in the converted cell. This count was determined from full GitHub source text and is not the result of running shell grep.

Reproduce (not executed here):
```sh
grep -nE '<button([ >])|</button>|<Button([ >])|</Button>|aria-pressed=' src/components/academics/learner-class-schedule.tsx
grep -nA20 '^\.monthDay' src/components/academics/learner-class-schedule.module.css
```

E4 and the general buttons category remain **unticked** under STRICT TICK RULE: source-scoped conversion is not a repo-wide census, and side-by-side phone/tablet/desktop pointer/focus/active computed styles are not verified. No code execution, TS typecheck, unit test, CI or browser screenshot took place.

**Next exact file:** `src/components/tpo/grid/grid-selection.ts` (E8: selection visible versus authorized and hidden-filter behavior). Existing AG Grid manifest dependency blockage remains documented in `clone-sheets.md`.


## 2026-10-20 chat-14 — legacy source-value sweep, 768px handoff and true tab/pager geometry

Baseline: the lane was fast-forwarded to inspected main `9880c6d` (it was a clean ancestor, 0 ahead/838 behind), then newer main `002ac31` was merged without replacing any lane work. All writes stayed on `chatgpt/chat-14-b`. This is a full-file, GitHub-fetched **static code audit**, not an application execution or viewport screenshot. Source line numbers are for this authored state and may move when other lanes merge.

### Exact E1 shared table phone/tablet value matrix

| Property / state | Old LMS source: exact value | vNext file: value | Verdict |
|---|---|---|---|
| Phone/tablet boundary | `docs/design/old-lms-shell.css:23,73,89`: mobile up to 767px, desktop from 768px | `src/components/ui/data-table.tsx:40,96-143`: all **42** `sm:` (640px) responsive qualifiers changed to `md:` (768px) | Breakpoint matches old shell; no computed screenshot |
| Desktop headings | `legacy-styles/components___common.scss:831-837,858-860`: neutral-400 header ink, white header background | `data-table.tsx:99-101`: neutral-400, white; header becomes a table header at md | Token values match |
| Standard table hairline | `old-lms-pages.md:6`: 1px compact row separators; shell `#e5e9f0` | `data-table.tsx:96,100,110`: `--lms-canvas-border` (#e5e9f0 in `src/app/globals.css:339`) | Source token match |
| Table row background and hover | `legacy-styles/components___common.scss:851-855`: no painted row-hover cells | `data-table.tsx:105`: white background/white hover on md+, primary-subtle keyboard focus-within | Hover paint matched against white default; keyboard focus state added, old focus details unverified |
| Zebra variant | `legacy-styles/components___common.scss:809-815`: **#f8fbff** odd-row exam background | `src/components/ui/table.tsx`: optional `striped` sets `#f8fbff`; DataTable remains non-zebra | Exact optional exam paint; not a claim all exams use striped |
| Phone visibility/cell role | `old-lms-shell.css` mobile <=767; whole-page table cards for narrow screens | `data-table.tsx:97-143`: `block` card projection and `md:table`; full desktop semantics preserved at 768px | Source breakpoint match, card pixel treatment unverified |
| Empty state | Old page content maintains one white canvas | `data-table.tsx:40`: preserves existing empty callback with border/background; only responsive padding changes at 768px | Behavior unchanged, text varies by caller |

### Exact E2 shared pagination value matrix (static)

| Property / state | Old LMS SCSS | vNext source | Result |
|---|---|---|---|
| Phone hit box | `legacy-styles/components___antddesign.scss:250-256`: **44×44px**, radius **8px**, number line-height **42px** | `ui/pagination.tsx:54`, `ui/action-pagination.tsx:27`: `min-h-11 min-w-11 rounded-[8px] leading-[42px]` | Exact sizes/line-height match |
| Phone container geometry | `components___antddesign.scss:243-248`: **flex-wrap**, **4px** gap, centered | Both shared pagination components use `flex-wrap justify-center gap-1` until `md`, retaining 8px gap and start alignment from 768px | Exact phone gap and alignment |
| Numeric density | `components___antddesign.scss:272-280`: hide every number except active; no jumps | `pagination.tsx:60-84`, `action-pagination.tsx:37-50`: `hidden md:inline-flex` for other page numbers and boundary jumps; current stays visible | Phone rule matched |
| Active color | `components___antddesign.scss:233-239`: `$clrThird = #26bac7`, border and ink; no tinted active-fill rule | `pagination.tsx:68` and `action-pagination.tsx:43`: `border-[var(--lms-primary)] bg-white text-[var(--lms-primary)]`; `globals.css:21` maps exact #26bac7 | Exact active border/ink on white source |
| Disabled ends | Ant Prev/Next unavailable at first/last | Link pager has disabled spans for unsafe/edge href; action pager buttons disabled at boundaries | Static behavior preserved |
| Keyboard focus | Legacy Ant keyboard focus visible | Link pager focus-visible 2px outline; action pager forwarded through Button with same outline | Semantic focus expected; old focus outline computed value not exhaustively proven |
| Client filter scroll | Caller `learner-applications-browse.tsx` requires scroll:false | Existing Pagination `scroll` default true and caller opts out; unchanged in this batch | Navigation preserved |

### Exact E3 tabs value matrix (static)

| Property/state | Legacy reference | `src/components/ui/tabs.tsx` | Result |
|---|---|---|---|
| Typeface | `components___common.scss:365-375,461-471` 13px/600, line-height 16px, inactive `$neutral-400` = #a9a7ae | Lines 83,89,90 `text-[13px] leading-4 font-semibold`, `--lms-neutral-400` | Exact source values |
| Bottom padding / top | `components___common.scss:369,465`: `padding:0 0 13px 0` | Three shared tab variants now `px-0 pb-[13px] pt-0` | Exact desktop authored padding |
| Tab height | 16px content + 13px bottom padding = **29px**; phone touch needs >=44px | Three variants `min-h-11 md:min-h-[29px]`, 44px until 767, 29px from 768 | Exact desktop content box and mobile touch floor; flex alignment should be inspected in browser |
| Active indicator | `components___common.scss:381-391,477-488`: centered 3px underline, animates width and opacity 0.2s ease-in-out | Two interactive/link variants `after:h-[3px] after:left-1/2 ... after:duration-200 after:ease-in-out`; separate accidental 3px border removed | Exact source shape and animation parameters |
| Inactive/active label colors | `components___variables.scss:10,27`: inactive neutral-400 #a9a7ae; active/hover `$clrThird` **#26bac7** | Now use `--lms-neutral-400` and `--lms-primary` (#26bac7); replaced former darker `--lms-primary-text` | Exact mapped colors |
| Horizontal tab spacing | `.ln-tab` SCSS: 20px until 1599, 40px >=1600 | `gap-[var(--lms-tab-gap)]` (20px) and `min-[1600px]:gap-[40px]` | Matches breakpoint/source pixels |
| Navigation and panel semantics | Old Ant Tabs active tab, disabled, and keyboard arrows | Controlled UI retains tablist, `aria-selected`, arrow/Home/End; route mode retains real Link hrefs | Behavioral implementation unchanged; no keyboard browser proof |
| Mobile overflow | `components___common.scss:444-451`: horizontal scroll with hidden scrollbar | Tabs `ScrollCue axis=x` preserves horizontal navigation | Structural match; scrollbar appearance not browser-verified |

### File-scoped coverage/source grep-equivalent after writes

| File | Source count evidence from full GitHub file | Responsive proof |
|---|---|---|
| `src/components/ui/data-table.tsx` | **42 `md:` tokens, 0 `sm:`**. One raw semantic table INSIDE the shared component; 1 Disclosure open/close pair, 0 raw buttons | phone <=767 card; tablet >=768 table, header sticky |
| `src/components/ui/tabs.tsx` | **3 `md:min-h-[29px]`**, 0 `border-b-[3px]`, 0 `pt-[13px]`; one raw button only INSIDE the shared tab primitive; label active teal across link/tab modes | phone 44px, desktop 29px, >=1600 40px gap |
| `src/components/ui/pagination.tsx` | One `justify-center gap-1 md:justify-start`, one white active color `text-[var(--lms-primary)]`; no raw button | phone 4px gap, 44px target, active-only numeric |
| `src/components/ui/action-pagination.tsx` | Same phone container/active color; **3 Button opening/3 closing** shared JSX tags, no raw buttons | phone/desktop split matches link pager |

Reproduce in an actual checkout (these shell commands were **not** run in this connector-only turn):

```sh
grep -nE 'sm:|md:table-header-group|md:table-row-group|<table([ >])|<Disclosure([ >])' src/components/ui/data-table.tsx
grep -nE 'min-h-11 md:min-h-\[29px\]|pt-0|pb-\[13px\]|after:h-\[3px\]|duration-200|border-b-\[3px\]' src/components/ui/tabs.tsx
grep -nE 'justify-center gap-1|leading-\[42px\]|border-\[var\(--lms-primary\)\]|aria-current' src/components/ui/pagination.tsx src/components/ui/action-pagination.tsx
```

### STRICT TICK RULE outcome and next queued file

- [ ] E1 incomplete: no exhaustive table instances/hover/default/error/empty coverage, phone/tablet rendered comparisons or all-column/scroll validation.
- [ ] E2 incomplete: not every custom pager/page-size selector inspected, full hover/focus/disabled provenance and rendered proof unavailable.
- [ ] E3 incomplete: global census of navigation strips and all states (including mixed disabled, long counts, viewport scrolling) and browser snapshots outstanding.
- [ ] E4/E5 unchanged global open status: filtered badges, timelines, stepper, nested accordions and CSS state matrices require further coverage.
- [ ] E8 documented separately in clone-sheets.md: selection model fixed but native runtime blocked by undeclared AG Grid dependencies and inaccessible legacy source.

**Next exact file:** `src/components/tpo/grid/view-memory.ts` (finish saved per-column width/pin/hidden state parity while respecting URL visibility and server authorization).
