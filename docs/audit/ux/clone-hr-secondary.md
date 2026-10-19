# HR / recruiter secondary visual clone audit — chat-18

Baseline: `origin/main` 1fae38d2c433f5b5b0a90a22be12754ab28796e0 (2026-10-19); branch `chatgpt/chat-18-b` was force-with-lease reset to that commit before work. Commits must carry `[chat-18]`.

Scope rule: chat-15's `clone-hr.md` contains a *broad inventory*, but the owner explicitly reserved HR home, jobs, drives, applicants, offers, rounds and HR AG Grid sheets for chat-15. This queue contains only HR secondary routes, recruiter secondary aliases, messaging/notification controls, and tracker pages. Do not edit `src/components/ui/**`, `src/styles/legacy-skin.css`, shared shell, or chat-15 primary pages. Profile/settings are not taken from chat-11.

## Work queue

Source inventory taken from the recursively enumerated Git trees recorded in `docs/audit/ux/clone-hr.md` (not a claim that shell grep was run). On each file: inspect own PageHeader/canvas, tab/chip/row judgment cases, responsive states, loading/error/empty states, JSX syntax. Source-only examination does not prove visual parity.

### HR secondary routes (28 files)
- [ ] `src/app/(authenticated)/hr/activity/error.tsx`
- [ ] `src/app/(authenticated)/hr/activity/loading.tsx`
- [ ] `src/app/(authenticated)/hr/activity/page.tsx`
- [ ] `src/app/(authenticated)/hr/calendar/error.tsx`
- [ ] `src/app/(authenticated)/hr/calendar/loading.tsx`
- [ ] `src/app/(authenticated)/hr/calendar/page.tsx`
- [ ] `src/app/(authenticated)/hr/colleges/error.tsx`
- [ ] `src/app/(authenticated)/hr/colleges/loading.tsx`
- [x] `src/app/(authenticated)/hr/colleges/page.tsx` (non-rendering redirect/re-export or effect-only helper; 0 element-level value rows, 0 own breakpoints)
- [ ] `src/app/(authenticated)/hr/company/error.tsx`
- [ ] `src/app/(authenticated)/hr/company/loading.tsx`
- [ ] `src/app/(authenticated)/hr/company/page.tsx`
- [ ] `src/app/(authenticated)/hr/company/reports/error.tsx`
- [ ] `src/app/(authenticated)/hr/company/reports/loading.tsx`
- [ ] `src/app/(authenticated)/hr/company/reports/page.tsx`
- [ ] `src/app/(authenticated)/hr/conversations/[threadId]/error.tsx`
- [ ] `src/app/(authenticated)/hr/conversations/[threadId]/loading.tsx`
- [ ] `src/app/(authenticated)/hr/conversations/[threadId]/page.tsx`
- [ ] `src/app/(authenticated)/hr/conversations/error.tsx`
- [ ] `src/app/(authenticated)/hr/conversations/loading.tsx`
- [ ] `src/app/(authenticated)/hr/conversations/page.tsx`
- [ ] `src/app/(authenticated)/hr/messages/error.tsx`
- [ ] `src/app/(authenticated)/hr/messages/loading.tsx`
- [x] `src/app/(authenticated)/hr/messages/page.tsx` (non-rendering redirect/re-export or effect-only helper; 0 element-level value rows, 0 own breakpoints)
- [ ] `src/app/(authenticated)/hr/notifications/error.tsx`
- [ ] `src/app/(authenticated)/hr/notifications/loading.tsx`
- [ ] `src/app/(authenticated)/hr/notifications/page.tsx`

