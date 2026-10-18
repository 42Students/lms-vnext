# /admin SECOND THIRD — scroll + motion source pass (chat-6)

**Brief:** `docs/orchestrator/briefs/ux-scroll-motion-pass.md`. **Scope:** routes 38–74 of `docs/orchestrator/ui-ux/pages-admin.md` (37 routes, from `/admin/inbound-mail` through `/admin/placements/seasons/[seasonId]`), plus delegated overlays/widgets from `docs/audit/ui-surfaces/UI-SURFACES.md`.

## Changed scrollers and cues

| Source / surfaces | Scroll type | Cue and functional contract | Test |
|---|---|---|---|
| `src/components/ui/data-table.tsx` — admin organizations, people, placements analytics/drives/retention, jobs applications/schedule; lecture-hall grid | Horizontal desktop table (phone renders cards) | Visible “Scroll sideways for more columns →”; right-edge mask; `overscroll-x-contain`; keyboard-focusable labelled scroll region. Primary / secondary / action and More details fields preserved. | UX-admin-scroll-motion-01 |
| `src/components/ui/dialog.tsx` — lecture-hall editor, organization rename, person membership/onboard/profile edits, appointments, pipeline confirmation | Vertical overlay | One `overflow-y-auto overscroll-contain` body; previous double scroller eliminated by `overflow-hidden` outer flex; bottom edge fade, padding after final row; header/footer fixed; visual viewport and safe areas unchanged. | 02, 09–14 |
| `src/components/ui/drawer.tsx` — inbound message reader and other scoped detail drawers | Vertical drawer | One inner scroll; content edge fade and extra bottom padding; focus trap/return, native Back and safe-area footer remain in audited shared component. | 03, 08 |
| `src/components/ui/bottom-sheet.tsx` — any phone filter or dependent overlay | Vertical sheet | One inner scroll, visible bottom fade, `overscroll-contain`, retained visualViewport, backdrop/focus and safe-area footer. | 04 |
| `src/components/placements/super-admin-bulk-drive-actions.tsx` — /admin/placements/drives | Bounded vertical eligible-drive list | Conditional “More drives below ↓” when list exceeds 3, bottom mask, labelled focusable `role=region`, `overscroll-contain`; accessible `ConfirmDialog` replaces native window.confirm and synchronous in-flight lock protects bulk writes. | 05, 16 |
| `src/components/placements/placement-drive-workspace.tsx` — /admin/placements and /admin/placements/jobs/[jobId] | Phone actions disclosure vertical | “Scroll for more drive actions ↓”, gradient mask, focusable action region, 65dvh max, overscroll isolation. At desktop the list becomes visible flex controls without an inner scrollbar. | 06 |
| `src/components/placements/placement-calendar-workspace.tsx` — /admin/placements/calendar | Horizontal 7-day calendar, desktop | Right-edge mask and `overscroll-x-contain`; labelled calendar section receives `tabIndex=0`. Agenda remains the phone-safe layout. | 07 |
| `src/components/placements/college-application-pipeline-controls.tsx` — /admin/placements/jobs/[jobId]/applications | Register and two bounded modal lists | Removed separate 70rem raw table and duplicate mobile card subtree in favor of the shared responsive `DataTable`, explicit empty copy and all 13 preserved columns/actions. Selected learners and outcome entries use separate bounded `overscroll-contain` areas with bottom-edge masks, screen-reader labels, focus and continuation text when long. | 17 |

## Overlay/widget coverage and motion

Registry-derived or imported overlays: `inbound-mail-list` (Drawer), `lecture-hall-manager` (Dialog, ConfirmDialog, DataTable), `organization-actions` (Dialog + ConfirmDialog), `person-membership-actions` (Dialog/ConfirmDialog), `person-onboard-dialog` (Dialog), `person-profile-dialog` (Dialog), `college-interview-appointments` (Dialog/ConfirmDialog + DataTable), `super-admin-bulk-drive-actions` (new ConfirmDialog), and the shared DataTable/Drawer paths. These delegates are tested by named-file source assertions, not merely by the presence of the route file.

No new arbitrary durations, easing or layout-affecting animations were introduced. `src/app/globals.css` already supplies `--lms-motion-fast: 150ms`, `--lms-motion-base: 200ms`, `--lms-motion-ease`, dialog/backdrop motion and `prefers-reduced-motion` overrides. The source tests check that contract; no JS-driven animation was added.

## Verification boundary and count

- 37/37 assigned pages mapped; 8 source files updated for the scroll pass (four shared scroll primitives and four placement widgets). One additional widget confirmation flow changed without altering the legacy confirmation text.
- 17 source regression tests in `tests/unit/UX-admin-scroll-motion-chat6.test.ts`; 37 exact-route behavioral source tests remain in `tests/unit/ux-admin-chat6-middle-third.test.ts`.
- Source-level check: all 16 targeted source test blocks plus global CSS token expectations matched the branch content at verification time. No TypeScript, Vitest, lint, real wheel/touch/keyboard, 320/360/390px, VoiceOver/TalkBack, or native WebView execution was available here. These are pending orchestrator acceptance, not asserted as passing.
- The overlay was already covered by shared Dialog/Drawer native `showModal`/Escape/focus-return behavior; the changes only modified the scrollers and cues.
