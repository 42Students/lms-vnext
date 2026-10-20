# UI/UX polish queue: lane chat-16

34 surfaces, in order. ONE SURFACE PER TURN: take only the first unticked surface, make it excellent, tick it, and stop. The next surface comes with the next message. Never work on several surfaces at once.

Polish checklist (apply every point to the surface and to every component it renders, in every state):
1. Clutter: one clear primary action per surface, secondary actions demoted or moved into a menu; merge duplicate links/buttons; remove decoration that carries no information; collapse rarely used filters or fields behind a disclosure; no card inside card.
2. Hierarchy: one h1 (page) or one clear title (overlay), short subtitle, sections in the order people use them, most important content above the fold, related controls grouped with a clear label.
3. Alignment: every section starts on the same left edge, equal gutters and gaps (legacy scale 4/8/12/16/24/32), controls in a row share one height, labels align with inputs, columns align, no stray margins, header actions never wrap badly.
4. Density: consistent padding, comfortable line length, tables trimmed to the columns that matter (rest behind details), no walls of text; empty, loading and error states have a clear message and a next step.
5. Mobile 375 and tablet 768: real layouts (stack, reorder, full-width primary action, 44px tap targets), nothing cramped or overflowing; overlays become full-width sheets on mobile.
6. Keep exactly: legacy colours, radii, control sizes, fonts and wording (docs/design); keep ids, data-testid, aria labels, routes and behaviour; no new packages; valid TSX.

Proof: ONE entry per surface in docs/audit/ux/polish-lane-16.md: surface | problems found (clutter, misalignment, hierarchy, density, mobile) | what you removed, merged, moved or realigned | files changed. Push to chatgpt/chat-16-b with [chat-16], ticking [x] in this queue in the same push.

- [ ] `src/components/academics/academics-actions.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/academics/college-cohort-management.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/academics/college-section-management.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/academics/college-semester-management.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/activity/learner-notifications-inbox.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/admin/college-archive-button.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/admin/college-edit-dialog.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/admin/department-actions.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/admin/inbound-mail-list.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/admin/learner-module-access-drawer.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/admin/lecture-hall-manager.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/admin/organization-actions.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/admin/person-membership-actions.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/admin/person-onboard-dialog.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/admin/person-profile-dialog.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/admin/super-admin-faculty-schedule-reassign-action.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/admin/super-admin-hr-account-dialog.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/admin/super-admin-hr-accounts.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/admin/super-admin-hr-detail-drawer.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/admin/super-admin-student-import-history.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/announcements/announcement-admin-workspace.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/attendance/admin-attendance-workspace.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/attendance/faculty-attendance-workspace.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/college/college-faculty-reassign-action.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/college/college-faculty-schedule-reassign.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/college/college-offering-metadata-action.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/college/college-person-audit-modal.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/college/college-person-edit-action.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/college/college-person-profile-overview-modal.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/college/college-student-import-history.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/college/student-class-move-action.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/courses/admin-course-actions.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/courses/admin-learning-structure-actions.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/courses/assignment-submission-control.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-preview/company-share-controls.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/announcements/super-admin-college-broadcast-form.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/verification/SuperAdminVerificationPanel.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
