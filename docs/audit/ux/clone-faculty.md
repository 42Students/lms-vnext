# Faculty / Teacher and Super Admin Academics / People — UI clone

Owner: chat-3; branch: `chatgpt/chat-3-b`. Branch fast-forwarded to main at `d915bd67b20838f496d2a5b25b4365e748a35dd5` on 2026-10-19. Do not edit `src/components/ui/*`.

## Work queue

Source: complete recursive GitHub tree of current `main`, filtered like `find src/app/'(authenticated)'/teacher src/app/'(authenticated)'/admin/{academics,people,recruiters} -name 'page.tsx' -o -name 'layout.tsx'` and component prefix filtering. This is a **path inventory**; not yet an executed local grep or a count of raw controls. Mark all unchecked until the strict value, coverage, responsive and no-regression proofs exist.

### Routes & layouts (46)

- [ ] `src/app/(authenticated)/admin/academics/page.tsx`
- [ ] `src/app/(authenticated)/admin/academics/sections/[sectionId]/page.tsx`
- [ ] `src/app/(authenticated)/admin/people/directory/[membershipId]/audit/page.tsx`
- [ ] `src/app/(authenticated)/admin/people/directory/[membershipId]/page.tsx`
- [ ] `src/app/(authenticated)/admin/people/directory/page.tsx`
- [ ] `src/app/(authenticated)/admin/people/page.tsx`
- [ ] `src/app/(authenticated)/admin/people/unassigned/page.tsx`
- [ ] `src/app/(authenticated)/admin/recruiters/page.tsx`
- [ ] `src/app/(authenticated)/teacher/allAssignments/page.tsx`
- [ ] `src/app/(authenticated)/teacher/allQuizzes/page.tsx`
- [ ] `src/app/(authenticated)/teacher/calendar/page.tsx`
- [ ] `src/app/(authenticated)/teacher/contacts/[contactsTab]/[membershipId]/page.tsx`
- [ ] `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx`
- [ ] `src/app/(authenticated)/teacher/contacts/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/assessment-health/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/assignments/manage/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/attendance-corrections/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-history/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-participation/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/[learnerMembershipId]/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/layout.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/notices/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/quizzes/manage/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/reports/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/session-coverage/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/students/[membershipId]/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/page.tsx`
- [ ] `src/app/(authenticated)/teacher/layout.tsx`
- [ ] `src/app/(authenticated)/teacher/live-classes/page.tsx`
- [ ] `src/app/(authenticated)/teacher/notifications/page.tsx`
- [ ] `src/app/(authenticated)/teacher/profile/contacts/page.tsx`
- [ ] `src/app/(authenticated)/teacher/profile/details/page.tsx`
- [ ] `src/app/(authenticated)/teacher/profile/page.tsx`
- [ ] `src/app/(authenticated)/teacher/profile/teaching/page.tsx`
- [ ] `src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx`
- [ ] `src/app/(authenticated)/teacher/report/assignment/[contentId]/submissions/page.tsx`
- [ ] `src/app/(authenticated)/teacher/report/quiz/[quizId]/attempts/page.tsx`
- [ ] `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx`
- [ ] `src/app/(authenticated)/teacher/response-followups/page.tsx`
- [ ] `src/app/(authenticated)/teacher/results/page.tsx`

### Directly related components (48)

