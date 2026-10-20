# UI/UX polish queue: lane chat-13

32 surfaces, in order. ONE SURFACE PER TURN: take only the first unticked surface, make it excellent, tick it, and stop. The next surface comes with the next message. Never work on several surfaces at once.

Polish checklist (apply every point to the surface and to every component it renders, in every state):
1. Clutter: one clear primary action per surface, secondary actions demoted or moved into a menu; merge duplicate links/buttons; remove decoration that carries no information; collapse rarely used filters or fields behind a disclosure; no card inside card.
2. Hierarchy: one h1 (page) or one clear title (overlay), short subtitle, sections in the order people use them, most important content above the fold, related controls grouped with a clear label.
3. Alignment: every section starts on the same left edge, equal gutters and gaps (legacy scale 4/8/12/16/24/32), controls in a row share one height, labels align with inputs, columns align, no stray margins, header actions never wrap badly.
4. Density: consistent padding, comfortable line length, tables trimmed to the columns that matter (rest behind details), no walls of text; empty, loading and error states have a clear message and a next step.
5. Mobile 375 and tablet 768: real layouts (stack, reorder, full-width primary action, 44px tap targets), nothing cramped or overflowing; overlays become full-width sheets on mobile.
6. Keep exactly: legacy colours, radii, control sizes, fonts and wording (docs/design); keep ids, data-testid, aria labels, routes and behaviour; no new packages; valid TSX.

Route files rule: when you polish a PAGE surface, ALSO polish the loading.tsx, error.tsx, not-found.tsx and template.tsx in the same route folder, and check the nearest parent layout.tsx, as part of that same surface (they are the loading, error and missing states of that page). Tick the page only when its route files are done too.

Proof: ONE entry per surface in docs/audit/ux/polish-lane-13.md: surface | problems found (clutter, misalignment, hierarchy, density, mobile) | what you removed, merged, moved or realigned | files changed. Push to chatgpt/chat-13-b with [chat-13], ticking [x] in this queue in the same push.

- [x] `src/app/(authenticated)/mentor/activity/page.tsx` (Mentor page)
- [x] `src/app/(authenticated)/mentor/allQuizzes/page.tsx` (Mentor page)
- [x] `src/app/(authenticated)/mentor/calendar/page.tsx` (Mentor page)
- [x] `src/app/(authenticated)/mentor/contacts/[[...contactsTab]]/page.tsx` (Mentor page)
- [x] `src/app/(authenticated)/mentor/courses/[courseId]/[[...courseTab]]/page.tsx` (Mentor page)
- [x] `src/app/(authenticated)/mentor/courses/page.tsx` (Mentor page)
- [x] `src/app/(authenticated)/mentor/fileExplorer/page.tsx` (Mentor page)
- [x] `src/app/(authenticated)/mentor/notifications/page.tsx` (Mentor page)
- [x] `src/app/(authenticated)/mentor/page.tsx` (Mentor page)
- [x] `src/app/(authenticated)/mentor/profile/page.tsx` (Mentor page)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx` (Mentor page)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/board-review/page.tsx` (Mentor page)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/closeout/page.tsx` (Mentor page)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/deliveries/[submissionId]/review/page.tsx` (Mentor page)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/meetings/[meetingId]/notes/page.tsx` (Mentor page)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/page.tsx` (Mentor page)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/resources-directory/page.tsx` (Mentor page)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/review-completeness/page.tsx` (Mentor page)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/review-overview/page.tsx` (Mentor page)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/risk-readiness/page.tsx` (Mentor page)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/tasks/[taskId]/feedback/page.tsx` (Mentor page)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/team-history/page.tsx` (Mentor page)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/team-meetings/page.tsx` (Mentor page)
- [x] `src/app/(authenticated)/mentor/projects/[projectId]/timeline/page.tsx` (Mentor page)
- [x] `src/app/(authenticated)/mentor/projects/page.tsx` (Mentor page)
- [x] `src/app/(authenticated)/mentor/reports/page.tsx` (Mentor page)
- [x] `src/app/(authenticated)/mentor/review-history/page.tsx` (Mentor page)
- [x] `src/app/(authenticated)/mentor/reviews/page.tsx` (Mentor page)
- [x] `src/app/(authenticated)/mentor/sprint-progress/page.tsx` (Mentor page)
- [x] `src/app/(authenticated)/mentor/task-review-history/page.tsx` (Mentor page)
- [x] `src/app/(authenticated)/mentor/task-reviews/page.tsx` (Mentor page)
- [x] `src/app/(authenticated)/mentor/team-coverage/page.tsx` (Mentor page)
- [x] `src/components/projects/learner-task-progress-control.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [x] `src/components/projects/mentor-lane-board.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [x] `src/components/projects/mentor-product-backlog.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [x] `src/components/projects/mentor-project-closeout-control.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [x] `src/components/projects/mentor-release-editor.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [x] `src/components/projects/mentor-task-delete-control.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [x] `src/components/projects/mentor-task-status-transition.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [x] `src/components/projects/project-readiness-override-form.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [x] `src/components/projects/project-resource-files-panel.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/projects/project-workspace.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/projects/super-admin-template-college-bulk.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
