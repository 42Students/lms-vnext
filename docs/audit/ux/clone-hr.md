# HR / recruiter portal clone audit (chat-15)

Reference checkpoint: main `d915bd67b20838f496d2a5b25b4365e748a35dd5` on 2026-10-19; lane `chatgpt/chat-15-b` fast-forwarded to it before edits. Source of truth: `docs/design/ui-clone-checklist.md` STRICT TICK RULE; `docs/design/old-lms-pages.md`, `docs/design/legacy-styles/` and `docs/design/old-lms-shell.css`. Content, behavior and wording are preserved.

## Work queue

Inventory from the repository's recursively enumerated Git trees (not a claim of clean greps). Audit patterns to apply on every file: `grep -nE '<(button|select|input|textarea|table)([ >])|#[0-9a-fA-F]{3,8}|fixed inset-0|role="(dialog|alertdialog)"' <file>`; additional `PageHeader` and `components/ui` import search. Raw hidden inputs without class strings may be documented exemptions. Do not tick until complete search counts and source-level value tables are recorded.

Priority: HR drive draft, applicant review, offers, rounds, drives, company reports; recruiter alias pages; tracker tables; the following recruiter-specific placements components; rest of the complete route inventory. Shared UI files are excluded from edits.

### 1. `src/app/(authenticated)/hr` — 71 TSX files

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
- [ ] `src/app/(authenticated)/hr/drives/[jobId]/interview-slots/error.tsx`
- [ ] `src/app/(authenticated)/hr/drives/[jobId]/interview-slots/loading.tsx`
- [ ] `src/app/(authenticated)/hr/drives/[jobId]/interview-slots/page.tsx`
- [ ] `src/app/(authenticated)/hr/drives/[jobId]/messages/error.tsx`
- [ ] `src/app/(authenticated)/hr/drives/[jobId]/messages/loading.tsx`
- [ ] `src/app/(authenticated)/hr/drives/[jobId]/messages/page.tsx`
- [ ] `src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/error.tsx`
- [ ] `src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/loading.tsx`
- [ ] `src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/page.tsx`
- [ ] `src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/remove/[roundId]/error.tsx`
- [ ] `src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/remove/[roundId]/loading.tsx`
- [ ] `src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/remove/[roundId]/page.tsx`
- [ ] `src/app/(authenticated)/hr/drives/error.tsx`
- [ ] `src/app/(authenticated)/hr/drives/loading.tsx`
- [ ] `src/app/(authenticated)/hr/drives/new/error.tsx`
- [ ] `src/app/(authenticated)/hr/drives/new/loading.tsx`
- [ ] `src/app/(authenticated)/hr/drives/new/page.tsx`
- [ ] `src/app/(authenticated)/hr/drives/page.tsx`
- [ ] `src/app/(authenticated)/hr/drives/proposals/error.tsx`
- [ ] `src/app/(authenticated)/hr/drives/proposals/loading.tsx`
- [ ] `src/app/(authenticated)/hr/drives/proposals/page.tsx`
- [ ] `src/app/(authenticated)/hr/drives/recorded-outside/error.tsx`
- [ ] `src/app/(authenticated)/hr/drives/recorded-outside/loading.tsx`
- [ ] `src/app/(authenticated)/hr/drives/recorded-outside/page.tsx`
- [ ] `src/app/(authenticated)/hr/error.tsx`
- [ ] `src/app/(authenticated)/hr/home/error.tsx`
- [ ] `src/app/(authenticated)/hr/home/loading.tsx`
- [ ] `src/app/(authenticated)/hr/home/page.tsx`
- [ ] `src/app/(authenticated)/hr/layout.tsx`
- [ ] `src/app/(authenticated)/hr/loading.tsx`
- [ ] `src/app/(authenticated)/hr/messages/error.tsx`
- [ ] `src/app/(authenticated)/hr/messages/loading.tsx`
- [ ] `src/app/(authenticated)/hr/messages/page.tsx`
- [ ] `src/app/(authenticated)/hr/not-found.tsx`
- [ ] `src/app/(authenticated)/hr/notifications/error.tsx`
- [ ] `src/app/(authenticated)/hr/notifications/loading.tsx`
- [ ] `src/app/(authenticated)/hr/notifications/page.tsx`
- [ ] `src/app/(authenticated)/hr/placements/error.tsx`
- [ ] `src/app/(authenticated)/hr/placements/jobs/[jobId]/error.tsx`
- [ ] `src/app/(authenticated)/hr/placements/jobs/[jobId]/loading.tsx`
- [ ] `src/app/(authenticated)/hr/placements/jobs/[jobId]/not-found.tsx`
- [ ] `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx`
- [ ] `src/app/(authenticated)/hr/placements/loading.tsx`
- [ ] `src/app/(authenticated)/hr/placements/page.tsx`
- [ ] `src/app/(authenticated)/hr/profile/error.tsx`
- [ ] `src/app/(authenticated)/hr/profile/loading.tsx`
- [ ] `src/app/(authenticated)/hr/profile/page.tsx`
- [ ] `src/app/(authenticated)/hr/round-results/error.tsx`
- [ ] `src/app/(authenticated)/hr/round-results/loading.tsx`
- [ ] `src/app/(authenticated)/hr/round-results/page.tsx`

