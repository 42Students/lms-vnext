# UI/UX polish queue: lane chat-18

34 surfaces, in order. ONE SURFACE PER TURN: take only the first unticked surface, make it excellent, tick it, and stop. The next surface comes with the next message. Never work on several surfaces at once.

Polish checklist (apply every point to the surface and to every component it renders, in every state):
1. Clutter: one clear primary action per surface, secondary actions demoted or moved into a menu; merge duplicate links/buttons; remove decoration that carries no information; collapse rarely used filters or fields behind a disclosure; no card inside card.
2. Hierarchy: one h1 (page) or one clear title (overlay), short subtitle, sections in the order people use them, most important content above the fold, related controls grouped with a clear label.
3. Alignment: every section starts on the same left edge, equal gutters and gaps (legacy scale 4/8/12/16/24/32), controls in a row share one height, labels align with inputs, columns align, no stray margins, header actions never wrap badly.
4. Density: consistent padding, comfortable line length, tables trimmed to the columns that matter (rest behind details), no walls of text; empty, loading and error states have a clear message and a next step.
5. Mobile 375 and tablet 768: real layouts (stack, reorder, full-width primary action, 44px tap targets), nothing cramped or overflowing; overlays become full-width sheets on mobile.
6. Keep exactly: legacy colours, radii, control sizes, fonts and wording (docs/design); keep ids, data-testid, aria labels, routes and behaviour; no new packages; valid TSX.

Route files rule: when you polish a PAGE surface, ALSO polish the loading.tsx, error.tsx, not-found.tsx and template.tsx in the same route folder, and check the nearest parent layout.tsx, as part of that same surface (they are the loading, error and missing states of that page). Tick the page only when its route files are done too.

Proof: ONE entry per surface in docs/audit/ux/polish-lane-18.md: surface | problems found (clutter, misalignment, hierarchy, density, mobile) | what you removed, merged, moved or realigned | files changed. Push to chatgpt/chat-18-b with [chat-18], ticking [x] in this queue in the same push.

- [x] `src/components/placements/tpo-request-bulk-decision.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/placements/tpo-request-decision-control.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/placements/tpo-week-hour-calendar.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/profile/learner-profile-workspace.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/profile/learner-skill-catalog-input.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/projects/college-project-mentor-dialog.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/projects/college-project-student-roster-dialog.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/projects/learner-board-task-detail-dialog.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/projects/mentor-board-task-detail-dialog.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/projects/mentor-meeting-notes-editor.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/projects/mentor-meeting-reschedule.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/projects/mentor-sprint-details-edit.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/projects/mentor-sprint-write.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/projects/mentor-task-create.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/projects/mentor-task-details-edit.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/projects/project-admin-submission-review.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/projects/project-archive-control.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/projects/project-create-control.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/projects/project-delivery-reopen-control.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/projects/project-final-delivery-controls.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/projects/project-lifecycle-actions.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/projects/project-meeting-controls.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/projects/project-mentor-reassignment.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/projects/project-resource-controls.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/projects/project-task-submission-control.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/projects/project-team-controls.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/projects/project-template-controls.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/projects/template-metadata-edit-control.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/tpo/recruiter-lead-csv-import.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/tpo/recruiter-lead-detail-workspace.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/tpo/recruiter-leads-workspace.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/tpo/tpo-academic-import-workspace.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/tpo/tpo-after-college-bulk-editor.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/tpo/tpo-after-college-editor.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/activity/notification-list.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/groups/college-study-member-actions.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/admin/super-admin-legacy-group-tabs.tsx` (Component not reached from any page: confirm it is used; if live, polish it in every state)
- [ ] `src/components/college/college-legacy-group-tabs.tsx` (Component not reached from any page: confirm it is used; if live, polish it in every state)
- [ ] `src/components/placements/college-drive-legacy-nav.tsx` (Component not reached from any page: confirm it is used; if live, polish it in every state)
- [ ] `src/components/public/browser-support-notice.tsx` (Component not reached from any page: confirm it is used; if live, polish it in every state)
- [ ] `src/components/public/public-page-loading.tsx` (Component not reached from any page: confirm it is used; if live, polish it in every state)
- [ ] `src/components/ui/button-group.tsx` (Component not reached from any page: confirm it is used; if live, polish it in every state)
- [ ] `src/components/ui/input-group.tsx` (Component not reached from any page: confirm it is used; if live, polish it in every state)
- [ ] `src/components/ui/password-input.tsx` (Component not reached from any page: confirm it is used; if live, polish it in every state)
- [ ] `src/app/(authenticated)/teach/error.tsx` (Route boundary file (layout, loading, error or not-found) shared by several pages)
- [ ] `src/app/(authenticated)/teacher/loading.tsx` (Route boundary file (layout, loading, error or not-found) shared by several pages)
- [ ] `src/app/(authenticated)/error.tsx` (Route boundary file (layout, loading, error or not-found) shared by several pages)
- [ ] `src/app/(authenticated)/loading.tsx` (Route boundary file (layout, loading, error or not-found) shared by several pages)
