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
