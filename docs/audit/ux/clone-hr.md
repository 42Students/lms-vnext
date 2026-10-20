# HR / recruiter portal clone audit (chat-15)

Reference checkpoint: main `d915bd67b20838f496d2a5b25b4365e748a35dd5` on 2026-10-19; lane `chatgpt/chat-15-b` fast-forwarded to it before edits. Source of truth: `docs/design/ui-clone-checklist.md` STRICT TICK RULE; `docs/design/old-lms-pages.md`, `docs/design/legacy-styles/` and `docs/design/old-lms-shell.css`. Content, behavior and wording are preserved.

## Work queue

Inventory from the repository's recursively enumerated Git trees (not a claim of clean greps). Audit patterns to apply on every file: `grep -nE '<(button|select|input|textarea|table)([ >])|#[0-9a-fA-F]{3,8}|fixed inset-0|role="(dialog|alertdialog)"' <file>`; additional `PageHeader` and `components/ui` import search. Raw hidden inputs without class strings may be documented exemptions. Do not tick until complete search counts and source-level value tables are recorded.

Priority: HR drive draft, applicant review, offers, rounds, drives, company reports; recruiter alias pages; tracker tables; the following recruiter-specific placements components; rest of the complete route inventory. Shared UI files are excluded from edits.

### 1. `src/app/(authenticated)/hr` — 71 TSX files

- [ ] `src/app/(authenticated)/hr/activity/error.tsx`
- [x] `src/app/(authenticated)/hr/activity/loading.tsx` (own DOM/styles: 0; shared GracefulPageLoading only; native/hex/overlay 0; states/phone/tablet delegated unchanged; value proof: own values N/A)
- [ ] `src/app/(authenticated)/hr/activity/page.tsx`
- [ ] `src/app/(authenticated)/hr/calendar/error.tsx`
- [x] `src/app/(authenticated)/hr/calendar/loading.tsx` (own DOM/styles: 0; shared GracefulPageLoading only; native/hex/overlay 0; states/phone/tablet delegated unchanged; value proof: own values N/A)
- [ ] `src/app/(authenticated)/hr/calendar/page.tsx`
- [x] `src/app/(authenticated)/hr/colleges/error.tsx` (own DOM/styles: 0; shared GracefulErrorBoundary only; native/hex/overlay 0; states/phone/tablet delegated unchanged; value proof: own values N/A)
- [x] `src/app/(authenticated)/hr/colleges/loading.tsx` (own DOM/styles: 0; shared GracefulPageLoading only; native/hex/overlay 0; states/phone/tablet delegated unchanged; value proof: own values N/A)
- [x] `src/app/(authenticated)/hr/colleges/page.tsx` (own markup: none; source scan: 0 raw controls / 0 inline hex / 0 custom UI / 0 breakpoint rules; route shim only)
- [ ] `src/app/(authenticated)/hr/company/error.tsx`
- [x] `src/app/(authenticated)/hr/company/loading.tsx` (single shared `GracefulPageLoading` only; own JSX DOM/styles: 0; source native/hex/overlay: 0; default/error/loading/mobile/tablet props delegated, N/A locally)
- [ ] `src/app/(authenticated)/hr/company/page.tsx`
- [ ] `src/app/(authenticated)/hr/company/reports/error.tsx`
- [x] `src/app/(authenticated)/hr/company/reports/loading.tsx` (single shared `GracefulPageLoading` only; own JSX DOM/styles: 0; source native/hex/overlay: 0; default/error/loading/mobile/tablet props delegated, N/A locally)
- [ ] `src/app/(authenticated)/hr/company/reports/page.tsx`
- [ ] `src/app/(authenticated)/hr/conversations/[threadId]/error.tsx`
- [x] `src/app/(authenticated)/hr/conversations/[threadId]/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [ ] `src/app/(authenticated)/hr/conversations/[threadId]/page.tsx`
- [ ] `src/app/(authenticated)/hr/conversations/error.tsx`
- [x] `src/app/(authenticated)/hr/conversations/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [ ] `src/app/(authenticated)/hr/conversations/page.tsx`
- [ ] `src/app/(authenticated)/hr/drives/[jobId]/interview-slots/error.tsx`
- [x] `src/app/(authenticated)/hr/drives/[jobId]/interview-slots/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [ ] `src/app/(authenticated)/hr/drives/[jobId]/interview-slots/page.tsx`
- [ ] `src/app/(authenticated)/hr/drives/[jobId]/messages/error.tsx`
- [x] `src/app/(authenticated)/hr/drives/[jobId]/messages/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [ ] `src/app/(authenticated)/hr/drives/[jobId]/messages/page.tsx`
- [ ] `src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/error.tsx`
- [x] `src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [ ] `src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/page.tsx`
- [ ] `src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/remove/[roundId]/error.tsx`
- [x] `src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/remove/[roundId]/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [ ] `src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/remove/[roundId]/page.tsx`
- [ ] `src/app/(authenticated)/hr/drives/error.tsx`
- [x] `src/app/(authenticated)/hr/drives/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [ ] `src/app/(authenticated)/hr/drives/new/error.tsx`
- [x] `src/app/(authenticated)/hr/drives/new/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [ ] `src/app/(authenticated)/hr/drives/new/page.tsx`
- [ ] `src/app/(authenticated)/hr/drives/page.tsx`
- [ ] `src/app/(authenticated)/hr/drives/proposals/error.tsx`
- [x] `src/app/(authenticated)/hr/drives/proposals/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [ ] `src/app/(authenticated)/hr/drives/proposals/page.tsx`
- [ ] `src/app/(authenticated)/hr/drives/recorded-outside/error.tsx`
- [x] `src/app/(authenticated)/hr/drives/recorded-outside/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [ ] `src/app/(authenticated)/hr/drives/recorded-outside/page.tsx`
- [ ] `src/app/(authenticated)/hr/error.tsx`
- [ ] `src/app/(authenticated)/hr/home/error.tsx`
- [x] `src/app/(authenticated)/hr/home/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [ ] `src/app/(authenticated)/hr/home/page.tsx`
- [x] `src/app/(authenticated)/hr/layout.tsx` (own markup: none; source scan: 0 raw controls / 0 inline hex / 0 custom UI / 0 breakpoint rules; route shim only)
- [ ] `src/app/(authenticated)/hr/loading.tsx`
- [ ] `src/app/(authenticated)/hr/messages/error.tsx`
- [x] `src/app/(authenticated)/hr/messages/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [x] `src/app/(authenticated)/hr/messages/page.tsx` (own markup: none; source scan: 0 raw controls / 0 inline hex / 0 custom UI / 0 breakpoint rules; route shim only)
- [ ] `src/app/(authenticated)/hr/not-found.tsx`
- [ ] `src/app/(authenticated)/hr/notifications/error.tsx`
- [x] `src/app/(authenticated)/hr/notifications/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [ ] `src/app/(authenticated)/hr/notifications/page.tsx`
- [ ] `src/app/(authenticated)/hr/placements/error.tsx`
- [ ] `src/app/(authenticated)/hr/placements/jobs/[jobId]/error.tsx`
- [x] `src/app/(authenticated)/hr/placements/jobs/[jobId]/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [ ] `src/app/(authenticated)/hr/placements/jobs/[jobId]/not-found.tsx`
- [ ] `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx`
- [x] `src/app/(authenticated)/hr/placements/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [ ] `src/app/(authenticated)/hr/placements/page.tsx`
- [ ] `src/app/(authenticated)/hr/profile/error.tsx`
- [x] `src/app/(authenticated)/hr/profile/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [ ] `src/app/(authenticated)/hr/profile/page.tsx`
- [ ] `src/app/(authenticated)/hr/round-results/error.tsx`
- [x] `src/app/(authenticated)/hr/round-results/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [ ] `src/app/(authenticated)/hr/round-results/page.tsx`

### 2. `src/app/(authenticated)/recruiter` — 53 TSX files

- [ ] `src/app/(authenticated)/recruiter/calendar/error.tsx`
- [x] `src/app/(authenticated)/recruiter/calendar/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [x] `src/app/(authenticated)/recruiter/calendar/page.tsx` (zero own DOM; re-export, redirect, or role-only layout; own visual values/responsive: N/A; fetched source scan: native/hex/heading/overlays 0/0/0/0)
- [ ] `src/app/(authenticated)/recruiter/colleges/error.tsx`
- [x] `src/app/(authenticated)/recruiter/colleges/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [x] `src/app/(authenticated)/recruiter/colleges/page.tsx` (zero own DOM; re-export, redirect, or role-only layout; own visual values/responsive: N/A; fetched source scan: native/hex/heading/overlays 0/0/0/0)
- [ ] `src/app/(authenticated)/recruiter/company/error.tsx`
- [x] `src/app/(authenticated)/recruiter/company/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [x] `src/app/(authenticated)/recruiter/company/page.tsx` (zero own DOM; re-export, redirect, or role-only layout; own visual values/responsive: N/A; fetched source scan: native/hex/heading/overlays 0/0/0/0)
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/change-requests/error.tsx`
- [x] `src/app/(authenticated)/recruiter/drives/[jobId]/change-requests/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/change-requests/page.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/interview-slots/error.tsx`
- [x] `src/app/(authenticated)/recruiter/drives/[jobId]/interview-slots/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [x] `src/app/(authenticated)/recruiter/drives/[jobId]/interview-slots/page.tsx` (zero own DOM; re-export, redirect, or role-only layout; own visual values/responsive: N/A; fetched source scan: native/hex/heading/overlays 0/0/0/0)
- [x] `src/app/(authenticated)/recruiter/drives/[jobId]/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/messages/error.tsx`
- [x] `src/app/(authenticated)/recruiter/drives/[jobId]/messages/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [x] `src/app/(authenticated)/recruiter/drives/[jobId]/messages/page.tsx` (zero own DOM; re-export, redirect, or role-only layout; own visual values/responsive: N/A; fetched source scan: native/hex/heading/overlays 0/0/0/0)
- [x] `src/app/(authenticated)/recruiter/drives/[jobId]/page.tsx` (zero own DOM; re-export, redirect, or role-only layout; own visual values/responsive: N/A; fetched source scan: native/hex/heading/overlays 0/0/0/0)
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/error.tsx`
- [x] `src/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [x] `src/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/page.tsx` (zero own DOM; re-export, redirect, or role-only layout; own visual values/responsive: N/A; fetched source scan: native/hex/heading/overlays 0/0/0/0)
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/remove/[roundId]/error.tsx`
- [x] `src/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/remove/[roundId]/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [x] `src/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/remove/[roundId]/page.tsx` (zero own DOM; re-export, redirect, or role-only layout; own visual values/responsive: N/A; fetched source scan: native/hex/heading/overlays 0/0/0/0)
- [ ] `src/app/(authenticated)/recruiter/drives/error.tsx`
- [x] `src/app/(authenticated)/recruiter/drives/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [ ] `src/app/(authenticated)/recruiter/drives/new/error.tsx`
- [x] `src/app/(authenticated)/recruiter/drives/new/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [x] `src/app/(authenticated)/recruiter/drives/new/page.tsx` (zero own DOM; re-export, redirect, or role-only layout; own visual values/responsive: N/A; fetched source scan: native/hex/heading/overlays 0/0/0/0)
- [x] `src/app/(authenticated)/recruiter/drives/page.tsx` (zero own DOM; re-export, redirect, or role-only layout; own visual values/responsive: N/A; fetched source scan: native/hex/heading/overlays 0/0/0/0)
- [ ] `src/app/(authenticated)/recruiter/drives/proposals/error.tsx`
- [x] `src/app/(authenticated)/recruiter/drives/proposals/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [x] `src/app/(authenticated)/recruiter/drives/proposals/page.tsx` (zero own DOM; re-export, redirect, or role-only layout; own visual values/responsive: N/A; fetched source scan: native/hex/heading/overlays 0/0/0/0)
- [ ] `src/app/(authenticated)/recruiter/drives/recorded-outside/error.tsx`
- [x] `src/app/(authenticated)/recruiter/drives/recorded-outside/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [x] `src/app/(authenticated)/recruiter/drives/recorded-outside/page.tsx` (zero own DOM; re-export, redirect, or role-only layout; own visual values/responsive: N/A; fetched source scan: native/hex/heading/overlays 0/0/0/0)
- [ ] `src/app/(authenticated)/recruiter/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/home/error.tsx`
- [x] `src/app/(authenticated)/recruiter/home/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [x] `src/app/(authenticated)/recruiter/home/page.tsx` (zero own DOM; re-export, redirect, or role-only layout; own visual values/responsive: N/A; fetched source scan: native/hex/heading/overlays 0/0/0/0)
- [x] `src/app/(authenticated)/recruiter/layout.tsx` (zero own DOM; re-export, redirect, or role-only layout; own visual values/responsive: N/A; fetched source scan: native/hex/heading/overlays 0/0/0/0)
- [ ] `src/app/(authenticated)/recruiter/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/messages/error.tsx`
- [x] `src/app/(authenticated)/recruiter/messages/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [x] `src/app/(authenticated)/recruiter/messages/page.tsx` (zero own DOM; re-export, redirect, or role-only layout; own visual values/responsive: N/A; fetched source scan: native/hex/heading/overlays 0/0/0/0)
- [ ] `src/app/(authenticated)/recruiter/not-found.tsx`
- [x] `src/app/(authenticated)/recruiter/page.tsx` (zero own DOM; re-export, redirect, or role-only layout; own visual values/responsive: N/A; fetched source scan: native/hex/heading/overlays 0/0/0/0)
- [ ] `src/app/(authenticated)/recruiter/profile/error.tsx`
- [x] `src/app/(authenticated)/recruiter/profile/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [x] `src/app/(authenticated)/recruiter/profile/page.tsx` (zero own DOM; re-export, redirect, or role-only layout; own visual values/responsive: N/A; fetched source scan: native/hex/heading/overlays 0/0/0/0)