### Recruiter secondary aliases (15 files)
- [ ] `src/app/(authenticated)/recruiter/calendar/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/calendar/loading.tsx`
- [x] `src/app/(authenticated)/recruiter/calendar/page.tsx` (non-rendering redirect/re-export or effect-only helper; 0 element-level value rows, 0 own breakpoints)
- [ ] `src/app/(authenticated)/recruiter/colleges/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/colleges/loading.tsx`
- [x] `src/app/(authenticated)/recruiter/colleges/page.tsx` (non-rendering redirect/re-export or effect-only helper; 0 element-level value rows, 0 own breakpoints)
- [ ] `src/app/(authenticated)/recruiter/company/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/company/loading.tsx`
- [x] `src/app/(authenticated)/recruiter/company/page.tsx` (non-rendering redirect/re-export or effect-only helper; 0 element-level value rows, 0 own breakpoints)
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/messages/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/messages/loading.tsx`
- [x] `src/app/(authenticated)/recruiter/drives/[jobId]/messages/page.tsx` (non-rendering redirect/re-export or effect-only helper; 0 element-level value rows, 0 own breakpoints)
- [ ] `src/app/(authenticated)/recruiter/messages/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/messages/loading.tsx`
- [x] `src/app/(authenticated)/recruiter/messages/page.tsx` (non-rendering redirect/re-export or effect-only helper; 0 element-level value rows, 0 own breakpoints)

### Tracker audit, issues, logs and reports (23 files)
- [ ] `src/app/(authenticated)/tracker/audit-findings/[publicId]/error.tsx`
- [ ] `src/app/(authenticated)/tracker/audit-findings/[publicId]/loading.tsx`
- [ ] `src/app/(authenticated)/tracker/audit-findings/[publicId]/page.tsx`
- [ ] `src/app/(authenticated)/tracker/audit-findings/error.tsx`
- [ ] `src/app/(authenticated)/tracker/audit-findings/loading.tsx`
- [ ] `src/app/(authenticated)/tracker/audit-findings/page.tsx`
- [ ] `src/app/(authenticated)/tracker/error.tsx`
- [ ] `src/app/(authenticated)/tracker/issues/[publicId]/error.tsx`
- [ ] `src/app/(authenticated)/tracker/issues/[publicId]/loading.tsx`
- [ ] `src/app/(authenticated)/tracker/issues/[publicId]/page.tsx`
- [ ] `src/app/(authenticated)/tracker/issues/error.tsx`
- [ ] `src/app/(authenticated)/tracker/issues/loading.tsx`
- [ ] `src/app/(authenticated)/tracker/issues/page.tsx`
- [ ] `src/app/(authenticated)/tracker/loading.tsx`
- [ ] `src/app/(authenticated)/tracker/logs/error.tsx`
- [ ] `src/app/(authenticated)/tracker/logs/loading.tsx`
- [ ] `src/app/(authenticated)/tracker/logs/page.tsx`
- [ ] `src/app/(authenticated)/tracker/mine/[publicId]/error.tsx`
- [ ] `src/app/(authenticated)/tracker/mine/[publicId]/page.tsx`
- [ ] `src/app/(authenticated)/tracker/mine/page.tsx`
- [ ] `src/app/(authenticated)/tracker/page.tsx`

### HR conversation, bell, notification controls (7 files)
- [ ] `src/components/hr/hr-notification-read-button.tsx`
- [ ] `src/components/hr/hr-recruiter-bell.tsx`
- [x] `src/components/hr/recruiter-conversation-live-refresh.tsx` (non-rendering redirect/re-export or effect-only helper; 0 element-level value rows, 0 own breakpoints)
- [ ] `src/components/hr/recruiter-conversation-read-control.tsx`
- [ ] `src/components/hr/recruiter-conversation-reply-form.tsx`
- [ ] `src/components/hr/recruiter-decision-read-button.tsx`
- [ ] `src/components/hr/recruiter-notification-bell.tsx`

### Tracker supporting components (17 files)
- [x] `src/components/tracker/audit-finding-filter-memory.tsx` (non-rendering redirect/re-export or effect-only helper; 0 element-level value rows, 0 own breakpoints)
- [x] `src/components/tracker/audit-finding-filter-persistence.tsx` (non-rendering redirect/re-export or effect-only helper; 0 element-level value rows, 0 own breakpoints)
- [ ] `src/components/tracker/audit-finding-status-action.tsx`
- [ ] `src/components/tracker/independent-finding-actions.tsx`
- [ ] `src/components/tracker/independent-finding-copy-action.tsx`
- [ ] `src/components/tracker/known-errors-workspace.tsx`
- [ ] `src/components/tracker/tracker-admin-nav.tsx`
- [ ] `src/components/tracker/tracker-issue-bulk-actions.tsx`
- [ ] `src/components/tracker/tracker-issue-copy-actions.tsx`
- [ ] `src/components/tracker/tracker-issue-logs-panel.tsx`
- [ ] `src/components/tracker/tracker-issue-saved-views.tsx`
- [ ] `src/components/tracker/tracker-live-logs-explorer.tsx`
- [ ] `src/components/tracker/tracker-quick-report-launcher.tsx`
- [ ] `src/components/tracker/tracker-report-form.tsx`
- [ ] `src/components/tracker/tracker-telegram-manual-panel.tsx`
- [ ] `src/components/tracker/tracker-theme-toggle.tsx`
- [ ] `src/components/tracker/tracker-workflow-panel.tsx`

## Completed non-rendering file proof (2026-10-19)

**10/10 non-rendering files ticked**, because they own zero visual properties. No shared-component or legacy CSS value is added by these files, and phone/tablet layout is inherited entirely from the routed destination or parent. Source inspection showed **zero** raw buttons/selects/inputs/textareas/tables, hex colours, custom pills, PageHeaders or overlays across these ten files. Their own per-file value-comparison tables have **zero applicable rows**, rather than unknown rows.

| File or group | Inspected source and exact scope | Legacy comparison and responsive behaviour |
| --- | --- | --- |
| HR colleges redirect | `src/app/(authenticated)/hr/colleges/page.tsx:1-5` | Renders nothing; `/hr/home` owns visuals |
| HR Messages alias | `src/app/(authenticated)/hr/messages/page.tsx:1-4` | Delegates to `/hr/conversations` without added DOM |
| Recruiter calendar alias | `src/app/(authenticated)/recruiter/calendar/page.tsx:1` | Uses HR calendar visual tree unchanged |
| Recruiter colleges redirect | `src/app/(authenticated)/recruiter/colleges/page.tsx:1-3` | Redirect only; no CSS or viewport rules |
| Recruiter company alias | `src/app/(authenticated)/recruiter/company/page.tsx:1` | Uses HR company visual tree unchanged |
| Recruiter drive-messages alias | `src/app/(authenticated)/recruiter/drives/[jobId]/messages/page.tsx:1` | Delegates to chat-15-owned drive messaging screen |
| Recruiter Messages alias | `src/app/(authenticated)/recruiter/messages/page.tsx:1` | Uses HR conversations visual tree unchanged |
| Recruiter live refresh | `src/components/hr/recruiter-conversation-live-refresh.tsx:5-23` | Effect-only component; `return null`, never renders a UI state |
| Tracker finding filter memory | `src/components/tracker/audit-finding-filter-memory.tsx:8-31` | Effect-only; `return null`, no UI properties |
| Tracker finding filter persistence | `src/components/tracker/audit-finding-filter-persistence.tsx:10-39` | Effect-only; `return null`, no UI properties |

Work queue closure here means these files introduce no presentation of their own; the destination/shared parent screens retain their **separate, open** value-parity checkboxes.

## Exhaustive secondary source sweep — 87 files examined

The entire **87-file Work queue** was checked from the GitHub branch source, in nine batches of up to ten files. This is equivalent to reading the listed TSX files and applying the stated static regex patterns; it was **not** an executed shell grep, compiler, browser, CI, or a screenshot comparison.

| Source pattern | Result across 87 Work queue files | Disposition |
| --- | ---: | --- |
| Own raw `<h1>` title blocks | 0 | All rendered page headings use shared `PageHeader` (aliases/redirects have no heading) |
| Literal 6-digit hex colour outside tokens | 0 | Tokenised, including red bell count fallback |
| Visible raw `<button>`, `<select>`, `<textarea>`, `<table>` | 0 | Shared controls/data-grid already used |
| Raw `<input>` | 14 | All **14 are type="hidden"** form fields across six files; no class strings or visually styled control — written exemptions |
| Custom `border-b-2` pill/tab and unshared custom tab panels | 0 in scanned pattern | Notifications now use shared Tabs; calendar/conversations/tracker retain shared Tabs |
| Raw `rounded-full` instances | 5 | Circle avatar (`hr/company/page.tsx`:1) and bell notification count/unread dot; intentionally circular, not selectable status filters |
| `aria-pressed` | 1 | `src/components/tracker/tracker-theme-toggle.tsx:50`, on shared Button with real pressed state — not a standalone raw toggle |
| Error/loading route without a shared fallback | 0 of 41 | All route fallbacks delegate to Graceful*/ErrorState/Alert; shared visual fidelity remains a separate check |
| Direct hand-rolled overlay with `fixed inset-0` | 0 in checked page/component snippets | Shared Dialog/Drawer/Popover used on reviewed portals |

Hidden-field exemptions: `hr/activity/page.tsx` (2), `hr/company/page.tsx` (2), `hr/company/reports/page.tsx` (1), `hr/conversations/page.tsx` (6), `hr/notifications/page.tsx` (2), `tracker/audit-findings/page.tsx` (1). All exactly `type="hidden"`, carrying POST/GET scope and filters that must not be lost.

Further user-requested shared empty states are now installed in HR activity, calendar (two states), conversations inbox/detail, tracker audit DataTable (two states), Known Errors and Live Logs. The deterministic `scripts/codemods/chat18-secondary-empties.cjs` records this family of transformations.

**Source inspection completed: 87/87. STRICT VISUAL TICKS: 10/87.** The other 77 file checkboxes remain open only because exact computed legacy default/hover/focus/disabled/mobile measurements and visual regression comparisons have not been produced. Never interpret a zero static-pattern count as proof of pixel-level parity.

## Additional file-level changes on synced `main`

- **12 route-state files**: `scripts/codemods/chat18-route-states.cjs` and the corresponding 5 loading and 7 error pages now use `GracefulPageLoading`, `PageHeader`, `ErrorState`, `Button` instead of nested skeleton cards or raw headings. Routes include HR calendar, company reports, conversations, messages/activity and tracker audit findings. Props and retry behavior retained. Not ticked: shared-component legacy default/hover/focus/mobile value proof still outstanding.
- **9 secondary route files**: source-level removal of static PageHeader `eyebrow` on HR activity/calendar/company/reports and tracker issues/audit/logs, matching `docs/design/old-lms-pages.md:4-6` one title + inline subtitle. Notification duplicate `NeedsDoingChips` import fixed.
- **HR notifications**: `hr/notifications/page.tsx` now uses shared `Tabs` for All/Unread instead of a hand-built active underline, retaining the college and search query; no dynamic `border-b-[3px]` branch remains.
- **HR bell**: `src/components/hr/hr-recruiter-bell.tsx` uses shared icon glyph with token-based unread red and clipped count, no hard-coded fallback hex; drawer/popover behavior preserved.
- **Calendar/report nesting**: `hr/calendar/page.tsx` replaces redundant week outer border and day-card backgrounds with a continuous canvas; `src/components/tracker/tracker-report-form.tsx` removes the receipt-card-in-canvas wrapper.
- **Tracker logs**: `tracker/logs/page.tsx` uses three shared `Alert` and two `ErrorState` states, matching pale banner and continuous canvas anatomy in `docs/design/old-lms-pages.md:4-11`.

## Source-level corrections completed

- [x] `src/components/hr/recruiter-conversation-read-control.tsx`: removed duplicate declaration of the same Button import. No JSX changed.
- [x] `src/components/hr/hr-recruiter-bell.tsx`: replaced text-only Notifications trigger with an accessible icon and red unread badge, preserving Drawer, polling, action and API behavior. Source: `docs/design/old-lms-shell-spec.md:12-18` (topbar icon buttons), `docs/design/old-lms-shell.css:55-56,74-82` (header, responsive actions), `docs/design/legacy-styles/components___notification-drawer.scss:26-59` (trigger, badge).
- [x] `src/app/(authenticated)/hr/calendar/page.tsx`: restored missing Tabs import for existing event/view tabs.
- [x] `src/app/(authenticated)/hr/company/reports/page.tsx`: restored missing Tabs and StatusBadge imports for existing report tabs/rows.

These are **source corrections**, not STRICT TICK RULE parity claims.

## Bounded-turn batch notes

- `src/app/(authenticated)/hr/notifications/page.tsx:43-52`: replaced its hand-coded selected-college filled pills with shared `NeedsDoingChips` (`selectedKey=result.collegeId`, same grant labels and URLs), retaining the separate unread-only toggle. Matched anatomy reference `docs/design/old-lms-pages.md:6-8`; strict visual check remains open.
- `src/app/(authenticated)/hr/activity/page.tsx:36-40`: same selected-college quick-filter treatment, retaining existing kind Tabs and GET form. Reference `docs/design/old-lms-pages.md:6-8`; strict visual check remains open.
- Codemod authored but **not executed**: `scripts/codemods/chat18-secondary-page-eyebrows.cjs` removes static `PageHeader eyebrow="..."` props in 16 explicitly scoped HR-secondary/tracker route files. Pattern: unwanted extra identity subtitle in shared PageHeader; matching reference `docs/design/old-lms-pages.md:4-6`. Run `node scripts/codemods/chat18-secondary-page-eyebrows.cjs --dry-run`, inspect report, then without `--dry-run`; the orchestrator runs its typecheck and commits generated files.
- Connector source scans (not command-line grep): among 8 examined secondary HR/tracker source pages, missing `Tabs`/ `StatusBadge` import bindings were corrected; 8 selected secondary files still contain native hidden inputs only (remaining counts: HR activity 2, conversations 6, notifications 2, company 2, company/reports 1; do not hand-migrate, orchestrator raw-control codemod owns them). No aggregate coverage claim.

## Tracker and notification judgement-case patch notes

| Surface | Legacy reference | Source change | Result |
| --- | --- | --- | --- |
| Tracker issue rows | `old-lms-pages.md:9-11` (tables with hairline row separators, no nested cards) | `src/app/(authenticated)/tracker/issues/page.tsx`: one `divide-y` list, no per-issue Card wrapper; responsive flex layout unchanged | Source treatment matched; viewport proof open |
| Tracker issue status and severity pills | `old-lms-pages.md:10`; `legacy-styles/components___antddesign.scss:123-136` (coloured status treatments) | `tracker/issues/page.tsx`: status `CLOSED` success, `NEW/READY_FOR_RETEST` warning, others info; `BLOCKER/CRITICAL` error, `MAJOR` warning | Semantics mapped; exact palette delegated to StatusBadge owner |
| Tracker finding quick filters | `old-lms-pages.md:6-8` (count chips) | `tracker/audit-findings/page.tsx`: FINDING_STATUSES links migrated to shared `NeedsDoingChips`, counts and destinations preserved | Source structure matched; visual proof open |
| Tracker detail screenshot metadata and activity | `old-lms-pages.md:9-11` (hairline list separators) | `tracker/issues/[publicId]/page.tsx`: replaced repeated nested-card look with bordered `divide-y` lists | Source match; viewport proof open |
| Tracker live log entries | `old-lms-pages.md:9-11` (continuous canvas, row separators) | `src/components/tracker/tracker-live-logs-explorer.tsx`: `ol` uses `divide-y`, log rows use `py-4` | Source match; default/hover/focus comparison open |
| Known error list rows | `old-lms-pages.md:9-11` (one white continuous canvas, hairline row separators) | `src/components/tracker/known-errors-workspace.tsx`: changed known-error article wrappers to `py-5` and parent to `divide-y`; retained nested mute form controls | Source match; responsive and visual proof open |
| Recruiter notification loading | `legacy-styles/components___notification-drawer.scss:146-174` (drawer body states) | `src/components/hr/recruiter-notification-bell.tsx` announces loading in Drawer, not a blank state | Source match; test and mobile proof open |
| Notification action height | `old-lms-shell-spec.md:12-18` (36px desktop buttons), `old-lms-shell.css:73-85` (mobile compact icon actions) | `src/components/hr/hr-notification-read-button.tsx` `min-h-11 sm:min-h-9` | 44px phone / 36px desktop declared; computed style proof open |

No edits to shared UI primitives or the global skin. No compiler, runtime, grep, CI, screenshot or accessibility tooling was run in this lane.

## Value-by-value and state proof (all visual closure boxes remain open)

| Element/property/state | Legacy reference | vNext source | Status |
| --- | --- | --- | --- |
| Topbar notification icon trigger | `old-lms-shell-spec.md:12-18`; `old-lms-shell.css:55-56` | `src/components/hr/hr-recruiter-bell.tsx` icon button with ShellNavGlyph | Source structure matched; measured viewport not checked |
| Notification trigger hover/focus | `components___notification-drawer.scss:27-52` | Shared Button variant, outside this lane | Blocked on shared component exact value proof |
| Notification unread badge (10px, compact count) | `components___notification-drawer.scss:53-59` | `src/components/hr/hr-recruiter-bell.tsx` badge `text-[10px]` and rounded full | Type-size source match; line-height/position viewport proof open |
| Notification list rows, hover and card hairlines | `components___notification-drawer.scss:180-213,227-242` | `src/components/hr/hr-recruiter-bell.tsx`, `recruiter-notification-bell.tsx` | Inspect exact default/hover/active/disabled, phone |
| One white page canvas and inline page head | `old-lms-pages.md:4-6`; `old-lms-shell-spec.md:20-22` | Shared PageHeader + shell canvas on secondary pages | Depends on shared shell; do not duplicate canvas |
| Tab underline, control radius and focus | `components___common.scss:359-394`; `old-lms-pages.md:7-10` | Calendar/conversations/reports tabs | Shared Tabs value and keyboard proof still open |
| Mobile notification drawer and item tap targets | `components___notification-drawer.scss:105-113,146-174`; `old-lms-shell.css:73-85` | Responsive `min-h-11` on mobile notification rows | Source only; device comparison remains open |

## Required coverage grep / verification (not run)

```sh
grep -rnE '<(button|select|input|textarea|table)([ >])|#[0-9a-fA-F]{3,8}|fixed inset-0|role="(dialog|alertdialog)"' 'src/app/(authenticated)/hr' 'src/app/(authenticated)/recruiter' 'src/app/(authenticated)/tracker' src/components/hr src/components/tracker
grep -rn 'PageHeader' 'src/app/(authenticated)/hr' 'src/app/(authenticated)/recruiter' 'src/app/(authenticated)/tracker'
```

Count: **unverified**. This lane cannot run repository code, grep, CI, visual comparison or browser screenshots. The orchestrator must run coverage and computed-style parity checks before any STRICT TICK RULE visual item is marked complete.

## Current branch integration

Rebased with GitHub tree-level three-way comparison onto `origin/main` `dba6bbd5456152d9acc1ba31601d9ca32bcab3aa`, commit `2e9083ea773731ae0f233189c2874685e8e37ac7`. GitHub comparison showed branch ahead by one and behind by zero at that reference. Preserved main's new legacy calendar CSS-module styling rather than overwriting it. Conflict handling kept main's existing calendar/conversation shared route fallback and applied only our local calendar PageHeader/one-canvas, notification Tabs, and icon bell changes on top of latest main.

Queue status: **10 ticked non-rendering files; 77 visual files still open** under the STRICT TICK RULE. All 87 received the source-level sweep, including cases with no changes required. Source changes on those visual files are not equivalent to pixel-perfect parity proof. The branch has not been typechecked or rendered, as requested.

## STRICT TICK RULE closure

- [ ] HR secondary visual coverage (missing: complete file-by-file matched property table, exact aggregate greps, phone/tablet proof and visual comparison).
- [ ] HR secondary tabs/chips/dynamic-class parity (missing: source values across all default/hover/focus/disabled states).
- [ ] Recruiter aliases/notifications/bell parity (missing: CSS computed-style and responsive proof).
- [ ] Tracker audit/logs/issues parity (missing: full supporting component sweep, responsive proof and source-value closure).
- [ ] Zero regression (missing: TS strict parse/typecheck and browser checks; intentionally not run).

## Next file

`src/app/(authenticated)/hr/calendar/page.tsx` — finish remaining week/agenda cell nesting, then `src/components/tracker/tracker-report-form.tsx` responsive copy and audit per-state values.


## Replacement lane source repair batch (2026-10-19, continued from existing branch)

Integration: the prior head `abca757a` was an ancestor of `main` `12ee0a58` (GitHub compare: 0 ahead/1023 behind), so `chatgpt/chat-18-b` was safely fast-forwarded with an expected-head lease. Existing chat-18 fixes and audit were **not** discarded. Nine new scoped source corrections followed; this section is the tenth push in the batch.

| File (source location on refreshed branch) | Change and legacy match | Source-only verification |
| --- | --- | --- |
| `src/components/hr/recruiter-decision-read-button.tsx:3,31` | Deduplicated `Button` import; original correct button kept. Legacy button values: `old-lms-shell-spec.md:25-27` | One import, button JSX opening/closing balanced; no page-content change |
| `src/app/(authenticated)/hr/notifications/page.tsx:2,44` | Restored missing shared `NeedsDoingChips` binding for college quick filters. `old-lms-pages.md:6-8` | Filter labels and selected college URLs unchanged |
| `src/app/(authenticated)/hr/company/reports/page.tsx:2,188` | Restored shared `Tabs` import for Company/Team/Reports (without unused StatusBadge); `old-lms-pages.md:7-10` | One shared tab component; existing destinations unchanged |
| `src/app/(authenticated)/hr/company/page.tsx:2,219` | Restored shared `Pagination` for team roster. `old-lms-pages.md:9-11` | Label, page, pageCount, href builder retained |
| `src/app/(authenticated)/tracker/audit-findings/page.tsx:2,39` | Restored shared `Banner` import for pale-warning unavailable/setup strip. `old-lms-pages.md:10-11` | Warning text and denied-service state unchanged |
| `src/components/hr/hr-recruiter-bell.tsx:102-115` | Replaced nonlegacy text-only trigger with `ShellNavGlyph name="bell"`, phone 44px / desktop 36px icon touch area and 16px red count, clipped to `99+`. `old-lms-shell-spec.md:12-18`; `components___notification-drawer.scss:27-59` | Trigger aria-label and expanded/controls state preserved; read/drawer behaviour untouched |
| `src/components/hr/hr-recruiter-bell.tsx:102-105` | Notification list uses 6px row gap, 8px radius, bordered white item, `12px 16px` padding, 200ms hover and 1px focus outline. `components___notification-drawer.scss:180-216` | Default/hover/active/focus Tailwind sources read; actual computed pixels not tested |
| `src/components/hr/recruiter-notification-bell.tsx:72-76` | Same 6px separated notification rows and legacy bordered hover/focus treatment, with phone minimum 44px. `components___notification-drawer.scss:180-216` | Rows remain scoped; URLs and college selection unchanged |

**Value/source table for the repaired bell rows:** gap `6px` vs SCSS line 187; radius `8px` vs line 20 and 188; padding `12px 16px` vs lines 195-196; white surface and border vs lines 197-198; hover shadow `0 1px 3px rgba(0,0,0,0.04)` vs line 209; transition `200ms` vs line 202; focus-visible outline `1px` vs lines 219-223. Branch source expresses each value. Phone and desktop breakpoints of `!h-11 / sm:!h-9` and `min-h-11` were inspected, **not** rendered.

**Read-back / syntax checks:** all seven distinct changed source files were fetched again; checked for one intended component import, missing target bindings, `<Button>` closure count and duplicate single-symbol imports. The code-connector source scan of the nine high-priority HR pages and nine selected tracker components plus nine tracker pages found the above missing bindings. This is *not* a compiler, executable grep, browser, or TypeScript strict check. Source-only comparison cannot satisfy STRICT TICK RULE.

**STRICT TICK counts unchanged: 10/87 files closed** (non-rendering); 77 rendered files remain open pending measured legacy hover/focus/disabled, full coverage grep and phone/tablet/browser proofs. No additional visual file was ticked merely because an import or a visual class was repaired. All changes remained inside the secondary lane's owned files; no shared UI, CSS skin, shell or chat-15 HR primary page was edited.

Next unticked file: `src/app/(authenticated)/hr/calendar/page.tsx` (mobile week/month/agenda and loaded calendar theme), then `src/app/(authenticated)/hr/conversations/page.tsx` (message list and filter states).


## Chat-18 continuation: calendar, tracker errors and responsive secondary search (2026-10-19)

The prior branch was contained in main (GitHub compare: 0 ahead, 978 behind). It was fast-forwarded with an expected-head lease to main 68d52934. Existing chat-18 work was preserved.

### Exact source-value and responsive proof for this batch

| Property and state | Legacy source + value | vNext source + value | Result |
| --- | --- | --- | --- |
| Calendar separator | legacy-styles/components___variables.scss:275 = #dddddd52 | legacy-calendar-theme.module.css:7-11 uses #dddddd52; hr/calendar/page.tsx:520 uses hairline variant and CSS module | Declared paint matches |
| Weekday/day white surface | old-lms-pages.md:4-6 white continuous canvas, plus legacy calendar variables | legacy-calendar-theme.module.css:12-17 = #fff; hr/calendar/page.tsx:532,556 applies weekday/day classes | Source match |
| Day corner | old calendar flat hairline grid from variables.scss:275 | legacy-calendar-theme.module.css:13-17 radius 0!important; removed per-day rounded and muted background | Source match |
| Sunday | legacy-styles/components___variables.scss:273 = #ff7576 | legacy-calendar-theme.module.css:18-21 and calendar/page.tsx:532,567 = #ff7576 | Exact token match |
| Current day | legacy-styles/components___variables.scss:272 = #26bac7 | legacy-calendar-theme.module.css:22-25; calendar/page.tsx:557 applies inset 2px teal ring to current day | Exact token match |
| Calendar phone and tablet | old-lms-shell.css:73 uses max-width 767px mobile breakpoint | hr/calendar/page.tsx:496-520: md:hidden stacked mobile, md:grid 7-column desktop, md:overflow-x-auto and 56rem min width for tablet | Source breakpoint proof only |
| Mobile toolbar search | legacy-styles/components___listing-page-header.scss:131-164 gives full-width search and 44px mobile touch height | hr/activity/page.tsx:47-53, hr/notifications/page.tsx:63-69, hr/company/page.tsx:181-188, hr/conversations/page.tsx:148-160, tracker-report-form.tsx:217-225: basis-full below 768px; 44px actions | Matches declared breakpoint/size, computed state open |
| Desktop toolbar controls | old-lms-shell-spec.md:25-27: 36px | same search files use md:min-h-9 (36px) and md:basis-auto at 768px+; Button appearance inherited from chat-17 | Matches local declaration |
| Error one-canvas hierarchy | old-lms-pages.md:4-6 one page head above one canvas, no separate full-screen takeover | Seven tracker error.tsx files now pass insideShell to GracefulErrorBoundary; hr/conversations/error.tsx renders PageHeader before ErrorState | Source anatomy match; inherited styles unverified |
| Preserved interactions | legacy page actions remain inside head/content canvas | Query params, calendar date navigation and IST formatting, recruiter reply state and retry callback preserved; no new wrapper canvas | Source-only check |

### Exhaustive scoped source-pattern scan (87 of 87 files)

All 87 queue files were fetched from the chat-18 branch source and checked in batches for these literal source patterns. This is a GitHub-file source-equivalent search, NOT a shell grep, compiler or browser run.

| Read-only pattern | Count | Explanation |
| --- | ---: | --- |
| Opening raw button/input/select/textarea/table tags | 1 | tracker/audit-findings/page.tsx:99 is input type=hidden name=view; deliberately exempt as nonvisual |
| Six-digit literal hex colours in TSX | 0 | All 87 queue files |
| Own h1 tags | 0 | Shared PageHeader used |
| Hand-coded border-b-2 tab instances | 0 | Shared Tabs or existing legacy primitives used |
| fixed inset-0 or role=dialog literal | 1 textual; 0 authored overlays | recruiter-conversation-live-refresh.tsx:15 is a querySelector string inspecting an existing dialog; no overlay generated |

Reproducible repository shell command (not executed here):
    node scripts/codemods/chat18-source-audit.cjs
    grep -rnE '<(button|select|input|textarea|table)([ >])|#[0-9a-fA-F]{6}|fixed inset-0' 'src/app/(authenticated)/hr' 'src/app/(authenticated)/recruiter' 'src/app/(authenticated)/tracker' src/components/hr src/components/tracker

The tracker route-error repeated pattern is represented by scripts/codemods/chat18-tracker-error-inside-shell.cjs, with all seven transformed pages committed atomically. The three HR search bars are represented by scripts/codemods/chat18-responsive-search.cjs; both scripts are idempotent and were NOT executed. Additional unique judgement fixes were made in the HR conversation, calendar, and tracker-report components.

### Scope and source re-read verification

17 TSX files touched: hr/calendar/page.tsx; hr/calendar/error.tsx; hr/activity/page.tsx; hr/notifications/page.tsx; hr/company/page.tsx; hr/conversations/page.tsx; hr/conversations/error.tsx; hr/conversations/[threadId]/page.tsx; components/hr/recruiter-conversation-reply-form.tsx; components/tracker/tracker-report-form.tsx; and seven tracker error files named in the tracker error codemod.

Read back the most complex eight files after the mutations: paired div/section/ol/li/Button/Link/Card/CalendarGrid tags checked for balanced opening/closing, zero duplicate named imports. Missing redundant EmptyState import was removed from conversation detail; unused Alert removed from calendar error and recruiter composer. This is NOT TypeScript strict compile or runtime proof.

STRICT TICK RULE: 10/87 existing non-rendering ticks remain; **77 visual items stay open**. The exact shared component computed values (hover, active, keyboard focus, disabled, error/loading) and side-by-side real phone/tablet/desktop visual comparison were not available in this lane. No new visual item is falsely ticked on source-only evidence. No shared UI, global skin, or chat-15 primary HR pages were edited.

Next unticked file: src/app/(authenticated)/hr/calendar/page.tsx — measured phone 375px / tablet 768px / desktop 1280px calendar states, followed by src/app/(authenticated)/hr/conversations/page.tsx.


## Chat-18 successor bounded batch — legacy recruiter reference verification

Main sync: the previous chat-18 branch was a direct ancestor of current main 6807f03b (0 commits ahead, 457 behind). Fast-forwarded with expected SHA, preserving all prior chat-18 history; all new work was pushed only to chatgpt/chat-18-b.

### Matched source properties (latest source read-back)

| Element/property | Legacy exact source and value | vNext source and declaration | Static result |
| --- | --- | --- | --- |
| Recruiter week/month board columns | lms2-fe@prod-2026/src/styles/components/_recruiter-v2.scss:141: repeat(7,minmax(150px,1fr)) | recruiter-calendar-legacy.module.css:23-29: repeat(7,minmax(150px,1fr)) | Exact source declaration |
| Recruiter board gap/padding | _recruiter-v2.scss:141: gap 10px, padding-bottom 6px, overflow-x auto | recruiter-calendar-legacy.module.css:20-29 + boardFrame: 10px / 6px / x-scroll | Source matched |
| Recruiter date-cell min height | _recruiter-v2.scss:142: min-height 140px | recruiter-calendar-legacy.module.css day: min-height 140px | Exact |
| Recruiter current-day outline | _recruiter-v2.scss:143: #2f6fed inset 1px | recruiter-calendar-legacy.module.css day[data-today=true]: #2f6fed inset 1px | Exact (this HR calendar intentionally does NOT use the TPO #26bac7 colour) |
| Recruiter event box gap | _recruiter-v2.scss:145: flex column, 2px gap | recruiter-calendar-legacy.module.css event: flex column, 2px gap | Exact |
| Recruiter event padding/border/radius | _recruiter-v2.scss:145: 8px, 1px #e3e8ef, radius 8px, white | recruiter-calendar-legacy.module.css event: 8px, 1px #e3e8ef, radius 8px, white | Exact |
| Recruiter event hover | _recruiter-v2.scss:145: #f6f8fb | recruiter-calendar-legacy.module.css event:hover: #f6f8fb | Exact |
| Recruiter timestamp font | _recruiter-v2.scss:146: 12px #4a5568, tabular numbers | recruiter-calendar-legacy.module.css .time: 12px #4a5568, tabular | Exact |
| Calendar tablet collapse | _recruiter-v2.scss:157-163: board 1 column at max-width 860px | hr/calendar/page.tsx:497,521 now uses compact occupied-day list up to 860px, 7-day board from 861px; avoids invalid seven stacked weekday headers at 768-860 | Equivalent narrow layout intention; DOM/visual difference remains unverified |
| Calendar phone touch targets | old-lms-shell.css:73-85: mobile through 767px; legacy calendar/tpo navigation mobile 44px | hr/calendar/page.tsx:319,328,411,418,430,463 have mobile 44px / desktop 36px | Declared hit-area matched, real devices not rendered |
| Legacy quick-search field | legacy-styles/components___listing-page-header.scss:87-102: width 220px, min-height 44px, radius 8px | hr/activity, hr/notifications, hr/company, hr/conversations and tracker-report-form search field class: md:w-[220px], min-h-11; shared Input owns border/radius | Width/height matched; shared hover/focus computed proof open |
| Legacy mobile quick-search | listing-page-header.scss:131-164: <=767px full width, 44px input; full width action button | Same five search fields use basis-full below md, desktop basis-auto; Search action uses w-full / md:w-auto with min-h-11 / md:min-h-9 | Breakpoint and declared dimensions matched |
| Recruiter bell count | legacy-styles/components___notification-drawer.scss:53-60: 10px font, min-width/height 16px, 4px horizontal padding | hr-recruiter-bell.tsx and recruiter-notification-bell.tsx: text-[10px], min-w-4, min-h-4, px-1; 99+ clipped on large unread counts | Declaration matched |
| Recruiter bell responsive context | old-lms-shell.css:73: mobile cutover 767px; shell spec: desktop 36px icon actions | hr-recruiter-bell.tsx: min-h/w-11 below md, 9 above; recruiter-notification-bell.tsx same | Declared size mapping (44/36); base drawer SCSS trigger 44px across widths creates unresolved source specificity question |
| Notification rows | notification-drawer.scss:180-216: gap 6px, radius 8px, padding 12px 16px, shadow 0 1px 3px on hover, 200ms transitions | Both bell list sources already matched; retained shared Drawer/Popover, error/loading/empty states | Source matching; computed state and phone scroll proof open |
| Hiring footprint summary | old-lms-pages.md:4-10: one continuous white canvas with single hairline funnel strip, not nested metric cards | hr/company/page.tsx uses shared SummaryStrip (all visible/live/closed) and divide-y recent drives; same labels/counts/URLs/status badges | Structural parity corrected |
| Report page signals | old-lms-pages.md:9-12: big-number funnel strip and report option cards only | hr/company/reports/page.tsx now uses SummaryStrip for the same current-page totals; its AG Grid remained untouched for chat-15 ownership | Structural parity corrected |
| Conversation details | old-lms-pages.md:9-11: one border-separated list, no card per ordinary row | hr/conversations/[threadId]/page.tsx change requests and messages have divide-y rows with single canvas | Source structure matched, interaction preserved |
| Conversation actions | listing-page-header.scss:131-164 mobile full-width action, 44px | hr/conversations/page.tsx uses mobile full-width Search/open/bulk acknowledgement and 44px, desktop 36px | Source size and breakpoint matched |
| Tracker issue filter/rows | old-lms-shell.css:73 responsive threshold 767px; old-lms-pages.md:9-11 hairline rows | tracker/issues/page.tsx uses md 2-column forms/row split, 44px phone links/buttons, preserves status/priority pills and hairlines | Source responsive layout matched |
| Tracker findings filters | old-lms-shell.css:73 responsive threshold 767px; old-lms-pages.md:9-11 | tracker/audit-findings/page.tsx uses md filters and 44px phone actions/pagination, retains shared Tabs, Chips, DataTable | Source responsive layout matched |

The calendar has a distinct original recruiter portal palette (#2f6fed), rather than the TPO calendar palette (#26bac7). The previously recorded TPO calendar paint evidence remains applicable to that separate portal but must not be mistaken for recruiter-v2 exact parity. No shared UI primitive, shell, global skin or chat-15 AG Grid component was edited. Source-specific modules remain owned by the appropriate lanes.

### Refreshed full Work queue regex-equivalent scan, 87 of 87 files

Fetched all 87 queued TSX files from the chat-18 branch via the GitHub connector after this batch; evaluated source regexes in groups of ten, with one final seven-file group. These are exact **source-text** pattern counts, not an actual shell grep nor a rendered DOM inspection:

| Pattern on queued source | Count | Notes |
| --- | ---: | --- |
| Native visible button, input, select, textarea, table opening tags | 0 | Shared controls used |
| Native hidden input | 1 | tracker/audit-findings/page.tsx:99 hidden view query; no visual paint, documented exemption |
| Literal six-digit hex in TSX | 0 | CSS module tokens are excluded from TSX scan |
| Page-owned h1 | 0 | Shared PageHeader |
| Manual border-b-2 tabs | 0 | Shared Tabs |
| Literal fixed inset-0 or role=dialog string | 1 | recruiter-conversation-live-refresh.tsx:15 querySelector checks an already-open dialog; not authored overlay |
| Authored overlays identified by scan | 0 | Shared Dialog/Drawer used |

Commands for the owner/orchestrator to reproduce (NOT executed here):
    node scripts/codemods/chat18-source-audit.cjs
    grep -rnE '<(button|input|select|textarea|table)([ >])|#[0-9a-fA-F]{6}|fixed inset-0|role="(dialog|alertdialog)"' 'src/app/(authenticated)/hr' 'src/app/(authenticated)/recruiter' 'src/app/(authenticated)/tracker' src/components/hr src/components/tracker

Codemods saved (not executed): scripts/codemods/chat18-recruiter-bell-sizes.cjs (3 components) and chat18-search-width.cjs (5 source files), in addition to the previous codemods. They are scoped and idempotent. The edits were made through direct GitHub tree commits, and those source files were read back. One targeted paired-tag review checked div/section/article/ol/li/Button/Link/Card/CalendarGrid/SummaryStrip/form across seven edited complex files: no duplicate named imports, no unmatched real JSX tags. The SummaryStrip arrow-function JSX attribute cannot be evaluated by naive self-closing regex; its ending `}))}/>` is present and was read back. No executable compiler or renderer was run.

STRICT TICK RULE: 10/87 non-rendering files completed previously; 77/87 rendered visual files remain OPEN because we cannot establish computed hover/focus/disabled parity and real 375px/768px/1280px viewport comparisons from connector source alone. Source-patched files are **not** marked as pixel-perfect completed. App/test/CI execution remains forbidden by owner. Do not tick visual entries without the missing proofs.

Exact next file for the following bounded turn: src/components/hr/recruiter-calendar-legacy.module.css (reconcile 768-860 tablet rendering and remaining computed palette values), then src/app/(authenticated)/hr/calendar/page.tsx, and src/app/(authenticated)/hr/conversations/page.tsx.


## Additional chat-18 tracker secondary state and responsive sweep

Latest-main integration: latest main 36460671 added a recruiter calendar `<CalendarGrid variant="hairline">` change. Preserved this concurrent chat-15 improvement, and reapplied only our separate 861px recruiter board cutoff plus 44px phone control changes. GitHub tree-level two-parent merge is `6daa6808`; at that merge the lane was 12 ahead/0 behind, with no unrelated file overwritten. Subsequent tracker changes are strictly within the chat-18 queue.

### Responsive value table

| Element and state | Legacy reference | vNext source value / action | Proof level |
| --- | --- | --- | --- |
| General phone hit target | docs/design/legacy-styles/components___notification-drawer.scss:22-34 `$nd-touch-min:44px`; docs/design/legacy-styles/components___listing-page-header.scss:131-164 44px mobile search/action | `min-h-11` = 44px below 768px on controls throughout the files below | Source height and breakpoint |
| Desktop action size | docs/design/old-lms-shell-spec.md:25-27: 36px ordinary topbar/buttons | `md:min-h-9` = 36px for tablet/desktop controls; defaults and hover delegated to shared Button | Local source dimensions |
| Known Errors commands | old-lms-pages.md:9-11 compact un-nested detail/row presentation | known-errors-workspace.tsx has 10 small shared Buttons with phone 44px/desktop 36px, and 44px tracker issue link; no additional card wrappers | All 11 changed declarations re-read |
| Tracker nav skip link | old-lms-shell.css:73 phone cutoff and keyboard focus treatment in legacy-styles/components___accessibility.scss | tracker-admin-nav.tsx skip-to-content focus link 44px on phone, 36px desktop; existing Tabs and focus destination preserved | Source only |
| Tracker theme pressed state | docs/design/ui-clone-checklist.md:I statefulness; legacy mobile hit target | tracker-theme-toggle.tsx retains shared Button, aria-pressed and light/dark action; local min-height now 44px/36px | Source and semantics preserved |
| Finding mutation CTA | old-lms-pages.md:4-11 single-canvas forms | independent-finding-actions.tsx Save details remains shared Button inside section (no new wrapper), 44px phone/36px desktop | Source only; optimistic action untouched |
| Tracker workflow actions | old-lms-pages.md:4-11 continuous form, 767px mobile behavior | tracker-workflow-panel.tsx workflow save/retest Buttons and commit links use 44/36px; checkbox row has 44/36px minimum height; mutation logic unchanged | Source semantics and dimensions |
| Live logs filters and recovery | legacy-styles/components___listing-page-header.scss:85-102,131-164 controls/search and mobile sizes | tracker-live-logs-explorer.tsx now has phone-sized Select/search, refresh/download/report/older actions, six ghost action links and three contextual links (16 local 44px declarations); list remains border-y/divide-y | Source state/responsive proof; drawer/dialog inherited |
| Bulk issue selection | old-lms-pages.md:9-11 table/list and mobile button behavior | tracker-issue-bulk-actions.tsx selection, apply, Select this page/Clear and checkbox labels now 44px, tablet breakpoint at md | Existing selection semantics unchanged |
| Saved issue views | old-lms-pages.md:6-10 chips and toolbar | tracker-issue-saved-views.tsx save/open/delete view actions 44/36px, view name input min-height 44px; view destinations unchanged | Source dimensions |
| Nearby issue logs | old-lms-pages.md:9-11 hairline rows, compact action | tracker-issue-logs-panel.tsx load and open contextual log action 44/36px; divide-y list unchanged | Source only |
| Telegram controls | old-lms-pages.md:4-11 uncluttered banner/actions | tracker-telegram-manual-panel.tsx four shared alert controls 44px mobile, md 36px, dialog stats 2 columns only at 768px+; Dialog/ConfirmDialog behavior preserved | Source only |

The repeated tracker-target changes are recorded as guarded, idempotent codemods in scripts/codemods/chat18-tracker-touch-targets.cjs (four files) and chat18-tracker-secondary-actions.cjs (four files). Both were committed with the resulting TSX but never run. Known Errors and live-log edits were single-file scoped fixes. These paths do not belong to shared primitives or the other lanes.

Read-back check: the ten named tracker files were fetched after editing, checked for open/close of div/section/ol/li/Button/Link, no author-owned raw controls added; multiline self-closing Input and ConfirmDialog tags were inspected separately rather than falsely flagging them as unmatched. This is NOT a parser/compiler run. No browser, screenshots or device comparison was available.

Previously recorded **87/87 queued TSX source scan** remains the verified full-queue baseline: zero visible raw controls, zero six-digit TSX hex, zero page-owned h1, zero hand-coded border-b-2 tabs, one exempt hidden input and one non-rendering dialog selector string. Subsequent edits added only shared Button/Select/Input props; they do not introduce new native control/overlay tags. The complete source grep and viewport measurements are still required from the owner for final strict closure.

**STRICT TICK STATUS:** 10/87 confirmed no-presentation files [x]; 77/87 rendered visual files [ ] — need complete computed value rows (default/hover/active/focus/disabled/loading/error), 375px phone / 768px tablet / 1280px desktop comparison, and zero-regression JSX/TS check. Do not tick the remaining files on this source-only evidence. No app/test/CI executions.

Exact next file: `src/components/hr/recruiter-calendar-legacy.module.css` for rendered 768-860px recruiter calendar parity, then `src/app/(authenticated)/hr/calendar/page.tsx` and `src/app/(authenticated)/hr/conversations/page.tsx`.


## Continuation batch — specific HR recovery, recruiter board paint, tracker leaf controls

At start of this batch main `d17473ae` contained most preceding chat-18 changes, while chat-18 retained later tracker changes and audit additions. Rebased without losing work using a two-parent expected-SHA Git tree merge `77a52f85`. Preserved **main's** upgraded `Disclosure` in HR Conversations and recruiter calendar markup; omitted both files from the stale-branch overwrite. Subsequent changes pushed ONLY on `chatgpt/chat-18-b`.

### Exact source-level values and states

| Property | Legacy source and exact value | Our source and value | Source check |
| --- | --- | --- | --- |
| Recruiter calendar grid | `lms2-fe@prod-2026/src/styles/components/_recruiter-v2.scss:141`: `repeat(7, minmax(150px, 1fr))`, gap 10px, bottom padding 6px | `src/components/hr/recruiter-calendar-legacy.module.css:27-33` now `.board[data-slot="calendar-grid"]` with those exact declarations, specificity 0-2-0 instead of 0-1-0 | Same declaration, overrides shared CalendarGrid's gap-1/7-column utility regardless of style order |
| Event padding/default | `_recruiter-v2.scss:145`: 8px, white, 1px `#e3e8ef`, 8px radius, 2px vertical gap | `recruiter-calendar-legacy.module.css:60-73`: exact 8px, white, border/radius/gap | Source match |
| Event hover | `_recruiter-v2.scss:145`: background `#f6f8fb` | `recruiter-calendar-legacy.module.css:74-77`: `#f6f8fb`; border `#cdd5e0` from corresponding legacy recruiter's muted border values | Default/hover source |
| Event keyboard focus | Legacy shared form outline `#0a7c88` from `old-lms-shell-spec.md:23-24`; existing recruiter calendar focus used same primary | `recruiter-calendar-legacy.module.css:78-81`: 2px solid `#0a7c88`, offset 2px | Source token checked, computed CSS pending |
| Current day active | `_recruiter-v2.scss:143`: `#2f6fed` border, 1px inset shadow | `recruiter-calendar-legacy.module.css:53-56`: exact declarations | Source match (distinct from TPO teal) |
| Time label | `_recruiter-v2.scss:146`: `#4a5568`, 12px, tabular digits | `recruiter-calendar-legacy.module.css:82-86`: identical | Source match |
| Tablet | `_recruiter-v2.scss:157-163`: calendar drops from 7 columns to one column at max-width 860px | `hr/calendar/page.tsx:497,521`: occupied-date agenda instead of seven-column grid through 860px; CSS module:109-113 one-column fallback; desktop 7-day grid from 861px | Source breakpoint proof; content layout differs (occupied dates only), so no strict tick |
| Phone | `old-lms-shell.css:73-85`: max-width 767px, mobile targets minimum 44px | `recruiter-calendar-legacy.module.css:114-121` retains phone border and 44px mobile day, route navigation 44px | Source proof; no computed layout capture |
| Route error hierarchy | `old-lms-pages.md:4-7`: single header above an inline slim error section on white canvas, not a second coloured card | `hr/activity/error.tsx:1-19`: replaces custom red Alert with shared `ErrorState`; other 6 HR error pages keep PageHeader title equal to normal route name; no nested canvas | Source anatomy corrected |
| Route recovery button | `old-lms-shell-spec.md:23-24`: compact desktop 36px, `components___notification-drawer.scss:22-34`: mobile target >=44px | All six route recovery pages in `chat18-error-recovery.cjs` plus activity error have `min-h-11 md:min-h-9`; reset callback unchanged | Source declarations checked |
| Notification inbox ordinary rows | `old-lms-pages.md:6`: one hairline list, no card per row | `hr/notifications/page.tsx:90-98`: `divide-y` list, no per-row corner, no card border, subtle hover remains | Source structure corrected |
| Activity pagination | `old-lms-shell.css:73`, compact desktop 36px; mobile control target 44px | `hr/activity/page.tsx:73-79`: inline-flex min-height 44/36px, two links; href/page cursors unchanged | Source behaviour unchanged |
| Company report filters | `components___listing-page-header.scss:131-164`: mobile full-width search/action and <=767px breakpoint | `hr/company/reports/page.tsx:218-271`: 2 selects width 100% on phones, md auto widths; Apply and Clear full width & 44px mobile / 36px desktop | Source responsive proof |
| Tracker leaf action targets | `old-lms-shell.css:73-85`, `old-lms-shell-spec.md:23-24`: mobile 44px and desktop 36px | `independent-finding-copy-action.tsx`, `tracker-issue-copy-actions.tsx`, `audit-finding-status-action.tsx`, `tracker-quick-report-launcher.tsx`: shared Button, 44/36px; submission/clipboard/report drawer untouched | Source match |
| Tracker Live Logs mobile search | `components___listing-page-header.scss:131-164`: full-width through 767px, 44px tall | `tracker-live-logs-explorer.tsx:171-174`: min-w-0 w-full basis-full through 767px, md inline, Input min-h-11 | Source match |
| Known Errors narrow form | `old-lms-shell.css:73`: compact columns only above 767px | `known-errors-workspace.tsx:86`: 3 columns at `md`, stacked before 768px (previously stacked only below 640px) | Source breakpoint corrected |