- [ ] `src/components/academics/academics-actions.tsx`
- [ ] `src/components/academics/academics-create-panel.tsx`
- [ ] `src/components/academics/academics-overview.tsx`
- [ ] `src/components/academics/academics-section-page.tsx`
- [ ] `src/components/academics/section-operations.tsx`
- [ ] `src/components/admin/super-admin-attendance-settings-editor.tsx`
- [ ] `src/components/admin/super-admin-faculty-assignment-create.tsx`
- [ ] `src/components/admin/super-admin-faculty-bulk-import.tsx`
- [ ] `src/components/admin/super-admin-faculty-schedule-reassign-action.tsx`
- [ ] `src/components/admin/super-admin-people-csv-control.tsx`
- [ ] `src/components/attendance/faculty-attendance-schedule-editor.tsx`
- [ ] `src/components/attendance/faculty-attendance-workspace.tsx`
- [ ] `src/components/courses/faculty-assessment-create.tsx`
- [ ] `src/components/courses/faculty-assessment-editor.tsx`
- [ ] `src/components/courses/faculty-assessment-lifecycle.tsx`
- [ ] `src/components/courses/faculty-assessment-overview.tsx`
- [ ] `src/components/courses/faculty-assignment-editor.tsx`
- [ ] `src/components/courses/faculty-assignment-material-links.tsx`
- [ ] `src/components/courses/faculty-assignment-method-picker.tsx`
- [ ] `src/components/courses/faculty-assignment-review.tsx`
- [ ] `src/components/courses/faculty-choice-quiz-builder.tsx`
- [ ] `src/components/courses/faculty-contacts-table.tsx`
- [ ] `src/components/courses/faculty-content-editor.tsx`
- [ ] `src/components/courses/faculty-content-order-editor.tsx`
- [ ] `src/components/courses/faculty-course-filter-auto-submit.tsx`
- [ ] `src/components/courses/faculty-course-home-signals.tsx`
- [ ] `src/components/courses/faculty-course-list.tsx`
- [ ] `src/components/courses/faculty-course-roster.tsx`
- [ ] `src/components/courses/faculty-course-tab-navigation.tsx`
- [ ] `src/components/courses/faculty-course-workspace.tsx`
- [ ] `src/components/courses/faculty-ist-quarter-hour-picker.tsx`
- [ ] `src/components/courses/faculty-item-actions.tsx`
- [ ] `src/components/courses/faculty-lesson-authoring.tsx`
- [ ] `src/components/courses/faculty-lesson-video-manager.tsx`
- [ ] `src/components/courses/faculty-live-class-editor.tsx`
- [ ] `src/components/courses/faculty-quiz-learner-preview.tsx`
- [ ] `src/components/courses/faculty-quiz-question-editor.tsx`
- [ ] `src/components/courses/faculty-quiz-review.tsx`
- [ ] `src/components/courses/faculty-report-csv-download.tsx`
- [ ] `src/components/courses/faculty-report-download.tsx`
- [ ] `src/components/courses/faculty-report-student-table.tsx`
- [ ] `src/components/courses/faculty-submission-file-review.tsx`
- [ ] `src/components/courses/faculty-video-preview.tsx`
- [ ] `src/components/people/faculty-profile-editor.tsx`
- [ ] `src/components/people/faculty-profile-metadata.tsx`
- [ ] `src/components/people/faculty-profile-repeatable.tsx`
- [ ] `src/components/people/faculty-profile-skills.tsx`
- [ ] `src/components/people/faculty-profile-text-section.tsx`

### Required greps (pending execution and recorded counts)

```sh
rg -n '<(button|select|input|textarea|table)([[:space:]>])' 'src/app/(authenticated)/teacher' 'src/app/(authenticated)/admin/academics' 'src/app/(authenticated)/admin/people' 'src/app/(authenticated)/admin/recruiters' src/components/courses src/components/attendance src/components/people src/components/academics src/components/admin
rg -n '#[0-9A-Fa-f]{3,8}\\b|fixed inset-0|role=.?(alert)?dialog|<h1([[:space:]>])' SAME_PATHS
rg -n '<PageHeader([[:space:]>])' SAME_PATHS
```

Components shared with other portals must be narrowed by usage rather than changing others' ownership. Replace *only* page-owned raw controls with `src/components/ui` equivalents. Preserve section content, forms, handlers, semantics and responsive behavior; review every touched closing JSX tag.

## Strict tick status

- [ ] H Teacher/faculty pages (missing: raw-control inventory and migration, legacy/current file:line comparison tables, zero remaining grep hits, phone/tablet proof).
- [ ] H Assessments/quiz/attendance/grades components (missing: reference/usage graph and strict coverage proof).
- [ ] H Super Admin academics/people/recruiters (missing: raw-control migration, strict coverage proof).

Reference facts: `docs/design/old-lms-pages.md` prescribes one #fff canvas radius 12, border #e5e9f0, 24px padding on #f1f4f9, inline subtitle/title/right actions. `docs/design/legacy-styles/components___variables.scss` defines 767px / 991px / 1024px breakpoints. `src/components/ui/page-header.tsx` exposes PageHeader. Shared skins belong to their owner lane; do not modify them here.

## Next file

`src/app/(authenticated)/teacher/allAssignments/page.tsx` — audit the styled link and downstream `src/components/courses/faculty-assessment-overview.tsx`, then proceed in route order.
