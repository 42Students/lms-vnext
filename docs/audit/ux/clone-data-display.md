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
