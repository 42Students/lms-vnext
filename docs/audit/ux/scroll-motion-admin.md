# /admin SECOND THIRD — scroll + motion source pass (chat-6)

**Brief:** `docs/orchestrator/briefs/ux-scroll-motion-pass.md`. **Scope:** routes 38–74 of `docs/orchestrator/ui-ux/pages-admin.md` (37 routes, from `/admin/inbound-mail` through `/admin/placements/seasons/[seasonId]`), plus delegated overlays/widgets from `docs/audit/ui-surfaces/UI-SURFACES.md`.

## Changed scrollers and cues

| Source / surfaces | Scroll type | Cue and functional contract | Test |
|---|---|---|---|
| `src/components/ui/data-table.tsx` — admin organizations, people, placements analytics/drives/retention, jobs applications/schedule; lecture-hall grid | Horizontal desktop table (phone renders cards) | Adaptive `ScrollCue` with horizontal edge fades only when scrollable, `overscroll-x-contain` and a keyboard-focusable labelled region only on actual overflow. Primary / secondary / action and More details fields preserved. | UX-admin-scroll-motion-01 |
| `src/components/ui/dialog.tsx` — lecture-hall editor, organization rename, person membership/onboard/profile edits, appointments, pipeline confirmation | Vertical overlay | Shared vertical `ScrollCue` keeps one focusable inner scroller, conditionally visible edge fades and `overflow-hidden` outer flex. Header/footer remain fixed and visual viewport/safe-area behavior unchanged. | 02, 09–14 |
| `src/components/ui/drawer.tsx` — inbound message reader and other scoped detail drawers | Vertical drawer | Shared adaptive vertical `ScrollCue` exposes content fades only when needed, with one inner scroller; focus trap/return, native Back and safe-area footer remain intact. | 03, 08 |
| `src/components/ui/bottom-sheet.tsx` — any phone filter or dependent overlay | Vertical sheet | Shared vertical `ScrollCue` computes overflow and fades from scroll position; one inner scroll, `overscroll-contain`, retained visualViewport, backdrop/focus and safe-area footer. | 04 |
| `src/components/placements/super-admin-bulk-drive-actions.tsx` — /admin/placements/drives | Bounded vertical eligible-drive list | Conditional “More drives below ↓” when list exceeds 3, bottom mask, labelled focusable `role=region`, `overscroll-contain`; accessible `ConfirmDialog` replaces native window.confirm and synchronous in-flight lock protects bulk writes. | 05, 16 |
| `src/components/placements/placement-drive-workspace.tsx` — /admin/placements and /admin/placements/jobs/[jobId] | Phone actions disclosure vertical | “Scroll for more drive actions ↓”, gradient mask, focusable action region, 65dvh max, overscroll isolation. At desktop the list becomes visible flex controls without an inner scrollbar. | 06 |
| `src/components/placements/placement-calendar-workspace.tsx` — /admin/placements/calendar | Horizontal 7-day calendar, desktop | Right-edge mask and `overscroll-x-contain`; labelled calendar section receives `tabIndex=0`. Agenda remains the phone-safe layout. | 07 |
| `src/components/placements/college-application-pipeline-controls.tsx` — /admin/placements/jobs/[jobId]/applications | Register and two bounded modal lists | Removed separate 70rem raw table and duplicate mobile card subtree in favor of the shared responsive `DataTable`, explicit empty copy and all 13 preserved columns/actions. Selected learners and outcome entries use separate bounded `overscroll-contain` areas with bottom-edge masks, screen-reader labels, focus and continuation text when long. | 17 |

| `src/components/placements/college-application-detail-drawer.tsx` — application details opened from the pipeline register | Bounded internal-notes history inside native Dialog | Visible “More internal notes below ↓” for long note sets; labelled and focusable region; `overflow-y-auto overscroll-contain` and bottom-edge mask while retaining secure note correction. | 20 |
| `src/components/placements/super-admin-drive-duplicate.tsx` — /admin/placements/jobs/[jobId]/settings | Destructive-style duplicate confirmation | `ConfirmDialog` with exact consequence wording, Escape/focus return through shared kit, 44px action and synchronous write lock; friendly failed-write feedback. | 21 |
| `src/components/placements/super-admin-drive-deadline.tsx` — same settings route | Deadline form confirmation | Native-safe `ConfirmDialog` with the original consequence, draft retained while modal opens and on save failure, synchronous mutation guard and mobile 16px datetime input. | 22 |

## Overlay/widget coverage and motion

Registry-derived or imported overlays: `inbound-mail-list` (Drawer), `lecture-hall-manager` (Dialog, ConfirmDialog, DataTable), `organization-actions` (Dialog + ConfirmDialog), `person-membership-actions` (Dialog/ConfirmDialog), `person-onboard-dialog` (Dialog), `person-profile-dialog` (Dialog), `college-interview-appointments` (Dialog/ConfirmDialog + DataTable), `super-admin-bulk-drive-actions` (new ConfirmDialog), and the shared DataTable/Drawer paths. These delegates are tested by named-file source assertions, not merely by the presence of the route file.

No new arbitrary durations, easing or layout-affecting animations were introduced. `src/app/globals.css` already supplies `--lms-motion-fast: 150ms`, `--lms-motion-base: 200ms`, `--lms-motion-ease`, dialog/backdrop motion and `prefers-reduced-motion` overrides. The source tests check that contract; no JS-driven animation was added.

## Verification boundary and count