The repeated-error edits are captured by `scripts/codemods/chat18-error-recovery.cjs`; four independent tracker leaf actions by `chat18-tracker-leaf-actions.cjs`. Both use exact source guards and are idempotent; **not executed**.

### Scope-wide source grep-equivalent proof on latest branch

The current full 87-file queue was re-fetched in 9 GitHub batches (indices 0–9, 10–19, 20–29, 30–39, 40–49, 50–59, 60–69, 70–79, 80–86) **after** modifying the visible page/error/control sources. The exact source regexes were applied to all 87 files. Results:

| Search expression | Total count | Written exemption |
| --- | ---: | --- |
| Opening native visible button, input, select, textarea, or table | 0 | None |
| Native hidden input | 1 | `tracker/audit-findings/page.tsx:99` hidden `view` query field; no paint |
| `#[0-9a-fA-F]{6}` in queued TSX | 0 | CSS-module hex is intentionally outside this TSX pattern |
| `<h1` in queued TSX | 0 | Shared PageHeader owns h1 |
| `border-b-2` in queued TSX | 0 | Shared Tabs used |
| Literal `fixed inset-0` or dialog role text | 1 | `recruiter-conversation-live-refresh.tsx:15` contains a `document.querySelector` test for an open dialog; it **does not create a modal** |
| New custom authored overlays | 0 | Dialogs/Drawers continue using shared primitives |

