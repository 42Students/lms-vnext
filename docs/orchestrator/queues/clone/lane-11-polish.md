# UI/UX polish queue: lane chat-11

44 surfaces, in order. ONE SURFACE PER TURN: take only the first unticked surface, make it excellent, tick it, and stop. The next surface comes with the next message. Never work on several surfaces at once.

Polish checklist (apply every point to the surface and to every component it renders, in every state):
1. Clutter: one clear primary action per surface, secondary actions demoted or moved into a menu; merge duplicate links/buttons; remove decoration that carries no information; collapse rarely used filters or fields behind a disclosure; no card inside card.
2. Hierarchy: one h1 (page) or one clear title (overlay), short subtitle, sections in the order people use them, most important content above the fold, related controls grouped with a clear label.
3. Alignment: every section starts on the same left edge, equal gutters and gaps (legacy scale 4/8/12/16/24/32), controls in a row share one height, labels align with inputs, columns align, no stray margins, header actions never wrap badly.
4. Density: consistent padding, comfortable line length, tables trimmed to the columns that matter (rest behind details), no walls of text; empty, loading and error states have a clear message and a next step.
5. Mobile 375 and tablet 768: real layouts (stack, reorder, full-width primary action, 44px tap targets), nothing cramped or overflowing; overlays become full-width sheets on mobile.
6. Keep exactly: legacy colours, radii, control sizes, fonts and wording (docs/design); keep ids, data-testid, aria labels, routes and behaviour; no new packages; valid TSX.

Route files rule: when you polish a PAGE surface, ALSO polish the loading.tsx, error.tsx, not-found.tsx and template.tsx in the same route folder, and check the nearest parent layout.tsx, as part of that same surface (they are the loading, error and missing states of that page). Tick the page only when its route files are done too.

Proof: ONE entry per surface in docs/audit/ux/polish-lane-11.md: surface | problems found (clutter, misalignment, hierarchy, density, mobile) | what you removed, merged, moved or realigned | files changed. Push to chatgpt/chat-11-b with [chat-11], ticking [x] in this queue in the same push.

- [x] `src/app/(authenticated)/learn/allAssignments/[assignmentId]/page.tsx` (Learner page)
- [x] `src/app/(authenticated)/learn/allAssignments/page.tsx` (Learner page)
- [x] `src/app/(authenticated)/learn/allQuizzes/[quizId]/page.tsx` (Learner page)
- [x] `src/app/(authenticated)/learn/allQuizzes/page.tsx` (Learner page)
- [x] `src/app/(authenticated)/learn/assignments/page.tsx` (Learner page)
- [x] `src/app/(authenticated)/learn/attendance/calendar/page.tsx` (Learner page)
- [x] `src/app/(authenticated)/learn/attendance/page.tsx` (Learner page)
- [x] `src/app/(authenticated)/learn/calendar/page.tsx` (Learner page)
- [x] `src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/courses/[deliveryId]/attendance-summary/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/courses/[deliveryId]/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/courses/[deliveryId]/progress/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/courses/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/my-placements/announcements/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/company/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/my-placements/applications/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/my-placements/assessments/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/my-placements/assessments/results/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/my-placements/calendar/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/my-placements/interviews/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/my-placements/jobs/[jobId]/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/my-placements/jobs/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/my-placements/notification-preferences/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/my-placements/offers/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/my-placements/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/my-placements/placement/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/my-placements/preparation/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/my-placements/rules/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/my-placements/schedule/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/my-placements/support/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/notifications/history/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/notifications/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/placements/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/profile/academic-record/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/profile/completeness/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/profile/data-access/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/profile/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/profile/verification/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/projects/[projectId]/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/projects/page.tsx` (Learner page)
- [ ] `src/app/(authenticated)/learn/quizzes/page.tsx` (Learner page)
- [ ] `src/components/courses/admin-course-create-panel.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/courses/college-archived-lesson-restore.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/courses/college-lesson-drag-order.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/courses/faculty-assessment-lifecycle.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/courses/faculty-assignment-material-links.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/courses/faculty-item-actions.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/courses/faculty-lesson-video-manager.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/courses/faculty-report-download.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/courses/learner-course-workspace.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/courses/resource-progress-control.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