### 3. `src/app/(authenticated)/tracker` — 21 TSX files

- [ ] `src/app/(authenticated)/tracker/audit-findings/[publicId]/error.tsx`
- [x] `src/app/(authenticated)/tracker/audit-findings/[publicId]/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
- [ ] `src/app/(authenticated)/tracker/audit-findings/[publicId]/page.tsx`
- [ ] `src/app/(authenticated)/tracker/audit-findings/error.tsx`
- [x] `src/app/(authenticated)/tracker/audit-findings/loading.tsx` (one shared GracefulPageLoading, own DOM/style/hex/raw controls: 0; no local state values or breakpoints; delegate unchanged)
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

- [ ] `src/components/hr/hr-drive-draft-form.tsx`
- [ ] `src/components/hr/hr-notification-read-button.tsx`
- [ ] `src/components/hr/hr-recruiter-bell.tsx`
- [ ] `src/components/hr/hr-unsent-drive-alert.tsx`
- [ ] `src/components/hr/recruiter-applicant-review-drawer.tsx`
- [x] `src/components/hr/recruiter-conversation-live-refresh.tsx` (null-only nonvisual helper; source controls/hex/DOM/overlays 0; own CSS, hover, focus and responsive: N/A; existing effect unchanged)
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
- [ ] `src/components/hr/hr-round-editor-grid.tsx` (new scoped desktop hiring-round metadata grid; native runtime and pixel states pending)
- [ ] `src/components/hr/recruiter-round-inline-editor.tsx`

### 5. `src/components/tracker` — 17 TSX files

- [x] `src/components/tracker/audit-finding-filter-memory.tsx` (null-only nonvisual helper; source controls/hex/DOM/overlays 0; own CSS, hover, focus and responsive: N/A; existing effect unchanged)
- [x] `src/components/tracker/audit-finding-filter-persistence.tsx` (null-only nonvisual helper; source controls/hex/DOM/overlays 0; own CSS, hover, focus and responsive: N/A; existing effect unchanged)
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
- [ ] `src/components/placements/hr-recruiter-drives-grid.tsx` (new desktop sheet; source-wired, native engine/install/viewport proof pending)
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

`src/app/(authenticated)/hr/drives/page.tsx`

## chat-15 bounded turn — source-level changes after main sync

Synced lane fast-forward against origin/main `46cd0161a0e289e7da68e615359589b03ee463e9` with no unique commits before starting. The present scoped revisions are **not** a complete STRICT TICK RULE closure; every H checkbox above remains open.

| Visual/behaviour judgement | Old LMS source | Inspected vNext source | Result |
| --- | --- | --- | --- |
| One white canvas, embedded compact sheet | `docs/design/old-lms-pages.md:6-12` | `src/app/(authenticated)/hr/company/reports/page.tsx:333-344` | Shared grid fallback wired; visual match unverified |
| Tab teal underline and tab count | `docs/design/old-lms-pages.md:7-10` | `src/components/ui/tabs.tsx:77-91`; `src/app/(authenticated)/hr/round-results/page.tsx:66-79` | Uses shared tabs; full keyboard/viewport proof pending |
| Status pills vs inline text | `docs/design/old-lms-pages.md:11-12` | `src/app/(authenticated)/tracker/issues/page.tsx:152-185`, `src/app/(authenticated)/hr/drives/page.tsx:184-188`, `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:670-697` | Shared `StatusBadge` used; exact legacy palette on every status unverified |
| Selected college quick filters | `docs/design/old-lms-pages.md:8-9` | `src/components/ui/needs-doing-chips.tsx:31-57` and HR Home/Drives/Company/Conversations pages | Dynamic link classes removed; selected and focus behaviour available, not visually tested |
| Tracker issue table | `docs/design/old-lms-pages.md:10-12` | `src/app/(authenticated)/tracker/issues/page.tsx:152-190` | Shared `DataTable` preserves issue, reporter, severity, status, environment, location and date plus open action |
| AG Grid Quartz | `docs/design/ui-clone-checklist.md` E8 | `src/components/tpo/grid/tpo-grid.tsx:12-17` | **Missing native engine**; shared-table fallback explicitly identified |

- [ ] H complete HR, recruiter and tracker portal sweep (missing: 53 recruiter alias files and all tracker/support component value comparisons; exhaustive full-source greps, exact per-state property table, phone/tablet proof, and JSX/runtime verification).
- [ ] E8 native AG Grid (missing Quartz/source/dependency verification; see `docs/audit/ux/clone-sheets.md`).
- [ ] Re-check current main codemod raw-control findings before citing the old 90-file count; the earlier scan is historical evidence, not proof at the newly synced revision.

No CI, typecheck, tests, local app or browser checks were executed. Source control-only changes used exact opening/closing JSX pairs where applicable. Next: `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx` selection/offer sheet accessibility and row actions, followed by `src/app/(authenticated)/hr/drives/page.tsx` export and list toolbar.

## 2026-10-19 continuation — SMARTER PLAN codemod

- [ ] HR/recruiter PageHeader role-label judgement case: `scripts/codemods/chat15-hr-header-eyebrows.cjs` targets static `eyebrow="Recruiter"` / `"Employer Recruiter"` only in the HR/recruiter route trees; dry-run: `node scripts/codemods/chat15-hr-header-eyebrows.cjs`; apply: `node scripts/codemods/chat15-hr-header-eyebrows.cjs --apply`. **Script committed but not run**; orchestrator owns local run and source/captured style verification. Keep dynamic eyebrow/description expressions unchanged.

## 2026-10-19 chat-15 continuation — HR source judgement cases

Main at turn start: `5a2abb4bba7e3bcfcf7523ffde18a0346e3590ed`; lane was fast-forwarded before changes. The SMARTER PLAN block was read. The requested computed-style `docs/audit/ux/parity-report.md` was not present in the inspected repository, so the evidence below is **source-level only**.

| Source reference | HR/recruiter vNext source | Outcome / limitation |
| --- | --- | --- |
| `docs/design/old-lms-pages.md:6-12` single canvas and compact sheet | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:354-382,644-685` | Removed decorative nested cards around job facts, funnel, readiness and selection history; page content unchanged; no screenshot proof |
| `docs/design/old-lms-pages.md:9-11` tabs, filters, table rows | `src/app/(authenticated)/hr/notifications/page.tsx:44-61` | College chips and unread-state Tabs use shared kit; original server queries, search form, CSV link and pagination retained |
| `docs/design/old-lms-pages.md:10-12` sheet, status and summary strip | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx:663-706,822-835` | Selection/offer/round rows now use shared `TpoGrid` fallback; original status labels, export link and pagination preserved; native AG Grid not supplied |
| `docs/design/old-lms-pages.md:6-9` title/action row | `src/app/(authenticated)/hr/notifications/page.tsx:37-40` | Primary conversation action moved into existing `PageHeader.actions`; no duplicated CTA |
| `docs/design/legacy-styles/components___common.scss:22-29` page spacing and mobile main wrap | `src/app/(authenticated)/hr/company/reports/page.tsx:181-193` | Dynamic college buttons replaced by shared chips; unverified mobile measure |

- [ ] **H HR** (missing: actual computed-style parity report; full current revision regex counts, responsive and keyboard validation, grid screenshot/reference; this work is not ticked).
- [ ] **E8** (missing: native ag-grid dependencies/source/Quartz theme; `src/components/tpo/grid/tpo-grid.tsx:12` still declares `shared-table-fallback`; see `clone-sheets.md`).
- [ ] **Remaining next work:** `src/components/placements/recruiter-placement-portfolio.tsx` rich action-card list, then `src/app/(authenticated)/hr/drives/page.tsx` toolbar/exports and `src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/page.tsx` per-round value states.

No CI, typecheck, browser or app execution was attempted. All modified TSX files were re-read from the branch after editing; shared UI source was not changed.

### HR drive cards and editable-round judgement-case evidence

- [ ] `src/components/placements/recruiter-placement-portfolio.tsx` now uses `Card as="article"` with both JSX tags balanced, preserving all per-drive Links, metrics, status and pending employer-action notices. Answerable recruiter requests use the warning-subtle token rather than an unrelated muted fill. **Not ticked:** existing legacy drive sheet's complete table/toolbar source and responsive proof are unavailable.
- [ ] `src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/page.tsx` uses `StatusBadge`, shared `Card as="article"`, and `EmptyState`, retaining both authorized CRUD forms, optimistic token fields, and the removal-review Link. **Not ticked:** no rendered/keyboard or legacy SCSS value comparison.
- [ ] `scripts/codemods/chat15-hr-header-eyebrows.cjs` also recognizes `eyebrow="Recruiter · Hiring drive"`. Commit remains script-only (unexecuted), so current source can still contain legacy eyebrow props.

Next file to resume: `src/app/(authenticated)/hr/drives/page.tsx`, inspect its authorized Published/Closed drive list against the old sheet without dropping card actions or inventing AG Grid imports.

## chat-15 HR complete-file batch — 2026-10-19

**Sync and scope:** Fast-forwarded `chatgpt/chat-15-b` to `main` `dba6bbd5456152d9acc1ba31601d9ca32bcab3aa` before this batch. Only the HR route source files in this table were modified; shared UI source remains owned by its lane. `src/components/tpo/grid/tpo-grid.tsx` on that main contains `AgGridReact` and Quartz, but `package.json` lacked `ag-grid-community` and `ag-grid-react` declarations; E8 runtime remains unverified.

### Source scan: exact current branch counts

Read the full UTF-8 content of each named file directly from GitHub after editing, counting with case-sensitive expressions (unlike a case-insensitive grep, shared `<Input>` and `<Button>` are **not** native tags):

```text
/<(button|select|input|textarea|table)(?=[\s/>])/g
/#[0-9a-fA-F]{3,8}\b/g
/<h1\b|<table\b|<button\b|border-b-\[3px\]|rounded-full|aria-pressed/g
```

| File | Native controls/tables | Hex literals | Hand-built h1/tab/pill/toggle markers | Responsive source proof |
| --- | ---: | ---: | ---: | --- |
| `hr/activity/page.tsx` | 0 | 0 | 0 | `flex flex-wrap` toolbar; shared `Tabs` + `NeedsDoingChips` |
| `hr/activity/error.tsx` | 0 | 0 | 0 | shared `PageHeader` / `Alert` with wrapping retry |
| `hr/activity/loading.tsx` | 0 | 0 | 0 | shared `GracefulPageLoading` |
| `hr/drives/page.tsx` | 0 | 0 | 0 | `md:grid-cols-2` cards at 768px; filter bar `flex-wrap`; shared Tabs/Chips |
| `hr/drives/new/page.tsx` | 0 | 0 | 0 | shared chip chooser and one-canvas form |
| `hr/drives/new/loading.tsx` | 0 | 0 | 0 | shared `GracefulPageLoading shape="directory"` |
| `hr/drives/new/error.tsx` | 0 | 0 | 0 | shared `ErrorState` with original retry |
| `hr/drives/proposals/page.tsx` | 0 | 0 | 0 | `flex-wrap` search; `min-w-0 flex-[1_1_12rem]` prevents narrow-screen overflow |
| `hr/drives/proposals/loading.tsx` | 0 | 0 | 0 | shared `GracefulPageLoading shape="directory"` |
| `hr/drives/proposals/error.tsx` | 0 | 0 | 0 | shared `Alert`, `Button`, `flex-wrap` retry |
| `hr/drives/recorded-outside/page.tsx` | 0 | 0 | 0 | shared `NeedsDoingChips`, `EmptyState`, `InlineNotice` |
| `hr/colleges/page.tsx` | 0 | 0 | 0 | pure `redirect("/hr/home")`, no DOM or viewport-dependent content |
| `hr/messages/page.tsx` | 0 | 0 | 0 | re-export shim, no DOM or viewport-dependent content of its own |
| `hr/layout.tsx` | 0 | 0 | 0 | `return children` only (after role guard), no wrapper/style/viewport rules |

These are **source grep-equivalent counts** performed on fetched files; do not mistake them for CLI grep over the entire repository, a render test, or a responsive screenshot. The changed JSX files were re-read; every edited custom paired tag was inspected with both opening and closing tag names intact, while shared components are self-closing.

### Reference-to-source value and breakpoint comparison

| Property and state | Legacy source / value | Current vNext source / value | Status |
| --- | --- | --- | --- |
| Main canvas paint | `docs/design/old-lms-pages.md:6`: white, 12px radius, 1px #e5e9f0, padding 24px | Authenticated shell's shared canvas; page routes add no enclosing card | Inherited; computed proof pending |
| Heading mobile type | `docs/design/legacy-styles/components___listing-page-header.scss:131-137`: max-width 767px, title 20px | `src/components/ui/page-header.tsx:24-32`: base 20px | Exact source value |
| Heading desktop type | `docs/design/old-lms-pages.md:7`: ~30px/600; listing SCSS `components___listing-page-header.scss:53-58` separately says 28px | `src/components/ui/page-header.tsx:24-34`: md 30px, weight 600 | Old sources disagree by 2px; not ticked |
| Page-head responsive row | Listing SCSS `components___listing-page-header.scss:131-158`: at 767px and below, stack | `src/components/ui/page-header.tsx:19-44`: column by default, `md:flex-row` at 768px | Structural breakpoint match; no rendered comparison |
| Compact filters and chips | `old-lms-pages.md:8-10`: chips under heading, 3px active tab underline, compact outlined search | `src/components/ui/needs-doing-chips.tsx:31-54`, `src/components/ui/tabs.tsx:88-92`, `src/components/ui/button.tsx:10-28` | Shared components, style values unverified on these pages |
| Search focus / invalid | `components___form.scss:23-33,130-143`: keyboard-only focus, teal focus, red invalid | `src/styles/legacy-skin.css:138-162` and shared Input/Select | Global skin inherited; interaction untested |
| Actions on narrow screens | `components___listing-page-header.scss:131-158`: mobile actions >=44px | `src/components/ui/page-header.tsx:35-44`; chip links have `min-h-11` below 640px (`needs-doing-chips.tsx:31-54`) | **Gap:** shared chip min-height switches at 640px, while old mobile boundary is 767px; shared UI owner |
| List collapse | `components___listing-page-header.scss:131-158`: mobile ends at 767px | `hr/drives/page.tsx`: use `md:grid-cols-2` on deadline/request objects so two columns only from 768px | Source breakpoint match; not visual proof |
| Info/status/errors | `old-lms-pages.md:11-12`: coloured status pills and slim banners | `StatusBadge`, `Alert`, `ErrorState`, `EmptyState`, `InlineNotice` referenced on the HR routes | Delegated, pixel values and pressed/error states not fully verified |

### Strictly completed route-only shims

- [x] `src/app/(authenticated)/hr/colleges/page.tsx`: no JSX or styles; only redirects to `/hr/home`. **Value table:** typography/background/border/focus/responsive are all N/A (0 rendered DOM). Source scan: 0/0/0. No behavioral change.
- [x] `src/app/(authenticated)/hr/layout.tsx`: checks active recruiter permission, redirects otherwise, then returns `children` without introducing elements. **Value table:** all visual and responsive properties N/A (0 wrapper DOM); role guard remains intact. Source scan 0/0/0.
- [x] `src/app/(authenticated)/hr/messages/page.tsx`: direct re-export of `hr/conversations/page`; no visual DOM, custom UI, CSS, or viewport rules in this **route shim**. Value table all own-properties N/A. Source scan 0/0/0. *Conversation page's independent parity remains unticked.*

All other files in the source-scan table stay **[ ]** because responsive screenshots and complete computed legacy property/state matching have not been done. Converted markup is **not** evidence of exact pixel parity. No CI, typecheck, dev server, browser render, or user-session walkthrough was performed.

**Next unticked HR file:** `src/app/(authenticated)/hr/company/page.tsx` after reviewing the current `hr/drives/page.tsx` partial parity notes, then all remaining HR pages/components and full recruiter aliases.

### Follow-on HR page pass: source-level proof after full-file reread

| Page | Exact post-edit source scan: native elements / hex / hand-built h1-tab-pill-toggle | Shared component contracts | Mobile/tablet comparison and remaining blockers |
| --- | --- | --- | --- |
| `hr/company/page.tsx` | 0 / 0 / 1 avatar-only `rounded-full` | 4 PageHeader sites; Badge (2), StatusBadge (1), Tabs, NeedsDoingChips, Input, Button and EmptyState | `md:grid-cols-2` company facts and `md:grid-cols-3` report tiles start at 768px (SCSS listing header max 767px); avatar circle is intentionally exempt; pixel values pending |
| `hr/company/reports/page.tsx` | 0 / 0 / 0 | 3 PageHeader sites, Chips/Tabs/Select/Input/Button, HrCompanyReportsGrid, EmptyState | `md:grid-cols-2` college chooser, `md:grid-cols-4` report metrics, `md:pb-5` separators; server CSV unchanged; Quartz runtime pending |
| `hr/profile/page.tsx` | 0 / 0 / 0 | 1 PageHeader, shared DataTable and StatusBadge (3), EmptyState, profile editor | Account details `md:grid-cols-2` only from 768px; mobile grid fallback belongs to DataTable owner; validation pending |
| `hr/home/page.tsx` | 0 / 0 / 0 | 3 PageHeader sites, Alert (2), Badge (3), NeedsDoingChips, EmptyState/ErrorState | Task tiles and week-event cards `md:grid-cols-2` at 768px; warnings no longer custom banners; mobile proof is source only |
| `hr/round-results/page.tsx` | 0 / 0 / 0 | 3 PageHeader sites, Tabs, HrRoundResultsGrid, EmptyState/ErrorState, StatusBadge | Drive chooser `md:grid-cols-2` at 768px; authorized round table uses current native `TpoGrid` entrypoint; runtime blocked until AG Grid dependencies are declared |

The native/hex/UI count expression remains that of the previous subsection, applied after re-reading the complete updated source files on this branch. `<Input>`, `<Button>`, `<Select>`, `<Badge>`, and `<Tabs>` are excluded from native-tag counts. The only `rounded-full` in the company page is a decorative recruiter **avatar** (not a custom status chip); retain its circle. Named paired `Alert`, `Badge`, `StatusBadge`, `Button` and `Select` tags were re-read with balanced opening and closing names; shared self-closing wrappers remain self-closing.

Legacy sources checked: `docs/design/old-lms-pages.md:6-12`, `docs/design/legacy-styles/components___listing-page-header.scss:53-58,131-158`, `components___form.scss:23-33,130-143`, `components___antddesign.scss:148-184`. Source contrast: `src/components/ui/page-header.tsx:19-44`, `tabs.tsx:70-94`, `needs-doing-chips.tsx:31-54`, `src/styles/legacy-skin.css:102-162`. The all-state computed style table and phone/tablet screenshots are still missing, so **these five pages remain unticked** under the strict rule.

**HR sheets:** Native `AgGridReact` + Quartz are now in `src/components/tpo/grid/tpo-grid.tsx` on main. `HrCompanyReportsGrid` and `HrRoundResultsGrid` are passed only authorized server rows; no unauthorized client fetch or broadened CSV endpoint was added. The required packages were absent from the inspected `package.json`, and no app was run. Mark integration **source-wired, unverified**, never runtime-complete E8.

**Next high-priority files:** `src/app/(authenticated)/hr/calendar/page.tsx`, `src/app/(authenticated)/hr/conversations/page.tsx`, `src/app/(authenticated)/hr/notifications/page.tsx`, then `src/components/hr/hr-drive-draft-form.tsx`.

## chat-15 extended HR portal whole-file source pass — 2026-10-19

The entire original `71`-file HR route work queue was enumerated from GitHub and inspected in source batches on this lane after the main fast-forward `dba6bbd5456152d9acc1ba31601d9ca32bcab3aa`. The initial scanning caught custom `<h1>` in `company/reports/error.tsx`, `messages/error.tsx`, and `profile/error.tsx`, which were replaced by shared `PageHeader` plus `ErrorState` and preserved retry actions. Hidden form inputs in `drives/[jobId]/messages/page.tsx`, `rounds/editor/page.tsx`, `rounds/editor/remove/[roundId]/page.tsx`, and `placements/jobs/[jobId]/page.tsx` were moved to shared `Input` without changing names, scopes, values or server actions. The re-read on those seven edited files found zero raw controls or custom `h1` tags and zero literal hex values.

### Per-file measured source evidence (final fetched lane contents)

| File | Raw native tags | Literal hex | Custom h1/tabs/pills | Preserved states and responsive proof |
| --- | ---: | ---: | ---: | --- |
| `hr/conversations/page.tsx` | 0 | 0 | 0 | `Tabs`, `NeedsDoingChips`, `ErrorState`, `EmptyState`, `Alert`; `max-md:min-h-11` mobile link targets, original server read/acknowledge forms and query filters |
| `hr/notifications/page.tsx` | 0 | 0 | 0 | `Tabs` replaced hand active underline; `NeedsDoingChips` chooser, `EmptyState`, `ErrorState`; `md` breakpoint for mobile touch targets; original CSV/read receipts |
| `hr/company/reports/error.tsx` | 0 | 0 | 0 | `PageHeader` + `ErrorState` with preserved error copy and Retry, shared responsive wrapping |
| `hr/messages/error.tsx` | 0 | 0 | 0 | `PageHeader` + `ErrorState` with preserved messages failure semantics |
| `hr/profile/error.tsx` | 0 | 0 | 0 | `PageHeader` + `ErrorState` preserving privacy-safe no-inferred-status copy |
| `hr/drives/[jobId]/messages/page.tsx` | 0 | 0 | 0 | Shared `Input`/Button and `EmptyState`; server-authorized scoped conversation remains |
| `hr/drives/[jobId]/rounds/editor/page.tsx` | 0 | 0 | 0 | Shared `Input`, `Select`, `Button`, `Card`, `StatusBadge`, `EmptyState`; forms use `md:grid-cols-2` at 768px |
| `hr/drives/[jobId]/rounds/editor/remove/[roundId]/page.tsx` | 0 | 0 | 0 | Shared `Input` hidden optimistic token, status pill, `Button variant=danger`; read-only/cancel policies untouched |
| `hr/placements/jobs/[jobId]/page.tsx` | 0 | 0 | 0 | Shared page head, tabs, scoped job offers/selection/results `TpoGrid` and hidden input; responsive source/engine runtime unverified |

The first component pass examined all **19 original HR component TSX files** on this main-based lane. Each had zero raw native control elements; these exceptions require judgement: `hr-recruiter-bell.tsx` had two literal fallback `#ff7576` tokens and hand count bubble (now shared `Badge` and variable fallback), `recruiter-conversation-live-refresh.tsx` contains a **string selector** mentioning `role="dialog"` (not rendered custom dialog), and `recruiter-notification-bell.tsx` includes decorative bell/count markers. Two duplicate Button imports in `hr-unsent-drive-alert.tsx` and `recruiter-drive-focus-refresh.tsx` were removed. Their warning notices, the verified request receipt, and reply-composer feedback now use shared Alert/InlineNotice. Confirm/dismiss/optimistic updates and scoped storage are preserved by source contract.