**Repeatable grep equivalent**, saved as a read-only source assertion script `scripts/codemods/chat18-secondary-parity-check.cjs`. The script asserts 87 files and exemptions above, and verifies 10 legacy value/responsive source patterns. It was authored and committed but NOT run. Owner can run:

```sh
node scripts/codemods/chat18-secondary-parity-check.cjs
node scripts/codemods/chat18-source-audit.cjs
grep -rnE '<(button|input|select|textarea|table)([ >])|#[0-9a-fA-F]{6}|fixed inset-0|role="(dialog|alertdialog)"' 'src/app/(authenticated)/hr' 'src/app/(authenticated)/recruiter' 'src/app/(authenticated)/tracker' src/components/hr src/components/tracker
```

No app/test/CI runs; route JSX was read back manually. The error wrappers use legal self-closing ErrorState with JSX-valued `action` props; a naive regex splitting on the inner Button incorrectly reports unmatched ErrorState, so it is not presented as parser proof. Existing retry callbacks, query parameters, security scoping, IST formatting, and notifications were left intact.

### Strict ticks and next exact file

**10/87 complete (pure redirects/effects without owned paint), 77/87 visually rendered items remain unticked**. This turn supplied source-value, coverage and responsive *declaration* evidence but did not obtain the real computed CSS/default/hover/active/focus/disabled/loading/error matrices and phone/tablet/desktop old-vs-vNext captures needed for true pixel-perfect closure. We do not mark these items [x] on incomplete proof.

