# UI/UX polish queue: lane chat-12

36 surfaces, in order. ONE SURFACE PER TURN: take only the first unticked surface, make it excellent, tick it, and stop. The next surface comes with the next message. Never work on several surfaces at once.

Polish checklist (apply every point to the surface and to every component it renders, in every state):
1. Clutter: one clear primary action per surface, secondary actions demoted or moved into a menu; merge duplicate links/buttons; remove decoration that carries no information; collapse rarely used filters or fields behind a disclosure; no card inside card.
2. Hierarchy: one h1 (page) or one clear title (overlay), short subtitle, sections in the order people use them, most important content above the fold, related controls grouped with a clear label.
3. Alignment: every section starts on the same left edge, equal gutters and gaps (legacy scale 4/8/12/16/24/32), controls in a row share one height, labels align with inputs, columns align, no stray margins, header actions never wrap badly.
4. Density: consistent padding, comfortable line length, tables trimmed to the columns that matter (rest behind details), no walls of text; empty, loading and error states have a clear message and a next step.
5. Mobile 375 and tablet 768: real layouts (stack, reorder, full-width primary action, 44px tap targets), nothing cramped or overflowing; overlays become full-width sheets on mobile.
6. Keep exactly: legacy colours, radii, control sizes, fonts and wording (docs/design); keep ids, data-testid, aria labels, routes and behaviour; no new packages; valid TSX.

Route files rule: when you polish a PAGE surface, ALSO polish the loading.tsx, error.tsx, not-found.tsx and template.tsx in the same route folder, and check the nearest parent layout.tsx, as part of that same surface (they are the loading, error and missing states of that page). Tick the page only when its route files are done too.

Proof: ONE entry per surface in docs/audit/ux/polish-lane-12.md: surface | problems found (clutter, misalignment, hierarchy, density, mobile) | what you removed, merged, moved or realigned | files changed. Push to chatgpt/chat-12-b with [chat-12], ticking [x] in this queue in the same push.

- [x] `src/app/(authenticated)/teacher/allAssignments/page.tsx` (Faculty page)
- [x] `src/app/(authenticated)/teacher/allQuizzes/page.tsx` (Faculty page)
- [x] `src/app/(authenticated)/teacher/calendar/page.tsx` (Faculty page)
- [x] `src/app/(authenticated)/teacher/contacts/[contactsTab]/[membershipId]/page.tsx` (Faculty page)
- [x] `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx` (Faculty page)
- [x] `src/app/(authenticated)/teacher/contacts/page.tsx` (Faculty page)
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx` (Faculty page)
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/assessment-health/page.tsx` (Faculty page)
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/assignments/manage/page.tsx` (Faculty page)
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/attendance-corrections/page.tsx` (Faculty page)
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx` (Faculty page)
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-history/page.tsx` (Faculty page)
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-participation/page.tsx` (Faculty page)
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/page.tsx` (Faculty page)
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/[learnerMembershipId]/page.tsx` (Faculty page)
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/page.tsx` (Faculty page)
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/notices/page.tsx` (Faculty page)
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/page.tsx` (Faculty page)
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/quizzes/manage/page.tsx` (Faculty page)
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/reports/page.tsx` (Faculty page)
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/session-coverage/page.tsx` (Faculty page)
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/students/[membershipId]/page.tsx` (Faculty page)
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx` (Faculty page)
- [ ] `src/app/(authenticated)/teacher/courses/page.tsx` (Faculty page)
- [ ] `src/app/(authenticated)/teacher/live-classes/page.tsx` (Faculty page)
- [ ] `src/app/(authenticated)/teacher/notifications/page.tsx` (Faculty page)
- [ ] `src/app/(authenticated)/teacher/profile/contacts/page.tsx` (Faculty page)
- [ ] `src/app/(authenticated)/teacher/profile/details/page.tsx` (Faculty page)
- [ ] `src/app/(authenticated)/teacher/profile/page.tsx` (Faculty page)
- [ ] `src/app/(authenticated)/teacher/profile/teaching/page.tsx` (Faculty page)
- [ ] `src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx` (Faculty page)
- [ ] `src/app/(authenticated)/teacher/report/assignment/[contentId]/submissions/page.tsx` (Faculty page)
- [ ] `src/app/(authenticated)/teacher/report/quiz/[quizId]/attempts/page.tsx` (Faculty page)
- [ ] `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx` (Faculty page)
- [ ] `src/app/(authenticated)/teacher/response-followups/page.tsx` (Faculty page)
- [ ] `src/app/(authenticated)/teacher/results/page.tsx` (Faculty page)
- [ ] `src/components/academics/academics-create-panel.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/academics/college-promotion-confirmation.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/academics/college-recurring-preview.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/academics/college-section-lifecycle-action.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/academics/college-term-mapping-manager.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/academics/learner-class-schedule.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/academics/section-operations.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/attendance/college-attendance-policy-form.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/attendance/faculty-attendance-schedule-editor.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/courses/admin-course-display-editor.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/courses/college-assignment-create.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/courses/college-lesson-reorder-actions.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/courses/faculty-assignment-editor.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/courses/faculty-content-order-editor.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/courses/faculty-lesson-authoring.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/courses/faculty-live-class-editor.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/courses/learner-course-discussion.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
- [ ] `src/components/courses/learner-quiz-attempt.tsx` (Component with overlays: modals, drawers, menus, popovers, toasts. Polish EVERY state: open, create, update, confirm/delete, validation error, success, loading, mobile)