### 2. `src/app/(authenticated)/recruiter` — 53 TSX files

- [ ] `src/app/(authenticated)/recruiter/calendar/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/calendar/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/calendar/page.tsx`
- [ ] `src/app/(authenticated)/recruiter/colleges/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/colleges/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/colleges/page.tsx`
- [ ] `src/app/(authenticated)/recruiter/company/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/company/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/company/page.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/change-requests/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/change-requests/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/change-requests/page.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/interview-slots/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/interview-slots/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/interview-slots/page.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/messages/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/messages/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/messages/page.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/page.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/page.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/remove/[roundId]/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/remove/[roundId]/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/remove/[roundId]/page.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/new/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/new/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/new/page.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/page.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/proposals/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/proposals/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/proposals/page.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/recorded-outside/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/recorded-outside/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/recorded-outside/page.tsx`
- [ ] `src/app/(authenticated)/recruiter/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/home/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/home/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/home/page.tsx`
- [ ] `src/app/(authenticated)/recruiter/layout.tsx`
- [ ] `src/app/(authenticated)/recruiter/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/messages/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/messages/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/messages/page.tsx`
- [ ] `src/app/(authenticated)/recruiter/not-found.tsx`
- [ ] `src/app/(authenticated)/recruiter/page.tsx`
- [ ] `src/app/(authenticated)/recruiter/profile/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/profile/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/profile/page.tsx`

### 3. `src/app/(authenticated)/tracker` — 21 TSX files

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

### 4. `src/components/hr` — 19 TSX files

- [ ] `src/app/(authenticated)/tracker/issues/page.tsx`
- [ ] `src/components/hr/hr-notification-read-button.tsx`
- [ ] `src/components/hr/hr-recruiter-bell.tsx`
- [ ] `src/components/hr/hr-unsent-drive-alert.tsx`
- [ ] `src/components/hr/recruiter-applicant-review-drawer.tsx`
- [ ] `src/components/hr/recruiter-conversation-live-refresh.tsx`
- [ ] `src/components/hr/recruiter-conversation-read-control.tsx`
- [ ] `src/components/hr/recruiter-conversation-reply-form.tsx`
- [ ] `src/components/hr/recruiter-decision-read-button.tsx`
- [ ] `src/components/hr/recruiter-designation-editor.tsx`
- [ ] `src/components/hr/recruiter-display-name-editor.tsx`
- [ ] `src/components/hr/recruiter-drive-focus-refresh.tsx`
- [ ] `src/components/hr/recruiter-notification-bell.tsx`
- [ ] `src/components/hr/recruiter-private-rating-editor.tsx`
- [ ] `src/components/hr/recruiter-profile-access.tsx`
- [ ] `src/components/hr/recruiter-profile-details-editor.tsx`
- [ ] `src/components/hr/recruiter-request-cancel-button.tsx`
- [ ] `src/components/hr/recruiter-request-feedback.tsx`
- [ ] `src/components/hr/recruiter-round-inline-editor.tsx`