**Next unticked queue item:** `src/app/(authenticated)/hr/activity/error.tsx` — computed inline ErrorState and recovery-button parity first; then `hr/activity/loading.tsx`, `hr/activity/page.tsx`, and recruiter calendar viewport comparison.


### Second successor micro-batch — tracker report and detail navigation

Owner rule: no PageHeader eyebrow, stand-alone per-section cards, or small phone targets. This follow-on batch touches only the tracker source queue. No shared primitives or global CSS were edited.

| File and state | Legacy measurement/source | vNext source declaration | Status |
| --- | --- | --- | --- |
| `tracker/page.tsx` report link | `old-lms-shell-spec.md:23-24` desktop 36px, `old-lms-shell.css:73-85` mobile max 767px, mobile min 44px | My reports action now `min-h-11 md:min-h-9`; retains href and focus outline | Declared value proof; computed paint open |
| `tracker/mine/page.tsx` (normal/error/list) | `old-lms-pages.md:4-11` inline link/button, one canvas; mobile 44px | Three existing links (retry, report new, report detail) use `inline-flex min-h-11 md:min-h-9`; status, copy and URLs untouched | All three route states covered by source |
| `tracker/mine/[publicId]/page.tsx` | Same legacy mobile links and white canvas | Back-to-reports action `min-h-11 md:min-h-9`; original authorized data and status/createdAt unchanged | Source dimensions |
| `tracker/audit-findings/[publicId]/page.tsx` | Same navigation, source report metadata as content, hairline sections | Back and Looks similar actions now 44px phone/36px desktop; other sections and event timeline unchanged | Source dimensions |
| `tracker/issues/[publicId]/page.tsx` missing runtime | `old-lms-pages.md:4-7`: inline error state rather than a second independent rounded card | Replaced ad-hoc `rounded border bg-surface p-5` unavailable message with shared `ErrorState`; PageHeader/Nav retained | One-canvas anatomy corrected |
| `tracker/issues/[publicId]/page.tsx` authorized detail | `old-lms-shell.css:73-85`: phone through 767px; `old-lms-pages.md:4-11`: hairline detail rows, 36px outlined desktop controls | Grid fields single-column to 767px, 2 columns 768+, 3 at lg; 3 scoped pager/back links now 44px phone/36px desktop | Source responsive proof |