**Value/reference comparison:** `docs/design/old-lms-pages.md:6-12` supplies single canvas (white, radius12, 1px #e5e9f0), page title and toolbar, source `components___listing-page-header.scss:53-58,131-158` specifies 28px desktop/20px mobile and 767px max mobile; `components___antddesign.scss:148-184` specifies focus/disabled/hover, `components___form.scss:23-33,130-143` specifies keyboard-focus/invalid field paint. All these routes use the shared elements/styles: `src/components/ui/page-header.tsx:19-44`, `tabs.tsx:70-94`, `badge.tsx`, `status-badge.tsx`, `src/styles/legacy-skin.css:102-162`. **Gap:** observed `old-lms-pages.md:7` states ~30px desktop while listing SCSS says 28px, and shared PageHeader uses 30px from 768px. No actual computed style screenshots to reconcile. Native `TpoGrid` Quartz is present on current main, but the inspected `package.json` did not list required AG Grid deps. Therefore **no visible page is newly ticked**.

**Exact on-branch source-scan equivalents**, case-sensitive:
`/<(button|input|select|textarea|table)(?=[\\s/>])/g` native tags,
`/#[0-9a-fA-F]{3,8}\\b/g` hex,
`/<h1(?=[\\s>])|rounded-full|border-b-\\[3px\\]|aria-pressed/g` h1/pill/toggle.
The numbers above were collected on fetched current source, not via local CLI/Playwright. Cross-portal or legacy runtime comparison, and every shared component state remain unverified. **Do not tick** remaining `hr/*` work queue entries without computed default/hover/focus/disabled and both viewport screenshots.

**Remaining**: complete `hr/calendar/page.tsx`, other rich HR pages and component variations not closed by this source pass; independently review all `recruiter/*` aliases and tracker scopes. No CI/build/dev server executed.

### Final additional HR calendar and route-state source proof (chat-15)

| File | Legacy reference | Re-read vNext value | Source test and gap |
| --- | --- | --- | --- |
| `hr/calendar/page.tsx` | `components___listing-page-header.scss:131-158`; `old-lms-pages.md:6-12` | Shared PageHeader/Tabs/CalendarGrid; 2 independent event-card objects now `<Card as="article">…</Card>` (2/2 exact JSX match); bad query shows shared `ErrorState` | 0 native control tags, 0 literal hex, 0 handmade page `h1`, no card-in-card introduced. `md:grid` calendar desktop from 768px, `md:hidden` phone/day events; complete computed pixel comparison still missing. |
| `hr/drives/[jobId]/messages/error.tsx` | legacy common failure presentation, `old-lms-pages.md:11-12` | Shared `ErrorState` title, description, button retry | Valid self-closing action wrapper, no custom heading; runtime/retry rendering unverified |
| `hr/round-results/error.tsx` | legacy shared failure state | Shared `ErrorState` with original title and retry | No custom div/h2 shell; responsive handled by kit |
| `hr/round-results/loading.tsx` | `components___antddesign.scss:6-13` loading/transition pattern | `GracefulPageLoading shape="directory"` | No custom pulse blocks, route layout shared; actual motion values unverified |

**Decision:** the next untouched high-complexity surfaces are recruiter calendar interactions/events and HR draft component field/preview nuances. Source markup now uses shared components in many files, but exact old-LMS computed state values and a real phone/tablet comparison are not available. The 3 zero-DOM route shims remain the only definitively ticked per-file items; these visible pages remain [ ] until those proofs are supplied. **No CI, tests, app execution, or browser screenshots were run.**


## 2026-10-19 replacement lane — source-complete route shims and shared-state judgement

Baseline: branch `chatgpt/chat-15-b` was safely fast-forwarded from `59b91901` onto main `68d52934` (0 ahead / 1229 behind beforehand), then changed exclusively on the lane. Other lanes may advance main later. Current source verification was made by re-fetching edited files after writes. No app, test, typecheck, CI, screenshots or pixel-diff were run.

### Completed zero-DOM recruiter route shims (17 files)

These 17 paths are direct re-exports of HR routes, redirects without rendering, or the role-only layout that returns children unchanged. The source itself has **no HTML or JSX element**: 0 native controls, 0 literal hex, 0 h1, 0 hand-rolled table/dialog/overlay. Source-equivalent scan patterns: `/<(button|input|select|textarea|table)(?=[\\s/>])/g`, `/#[0-9a-fA-F]{3,8}\\b/g`, `/<h1(?=[\\s>])/g`, `/fixed inset-0|role=["'](?:dialog|alertdialog)["']/g`, all **0** for each file. This is verified fetched-content scanning, not a claim of a local CLI grep.

| Proof property | Old LMS reference | vNext source | Result |
| --- | --- | --- | --- |
| Own rendered heading/fonts/colours/hover/disabled/error/loading | `docs/design/old-lms-pages.md:6-12` | All 17 shims: zero own DOM | N/A — appearance delegated to target |
| Own canvas, tab, grid or modal | `docs/design/old-lms-pages.md:6-12` | Direct re-export, `redirect()`, or `return children`; zero markup | N/A — no extra wrapper |
| Own mobile/tablet CSS, stacking, interaction or input | `docs/design/legacy-styles/components___listing-page-header.scss:131-158` | Zero own layout or breakpoint rules | N/A — target owns responsive behaviour |
| No-regression | Existing HR route and role checks | Re-export destinations and recruiter role guard unchanged | No source edit to these 17 files |

**Important:** This checks *only* each route shim's own markup. The underlying HR pages, shared UI states, and viewport parity are independent unticked items.

### Edited judgement cases (2026-10-19)

| File | Source change and shared contract | Source-level coverage after edit | Still open |
| --- | --- | --- | --- |
| `src/app/(authenticated)/recruiter/drives/[jobId]/change-requests/page.tsx` | Replaced hand-styled 'Back to drive' Link with `PageBackLink`; unchanged href and visible desktop label. Shared `page-back-link.tsx` implements legacy icon-only at max 767px and min 44px touch | 0 native/hex/h1; no custom table or overlay | Computed hover/focus and phone render |
| `src/components/hr/hr-drive-draft-form.tsx` | Validation issues inside `Alert tone="error"` instead of bespoke bordered `role=alert`; message and list unchanged | 0 native/hex/h1; `Alert` opening/closing 1/1 | Form-row pixel comparison, all preview/error states, tablet |
| `src/components/hr/recruiter-round-inline-editor.tsx` | Success and error feedback now `InlineNotice` from shared UI; pending/author-only guards, dialog and verified receipts untouched | 0 native/hex/h1; 3 shared `InlineNotice` sites | Modal/focus/keyboard and all pending states |
| `src/components/hr/recruiter-notification-bell.tsx` | Shared `Badge tone="error"` replaces local unread count chip; red backdrop and 99+ clipping remain; existing Drawer and polling unchanged | 0 native/hex/h1; `Badge` opening/closing 1/1 | Exact count pill pixel offsets and keyboard |
| `src/components/hr/hr-unsent-drive-alert.tsx` | Error feedback uses shared `InlineNotice tone="error"` within existing `Alert`; draft storage, confirm action and dismissal unchanged | 0 native/hex/h1; `Alert` opening/closing 1/1 | Responsive live/hover/error checks |

Legacy back-link reference is `docs/design/legacy-styles/learn-layout.scss:361-383` as recorded in `src/components/ui/page-back-link.tsx`. Legacy banners / chips / compact canvas reference `docs/design/old-lms-pages.md:6-12`. Shared primitives are not modified. These visible component/page items remain **unticked** until the strict value, viewport and runtime proofs exist.

**Current E8 blocker:** `src/components/tpo/grid/tpo-grid.tsx` imports native AG Grid Quartz, and `grid/grid-workspace.tsx` exists, but `package.json` on the synchronized branch still does **not** declare `ag-grid-community` or `ag-grid-react`; user instructed not to edit the manifest. No AG Grid runtime/parity claim is made.

**Next unticked file:** `src/app/(authenticated)/recruiter/drives/[jobId]/change-requests/page.tsx` (finish shared heading/content/viewport proof), then `src/components/hr/hr-drive-draft-form.tsx` validation/preview states and `src/app/(authenticated)/hr/drives/page.tsx` E8 worksheet.


## chat-15 replacement — HR Drives TpoGrid (source-wired, not strict-complete)

- `src/components/placements/hr-recruiter-drives-grid.tsx`: new client `TpoGrid` sheet with only already-authorized server drive rows and shared visible links for applicants, offers, unanswered requests, open hiring flow, repeat hiring and messages.
- `src/components/placements/recruiter-placement-portfolio.tsx`: server projection uses its existing attention sort and computes employer-scoped labels. The desktop portal switches to the sheet at 768px while the full original card view is retained on phones and all other callers.
- `src/app/(authenticated)/hr/drives/page.tsx`: same `pageResult.rows`, filters, sort, tabs, server CSV export and pagination. Adds `sheetScopeKey` containing user ID plus selected college so local grid layouts never cross the scope.

| Property | Legacy source/value | vNext source/value | Result |
| --- | --- | --- | --- |
| Dense table on one canvas | `docs/design/old-lms-pages.md:6,10` white canvas and bordered sheet | shared TpoGrid inside `hr/drives/page.tsx`, desktop only | Partially matched; style runtime missing |
| Mobile/tablet breakpoint | `docs/design/legacy-styles/components___listing-page-header.scss:131-158` mobile max 767px | `recruiter-placement-portfolio.tsx` has `md:block` / `md:hidden` at 768px | Structural breakpoint source match |
| Row links | `old-lms-pages.md:10` row actions | all original review, offers, requests, hire again, and message routes retained | Source behavior preserved; not tested |
| Export | `old-lms-pages.md:10` Export toolbar | `hr/drives/page.tsx:147-153` existing `Export matching drives CSV` server route unchanged | Filenames and native grid parity unverified |
| Feedback/states | `old-lms-pages.md:11-12` badges and default/hover/disabled | mobile cards retain badges; desktop uses shared TpoGrid | Missing live focus/disabled and pixel proof |

Fetched post-edit source scan: 0 raw `button/input/select/textarea/table` tags and 0 inline hex in each of the three files. The scan is source-equivalent and not a local CLI grep. No TypeScript, CI, app, or browser execution; no shared UI or package manifest edits. **Work queue and E8 remain unticked.**

**Exact next unticked visible file:** `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx` for applicant/offer/round column and action parity.


## 2026-10-19 chat-15 — authorized applicant sheet continuation

The new `src/components/hr/hr-job-applicants-grid.tsx` displays only the existing employer-scoped `applicants.rows` from `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx`. Its columns include Applicant, Role, Roll no., Branch, three academic percentage fields, Application, Placement-cell screening and Applied; `Review applicant` links retain the original scoped applicant route and drawer. The stage, CSV export, focused reviewer, notes and server pagination were not changed. The AG Grid column preference storage key includes user ID, job ID and selected stage; no applicant data is persisted by this component.

| Legacy property and file:line | vNext value/source | Verification |
| --- | --- | --- |
| `docs/design/old-lms-pages.md:6,10`: table on one white canvas | `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx` includes shared TpoGrid without new canvas | Source structure only; actual paint pending |
| `docs/design/legacy-styles/components___listing-page-header.scss:131-158`: phone max 767px | Shared applicant sheet in `hidden md:block`, original review cards in `md:hidden` | Source breakpoint exact; mobile screenshot pending |
| `docs/design/old-lms-pages.md:8-11`: filter/tab/export and row actions | Existing stage Tabs and `Export shared applicants CSV` unchanged, action still `Review applicant` | Content routes preserved; filename/hover/focus pending |
| `docs/design/old-lms-pages.md:11-12`: status badges and compact separators | Shared TpoGrid text states plus original mobile status badges | Not an exact colour/row-state match; do not tick |

The updated applicant page was re-fetched: 0 native control/table tags, 0 hex literals, 0 raw `h1`, matching 53/53 div open-close and 3/3 fragment open-close counts. New `hr-job-applicants-grid.tsx` similarly has zero raw controls, zero hex, and zero custom overlays. No local app, TS/CI, viewport screenshot or live tenant verification was run. E8 and the job page stay [ ] under the strict tick rule.

**Exact next file:** `src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/page.tsx`.


## chat-15 continuation — HR round editor, confirmation and tracker state judgments (2026-10-19)

**Baseline:** Synced the existing lane with newer origin/main using a two-parent merge commit and retained the applicant-sheet audit. The main branch continues to receive other lanes' commits. Edits below touched no `src/components/ui`, `package.json`, auth or server workflows.

| File / state | Legacy source property | vNext source property | Source outcome / missing proof |
| --- | --- | --- | --- |
| `hr/drives/[jobId]/rounds/editor/page.tsx`: round list | `docs/design/old-lms-pages.md:6,10`: single canvas; compact bordered rows; no cards for ordinary rows | Removed nested `Card` wrappers; mobile editors render border-b hairlines, desktop `HrRoundEditorGrid` / separate inline edit forms | Structural match, still needs rendered row heights, focus and export checks |
| `hr/drives/[jobId]/rounds/editor/page.tsx`: breakpoint | `docs/design/legacy-styles/components___listing-page-header.scss:131-158`: mobile max 767px | Desktop `hidden md:block`, phone `md:hidden`; editing forms `md:grid-cols-2` | Source 768px boundary matches; no physical tablet/phone screenshot |
| `hr/drives/[jobId]/rounds/editor/page.tsx`: back navigation | `src/components/ui/page-back-link.tsx` cites `learn-layout.scss:361-383`, 44px touch and mobile icon-only | `PageBackLink` to same original drive rounds URL; second Drives destination retained | Delegated shared styles; live focus not tested |
| `hr/drives/[jobId]/rounds/editor/remove/[roundId]/page.tsx`: Keep action | Same legacy back affordance | Shared `PageBackLink` labelled Keep round; server optimistic token, exact action/round fields, danger button unchanged | Mobile source inherits shared 44px hit size; live keyboard and dialog proof missing |
| `recruiter/not-found.tsx`: go home | Shared back affordance + one-canvas heading | Shared `PageBackLink` to original `/recruiter`; `PageHeader` and message unchanged | Source matches, mobile UI not verified |
| `hr-round-editor-grid.tsx`: desktop round rows | `old-lms-pages.md:10` bordered worksheet with columns, actions | Read-only TpoGrid with sequence/name/kind/mode/duration/status/editability; in-page Edit round anchor and existing Review round removal route | AG Grid running/cell focus/column widths still unverified |
| `tracker/*`: copy/saved-view/bulk feedback | `old-lms-pages.md:11-12`: shared slim notices, and `components___common.scss:20-29` responsive gutters | Shared `InlineNotice` success/error/info on four components; exact notice text, clipboard and bulk concurrency guards retained | Source shared style; screenshot and state parity missing |

**Source grep-equivalent checks after re-fetching all eight updated/new TSX files:**
`/<(button|select|input|textarea|table)(?=[\\s/>])/g` => **0 per file**;
`/#[0-9a-fA-F]{3,8}\\b/g` => **0 per file**;
`/<h1(?=[\\s>])/g` => **0 per file**;
`/fixed inset-0|role=["'](?:dialog|alertdialog)["']/g` => **0 per file**.
For the round editor, paired `div` 3/3, `article` 1/1, `form` 2/2, `Button` 2/2. For the removal confirmation, `div` 3/3, `form` 1/1, `Button` 1/1. For tracker components, all visible wrappers and Button openings/closings were matched in the fetched source. This is static source equivalent, not a CLI grep, TypeScript execution, or evidence of computed pixel values. Shared component props unchanged and only one rendered sheet/list visible at a given viewport.

**Strict tick outcome:** none of these visible pages/components were ticked because complete default/hover/active/focus/disabled/error/loading value matching and physical mobile/tablet render proof are not available. See clone-sheets.md for E8. No CI/tests/build/app run.

**Next HR file:** `src/app/(authenticated)/hr/drives/[jobId]/interview-slots/page.tsx` and its recruiter alias, then `src/components/tracker/tracker-live-logs-explorer.tsx` large sheet parity.


## Nonvisual helper closure — 3 strict source ticks

The following three work-queue items return `null` unconditionally and define **no own DOM, CSS selectors, responsive element, canvas, focusable control or modal**. They own only URL/filter or authorized refresh effects, which are unchanged:

| File | Visual property/state | Legacy property source | vNext property source | Match |
| --- | --- | --- | --- | --- |
| `src/components/hr/recruiter-conversation-live-refresh.tsx` | Typography/colour/size/border/default/hover/active/focus/disabled/loading/error | `docs/design/old-lms-pages.md:6-12`: not applicable without a rendered element | `recruiter-conversation-live-refresh.tsx`: unconditional `return null` | N/A, zero styles |
| `src/components/hr/recruiter-conversation-live-refresh.tsx` | Phone at max 767px, tablet at 768px+ | `components___listing-page-header.scss:131-158`: no element in this helper | `return null`; no styles/breakpoints | N/A, zero wrapper |
| `src/components/tracker/audit-finding-filter-memory.tsx` | All visual states and viewport rules | `old-lms-pages.md:6-12`: no visual control to clone | `audit-finding-filter-memory.tsx`: unconditional `return null` | N/A, zero wrapper |
| `src/components/tracker/audit-finding-filter-persistence.tsx` | All visual states and viewport rules | `old-lms-pages.md:6-12`: no visual control to clone | `audit-finding-filter-persistence.tsx`: unconditional `return null` | N/A, zero wrapper |

**Complete source coverage:** each file was fetched in full on the lane; exact source scan `/<(button|input|select|textarea|table)(?=[\\s/>])/g` = 0, `/#[0-9a-fA-F]{3,8}\\b/g` = 0, `/<h1(?=[\\s>])/g` = 0, `/<[a-z][a-z0-9-]*(?=[\\s/>])/g` = 0 JSX intrinsic opening elements. `recruiter-conversation-live-refresh.tsx` contains a **string selector** `[role="dialog"]` solely to avoid refreshing while a dialog is open; this is not rendered JSX. There is no custom overlay. Helper effects were left identical; no regression of business effects from this documentation-only tick. No physical pixel test claimed because these components render no elements.

**Next rich HR file:** `src/app/(authenticated)/hr/drives/[jobId]/interview-slots/page.tsx` (source updated, state proof still open). 

## chat-15 next source batch — interview slots, profile access, outside drives and tracker notices

**Completed source edits, strict pixel ticks still open:**

| File and state | Old LMS value/source | Current vNext source outcome | Responsive/state gap |
| --- | --- | --- | --- |
| `src/app/(authenticated)/hr/drives/[jobId]/interview-slots/page.tsx` | `old-lms-pages.md:6,9,11-12`: one white canvas, slim banners, ordinary rows without nested cards | Both interview coordination notices are shared `Alert`; existing slot objects use hairline `article` rows; zero-slot uses `EmptyState`; page back uses shared `PageBackLink` | Phone/tablet render, banners error/focus/hover remain unverified |
| `src/components/placements/recruiter-interview-slot-form.tsx` | `components___form.scss:23-33,130-143`: shared focus/error form paint; `components___listing-page-header.scss:131-158`: mobile max 767px | Hidden action field changed from native input to `Input`; validation, success, action/confirm errors use shared `InlineNotice`; submit uses shared Button loading; `md:grid-cols-2` and `md:col-span-2` start at 768px | Same IST time validation and optimistic version, but real keyboard/date-picker state not tested |
| `src/components/hr/recruiter-profile-access.tsx` | `old-lms-pages.md:11-12`: error/empty shared states, no extra cards | Removed two `Button` imports (TypeScript duplicate identifier defect); shared `InlineNotice` error + `EmptyState` for zero grants; confirmation semantics unchanged | No click/runtime validation |
| `src/components/placements/recorded-outside-form.tsx` | `components___form.scss:130-143`: shared field radius/focus; legacy max 767px mobile boundary | Removed four hand-styled Input/Select overrides and one Textarea override; native hidden input converted to shared `Input`; `md:grid-cols-2` at 768px | Source-style delegation only; historical record submit remains |
| `src/components/tracker/tracker-live-logs-explorer.tsx` | `old-lms-pages.md:11-12`: slim shared feedback strip | Shared `InlineNotice` for copy/export/load/known-error mute feedback; authored row data and saved auth scope untouched | Full screen/keyboard proof pending |
| `src/components/tracker/tracker-telegram-manual-panel.tsx` | Same slim banners; max 767px breakpoint | Configured/unconfigured and send success/error notices use shared `InlineNotice`; digest preview grid switches at 768px | Shared dialog focus/hover and exact toast positions pending |
| `src/components/tracker/independent-finding-actions.tsx` | Shared form/button/notice states | Replace two raw feedback paragraphs with shared `InlineNotice`; Button loading now follows pending flag; server action, confirmation and version guard unchanged | Pending/confirm runtime proof needed |
| `src/components/tracker/known-errors-workspace.tsx` | `components___listing-page-header.scss:131-158`: 767px mobile cutoff | Form columns at `md:grid-cols-3` rather than starting at 640px; all backend state unchanged | Status/pills/drawer responsive rendering pending |
| `src/app/(authenticated)/tracker/audit-findings/page.tsx` | 767px mobile cutoff | `md:grid-cols-2` filter layout instead of 640px; existing shared DataTable, query guards and import state unchanged | Underlying DataTable/long labels need live viewport check |
| `src/components/tracker/tracker-issue-bulk-actions.tsx` | Shared checkbox, compact actions, error/success feedback, 767px cutoff | Checkbox panel now 1 column through 767px; three feedback sites use shared `InlineNotice`, version guards/bulk locks unchanged | Server apply and focus/disabled state not verified |

**Post-edit source scans:** all ten files above were re-fetched from `chatgpt/chat-15-b` after writes. `/<(button|select|input|textarea|table)(?=[\\s/>])/g` = 0 in each, `/#[0-9a-fA-F]{3,8}\\b/g` = 0, `/<h1(?=[\\s>])/g` = 0, `/fixed inset-0|role=["'](?:dialog|alertdialog)["']/g` = 0 in each. Key paired JSX counts: slots page `Alert` 2/2 and `article` 1/1; interview form `form` 1/1 and `div` 4/4; profile access `div` 5/5; tracker live logs `div` 5/5. All newly changed tag pairs were source-checked. `md:` is the same 768px threshold as legacy's max-width 767px mobile media query. **This is fetched-code coverage, not a CLI, TS, CI, or viewport run.**

**Gaps that remain open:** exact computed hover/focus/default/error/disabled/loading values, screenshots at phone and tablet widths, native AG Grid runtime (the branch manifest does not declare required AG Grid packages), and old-LMS filename contract. Do not tick visible pages based on these source scans alone. A queue entry for `recruiter-private-rating-editor.tsx` and one for `recruiter-request-queue.tsx` returned GitHub NOT_FOUND on this branch; neither can be marked completed from the old inventory.

**Exact next file:** `src/components/tracker/known-errors-workspace.tsx` — complete error-signature action/layout state audit and unresolved dense-row screens.


## Full route-file native control / hex / header scan — 145 pages (replacement lane)

The complete `Work queue` route inventories, fetched individually from the active lane's GitHub tree, now have **zero** matching native control tags (`button`, `input`, `select`, `textarea`, `table`), literal hex tokens or hand-authored `h1` tags.

| Exact scoped inventory | Full files read | Native control/table instances | Literal 3–8 digit hex instances | Custom h1 instances | Missing files |
| --- | ---: | ---: | ---: | ---: | ---: |
| `src/app/(authenticated)/hr/**/*.tsx` queue | 71 | 0 | 0 | 0 | 0 |
| `src/app/(authenticated)/recruiter/**/*.tsx` queue | 53 | 0 | 0 | 0 | 0 |
| `src/app/(authenticated)/tracker/**/*.tsx` queue | 21 | 0 | 0 | 0 | 0 |
| **Total exact queued routes** | **145** | **0** | **0** | **0** | **0** |

These counts are from fetching and searching all 145 complete file contents in the source connector (five HR batches of 11–15, four recruiter batches, two tracker batches). Expressions applied per file: `/<(button|input|select|textarea|table)(?=[\\s/>])/g`, `/#[0-9a-fA-F]{3,8}\\b/g`, `/<h1(?=[\\s>])/g`. The tracker audit findings page's single native hidden input was found and changed to shared `Input type="hidden"`, then re-read with count 0. This is **full coverage for these patterns on these queued routes** but not a claim of whole-repository grep, computed CSS equality or pixel parity.

**Responsive source proof:** the legacy listing SCSS `components___listing-page-header.scss:131-158` defines phone as max-width 767px, so the amended HR interview and tracker report forms place multi-column grids at Tailwind `md:` (min-width 768px), not `sm:` (640px). Existing page-specific `flex-wrap` and `min-w-0` handle narrow widths in source; actual phone/tablet screenshots and scroll/keyboard QA remain open.

**Audit integrity:** Native/hex/h1 scan passing **does not** satisfy the strict state-value/viewport tick rule by itself. All visible HR/recruiter/tracker page checklist boxes remain unticked until default, hover, active, focus, disabled, loading, empty, error and phone/tablet comparisons are recorded. The three nonvisual effect helpers and 17 recruiter route-only shims remain separately ticked with their zero-own-DOM proof.

**Next:** `src/components/tracker/known-errors-workspace.tsx` now uses shared `Dialog` for mute confirmation instead of an inline custom confirmation panel. Verify its live focus/keyboard/scroll and then proceed to `src/components/placements/recruiter-result-controls.tsx` dense result tables.


### chat-15 delegation-only route proof 4 files

For each route listed below, complete fetched source shows exactly one shared `GracefulPageLoading` or `GracefulErrorBoundary` element, no local DOM tags, no className, no inline style, no raw controls, no literal colors, no hand-built overlays. Legacy property source: `docs/design/old-lms-pages.md:6-12` and `docs/design/legacy-styles/components___listing-page-header.scss:131-158`. Font/size/color/border/hover/focus/disabled/active/loading/error/phone/tablet: N/A at caller level; the delegated shared component keeps its original props and owns all visual states. Grep-equivalent source counts 0 for native controls, hex, hand-authored h1 and custom overlay. No behavior changes or runtime verification are claimed.

- src/app/(authenticated)/hr/activity/loading.tsx
- src/app/(authenticated)/hr/calendar/loading.tsx
- src/app/(authenticated)/hr/colleges/error.tsx
- src/app/(authenticated)/hr/colleges/loading.tsx


### More delegated loading/error route source values — 2 files

- `src/app/(authenticated)/hr/company/loading.tsx`: local value table font/color/padding/border/hover/focus/active/disabled/loading/error/empty/breakpoint = N/A; exact single shared primitive, no own DOM. Legacy references `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; source native controls, hex, h1, overlay count = 0; JSX unchanged.
- `src/app/(authenticated)/hr/company/reports/loading.tsx`: local value table font/color/padding/border/hover/focus/active/disabled/loading/error/empty/breakpoint = N/A; exact single shared primitive, no own DOM. Legacy references `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; source native controls, hex, h1, overlay count = 0; JSX unchanged.


#### Delegated loading-only audit (7 files)

- `src/app/(authenticated)/hr/conversations/[threadId]/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.
- `src/app/(authenticated)/hr/conversations/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.
- `src/app/(authenticated)/hr/drives/[jobId]/interview-slots/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.
- `src/app/(authenticated)/hr/drives/[jobId]/messages/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.
- `src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.
- `src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/remove/[roundId]/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.
- `src/app/(authenticated)/hr/drives/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.


#### Delegated loading-only audit (7 files)

- `src/app/(authenticated)/hr/drives/new/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.
- `src/app/(authenticated)/hr/drives/proposals/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.
- `src/app/(authenticated)/hr/drives/recorded-outside/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.
- `src/app/(authenticated)/hr/home/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.
- `src/app/(authenticated)/hr/messages/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.
- `src/app/(authenticated)/hr/notifications/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.
- `src/app/(authenticated)/hr/placements/jobs/[jobId]/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.


#### Delegated loading-only audit (7 files)

- `src/app/(authenticated)/hr/placements/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.
- `src/app/(authenticated)/hr/profile/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.
- `src/app/(authenticated)/hr/round-results/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.
- `src/app/(authenticated)/recruiter/calendar/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.
- `src/app/(authenticated)/recruiter/colleges/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.
- `src/app/(authenticated)/recruiter/company/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.
- `src/app/(authenticated)/recruiter/drives/[jobId]/change-requests/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.


#### Delegated loading-only audit (7 files)

- `src/app/(authenticated)/recruiter/drives/[jobId]/interview-slots/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.
- `src/app/(authenticated)/recruiter/drives/[jobId]/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.
- `src/app/(authenticated)/recruiter/drives/[jobId]/messages/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.
- `src/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.
- `src/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/remove/[roundId]/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.
- `src/app/(authenticated)/recruiter/drives/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.
- `src/app/(authenticated)/recruiter/drives/new/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.


#### Delegated loading-only audit (7 files)

- `src/app/(authenticated)/recruiter/drives/proposals/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.
- `src/app/(authenticated)/recruiter/drives/recorded-outside/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.
- `src/app/(authenticated)/recruiter/home/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.
- `src/app/(authenticated)/recruiter/messages/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.
- `src/app/(authenticated)/recruiter/profile/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.
- `src/app/(authenticated)/tracker/audit-findings/[publicId]/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.
- `src/app/(authenticated)/tracker/audit-findings/loading.tsx`: all local value classes (font, color, padding, radius, border, hover, focus, disabled, active, loading, error, phone/tablet) N/A; one unchanged shared GracefulPageLoading. Source grep counts native/hex/h1/overlay = 0/0/0/0; legacy `old-lms-pages.md:6-12`, `components___listing-page-header.scss:131-158`; no local JSX tags.
