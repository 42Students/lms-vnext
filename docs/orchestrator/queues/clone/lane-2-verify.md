# UI/UX polish VERIFICATION queue: lane chat-2 (surfaces polished by OTHER lanes)

48 surfaces. Each was already polished by another lane. Your job is to VERIFY and improve, strictly one surface at a time.

1. Regressions first (a polish pass edits many files without running code): matching tags, every import present and used, no duplicate attributes, no undeclared packages, props still match their component types, no removed export that another file imports. Fix anything broken.
2. Behaviour kept: ids, data-testid, aria labels, routes, permissions, form fields, wording (docs/audit/legacy-copy-A.md and B.md) and legacy tokens (docs/design) must be unchanged; if the polish dropped or reworded something, restore it.
3. Then judge the surface fresh as a senior product designer: is anything still cluttered, misaligned, duplicated or noisy? One obvious primary action? Aligned left edges and gaps on the legacy scale? Calm density? Real layouts at 375 and 768? Empty, loading, error states with a clear next step? Fix what you find.
4. Also check the route files in the same folder (loading, error, not-found, template) and the nearest parent layout.

Proof: ONE entry per surface in docs/audit/ux/verify-lane-2.md: surface | regressions found and fixed | extra clutter/alignment fixes | files changed (write 'verified, no change' only after a real read of every component). Tick [x] here and push to chatgpt/chat-2-b with [chat-2] after every 2 surfaces.

- [x] `src/app/(authenticated)/teacher/allAssignments/page.tsx`
- [x] `src/app/(authenticated)/teacher/allQuizzes/page.tsx`
- [x] `src/app/(authenticated)/teacher/calendar/page.tsx`
- [x] `src/app/(authenticated)/teacher/contacts/[contactsTab]/[membershipId]/page.tsx`
- [x] `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx`
- [x] `src/app/(authenticated)/teacher/contacts/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/assessment-health/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/assignments/manage/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/attendance-corrections/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-history/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-participation/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/[learnerMembershipId]/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/notices/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/quizzes/manage/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/reports/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/session-coverage/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/students/[membershipId]/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx`
- [x] `src/app/(authenticated)/teacher/courses/page.tsx`
- [x] `src/app/(authenticated)/teacher/live-classes/page.tsx`
- [x] `src/app/(authenticated)/teacher/notifications/page.tsx`
- [x] `src/app/(authenticated)/teacher/profile/contacts/page.tsx`
- [x] `src/app/(authenticated)/teacher/profile/details/page.tsx`
- [x] `src/app/(authenticated)/teacher/profile/page.tsx`
- [x] `src/app/(authenticated)/teacher/profile/teaching/page.tsx`
- [x] `src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx`
- [x] `src/app/(authenticated)/teacher/report/assignment/[contentId]/submissions/page.tsx`
- [x] `src/app/(authenticated)/teacher/report/quiz/[quizId]/attempts/page.tsx`
- [x] `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx`
- [x] `src/app/(authenticated)/teacher/response-followups/page.tsx`
- [x] `src/app/(authenticated)/teacher/results/page.tsx`
- [x] `src/components/academics/academics-create-panel.tsx`
- [x] `src/components/academics/college-promotion-confirmation.tsx`
- [x] `src/components/academics/college-recurring-preview.tsx`
- [x] `src/components/academics/college-section-lifecycle-action.tsx`
- [x] `src/components/academics/section-operations.tsx`
- [x] `src/components/attendance/college-attendance-policy-form.tsx`
- [x] `src/components/attendance/faculty-attendance-schedule-editor.tsx`
- [x] `src/components/courses/admin-course-display-editor.tsx`
- [x] `src/components/courses/faculty-assignment-editor.tsx`
- [x] `src/components/courses/faculty-content-order-editor.tsx`
- [x] `src/components/courses/faculty-lesson-authoring.tsx`
- [ ] `src/components/courses/faculty-live-class-editor.tsx`
