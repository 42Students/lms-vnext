# Clone queue: lane chat-3

Generated from the code by the orchestrator's deviation audit. Work each section top to bottom, in batches of about 30 items. When an item is finished and proven, change its `[ ]` to `[x]` in this file in the same push. Never delete or reorder lines; only tick.

## Section 1: files that still deviate from the shared look (46)
Fix every listed deviation using the shared components in src/components/ui and the values in docs/design/ (shell spec, legacy-styles, ui-clone-checklist).

- [ ] `src/components/academics/academics-actions.tsx` (score 14: arbitrary px size x14)
- [ ] `src/components/courses/faculty-choice-quiz-builder.tsx` (score 13: arbitrary px size x13)
- [ ] `src/components/courses/faculty-lesson-video-manager.tsx` (score 8: arbitrary px size x8)
- [ ] `src/app/(authenticated)/teacher/results/page.tsx` (score 7: arbitrary px size x7)
- [ ] `src/components/attendance/faculty-attendance-schedule-editor.tsx` (score 7: arbitrary px size x7)
- [ ] `src/components/courses/faculty-assessment-overview.tsx` (score 7: arbitrary px size x7)
- [ ] `src/components/academics/section-operations.tsx` (score 6: arbitrary px size x6)
- [ ] `src/components/courses/faculty-assignment-editor.tsx` (score 6: arbitrary px size x6)
- [ ] `src/components/courses/faculty-course-roster.tsx` (score 6: rounded-full pill x3)
- [ ] `src/app/(authenticated)/teacher/response-followups/page.tsx` (score 5: arbitrary px size x5)
- [ ] `src/components/admin/person-profile-dialog.tsx` (score 5: arbitrary px size x5)
- [ ] `src/components/courses/faculty-course-list.tsx` (score 5: arbitrary px size x5)
- [ ] `src/components/courses/faculty-ist-quarter-hour-picker.tsx` (score 5: arbitrary px size x5)
- [ ] `src/components/courses/faculty-live-class-editor.tsx` (score 5: arbitrary px size x5)
- [ ] `src/app/(authenticated)/admin/people/directory/page.tsx` (score 4: arbitrary px size x4)
- [ ] `src/components/attendance/faculty-attendance-workspace.tsx` (score 4: arbitrary px size x4)
- [ ] `src/components/courses/faculty-assessment-editor.tsx` (score 4: arbitrary px size x4)
- [ ] `src/components/courses/faculty-course-tab-navigation.tsx` (score 4: arbitrary px size x4)
- [ ] `src/app/(authenticated)/admin/people/page.tsx` (score 3: arbitrary px size x3)
- [ ] `src/app/(authenticated)/teacher/profile/page.tsx` (score 3: arbitrary px size x3)
- [ ] `src/components/courses/faculty-quiz-question-editor.tsx` (score 3: arbitrary px size x3)
- [ ] `src/components/people/faculty-profile-metadata.tsx` (score 3: arbitrary px size x3)
- [ ] `src/components/people/faculty-profile-skills.tsx` (score 3: arbitrary px size x3)
- [ ] `src/components/projects/project-mentor-reassignment.tsx` (score 3: arbitrary px size x3)
- [ ] `src/app/(authenticated)/teacher/calendar/page.tsx` (score 2: arbitrary px size x2)
- [ ] `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx` (score 2: arbitrary px size x2)
- [ ] `src/app/(authenticated)/teacher/live-classes/page.tsx` (score 2: arbitrary px size x2)
- [ ] `src/components/courses/faculty-assignment-method-picker.tsx` (score 2: arbitrary px size x2)
- [ ] `src/components/people/faculty-profile-repeatable.tsx` (score 2: arbitrary px size x2)
- [ ] `src/app/(authenticated)/admin/people/directory/[membershipId]/page.tsx` (score 1: arbitrary px size x1)
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/assessment-health/page.tsx` (score 1: arbitrary px size x1)
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-history/page.tsx` (score 1: arbitrary px size x1)
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/page.tsx` (score 1: arbitrary px size x1)
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/reports/page.tsx` (score 1: arbitrary px size x1)
- [ ] `src/app/(authenticated)/teacher/profile/teaching/page.tsx` (score 1: arbitrary px size x1)
- [ ] `src/app/(authenticated)/teacher/report/assignment/[contentId]/submissions/page.tsx` (score 1: arbitrary px size x1)
- [ ] `src/app/(authenticated)/teacher/report/quiz/[quizId]/attempts/page.tsx` (score 1: arbitrary px size x1)
- [ ] `src/components/academics/academics-create-panel.tsx` (score 1: arbitrary px size x1)
- [ ] `src/components/admin/department-actions.tsx` (score 1: arbitrary px size x1)
- [ ] `src/components/admin/organization-create-form.tsx` (score 1: arbitrary px size x1)
- [ ] `src/components/admin/person-membership-actions.tsx` (score 1: arbitrary px size x1)
- [ ] `src/components/attendance/admin-attendance-workspace.tsx` (score 1: arbitrary px size x1)
- [ ] `src/components/courses/faculty-assignment-review.tsx` (score 1: arbitrary px size x1)
- [ ] `src/components/courses/faculty-quiz-learner-preview.tsx` (score 1: arbitrary px size x1)
- [ ] `src/components/courses/faculty-report-student-table.tsx` (score 1: arbitrary px size x1)
- [ ] `src/components/people/faculty-profile-editor.tsx` (score 1: arbitrary px size x1)

