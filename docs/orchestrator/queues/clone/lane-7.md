# Clone queue: lane chat-7

Generated from the code by the orchestrator's deviation audit. Work each section top to bottom, in batches of about 30 items. When an item is finished and proven, change its `[ ]` to `[x]` in this file in the same push. Never delete or reorder lines; only tick.

## Section 1: files that still deviate from the shared look (20)
Fix every listed deviation using the shared components in src/components/ui and the values in docs/design/ (shell spec, legacy-styles, ui-clone-checklist).

- [x] `src/components/academics/learner-class-schedule.tsx` (score 8: rounded-full pill x2, arbitrary px size x2, inline style x1)
- [x] `src/components/courses/faculty-content-editor.tsx` (score 7: arbitrary px size x7)
- [x] `src/components/profile/learner-profile-workspace.tsx` (score 5: rounded-full pill x2, arbitrary px size x1)
- [x] `src/components/profile/learner-skill-catalog-input.tsx` (score 4: arbitrary px size x4)
- [x] `src/app/(authenticated)/learn/my-placements/announcements/page.tsx` (score 3: arbitrary px size x3)
- [x] `src/components/courses/learner-course-discussion.tsx` (score 3: rounded-full pill x1, arbitrary px size x1)
- [x] `src/components/projects/project-lifecycle-actions.tsx` (score 3: arbitrary px size x3)
- [x] `src/app/(authenticated)/admin/course-progress/page.tsx` (score 2: arbitrary px size x2)
- [x] `src/app/(authenticated)/admin/lessons/page.tsx` (score 2: arbitrary px size x2)
- [x] `src/app/(authenticated)/learn/attendance/calendar/page.tsx` (score 2: rounded-full pill x1)
- [x] `src/app/(authenticated)/learn/my-placements/offers/page.tsx` (score 2: arbitrary px size x2)
- [x] `src/app/(authenticated)/learn/my-placements/schedule/page.tsx` (score 2: arbitrary px size x2)
- [x] `src/components/courses/faculty-assessment-create.tsx` (score 2: arbitrary px size x2)
- [x] `src/components/courses/faculty-assignment-material-links.tsx` (score 2: arbitrary px size x2)
- [x] `src/components/placements/learner-jobs-browse.tsx` (score 2: arbitrary px size x2)
- [x] `src/app/(authenticated)/learn/my-placements/assessments/results/page.tsx` (score 1: arbitrary px size x1)
- [x] `src/app/(authenticated)/learn/profile/completeness/page.tsx` (score 1: arbitrary px size x1)
- [x] `src/components/placements/learner-applications-browse.tsx` (score 1: arbitrary px size x1)
- [x] `src/components/placements/learner-career-rounds-workspace.tsx` (score 1: arbitrary px size x1)
- [x] `src/components/placements/learner-placement-jobs.tsx` (score 1: arbitrary px size x1)

## Section 2: page routes, full fidelity pass (38)
For each page: page head via PageHeader (title, subtitle, actions exactly as the old LMS), canvas card (white, radius 12, border #e5e9f0, padding 24), tabs, filter row, tables/grids/cards, chips and badges, banners and inline notices, every modal and drawer the page opens, buttons and forms, empty/loading/error states, toasts, spacing and typography values, and responsive at 1280, 768 and 375 widths. Read the page and the components it renders, fix every deviation you find, not only the listed ones.

- [x] `src/app/(authenticated)/admin/assignments/page.tsx`
- [x] `src/app/(authenticated)/admin/course-progress/page.tsx`
- [x] `src/app/(authenticated)/admin/course-progress/students/page.tsx`
- [x] `src/app/(authenticated)/admin/courses/offerings/[offeringId]/page.tsx`
- [x] `src/app/(authenticated)/admin/courses/page.tsx`
- [x] `src/app/(authenticated)/admin/lessons/page.tsx`
- [x] `src/app/(authenticated)/dashboard/page.tsx`
- [x] `src/app/(authenticated)/hr/conversations/[threadId]/page.tsx`
- [x] `src/app/(authenticated)/hr/drives/page.tsx`
- [x] `src/app/(authenticated)/hr/home/page.tsx`
- [ ] `src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx`
- [ ] `src/app/(authenticated)/learn/allAssignments/[assignmentId]/page.tsx`
- [ ] `src/app/(authenticated)/learn/allQuizzes/[quizId]/page.tsx`
- [ ] `src/app/(authenticated)/learn/attendance/calendar/page.tsx`
- [ ] `src/app/(authenticated)/learn/attendance/page.tsx`
- [ ] `src/app/(authenticated)/learn/calendar/page.tsx`
- [ ] `src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx`
- [ ] `src/app/(authenticated)/learn/courses/[deliveryId]/attendance-summary/page.tsx`
- [ ] `src/app/(authenticated)/learn/courses/[deliveryId]/progress/page.tsx`
- [ ] `src/app/(authenticated)/learn/courses/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/announcements/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/company/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/applications/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/assessments/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/assessments/results/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/calendar/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/interviews/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/jobs/[jobId]/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/jobs/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/notification-preferences/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/offers/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/preparation/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/rules/page.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/schedule/page.tsx`
- [ ] `src/app/(authenticated)/learn/notifications/page.tsx`