### 5. `src/components/tracker` — 17 TSX files

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

### Recruiter-specific placement surfaces to inspect

- [ ] `src/components/placements/recruiter-focused-review-shortcuts.tsx`
- [ ] `src/components/placements/recruiter-interview-slot-form.tsx`
- [ ] `src/components/placements/recruiter-placement-portfolio.tsx`
- [ ] `src/components/placements/recruiter-result-controls.tsx`
- [ ] `src/components/placements/recruiter-resume-download.tsx`
- [ ] `src/components/placements/recruiter-request-queue.tsx`
- [ ] `src/components/placements/recorded-outside-form.tsx`

## Checks and exceptions

- [ ] H HR/recruiter pages (missing: full raw-control/hex/modal/table grep over the complete queue, every matching legacy/vNext file:line value table, responsive proof, and visual verification). No blanket completion claim.
- [ ] H tracker pages (missing: full page and component grep, source value tables and responsive proof).
- [ ] H recruiter-specific placements (missing: all recruiter usages and legacy comparison).
- [ ] E8 AG Grid parity (missing: `src/components/tpo/grid/tpo-grid.tsx`, `grid-workspace.tsx` and `docs/design/legacy-grid/` on this main revision; do not substitute an invented grid API). See `clone-sheets.md`.

### Initial evidence and migrated source scan

- Before this turn, the HR route scan found 28 native hidden inputs across 11 pages, and no raw visible buttons/selects/textareas/tables or hex literals. These 28 are now shared `<Input type="hidden" />` elements, with college scopes, actions and values unchanged. Re-reading the 11 changed files confirmed zero raw control tags and exactly one shared `Input` import per changed file.
- The 19 `src/components/hr/*.tsx` files had no raw control/table/hex instances in the source-level scan after the shared-control imports and button states were updated. One `[role="dialog"]` literal in `recruiter-conversation-live-refresh.tsx:15` is a `querySelector` guard, **not** custom dialog JSX.
- Sample audit expression for the TSX search: `/<(button|input|select|textarea|table)\\b|#[0-9a-fA-F]{3,8}\\b|fixed inset-0|role=["\x27](?:dialog|alertdialog)["\x27]/g`. Route files searched: 71/71; HR component files: 19/19. The post-edit raw-control count for those 90 files is **0**. This is source coverage only, not a legacy value or viewport proof.
- `src/components/hr/recruiter-designation-editor.tsx`, `recruiter-display-name-editor.tsx`, `recruiter-private-rating-editor.tsx`, `recruiter-profile-details-editor.tsx`, `recruiter-round-inline-editor.tsx` and `hr-drive-draft-form.tsx`: duplicated imports of shared UI controls discovered in current source; fix before other JSX transformations.

### Strict tick proof template (still open)

| Property/state | Legacy value and file:line | vNext value and file:line | Exact match? |
| --- | --- | --- | --- |
| Default, hover, active, focus, disabled, pending/error and responsive properties | *Pending inspection* | *Pending inspection* | No claim |

Coverage proof: HR route/component scan is recorded above; recruiter alias, tracker and recruiter-specific placements scans remain pending. Full repo-wide `grep -rlE '<(button|select|input|textarea)([ >])' src/app/'(authenticated)'/{hr,recruiter,tracker} src/components/hr src/components/tracker src/components/placements --include='*.tsx'` and exact match counts. Responsive proof: pending side-by-side legacy SCSS breakpoint and viewport rule comparison. NO REGRESSION: open/close tag parity reviewed per changed file, without claiming unrun TS/CI or visual check.

## Next file

`src/app/(authenticated)/tracker/issues/page.tsx`
