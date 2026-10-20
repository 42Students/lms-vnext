# UI/UX polish queue: lane chat-19

31 surfaces, in order. ONE SURFACE PER TURN: take only the first unticked surface, make it excellent, tick it, and stop. The next surface comes with the next message. Never work on several surfaces at once.

Polish checklist (apply every point to the surface and to every component it renders, in every state):
1. Clutter: one clear primary action per surface, secondary actions demoted or moved into a menu; merge duplicate links/buttons; remove decoration that carries no information; collapse rarely used filters or fields behind a disclosure; no card inside card.
2. Hierarchy: one h1 (page) or one clear title (overlay), short subtitle, sections in the order people use them, most important content above the fold, related controls grouped with a clear label.
3. Alignment: every section starts on the same left edge, equal gutters and gaps (legacy scale 4/8/12/16/24/32), controls in a row share one height, labels align with inputs, columns align, no stray margins, header actions never wrap badly.
4. Density: consistent padding, comfortable line length, tables trimmed to the columns that matter (rest behind details), no walls of text; empty, loading and error states have a clear message and a next step.
5. Mobile 375 and tablet 768: real layouts (stack, reorder, full-width primary action, 44px tap targets), nothing cramped or overflowing; overlays become full-width sheets on mobile.
6. Keep exactly: legacy colours, radii, control sizes, fonts and wording (docs/design); keep ids, data-testid, aria labels, routes and behaviour; no new packages; valid TSX.

Route files rule: when you polish a PAGE surface, ALSO polish the loading.tsx, error.tsx, not-found.tsx and template.tsx in the same route folder, and check the nearest parent layout.tsx, as part of that same surface (they are the loading, error and missing states of that page). Tick the page only when its route files are done too.

Proof: ONE entry per surface in docs/audit/ux/polish-lane-19.md: surface | problems found (clutter, misalignment, hierarchy, density, mobile) | what you removed, merged, moved or realigned | files changed. Push to chatgpt/chat-19-b with [chat-19], ticking [x] in this queue in the same push.

- [x] `src/components/tpo/tpo-batch-eligibility-import.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [x] `src/components/tpo/tpo-batch-inline-decision.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [x] `src/components/tpo/tpo-bell-panel.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [x] `src/components/tpo/tpo-bulk-action-panel.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [x] `src/components/tpo/tpo-company-create-form.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [x] `src/components/tpo/tpo-find-shortcut.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [x] `src/components/tpo/tpo-keyboard-shortcuts.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [x] `src/components/tpo/tpo-new-followup-modal.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [x] `src/components/tpo/tpo-new-recruiter-conversation.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [x] `src/components/tpo/tpo-notice-composer-dialog.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [x] `src/components/tpo/tpo-notice-delete-confirm.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [x] `src/components/tpo/tpo-student-nudge-panel.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [x] `src/components/tpo/tpo-student-quick-panel.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [x] `src/components/tpo/tpo-student-saved-views.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [x] `src/components/tpo/tpo-students-assign-prep.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [x] `src/components/tpo/tpo-students-bulk-add.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [x] `src/components/tpo/tpo-students-bulk-debar.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [x] `src/components/tpo/tpo-students-drive-visibility.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [x] `src/components/tpo/tpo-team-ask-panel.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [x] `src/components/tpo/tpo-team-message-actions.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [x] `src/components/tpo/tpo-timed-debar-control.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [x] `src/components/tracker/known-errors-workspace.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [x] `src/components/tracker/tracker-live-logs-explorer.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [x] `src/components/tracker/tracker-quick-report-launcher.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [x] `src/components/tracker/tracker-telegram-manual-panel.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [x] `src/components/ui/confirm-action-dialog.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [x] `src/components/ui/confirm-dialog.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [x] `src/components/ui/date-input.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [x] `src/components/ui/drawer.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [x] `src/components/ui/searchable-select.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [x] `src/components/verification/VerificationReviewDrawer.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [x] `src/components/activity/notification-toolbar.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [x] `src/components/verification/CollegeVerificationPanel.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [x] `src/components/auth/connection-failure-notice.tsx` (Component not reached from any page: confirm it is used; if live, polish it in every state)
- [x] `src/components/courses/course-detail-anchor-tabs.tsx` (Component not reached from any page: confirm it is used; if live, polish it in every state)
- [x] `src/components/placements/learner-placements-tabs.tsx` (Component not reached from any page: confirm it is used; if live, polish it in every state)
- [x] `src/components/public/error-page-view.tsx` (Component not reached from any page: confirm it is used; if live, polish it in every state)
- [x] `src/components/tpo/tpo-academic-import-preview.tsx` (Component not reached from any page: confirm it is used; if live, polish it in every state)
- [x] `src/components/ui/date-range-picker.tsx` (Component not reached from any page: confirm it is used; if live, polish it in every state)
- [x] `src/components/ui/long-text.tsx` (Component not reached from any page: confirm it is used; if live, polish it in every state)
- [ ] `src/components/ui/permission-action.tsx` (Component not reached from any page: confirm it is used; if live, polish it in every state)
- [ ] `src/app/(authenticated)/teacher/error.tsx` (Route boundary file (layout, loading, error or not-found) shared by several pages)
- [ ] `src/app/(authenticated)/admin/layout.tsx` (Route boundary file (layout, loading, error or not-found) shared by several pages)
- [ ] `src/app/(authenticated)/hr/error.tsx` (Route boundary file (layout, loading, error or not-found) shared by several pages)
- [ ] `src/app/(authenticated)/teach/layout.tsx` (Route boundary file (layout, loading, error or not-found) shared by several pages)