## Section 2: page routes, full fidelity pass (38)
For each page: page head via PageHeader (title, subtitle, actions exactly as the old LMS), canvas card (white, radius 12, border #e5e9f0, padding 24), tabs, filter row, tables/grids/cards, chips and badges, banners and inline notices, every modal and drawer the page opens, buttons and forms, empty/loading/error states, toasts, spacing and typography values, and responsive at 1280, 768 and 375 widths. Read the page and the components it renders, fix every deviation you find, not only the listed ones.

- [ ] `src/app/(authenticated)/admin/academics/page.tsx`
- [ ] `src/app/(authenticated)/admin/people/directory/[membershipId]/page.tsx`
- [ ] `src/app/(authenticated)/admin/people/directory/page.tsx`
- [ ] `src/app/(authenticated)/admin/people/page.tsx`
- [ ] `src/app/(authenticated)/college/people/page.tsx`
- [ ] `src/app/(authenticated)/college/placements/drives/page.tsx`
- [ ] `src/app/(authenticated)/teach/courses/[deliveryId]/page.tsx`
- [ ] `src/app/(authenticated)/teach/courses/page.tsx`
- [ ] `src/app/(authenticated)/teacher/allAssignments/page.tsx`
- [ ] `src/app/(authenticated)/teacher/allQuizzes/page.tsx`
- [ ] `src/app/(authenticated)/teacher/calendar/page.tsx`
- [ ] `src/app/(authenticated)/teacher/contacts/[contactsTab]/[membershipId]/page.tsx`
- [ ] `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/assessment-health/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/assignments/manage/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-history/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-participation/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/[learnerMembershipId]/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/notices/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/quizzes/manage/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/reports/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/session-coverage/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/students/[membershipId]/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/page.tsx`
- [ ] `src/app/(authenticated)/teacher/live-classes/page.tsx`
- [ ] `src/app/(authenticated)/teacher/notifications/page.tsx`
- [ ] `src/app/(authenticated)/teacher/profile/contacts/page.tsx`
- [ ] `src/app/(authenticated)/teacher/profile/details/page.tsx`
- [ ] `src/app/(authenticated)/teacher/profile/page.tsx`
- [ ] `src/app/(authenticated)/teacher/profile/teaching/page.tsx`
- [ ] `src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx`
- [ ] `src/app/(authenticated)/teacher/report/assignment/[contentId]/submissions/page.tsx`
- [ ] `src/app/(authenticated)/teacher/report/quiz/[quizId]/attempts/page.tsx`
- [ ] `src/app/(authenticated)/teacher/response-followups/page.tsx`