The five-file transformation and exact source guards were saved as `scripts/codemods/chat18-tracker-detail-links.cjs`, which is idempotent and supports `--dry-run`. The script was not executed; branch edits were written through the GitHub connector. The queued native-control source coverage remains 87/87 with one explicitly exempt input type=hidden and one non-rendering dialog selector string.

### Strict status after this batch

The owner requires value rows for default, hover, active, focus, disabled, loading and error where applicable, plus true old-vs-vNext responsive comparison. The source checks above establish only the layout declarations and route JSX; they do not replace computed-style inspection or real 375px/768px/1280px viewport proof. **Still 10/87 ticked; 77 open.** No CI, app execution, Node script execution or screenshots.

**Next item:** `src/app/(authenticated)/tracker/audit-findings/[publicId]/page.tsx` — finish old-vs-new computed detail typography, link and event timeline at 375/768/1280px, then `src/app/(authenticated)/tracker/issues/[publicId]/page.tsx`.


### Tracker independent-finding event timeline final source correction

`src/app/(authenticated)/tracker/audit-findings/[publicId]/page.tsx`: the audit event history now renders `<ol className="mt-3 divide-y divide-border border-y border-border text-sm">` with each event in `<li className="py-3">`, rather than rounded/separately-spaced rows. This follows `docs/design/old-lms-pages.md:6,9-11` (one continuous hairline-bordered list, not a card per row). Dates remain formatted in Asia/Kolkata, descriptions and keys unchanged. Phone/tablet layout is one column without horizontal overflow by declaration. Exact inherited font, line-height, hover/focus, disabled and real viewport parity remain open; no visual tick claimed.

Scope remains: **10/87 strict-complete files, 77/87 open**. The full source scan and repeatable assertions from the preceding section remain valid (this change introduces no native control, custom overlay, `h1` or hex in queued TSX). The CSS module is a supporting file outside the 87-item queue and is not added as an arbitrary extra tick.
