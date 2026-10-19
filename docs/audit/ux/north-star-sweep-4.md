# North Star visual sweep — lane chat-4

**Branch:** `chatgpt/chat-4-b`  
**Owner:** College Admin portal and Super Admin colleges / organizations.  
**Baseline:** `main` at `371eb3168b5aa494ab29926e915003ee7a765d66` (fast-forwarded with branch lease).  
**Status:** Inventory created before style edits; each path below requires visual-token audit, not a claim of completion.

## Binding references

`docs/orchestrator/queues/master-queue.md` NORTH STAR; `docs/design/old-lms-shell-spec.md`; `old-lms-shell.css`; `old-lms-pages.md`; `vnext-vs-old-lms-gap.md`; SCSS in `docs/design/legacy-styles/` (variables, forms, buttons, dropdowns, header, admin lists).

## Rules and ownership

- Preserve all existing page sections, actions, text, routes, state, layout order and behaviour. This is **shell and visual treatment**, not a content redesign.
- One authenticated canvas: white `#fff`, border `#e5e9f0`, radius 12, padding 24, shell `#f1f4f9`. Do not add nested page-level white cards.
- Use shared tokens and primitives. Primary button `#0a7c88` with **white** text, 9px radius, 36px height; Inter; h1 30px/600 `#172033`; tokenized controls, shadows, tables, spacing, rings, focus and states.
- **Do not edit** shared `src/components/ui/**`, global CSS, shell/sidebar/topbar, or their layouts (chat-17/19/13 own them). Keep existing semantic status colours and genuinely separate cards.
- No test, build, lint or CI execution. Avoid broad automated changes that modify business logic or dynamic TS strings; validate balanced JSX and `as` casts by inspection.

## File-by-file sweep inventory

### College Admin portal routes (260)

