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
- [ ] `src/app/(authenticated)/hr/colleges/page.tsx`
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
- [ ] `src/app/(authenticated)/hr/messages/page.tsx`
- [ ] `src/app/(authenticated)/hr/notifications/error.tsx`
- [ ] `src/app/(authenticated)/hr/notifications/loading.tsx`
- [ ] `src/app/(authenticated)/hr/notifications/page.tsx`
- [ ] `src/app/(authenticated)/hr/company/reports/page.tsx:333-344`

### Recruiter secondary aliases (15 files)
- [ ] `src/app/(authenticated)/recruiter/calendar/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/calendar/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/calendar/page.tsx`
- [ ] `src/app/(authenticated)/recruiter/colleges/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/colleges/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/colleges/page.tsx`
- [ ] `src/app/(authenticated)/recruiter/company/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/company/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/company/page.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/messages/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/messages/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/messages/page.tsx`
- [ ] `src/app/(authenticated)/recruiter/messages/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/messages/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/messages/page.tsx`

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
- [ ] `src/app/(authenticated)/tracker/issues/page.tsx:152-185`
- [ ] `src/app/(authenticated)/tracker/issues/page.tsx:152-190`

### HR conversation, bell, notification controls (7 files)
- [ ] `src/components/hr/hr-notification-read-button.tsx`
- [ ] `src/components/hr/hr-recruiter-bell.tsx`
- [ ] `src/components/hr/recruiter-conversation-live-refresh.tsx`
- [ ] `src/components/hr/recruiter-conversation-read-control.tsx`
- [ ] `src/components/hr/recruiter-conversation-reply-form.tsx`
- [ ] `src/components/hr/recruiter-decision-read-button.tsx`
- [ ] `src/components/hr/recruiter-notification-bell.tsx`

### Tracker supporting components (17 files)
- [ ] `src/components/tracker/audit-finding-filter-memory.tsx`
- [ ] `src/components/tracker/audit-finding-filter-persistence.tsx`
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

## STRICT TICK RULE closure

- [ ] HR secondary visual coverage (missing: complete file-by-file matched property table, exact aggregate greps, phone/tablet proof and visual comparison).
- [ ] HR secondary tabs/chips/dynamic-class parity (missing: source values across all default/hover/focus/disabled states).
- [ ] Recruiter aliases/notifications/bell parity (missing: CSS computed-style and responsive proof).
- [ ] Tracker audit/logs/issues parity (missing: full supporting component sweep, responsive proof and source-value closure).
- [ ] Zero regression (missing: TS strict parse/typecheck and browser checks; intentionally not run).

## Next file

`src/app/(authenticated)/tracker/logs/page.tsx` — audit logs/known-error toolbar and list states, then `src/components/tracker/known-errors-workspace.tsx`.