- 37/37 assigned pages mapped; 11 source files updated for the scroll pass (four shared scroll primitives and seven placement widgets). Three placement-widget confirmation flows changed without altering the legacy confirmation text.
- 22 source regression tests in `tests/unit/UX-admin-scroll-motion-chat6.test.ts`; 37 exact-route behavioral source tests remain in `tests/unit/ux-admin-chat6-middle-third.test.ts`.
- Source-level check: all 19 targeted component source blocks, the dynamic ScrollCue contract, global CSS tokens and the eight-file motion-timing contract matched the branch content at verification time. No TypeScript, Vitest, lint, real wheel/touch/keyboard, 320/360/390px, VoiceOver/TalkBack, or native WebView execution was available here. These are pending orchestrator acceptance, not asserted as passing.
- The overlay was already covered by shared Dialog/Drawer native `showModal`/Escape/focus-return behavior; the changes only modified the scrollers and cues.

---

# /admin last third — hidden scrollbar, scroll cue and motion pass (chat-9)

Date: 2026-10-18. Source basis: `docs/orchestrator/briefs/ux-scroll-motion-pass.md`, `docs/audit/ui-surfaces/UI-SURFACES.md`, and signed-off UX Playbook. Assigned slice: **37 routes**, /admin route positions 75–111. No legacy copy, role permissions or mutation semantics changed.

## Cues and containment applied

| File / route-facing component | Scroll area | Cue, keyboard behavior and state |
|---|---|---|
| `src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx` | Version before/after code blocks (1 template location) | Bottom fade, `overscroll-contain`, focusable named region; long content remains selectable and scrollable |
| `src/components/admin/tenant-settings-editor.tsx` | High-impact confirmation list and change result list (2) | Named keyboard regions with vertical edge fade and overscroll containment; shared ConfirmDialog remains responsible for focus trap/history |
| `src/components/admin/super-admin-student-import-history.tsx` | Import history native dialog and embedded table (2) | `dvh`-bounded overlay, vertical bottom fade, horizontal right fade, named keyboard-scroll region, touch-safe close controls |
| `src/components/projects/project-admin-workspace-list.tsx` | Workspace table (1) | Horizontal right-edge fade, overscroll containment and keyboard focus |
| `src/components/projects/super-admin-template-subview-page.tsx` | Template subview inventory table (1) | Horizontal fade, keyboard region, 44px link targets and accessible link colour |
| `src/components/projects/project-admin-submissions-page.tsx` | Unsubmitted-project table (1) | Horizontal fade, accessible region and keyboard navigation |
| `src/components/projects/class-team-workspace-creator.tsx` | Preflight and per-learner result panes (2) | Vertical fades on bounded panes, overscroll containment and visible keyboard focus |
| `src/components/projects/super-admin-template-tabs.tsx` | Template tabs (1) | Right-edge fade, horizontal overscroll containment, named tab strip, 44px links and deep-teal focus state |
| `src/components/ui/data-table.tsx` | Responsive table at `sm` and above (1 shared archetype) | Named focusable region, horizontal right-edge fade and overscroll containment; phone retains the existing row-card and “More details” disclosure |
| `src/components/admin/super-admin-student-bulk-access.tsx` | Bulk learner choice list (1) | Bottom fade, focusable named region, touch targets upgraded to 44px |
| `src/components/projects/project-admin-readiness-page.tsx` | Active overrides and selected-workspace release tables (2 eliminated) | Migrated to one responsive DataTable per dataset with primary fields, explicit empties and visible mobile Manage action |
| `src/app/(authenticated)/admin/settings/page.tsx` | Settings inventory and SMS source template tables (2 eliminated) | Replaced duplicate mobile cards/desktop raw tables with shared DataTable; no independent horizontal scroll |
| `src/app/(authenticated)/admin/course-progress/students/page.tsx` | Student progress table (1 eliminated) | Shared DataTable, explicit empty copy and all five measured fields recoverable on phone |
| `src/app/(authenticated)/admin/features/[collegeId]/trace/page.tsx` | Scope-resolution table (1 eliminated) | Shared DataTable with Winner/Ignored statuses and unchanged explanation |
 
**Count: 19 scrolling areas evaluated: 13 given explicit fades/named scroll regions (counting the shared DataTable archetype once), six raw scrolling table instances replaced with responsive DataTables.** Table caller counts are not multiplied across data rows or rendered route instances.

## Motion review

Global `src/app/globals.css` owns the 150ms fast and 200ms base motion tokens, overlay enter/fade and reduced-motion fallback. Route-specific long panes use static edge masks; the shared DataTable instead uses main's overflow-aware `ScrollCue`, which measures start/end edges and only draws nonblocking fades when scrollable. No JS animation, manual clock, hard-coded duration or animation of width/height/top/left was introduced. Overlay focus and native dialog behavior still require real-browser/native-host validation; no fake screenshot or accessibility result is claimed.

## Regression and acceptance

`tests/unit/ux-admin-chat9-scroll-motion.test.ts`: **12** named `UX-admin-scroll-motion-NN` source regressions. Routes still have the 37 prior `UX-admin-<route>-01` contracts. The same-commit `typecheck`, `lint`, `ux:guard`, `ux:audit:verify` and hydrated 320/360/390/768/1280px, reduced-motion, wheel/touch/keyboard and screen-reader checks remain to be run by the orchestrator. Until then: **SOURCE WORK DONE; DEVICE/CI EVIDENCE OPEN**.