- [x] `src/app/(authenticated)/college/academics/error.tsx`
- [x] `src/app/(authenticated)/college/academics/loading.tsx`
- [x] `src/app/(authenticated)/college/academics/page.tsx`
- [x] `src/app/(authenticated)/college/academics/sections/[sectionId]/error.tsx`
- [x] `src/app/(authenticated)/college/academics/sections/[sectionId]/loading.tsx`
- [x] `src/app/(authenticated)/college/academics/sections/[sectionId]/page.tsx`
- [x] `src/app/(authenticated)/college/activity/[eventId]/error.tsx`
- [x] `src/app/(authenticated)/college/activity/[eventId]/loading.tsx`
- [x] `src/app/(authenticated)/college/activity/[eventId]/page.tsx`
- [x] `src/app/(authenticated)/college/activity/error.tsx`
- [x] `src/app/(authenticated)/college/activity/loading.tsx`
- [x] `src/app/(authenticated)/college/activity/page.tsx`
- [x] `src/app/(authenticated)/college/announcements/error.tsx`
- [x] `src/app/(authenticated)/college/announcements/loading.tsx`
- [x] `src/app/(authenticated)/college/announcements/page.tsx`
- [x] `src/app/(authenticated)/college/assignments/error.tsx`
- [x] `src/app/(authenticated)/college/assignments/loading.tsx`
- [x] `src/app/(authenticated)/college/assignments/page.tsx`
- [x] `src/app/(authenticated)/college/attendance/corrections/error.tsx`
- [x] `src/app/(authenticated)/college/attendance/corrections/loading.tsx`
- [x] `src/app/(authenticated)/college/attendance/corrections/page.tsx`
- [x] `src/app/(authenticated)/college/attendance/departments/error.tsx`
- [x] `src/app/(authenticated)/college/attendance/departments/loading.tsx`
- [x] `src/app/(authenticated)/college/attendance/departments/page.tsx`
- [x] `src/app/(authenticated)/college/attendance/error.tsx`
- [x] `src/app/(authenticated)/college/attendance/loading.tsx`
- [x] `src/app/(authenticated)/college/attendance/page.tsx`
- [x] `src/app/(authenticated)/college/attendance/settings/error.tsx`
- [x] `src/app/(authenticated)/college/attendance/settings/loading.tsx`
- [x] `src/app/(authenticated)/college/attendance/settings/page.tsx`
- [x] `src/app/(authenticated)/college/batch-promotion/error.tsx`
- [x] `src/app/(authenticated)/college/batch-promotion/loading.tsx`
- [x] `src/app/(authenticated)/college/batch-promotion/page.tsx`
- [x] `src/app/(authenticated)/college/batches/[cohortId]/students/error.tsx`
- [x] `src/app/(authenticated)/college/batches/[cohortId]/students/loading.tsx`
- [x] `src/app/(authenticated)/college/batches/[cohortId]/students/page.tsx`
- [x] `src/app/(authenticated)/college/batches/error.tsx`
- [x] `src/app/(authenticated)/college/batches/loading.tsx`
- [x] `src/app/(authenticated)/college/batches/page.tsx`
- [x] `src/app/(authenticated)/college/branding/error.tsx`
- [x] `src/app/(authenticated)/college/branding/loading.tsx`
- [x] `src/app/(authenticated)/college/branding/page.tsx`
- [x] `src/app/(authenticated)/college/classes/error.tsx`
- [x] `src/app/(authenticated)/college/classes/loading.tsx`
- [x] `src/app/(authenticated)/college/classes/page.tsx`
- [x] `src/app/(authenticated)/college/classes/recurring-preview/error.tsx`
- [x] `src/app/(authenticated)/college/classes/recurring-preview/loading.tsx`
- [x] `src/app/(authenticated)/college/classes/recurring-preview/page.tsx`
- [x] `src/app/(authenticated)/college/college-profile/error.tsx`
- [x] `src/app/(authenticated)/college/college-profile/loading.tsx`
- [x] `src/app/(authenticated)/college/college-profile/page.tsx`
- [x] `src/app/(authenticated)/college/companies/error.tsx`
- [x] `src/app/(authenticated)/college/companies/loading.tsx`
- [x] `src/app/(authenticated)/college/companies/page.tsx`
- [x] `src/app/(authenticated)/college/contacts/[membershipId]/error.tsx`
- [x] `src/app/(authenticated)/college/contacts/[membershipId]/loading.tsx`
- [x] `src/app/(authenticated)/college/contacts/[membershipId]/page.tsx`
- [x] `src/app/(authenticated)/college/contacts/error.tsx`
- [x] `src/app/(authenticated)/college/contacts/loading.tsx`
- [x] `src/app/(authenticated)/college/contacts/page.tsx`
- [x] `src/app/(authenticated)/college/course-progress/error.tsx`
- [x] `src/app/(authenticated)/college/course-progress/loading.tsx`
- [x] `src/app/(authenticated)/college/course-progress/page.tsx`
- [x] `src/app/(authenticated)/college/courses/error.tsx`
- [x] `src/app/(authenticated)/college/courses/loading.tsx`
- [x] `src/app/(authenticated)/college/courses/offerings/[offeringId]/error.tsx`
- [x] `src/app/(authenticated)/college/courses/offerings/[offeringId]/loading.tsx`
- [x] `src/app/(authenticated)/college/courses/offerings/[offeringId]/not-found.tsx`
- [x] `src/app/(authenticated)/college/courses/offerings/[offeringId]/page.tsx`
- [x] `src/app/(authenticated)/college/courses/page.tsx`
- [x] `src/app/(authenticated)/college/departments/error.tsx`
- [x] `src/app/(authenticated)/college/departments/loading.tsx`
- [x] `src/app/(authenticated)/college/departments/page.tsx`
- [x] `src/app/(authenticated)/college/domains/error.tsx`
- [x] `src/app/(authenticated)/college/domains/loading.tsx`
- [x] `src/app/(authenticated)/college/domains/page.tsx`
- [x] `src/app/(authenticated)/college/electives/[slotId]/allocate/error.tsx`
- [x] `src/app/(authenticated)/college/electives/[slotId]/allocate/loading.tsx`
- [x] `src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx`
- [x] `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/error.tsx`
- [x] `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/loading.tsx`
- [x] `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx`
- [x] `src/app/(authenticated)/college/electives/error.tsx`
- [x] `src/app/(authenticated)/college/electives/loading.tsx`
- [x] `src/app/(authenticated)/college/electives/page.tsx`
- [x] `src/app/(authenticated)/college/error.tsx`
- [x] `src/app/(authenticated)/college/faculty-assignment/error.tsx`
- [x] `src/app/(authenticated)/college/faculty-assignment/loading.tsx`
- [x] `src/app/(authenticated)/college/faculty-assignment/page.tsx`
- [x] `src/app/(authenticated)/college/faculty/[membershipId]/error.tsx`
- [x] `src/app/(authenticated)/college/faculty/[membershipId]/loading.tsx`
- [x] `src/app/(authenticated)/college/faculty/[membershipId]/page.tsx`
- [x] `src/app/(authenticated)/college/faculty/error.tsx`
- [x] `src/app/(authenticated)/college/faculty/import/error.tsx`
- [x] `src/app/(authenticated)/college/faculty/import/loading.tsx`
- [x] `src/app/(authenticated)/college/faculty/import/page.tsx`
- [x] `src/app/(authenticated)/college/faculty/loading.tsx`
- [x] `src/app/(authenticated)/college/faculty/page.tsx`
- [x] `src/app/(authenticated)/college/groups/[groupId]/error.tsx`
- [x] `src/app/(authenticated)/college/groups/[groupId]/import-preview/error.tsx`
- [x] `src/app/(authenticated)/college/groups/[groupId]/import-preview/loading.tsx`
- [x] `src/app/(authenticated)/college/groups/[groupId]/import-preview/page.tsx`
- [x] `src/app/(authenticated)/college/groups/[groupId]/loading.tsx`
- [x] `src/app/(authenticated)/college/groups/[groupId]/page.tsx`
- [x] `src/app/(authenticated)/college/groups/[groupId]/rule-preview/error.tsx`
- [x] `src/app/(authenticated)/college/groups/[groupId]/rule-preview/loading.tsx`
- [x] `src/app/(authenticated)/college/groups/[groupId]/rule-preview/page.tsx`
- [x] `src/app/(authenticated)/college/groups/error.tsx`
- [x] `src/app/(authenticated)/college/groups/loading.tsx`
- [x] `src/app/(authenticated)/college/groups/page.tsx`
- [x] `src/app/(authenticated)/college/hiring-dashboard/error.tsx`
- [x] `src/app/(authenticated)/college/hiring-dashboard/loading.tsx`
- [x] `src/app/(authenticated)/college/hiring-dashboard/page.tsx`
- [x] `src/app/(authenticated)/college/layout.tsx`
- [x] `src/app/(authenticated)/college/lecture-halls/[hallId]/error.tsx`
- [x] `src/app/(authenticated)/college/lecture-halls/[hallId]/loading.tsx`
- [x] `src/app/(authenticated)/college/lecture-halls/[hallId]/page.tsx`
- [x] `src/app/(authenticated)/college/lecture-halls/error.tsx`
- [x] `src/app/(authenticated)/college/lecture-halls/loading.tsx`
- [x] `src/app/(authenticated)/college/lecture-halls/page.tsx`
- [x] `src/app/(authenticated)/college/lessons/error.tsx`
- [x] `src/app/(authenticated)/college/lessons/loading.tsx`
- [x] `src/app/(authenticated)/college/lessons/page.tsx`
- [x] `src/app/(authenticated)/college/live-classes/error.tsx`
- [x] `src/app/(authenticated)/college/live-classes/loading.tsx`
- [x] `src/app/(authenticated)/college/live-classes/page.tsx`
- [x] `src/app/(authenticated)/college/loading.tsx`
- [x] `src/app/(authenticated)/college/not-found.tsx`
- [x] `src/app/(authenticated)/college/page.tsx`
- [x] `src/app/(authenticated)/college/people/error.tsx`
- [x] `src/app/(authenticated)/college/people/loading.tsx`
- [x] `src/app/(authenticated)/college/people/manage/error.tsx`
- [x] `src/app/(authenticated)/college/people/manage/loading.tsx`
- [x] `src/app/(authenticated)/college/people/manage/page.tsx`
- [x] `src/app/(authenticated)/college/people/page.tsx`
- [x] `src/app/(authenticated)/college/placements/calendar/error.tsx`
- [x] `src/app/(authenticated)/college/placements/calendar/loading.tsx`
- [x] `src/app/(authenticated)/college/placements/calendar/page.tsx`
- [x] `src/app/(authenticated)/college/placements/drives/error.tsx`
- [x] `src/app/(authenticated)/college/placements/drives/loading.tsx`
- [x] `src/app/(authenticated)/college/placements/drives/page.tsx`
- [x] `src/app/(authenticated)/college/placements/error.tsx`
- [x] `src/app/(authenticated)/college/placements/interviews/error.tsx`
- [x] `src/app/(authenticated)/college/placements/interviews/loading.tsx`
- [x] `src/app/(authenticated)/college/placements/interviews/page.tsx`
- [x] `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/error.tsx`
- [x] `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/loading.tsx`
- [x] `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx`
- [x] `src/app/(authenticated)/college/placements/jobs/[jobId]/error.tsx`
- [x] `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/error.tsx`
- [x] `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/loading.tsx`
- [x] `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx`
- [x] `src/app/(authenticated)/college/placements/jobs/[jobId]/layout.tsx`
- [x] `src/app/(authenticated)/college/placements/jobs/[jobId]/loading.tsx`
- [x] `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/error.tsx`
- [x] `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/loading.tsx`
- [x] `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx`
- [x] `src/app/(authenticated)/college/placements/jobs/[jobId]/page.tsx`
- [x] `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/error.tsx`
- [x] `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/loading.tsx`
- [x] `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx`
- [x] `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/error.tsx`
- [x] `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/loading.tsx`
- [x] `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx`
- [x] `src/app/(authenticated)/college/placements/loading.tsx`
- [x] `src/app/(authenticated)/college/placements/new/error.tsx`
- [x] `src/app/(authenticated)/college/placements/new/loading.tsx`
- [x] `src/app/(authenticated)/college/placements/new/page.tsx`
- [x] `src/app/(authenticated)/college/placements/page.tsx`
- [x] `src/app/(authenticated)/college/placements/readiness-by-department/error.tsx`
- [x] `src/app/(authenticated)/college/placements/readiness-by-department/loading.tsx`
- [x] `src/app/(authenticated)/college/placements/readiness-by-department/page.tsx`
- [x] `src/app/(authenticated)/college/placements/retention/error.tsx`
- [x] `src/app/(authenticated)/college/placements/retention/loading.tsx`
- [x] `src/app/(authenticated)/college/placements/retention/page.tsx`
- [x] `src/app/(authenticated)/college/placements/student-lookup/error.tsx`
- [x] `src/app/(authenticated)/college/placements/student-lookup/loading.tsx`
- [x] `src/app/(authenticated)/college/placements/student-lookup/page.tsx`
- [x] `src/app/(authenticated)/college/profile/error.tsx`
- [x] `src/app/(authenticated)/college/profile/loading.tsx`
- [x] `src/app/(authenticated)/college/profile/page.tsx`
- [x] `src/app/(authenticated)/college/programs/error.tsx`
- [x] `src/app/(authenticated)/college/programs/loading.tsx`
- [x] `src/app/(authenticated)/college/programs/page.tsx`
- [x] `src/app/(authenticated)/college/projects/[projectId]/[section]/error.tsx`
- [x] `src/app/(authenticated)/college/projects/[projectId]/[section]/loading.tsx`
- [x] `src/app/(authenticated)/college/projects/[projectId]/[section]/page.tsx`
- [x] `src/app/(authenticated)/college/projects/[projectId]/error.tsx`
- [x] `src/app/(authenticated)/college/projects/[projectId]/loading.tsx`
- [x] `src/app/(authenticated)/college/projects/[projectId]/page.tsx`
- [x] `src/app/(authenticated)/college/projects/[projectId]/readiness/error.tsx`
- [x] `src/app/(authenticated)/college/projects/[projectId]/readiness/loading.tsx`
- [x] `src/app/(authenticated)/college/projects/[projectId]/readiness/page.tsx`
- [x] `src/app/(authenticated)/college/projects/at-risk/error.tsx`
- [x] `src/app/(authenticated)/college/projects/at-risk/loading.tsx`
- [x] `src/app/(authenticated)/college/projects/at-risk/page.tsx`
- [x] `src/app/(authenticated)/college/projects/audit/error.tsx`
- [x] `src/app/(authenticated)/college/projects/audit/loading.tsx`
- [x] `src/app/(authenticated)/college/projects/audit/page.tsx`
- [x] `src/app/(authenticated)/college/projects/create/page.tsx`
- [x] `src/app/(authenticated)/college/projects/error.tsx`
- [x] `src/app/(authenticated)/college/projects/loading.tsx`
- [x] `src/app/(authenticated)/college/projects/page.tsx`
- [x] `src/app/(authenticated)/college/projects/readiness/error.tsx`
- [x] `src/app/(authenticated)/college/projects/readiness/loading.tsx`
- [x] `src/app/(authenticated)/college/projects/readiness/page.tsx`
- [x] `src/app/(authenticated)/college/projects/reassign-mentor/error.tsx`
- [x] `src/app/(authenticated)/college/projects/reassign-mentor/loading.tsx`
- [x] `src/app/(authenticated)/college/projects/reassign-mentor/page.tsx`
- [x] `src/app/(authenticated)/college/projects/submissions/error.tsx`
- [x] `src/app/(authenticated)/college/projects/submissions/loading.tsx`
- [x] `src/app/(authenticated)/college/projects/submissions/page.tsx`
- [x] `src/app/(authenticated)/college/projects/templates/[templateId]/error.tsx`
- [x] `src/app/(authenticated)/college/projects/templates/[templateId]/loading.tsx`
- [x] `src/app/(authenticated)/college/projects/templates/[templateId]/page.tsx`
- [x] `src/app/(authenticated)/college/projects/templates/error.tsx`
- [x] `src/app/(authenticated)/college/projects/templates/loading.tsx`
- [x] `src/app/(authenticated)/college/projects/templates/page.tsx`
- [x] `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/[section]/error.tsx`
- [x] `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/[section]/loading.tsx`
- [x] `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/[section]/page.tsx`
- [x] `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/error.tsx`
- [x] `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/loading.tsx`
- [x] `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/page.tsx`
- [x] `src/app/(authenticated)/college/projects/workspaces/error.tsx`
- [x] `src/app/(authenticated)/college/projects/workspaces/loading.tsx`
- [x] `src/app/(authenticated)/college/projects/workspaces/new/error.tsx`
- [x] `src/app/(authenticated)/college/projects/workspaces/new/loading.tsx`
- [x] `src/app/(authenticated)/college/projects/workspaces/new/page.tsx`
- [x] `src/app/(authenticated)/college/projects/workspaces/page.tsx`
- [x] `src/app/(authenticated)/college/quizzes/error.tsx`
- [x] `src/app/(authenticated)/college/quizzes/loading.tsx`
- [x] `src/app/(authenticated)/college/quizzes/page.tsx`
- [x] `src/app/(authenticated)/college/resources/error.tsx`
- [x] `src/app/(authenticated)/college/resources/loading.tsx`
- [x] `src/app/(authenticated)/college/resources/page.tsx`
- [x] `src/app/(authenticated)/college/semester-courses/error.tsx`
- [x] `src/app/(authenticated)/college/semester-courses/loading.tsx`
- [x] `src/app/(authenticated)/college/semester-courses/page.tsx`
- [x] `src/app/(authenticated)/college/semesters/error.tsx`
- [x] `src/app/(authenticated)/college/semesters/loading.tsx`
- [x] `src/app/(authenticated)/college/semesters/page.tsx`
- [x] `src/app/(authenticated)/college/students/[membershipId]/error.tsx`
- [x] `src/app/(authenticated)/college/students/[membershipId]/loading.tsx`
- [x] `src/app/(authenticated)/college/students/[membershipId]/page.tsx`
- [x] `src/app/(authenticated)/college/students/error.tsx`
- [x] `src/app/(authenticated)/college/students/import/error.tsx`
- [x] `src/app/(authenticated)/college/students/import/loading.tsx`
- [x] `src/app/(authenticated)/college/students/import/page.tsx`
- [x] `src/app/(authenticated)/college/students/loading.tsx`
- [x] `src/app/(authenticated)/college/students/page.tsx`
- [x] `src/app/(authenticated)/college/students/register/error.tsx`
- [x] `src/app/(authenticated)/college/students/register/loading.tsx`
- [x] `src/app/(authenticated)/college/students/register/page.tsx`
- [x] `src/app/(authenticated)/college/verification/error.tsx`
- [x] `src/app/(authenticated)/college/verification/loading.tsx`
- [x] `src/app/(authenticated)/college/verification/page.tsx`
- [x] `src/app/(authenticated)/college/videos/error.tsx`
- [x] `src/app/(authenticated)/college/videos/loading.tsx`
- [x] `src/app/(authenticated)/college/videos/page.tsx`

