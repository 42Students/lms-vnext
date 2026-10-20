# UI/UX polish queue: lane chat-17

34 surfaces, in order. ONE SURFACE PER TURN: take only the first unticked surface, make it excellent, tick it, and stop. The next surface comes with the next message. Never work on several surfaces at once.

Polish checklist (apply every point to the surface and to every component it renders, in every state):
1. Clutter: one clear primary action per surface, secondary actions demoted or moved into a menu; merge duplicate links/buttons; remove decoration that carries no information; collapse rarely used filters or fields behind a disclosure; no card inside card.
2. Hierarchy: one h1 (page) or one clear title (overlay), short subtitle, sections in the order people use them, most important content above the fold, related controls grouped with a clear label.
3. Alignment: every section starts on the same left edge, equal gutters and gaps (legacy scale 4/8/12/16/24/32), controls in a row share one height, labels align with inputs, columns align, no stray margins, header actions never wrap badly.
4. Density: consistent padding, comfortable line length, tables trimmed to the columns that matter (rest behind details), no walls of text; empty, loading and error states have a clear message and a next step.
5. Mobile 375 and tablet 768: real layouts (stack, reorder, full-width primary action, 44px tap targets), nothing cramped or overflowing; overlays become full-width sheets on mobile.
6. Keep exactly: legacy colours, radii, control sizes, fonts and wording (docs/design); keep ids, data-testid, aria labels, routes and behaviour; no new packages; valid TSX.

Route files rule: when you polish a PAGE surface, ALSO polish the loading.tsx, error.tsx, not-found.tsx and template.tsx in the same route folder, and check the nearest parent layout.tsx, as part of that same surface (they are the loading, error and missing states of that page). Tick the page only when its route files are done too.

Proof: ONE entry per surface in docs/audit/ux/polish-lane-17.md: surface | problems found (clutter, misalignment, hierarchy, density, mobile) | what you removed, merged, moved or realigned | files changed. Push to chatgpt/chat-17-b with [chat-17], ticking [x] in this queue in the same push.

- [ ] `src/components/courses/college-content-preview.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/courses/faculty-assessment-create.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/courses/faculty-assessment-editor.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/courses/faculty-assignment-review.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/courses/faculty-choice-quiz-builder.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/courses/faculty-content-editor.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/courses/faculty-course-roster.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/courses/faculty-quiz-question-editor.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/courses/faculty-quiz-review.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/courses/learner-assessment-overview.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/courses/learner-roadmap-item-dialog.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/groups/college-group-actions.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/hr/hr-recruiter-bell.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/hr/recruiter-applicant-review-drawer.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/hr/recruiter-notification-bell.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/hr/recruiter-round-inline-editor.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/placements/college-application-detail-drawer.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/placements/college-application-pipeline-controls.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/placements/college-drive-deadline-action.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/placements/college-interview-appointments.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/placements/learner-application-detail-withdraw.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/placements/learner-applications-browse.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/placements/learner-career-calendar.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/placements/learner-career-rounds-workspace.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/placements/learner-placement-jobs.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/placements/learner-placement-notification-settings.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/placements/learner-placement-offers.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/placements/learner-support-cancel.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/placements/placement-offer-controls.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/placements/tpo-applicant-review-drawer.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/placements/tpo-drive-edit-form.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/placements/tpo-drive-selection-manager.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/placements/tpo-general-requests-panel.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/components/placements/tpo-remind-non-applicants.tsx` (Overlay (modal, drawer, popover, menu, tooltip, toast))
- [ ] `src/app/e2e/chat17-ui-kit/ui-harness.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/groups/college-group-detail-writes.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/verification/TpoVerificationPanel.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/admin/people-pagination.tsx` (Component not reached from any page: confirm it is used; if live, polish it in every state)
- [ ] `src/components/auth/session-response-guard.tsx` (Component not reached from any page: confirm it is used; if live, polish it in every state)
- [ ] `src/components/hr/recruiter-display-name-editor.tsx` (Component not reached from any page: confirm it is used; if live, polish it in every state)
- [ ] `src/components/projects/learner-board-task-index.tsx` (Component not reached from any page: confirm it is used; if live, polish it in every state)
- [ ] `src/components/public/offline-banner.tsx` (Component not reached from any page: confirm it is used; if live, polish it in every state)
- [ ] `src/components/tracker/audit-finding-filter-persistence.tsx` (Component not reached from any page: confirm it is used; if live, polish it in every state)
- [ ] `src/components/ui/form-section.tsx` (Component not reached from any page: confirm it is used; if live, polish it in every state)
- [ ] `src/components/ui/page-canvas.tsx` (Component not reached from any page: confirm it is used; if live, polish it in every state)
- [ ] `src/app/(authenticated)/admin/error.tsx` (Route boundary file (layout, loading, error or not-found) shared by several pages)
- [ ] `src/app/(authenticated)/teach/loading.tsx` (Route boundary file (layout, loading, error or not-found) shared by several pages)
- [ ] `src/app/(authenticated)/college-admin/not-found.tsx` (Route boundary file (layout, loading, error or not-found) shared by several pages)
- [ ] `src/app/(authenticated)/layout.tsx` (Route boundary file (layout, loading, error or not-found) shared by several pages)
- [ ] `src/app/(authenticated)/teacher/not-found.tsx` (Route boundary file (layout, loading, error or not-found) shared by several pages)