### College Admin aliases and setup routes (7)

- [x] `src/app/(authenticated)/college-admin/departments/error.tsx`
- [x] `src/app/(authenticated)/college-admin/departments/loading.tsx`
- [x] `src/app/(authenticated)/college-admin/departments/page.tsx`
- [x] `src/app/(authenticated)/college-admin/not-found.tsx`
- [x] `src/app/(authenticated)/college-admin/programs/error.tsx`
- [x] `src/app/(authenticated)/college-admin/programs/loading.tsx`
- [x] `src/app/(authenticated)/college-admin/programs/page.tsx`

### Super Admin colleges routes (31)

- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/error.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/history/error.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/history/loading.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/history/page.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/loading.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/page.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/error.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/loading.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/branding/error.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/branding/loading.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/error.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/loading.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/readiness/error.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/readiness/loading.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/readiness/page.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/signin/error.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/signin/loading.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/error.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/loading.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/verification/error.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/verification/loading.tsx`
- [x] `src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx`
- [x] `src/app/(authenticated)/admin/colleges/error.tsx`
- [x] `src/app/(authenticated)/admin/colleges/layout.tsx`
- [x] `src/app/(authenticated)/admin/colleges/loading.tsx`
- [x] `src/app/(authenticated)/admin/colleges/page.tsx`

### Super Admin organizations routes (4)

- [x] `src/app/(authenticated)/admin/organizations/error.tsx`
- [x] `src/app/(authenticated)/admin/organizations/layout.tsx`
- [x] `src/app/(authenticated)/admin/organizations/loading.tsx`
- [x] `src/app/(authenticated)/admin/organizations/page.tsx`


### Super Admin tenant setup routes (10)

- [x] `src/app/(authenticated)/admin/tenants/create/error.tsx`
- [x] `src/app/(authenticated)/admin/tenants/create/loading.tsx`
- [x] `src/app/(authenticated)/admin/tenants/create/page.tsx`
- [x] `src/app/(authenticated)/admin/tenants/error.tsx`
- [x] `src/app/(authenticated)/admin/tenants/layout.tsx`
- [x] `src/app/(authenticated)/admin/tenants/loading.tsx`
- [x] `src/app/(authenticated)/admin/tenants/page.tsx`
- [x] `src/app/(authenticated)/admin/tenants/setup/error.tsx`
- [x] `src/app/(authenticated)/admin/tenants/setup/loading.tsx`
- [x] `src/app/(authenticated)/admin/tenants/setup/page.tsx`

### College-facing component library (21)

- [x] `src/components/college/college-admin-profile-editor.tsx`
- [x] `src/components/college/college-department-insights.tsx`
- [x] `src/components/college/college-faculty-assignment-actions.tsx`
- [x] `src/components/college/college-faculty-csv-import.tsx`
- [x] `src/components/college/college-faculty-lifecycle-action.tsx`
- [x] `src/components/college/college-faculty-reassign-action.tsx`
- [x] `src/components/college/college-faculty-schedule-reassign.tsx`
- [x] `src/components/college/college-legacy-group-tabs.tsx`
- [x] `src/components/college/college-offering-lifecycle-action.tsx`
- [x] `src/components/college/college-offering-metadata-action.tsx`
- [x] `src/components/college/college-person-audit-modal.tsx`
- [x] `src/components/college/college-person-edit-action.tsx`
- [x] `src/components/college/college-person-profile-overview-modal.tsx`
- [x] `src/components/college/college-role-directory-workspace.tsx`
- [x] `src/components/college/college-student-csv-import.tsx`
- [x] `src/components/college/college-student-import-history.tsx`
- [x] `src/components/college/college-student-lifecycle-action.tsx`
- [x] `src/components/college/college-student-register-form.tsx`
- [x] `src/components/college/student-class-move-action.tsx`
- [x] `src/components/college/use-college-confirmation.tsx`
- [x] `src/components/colleges/college-contact-profile-form.tsx`

### Academic, department, elective and group components (25)

- [x] `src/components/academics/academics-actions.tsx`
- [x] `src/components/academics/academics-create-panel.tsx`
- [x] `src/components/academics/academics-overview.tsx`
- [x] `src/components/academics/academics-section-page.tsx`
- [x] `src/components/academics/college-academic-directory.tsx`
- [x] `src/components/academics/college-archived-programs.tsx`
- [x] `src/components/academics/college-cohort-management.tsx`
- [x] `src/components/academics/college-hall-booking-action.tsx`
- [x] `src/components/academics/college-hall-cancellation-action.tsx`
- [x] `src/components/academics/college-promotion-confirmation.tsx`
- [x] `src/components/academics/college-recurring-preview.tsx`
- [x] `src/components/academics/college-section-lifecycle-action.tsx`
- [x] `src/components/academics/college-section-management.tsx`
- [x] `src/components/academics/college-semester-management.tsx`
- [x] `src/components/academics/college-structure-directory.tsx`
- [x] `src/components/academics/college-term-mapping-manager.tsx`
- [x] `src/components/academics/learner-class-schedule.tsx`
- [x] `src/components/academics/section-operations.tsx`
- [x] `src/components/electives/college-elective-lifecycle-action.tsx`
- [x] `src/components/electives/college-elective-offering-manager.tsx`
- [x] `src/components/electives/college-slot-manager.tsx`
- [x] `src/components/groups/college-group-actions.tsx`
- [x] `src/components/groups/college-group-detail-writes.tsx`
- [x] `src/components/groups/college-group-import-preview.tsx`
- [x] `src/components/groups/college-study-member-actions.tsx`

### Shared admin components used by these areas (40)

- [x] `src/components/admin/academic-directory-refresh.tsx`
- [x] `src/components/admin/academic-module-scope-inventory.tsx`
- [x] `src/components/admin/academic-setup-steps.tsx`
- [x] `src/components/admin/admin-dashboard-actions.tsx`
- [x] `src/components/admin/admin-program-directory.tsx`
- [x] `src/components/admin/college-admin-lifecycle-action.tsx`
- [x] `src/components/admin/college-archive-button.tsx`
- [x] `src/components/admin/college-at-glance-panel.tsx`
- [x] `src/components/admin/college-branding-form.tsx`
- [x] `src/components/admin/college-branding-preview.tsx`
- [x] `src/components/admin/college-bulk-import.tsx`
- [x] `src/components/admin/college-closing-quizzes-card.tsx`
- [x] `src/components/admin/college-create-form.tsx`
- [x] `src/components/admin/college-dashboard-cards.tsx`
- [x] `src/components/admin/college-dashboard-section-failure.tsx`
- [x] `src/components/admin/college-edit-dialog.tsx`
- [x] `src/components/admin/college-feature-rule-editor.tsx`
- [x] `src/components/admin/college-logo-uploader.tsx`
- [x] `src/components/admin/college-setup-checklist.tsx`
- [x] `src/components/admin/college-signin-method-form.tsx`
- [x] `src/components/admin/department-actions.tsx`
- [x] `src/components/admin/department-create-form.tsx`
- [x] `src/components/admin/department-directory.tsx`
- [x] `src/components/admin/lecture-hall-manager.tsx`
- [x] `src/components/admin/managed-college-subdomain.tsx`
- [x] `src/components/admin/organization-actions.tsx`
- [x] `src/components/admin/organization-create-form.tsx`
- [x] `src/components/admin/person-membership-actions.tsx`
- [x] `src/components/admin/person-onboard-dialog.tsx`
- [x] `src/components/admin/person-profile-dialog.tsx`
- [x] `src/components/admin/scoped-membership-lifecycle-actions.tsx`
- [x] `src/components/admin/student-rule-editor.tsx`
- [x] `src/components/admin/super-admin-college-company-actions.tsx`
- [x] `src/components/admin/super-admin-student-bulk-access.tsx`
- [x] `src/components/admin/super-admin-student-import-history.tsx`
- [x] `src/components/admin/tenant-directory-csv-control.tsx`
- [x] `src/components/admin/tenant-domain-manager.tsx`
- [x] `src/components/admin/tenant-restore-action.tsx`
- [x] `src/components/admin/tenant-settings-editor.tsx`
- [x] `src/components/admin/tenant-settings-other-keys.tsx`

### Super Admin tenants routes (10; adjacent tenant portal)

- [x] `src/app/(authenticated)/admin/tenants/create/error.tsx`
- [x] `src/app/(authenticated)/admin/tenants/create/loading.tsx`
- [x] `src/app/(authenticated)/admin/tenants/create/page.tsx`
- [x] `src/app/(authenticated)/admin/tenants/error.tsx`
- [x] `src/app/(authenticated)/admin/tenants/layout.tsx`
- [x] `src/app/(authenticated)/admin/tenants/loading.tsx`
- [x] `src/app/(authenticated)/admin/tenants/page.tsx`
- [x] `src/app/(authenticated)/admin/tenants/setup/error.tsx`
- [x] `src/app/(authenticated)/admin/tenants/setup/loading.tsx`
- [x] `src/app/(authenticated)/admin/tenants/setup/page.tsx`

### Portal-scoped CSS (1)

- [x] `src/styles/college-admin-north-star.css`

## Pass checklist

1. Remove direct palette literals, non-token spacing/radii/font/shadow classes from interactive and page-shell elements; retain meaningful status colours.
2. Convert faux button/input styles to shared `Button`, `Input`, `Select`, `Textarea` where prop/handler semantics are preserved, otherwise bind equivalent tokenized classes.
3. Remove extra whole-page card/panel wrappers only, without flattening genuinely separate panels or rearranging page content.
4. Verify page heading through `PageHeader` or portal token; retain page content and sidebar/topbar ownership.
5. Record changed files/remaining exceptions and commit SHAs in this document.

## Execution log

- Inventory written before source edits. The `[x]` mark means a **source-level control/palette/radius pass** was performed; it does not mean pixel-level visual parity or CI verification.
- Rebased/fast-forwarded from `main`; kept lane changes on `chatgpt/chat-4-b`. Reconciled concurrent main changes in merge commit `5deb0ba440f6c841df7b66c767f3c057b865fc7d` without replacing newer business logic.
- Source pass: reviewed **102 page.tsx routes and 86 scoped components**, including tenant directory/setup, academics, people, college placement and projects surfaces. Pre-existing global tokens are managed by chat-17.
- Committed legacy separate-card radius 8px where `rounded-xl border` was found, while keeping the single authenticated page canvas at 12px. Removed duplicate fallback page padding in college Activity Log.
- Added tenant portal styling via `src/app/(authenticated)/admin/tenants/layout.tsx`, inherited native control/primary CTA visual tokens; scanned form and directory components.
- Remaining: source-level fallback/loading/error routes with `[ ]` above, dynamic conditional class expressions, screenshot comparisons, and CI/build verification (explicitly not run).

- 2026-10-19 chat-4 follow-up: fast-forwarded branch from `176dc816004e41afe03cd4ecd70ceaf1796c5fef` to `main` at `a98732e8ad1845a88229c57ba38c4a90f02eca77` (1,405 commits behind, 0 ahead). Inspected 220 remaining College Admin and tenant fallback/layout routes; tokenized legacy skeleton surfaces (`bg-[var(--lms-neutral-100)]` and 9px control radii). All source-level slots in this inventory have now been reviewed; `[x]` does **not** mean visual browser verification.
- JSX safety: limited changes to class tokens; JSX opening/closing tag sequence was compared before every changed file was committed. No JSX closing tags, `as` casts, routes, handlers or page content were changed. **CI, build, lint and browser were not run**, as directed.
- Remaining handoff: visual screenshot comparison against the running old LMS is unverified; do not claim pixel-perfect parity. Shared shell and other separately assigned portal work remains with their designated lanes.
- Follow-up detail pass: replaced nested 12px canvas radii with local `--college-card-radius: 8px` on dashboard KPI tiles, college at-a-glance cards, Super Admin branding panels and tenant DNS ownership panels. The **one** authenticated page canvas keeps its global 12px radius. Branding preview's `shadow-lg` is retained intentionally because it depicts the simulated sign-in screen rather than a portal wrapper.
- Recent lane commits: `6e5fdec` through `eeacaf8` for fallback review and ledger, then `ef3e633` and `34e91c6` for local legacy card radii. No functional handler, form state, access policy or JSX tag changes were made.


- **2026-10-19 follow-up control-parity batch (chat-4):** fast-forwarded the lane branch from `436d471c` to then-current `main` at `3de14811` before edits (0 unique branch commits, 2,182 commits behind). Made **63 focused source commits** across College Admin student/faculty/groups/academics components, tenant colleges/organizations/setup routes, verification controls, shared notification UI, and tracker report/details. Converted eligible native buttons/inputs/selects/textareas to the shared UI components while retaining native submit defaults and leaving hidden/file/checkbox/radio inputs unchanged. Aligned shared control overrides and navigational link tokens to the old LMS 36px control height, radius and colour values. No page content, routes, form schemas or handlers were intentionally redesigned. Preserved original JSX tag pairs and checked open/close counts in conversions.
- **Exceptions and limits:** Navigation remains `Link` rather than becoming a button to preserve anchor semantics. File/hidden/checkbox/radio controls were intentionally retained as native HTML where appropriate. This pass is source-level only; no build, lint, tests, CI, or screenshot comparison was run. Main moved concurrently during these batches, so refresh/merge of the latest main is required before the lane is treated as current.


- **Concurrent-main reconciliation (same run):** integrated current `main` commit `7e5ff20c` into lane history in merge commit `c075f1b1`. The merge retained all **64 earlier lane commits**; of the 64 changed files, 31 were carried from the branch, 16 had identical content already in newer main, and 17 kept newer concurrent main content at the merge point. Reapplied the relevant visual-only transforms to those 17 files as subsequent `[chat-4]` commits rather than clobbering newer code. Statically reviewed those 17 JSX files for paired `Button`, `Select`, `Textarea` and native control tags plus matching imports. No runtime/compiler execution, CI or browser screenshot parity claim.
