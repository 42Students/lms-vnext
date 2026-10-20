# College Admin portal clone audit — chat-4

**Scope:** `src/app/(authenticated)/college/**`, `college-admin/**`, scoped Super Admin colleges/organizations/tenants/readiness/verification/branding, College Admin people/groups/academics components, tracker and in-scope notification/messaging components. **Branch:** `chatgpt/chat-4-b`.

## Work queue — current branch source inventory (2026-10-19)

- Source: recursive GitHub Git tree of `main` commit `d915bd67b20838f496d2a5b25b4365e748a35dd5`, fast-forwarded to `chatgpt/chat-4-b` (no unique lane commits before sync). This is **path inventory**, not proof of content grep zero. Existing baseline commit counts above are historical and do not represent this head.
- Source-content scan completed for **15** selected portal routes/components using patterns `<(button|input|select|textarea|table)(?=[\\s>])`, `#[a-fA-F0-9]{3,8}\\b`, `<h1(?=[\\s>])`, `role=(dialog)`, and `fixed inset-0`. Observed **6** raw elements: 4 in `src/components/verification/CollegeVerificationPanel.tsx` (one textarea, one checkbox, two selects), 2 justified hidden form inputs in `src/app/(authenticated)/college/contacts/page.tsx`; the other 13 checked files had zero sampled matches. This is *not an exhaustive grep*. The exempt hidden inputs must remain explicitly logged, not counted as ordinary styled controls.
- Next actions in priority order: verification controls; Super Admin verification plus other raw components; page heads and double canvas; whole-portal raw tags and hand-rolled tables/overlays; responsive/state comparison with line references; final repository greps. All section H tick boxes stay open until strict evidence is complete.

### College Admin routes, layouts and states (268 TSX files)
- [ ] `src/app/(authenticated)/college-admin/departments/error.tsx`
- [ ] `src/app/(authenticated)/college-admin/departments/loading.tsx`
- [ ] `src/app/(authenticated)/college-admin/departments/page.tsx`
- [ ] `src/app/(authenticated)/college-admin/layout.tsx`
- [ ] `src/app/(authenticated)/college-admin/not-found.tsx`
- [ ] `src/app/(authenticated)/college-admin/programs/error.tsx`
- [ ] `src/app/(authenticated)/college-admin/programs/loading.tsx`
- [ ] `src/app/(authenticated)/college-admin/programs/page.tsx`
- [ ] `src/app/(authenticated)/college/academics/error.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/academics/loading.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/academics/page.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/academics/sections/[sectionId]/error.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/academics/sections/[sectionId]/loading.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/academics/sections/[sectionId]/page.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/activity/[eventId]/error.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/activity/[eventId]/loading.tsx`
- [ ] `src/app/(authenticated)/college/activity/[eventId]/page.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/activity/error.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/activity/loading.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/activity/page.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/announcements/error.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/announcements/loading.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/announcements/page.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/assignments/error.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/assignments/loading.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/assignments/page.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/attendance/corrections/error.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/attendance/corrections/loading.tsx`
- [ ] `src/app/(authenticated)/college/attendance/corrections/page.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/attendance/departments/error.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/attendance/departments/loading.tsx`
- [ ] `src/app/(authenticated)/college/attendance/departments/page.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/attendance/error.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/attendance/loading.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/attendance/page.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/attendance/settings/error.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/attendance/settings/loading.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/attendance/settings/page.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/batch-promotion/error.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/batch-promotion/loading.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/batch-promotion/page.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/batches/[cohortId]/students/error.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/batches/[cohortId]/students/loading.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/batches/[cohortId]/students/page.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/batches/error.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/batches/loading.tsx`
- [ ] `src/app/(authenticated)/college/batches/page.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/branding/error.tsx`
- [ ] `src/app/(authenticated)/college/branding/loading.tsx`
- [ ] `src/app/(authenticated)/college/branding/page.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/classes/error.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/classes/loading.tsx`
- [ ] `src/app/(authenticated)/college/classes/page.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/classes/recurring-preview/error.tsx`
- [ ] `src/app/(authenticated)/college/classes/recurring-preview/loading.tsx`
- [ ] `src/app/(authenticated)/college/classes/recurring-preview/page.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/college-profile/error.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/college-profile/loading.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/college-profile/page.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/companies/error.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/companies/loading.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/companies/page.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/contacts/[membershipId]/error.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/contacts/[membershipId]/loading.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/contacts/[membershipId]/page.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/contacts/error.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/contacts/loading.tsx`
- [ ] `src/app/(authenticated)/college/contacts/page.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/course-progress/error.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/course-progress/loading.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/course-progress/page.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/courses/error.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/courses/loading.tsx`
- [ ] `src/app/(authenticated)/college/courses/offerings/[offeringId]/error.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/courses/offerings/[offeringId]/loading.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/courses/offerings/[offeringId]/not-found.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/courses/offerings/[offeringId]/page.tsx`
- [ ] `src/app/(authenticated)/college/courses/page.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/departments/error.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/departments/loading.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/departments/page.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/domains/error.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/domains/loading.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/domains/page.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/electives/[slotId]/allocate/error.tsx` — **SOURCE PASS (chat-4 full-file scan; strict parity open)**
- [ ] `src/app/(authenticated)/college/electives/[slotId]/allocate/loading.tsx` — **SOURCE PASS (chat-4 full-file scan; strict parity open)**
- [ ] `src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx` — **SOURCE PASS (chat-4 full-file scan; strict parity open)**
- [ ] `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/error.tsx` — **SOURCE PASS (chat-4 full-file scan; strict parity open)**
- [ ] `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/loading.tsx` — **SOURCE PASS (chat-4 full-file scan; strict parity open)**
- [ ] `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx` — **SOURCE PASS (chat-4 full-file scan; strict parity open)**
- [ ] `src/app/(authenticated)/college/electives/error.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/electives/loading.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/electives/page.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/error.tsx`
- [ ] `src/app/(authenticated)/college/faculty-assignment/error.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/faculty-assignment/loading.tsx`
- [ ] `src/app/(authenticated)/college/faculty-assignment/page.tsx`
- [ ] `src/app/(authenticated)/college/faculty/[membershipId]/error.tsx`
- [ ] `src/app/(authenticated)/college/faculty/[membershipId]/loading.tsx`
- [ ] `src/app/(authenticated)/college/faculty/[membershipId]/page.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/faculty/error.tsx`
- [ ] `src/app/(authenticated)/college/faculty/import/error.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/faculty/import/loading.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/faculty/import/page.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/faculty/loading.tsx`
- [ ] `src/app/(authenticated)/college/faculty/page.tsx`
- [ ] `src/app/(authenticated)/college/groups/[groupId]/error.tsx` — **SOURCE PASS (chat-4 full-file scan; strict parity open)**
- [ ] `src/app/(authenticated)/college/groups/[groupId]/import-preview/error.tsx` — **SOURCE PASS (chat-4 full-file scan; strict parity open)**
- [ ] `src/app/(authenticated)/college/groups/[groupId]/import-preview/loading.tsx` — **SOURCE PASS (chat-4 full-file scan; strict parity open)**
- [ ] `src/app/(authenticated)/college/groups/[groupId]/import-preview/page.tsx` — **SOURCE PASS (chat-4 full-file review; strict parity open)**
- [ ] `src/app/(authenticated)/college/groups/[groupId]/loading.tsx` — **SOURCE PASS (chat-4 full-file review; strict parity open)**
- [ ] `src/app/(authenticated)/college/groups/[groupId]/page.tsx` — **SOURCE PASS (chat-4 full-file review; strict parity open)**
- [ ] `src/app/(authenticated)/college/groups/[groupId]/rule-preview/error.tsx` — **SOURCE PASS (chat-4 full-file review; strict parity open)**
- [ ] `src/app/(authenticated)/college/groups/[groupId]/rule-preview/loading.tsx` — **SOURCE PASS (chat-4 full-file review; strict parity open)**
- [ ] `src/app/(authenticated)/college/groups/[groupId]/rule-preview/page.tsx` — **SOURCE PASS (chat-4 full-file review; strict parity open)**
- [ ] `src/app/(authenticated)/college/groups/error.tsx` — **SOURCE PASS (chat-4 full-file review; strict parity open)**
- [ ] `src/app/(authenticated)/college/groups/loading.tsx` — **SOURCE PASS (chat-4 full-file review; strict parity open)**
- [ ] `src/app/(authenticated)/college/groups/page.tsx` — **SOURCE PASS (chat-4 full-file review; strict parity open)**
- [ ] `src/app/(authenticated)/college/hiring-dashboard/error.tsx`
- [ ] `src/app/(authenticated)/college/hiring-dashboard/loading.tsx`
- [ ] `src/app/(authenticated)/college/hiring-dashboard/page.tsx`
- [ ] `src/app/(authenticated)/college/layout.tsx`
- [ ] `src/app/(authenticated)/college/lecture-halls/[hallId]/error.tsx`
- [ ] `src/app/(authenticated)/college/lecture-halls/[hallId]/loading.tsx`
- [ ] `src/app/(authenticated)/college/lecture-halls/[hallId]/page.tsx`
- [ ] `src/app/(authenticated)/college/lecture-halls/error.tsx`
- [ ] `src/app/(authenticated)/college/lecture-halls/loading.tsx`
- [ ] `src/app/(authenticated)/college/lecture-halls/page.tsx`
- [ ] `src/app/(authenticated)/college/lessons/error.tsx`
- [ ] `src/app/(authenticated)/college/lessons/loading.tsx`
- [ ] `src/app/(authenticated)/college/lessons/page.tsx`
- [ ] `src/app/(authenticated)/college/live-classes/error.tsx`
- [ ] `src/app/(authenticated)/college/live-classes/loading.tsx`
- [ ] `src/app/(authenticated)/college/live-classes/page.tsx`
- [ ] `src/app/(authenticated)/college/loading.tsx`
- [ ] `src/app/(authenticated)/college/not-found.tsx`
- [ ] `src/app/(authenticated)/college/page.tsx`
- [ ] `src/app/(authenticated)/college/people/error.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/people/loading.tsx`
- [ ] `src/app/(authenticated)/college/people/manage/error.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/people/manage/loading.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/people/manage/page.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/people/page.tsx`
- [ ] `src/app/(authenticated)/college/placements/calendar/error.tsx`
- [ ] `src/app/(authenticated)/college/placements/calendar/loading.tsx`
- [ ] `src/app/(authenticated)/college/placements/calendar/page.tsx`
- [ ] `src/app/(authenticated)/college/placements/drives/error.tsx`
- [ ] `src/app/(authenticated)/college/placements/drives/loading.tsx`
- [ ] `src/app/(authenticated)/college/placements/drives/page.tsx`
- [ ] `src/app/(authenticated)/college/placements/error.tsx`
- [ ] `src/app/(authenticated)/college/placements/interviews/error.tsx`
- [ ] `src/app/(authenticated)/college/placements/interviews/loading.tsx`
- [ ] `src/app/(authenticated)/college/placements/interviews/page.tsx`
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/error.tsx`
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/loading.tsx`
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx`
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/error.tsx`
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/error.tsx`
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/loading.tsx`
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx`
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/layout.tsx`
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/loading.tsx`
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/error.tsx`
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/loading.tsx`
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx`
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/page.tsx`
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/error.tsx`
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/loading.tsx`
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx`
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/error.tsx`
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/loading.tsx`
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx`
- [ ] `src/app/(authenticated)/college/placements/loading.tsx`
- [ ] `src/app/(authenticated)/college/placements/new/error.tsx`
- [ ] `src/app/(authenticated)/college/placements/new/loading.tsx`
- [ ] `src/app/(authenticated)/college/placements/new/page.tsx`
- [ ] `src/app/(authenticated)/college/placements/page.tsx`
- [ ] `src/app/(authenticated)/college/placements/readiness-by-department/error.tsx`
- [ ] `src/app/(authenticated)/college/placements/readiness-by-department/loading.tsx`
- [ ] `src/app/(authenticated)/college/placements/readiness-by-department/page.tsx`
- [ ] `src/app/(authenticated)/college/placements/retention/error.tsx`
- [ ] `src/app/(authenticated)/college/placements/retention/loading.tsx`
- [ ] `src/app/(authenticated)/college/placements/retention/page.tsx`
- [ ] `src/app/(authenticated)/college/placements/student-lookup/error.tsx`
- [ ] `src/app/(authenticated)/college/placements/student-lookup/loading.tsx`
- [ ] `src/app/(authenticated)/college/placements/student-lookup/page.tsx`
- [ ] `src/app/(authenticated)/college/profile/error.tsx`
- [ ] `src/app/(authenticated)/college/profile/loading.tsx`
- [ ] `src/app/(authenticated)/college/profile/page.tsx`
- [ ] `src/app/(authenticated)/college/programs/error.tsx`
- [ ] `src/app/(authenticated)/college/programs/loading.tsx`
- [ ] `src/app/(authenticated)/college/programs/page.tsx`
- [ ] `src/app/(authenticated)/college/projects/[projectId]/[section]/error.tsx`
- [ ] `src/app/(authenticated)/college/projects/[projectId]/[section]/loading.tsx`
- [ ] `src/app/(authenticated)/college/projects/[projectId]/[section]/page.tsx`
- [ ] `src/app/(authenticated)/college/projects/[projectId]/error.tsx`
- [ ] `src/app/(authenticated)/college/projects/[projectId]/loading.tsx`
- [ ] `src/app/(authenticated)/college/projects/[projectId]/page.tsx`
- [ ] `src/app/(authenticated)/college/projects/[projectId]/readiness/error.tsx`
- [ ] `src/app/(authenticated)/college/projects/[projectId]/readiness/loading.tsx`
- [ ] `src/app/(authenticated)/college/projects/[projectId]/readiness/page.tsx`
- [ ] `src/app/(authenticated)/college/projects/at-risk/error.tsx`
- [ ] `src/app/(authenticated)/college/projects/at-risk/loading.tsx`
- [ ] `src/app/(authenticated)/college/projects/at-risk/page.tsx`
- [ ] `src/app/(authenticated)/college/projects/audit/error.tsx`
- [ ] `src/app/(authenticated)/college/projects/audit/loading.tsx`
- [ ] `src/app/(authenticated)/college/projects/audit/page.tsx`
- [ ] `src/app/(authenticated)/college/projects/create/page.tsx`
- [ ] `src/app/(authenticated)/college/projects/error.tsx`
- [ ] `src/app/(authenticated)/college/projects/loading.tsx`
- [ ] `src/app/(authenticated)/college/projects/page.tsx`
- [ ] `src/app/(authenticated)/college/projects/readiness/error.tsx`
- [ ] `src/app/(authenticated)/college/projects/readiness/loading.tsx`
- [ ] `src/app/(authenticated)/college/projects/readiness/page.tsx`
- [ ] `src/app/(authenticated)/college/projects/reassign-mentor/error.tsx`
- [ ] `src/app/(authenticated)/college/projects/reassign-mentor/loading.tsx`
- [ ] `src/app/(authenticated)/college/projects/reassign-mentor/page.tsx`
- [ ] `src/app/(authenticated)/college/projects/submissions/error.tsx`
- [ ] `src/app/(authenticated)/college/projects/submissions/loading.tsx`
- [ ] `src/app/(authenticated)/college/projects/submissions/page.tsx`
- [ ] `src/app/(authenticated)/college/projects/templates/[templateId]/error.tsx`
- [ ] `src/app/(authenticated)/college/projects/templates/[templateId]/loading.tsx`
- [ ] `src/app/(authenticated)/college/projects/templates/[templateId]/page.tsx`
- [ ] `src/app/(authenticated)/college/projects/templates/error.tsx`
- [ ] `src/app/(authenticated)/college/projects/templates/loading.tsx`
- [ ] `src/app/(authenticated)/college/projects/templates/page.tsx`
- [ ] `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/[section]/error.tsx`
- [ ] `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/[section]/loading.tsx`
- [ ] `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/[section]/page.tsx`
- [ ] `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/error.tsx`
- [ ] `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/loading.tsx`
- [ ] `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/page.tsx`
- [ ] `src/app/(authenticated)/college/projects/workspaces/error.tsx`
- [ ] `src/app/(authenticated)/college/projects/workspaces/loading.tsx`
- [ ] `src/app/(authenticated)/college/projects/workspaces/new/error.tsx`
- [ ] `src/app/(authenticated)/college/projects/workspaces/new/loading.tsx`
- [ ] `src/app/(authenticated)/college/projects/workspaces/new/page.tsx`
- [ ] `src/app/(authenticated)/college/projects/workspaces/page.tsx`
- [ ] `src/app/(authenticated)/college/quizzes/error.tsx`
- [ ] `src/app/(authenticated)/college/quizzes/loading.tsx`
- [ ] `src/app/(authenticated)/college/quizzes/page.tsx`
- [ ] `src/app/(authenticated)/college/resources/error.tsx`
- [ ] `src/app/(authenticated)/college/resources/loading.tsx`
- [ ] `src/app/(authenticated)/college/resources/page.tsx`
- [ ] `src/app/(authenticated)/college/semester-courses/error.tsx`
- [ ] `src/app/(authenticated)/college/semester-courses/loading.tsx`
- [ ] `src/app/(authenticated)/college/semester-courses/page.tsx`
- [ ] `src/app/(authenticated)/college/semesters/error.tsx`
- [ ] `src/app/(authenticated)/college/semesters/loading.tsx`
- [ ] `src/app/(authenticated)/college/semesters/page.tsx`
- [ ] `src/app/(authenticated)/college/students/[membershipId]/error.tsx`
- [ ] `src/app/(authenticated)/college/students/[membershipId]/loading.tsx`
- [ ] `src/app/(authenticated)/college/students/[membershipId]/page.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/students/error.tsx`
- [ ] `src/app/(authenticated)/college/students/import/error.tsx`
- [ ] `src/app/(authenticated)/college/students/import/loading.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/students/import/page.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/students/loading.tsx`
- [ ] `src/app/(authenticated)/college/students/page.tsx`
- [ ] `src/app/(authenticated)/college/students/register/error.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/students/register/loading.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/students/register/page.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/college/verification/error.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/verification/loading.tsx`
- [ ] `src/app/(authenticated)/college/verification/page.tsx` — **SOURCE PASS (chat-4 source comparison, strict parity open)**
- [ ] `src/app/(authenticated)/college/videos/error.tsx`
- [ ] `src/app/(authenticated)/college/videos/loading.tsx`
- [ ] `src/app/(authenticated)/college/videos/page.tsx`

### College Admin academics, people, contacts and groups components (48 TSX files)
- [ ] `src/components/academics/academics-actions.tsx`
- [ ] `src/components/academics/academics-create-panel.tsx`
- [ ] `src/components/academics/academics-overview.tsx`
- [ ] `src/components/academics/academics-section-page.tsx`
- [ ] `src/components/academics/college-academic-directory.tsx`
- [ ] `src/components/academics/college-archived-programs.tsx`
- [ ] `src/components/academics/college-cohort-management.tsx`
- [ ] `src/components/academics/college-hall-booking-action.tsx`
- [ ] `src/components/academics/college-hall-cancellation-action.tsx`
- [ ] `src/components/academics/college-promotion-confirmation.tsx`
- [ ] `src/components/academics/college-recurring-preview.tsx`
- [ ] `src/components/academics/college-section-lifecycle-action.tsx`
- [ ] `src/components/academics/college-section-management.tsx`
- [ ] `src/components/academics/college-semester-management.tsx`
- [ ] `src/components/academics/college-structure-directory.tsx`
- [ ] `src/components/academics/college-term-mapping-manager.tsx`
- [ ] `src/components/academics/learner-class-schedule.tsx`
- [ ] `src/components/academics/section-operations.tsx`
- [ ] `src/components/college/college-admin-profile-editor.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/college/college-department-insights.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/college/college-faculty-assignment-actions.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/college/college-faculty-csv-import.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/college/college-faculty-lifecycle-action.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/college/college-faculty-reassign-action.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/college/college-faculty-schedule-reassign.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/college/college-legacy-group-tabs.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/college/college-offering-lifecycle-action.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/college/college-offering-metadata-action.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/college/college-person-audit-modal.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/college/college-person-edit-action.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/college/college-person-profile-overview-modal.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/college/college-role-directory-workspace.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/college/college-student-csv-import.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/college/college-student-import-history.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/college/college-student-lifecycle-action.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/college/college-student-register-form.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/college/student-class-move-action.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/college/use-college-confirmation.tsx`
- [ ] `src/components/colleges/college-contact-profile-form.tsx`
- [ ] `src/components/groups/college-group-actions.tsx`
- [ ] `src/components/groups/college-group-detail-writes.tsx`
- [ ] `src/components/groups/college-group-import-preview.tsx`
- [ ] `src/components/groups/college-study-member-actions.tsx`
- [ ] `src/components/people/faculty-profile-editor.tsx`
- [ ] `src/components/people/faculty-profile-metadata.tsx`
- [ ] `src/components/people/faculty-profile-repeatable.tsx`
- [ ] `src/components/people/faculty-profile-skills.tsx`
- [ ] `src/components/people/faculty-profile-text-section.tsx`

### Super Admin colleges/tenants/readiness/verification/branding/sign-in routes (56 TSX files)
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/error.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/history/error.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/history/loading.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/history/page.tsx` — **SOURCE REFACTOR REVIEWED (replacement chat-4); strict proof pending**
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/loading.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/page.tsx` — **SOURCE REFACTOR REVIEWED (replacement chat-4); strict proof pending**
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/error.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/loading.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx` — **SOURCE REFACTOR REVIEWED (replacement chat-4); strict proof pending**
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/branding/error.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/branding/loading.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx` — **SOURCE IMPLEMENTATION REVIEWED**, strict parity unverified; see source-proof batch below (Branding)
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/error.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/loading.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx` — **SOURCE REFACTOR REVIEWED (replacement chat-4); strict proof pending**
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/readiness/error.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/readiness/loading.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/readiness/page.tsx` — **SOURCE IMPLEMENTATION REVIEWED**, strict parity unverified; see source-proof batch below (Readiness Gate)
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/signin/error.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/signin/loading.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx` — **SOURCE IMPLEMENTATION REVIEWED**, strict parity unverified; see source-proof batch below (Sign-in methods)
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/error.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/loading.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx` — **SOURCE REFACTOR REVIEWED (replacement chat-4); strict proof pending**
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/verification/error.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/verification/loading.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx` — **SOURCE REFACTOR REVIEWED (replacement chat-4); strict proof pending**
- [ ] `src/app/(authenticated)/admin/colleges/error.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/layout.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/loading.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/page.tsx` — **SOURCE REFACTOR REVIEWED (replacement chat-4); strict proof pending**
- [ ] `src/app/(authenticated)/admin/domains/error.tsx`
- [ ] `src/app/(authenticated)/admin/domains/loading.tsx`
- [ ] `src/app/(authenticated)/admin/domains/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/[projectId]/readiness/error.tsx`
- [ ] `src/app/(authenticated)/admin/projects/[projectId]/readiness/loading.tsx`
- [ ] `src/app/(authenticated)/admin/projects/[projectId]/readiness/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/readiness/error.tsx`
- [ ] `src/app/(authenticated)/admin/projects/readiness/loading.tsx`
- [ ] `src/app/(authenticated)/admin/projects/readiness/page.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/colleges/error.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/colleges/loading.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/colleges/page.tsx`
- [ ] `src/app/(authenticated)/admin/tenants/create/error.tsx`
- [ ] `src/app/(authenticated)/admin/tenants/create/loading.tsx`
- [ ] `src/app/(authenticated)/admin/tenants/create/page.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/admin/tenants/error.tsx`
- [ ] `src/app/(authenticated)/admin/tenants/layout.tsx`
- [ ] `src/app/(authenticated)/admin/tenants/loading.tsx`
- [ ] `src/app/(authenticated)/admin/tenants/page.tsx` — **SOURCE REFACTOR REVIEWED (replacement chat-4); strict proof pending**
- [ ] `src/app/(authenticated)/admin/tenants/setup/error.tsx`
- [ ] `src/app/(authenticated)/admin/tenants/setup/loading.tsx`
- [ ] `src/app/(authenticated)/admin/tenants/setup/page.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/app/(authenticated)/admin/verification/error.tsx`
- [ ] `src/app/(authenticated)/admin/verification/loading.tsx`
- [ ] `src/app/(authenticated)/admin/verification/page.tsx`

### Bug tracker, messaging and notification routes and components (21 TSX files)
- [ ] `src/app/(authenticated)/activity/[eventId]/error.tsx`
- [ ] `src/app/(authenticated)/activity/[eventId]/loading.tsx`
- [ ] `src/app/(authenticated)/activity/[eventId]/page.tsx`
- [ ] `src/app/(authenticated)/activity/error.tsx`
- [ ] `src/app/(authenticated)/activity/loading.tsx`
- [ ] `src/app/(authenticated)/activity/page.tsx`
- [ ] `src/app/(authenticated)/notifications/error.tsx`
- [ ] `src/app/(authenticated)/notifications/loading.tsx`
- [ ] `src/app/(authenticated)/notifications/page.tsx`
- [ ] `src/components/activity/activity-center.tsx`
- [ ] `src/components/activity/learner-notifications-inbox.tsx`
- [ ] `src/components/activity/notification-list.tsx`
- [ ] `src/components/activity/notification-toolbar.tsx`
- [ ] `src/components/verification/CollegeVerificationPanel.tsx`
- [ ] `src/components/verification/SuperAdminVerificationPanel.tsx`
- [ ] `src/components/verification/TpoVerificationPanel.tsx`
- [ ] `src/components/verification/TpoVerificationSwitch.tsx`
- [ ] `src/components/verification/VerificationExportControl.tsx`
- [ ] `src/components/verification/VerificationFilterPanel.tsx`
- [ ] `src/components/verification/VerificationReviewDrawer.tsx`
- [ ] `src/components/verification/VerificationWorkspace.tsx`

### Tenant-related admin components (23 TSX files)
- [ ] `src/components/admin/college-admin-lifecycle-action.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/admin/college-archive-button.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/admin/college-at-glance-panel.tsx` — **SOURCE REFACTOR REVIEWED (replacement chat-4); strict proof pending**
- [ ] `src/components/admin/college-branding-form.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/admin/college-branding-preview.tsx` — **SOURCE PASS (replacement chat-4), strict parity open** — **SOURCE IMPLEMENTATION REVIEWED**, strict parity unverified; see source-proof batch below (Embedded branding preview)
- [ ] `src/components/admin/college-bulk-import.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/admin/college-closing-quizzes-card.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/admin/college-create-form.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/admin/organization-create-form.tsx` — **SOURCE PASS, strict parity open (replacement chat-4)**
- [ ] `src/components/admin/college-dashboard-cards.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/admin/college-dashboard-section-failure.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/admin/college-edit-dialog.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/admin/college-feature-rule-editor.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/admin/college-logo-uploader.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/admin/college-setup-checklist.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/admin/college-signin-method-form.tsx` — **SOURCE PASS (replacement chat-4), strict parity open** — **SOURCE IMPLEMENTATION REVIEWED**, strict parity unverified; see source-proof batch below (Sign-in method controls)
- [ ] `src/components/admin/managed-college-subdomain.tsx` — **SOURCE PASS (replacement chat-4), strict parity open** — **SOURCE REFACTOR REVIEWED (replacement chat-4); strict proof pending**
- [ ] `src/components/admin/super-admin-college-company-actions.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/admin/super-admin-company-verification.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/admin/tenant-directory-csv-control.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/admin/tenant-domain-manager.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/admin/tenant-restore-action.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/admin/tenant-settings-editor.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/admin/tenant-settings-other-keys.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**

## Baseline and work plan
- Source snapshot: synced `main` at `ca5572f28bd815ac394180d4269df3db5889e19f` into lane history before this sweep. Shared UI, globals, shell and cross-lane layout files are **not owned by chat-4**.
- Recursive Git tree inventory: **260** College Admin TSX routes, **8** college-admin aliases, **51** scoped Super Admin colleges/organizations/tenants/verification/domain routes, **48** college/groups/academics/people components, **72** shared-admin components (only tenant-relevant subset), **38** tracker routes/components, **8** verification components, **4** activity components. These sets may overlap and are **not summed**.
- Baseline source-token scan of 16 high-traffic college `page.tsx` routes: raw `<button>` **2**, `<input>` **10**, `<select>` **3**, `<textarea>` **0**, `<table>` **0**, hard-coded hex literals **0**, local `<h1>` **1**; 16 files scanned. These are limited sample counts, **not** all-scope clearance counts.
- Grep command family for final all-scope audit: `grep -RInE '<(button|input|select|textarea)([[:space:]>])' 'src/app/(authenticated)/college' src/components/college src/components/academics src/components/groups --include='*.tsx'` and parallel commands for `<table`, `role="dialog"`, `fixed inset-0`, `#[[:xdigit:]]{3,8}`, `<h1`, `PageHeader`. **Full repo grep is not yet executed** (source access is through GitHub); final counts require a complete crawl.
- Plan: migrate remaining raw controls with native prop/handler parity; strip local button/input skins in favor of shared tokens; replace hand-rolled tables/overlays with shared primitives only after inspection; normalize page heads without altering page sections; confirm the authenticated one-canvas layout; audit responsive and keyboard interaction; preserve unrelated lane work.

## Legacy value comparison — source-level, not an all-states certification

| Property | Legacy reference | vNext reference | Review |
| --- | --- | --- | --- |
| Canvas fill | `docs/design/old-lms-pages.md:6` white | `src/components/ui/page-canvas.tsx:17` `bg-white` | token matches |
| Canvas border | `docs/design/old-lms-pages.md:6` 1px #e5e9f0 | `src/components/ui/page-canvas.tsx:17` `border-[var(--lms-canvas-border)]` | variable value needs final verification |
| Canvas radius | `docs/design/old-lms-pages.md:6` 12px | `src/components/ui/page-canvas.tsx:17` `--lms-canvas-radius` | variable value needs final verification |
| Canvas padding | `docs/design/old-lms-pages.md:6` 24px | `src/components/ui/page-canvas.tsx:22` `--lms-canvas-padding` | variable value and breakpoints need verification |
| Page title | `docs/design/old-lms-pages.md:7` title with inline subtitle/actions | `src/components/ui/page-header.tsx:20-31` | individual portal use and states need verification |
| Primary button | `docs/design/old-lms-shell-spec.md:25` #0a7c88, white, 9px, 36px, 14px/650 | `src/components/ui/button.tsx:11-27` CSS custom properties | token value, hover/focus/disabled/loading comparison pending |

## Section H — STRICT TICK RULE
- [ ] College Admin routes (missing: all-route grep proof, value-by-value desktop/tablet/phone comparisons, zero unshared controls/tables/dialogs and complete PageHeader count).
- [ ] College Admin groups/academics/people components (missing: zero raw controls and hard-coded visual skins across all components; complete states and interaction proof).
- [ ] Super Admin colleges/organizations/tenants/readiness/verification/branding (missing: exhaustive scoped component/page scan and responsive/keyboard proof).
- [ ] Bug tracker and messaging/notification pages (missing: exhaustive routes/components scan, modal/table reconciliation, responsive and state proof).
- [ ] One authenticated canvas and PageHeader throughout owned portal (missing: exhaustive nested-card inventory and comparison against shell; shared shell/layout owned by other lanes).
- [ ] Final all-scope grep zero/exception ledger (missing: complete repository snapshot grep, documented exemptions and line numbers).
- [ ] Value/state table and responsive proof complete (missing: full default/hover/focus/active/disabled/loading/error/empty comparisons for every relevant component).

## Exceptions that must remain explicit
Native hidden inputs, file uploads, checkbox/radio controls and externally provided widget markup may need native semantics. An exemption requires a path, line and reason; the item stays unticked until counted and documented. Do not tick based only on an earlier north-star inventory marked `[x]`.

## Change batches

### 2026-10-19 bounded-turn source edits — branch pushed

- **Source edits:** 17 TSX files; shared components now used for interactive buttons, selects, visible inputs, textareas and checkboxes in the edited files. Preserved existing form names, submitted values, event handlers, disabled and required props, and explicit `type="submit"` when replacing native submit buttons.
- **Post-edit source-level check:** fetched all 17 edited TSX files from `chatgpt/chat-4-b` and scanned `<(button|input|select|textarea|table)(?=[\\s>])`; 7 matches, **all** native `type="hidden"` in the elective roster (action/assignmentId/membershipId). **Zero non-exempt raw controls within these 17 edited TSX files.** In the edited files `<Select>` has balanced `</Select>`, `<Button>` has balanced `</Button>`, and no duplicate named Button imports were observed. This is **not** a TypeScript build or JSX parser pass.
- **Exemption ledger:** `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx`: 7 native hidden inputs, which only convey server-action form intent. `src/app/(authenticated)/college/contacts/page.tsx:60-61`: 2 previously observed hidden form inputs (tab and membershipId; not edited in this batch). `src/components/admin/college-branding-form.tsx:154,162`: `#26BAC7` and `#1A95A1` are brand-colour **input values**, not CSS skin declarations; retain pending a complete data-vs-visual-colour scan.
- **Styling:** removed hand-rolled control classes in edited files and flattened nested filter/result cards in college companies, drives, roster, placement lookup, faculty assignments, batch promotion and elective roster. These are source changes; desktop/tablet/phone pixel parity remains unverified.
- **Strict rule still open:** full 416-file grep with line-numbered exclusions, legacy/vNext line-by-line value/state matrix, all PageHeader and single-canvas coverage, accessible interaction review, tablet/phone proof, and later visual side-by-side verification. No checklist item ticked; no code/CI run in this turn.
- **Next exact file:** `src/app/(authenticated)/college/contacts/page.tsx` — reconcile all shared controls, native-hidden exemptions, local card wrappers, and PageHeader states; then continue the Work queue in the listed order.

**Changed TSX paths (source-reviewed from the pushed branch):**
- `src/app/(authenticated)/college/batch-promotion/page.tsx`
- `src/app/(authenticated)/college/companies/page.tsx`
- `src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx`
- `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx`
- `src/app/(authenticated)/college/faculty-assignment/page.tsx`
- `src/app/(authenticated)/college/faculty/[membershipId]/page.tsx`
- `src/app/(authenticated)/college/lecture-halls/[hallId]/page.tsx`
- `src/app/(authenticated)/college/people/manage/page.tsx`
- `src/app/(authenticated)/college/placements/drives/page.tsx`
- `src/app/(authenticated)/college/placements/student-lookup/page.tsx`
- `src/app/(authenticated)/college/students/[membershipId]/page.tsx`
- `src/components/academics/college-semester-management.tsx`
- `src/components/college/college-faculty-assignment-actions.tsx`
- `src/components/electives/college-elective-offering-manager.tsx`
- `src/components/groups/college-group-detail-writes.tsx`
- `src/components/placements/college-drive-bulk-actions.tsx`
- `src/components/verification/CollegeVerificationPanel.tsx`


### 2026-10-19 tab/pill/toggle value comparison (baseline after main sync)

Source head at turn start: `b275ca07455d8eafa3650ce6eb3f352a481edafb`. The comparison below is **source-level evidence**, not a rendered responsive or interaction test. Values are copied from the indicated files and lines. Shared component definitions are owned by other lanes and are not modified here.

| Property/state | Legacy source and value | vNext source and value | Result |
| --- | --- | --- | --- |
| Default tab font size | `legacy-styles/components___common.scss:365-375`: 13px | `src/components/ui/tabs.tsx:78`: `text-[13px]` | MATCH |
| Default tab font weight | `legacy-styles/components___common.scss:371`: 600 | `src/components/ui/tabs.tsx:78`: `font-semibold` (600) | MATCH |
| Default tab line-height | `legacy-styles/components___common.scss:373`: 16px | `src/components/ui/tabs.tsx:78`: `leading-4` (16px) | MATCH |
| Default tab muted text | `legacy-styles/components___common.scss:374` -> `variables.scss:28`: `#a9a7ae` | `src/components/ui/tabs.tsx:79` -> `globals.css:30`: `#a9a7ae` | MATCH |
| Tab gap at desktop | `legacy-styles/components___common.scss:471`: 20px | `src/components/ui/tabs.tsx:70` -> `globals.css:325`: 20px | MATCH |
| Tab gap at >=1600px | `legacy-styles/components___common.scss:481`: 40px | `src/components/ui/tabs.tsx:70`: 40px | MATCH |
| Tab active underline height | `legacy-styles/components___common.scss:386`: 3px | `src/components/ui/tabs.tsx:78`: 3px border | MATCH dimension, underline animation differs |
| Tab active colour | `legacy-styles/components___common.scss:400-414` -> `variables.scss:10`: `#26bac7` | `src/components/ui/tabs.tsx:79` -> `globals.css:22`: `#1a95a1` text | **MISMATCH**; shared UI owner to resolve |
| Tab default padding | `legacy-styles/components___common.scss:369`: top 0/bottom 13px | `src/components/ui/tabs.tsx:78`: top 13px/bottom 13px | **MISMATCH**; shared UI owner to resolve |
| Tab active underline animation | `legacy-styles/components___common.scss:385-391`: width/opacity 200ms ease-in-out | `src/components/ui/tabs.tsx:78`: border + colour transition | **MISMATCH**; shared UI owner to resolve |
| Tab viewport overflow | `legacy-styles/components___common.scss:444-450`: horizontal scroll, hidden scrollbar, momentum | `src/components/ui/tabs.tsx:70`: ScrollCue x, overflow implementation in `ui/scroll-cue.tsx` | PARTIAL; full mobile proof pending |
| Tab disabled/keyboard states | `legacy-styles/components___common.scss:365-414`: no explicit tab keyboard override | `src/components/ui/tabs.tsx:50-81`: disabled opacity, arrow/Home/End navigation, focus outline | NOT COMPARABLE FROM THIS SCSS; audit interaction separately |
| Generic status pill background tone | `legacy-styles/components___variables.scss:67-74`: success #059669/10%, warning #d97706/10%, error #ef4444/10%, info #eff8fa | `src/components/ui/status-badge.tsx:8-12`: token-based success/warning/error/info | PARTIAL; verify tone token values and default states |
| Generic pill radius | `legacy-styles/components___metric-pill-popover.scss:6`: metric pill 8px radius | `src/components/ui/status-badge.tsx:17` -> `globals.css:816`: 999px | DIFFERENT ELEMENT FAMILIES; do not claim exact match |
| Toggle checked fill | `legacy-styles/components___common.scss:226-228`: `$clrThird` = `#26bac7` | `src/components/ui/selection-controls.tsx:24`: `--lms-button-primary` = `#0a7c88` | **MISMATCH** where `Switch` used; shared UI owner to resolve |
| Toggle focus visible | `legacy-styles/components___form.scss:23-36`: preserve keyboard focus-visible | `src/components/ui/selection-controls.tsx:24`: `peer-focus-visible:outline-2` | MATCH intent; device focus proof pending |
| Page canvas fill | `docs/design/old-lms-pages.md:6`: white | `src/components/ui/page-canvas.tsx:17`: white | MATCH |
| Page canvas radius | `docs/design/old-lms-pages.md:6`: 12px | `src/components/ui/page-canvas.tsx:17` -> `globals.css:327`: 12px | MATCH |
| Page canvas border | `docs/design/old-lms-pages.md:6`: 1px #e5e9f0 | `src/components/ui/page-canvas.tsx:17` -> `globals.css:322`: #e5e9f0 | MATCH |
| Page canvas padding | `docs/design/old-lms-pages.md:6`: 24px | `src/components/ui/page-canvas.tsx:17,22` -> `globals.css:328`: 24px | MATCH desktop; mobile override proof pending |

- [ ] Verification shared Tabs (missing: upstream tab active colour, top padding, transition/underline mismatch and phone/tablet scroll evidence; College Verification nested PageHeader audit).
- [ ] College Admin pill/toggle skins (missing: all dynamically computed class cases, shared Switch colour mismatch, full status/tone value mapping and responsive states).
- [ ] Portal wide static class override check (missing: exhaustively reconcile `className=` overrides on shared Button/Select/Input and app-created pill/tab UI; no source-wide certified count yet).

### Bounded turn — refreshed main and portal tabs/pills/toggles (2026-10-19)

- Branch `chatgpt/chat-4-b` was fast-forwarded first to `main` commit `b275ca07455d8eafa3650ce6eb3f352a481edafb`; the preceding lane work was already in `main` (0 ahead, 928 behind before fast-forward). New edits were committed only to the lane branch. Codemod-generated Input/Select/Button conversions were **not re-applied**.
- **30 substantive commits before this audit update**, across 25 owned TSX paths plus initial audit comparison (plus this audit commit). Route-local tab buttons/hand-styled navigation now use shared `Tabs` on the College Admin contacts, project workspace, Super Admin tenant setup/detail, and shared verification queue. These retain their URL/query navigation, selected keys and any counts.
- **Status and attention treatments:** College verification attention quick filters now use `NeedsDoingChips` with their existing patches, and verification row/placement drive statuses use shared `StatusBadge` tones. No text copy or route endpoints changed.
- **Toggles:** semester active, TPO grant, college policy lock and study-group auto-refresh now use shared accessible `Switch` with disabled/pending semantics retained. The college sign-in method cards now visibly distinguish active radio choice with shared focus and selected colour tokens.
- **Token-first visual overrides:** simplified over-specific local classes on College Admin faculty, people, contacts, companies, placements, project workspace and Super Admin college directory/tenant/readiness forms, and flattened duplicate filter/preview card wrappers without moving content sections.
- **Partial changed-file scan**, using GitHub file reads (not a repository-shell grep): 23 edited TSX files inspected across two batches. `<Select>` and `</Select>` counts matched for every inspected file; `<Button>` and `</Button>` counts matched; braces counted evenly. Self-closing `Tabs`, `Switch`, `Checkbox`, `NeedsDoingChips` were checked separately. **One remaining styled raw input** was observed in `src/app/(authenticated)/college/companies/page.tsx` (show-deleted checkbox). This is **not** a claim of final zero. Other edited TSX files outside the two batches and the wider 416-path Work queue are not yet fully scanned.
- **Legacy parity blockers remain:** tab active label colour `#26bac7` vs current shared `#1a95a1`, tabs top padding and active underline animation (`docs/design/legacy-styles/components___common.scss:359-415` vs `src/components/ui/tabs.tsx:69-90`); `Switch` checked colour currently uses `--lms-button-primary` `#0a7c88` instead of legacy `$clrThird` `#26bac7` (`components___common.scss:226-228` vs `selection-controls.tsx:24`). Shared UI files remain unmodified per lane ownership.
- **Responsive/state proof still missing:** old SCSS breakpoint comparisons and phone/tablet interactive behavior have not been rendered or tested. Desktop stylesheet matching is partial and all Section H portal-wide items remain **[ ]**, including coverage counts, keyboard/focus and value-by-value state tables for every relevant element. No code/CI run or visual verification claimed.
- **Exact next file:** `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx` — replace the remaining computed application pipeline stage classes with shared counted `Tabs`, preserve query filters, then continue the other College Admin and scoped Super Admin dynamic-class Work queue.


### 2026-10-19 bounded turn: College/Super Admin PageHeader, counted application tabs, token audit

**Branch snapshot:** fast-forwarded `chatgpt/chat-4-b` to origin/main-equivalent `8b8c39571765204015de301807770b40f8387cd5` first (previous lane commits were already merged into main). **37 new [chat-4] GitHub commits directly persisted on the lane branch** before this audit entry; never touched main or `src/components/ui/*.tsx`. Shared UI components remained untouched. No app code, lint, types, tests or CI executed.

**Changed-file source-level check:** After every update the exact file was fetched again and compared against the intended new content; then all **37 changed TSX** files were fetched in three batches and checked for stray quote-before-`className` patterns, mismatched known shared-component closing-tag counts and remaining `eyebrow=` in modified files. **37 checked, 0 flagged stray-quote patterns, 0 extra closing tags for PageHeader/Tabs/Button/Select/StatusBadge/Switch/Dialog, 0 remaining eyebrow props**. This is a conservative text scan; it is **not** a JSX compiler, TypeScript typecheck, complete import check, all-route grep, or browser proof.

**Specific fixes:** 
- `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx:89` — stage quick-filter pills replaced with counted shared route `Tabs`, reusing the existing `driveApplicationsHref` query builder and `stageCounts`, preserving selected-stage URL and filter values.
- `src/app/(authenticated)/admin/tenants/setup/page.tsx:94-99` — restored `Tabs` route links after upstream code had introduced dynamic classes referencing undeclared `active` and `inactive`. Verified no such remaining references or stranded quote in the updated file.
- Super Admin scope: all owned `/admin/tenants/**` and `/admin/colleges/**` page headers touched in this pass now omit the obsolete eyebrow phrase, retaining true page titles, descriptions, actions, and server-state branches. College Admin scope: academics/sections, activity, announcements, assignments, attendance, batches, branding, classes, companies, contacts, groups, placements, and role-directory headers similarly drop eyebrow where encountered. Previously those extra labels were joined into the grey inline subtitle by `PageHeader`.
- `src/components/admin/college-branding-preview.tsx:23` converts a literal black RGBA 12% decorative image overlay to `color-mix(in srgb, var(--lms-black) 12%, transparent)`, resolving its colour from `src/app/globals.css:38` while retaining actual user-provided branding image URLs, foreground and secondary colour previews.

#### PageHeader and tabs source comparison (value proof, still incomplete)

| Property / state | Legacy source (path:line, literal value) | vNext source (path:line, literal value) | Finding |
| --- | --- | --- | --- |
| Page title separate eyebrow | `docs/design/old-lms-pages.md:7` one row: title with inline subtitle, no eyebrow | Scoped pages now call `PageHeader` without `eyebrow`; `src/components/ui/page-header.tsx:22-45` composes title + description on row | MATCH structure in edited pages only |
| Desktop title font size | `docs/design/legacy-styles/components___listing-page-header.scss:52-54` 28px / 600 | `src/components/ui/page-header.tsx:33-34` 30px / 600 at md | **MISMATCH font size** (other reference `old-lms-pages.md:7` calls it ~30px) |
| Title letter spacing | `.../components___listing-page-header.scss:57` -0.02em | `src/components/ui/page-header.tsx:33` tracking -0.02em | MATCH |
| Title line height | `.../components___listing-page-header.scss:58` 1.3 | `src/components/ui/page-header.tsx:33` 1.35 | **MISMATCH** |
| Desktop page head gap | `.../components___listing-page-header.scss:30` 24px `$s3` | `src/components/ui/page-header.tsx:28` `md:gap-6` 24px | MATCH |
| Desktop actions gap | `.../components___listing-page-header.scss:84` 16px `$s2` | `src/components/ui/page-header.tsx:49` `md:gap-4` 16px | MATCH |
| Header padding bottom + divider | `.../components___listing-page-header.scss:33-35` 16px bottom, 1px `$neutral-200` | `src/components/ui/page-header.tsx:28` `pb-4 border-b` with `--lms-canvas-border` = `#e5e9f0` (`globals.css:322`) | MATCH |
| Mobile cutoff / order | `.../components___listing-page-header.scss:128-149` <=767px: column, title 20px, title row gap 2px | `src/components/ui/page-header.tsx:28-34` mobile column; `md:` starts 768px; title 20px, inner gap 0.5 (=2px) | MATCH source-level |
| Mobile action width | `.../components___listing-page-header.scss:146-151` full width, column | `src/components/ui/page-header.tsx:49` `w-full flex-col md:w-auto md:flex-row` | MATCH source-level |
| Active tab underline / counts | `docs/design/legacy-styles/components___common.scss:365-415` 3px teal animated width, 200ms; `old-lms-pages.md:9` counts | `src/components/ui/tabs.tsx:70-90` border 3px, `TabItem.count` | **PARTIAL**: label colour and underline transition discrepancy from previous value table remains |
| Brand backdrop overlay | Design preview uses neutral darkening at 12% | `src/components/admin/college-branding-preview.tsx:23` 12% `var(--lms-black)`; `src/app/globals.css:38` #000000 | TOKENIZED source; legacy preview-specific reference not yet found |

**Intentional non-visual hex exception:** `src/components/admin/college-branding-form.tsx:154,162` still includes `#26BAC7` as the *valid HTML colour-input value* fallback and `#1A95A1` as a user-editable colour-text placeholder. Replacing those with CSS `var()` would break the `type="color"` value contract. This is not proof that all other files contain zero hard-coded decorative hex.

- [ ] Changed-file syntax/source audit (missing: TSX parse/typecheck; only GitHub readback + string-level JSX checks available under no-code/no-CI instruction).
- [ ] PageHeader parity (missing: resolve measured desktop 28px vs 30px and line-height 1.3 vs 1.35 in shared owner; remaining College Admin pages; dynamic states and screenshot proof).
- [ ] Scoped decorative hex zero (missing: whole-tree source search and exceptions log for all 416+ owned TSX; colour input values exempt).
- [ ] Full responsive verification (missing: actual desktop/tablet/mobile page render and focus/hover behavior, not just source-level breakpoint comparison).

**Next file:** `src/app/(authenticated)/college/courses/page.tsx` — continue eyebrow removal and component/state/hex value matching; then adjacent College Admin pages and tenant workflows. **No Section H items ticked** before completing the STRICT TICK RULE.

### 2026-10-19 continuing 15-minute sprint: College academic/people/placements/projects route heads

Source base: current `main` was `3a77aebd651756d5a16b9fea375ffc276fa4404b` on initial sync; the lane branch had **0 ahead, 610 behind** and was fast-forwarded without losing edits. This turn made **37 source commits before this audit commit**, each with `[chat-4]` prefix, only to `chatgpt/chat-4-b`, no CI, TypeScript compile, lint, runtime, or visual browser testing. Commits remain directly on the remote lane branch.

**Coverage / class audit (not an exhaustive repository grep):**
- College courses and course-progress, departments, domains, electives, faculty import and assignment, hiring dashboard, live classes, group detail, lecture halls, people management, programs, placement drives/detail/interview/shortlist/setup/retention/readiness/student lookup, projects templates/readiness/submissions/creation, quizzes, semesters, profile, and student accounts/import had their redundant `PageHeader.eyebrow` removed where found. Other page heading texts, descriptions, actions, filters, and server results were preserved. A few pages such as College Profile already had no eyebrow and were left unchanged.
- College placement drive overview was updated to use the same shared `StatTile` for the Hired count as for the other four metrics; the Hired status value, explanatory text and click-through to `?stage=HIRED` remain present. Source: `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx`.
- Re-read the first 35 changed TSX files from GitHub in three batches with simple checks for `className` quote artifacts, excess known JSX closing tags, remaining `eyebrow=` and six-digit hex literals. **One** missed header variant was found in `src/app/(authenticated)/college/lecture-halls/page.tsx`, corrected and re-read. No remaining `eyebrow=` or six-digit hex literals were observed in these 35 edited TSX files. The late-edited placement overview was separately read back and checked for closing `</StatTile>`, old article removal and stray quotes. This **is not** a compiler or full 416-file scan.

| Property | Legacy value with source | Current route / shared value with source | Result |
| --- | --- | --- | --- |
| Page head structure | `docs/design/old-lms-pages.md:7`: one title plus adjacent grey subtitle; no separate eyebrow | `src/components/ui/page-header.tsx:22-50`: single heading plus inline description; this sprint removes the extra `eyebrow` prop from touched College Admin routes | **MATCH** source shape for touched pages; whole-area coverage open |
| Mobile title | `docs/design/legacy-styles/components___listing-page-header.scss:128-138`: 20px at <= mobile breakpoint | `src/components/ui/page-header.tsx:28-34`: 20px default, 30px at `md` | **MATCH** mobile font size, live responsive proof pending |
| Desktop title | `components___listing-page-header.scss:52-58`: 28px, 600, line-height 1.3, letter-spacing -0.02em | `src/components/ui/page-header.tsx:33-34`: 30px, 600, line-height 1.35, letter-spacing -0.02em | **OPEN** 28 vs 30px and 1.3 vs 1.35; shared UI owner |
| Heading border | `components___listing-page-header.scss:33-35`: 1px neutral-200 and 16px bottom padding | `page-header.tsx:28` border `--lms-canvas-border`, `pb-4`; `src/app/globals.css:322`: #e5e9f0 | **MATCH** source-level |
| Hired metric card | `docs/design/old-lms-pages.md:6,11`: consistent canvas tiles and status/metric layout | College drive overview now uses five `StatTile` instances (last Hired tile with existing `href`, `detail` and child action); `src/components/ui/stat-tile.tsx:10-38` standard token radius and padding | **CONSISTENT WITH SHARED TILE**, old metric-specific rendered dimensions still open |
| User editable hex values | `src/components/admin/college-branding-form.tsx:154,162`: primary fallback `#26BAC7` and text placeholder `#1A95A1` | Intentionally not replaced by CSS var, since `type="color"` must receive valid colour literal and text is customer-facing sample | **EXEMPT**, not a decorative hard-coded UI colour |

- [ ] Entire College Admin and Super Admin colleges/tenants/readiness/branding parity (missing: full audit coverage across Work queue, all legacy states, shared UI owner 28/30px mismatch, keyboard and responsive proof, actual rendered comparisons).
- [ ] Hard-coded colours across full scope (missing: exhaustive file/line scan; changed-file text scan is **not** whole-source grep).
- [ ] JSX verification (missing: TypeScript parser/typecheck under no-CI/no-running-code instruction; source tag/stray quote scans passed for edited files only).

**Exact next file:** `src/app/(authenticated)/admin/colleges/[collegeId]/readiness/page.tsx` — readiness list/card tokens, filter states, return-navigation, audit cross-check; then branding/sign-in and remaining College Admin pages. No Section H checkbox ticked.

### Scoped Super Admin college readiness, branding and sign-in — source-proof batch (2026-10-19)

**Scope reviewed:** the five paths marked **SOURCE IMPLEMENTATION REVIEWED** in the work queue. These are **not strict-complete** under Section H: no rendered phone/tablet/desktop comparison or full typecheck was performed, and the shared `PageHeader` still has a known desktop typography mismatch. Keep their boxes unticked rather than claim pixel parity.

**Changes made:** readiness moved its return action into the shared `PageHeader`, uses `PageBackLink` and `StatusBadge` for scoped navigation/verdict, shared `StatTile` for the four persisted counts, shared `EmptyState` for no filtered checks, and border-divider checklist rows rather than card-in-card. The malformed-filter branch now has a shared `PageHeader`; mobile filter labels fill the available width. Branding now presents **one** top-level `PageHeader`, with scoped overview/web-address links in its actions. The embedded `CollegeBrandingPreview` no longer emits a duplicate `PageHeader`/back link; its own `h2` describes read-only preview data with the existing stored/default `StatusBadge`. Sign-in now places the return link in the shared header and leaves the confirmed-save, selected radio, disabled/read-only, error, and policy logic unchanged.

#### Value-by-value source comparison (state and responsive evidence)

| Property / state | Legacy source and actual value | Current scoped implementation and value | Verdict |
| --- | --- | --- | --- |
| Outer canvas | `docs/design/old-lms-pages.md:6`: white, 12px radius, 1px neutral-200, 24px padding | All three pages inherit `PageCanvas`; `src/components/ui/page-canvas.tsx:17-22` uses canvas tokens (`globals.css:322-328`) | Source matches inherited canvas; route-render proof outstanding |
| Main header hierarchy | `docs/design/old-lms-pages.md:7`: one `h1`, inline grey subtitle, actions aligned top right | `readiness/page.tsx:129-136`; `branding/page.tsx:35-41`; `signin/page.tsx:22-24` each calls `PageHeader` once in normal state; shared `page-header.tsx:25-53` emits one `h1` | Source MATCH structural hierarchy; actual alignment proof outstanding |
| Embedded branding heading | `old-lms-pages.md:6-7`: no extra canvas/page heading inside ordinary content | `college-branding-preview.tsx:132-141` uses titled `section` plus `h2` and `StatusBadge`, **0** `PageHeader` instances | MATCH intended hierarchy |
| Title size and line-height | `legacy-styles/components___listing-page-header.scss:52-58`: 28px, weight 600, line-height 1.3 | `src/components/ui/page-header.tsx:33-34`: 30px, 600, 1.35 at md | **OPEN MISMATCH**, shared component owner needed |
| Header bottom border / spacing | `.../components___listing-page-header.scss:33-35`: 1px `$neutral-200`, padding-bottom 16px | `src/components/ui/page-header.tsx:28`: 1px canvas border `#e5e9f0`, `pb-4` (16px) | MATCH token/dimension |
| Back link mobile target | `legacy-styles/learn-layout.scss:361-383` (linked from `PageBackLink`): 44px target, icon-only below 768px | `src/components/ui/page-back-link.tsx:18-29`: `min-h-11 min-w-11` (44px), `hidden md:inline` label; used in each route | MATCH source contract, keyboard/viewport verification open |
| Readiness verdict state | `old-lms-pages.md:11`: compact coloured status pill (generic pill anatomy) | `readiness/page.tsx:132-134` uses `StatusBadge` with READY success, NOT_READY error, INCOMPLETE warning; `status-badge.tsx:8-17` token backgrounds | Tone semantics preserved; exact legacy readiness-specific colour source not located |
| Four readiness counters | `old-lms-pages.md:8`: shared summary/metric presentation | `readiness/page.tsx:152-173` one `StatTile` per persisted `Passed/Failed/Unknown/Total checks`; `stat-tile.tsx:25-34` shared spacing | MATCH shared vNext value styles; **legacy metric dimensions unverified** |
| Filtered empty state | `old-lms-pages.md:6,11`: content on canvas, no extra nested-card skin | `readiness/page.tsx:233-234` uses `EmptyState`; `empty-state.tsx:6-10` transparent background and responsive padding | MATCH canvas anatomy; empty-copy preserved in description |
| Readiness rows | `old-lms-pages.md:6,11`: hairline rows, no nested ordinary-content cards | `readiness/page.tsx:236-267`: `border-b border-border py-4 last:border-b-0`, status badge and action retained | MATCH row intent; full measured row-height proof outstanding |
| Readiness query + filter state | Legacy generic filter control layout (`legacy-styles/components___listing-page-header.scss:88-104`) | `readiness/page.tsx:211-222`: 2 shared `Select` controls, `Button` submit, clear link; defaults from `parsed.status/area` | Controls shared; exact legacy select internals owned by forms lane |
| Sign-in option active/disabled | `legacy-styles/components___form.scss` and `variables.scss:10,29-32`: teal checked accent, neutral border, disabled treatment | `college-signin-method-form.tsx:54-63`: `Radio` (shared), active `border-primary bg-primary-subtle`; disabled opacity and no-pointer cursor; `Button` disabled while unchanged/saving | Token/state source proof; no keyboard or live provider test |
| Brand colours | Customer editable primary, secondary, logo and background override must reflect stored data, not fixed page colour | `college-branding-preview.tsx:13-114` reads branding tokens and public-HTTPS images; no decorative hard-coded hex; preview illustration is a **deliberate nested sign-in mock**, not a second main content canvas | Correct data-driven treatment; live tenant-host appearance explicitly not certified |

#### Exact per-file JSX/hex/raw grep proof — fetched GitHub content, not executed app

Regex family applied to the complete source text of each named file:
`/<(button|input|select|textarea|table)\b/g` by native element; `/#[a-f0-9]{3,8}\b/gi` for hex; `/<PageHeader\b/g`; `/<h1\b/g`; quote-before-`className` scan; matched opening and closing tags of known local/shared element types. This proof is restricted to these five fetched files, **not the entire portal**.

| Full path | Raw native elements | Hex literals | PageHeader JSX | Native h1 JSX | Stray quote/tag mismatch |
| --- | ---: | ---: | ---: | ---: | --- |
| `src/app/(authenticated)/admin/colleges/[collegeId]/readiness/page.tsx` | 0 | 0 | 2 (normal + invalid-filter branches) | 0 (delegated to shared PageHeader) | 0 detected |
| `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx` | 0 | 0 | 1 | 0 | 0 detected |
| `src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx` | 0 | 0 | 1 | 0 | 0 detected |
| `src/components/admin/college-branding-preview.tsx` | 0 | 0 | 0 | 0 | 0 detected |
| `src/components/admin/college-signin-method-form.tsx` | 0 | 0 | 0 | 0 | 0 detected |

#### Phone/tablet/desktop responsive source proof, without browser execution

- Legacy `listing-page-header.scss:130-154`: at up to **767px**, header title 20px, title/subtitle stack with 2px gap, actions full-width and stacked; at 768px+, the row is horizontal. Shared `page-header.tsx:28-49` expresses the same 20px mobile title and `md:` breakpoint at 768px, full-width stacked mobile actions, and desktop side actions. **Title 28/30px desktop mismatch remains.**
- `readiness/page.tsx:152-174` uses one-column mobile metric grid, **2 columns at 640px**, **4 at 1280px**; filtered select labels at `readiness/page.tsx:212,217` are full width below 640px and at least 160px from 640px; controls have 44px phone and 36px >=768px height. Legacy readiness-specific metric wrapping was not available for numeric comparison; source behavior documented, not marked equal.
- `branding/page.tsx:35-41` wraps return and verification controls; `college-branding-preview.tsx:152,253-261` stacks swatches/desktop-mobile illustrations below 640/1024px and uses 2 columns at the respective `sm`/`lg` breakpoints. The mobile illustration clamps to 235px and `max-w-full` (`college-branding-preview.tsx:31-36`). Illustration is separate from actual authenticated layout.
- `signin/page.tsx:22-24` inherits the shared responsive PageHeader. `college-signin-method-form.tsx:54-63` keeps options in one column with 56px minimum row targets; save Button has 44px below 640px and 36px from 640px, and disabled/selection states remain conditional.

**Strict missing evidence:** cannot claim file checkbox completion until shared PageHeader's 28/30px title/line-height discrepancy is reconciled by its owner, all legacy-specific responsive/style states (hover, error, busy, disabled, keyboard) are value-matched, and the actual phone/tablet browser rendering is compared. No CI, tests, screenshots, TypeScript compilation or interaction replay performed. No Section H box ticked.

**Exact next file:** `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx`, followed by administrators/session, subdomain/verification and tenant setup pages.


### Replacement chat-4 bounded turn — after fast-forward to current main (2026-10-19)

**Synchronization:** `chatgpt/chat-4-b` was 666 commits behind `main`, 0 ahead; safely fast-forwarded from `07059a526337272114f99c41ab32144bc7fc15be` to `12ee0a58fd9af5e0e1f1ad975155f864966cb6c0` before editing. The historical `[chat-4]` commits remain reachable. All edits were committed directly to `chatgpt/chat-4-b`; no edits to `src/components/ui/*`, no CI, application runtime or build executed.

**Files source-refactored this turn (11):** `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx`; `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/page.tsx`; `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/history/page.tsx`; `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx`; `src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx`; `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx`; `src/components/admin/college-at-glance-panel.tsx`; `src/components/admin/managed-college-subdomain.tsx`; `src/app/(authenticated)/admin/organizations/page.tsx`; `src/app/(authenticated)/admin/colleges/page.tsx`; `src/app/(authenticated)/admin/tenants/page.tsx`.

**Changes:** the administrators directory, device sessions, history, subdomain, verification and college setup use the shared `PageHeader` action slot with `PageBackLink` where appropriate; three administrative list empty states use `EmptyState`; verification failures use `ErrorState`; administrator lifecycle state uses `StatusBadge`. College at-a-glance switched home-grown metric cards, placeholders and error copy to `StatTile`, `Skeleton`, and `Alert`. Managed subdomain warnings and response messages now use shared `Alert` with an explicit success/error tone. Organization directory no longer duplicates the empty-state panel. Tenant lifecycle directory uses shared `DataTable` instead of nested cards, retaining all original field values and routes.

**Source-only scan (re-read all 11 complete GitHub files after last update):** `/<(button|input|select|textarea|table)\\b/g` => **0**; `/#[a-f\\d]{6}\\b/gi` => **0**; `/<h1\\b/g` => **0**. No closing tags without a corresponding opening tag were found in the scanned local JSX tag-name families (`PageHeader`, `PageBackLink`, `StatusBadge`, `EmptyState`, `DataTable`, `ErrorState`, `Alert`, `StatTile`, `Skeleton`, `Link`, `Select`, `Button`, `section`, `nav`, `table`, `form`, `article`, `div`). This is a **bounded source scan**, **not** an exhaustive repo-wide grep, balanced TypeScript parse, source execution, or pixel proof.

| Checked property | Legacy source:value | Current vNext source:value | Strict result |
| --- | --- | --- | --- |
| Page heading in continuous canvas | `docs/design/old-lms-pages.md:6-7`: one 24px-padded canvas and inline title/subtitle/actions | All six scoped detail routes use `PageHeader` and `PageBackLink` within inherited `PageCanvas`; see `src/components/ui/page-header.tsx:22-53`, `page-back-link.tsx:17-32` | Source structure aligned; actual rendering unverified |
| Heading font on desktop | `docs/design/legacy-styles/components___listing-page-header.scss:52-58`: **28px**, 600, line-height 1.3 | `src/components/ui/page-header.tsx:28-35`: **30px**, 600, line-height 1.35 | **OPEN discrepancy owned by shared UI** |
| Mobile heading breakpoint | `components___listing-page-header.scss:128-154`: <=767px, 20px heading, actions stacked | `page-header.tsx:28-49`: 20px below md 768px, full-width stacked actions | Source-layout match; viewport interaction unverified |
| Back target | `legacy-styles/learn-layout.scss:361-383`: 44px tappable link, icon-only on mobile | `src/components/ui/page-back-link.tsx:17-32`: `min-h-11 min-w-11`, label hidden below md | Source values match; keyboard and visual verification open |
| List table and pill anatomy | `docs/design/old-lms-pages.md:11`: hairline list tables with compact coloured status pills | `src/app/(authenticated)/admin/tenants/page.tsx`: `DataTable` and `StatusBadge`; shared `data-table.tsx:61-98` supplies hairline rows, `status-badge.tsx:8-20` supplies pill | Exact legacy row/pill colour and hover property table not yet complete |
| Table on phone | `legacy-styles/components___listing-page-header.scss:128-154`: general mobile breakpoint 767px | `src/components/ui/data-table.tsx:61-103`: responsive `sm:` table at **640px**, cards on smaller screens | **OPEN** differing breakpoint and legacy mobile table proof |
| Empty, error and loading states | `old-lms-pages.md:6,11`: states remain within one canvas; do not add nested page canvases | Shared `EmptyState`, `ErrorState`, `Alert`, `Skeleton` and `StatTile` used in affected files | Matching legacy per-state spacing, colours, focus and transitions not proven |
| Route links and data | Existing vNext paths and data descriptions intentionally retained as required by owner | Admin session-history export, managed subdomain confirmation, organization filters, college lifecycle statuses and tenant detail links preserved | Source review only; runtime journey not executed |

**Strict tick outcome:** **0 ticks**. All 11 work entries remain unchecked because global zero-grep, exact value table for every state, 767px breakpoint comparison, interactions and responsive viewport proof are incomplete. No app execution, TypeScript compilation, tests, screenshots, or CI were performed. This is progress on shared-component migration, **not certified pixel parity**.

**Next exact file:** `src/app/(authenticated)/admin/tenants/create/page.tsx` followed by `src/app/(authenticated)/admin/tenants/setup/page.tsx`, then remaining Tenant Admin components and College Admin Work queue entries.


### Replacement chat-4 continued tenant setup/settings/domain source sweep — 2026-10-19

**Work done:** seven scoped files received complete source-pattern refactors, with original submission, permission, confirmation, navigation and server actions left in place. The previously unlisted organization creation component was added to this Work queue. No shared UI code was edited; no app, tests, CI, typecheck, browser, or screenshots were run. No strict checkboxes are ticked.

#### Bounded full-file source grep proof (fetched all seven current branch blobs)

Regexes applied independently to each full file: `/<(button|input|select|textarea|table)\b/g` (lowercase native controls), `/#[a-f0-9]{3,8}\b/gi` (colour literals), `/fixed inset-0|role=["']dialog["']/g`, and `/<h1\b/g`; compared closing-tag counts against opening-tag counts for the scoped JSX tag families. `md:`/`sm:` report source breakpoint tokens, **not** measured browser rendering.

| Full file | Native controls | Hex literals | Hand-rolled overlays | Native h1 | Orphan closing tag families | Responsive source tokens |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| `src/app/(authenticated)/admin/tenants/create/page.tsx` | 0 | 0 | 0 | 0 | 0 found | `md:` 3, `sm:` 0 |
| `src/app/(authenticated)/admin/tenants/setup/page.tsx` | 0 | 0 | 0 | 0 | 0 found | `md:` 4, `sm:` 0 |
| `src/components/admin/organization-create-form.tsx` | 0 | 0 | 0 | 0 | 0 found | `md:` 5, `sm:` 0 |
| `src/components/admin/college-create-form.tsx` | 0 | 0 | 0 | 0 | 0 found | `md:` 2, `sm:` 0 |
| `src/components/admin/tenant-settings-editor.tsx` | 0 | 0 | 0 | 0 | 0 found | `md:` 2, `sm:` 0 |
| `src/components/admin/tenant-settings-other-keys.tsx` | 0 | 0 | 0 | 0 | 0 found | `md:` 2, `sm:` 0 |
| `src/components/admin/tenant-domain-manager.tsx` | 0 | 0 | 0 | 0 | 0 found | `md:` 6, `sm:` 0 |

#### Tenant creation route — `src/app/(authenticated)/admin/tenants/create/page.tsx`

| Property/state | Legacy source:value | Current vNext source:value | Result |
| --- | --- | --- | --- |
| Shell and heading | old-lms-pages.md:6-7: one canvas, title/subtitle/action row; listing-page-header.scss:33-35: 1px divider, 16px bottom padding | create/page.tsx:18 and page-canvas.tsx:15-22: one inherited canvas, PageHeader actions | **SHARED STRUCTURE; desktop heading mismatch below** |
| Denied/failed reads | old-lms-pages.md:6: error content remains inside canvas | create/page.tsx:17-31: PageHeader + ErrorState + safe back navigation, no extra canvas | **SHARED COMPONENT; legacy state visuals not sourced** |
| Warning banner | old-lms-pages.md:11: slim pale-yellow warning strip | create/page.tsx:45; ui/alert.tsx:10-19 tokenised warning strip | **STATE INCLUDED; exact warning shade/spacing unverified** |
| Creation forms | components___form.scss:22-36: focus-visible keyboard outline retained; old-lms-shell-spec.md:4: primary CTA 36px high, radius 9px | create/page.tsx:44,50 delegates to shared OrganizationCreateForm / CollegeCreateForm; button.tsx:25-29 uses 36px token | **MATCH desktop control family, mobile exceptions tracked below** |
| Mobile/tablet | listing-page-header.scss:130-153: <=767px stacked actions; 20px title | create/page.tsx:46,52,57 md:min-h-9 (44px through 767px); shared PageHeader md breakpoint at 768px | **MATCH breakpoint for links; tenant form layout-specific comparison open** |

#### Tenant setup route — `src/app/(authenticated)/admin/tenants/setup/page.tsx`

| Property/state | Legacy source:value | Current vNext source:value | Result |
| --- | --- | --- | --- |
| Canvas and tabs | old-lms-pages.md:6-7: one canvas with tabs on surface, teal underline | setup/page.tsx:97 uses shared Tabs; page-canvas.tsx:15-22 inherits canvas | **SHARED structure; exact active underline dimensions not confirmed** |
| Workflow warnings/readiness | old-lms-pages.md:11: slim status banner within canvas | setup/page.tsx:107, 144; ui/alert.tsx:10-19 | **SHARED, tone mapped success/error/warning; colour proof open** |
| Launch shortcuts | old-lms-pages.md:6,9: cards only for independent objects | setup/page.tsx:152 + ui/card.tsx:11-22: shared border/background/radius; three separate navigational shortcuts | **SHARED; hover and focus use tokens, rendered proof open** |
| Checklist rows | old-lms-pages.md:6,9: continuous surface with hairline dividers | setup/page.tsx:165: line items border-b, rather than nested cards | **MATCH hairline design intent; line-height/spacing not fully measured** |
| Empty selection | old-lms-pages.md:6: normal content on canvas; no nested page canvas | setup/page.tsx:175 uses ui/empty-state.tsx:6-10 and original scoped action link | **SHARED; precise empty-state metrics open** |
| Phone/tablet | listing-page-header.scss:130-153: <=767px stack, >=768px row | setup/page.tsx:83 overview/shortcuts at md, checklist md:grid-cols-2, creation sections lg:grid-cols-2 | **MATCH mobile stacking; tablet-specific legacy grid not sourced** |

#### Organization creation form — `src/components/admin/organization-create-form.tsx`

| Property/state | Legacy source:value | Current vNext source:value | Result |
| --- | --- | --- | --- |
| Text input | components___form.scss:22-36: keyboard focus remains visible; globals.css:344 field radius 10px | organization-create-form.tsx:68 delegates to ui/input.tsx:6-8 with focus-visible 2px | **Shared component; old form variant incomplete** |
| CTA | old-lms-shell-spec.md:4: teal/white 36px/radius 9 primary | organization-create-form.tsx:77 and ui/button.tsx:10-29 tokenised primary CTA | **MATCH desktop token family** |
| Draft/error feedback | old-lms-pages.md:7,11: inline status strips rather than nested page canvas | organization-create-form.tsx:80 + 82: shared alerts retain copy and aria role | **SHARED; legacy colour/spacing not sourced** |
| Mobile/tablet layout | listing-page-header.scss:130-153: <=767px stacked page actions | organization-create-form.tsx:59: mobile stacked, >=768px inline; CTA 44px up to 767px, 36px thereafter | **MATCH breakpoint at source level** |
| Loading/disabled | old-lms-shell-spec.md:4: primary button visual contract; components___button.scss:49-51 disabled | organization-create-form.tsx:77: pending disables and swaps label; ui/button.tsx:25-29 retains disabled state | **BEHAVIOUR retained; exact loading affordance unverified** |

#### College creation form — `src/components/admin/college-create-form.tsx`

| Property/state | Legacy source:value | Current vNext source:value | Result |
| --- | --- | --- | --- |
| Input/select | components___form.scss:22-36: keyboard focus visible; legacy field radius from globals.css:344 | college-create-form.tsx:104 / 125 use shared Select/Input, preserve min/max and error contracts | **SHARED components, validation intact** |
| Optional address | old-lms-pages.md:6: no ordinary nested canvas; keyboard affordances expected | college-create-form.tsx:156 uses ui/disclosure.tsx:9-20 native summary/keyboard focus with no extra page canvas | **SHARED structure; exact address disclosure not in legacy** |
| Error/draft | old-lms-pages.md:11: compact statuses and alerts | college-create-form.tsx:184, 186 uses shared Alert | **SHARED, status tones preserved** |
| Phone/tablet columns | listing-page-header.scss:130-153: <=767px stacked page controls | college-create-form.tsx:95: 1-column below 1024; optional address 2-col >=768, 3-col >=1024; submit CTA 44px below 768 | **MATCH mobile stack; tablet-specific forms proof open** |
| Disabled/loading | components___button.scss:49-51: disabled CTA states, old-lms-shell-spec.md:4 height/radius | college-create-form.tsx:171 uses disabled and loading shared Button; `aria-busy` form remains | **Shared state, visual comparison pending** |

#### Tenant settings editor — `src/components/admin/tenant-settings-editor.tsx`

| Property/state | Legacy source:value | Current vNext source:value | Result |
| --- | --- | --- | --- |
| Controls | components___form.scss:22-36: keyboard focus; globals.css:341-345 control height/radius | tenant-settings-editor.tsx:59 / 62 use shared controls, no native styled fields | **SHARED components, per-property values elsewhere** |
| Warning/error | old-lms-pages.md:11: inline warning strip, no extra cards | tenant-settings-editor.tsx:52 and 80 use ui/alert.tsx token variants | **STATE included; shade/spacing unverified** |
| Per-row save result | old-lms-pages.md:6,11: hairline list rows, small status pills | tenant-settings-editor.tsx:98: status badges and divide-y hairline rows | **MATCH anatomy; exact pill metrics owned by shared UI** |
| Impact confirmation | old-lms-pages.md:6: no inline full-page modal wrappers | tenant-settings-editor.tsx:81 uses shared dialog, scoped high-impact acknowledgement preserved | **SHARED, modal overlay source detail open** |
| Phone/tablet | listing-page-header.scss:130-153: stacked phone actions | tenant-settings-editor.tsx:55 two settings columns >=768px, single below; CTA explicit 44px below 768px | **MATCH mobile breakpoint; legacy settings form grid not measured** |

#### Other tenant settings — `src/components/admin/tenant-settings-other-keys.tsx`

| Property/state | Legacy source:value | Current vNext source:value | Result |
| --- | --- | --- | --- |
| Edit fields | components___form.scss:22-36: keyboard focus, old-lms-shell-spec.md:4 control geometry | tenant-settings-other-keys.tsx:67 and 72 shared Input/Textarea with native constraints | **SHARED, legacy exact field metrics open** |
| List rows | old-lms-pages.md:6,11: hairline separated rows | tenant-settings-other-keys.tsx:52 row uses border-b and tokenised hover | **MATCH row intent; legacy hover shade unverified** |
| Save state | old-lms-pages.md:11: compact status alerts | tenant-settings-other-keys.tsx:80 feedback mapped explicit error/success, text retained | **SHARED; exact hue unverified** |
| Delete confirmation | old-lms-pages.md:6: no hand-rolled overlay | tenant-settings-other-keys.tsx:81 uses ConfirmDialog with retained confirmation | **SHARED, exact overlay metrics not measured** |
| Phone/tablet | listing-page-header.scss:130-153: 767px mobile breakpoint | tenant-settings-other-keys.tsx:59 buttons 44px below 768; fields single column and wrap | **MATCH mobile target; tablet row width unverified** |

#### Tenant domain manager — `src/components/admin/tenant-domain-manager.tsx`

| Property/state | Legacy source:value | Current vNext source:value | Result |
| --- | --- | --- | --- |
| Host entry | components___form.scss:22-36: keyboard focus; old-lms-shell-spec.md:4 control geometry | tenant-domain-manager.tsx:192 shared Input, CTA shared Button and 44px mobile | **SHARED; exact field/hover proofs pending** |
| Zero domains | old-lms-pages.md:6: empty content within canvas, not separate page canvas | tenant-domain-manager.tsx:218 + ui/empty-state.tsx:6-10 shared empty state | **SHARED; legacy domain empty not observed** |
| DNS proof block | old-lms-pages.md:6,9: distinct object panel may have card border | tenant-domain-manager.tsx:320 uses shared Card title and retained TXT name/value | **SHARED; exact DNS panel legacy unknown** |
| Status actions | old-lms-pages.md:11: compact coloured pills, action buttons | tenant-domain-manager.tsx:243 badges and shared Button; ConfirmDialog remains shared | **MATCH component family; precise colours/hover unknown** |
| Responsive | listing-page-header.scss:130-153: mobile <=767px stacked | tenant-domain-manager.tsx:184 single-col host/actions below 768; 44px phone buttons, 36px >=768; rows flex-wrap | **MATCH source mobile break, tablet-specific DNS layout unverified** |

#### Shared dependency and strict-tick reconciliation

- **Desktop heading difference:** `legacy-styles/components___listing-page-header.scss:52-58` specifies 28px/600/line-height 1.3, while shared `src/components/ui/page-header.tsx:28-35` specifies 30px/600/1.35. College portal skin `src/styles/college-admin-north-star.css:10-15` also sets line-height 1.25 and letter-spacing -0.025em; comparison with the old LMS's 30px shell measurement (`old-lms-shell-spec.md:5`) remains unresolved. This is outside the seven touched files and cannot be certified in isolation.
- **Mobile text difference:** legacy `listing-page-header.scss:130-153` uses 20px title through 767px. Shared PageHeader encodes 20px below md, but `college-admin-north-star.css:38-42` also encodes `clamp(24px, 6vw, 30px)` for portal h1. CSS cascade and computed mobile typography need owner reconciliation.
- **Control and interaction proof:** shared Input/Select/Button/Alert/Card/EmptyState/Disclosure carry default, hover, focus, disabled and loading variants, but these were inspected as **source only**; exact legacy warning surfaces, dialog geometry, textarea error treatment, tablet grids and focus shadows were not measured live. `legacy-styles/components___form.scss:22-36` confirms the keyboard-visible focus rule, `components___button.scss:1-24` documents button variants, and `old-lms-shell-spec.md:4` documents the newer measured 36px primary CTA.
- **Coverage limitation:** seven fetched scoped files each have zero native control/hex/overlay matches, but this is **not** a whole-portal Git grep; 434 Work queue entries and other scoped files have not been exhaustively scanned or compared. No unverified checkbox was marked done.

**Next exact file:** `src/components/admin/college-setup-checklist.tsx` (then `src/components/admin/college-feature-rule-editor.tsx` and remaining tenant/College Admin components), prioritizing source-complete migration, token/hover state comparison and mobile source proof.


### Replacement chat-4 College Admin setup and feature-rule continuation — 2026-10-19

**Two further source-refactored files:** `src/components/admin/college-setup-checklist.tsx` and `src/components/admin/college-feature-rule-editor.tsx`. Both were fetched and re-read after their commits. Shared `Disclosure`, `ListRow`, `EmptyState`, `Alert`, `Select`, `Switch`, `Checkbox`, `Button`, `ConfirmDialog` are reused; no edit was made under `src/components/ui`. Existing navigation, server decisions, confirmations and audit logic retained. No CI/build/browser/typecheck ran.

#### Scoped grep and JSX scan

Complete fetched-file expressions: `/<(button|input|select|textarea|table)\b/g`; `/#[a-f\d]{3,8}\b/gi`; `/fixed inset-0|role=["']dialog["']/g`; `/<h1\b/g`. Paired opening/closing name families (`Alert`,`EmptyState`,`Disclosure`,`Select`,`Switch`,`Checkbox`,`Button`,`ConfirmDialog`,`ListRow`,`div`,`section`,`label`,`p`,`h2`,`h3`,`li`,`ul`) had **zero orphan closing tags**. This does not substitute for TSX parser/typecheck.

| File | Raw controls | Literal hex | Overlays | Native h1 | Breakpoint tokens |
| --- | ---: | ---: | ---: | ---: | --- |
| `src/components/admin/college-setup-checklist.tsx` | 0 | 0 | 0 | 0 | md 2 / sm 0 |
| `src/components/admin/college-feature-rule-editor.tsx` | 0 | 0 | 0 | 0 | md 2 / sm 0 |

#### Value and responsive comparison — `college-setup-checklist.tsx`

| Property/state | Legacy source:value | Current value/source | Result |
| --- | --- | --- | --- |
| Main canvas | `old-lms-pages.md:6`: one white 12px canvas, padding 24px; `listing-page-header.scss:33-35`: hairline dividers | `college-setup-checklist.tsx:13` shared Disclosure uses `border-t border-border`; `PageCanvas` remains outer wrapper | Source layout matches; rendered exactness open |
| Row contents | `old-lms-pages.md:6,11`: compact hairline list rows on canvas | `college-setup-checklist.tsx:30`: shared `ListRow` retains labels/counts/actions | Shared anatomy; old setup-list-specific heights unverified |
| Empty state | `old-lms-pages.md:6`: empty content should not add nested canvas | `college-setup-checklist.tsx:24`: shared empty state when `phases.length===0` | Source-only; precise empty state dimensions open |
| Phone and tablet | `listing-page-header.scss:130-153`: <=767px stacked layout, 20px page heading | `college-setup-checklist.tsx:25`: single-column <=767px, two columns >=768px; action target `min-h-11 md:min-h-9` | Breakpoint and 44px phone target match; tablet real viewport unverified |
| Focus, collapse, hover | `components___form.scss:22-36`: :focus-visible keyboard focus retained | `ui/disclosure.tsx:9-20` native details + summary, focus ring and reduced-motion treatment; `college-setup-checklist.tsx:13` uses it | Source keyboard contract shared; no interaction replay |

#### Value and responsive comparison — `college-feature-rule-editor.tsx`

| Property/state | Legacy source:value | Current value/source | Result |
| --- | --- | --- | --- |
| Select and toggle | `components___form.scss:22-36`: focus-visible keyboard outline, legacy select font inherited | `college-feature-rule-editor.tsx:75` shared Select and `Switch` for locked policy | Shared; exact select control font/height subject to skin review |
| Locked/disabled | `old-lms-pages.md:11`: slim warning statuses, `components___button.scss:49-51`: disabled action state | `college-feature-rule-editor.tsx:73` uses shared warning; `disabled` guards on choices and Button are unchanged | Source state matched; precise warning palette unverified |
| Save, error and success | `old-lms-pages.md:11`: statuses on same canvas | `college-feature-rule-editor.tsx:81` uses shared error/success; all seven outcome paths explicitly select tone | Shared states; no server replay |
| Confirmation warnings | `old-lms-pages.md:6`: overlay should be centralized; do not nest page canvas | `college-feature-rule-editor.tsx:82`: shared ConfirmDialog; lock, unknown student count and impact warnings use shared Alert | Source-only; exact modal metrics unverified |
| Phone and tablet controls | `listing-page-header.scss:130-153`: <=767px stacked actions and 44px targets | `college-feature-rule-editor.tsx:80`: Button targets 44px up to 767px/36px >=768px; wrapped action row | Breakpoint source matched, exact legacy mobile dialog unverified |
| Hover/focus/loader | `components___form.scss:22-36`: visible keyboard focus; `old-lms-shell-spec.md:4` CTA height/radius | `ui/button.tsx:10-29`, `ui/select.tsx:6-8`, `ui/confirm-dialog.tsx` delegated variants; busy state disables action and retains loading wording | Source contract kept; browser proof open |

**Strict completion:** 0 checkboxes ticked for these two; previous seven also remain unticked. Shared PageHeader mobile/desktop typography conflicts and missing old-LMS exact value sources, whole-portal grep and responsive interaction/render evidence prevent all-match strict proof. The current Work queue is a source-migration ledger, not a claim of pixel completion.

**Exact next file:** `src/components/admin/college-logo-uploader.tsx` (then `src/components/admin/college-branding-form.tsx` and other remaining College Admin/Super Admin controls).


### Replacement chat-4 branding and college actions — source and responsive audit (2026-10-19)

Six queued files refactored to shared components; original image crop, brand values, permission gates, tenant URLs, modal actions, server validations, toasts and status semantics retained. **No CI, application runtime, TypeScript compiler, browser screenshots, or interaction execution.** The evidence below is source-based and must not be mistaken for complete Section H pixel certification.

#### Grep proof — complete fetched text of each named file

For each GitHub blob, checked `/<(button|input|select|textarea|table)\b/g` (lowercase native form/table tags), `/#[a-f0-9]{3,8}\b/gi` (hex literals), `/fixed inset-0|role=["']dialog["']/g`, `/<h1\b/g`; compared unmatched closing tag families `Card,Alert,Button,Input,Dialog,ConfirmDialog,StatusBadge,div,section,aside,form,label,span,p,article,h2,h3`. This is a per-file source grep, not the global shell grep required for a strict tick.

| Full file | Raw controls | Hex | Hand overlay | Native h1 | Orphan closing tag families | Responsive tokens md/sm/lg |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| `src/components/admin/college-logo-uploader.tsx` | 0 | 0 | 0 | 0 | 0 | 3 / 1 / 0 |
| `src/components/admin/college-branding-form.tsx` | 0 | 0 | 0 | 0 | 0 | 2 / 0 / 5 |
| `src/components/admin/college-branding-preview.tsx` | 0 | 0 | 0 | 0 | 0 | 2 / 2 / 1 |
| `src/components/admin/college-edit-dialog.tsx` | 0 | 0 | 0 | 0 | 0 | 6 / 0 / 0 |
| `src/components/admin/college-admin-lifecycle-action.tsx` | 0 | 0 | 0 | 0 | 0 | 2 / 0 / 0 |
| `src/components/admin/college-archive-button.tsx` | 0 | 0 | 0 | 0 | 0 | 3 / 0 / 0 |

#### `src/components/admin/college-logo-uploader.tsx`

| Property/state | Legacy value and source | VNext value and source | Result |
| --- | --- | --- | --- |
| Single canvas, preview geometry | docs/design/old-lms-pages.md:6: one white canvas, separate objects alone may have border | college-logo-uploader.tsx:77: current logo is a separate shared Card inside inherited PageCanvas | **Source structure matches; legacy uploader-specific 24x24 logo size not documented** |
| File/crop inputs | legacy-styles/components___form.scss:117-143: 10px radius, 14px/20px tracking .2px and teal focus shadow | college-logo-uploader.tsx:81 and 91: 1 shared file input, 3 shared range inputs; ui/input.tsx:13-44 | **Shared input chrome; browser range thumb styling not source-matched** |
| Upload, remove, loading, disabled | old-lms-shell-spec.md:4: 36px primary/secondary button, 9px radius; components___button.scss:49-51 disabled behaviour | college-logo-uploader.tsx:99: Buttons honor busy with 44px mobile, 36px md+; text updates while pending | **Token targets align; button hover/loading exactness depends on shared owner** |
| Outcome and permission states | old-lms-pages.md:11: slim inline notice strip and no nested page canvas | college-logo-uploader.tsx:103/109: shared read-only info and success/error status | **Shared states; legacy error/warning colours not measured** |
| Delete confirm | old-lms-pages.md:6: dialogs not per-page overlay, page stays one canvas | college-logo-uploader.tsx:108 delegates to ui/confirm-dialog.tsx:15-19 and ui/dialog.tsx:39-56 | **No hand-rolled overlay; native rendered focus trap unverified** |
| Responsive phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px vertical mobile, 44px targets | college-logo-uploader.tsx:83,99,106: w-full upload field, 44px action targets <768px and 36px >=768; crop preview width 208px | **Source target breakpoint matches; exact viewport crop layout unverified** |

#### `src/components/admin/college-branding-form.tsx`

| Property/state | Legacy value and source | VNext value and source | Result |
| --- | --- | --- | --- |
| Form inputs and validation | legacy-styles/components___form.scss:117-143: 10px radius, 14px font/20px line, error red 6% bg, focus 20% halo | college-branding-form.tsx:154; shared ui/input.tsx:21-40 and aria-invalid per field | **Source error-control rules match; no live form error comparison** |
| Color values | old-lms-pages.md:6: tenant-owned visual branding must not hard-code decorative app colors | college-branding-form.tsx: imports ui/branding-color-tokens; native colour picker reads validated hex or shared default, text sample via shared token | **Intentional editable brand colors, no decorative literals** |
| Error, read-only, save/loading | old-lms-pages.md:11: slim notice strips; old-lms-shell-spec.md:4 primary CTA is 36px teal-white, radius 9px | college-branding-form.tsx:172 and 207: per-field shared errors, read-only info, loading Button | **States moved to shared UI; save events not replayed** |
| Mock sign-in distinct visual | old-lms-pages.md:6,9: only distinct objects may be cards | college-branding-form.tsx:223: sign-in preview illustration in a shared Card, outside form, not an extra page canvas | **Matches independent-illustration shape; legacy sign-in interior not source-matched** |
| Responsive layout | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked, >=768 horizontal actions | college-branding-form.tsx:147 two color columns at 768+; aside at lg with border-left, below with border-top; 44px save touch target below 768 | **Source mobile/tablet stack proof; actual cropping/spacing unverified** |
| Disabled/error/hover/focus | legacy-styles/components___form.scss:22-36,136-143: mouse focus ring suppressed, keyboard ring, invalid red halo | college-branding-form.tsx uses disabled={!canEdit}, aria-invalid and shared Input focus-visible/disabled/hover variants, ui/input.tsx:26-40 | **Source rules supplied; computed CSS in tenant skin not observed** |

#### `src/components/admin/college-branding-preview.tsx`

| Property/state | Legacy value and source | VNext value and source | Result |
| --- | --- | --- | --- |
| Single heading and status | old-lms-pages.md:6-7: page has one overall heading; embedded sections use subordinate heads | college-branding-preview.tsx:133-141: section h2 and shared StatusBadge; no PageHeader or h1 | **Source hierarchy matches** |
| Brand colors and image safety | old-lms-pages.md:6: visual values sourced from tenant where supplied | college-branding-preview.tsx:20-38: dynamic tokens/background; protected HTTPS safe fields retained | **Data-driven; legacy exact branding palette tenant-dependent** |
| Independent illustrations | old-lms-pages.md:9: cards only for separate report/illustration objects | college-branding-preview.tsx:255: 2 shared Card wrappers for desktop and mobile sign-in previews | **Shared card geometry; mock interior deliberately illustrative** |
| Responsive color details | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked, >=768 inline | college-branding-preview.tsx:153: swatches and metadata one column on phones, two at 768+ | **Matching breakpoint source, legacy preview-specific layout unknown** |
| Phone/desktop illustrations | old-lms-pages.md:6,9: separate visual objects | college-branding-preview.tsx:33-36: 235px max-w-full mobile mock, desktop max-w 320px, illustrations two columns at lg >=1024px | **Resizes by source; no viewport rendering** |
| Hover/focus/empty | legacy-styles/components___form.scss:22-36: focus-visible on interactive fields | college-branding-preview.tsx:188-246: readonly HTTPS links and suppressed unsafe URLs, no form fields or faux interactive buttons | **Read-only; actual link hover/keyboard styling not measured** |

#### `src/components/admin/college-edit-dialog.tsx`

| Property/state | Legacy value and source | VNext value and source | Result |
| --- | --- | --- | --- |
| Native overlay | old-lms-pages.md:6: no route-level handmade overlays | college-edit-dialog.tsx:106 shared Dialog with ui/dialog.tsx:39-56, native <dialog> and central overlay owner | **Zero handrolled overlay; legacy animation/geometry unverified** |
| Modal form fields | legacy-styles/components___form.scss:117-143: 14px, radius 10px, focus-visible teal | college-edit-dialog.tsx:140 shared Input values, readonly college code and original maxLength | **Shared field chrome; exact modal form label sizing unknown** |
| Save, cancel, pending | old-lms-shell-spec.md:4: 36px buttons desktop; components___button.scss:49-51 disabled | college-edit-dialog.tsx:89-128: 3 shared Buttons, save loading, disabled pending | **Source states match shared contract; pending interaction not replayed** |
| Responsive form and actions | legacy-styles/components___listing-page-header.scss:130-153: 767px phone boundary | college-edit-dialog.tsx:132: fields single-col <=767, two-col >=768; action 44px phone, 36px >=768 | **Breakpoint source aligned; dialog overflow and close not rendered** |
| Error/success notification | old-lms-pages.md:11: status indications inline, no extra canvas | college-edit-dialog.tsx:57-80: shared toast reports failures and success; modal closes only success | **Existing flow kept; legacy toast geometry unknown** |
| Keyboard and a11y | legacy-styles/components___form.scss:22-36: focus-visible | ui/dialog.tsx:39-56 supplies aria title/description and native dialog close; ui/input.tsx:30-31 keyboard ring | **Source accessibility treatment present, no keyboard replay** |

#### `src/components/admin/college-admin-lifecycle-action.tsx`

| Property/state | Legacy value and source | VNext value and source | Result |
| --- | --- | --- | --- |
| Role guard and warning | old-lms-pages.md:11: compact warning strip | college-admin-lifecycle-action.tsx:35 shared Alert when Mentor assignment blocks suspend | **Shared status; exact legacy warning spacing unknown** |
| Reason input | legacy-styles/components___form.scss:117-143: input 10px radius, 14px, .2px tracking, teal focus | college-admin-lifecycle-action.tsx:38 shared Input, maxLength 1000; disabled during request | **Source shared treatment; form-specific row height unverified** |
| Action button and dialog | old-lms-shell-spec.md:4: button 36px desktop/9px radius; old-lms-pages.md:6 centralized overlay | college-admin-lifecycle-action.tsx:41 Button loading and shared ConfirmDialog | **Matches inherited controls; no live action test** |
| Success/error/empty | old-lms-pages.md:11: statuses without nested cards | college-admin-lifecycle-action.tsx:45 error Alert; success closes confirmation, refreshes route; unrelated status returns null | **State flow preserved; legacy success notice not required** |
| Mobile/tablet | legacy-styles/components___listing-page-header.scss:130-153: mobile <=767px, 44px controls | college-admin-lifecycle-action.tsx:39-42 Input/Button min-h-11 md:min-h-9; reason/content wraps within min-w-44 | **Source target matches; narrow table cell resizing not browser-tested** |
| Disabled/focus | legacy-styles/components___form.scss:22-36: keyboard focus; components___button.scss:49-51 disabled | college-admin-lifecycle-action.tsx:38-41: controlled pending/input guards; shared UI focus variants | **Source contract matches; exact hover/pressed visuals pending** |

#### `src/components/admin/college-archive-button.tsx`

| Property/state | Legacy value and source | VNext value and source | Result |
| --- | --- | --- | --- |
| Central destructive overlay | old-lms-pages.md:6: no hand-rolled modal | college-archive-button.tsx:124: shared Dialog with title/description/footer and no nested canvas | **Shared overlay; legacy destructive modal-specific measurements unknown** |
| Trigger and footer CTAs | old-lms-shell-spec.md:4: 36px desktop, white button label, radius 9px | college-archive-button.tsx:116-145: 3 shared Button controls, danger/secondary variants, 44px phone/36px >=768 | **Shared tokens used; hover exactness depends on shared UI** |
| Pending/disabled | docs/design/legacy-styles/components___button.scss:49-51: disabled special state | college-archive-button.tsx:135-149: disabled buttons, loading spinner on destructive confirmation | **Source state implemented, no interaction playback** |
| Error success | old-lms-pages.md:11: status feedback on same page surface | college-archive-button.tsx:79-110: shared toast error/success, with dependency failure details retained | **Existing user feedback preserved; toast legacy geometry unverified** |
| Responsive phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: mobile actions 44px | college-archive-button.tsx:119,134,143: 44px action targets below md, 36px at md+; Dialog default width calc(100%-2rem) | **Source geometry and breakpoints, actual viewport not captured** |
| Focus/close | legacy-styles/components___form.scss:22-36 keyboard-visible focus | ui/dialog.tsx:39-56: accessible native dialog and focus restoration; Button focus-visible variant | **Shared keyboard source; keyboard replay outstanding** |

#### Why strict boxes are still open

All six local grep scans report zero raw controls, literal hex and hand-rolled overlays; however, **six scoped route/component source migrations are not the same as six strictly completed legacy clones**. Outstanding: legacy logo-crop and domain-specific branding visual source is not available; full property/state matrices cannot be certified without UI execution; touch sizes and breakpoint rules were compared as CSS source only. Shared UI is unchanged, and `src/styles/college-admin-north-star.css:10-15,38-42` still overrides responsive page headings differently from `legacy-styles/components___listing-page-header.scss:52-58,130-153`. Global zero-grep and live responsive/keyboard validation remain open. Consequently **0 work queue checkboxes ticked**.

**Exact next file:** `src/components/admin/college-branding-preview.tsx` has now been source-refactored in this batch; proceed to `src/components/admin/college-bulk-import.tsx`, then `src/components/admin/college-dashboard-section-failure.tsx` and the remaining Work queue items.


### Replacement chat-4 bulk import and dashboard error component sweep — 2026-10-19

Both components were fetched and re-read after their pushes. Native controls, hard-coded colour literals, hand-built overlays and native page h1 are absent in both. Scoped regexes: `/<(button|input|select|textarea|table)\b/g`, `/#[a-f0-9]{3,8}\b/gi`, `/fixed inset-0|role=["']dialog["']/g`, `/<h1\b/g`. This is a source-only scan, not a global repository grep or viewport rendering.

| File | Native controls | Hex | Hand overlay | Native h1 | Orphan close families | md/sm tokens |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| `src/components/admin/college-bulk-import.tsx` | 0 | 0 | 0 | 0 | 0 | 3/0 |
| `src/components/admin/college-dashboard-section-failure.tsx` | 0 | 0 | 0 | 0 | 0 | 1/0 |

#### `src/components/admin/college-bulk-import.tsx`

| Property/state | Legacy source/value | Current source/value | Proof status |
| --- | --- | --- | --- |
| Trigger controls | old-lms-shell-spec.md:4: primary/secondary controls 36px desktop, radius 9, teal/white primary | college-bulk-import.tsx:49 shared Button; 44px below 768px, 36px md+ | **Source mobile control dimensions match; hover not rendered** |
| CSV form select and textarea | legacy-styles/components___form.scss:117-143: rounded 10px, 14px/20px text, .2px tracking, teal focus | college-bulk-import.tsx:54,59 use shared Select/Textarea, preserve maxLength and aria-invalid | **Shared controls; exact textarea-specific legacy state not measured** |
| Success/count and failures | old-lms-pages.md:11: slim status strips, not nested cards | college-bulk-import.tsx:65 info and 66 error use shared Alert | **Shared pattern; warning colour and spacing not matched visually** |
| Results table | old-lms-pages.md:6,11: hairline row-separated table and status pills | college-bulk-import.tsx:75 shared DataTable, StatusBadge with CREATED/FAILED/SKIPPED tones; shared EmptyState | **Same component family, tablet table/card breakpoint mismatch open** |
| Confirmation and pending state | old-lms-pages.md:6: centralized modal; components___button.scss:49-51 disabled | college-bulk-import.tsx:85 uses shared ConfirmDialog with version-bound confirmation and loading | **No local modal; server action not replayed** |
| Responsive | legacy-styles/components___listing-page-header.scss:130-153: <=767px stack, 44px targets | college-bulk-import.tsx:49 Buttons 44px mobile; CSV form occupies whole width, flex wrap actions; shared DataTable mobile cards <=639px | **Source mobile button proof; shared table 640-767 breakpoint is open** |

#### `src/components/admin/college-dashboard-section-failure.tsx`

| Property/state | Legacy source/value | Current source/value | Proof status |
| --- | --- | --- | --- |
| Canvas status | old-lms-pages.md:6: one white canvas, no nested ordinary-content card | college-dashboard-section-failure.tsx:7 delegates title/description/action to shared ErrorState within one border-t row | **Source anatomy matches; exact typography unresolved** |
| Error fallback | old-lms-pages.md:11: in-canvas compact notice instead of fake empty content | college-dashboard-section-failure.tsx:7 role alert and original 'Could not load' message retained | **Shared error state; tone/spacing not rendered** |
| Retry action | old-lms-shell-spec.md:4: secondary control 36px desktop | college-dashboard-section-failure.tsx:9 link to /college, 44px phone target and 36px md+ | **Source breakpoint matches; link styling not exact legacy CTA** |
| Keyboard and accessibility | legacy-styles/components___form.scss:22-36: focus-visible keyboard outline | college-dashboard-section-failure.tsx:9 CSS focus-visible outline and ErrorState role alert | **Source keyboard affordance, no replay** |
| Responsive page | listing-page-header.scss:130-153: <=767px stacked, >=768px row | college-dashboard-section-failure.tsx shared single-column ErrorState; action wraps on mobile, link 44px below 768 | **Responsive source only, no browser comparison** |

**Strict status:** 0 newly checked. Shared DataTable's sm=640px switch vs legacy mobile 767px and typography discrepancy remain blocking; exact state-by-state visual and interaction comparisons and global zero grep are missing. The work queue boxes remain unchecked under Section H strict rule.

**Exact next file:** `src/components/admin/college-closing-quizzes-card.tsx`, then remaining unreviewed `src/components/admin/college-dashboard-cards.tsx` and College Admin work queue entries.


### Replacement chat-4 continued: College Admin dashboard, sign-in and Super Admin company controls (2026-10-19)

**Scope:** 8 complete fetched/edited component files. All own UI, keep original content/actions and limit mutations to shared controls, state treatment, and responsive layout. This is **source refactor evidence**, not browser pixel proof, TSX parse, automated test or exhaustive repo grep. The changed files were saved directly to the feature branch with `[chat-4]` messages. `src/components/ui/*` unchanged.

#### Per-file scoped grep and tag evidence

Expressions applied to the entire fetched blob for each file: `/<(button|select|input|textarea|table)\b/g`, `/#[a-f0-9]{3,8}\b/gi`, `/fixed inset-0|role=["']dialog["']/g`, `/<h1\b/g`; also compared opening and closing counts for shared `Button`, `Alert`, `EmptyState`, `ConfirmDialog`, `Select`, `Textarea`, `Input`, `DataTable`, `StatusBadge`, `section`, `div`, `label`, `form`, `li`, `ul`, `h2`, `h3`, `span` (self-closing elements exempt). These scoped results do **not** constitute `grep -rl ... src` coverage.

| Full file | Native forms/table | Hex | Hand-rolled overlay | Native h1 | Orphan closing families | md / sm / lg source prefixes |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| `src/components/admin/college-closing-quizzes-card.tsx` | 0 | 0 | 0 | 0 | 0 found | 1 / 0 / 0 |
| `src/components/admin/college-dashboard-cards.tsx` | 0 | 0 | 0 | 0 | 0 found | 1 / 0 / 1 |
| `src/components/admin/college-signin-method-form.tsx` | 0 | 0 | 0 | 0 | 0 found | 1 / 0 / 0 |
| `src/components/admin/super-admin-company-verification.tsx` | 0 | 0 | 0 | 0 | 0 found | 1 / 0 / 0 |
| `src/components/admin/super-admin-college-company-actions.tsx` | 0 | 0 | 0 | 0 | 0 found | 9 / 0 / 0 |
| `src/components/admin/tenant-directory-csv-control.tsx` | 0 | 0 | 0 | 0 | 0 found | 1 / 0 / 0 |
| `src/components/admin/tenant-restore-action.tsx` | 0 | 0 | 0 | 0 | 0 found | 1 / 0 / 0 |
| `src/components/admin/managed-college-subdomain.tsx` | 0 | 0 | 0 | 0 | 0 found | 3 / 0 / 0 |

#### College closing quizzes — `src/components/admin/college-closing-quizzes-card.tsx`

| Property / state | Legacy source and value | vNext source and value | Strict comparison |
| --- | --- | --- | --- |
| Summary and list separation | old-lms-pages.md:6,11: one white canvas, list hairline row separators | college-closing-quizzes-card.tsx:section border-t + ul divide-y, preserved quiz data | **Structural match; row metrics unmeasured** |
| Empty state | old-lms-pages.md:6: empty state inside canvas, no per-item card | college-closing-quizzes-card.tsx:shared EmptyState uses transparent surface, no nested canvas | **Shared pattern; missing legacy quiz-empty typography values** |
| Link hit target, focus and phone | listing-page-header.scss:130-153: <=767 stacked and 44px touch target; form.scss:22-36 keyboard outline | college-closing-quizzes-card.tsx:Link min-h-11 (44px), md:min-h-9 (36px), focus-visible 2px accent ring | **Mobile hit target match; exact link decoration not source-matched** |

Shared component references from inspected source: `src/components/admin/college-closing-quizzes-card.tsx:n/a` Button, `src/components/admin/college-closing-quizzes-card.tsx:n/a` Alert, `src/components/admin/college-closing-quizzes-card.tsx:n/a` confirmation, `src/components/admin/college-closing-quizzes-card.tsx:13` empty state. Legacy tab/header desktop 28px (listing-page-header.scss:52-58) versus vNext PageHeader 30px, and legacy <=767px responsive rules (lines 130-153) remain upstream checks.

#### College dashboard cards — `src/components/admin/college-dashboard-cards.tsx`

| Property / state | Legacy source and value | vNext source and value | Strict comparison |
| --- | --- | --- | --- |
| Canvas and discrete metrics | old-lms-pages.md:6,8-9: continuous canvas, summary tile allowed for independent metrics | college-dashboard-cards.tsx:StatTile variant college inside one section, no PageCanvas nesting | **Structure aligns; tile padding/colour legacy not fully measured** |
| Responsive grid | listing-page-header.scss:130-153: mobile cutoff 767px, vertical content | college-dashboard-cards.tsx:grid 1 col <768px, 2 col >=768px, 4 col >=1024px | **Source cutoff matches; old dashboard metric grid not captured** |
| Empty and loading state | old-lms-pages.md:6: empty content on same canvas | college-dashboard-cards.tsx:EmptyState for zero visible metrics, unknown counts shown em dash via StatTile | **Shared empty; loading delegated to page, exact metrics not proven** |

Shared component references from inspected source: `src/components/admin/college-dashboard-cards.tsx:n/a` Button, `src/components/admin/college-dashboard-cards.tsx:n/a` Alert, `src/components/admin/college-dashboard-cards.tsx:n/a` confirmation, `src/components/admin/college-dashboard-cards.tsx:20` empty state. Legacy tab/header desktop 28px (listing-page-header.scss:52-58) versus vNext PageHeader 30px, and legacy <=767px responsive rules (lines 130-153) remain upstream checks.

#### College sign-in methods — `src/components/admin/college-signin-method-form.tsx`

| Property / state | Legacy source and value | vNext source and value | Strict comparison |
| --- | --- | --- | --- |
| Shared selection controls | legacy-styles/components___form.scss:22-36: keyboard focus ring retained | college-signin-method-form.tsx:shared Radio + scoped label selected/hover/disabled classes; 4 choices | **Shared radio; selected background and border value table not fully legacy-grounded** |
| Authorization/disabled | legacy-styles/components___button.scss:49-51: disabled action state | college-signin-method-form.tsx:fieldset disabled on !ready/saving, shared Alert warning when backend unavailable | **Safe state retained; disabled background mismatch unresolved** |
| Save success/error/loading | old-lms-pages.md:11: slim inline notices; old-lms-shell-spec.md:22-24: 36px primary CTA desktop | college-signin-method-form.tsx:Alert tone success/error, Button loading & disabled, shared ConfirmDialog | **Central shared states; live response not replayed** |
| Mobile touch and responsive | listing-page-header.scss:130-153: 767px mobile break; 44px action target | college-signin-method-form.tsx:Button min-h-11 / md:min-h-9; radio choices 56px min-height and full-width | **44px matched; legacy radio-card mobile spacing not sourced** |

Shared component references from inspected source: `src/components/admin/college-signin-method-form.tsx:65` Button, `src/components/admin/college-signin-method-form.tsx:70` Alert, `src/components/admin/college-signin-method-form.tsx:69` confirmation, `src/components/admin/college-signin-method-form.tsx:n/a` empty state. Legacy tab/header desktop 28px (listing-page-header.scss:52-58) versus vNext PageHeader 30px, and legacy <=767px responsive rules (lines 130-153) remain upstream checks.

#### Global company verification — `src/components/admin/super-admin-company-verification.tsx`

| Property / state | Legacy source and value | vNext source and value | Strict comparison |
| --- | --- | --- | --- |
| Modal and focus | old-lms-pages.md:6: no hand-rolled overlays; form.scss:22-36 focus-visible | super-admin-company-verification.tsx:replaced conditional role=group controls with shared ConfirmDialog | **No local modal; shared UI dialog focus replayer not executed** |
| Pending/success/error states | old-lms-pages.md:11: statuses and local error copy | super-admin-company-verification.tsx:shared Button loading, Alert(error), opens only when requested and closes only on success | **Source transitions preserved; exact toast/alert appearance unverified** |
| Responsive button | old-lms-shell-spec.md:22-24: 36px desktop/9px radius; listing-page-header.scss:130-153 44px mobile | super-admin-company-verification.tsx:Button min-h-11 md:min-h-9 | **Matched declared touch size; live modal width unverified** |

Shared component references from inspected source: `src/components/admin/super-admin-company-verification.tsx:26` Button, `src/components/admin/super-admin-company-verification.tsx:35` Alert, `src/components/admin/super-admin-company-verification.tsx:30` confirmation, `src/components/admin/super-admin-company-verification.tsx:n/a` empty state. Legacy tab/header desktop 28px (listing-page-header.scss:52-58) versus vNext PageHeader 30px, and legacy <=767px responsive rules (lines 130-153) remain upstream checks.

#### College-company relationship actions — `src/components/admin/super-admin-college-company-actions.tsx`

| Property / state | Legacy source and value | vNext source and value | Strict comparison |
| --- | --- | --- | --- |
| Company creation form | form.scss:117-143: 14px/20px font, 10px input radius, focus shadow | super-admin-college-company-actions.tsx:shared Input for name/domain/website, mobile 1-col, >=768px two columns | **Shared field value family; full old company form layout not sourced** |
| Trust/archive confirm | old-lms-pages.md:6: common dialog, no hand-rolled confirmation | super-admin-college-company-actions.tsx:relationship confirmation now uses ConfirmDialog danger/primary with pending and disable guard | **Shared overlay; legacy destructive confirmation visuals unverified** |
| Errors and action states | old-lms-pages.md:11: slim errors, independent changes | super-admin-college-company-actions.tsx:Alert(error) in create and relationship flows; Button loading/pending/disabled | **Source semantics retained; actual error workflow unexecuted** |
| Responsive | listing-page-header.scss:130-153: mobile <768px stacked/actions 44px | super-admin-college-company-actions.tsx:md:grid-cols-2, flex-wrap actions, Button min-h-11 md:min-h-9 | **Source breakpoint matched; tablet modal not rendered** |

Shared component references from inspected source: `src/components/admin/super-admin-college-company-actions.tsx:30` Button, `src/components/admin/super-admin-college-company-actions.tsx:40` Alert, `src/components/admin/super-admin-college-company-actions.tsx:86` confirmation, `src/components/admin/super-admin-college-company-actions.tsx:n/a` empty state. Legacy tab/header desktop 28px (listing-page-header.scss:52-58) versus vNext PageHeader 30px, and legacy <=767px responsive rules (lines 130-153) remain upstream checks.

#### Filtered CSV export — `src/components/admin/tenant-directory-csv-control.tsx`

| Property / state | Legacy source and value | vNext source and value | Strict comparison |
| --- | --- | --- | --- |
| Control styling | old-lms-shell-spec.md:22-24: 36px outlined secondary button, radius 9px | tenant-directory-csv-control.tsx:shared secondary Button, 44px phone, 36px >=768px | **Token family matches; label width/wrap not measured** |
| Busy/error | old-lms-pages.md:11: compact status/error, no second canvas | tenant-directory-csv-control.tsx:Button loading/disabled and shared Alert(error) on failed download | **Shared states, server download not executed** |
| Responsive and keyboard | listing-page-header.scss:130-153: 44px mobile target, actions stack <=767px | tenant-directory-csv-control.tsx:md:min-h-9, content flex wraps, shared Button focus-visible outline | **Hit size source aligned; no viewport screenshots** |

Shared component references from inspected source: `src/components/admin/tenant-directory-csv-control.tsx:21` Button, `src/components/admin/tenant-directory-csv-control.tsx:23` Alert, `src/components/admin/tenant-directory-csv-control.tsx:n/a` confirmation, `src/components/admin/tenant-directory-csv-control.tsx:n/a` empty state. Legacy tab/header desktop 28px (listing-page-header.scss:52-58) versus vNext PageHeader 30px, and legacy <=767px responsive rules (lines 130-153) remain upstream checks.

#### Tenant restore action — `src/components/admin/tenant-restore-action.tsx`

| Property / state | Legacy source and value | vNext source and value | Strict comparison |
| --- | --- | --- | --- |
| Destructive/recovery confirmation | old-lms-pages.md:6: central overlays, no nested card; old-lms-shell-spec.md:22-24 secondary outlined | tenant-restore-action.tsx:shared secondary Button, ConfirmDialog, no homemade dialog | **Source component agreement; legacy restore dialog states unknown** |
| Pending / error / success | old-lms-pages.md:11: statuses must be user-visible | tenant-restore-action.tsx:shared guarded action, Button loading, Toast success/error; closes only upon save | **Source semantics preserved; no runtime test** |
| Responsive | listing-page-header.scss:130-153: 44px mobile target <=767px, 36px desktop | tenant-restore-action.tsx:Button min-h-11 md:min-h-9, inherited shared confirm buttons | **Trigger source values match; ConfirmDialog footer own shared mobile treatment** |

Shared component references from inspected source: `src/components/admin/tenant-restore-action.tsx:37` Button, `src/components/admin/tenant-restore-action.tsx:n/a` Alert, `src/components/admin/tenant-restore-action.tsx:39` confirmation, `src/components/admin/tenant-restore-action.tsx:n/a` empty state. Legacy tab/header desktop 28px (listing-page-header.scss:52-58) versus vNext PageHeader 30px, and legacy <=767px responsive rules (lines 130-153) remain upstream checks.

#### Managed subdomain — `src/components/admin/managed-college-subdomain.tsx`

| Property / state | Legacy source and value | vNext source and value | Strict comparison |
| --- | --- | --- | --- |
| Hostname control | form.scss:117-143: 14px text, 10px radius, focus halo; shell-spec.md:22-24 36px desktop CTA | managed-college-subdomain.tsx:shared Input min-h-11 md:min-h-9 and Button pair min-h-11 md:min-h-9 | **Input/CTA mobile target source match; full legacy domain picker unobserved** |
| Readiness/feedback | old-lms-pages.md:11: slim warnings and inline errors | managed-college-subdomain.tsx:Alert(warning) when deployment unready, Alert(error/success) for response and confirmation | **Shared statuses; exact warning pale-yellow value not proven** |
| Confirmation/disabled | old-lms-pages.md:6: shared modal only, focus-visible | managed-college-subdomain.tsx:shared ConfirmDialog, controls busy-disabled, pending action scoped to selected college | **Source safe; keyboard and browser state not rechecked** |
| Responsive | listing-page-header.scss:130-153: mobile vertical/44px controls | managed-college-subdomain.tsx:input and Buttons 44px through 767px; flex-wrap action row, max-w-md field | **Touch target source match; hostname field+suffix overflow not visually tested** |

Shared component references from inspected source: `src/components/admin/managed-college-subdomain.tsx:57` Button, `src/components/admin/managed-college-subdomain.tsx:44` Alert, `src/components/admin/managed-college-subdomain.tsx:65` confirmation, `src/components/admin/managed-college-subdomain.tsx:n/a` empty state. Legacy tab/header desktop 28px (listing-page-header.scss:52-58) versus vNext PageHeader 30px, and legacy <=767px responsive rules (lines 130-153) remain upstream checks.

**Strict tick result:** **0 newly ticked**. The 8 files were migrated and source-audited, but the required global grep, all-state visual/computed value equality, responsive screenshots and TypeScript parser evidence are not available under lane instructions. Source-only breakpoints are *not* proof of actual rendered phone/tablet UI. No unmatched opening/closing tag families were found in the scoped tag-count checks.

**Exact next file:** `src/components/college/college-admin-profile-editor.tsx` (then department insights and College Admin faculty/student workflows, work queue order).


### Replacement chat-4 College Admin academic, profile and faculty UI sweep — 2026-10-19

**Files source-refactored and pushed in this bounded batch:** `src/components/college/college-admin-profile-editor.tsx`; `src/components/college/college-department-insights.tsx`; `src/components/college/college-legacy-group-tabs.tsx`; `src/components/college/college-offering-lifecycle-action.tsx`; `src/components/college/college-offering-metadata-action.tsx`; `src/components/college/college-faculty-reassign-action.tsx`; `src/components/college/college-faculty-schedule-reassign.tsx`; `src/components/college/college-faculty-lifecycle-action.tsx`. Kept service calls, tenant scope, original page contents, routing and existing backend decisions. Only per-file components were edited; shared UI and global styles were not altered. No app execution, browser, TypeScript compiler or CI (lane restriction).

**Scope-limited grep:** fetched each entire updated TSX and applied `/<(button|input|select|textarea|table)\b/g`, `/#[a-f0-9]{3,8}\b/gi`, `/fixed inset-0|role=["']dialog["']/g`, `/<h1\b/g`; opening/closing tag families compared for UI/HTML components. Counts below apply to these eight files only, **not** the full repo.

| File | Raw controls | Hex | Custom overlays | Native h1 | Orphan close families | sm/md/lg prefixes |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| `src/components/college/college-admin-profile-editor.tsx` | 0 | 0 | 0 | 0 | none found | 0/8/0 |
| `src/components/college/college-department-insights.tsx` | 0 | 0 | 0 | 0 | none found | 0/6/0 |
| `src/components/college/college-legacy-group-tabs.tsx` | 0 | 0 | 0 | 0 | none found | 0/2/0 |
| `src/components/college/college-offering-lifecycle-action.tsx` | 0 | 0 | 0 | 0 | none found | 0/1/0 |
| `src/components/college/college-offering-metadata-action.tsx` | 0 | 0 | 0 | 0 | none found | 0/3/0 |
| `src/components/college/college-faculty-reassign-action.tsx` | 0 | 0 | 0 | 0 | none found | 0/3/0 |
| `src/components/college/college-faculty-schedule-reassign.tsx` | 0 | 0 | 0 | 0 | none found | 0/3/0 |
| `src/components/college/college-faculty-lifecycle-action.tsx` | 0 | 0 | 0 | 0 | none found | 0/2/0 |

#### `src/components/college/college-admin-profile-editor.tsx`

| Property and state | Legacy file/value | Current source/value | Strict result |
| --- | --- | --- | --- |
| Canvas | old-lms-pages.md:6: white canvas, 12px radius, 1px #e5e9f0 border, 24px padding, no inner page canvas | Shared Input/Textarea and primary Button; original profile fields and section anchor links retained. | **Shared anatomy only; data dependent** |
| Default/button | old-lms-shell-spec.md:22-24: 36px height, 9px radius, 14px/650 weight primary teal #0a7c88 white text; secondary white/border | Shared ui/button.tsx:10-29 plus college-admin-profile-editor.tsx:122; Shared Input/Textarea and primary Button; original profile fields and section anchor links retained. | **Token match for shared variant; not every content-specific state** |
| Field/tab geometry | legacy-styles/components___form.scss:117-143: input radius 10px, 14px/20px, letter spacing .2px, focus 2px teal halo; listing-page-header.scss:26-58 tabs/head separate | Shared ui/input.tsx:13-44, ui/select.tsx and ui/tabs.tsx where used; Shared Input/Textarea and primary Button; original profile fields and section anchor links retained. | **Only existing controls; absent elements N/A** |
| Hover/active/focus | legacy-styles/components___button.scss:13-24: 150ms transitions, hover/focus colour; form.scss:22-36 keyboard-visible focus retained | ui/button.tsx:10-29 and UI per-category classes; Shared Alert error/success; Button loading/disabled on mutation. Placeholder/readonly login contacts preserved. | **Interactive computed values not rendered** |
| Disabled/loading | legacy-styles/components___button.scss:49-51: disabled CTA; old-lms-shell-spec.md:22-24 36px desktop | Shared disabled/loading semantics; Shared Alert error/success; Button loading/disabled on mutation. Placeholder/readonly login contacts preserved. | **Pending disabled behaviour source-reviewed; exact legacy palette unresolved** |
| Error/success/empty | old-lms-pages.md:6,11: inside canvas, error/empty without hand-rolled nested cards | Shared Alert/EmptyState where applicable; Shared Alert error/success; Button loading/disabled on mutation. Placeholder/readonly login contacts preserved. | **State shape moved to shared UI; legacy special copy/sizes unmeasured** |
| Responsive phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: max 767px stacked, >=768px row; 44px phone hit target | form md:grid-cols-2 at 768px; one column below; internal anchor navigation horizontal overflow below 768px; 44px touch targets. | **Source breakpoint comparison only, browser proof open** |

**Blocking item-specific discrepancy:** Profile anchor pill 8px legacy SCSS provenance missing; image avatar unchanged. No keyboard/viewport replay. No screenshots, keyboard simulation, compiled TSX parse or side-by-side computed style comparison performed. A strict checkbox is therefore left open.

#### `src/components/college/college-department-insights.tsx`

| Property and state | Legacy file/value | Current source/value | Strict result |
| --- | --- | --- | --- |
| Canvas | old-lms-pages.md:6: white canvas, 12px radius, 1px #e5e9f0 border, 24px padding, no inner page canvas | PageHeader inside inherited single canvas, native policy box replaced with Alert; shared DataTable and EmptyState. | **Shared anatomy only; data dependent** |
| Default/button | old-lms-shell-spec.md:22-24: 36px height, 9px radius, 14px/650 weight primary teal #0a7c88 white text; secondary white/border | Shared ui/button.tsx:10-29 plus college-department-insights.tsx:84; PageHeader inside inherited single canvas, native policy box replaced with Alert; shared DataTable and EmptyState. | **Token match for shared variant; not every content-specific state** |
| Field/tab geometry | legacy-styles/components___form.scss:117-143: input radius 10px, 14px/20px, letter spacing .2px, focus 2px teal halo; listing-page-header.scss:26-58 tabs/head separate | Shared ui/input.tsx:13-44, ui/select.tsx and ui/tabs.tsx where used; PageHeader inside inherited single canvas, native policy box replaced with Alert; shared DataTable and EmptyState. | **Only existing controls; absent elements N/A** |
| Hover/active/focus | legacy-styles/components___button.scss:13-24: 150ms transitions, hover/focus colour; form.scss:22-36 keyboard-visible focus retained | ui/button.tsx:10-29 and UI per-category classes; Attendance filter and pagination links preserve authorized paths; data service and copy unchanged. | **Interactive computed values not rendered** |
| Disabled/loading | legacy-styles/components___button.scss:49-51: disabled CTA; old-lms-shell-spec.md:22-24 36px desktop | Shared disabled/loading semantics; Attendance filter and pagination links preserve authorized paths; data service and copy unchanged. | **Pending disabled behaviour source-reviewed; exact legacy palette unresolved** |
| Error/success/empty | old-lms-pages.md:6,11: inside canvas, error/empty without hand-rolled nested cards | Shared Alert/EmptyState where applicable; Attendance filter and pagination links preserve authorized paths; data service and copy unchanged. | **State shape moved to shared UI; legacy special copy/sizes unmeasured** |
| Responsive phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: max 767px stacked, >=768px row; 44px phone hit target | PageHeader md breakpoint; filter wrap; link targets 44px below 768px and 36px above. | **Source breakpoint comparison only, browser proof open** |

**Blocking item-specific discrepancy:** DataTable switches to mobile card at 640px (shared owner), different from 767px legacy cutoff; strict match open. No screenshots, keyboard simulation, compiled TSX parse or side-by-side computed style comparison performed. A strict checkbox is therefore left open.

#### `src/components/college/college-legacy-group-tabs.tsx`

| Property and state | Legacy file/value | Current source/value | Strict result |
| --- | --- | --- | --- |
| Canvas | old-lms-pages.md:6: white canvas, 12px radius, 1px #e5e9f0 border, 24px padding, no inner page canvas | Uses shared Tabs navigation and StepIndicator; no page-owned tabstrip or nested card. | **Shared anatomy only; data dependent** |
| Default/button | old-lms-shell-spec.md:22-24: 36px height, 9px radius, 14px/650 weight primary teal #0a7c88 white text; secondary white/border | Shared ui/button.tsx:10-29 plus college-legacy-group-tabs.tsx:n/a; Uses shared Tabs navigation and StepIndicator; no page-owned tabstrip or nested card. | **Token match for shared variant; not every content-specific state** |
| Field/tab geometry | legacy-styles/components___form.scss:117-143: input radius 10px, 14px/20px, letter spacing .2px, focus 2px teal halo; listing-page-header.scss:26-58 tabs/head separate | Shared ui/input.tsx:13-44, ui/select.tsx and ui/tabs.tsx where used; Uses shared Tabs navigation and StepIndicator; no page-owned tabstrip or nested card. | **Only existing controls; absent elements N/A** |
| Hover/active/focus | legacy-styles/components___button.scss:13-24: 150ms transitions, hover/focus colour; form.scss:22-36 keyboard-visible focus retained | ui/button.tsx:10-29 and UI per-category classes; Active tab derives from route selected value, links remain keyboard-operable and server-navigation-owned. | **Interactive computed values not rendered** |
| Disabled/loading | legacy-styles/components___button.scss:49-51: disabled CTA; old-lms-shell-spec.md:22-24 36px desktop | Shared disabled/loading semantics; Active tab derives from route selected value, links remain keyboard-operable and server-navigation-owned. | **Pending disabled behaviour source-reviewed; exact legacy palette unresolved** |
| Error/success/empty | old-lms-pages.md:6,11: inside canvas, error/empty without hand-rolled nested cards | Shared Alert/EmptyState where applicable; Active tab derives from route selected value, links remain keyboard-operable and server-navigation-owned. | **State shape moved to shared UI; legacy special copy/sizes unmeasured** |
| Responsive phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: max 767px stacked, >=768px row; 44px phone hit target | Shared Tabs scroll cues; previous/next anchor links 44px below 768px and 36px above. | **Source breakpoint comparison only, browser proof open** |

**Blocking item-specific discrepancy:** Shared tab hover/active underline exact legacy values and tablet overflow not measured. No screenshots, keyboard simulation, compiled TSX parse or side-by-side computed style comparison performed. A strict checkbox is therefore left open.

#### `src/components/college/college-offering-lifecycle-action.tsx`

| Property and state | Legacy file/value | Current source/value | Strict result |
| --- | --- | --- | --- |
| Canvas | old-lms-pages.md:6: white canvas, 12px radius, 1px #e5e9f0 border, 24px padding, no inner page canvas | Shared secondary Button and existing useCollegeConfirmation; no inline custom control skin. | **Shared anatomy only; data dependent** |
| Default/button | old-lms-shell-spec.md:22-24: 36px height, 9px radius, 14px/650 weight primary teal #0a7c88 white text; secondary white/border | Shared ui/button.tsx:10-29 plus college-offering-lifecycle-action.tsx:29; Shared secondary Button and existing useCollegeConfirmation; no inline custom control skin. | **Token match for shared variant; not every content-specific state** |
| Field/tab geometry | legacy-styles/components___form.scss:117-143: input radius 10px, 14px/20px, letter spacing .2px, focus 2px teal halo; listing-page-header.scss:26-58 tabs/head separate | Shared ui/input.tsx:13-44, ui/select.tsx and ui/tabs.tsx where used; Shared secondary Button and existing useCollegeConfirmation; no inline custom control skin. | **Only existing controls; absent elements N/A** |
| Hover/active/focus | legacy-styles/components___button.scss:13-24: 150ms transitions, hover/focus colour; form.scss:22-36 keyboard-visible focus retained | ui/button.tsx:10-29 and UI per-category classes; Busy => shared loading/disabled, errors => shared Alert(error), server archive/restore checks intact. | **Interactive computed values not rendered** |
| Disabled/loading | legacy-styles/components___button.scss:49-51: disabled CTA; old-lms-shell-spec.md:22-24 36px desktop | Shared disabled/loading semantics; Busy => shared loading/disabled, errors => shared Alert(error), server archive/restore checks intact. | **Pending disabled behaviour source-reviewed; exact legacy palette unresolved** |
| Error/success/empty | old-lms-pages.md:6,11: inside canvas, error/empty without hand-rolled nested cards | Shared Alert/EmptyState where applicable; Busy => shared loading/disabled, errors => shared Alert(error), server archive/restore checks intact. | **State shape moved to shared UI; legacy special copy/sizes unmeasured** |
| Responsive phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: max 767px stacked, >=768px row; 44px phone hit target | One bounded control with min-h-11 below 768px, min-h-9 from 768px. | **Source breakpoint comparison only, browser proof open** |

**Blocking item-specific discrepancy:** Confirmation is hook-owned; modal and disabled tone computed CSS unverified. No screenshots, keyboard simulation, compiled TSX parse or side-by-side computed style comparison performed. A strict checkbox is therefore left open.

#### `src/components/college/college-offering-metadata-action.tsx`

| Property and state | Legacy file/value | Current source/value | Strict result |
| --- | --- | --- | --- |
| Canvas | old-lms-pages.md:6: white canvas, 12px radius, 1px #e5e9f0 border, 24px padding, no inner page canvas | Shared Dialog title (duplicate internal h2 removed), Select, Input and Button tokens, content preserved. | **Shared anatomy only; data dependent** |
| Default/button | old-lms-shell-spec.md:22-24: 36px height, 9px radius, 14px/650 weight primary teal #0a7c88 white text; secondary white/border | Shared ui/button.tsx:10-29 plus college-offering-metadata-action.tsx:40; Shared Dialog title (duplicate internal h2 removed), Select, Input and Button tokens, content preserved. | **Token match for shared variant; not every content-specific state** |
| Field/tab geometry | legacy-styles/components___form.scss:117-143: input radius 10px, 14px/20px, letter spacing .2px, focus 2px teal halo; listing-page-header.scss:26-58 tabs/head separate | Shared ui/input.tsx:13-44, ui/select.tsx and ui/tabs.tsx where used; Shared Dialog title (duplicate internal h2 removed), Select, Input and Button tokens, content preserved. | **Only existing controls; absent elements N/A** |
| Hover/active/focus | legacy-styles/components___button.scss:13-24: 150ms transitions, hover/focus colour; form.scss:22-36 keyboard-visible focus retained | ui/button.tsx:10-29 and UI per-category classes; Disabled edit controls during pending; shared Button loading; both open/closed error Alert(error). | **Interactive computed values not rendered** |
| Disabled/loading | legacy-styles/components___button.scss:49-51: disabled CTA; old-lms-shell-spec.md:22-24 36px desktop | Shared disabled/loading semantics; Disabled edit controls during pending; shared Button loading; both open/closed error Alert(error). | **Pending disabled behaviour source-reviewed; exact legacy palette unresolved** |
| Error/success/empty | old-lms-pages.md:6,11: inside canvas, error/empty without hand-rolled nested cards | Shared Alert/EmptyState where applicable; Disabled edit controls during pending; shared Button loading; both open/closed error Alert(error). | **State shape moved to shared UI; legacy special copy/sizes unmeasured** |
| Responsive phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: max 767px stacked, >=768px row; 44px phone hit target | Controls min-width 0; action row flex-wrap; Button touch min-height 44/36 at 767/768. | **Source breakpoint comparison only, browser proof open** |

**Blocking item-specific discrepancy:** Dialog sizing, focus/hover, number spinner and error border not verified in a browser. No screenshots, keyboard simulation, compiled TSX parse or side-by-side computed style comparison performed. A strict checkbox is therefore left open.

#### `src/components/college/college-faculty-reassign-action.tsx`

| Property and state | Legacy file/value | Current source/value | Strict result |
| --- | --- | --- | --- |
| Canvas | old-lms-pages.md:6: white canvas, 12px radius, 1px #e5e9f0 border, 24px padding, no inner page canvas | Shared Dialog title now includes role, Select and Button; duplicate dialog h2 removed. | **Shared anatomy only; data dependent** |
| Default/button | old-lms-shell-spec.md:22-24: 36px height, 9px radius, 14px/650 weight primary teal #0a7c88 white text; secondary white/border | Shared ui/button.tsx:10-29 plus college-faculty-reassign-action.tsx:40; Shared Dialog title now includes role, Select and Button; duplicate dialog h2 removed. | **Token match for shared variant; not every content-specific state** |
| Field/tab geometry | legacy-styles/components___form.scss:117-143: input radius 10px, 14px/20px, letter spacing .2px, focus 2px teal halo; listing-page-header.scss:26-58 tabs/head separate | Shared ui/input.tsx:13-44, ui/select.tsx and ui/tabs.tsx where used; Shared Dialog title now includes role, Select and Button; duplicate dialog h2 removed. | **Only existing controls; absent elements N/A** |
| Hover/active/focus | legacy-styles/components___button.scss:13-24: 150ms transitions, hover/focus colour; form.scss:22-36 keyboard-visible focus retained | ui/button.tsx:10-29 and UI per-category classes; Alert(info) previews scope, Alert(error) for in/out dialog failures, select disabled while pending, save loading. | **Interactive computed values not rendered** |
| Disabled/loading | legacy-styles/components___button.scss:49-51: disabled CTA; old-lms-shell-spec.md:22-24 36px desktop | Shared disabled/loading semantics; Alert(info) previews scope, Alert(error) for in/out dialog failures, select disabled while pending, save loading. | **Pending disabled behaviour source-reviewed; exact legacy palette unresolved** |
| Error/success/empty | old-lms-pages.md:6,11: inside canvas, error/empty without hand-rolled nested cards | Shared Alert/EmptyState where applicable; Alert(info) previews scope, Alert(error) for in/out dialog failures, select disabled while pending, save loading. | **State shape moved to shared UI; legacy special copy/sizes unmeasured** |
| Responsive phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: max 767px stacked, >=768px row; 44px phone hit target | Single-column dialog and flex-wrap footer; actions min-height 44px on phone, 36px >=768px. | **Source breakpoint comparison only, browser proof open** |

**Blocking item-specific discrepancy:** Reassignment policy decision/version token retained; keyboard modal flows and exact legacy modal sizing unverified. No screenshots, keyboard simulation, compiled TSX parse or side-by-side computed style comparison performed. A strict checkbox is therefore left open.

#### `src/components/college/college-faculty-schedule-reassign.tsx`

| Property and state | Legacy file/value | Current source/value | Strict result |
| --- | --- | --- | --- |
| Canvas | old-lms-pages.md:6: white canvas, 12px radius, 1px #e5e9f0 border, 24px padding, no inner page canvas | Shared Dialog title, Select, Buttons; native duplicate modal heading removed. | **Shared anatomy only; data dependent** |
| Default/button | old-lms-shell-spec.md:22-24: 36px height, 9px radius, 14px/650 weight primary teal #0a7c88 white text; secondary white/border | Shared ui/button.tsx:10-29 plus college-faculty-schedule-reassign.tsx:45; Shared Dialog title, Select, Buttons; native duplicate modal heading removed. | **Token match for shared variant; not every content-specific state** |
| Field/tab geometry | legacy-styles/components___form.scss:117-143: input radius 10px, 14px/20px, letter spacing .2px, focus 2px teal halo; listing-page-header.scss:26-58 tabs/head separate | Shared ui/input.tsx:13-44, ui/select.tsx and ui/tabs.tsx where used; Shared Dialog title, Select, Buttons; native duplicate modal heading removed. | **Only existing controls; absent elements N/A** |
| Hover/active/focus | legacy-styles/components___button.scss:13-24: 150ms transitions, hover/focus colour; form.scss:22-36 keyboard-visible focus retained | ui/button.tsx:10-29 and UI per-category classes; Errors => Alert(error), completion counts => Alert(success); disabled selection/close while busy retained. | **Interactive computed values not rendered** |
| Disabled/loading | legacy-styles/components___button.scss:49-51: disabled CTA; old-lms-shell-spec.md:22-24 36px desktop | Shared disabled/loading semantics; Errors => Alert(error), completion counts => Alert(success); disabled selection/close while busy retained. | **Pending disabled behaviour source-reviewed; exact legacy palette unresolved** |
| Error/success/empty | old-lms-pages.md:6,11: inside canvas, error/empty without hand-rolled nested cards | Shared Alert/EmptyState where applicable; Errors => Alert(error), completion counts => Alert(success); disabled selection/close while busy retained. | **State shape moved to shared UI; legacy special copy/sizes unmeasured** |
| Responsive phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: max 767px stacked, >=768px row; 44px phone hit target | Modal and action rows wrap; action min-height 44 below 768px /36 above; no mobile custom CSS. | **Source breakpoint comparison only, browser proof open** |

**Blocking item-specific discrepancy:** Bulk row list and modal scrolling not browser-tested; response mapping and race controls not changed. No screenshots, keyboard simulation, compiled TSX parse or side-by-side computed style comparison performed. A strict checkbox is therefore left open.

#### `src/components/college/college-faculty-lifecycle-action.tsx`

| Property and state | Legacy file/value | Current source/value | Strict result |
| --- | --- | --- | --- |
| Canvas | old-lms-pages.md:6: white canvas, 12px radius, 1px #e5e9f0 border, 24px padding, no inner page canvas | Hand-built inline confirmation converted to shared ConfirmDialog with reason Input; audit-history Link remains. | **Shared anatomy only; data dependent** |
| Default/button | old-lms-shell-spec.md:22-24: 36px height, 9px radius, 14px/650 weight primary teal #0a7c88 white text; secondary white/border | Shared ui/button.tsx:10-29 plus college-faculty-lifecycle-action.tsx:61; Hand-built inline confirmation converted to shared ConfirmDialog with reason Input; audit-history Link remains. | **Token match for shared variant; not every content-specific state** |
| Field/tab geometry | legacy-styles/components___form.scss:117-143: input radius 10px, 14px/20px, letter spacing .2px, focus 2px teal halo; listing-page-header.scss:26-58 tabs/head separate | Shared ui/input.tsx:13-44, ui/select.tsx and ui/tabs.tsx where used; Hand-built inline confirmation converted to shared ConfirmDialog with reason Input; audit-history Link remains. | **Only existing controls; absent elements N/A** |
| Hover/active/focus | legacy-styles/components___button.scss:13-24: 150ms transitions, hover/focus colour; form.scss:22-36 keyboard-visible focus retained | ui/button.tsx:10-29 and UI per-category classes; Validation >=3 chars; shared danger/primary confirmation; Alert(error/success); loading/disabled guards preserved. | **Interactive computed values not rendered** |
| Disabled/loading | legacy-styles/components___button.scss:49-51: disabled CTA; old-lms-shell-spec.md:22-24 36px desktop | Shared disabled/loading semantics; Validation >=3 chars; shared danger/primary confirmation; Alert(error/success); loading/disabled guards preserved. | **Pending disabled behaviour source-reviewed; exact legacy palette unresolved** |
| Error/success/empty | old-lms-pages.md:6,11: inside canvas, error/empty without hand-rolled nested cards | Shared Alert/EmptyState where applicable; Validation >=3 chars; shared danger/primary confirmation; Alert(error/success); loading/disabled guards preserved. | **State shape moved to shared UI; legacy special copy/sizes unmeasured** |
| Responsive phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: max 767px stacked, >=768px row; 44px phone hit target | Trigger and history action min-height 44px below 768px, 36px above; modal follows shared Dialog layout. | **Source breakpoint comparison only, browser proof open** |

**Blocking item-specific discrepancy:** Different surface from previous inline confirmation; exact legacy policy modal unspecified, requires interaction review. No screenshots, keyboard simulation, compiled TSX parse or side-by-side computed style comparison performed. A strict checkbox is therefore left open.

**Strict tick count:** 0 in this set. Full-scope zero-grep, complete every-state visual values, recorded phone+tablet screenshots and typecheck not available; the shared `PageHeader` typography and `DataTable` 640/767 switch are known upstream discrepancies. The source scans are proof of changes, not proof of full pixel parity.

**Exact next file:** `src/components/college/college-faculty-assignment-actions.tsx`, then `college-faculty-csv-import.tsx`, `college-person-*`, and the remaining unticked College Admin queue.


### Replacement chat-4 College Admin CSV/history/lifecycle/person-audit source batch — 2026-10-19

**Source-refactored this turn:** four full files. Existing CSV parsing limits, partial results and imports, person audit record scope, lifecycle permission checks, optimistic versions, and error text were retained. Shared UI imports are used; no edits to shared UI, globals or auth. No application/code execution, CI, TSX typecheck, browser, or screenshots.

**Scoped regex proof (full GitHub blob text, per file):** `/<(button|select|input|textarea|table)\b/g`, `/#[a-f0-9]{3,8}\b/gi`, `/fixed inset-0|role=["']dialog["']/g`, `/<h1\b/g`. Paired closing-tag scan includes Button, Input, Textarea, Alert, EmptyState, Skeleton, DataTable, Dialog, ConfirmDialog, section, div, label, form, h2, h3, nav, ol, li. Counts **do not** represent a whole-repo grep; parser validation was not run.

| File | Native controls | Hex colours | Hand overlay | Native h1 | Closing tag orphan families | md/sm prefixes |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| `src/components/college/college-faculty-csv-import.tsx` | 0 | 0 | 0 | 0 | none found | 5/0 |
| `src/components/college/college-student-import-history.tsx` | 0 | 0 | 0 | 0 | none found | 4/0 |
| `src/components/college/college-student-lifecycle-action.tsx` | 0 | 0 | 0 | 0 | none found | 1/0 |
| `src/components/college/college-person-audit-modal.tsx` | 0 | 0 | 0 | 0 | none found | 2/0 |

#### `src/components/college/college-faculty-csv-import.tsx`

| Property/state | Legacy value and file | vNext component/value | Result |
| --- | --- | --- | --- |
| CSV upload/textarea | legacy-styles/components___form.scss:117-143: 10px field radius, 14px/20px text, 2px teal focus shadow | Shared FileUpload and Textarea with existing maxBytes 1 MB, max 500 faculty rows; shared field token chrome | **Exact CSV picker style/disabled hover legacy source missing** |
| Validation, errors and empty | old-lms-pages.md:6,11: inline warning/error strip, no nested canvas | Shared Alert(info/error) for summary, structural and network failures; shared EmptyState for DataTable zero rows | **Legacy faculty import-specific notices not measured** |
| Pending and primary action | old-lms-shell-spec.md:22-24: 36px/9px primary, 14px font/650, white on teal | Shared Button loading/disabled with 44px mobile, 36px md+; data integrity draft-version guard retained | **Source token alignment; hover/focus live state unknown** |
| Responsive and exports | legacy-styles/components___listing-page-header.scss:130-153: mobile <=767px, 44px targets | CSV template / row report action anchors min-h-11 md:min-h-9, form blocks naturally stack, DataTable has its own mobile mode | **DataTable switches at 640px rather than 767px; strict tablet parity open** |


#### `src/components/college/college-student-import-history.tsx`

| Property/state | Legacy value and file | vNext component/value | Result |
| --- | --- | --- | --- |
| Modal geometry and table | old-lms-pages.md:6,11: central dialog, hairline table, no nested heading | Shared Dialog owns title and accessible close; DataTable owns rows; duplicate modal title removed | **Modal max-height/scroll and exact old table metrics unknown** |
| Loading/error/empty | old-lms-pages.md:6,11: no empty state masquerading as loading | Shared Skeleton(row) during pending, Alert(error) on failure, EmptyState only after successful empty read | **Source state separation matches intent; still no browser proof** |
| Previous/next and disabled | old-lms-shell-spec.md:22-24: secondary white/hairline 36px desktop; button.scss:49-51 disabled | Shared Button, 44px below 768, 36px >=768, current page guards preserved | **Shared disabled hover CSS not visually measured** |
| Responsive | legacy-styles/components___listing-page-header.scss:130-153: phone <=767px uses single-column actions | Dialog shared viewport sizing and wrapping navigation; DataTable mobile cards <=639px, rows above | **Known responsive cutoff mismatch for DataTable, open** |


#### `src/components/college/college-student-lifecycle-action.tsx`

| Property/state | Legacy value and file | vNext component/value | Result |
| --- | --- | --- | --- |
| Confirmation | old-lms-pages.md:6: common modal rather than hand-rolled card | Inline confirmation replaced by shared ConfirmDialog; original reason field and server mutation unchanged | **UI surface changed from inline to modal; exact old student confirm unspecified** |
| Input validation and disabled | form.scss:117-143: field radius 10px and 2px focus; button.scss:49-51 disabled | Shared Input maxLength 500 and pending disable; shared ConfirmDialog blocks until reason >=3 chars | **Source validation preserved; browser focus sequence untested** |
| Error and success | old-lms-pages.md:11: slim error notice | Shared Alert(error) inside/outside dialog; closes on successful server confirmation and refreshes | **Error appearance source only** |
| Responsive buttons | legacy-styles/components___listing-page-header.scss:130-153: 44px phone targets through 767px | Trigger Button min-h-11 md:min-h-9, ConfirmDialog delegates footer to shared UI | **Touch target matches; modal phone rendering unverified** |


#### `src/components/college/college-person-audit-modal.tsx`

| Property/state | Legacy value and file | vNext component/value | Result |
| --- | --- | --- | --- |
| Audit data rows | old-lms-pages.md:6,11: hairline divider rows rather than card per ordinary record | Audit ol now divide-y; original kind, actor, IST timestamp and 100-row cap retained | **Row separator anatomy matches; row exact padding/hover unknown** |
| Central dialog | old-lms-pages.md:6: no hand-rolled modal | Uses shared Dialog; duplicated h2 removed; shared Button close | **Shared overlay; native WebView/keyboard no runtime test** |
| Loading, empty, error | old-lms-pages.md:6,11: state feedback within the same canvas | Shared Skeleton(row x3), EmptyState when no events, Alert(error) on read failure, Alert(info) for truncation | **Shared state shape, legacy toast/empty metrics unknown** |
| Responsive | listing-page-header.scss:130-153: phone <=767px; 44px targets | Trigger/close Buttons min-h-11 md:min-h-9; Dialog adapts to available viewport height | **Phone/tablet computed render not captured** |

**Strict ticks:** 0 of these four, and 0 total in the queue. Complete route ownership grep, every-state exact pixel/property matches, live tablet/phone focus and modal interactions, and TSX parse are still outstanding. Corrected shared Skeleton variant to documented `row`, preserving type compatibility at source level. All input and dialog source changes were read back after writing.

**Next exact file:** `src/components/college/college-faculty-assignment-actions.tsx` (then Student CSV import, Student register form, faculty teaching workflows).

### Replacement chat-4 Faculty Assignment Create/End source audit — 2026-10-19

**Full-file grep and tag scan:** `/<(button|input|select|textarea|table)\b/g` => 0; `/#[a-f0-9]{3,8}\b/gi` => 0; `/<h1\b/g` => 0; `/fixed inset-0|role=["']dialog["']/g` => 0. Shared `<Select>` opening/closing: 7/7; `<Alert>` 6/6; `<div>` 3/3. This is a scoped full-file readback, not a runtime parser or global grep.

| Property/state | Legacy value and file | vNext value and source | Strict result |
| --- | --- | --- | --- |
| Form controls | legacy-styles/components___form.scss:117-143: input/select radius 10px, 14px/20px, 0.2px letter-spacing; :focus-visible ring 2px teal | college-faculty-assignment-actions.tsx:102 shared Select seven selectors, Checkbox for course selection | **Shared components; exact form label/box grid measured legacy values lacking** |
| Page canvas / hierarchy | old-lms-pages.md:6: one white canvas, sections separated by thin borders, no nested page canvas | Component section border-t; title h2 subordinate to parent page title; no extra PageCanvas | **Anatomy matches; actual padding/heading 28/30 typography upstream** |
| Course choices empty | old-lms-pages.md:6,11: empty copy on same canvas | college-faculty-assignment-actions.tsx:154 uses shared EmptyState in scrollable choice fieldset, original copy unchanged | **Shared empty state; unknown exact legacy empty state padding** |
| Validation, partial outcome, and truncation | old-lms-pages.md:11: status/warning/error banners inline, not handmade panels | college-faculty-assignment-actions.tsx:169 warning truncation, Alert(error) for failed assign and Alert(success) for partially completed result | **Shared status treatment; strict warning red/yellow values unverified** |
| Destructive end confirmation | old-lms-pages.md:6: central modal, no hand-rolled inline overlay | college-faculty-assignment-actions.tsx:212 shared ConfirmDialog, danger variant, pending guard, server DELETE unchanged | **Shared overlay; old exact confirm footer/focus unknown** |
| CTA default/hover/focus/disabled/loading | old-lms-shell-spec.md:22-24: 36px/9px/14px/650 teal-white primary, secondary white hairline; components___button.scss:13-24 hover transition 150ms, disabled line 49-51 | college-faculty-assignment-actions.tsx:164 and ui/button.tsx:10-29 shared variants with loading and disabled | **Token source match; legacy hover/active/danger state pixel comparison incomplete** |
| Responsive phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: stacked mobile through 767px, interactive 44px touch; >=768px row | college-faculty-assignment-actions.tsx:100: one-column <768, 2 columns >=768, 4 >=1024, actions min-h-11 md:min-h-9 | **Source breakpoint matches; tablet live layout and table-card switch not validated** |

**Strict box remains unchecked.** Raw controls/hex/inline modal patterns are absent locally, but complete legacy field-by-field visual values for all states, old LMS per-dialog details, repo-wide zero grep, actual phone/tablet browser comparison, TypeScript typecheck and accessibility interaction replay are not available. Under Section H's rule these gaps must remain open; do not infer certification from source-only work.

**Exact next file:** `src/components/college/college-student-csv-import.tsx`, then `src/components/college/college-student-register-form.tsx`, followed by other Student/Faculty/People queue entries.


### Replacement chat-4 student imports, profile/dialogs and role directory — 2026-10-20

**Scope:** six complete modified files fetched and scanned after commits. No shared UI or global skin edits, app execution, CI, TypeScript compile, Playwright, screenshot or interaction replay. Source proof only; source-specific values that cannot be established from legacy SCSS remain open.

**Grep proof per fetched TSX:** `/<(button|select|input|textarea|table)\b/g`, `/#[a-f0-9]{3,8}\b/gi`, `/fixed inset-0|role=["']dialog["']/g`, `/<h1\b/g`. Compared opening/closing tag families for shared elements, native form/page tags and dialog sections. No orphan closing families found. This is not a repository-wide `grep -rl` result.

| Full file | Raw controls | Hex literals | Custom overlays | Native h1 | md / sm responsive tokens |
| --- | ---: | ---: | ---: | ---: | --- |
| `src/components/college/college-student-csv-import.tsx` | 0 | 0 | 0 | 0 | 10 / 0 |
| `src/components/college/college-student-register-form.tsx` | 0 | 0 | 0 | 0 | 6 / 0 |
| `src/components/college/student-class-move-action.tsx` | 0 | 0 | 0 | 0 | 3 / 0 |
| `src/components/college/college-person-edit-action.tsx` | 0 | 0 | 0 | 0 | 10 / 0 |
| `src/components/college/college-person-profile-overview-modal.tsx` | 0 | 0 | 0 | 0 | 5 / 0 |
| `src/components/college/college-role-directory-workspace.tsx` | 0 | 0 | 0 | 0 | 14 / 0 |

#### `src/components/college/college-student-csv-import.tsx`

| Property/state | Legacy source/value | VNext source/value | Verification |
| --- | --- | --- | --- |
| Canvas and section | old-lms-shell-spec.md:18-20: one white canvas #fff, 1px #e5e9f0 border, radius 12px, padding 24px | No nested PageCanvas in file; shared page layout inherited from authenticated shell | **Source matches structure; exact per-route padding remains unmeasured** |
| Buttons and focus | old-lms-shell-spec.md:22-24: 36px, radius 9px, 14px/650, teal #0a7c88/white; legacy-styles/components___form.scss:117-143: focus shadow and 10px field radius | Shared Button/Input/Select variants if applicable; Three shared Select controls, FileUpload, Textarea; preserve 500-row/1MB limits | **Source token family; button active/focus state side-by-side unverified** |
| Status/errors/empty | old-lms-pages.md:6,11: status strip and hairline rows, no handmade extra canvas | Alert info/error, StatusBadge and EmptyState; preview remains dry run | **Shared family; precise old state metrics not available** |
| Responsive phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked, 44px phone hit target | Three metadata fields stack through 767px; md:grid-cols-3 thereafter; 44px phone targets | **Breakpoint source proof, not rendered viewport evidence** |
| Input/select/textarea | old-lms-pages.md:6-11, shell-spec.md:18-24, legacy form/button SCSS | Three shared Select controls, FileUpload, Textarea; preserve 500-row/1MB limits | **Source reviewed; exact legacy state values pending** |
| Validation/invalid | old-lms-pages.md:6-11, shell-spec.md:18-24, legacy form/button SCSS | Alert info/error, StatusBadge and EmptyState; preview remains dry run | **Source reviewed; exact legacy state values pending** |
| Loading/disabled | old-lms-pages.md:6-11, shell-spec.md:18-24, legacy form/button SCSS | Both import/preview Buttons supply loading and disabled | **Source reviewed; exact legacy state values pending** |
| Responsive | old-lms-pages.md:6-11, shell-spec.md:18-24, legacy form/button SCSS | Three metadata fields stack through 767px; md:grid-cols-3 thereafter; 44px phone targets | **Source reviewed; exact legacy state values pending** |

**Source anchors:** `src/components/college/college-student-csv-import.tsx:117` Button, `src/components/college/college-student-csv-import.tsx:124` Alert, `src/components/college/college-student-csv-import.tsx:n/a` Dialog, `src/components/college/college-student-csv-import.tsx:149` EmptyState. Actual browser resize and focus behaviour not verified; full test/TSX parser prohibited by lane constraints.

#### `src/components/college/college-student-register-form.tsx`

| Property/state | Legacy source/value | VNext source/value | Verification |
| --- | --- | --- | --- |
| Canvas and section | old-lms-shell-spec.md:18-20: one white canvas #fff, 1px #e5e9f0 border, radius 12px, padding 24px | No nested PageCanvas in file; shared page layout inherited from authenticated shell | **Source matches structure; exact per-route padding remains unmeasured** |
| Buttons and focus | old-lms-shell-spec.md:22-24: 36px, radius 9px, 14px/650, teal #0a7c88/white; legacy-styles/components___form.scss:117-143: focus shadow and 10px field radius | Shared Button/Input/Select variants if applicable; Shared Input/Select/Textarea, removed inner bordered canvas; unchanged identity contact fields | **Source token family; button active/focus state side-by-side unverified** |
| Status/errors/empty | old-lms-pages.md:6,11: status strip and hairline rows, no handmade extra canvas | Alert warning for partial, success for complete, error for failures | **Shared family; precise old state metrics not available** |
| Responsive phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked, 44px phone hit target | One column below 768px; two above; registration CTA 44px on phones | **Breakpoint source proof, not rendered viewport evidence** |
| Form fields | old-lms-pages.md:6-11, shell-spec.md:18-24, legacy form/button SCSS | Shared Input/Select/Textarea, removed inner bordered canvas; unchanged identity contact fields | **Source reviewed; exact legacy state values pending** |
| Partial/success/error | old-lms-pages.md:6-11, shell-spec.md:18-24, legacy form/button SCSS | Alert warning for partial, success for complete, error for failures | **Source reviewed; exact legacy state values pending** |
| Loading/disabled | old-lms-pages.md:6-11, shell-spec.md:18-24, legacy form/button SCSS | Button loading while async guarded registration; old validation kept | **Source reviewed; exact legacy state values pending** |
| Responsive | old-lms-pages.md:6-11, shell-spec.md:18-24, legacy form/button SCSS | One column below 768px; two above; registration CTA 44px on phones | **Source reviewed; exact legacy state values pending** |

**Source anchors:** `src/components/college/college-student-register-form.tsx:120` Button, `src/components/college/college-student-register-form.tsx:123` Alert, `src/components/college/college-student-register-form.tsx:n/a` Dialog, `src/components/college/college-student-register-form.tsx:n/a` EmptyState. Actual browser resize and focus behaviour not verified; full test/TSX parser prohibited by lane constraints.

#### `src/components/college/student-class-move-action.tsx`

| Property/state | Legacy source/value | VNext source/value | Verification |
| --- | --- | --- | --- |
| Canvas and section | old-lms-shell-spec.md:18-20: one white canvas #fff, 1px #e5e9f0 border, radius 12px, padding 24px | No nested PageCanvas in file; shared page layout inherited from authenticated shell | **Source matches structure; exact per-route padding remains unmeasured** |
| Buttons and focus | old-lms-shell-spec.md:22-24: 36px, radius 9px, 14px/650, teal #0a7c88/white; legacy-styles/components___form.scss:117-143: focus shadow and 10px field radius | Shared Button/Input/Select variants if applicable; Inline move panel replaced by shared Dialog with stable title, no duplicate heading | **Source token family; button active/focus state side-by-side unverified** |
| Status/errors/empty | old-lms-pages.md:6,11: status strip and hairline rows, no handmade extra canvas | Alert info preview, Alert(error), EmptyState for unavailable classes, Skeleton while fetching | **Shared family; precise old state metrics not available** |
| Responsive phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked, 44px phone hit target | No fixed min-width, Dialog wraps; trigger/confirm/cancel 44px below md | **Breakpoint source proof, not rendered viewport evidence** |
| Modal/confirmation | old-lms-pages.md:6-11, shell-spec.md:18-24, legacy form/button SCSS | Inline move panel replaced by shared Dialog with stable title, no duplicate heading | **Source reviewed; exact legacy state values pending** |
| Validation/error/empty | old-lms-pages.md:6-11, shell-spec.md:18-24, legacy form/button SCSS | Alert info preview, Alert(error), EmptyState for unavailable classes, Skeleton while fetching | **Source reviewed; exact legacy state values pending** |
| Focus/disabled | old-lms-pages.md:6-11, shell-spec.md:18-24, legacy form/button SCSS | Shared Button/Select focus and disabled busy, dialog dismissible only when idle | **Source reviewed; exact legacy state values pending** |
| Responsive | old-lms-pages.md:6-11, shell-spec.md:18-24, legacy form/button SCSS | No fixed min-width, Dialog wraps; trigger/confirm/cancel 44px below md | **Source reviewed; exact legacy state values pending** |

**Source anchors:** `src/components/college/student-class-move-action.tsx:71` Button, `src/components/college/student-class-move-action.tsx:85` Alert, `src/components/college/student-class-move-action.tsx:75` Dialog, `src/components/college/student-class-move-action.tsx:78` EmptyState. Actual browser resize and focus behaviour not verified; full test/TSX parser prohibited by lane constraints.

#### `src/components/college/college-person-edit-action.tsx`

| Property/state | Legacy source/value | VNext source/value | Verification |
| --- | --- | --- | --- |
| Canvas and section | old-lms-shell-spec.md:18-20: one white canvas #fff, 1px #e5e9f0 border, radius 12px, padding 24px | No nested PageCanvas in file; shared page layout inherited from authenticated shell | **Source matches structure; exact per-route padding remains unmeasured** |
| Buttons and focus | old-lms-shell-spec.md:22-24: 36px, radius 9px, 14px/650, teal #0a7c88/white; legacy-styles/components___form.scss:117-143: focus shadow and 10px field radius | Shared Button/Input/Select variants if applicable; Missing Button import repaired, shared Dialog with single heading and Input/Select/Textarea | **Source token family; button active/focus state side-by-side unverified** |
| Status/errors/empty | old-lms-pages.md:6,11: status strip and hairline rows, no handmade extra canvas | Canonical fields remain readOnly, membership-scoped save unchanged | **Shared family; precise old state metrics not available** |
| Responsive phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked, 44px phone hit target | Grid 1-column below 768px/2-column after; footer wrap remains | **Breakpoint source proof, not rendered viewport evidence** |
| Modal and field values | old-lms-pages.md:6-11, shell-spec.md:18-24, legacy form/button SCSS | Missing Button import repaired, shared Dialog with single heading and Input/Select/Textarea | **Source reviewed; exact legacy state values pending** |
| Read-only and permission | old-lms-pages.md:6-11, shell-spec.md:18-24, legacy form/button SCSS | Canonical fields remain readOnly, membership-scoped save unchanged | **Source reviewed; exact legacy state values pending** |
| Pending/status | old-lms-pages.md:6-11, shell-spec.md:18-24, legacy form/button SCSS | Skeleton while loading, Alert error/success, save button loading/disabled | **Source reviewed; exact legacy state values pending** |
| Responsive | old-lms-pages.md:6-11, shell-spec.md:18-24, legacy form/button SCSS | Grid 1-column below 768px/2-column after; footer wrap remains | **Source reviewed; exact legacy state values pending** |

**Source anchors:** `src/components/college/college-person-edit-action.tsx:77` Button, `src/components/college/college-person-edit-action.tsx:81` Alert, `src/components/college/college-person-edit-action.tsx:82` Dialog, `src/components/college/college-person-edit-action.tsx:n/a` EmptyState. Actual browser resize and focus behaviour not verified; full test/TSX parser prohibited by lane constraints.

#### `src/components/college/college-person-profile-overview-modal.tsx`

| Property/state | Legacy source/value | VNext source/value | Verification |
| --- | --- | --- | --- |
| Canvas and section | old-lms-shell-spec.md:18-20: one white canvas #fff, 1px #e5e9f0 border, radius 12px, padding 24px | No nested PageCanvas in file; shared page layout inherited from authenticated shell | **Source matches structure; exact per-route padding remains unmeasured** |
| Buttons and focus | old-lms-shell-spec.md:22-24: 36px, radius 9px, 14px/650, teal #0a7c88/white; legacy-styles/components___form.scss:117-143: focus shadow and 10px field radius | Shared Button/Input/Select variants if applicable; Removed duplicate h2; shared Dialog title; education list hairline separators | **Source token family; button active/focus state side-by-side unverified** |
| Status/errors/empty | old-lms-pages.md:6,11: status strip and hairline rows, no handmade extra canvas | Skeleton on read, Alert on error, EmptyState if no education | **Shared family; precise old state metrics not available** |
| Responsive phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked, 44px phone hit target | Two-column metadata after md; single column on phones; close button 44px | **Breakpoint source proof, not rendered viewport evidence** |
| Modal title and rows | old-lms-pages.md:6-11, shell-spec.md:18-24, legacy form/button SCSS | Removed duplicate h2; shared Dialog title; education list hairline separators | **Source reviewed; exact legacy state values pending** |
| Empty/loading/error | old-lms-pages.md:6-11, shell-spec.md:18-24, legacy form/button SCSS | Skeleton on read, Alert on error, EmptyState if no education | **Source reviewed; exact legacy state values pending** |
| Data and dynamic sections | old-lms-pages.md:6-11, shell-spec.md:18-24, legacy form/button SCSS | Person role/bio/education/skills unchanged; separate topical row groups use border-bottom | **Source reviewed; exact legacy state values pending** |
| Responsive | old-lms-pages.md:6-11, shell-spec.md:18-24, legacy form/button SCSS | Two-column metadata after md; single column on phones; close button 44px | **Source reviewed; exact legacy state values pending** |

**Source anchors:** `src/components/college/college-person-profile-overview-modal.tsx:31` Button, `src/components/college/college-person-profile-overview-modal.tsx:39` Alert, `src/components/college/college-person-profile-overview-modal.tsx:33` Dialog, `src/components/college/college-person-profile-overview-modal.tsx:47` EmptyState. Actual browser resize and focus behaviour not verified; full test/TSX parser prohibited by lane constraints.

#### `src/components/college/college-role-directory-workspace.tsx`

| Property/state | Legacy source/value | VNext source/value | Verification |
| --- | --- | --- | --- |
| Canvas and section | old-lms-shell-spec.md:18-20: one white canvas #fff, 1px #e5e9f0 border, radius 12px, padding 24px | No nested PageCanvas in file; shared page layout inherited from authenticated shell | **Source matches structure; exact per-route padding remains unmeasured** |
| Buttons and focus | old-lms-shell-spec.md:22-24: 36px, radius 9px, 14px/650, teal #0a7c88/white; legacy-styles/components___form.scss:117-143: focus shadow and 10px field radius | Shared Button/Input/Select variants if applicable; Three scoped numeric metrics and Visible now now use shared StatTile | **Source token family; button active/focus state side-by-side unverified** |
| Status/errors/empty | old-lms-pages.md:6,11: status strip and hairline rows, no handmade extra canvas | EmptyState with authorized filter-clear action; existing ErrorState for denied read | **Shared family; precise old state metrics not available** |
| Responsive phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked, 44px phone hit target | Summary 1-col phone, 2-col tablet, 4-col desktop, link actions 44px phone | **Breakpoint source proof, not rendered viewport evidence** |
| Summary metrics | old-lms-pages.md:6-11, shell-spec.md:18-24, legacy form/button SCSS | Three scoped numeric metrics and Visible now now use shared StatTile | **Source reviewed; exact legacy state values pending** |
| Headers/links/forms | old-lms-pages.md:6-11, shell-spec.md:18-24, legacy form/button SCSS | Single PageHeader, role-specific actions, shared Input/Select/Disclosure | **Source reviewed; exact legacy state values pending** |
| Empty/error | old-lms-pages.md:6-11, shell-spec.md:18-24, legacy form/button SCSS | EmptyState with authorized filter-clear action; existing ErrorState for denied read | **Source reviewed; exact legacy state values pending** |
| Responsive | old-lms-pages.md:6-11, shell-spec.md:18-24, legacy form/button SCSS | Summary 1-col phone, 2-col tablet, 4-col desktop, link actions 44px phone | **Source reviewed; exact legacy state values pending** |
| Legacy disparity | old-lms-pages.md:6-11, shell-spec.md:18-24, legacy form/button SCSS | Custom duplicate mobile roster rows still exist, shared DataTable switches at 640px; strict UI parity unverified | **Source reviewed; exact legacy state values pending** |

**Source anchors:** `src/components/college/college-role-directory-workspace.tsx:343` Button, `src/components/college/college-role-directory-workspace.tsx:n/a` Alert, `src/components/college/college-role-directory-workspace.tsx:n/a` Dialog, `src/components/college/college-role-directory-workspace.tsx:357` EmptyState. Actual browser resize and focus behaviour not verified; full test/TSX parser prohibited by lane constraints.

**Strict ticks: 0 newly checked.** All six are source-migrated, **not** certified pixel clones. Global greps, fully matched computed values for hover/active/focus/disabled/loading/errors/empty, responsive browser proof and TypeScript/JSX parse are missing. Shared PageHeader typography and DataTable mobile breakpoint remain external owner blockers; for the role directory, duplicate custom mobile roster layout also needs a dedicated parity pass.

**Exact next file:** `src/components/college/college-faculty-assignment-actions.tsx` has prior source proof; proceed to remaining College Admin owned routes and overlay/detail components, starting `src/app/(authenticated)/college/students/error.tsx` if in the Work queue; audit remaining error/loading files by queue order.


### Replacement chat-4 College students/faculty/person management routes — 2026-10-20

**Scope:** thirteen updated route files from the College Admin Work queue; `src/components/ui` unchanged. Existing tenant authorization, server fetching, action routes and page contents preserved; changed only heading actions, loading/error surfaces, status/empty cards and source-responsive controls. No app execution, browser screenshots, CI or compiler.

**Full-file grep expressions:** `/<(button|input|select|textarea|table)\b/g`, `/#[a-f0-9]{3,8}\b/gi`, `/fixed inset-0|role=["']dialog["']/g`, `/<h1\b/g`. Values below are from complete GitHub blob reads **after editing**, not repo-wide grep. Native `<h1>` appears only through shared PageHeader. Compared open/close counts for local section, div, form, Button, ErrorState, EmptyState, PageHeader, PageBackLink, GracefulPageLoading, StatusBadge and DataTable.

| Route file | Native controls | Hex literals | Hand overlays | Native h1 | md/sm prefixes |
| --- | ---: | ---: | ---: | ---: | --- |
| `src/app/(authenticated)/college/students/import/loading.tsx` | 0 | 0 | 0 | 0 | 0/0 |
| `src/app/(authenticated)/college/students/import/page.tsx` | 0 | 0 | 0 | 0 | 0/0 |
| `src/app/(authenticated)/college/students/register/error.tsx` | 0 | 0 | 0 | 0 | 1/0 |
| `src/app/(authenticated)/college/students/register/loading.tsx` | 0 | 0 | 0 | 0 | 0/0 |
| `src/app/(authenticated)/college/students/register/page.tsx` | 0 | 0 | 0 | 0 | 0/0 |
| `src/app/(authenticated)/college/faculty/import/error.tsx` | 0 | 0 | 0 | 0 | 1/0 |
| `src/app/(authenticated)/college/faculty/import/loading.tsx` | 0 | 0 | 0 | 0 | 0/0 |
| `src/app/(authenticated)/college/faculty/import/page.tsx` | 0 | 0 | 0 | 0 | 0/0 |
| `src/app/(authenticated)/college/faculty/[membershipId]/page.tsx` | 0 | 0 | 0 | 0 | 3/0 |
| `src/app/(authenticated)/college/students/[membershipId]/page.tsx` | 0 | 0 | 0 | 0 | 2/0 |
| `src/app/(authenticated)/college/people/manage/error.tsx` | 0 | 0 | 0 | 0 | 1/0 |
| `src/app/(authenticated)/college/people/manage/loading.tsx` | 0 | 0 | 0 | 0 | 0/0 |
| `src/app/(authenticated)/college/people/manage/page.tsx` | 0 | 0 | 0 | 0 | 8/0 |

#### `src/app/(authenticated)/college/students/import/loading.tsx`

| Property/state | Legacy file and exact sourced value | Current component/value | Result |
| --- | --- | --- | --- |
| Page canvas | old-lms-shell-spec.md:18-20: #ffffff, border #e5e9f0 1px, radius 12px, padding 24px, one canvas | Inherited PageCanvas, no nested canvas owned by this route | **Inherited match; exact render not measured** |
| Page heading / navigation | legacy-styles/components___listing-page-header.scss:33-58: title row with border bottom, title 28px/600/1.3; mobile 20px | Shared PageHeader or shared boundary where applicable, PageBackLink in detail/import routes | **Shared title is 30px desktop; known unresolved mismatch** |
| Buttons/default/hover/focus | old-lms-shell-spec.md:22-24: primary 36px radius 9px 14px/650 white on teal, outlined 36px secondary; button.scss:13-24 150ms transitions | Shared Button/PageBackLink and existing links, no native raw styled buttons | **Shared tokens source reviewed, visual state comparison unverified** |
| Disabled/loading | legacy-styles/components___button.scss:49-51 disabled palette and form.scss:22-36 visible keyboard focus | GracefulPageLoading documented card/directory skeleton, label and eventual retry | **Source contract retained; no browser/loading playback** |
| Error/empty | old-lms-pages.md:6,11: compact in-canvas state, no fake empty result | Loader does not claim empty data | **Shared state; old detail-specific error geometry not sourced** |
| Responsive phone/tablet | listing-page-header.scss:130-153: max 767px stacked, 20px heading, 44px touch target | Shared skeleton fluid width without nested page canvas | **CSS source checked; live 375/767/768 tablet screenshot proof open** |

**Source-specific change:** Shared GracefulPageLoading(card); original custom animate-pulse nested panels removed; recovery action is component-owned. Source anchors: PageHeader line n/a, ErrorState line n/a, loading line 3, PageBackLink line n/a. No source orphan closing tags were observed in these route-level JSX components; no TypeScript compiler was run.

#### `src/app/(authenticated)/college/students/import/page.tsx`

| Property/state | Legacy file and exact sourced value | Current component/value | Result |
| --- | --- | --- | --- |
| Page canvas | old-lms-shell-spec.md:18-20: #ffffff, border #e5e9f0 1px, radius 12px, padding 24px, one canvas | Inherited PageCanvas, no nested canvas owned by this route | **Inherited match; exact render not measured** |
| Page heading / navigation | legacy-styles/components___listing-page-header.scss:33-58: title row with border bottom, title 28px/600/1.3; mobile 20px | Shared PageHeader or shared boundary where applicable, PageBackLink in detail/import routes | **Shared title is 30px desktop; known unresolved mismatch** |
| Buttons/default/hover/focus | old-lms-shell-spec.md:22-24: primary 36px radius 9px 14px/650 white on teal, outlined 36px secondary; button.scss:13-24 150ms transitions | Shared Button/PageBackLink and existing links, no native raw styled buttons | **Shared tokens source reviewed, visual state comparison unverified** |
| Disabled/loading | legacy-styles/components___button.scss:49-51 disabled palette and form.scss:22-36 visible keyboard focus | Existing server-side fetch/disabled dependent subcomponents unchanged | **Source contract retained; no browser/loading playback** |
| Error/empty | old-lms-pages.md:6,11: compact in-canvas state, no fake empty result | Shared EmptyState / StatusBadge where route directly owns data; no ACL bypass | **Shared state; old detail-specific error geometry not sourced** |
| Responsive phone/tablet | listing-page-header.scss:130-153: max 767px stacked, 20px heading, 44px touch target | md-grid/filter and shared PageBackLink 44px mobile target; DataTable owns narrower card switch | **CSS source checked; live 375/767/768 tablet screenshot proof open** |

**Source-specific change:** One PageHeader and PageBackLink to scoped student directory; direct CollegeStudentCsvImport unchanged. Source anchors: PageHeader line 18, ErrorState line n/a, loading line n/a, PageBackLink line 21. No source orphan closing tags were observed in these route-level JSX components; no TypeScript compiler was run.

#### `src/app/(authenticated)/college/students/register/error.tsx`

| Property/state | Legacy file and exact sourced value | Current component/value | Result |
| --- | --- | --- | --- |
| Page canvas | old-lms-shell-spec.md:18-20: #ffffff, border #e5e9f0 1px, radius 12px, padding 24px, one canvas | Inherited PageCanvas, no nested canvas owned by this route | **Inherited match; exact render not measured** |
| Page heading / navigation | legacy-styles/components___listing-page-header.scss:33-58: title row with border bottom, title 28px/600/1.3; mobile 20px | Shared PageHeader or shared boundary where applicable, PageBackLink in detail/import routes | **Shared title is 30px desktop; known unresolved mismatch** |
| Buttons/default/hover/focus | old-lms-shell-spec.md:22-24: primary 36px radius 9px 14px/650 white on teal, outlined 36px secondary; button.scss:13-24 150ms transitions | Shared Button/PageBackLink and existing links, no native raw styled buttons | **Shared tokens source reviewed, visual state comparison unverified** |
| Disabled/loading | legacy-styles/components___button.scss:49-51 disabled palette and form.scss:22-36 visible keyboard focus | Retry secondary Button from ErrorState, keyboard focus-visible | **Source contract retained; no browser/loading playback** |
| Error/empty | old-lms-pages.md:6,11: compact in-canvas state, no fake empty result | Scoped ErrorState with Retry and preserved non-empty-data wording | **Shared state; old detail-specific error geometry not sourced** |
| Responsive phone/tablet | listing-page-header.scss:130-153: max 767px stacked, 20px heading, 44px touch target | Retry min-h-11 md:min-h-9 | **CSS source checked; live 375/767/768 tablet screenshot proof open** |

**Source-specific change:** Scoped ErrorState and shared secondary Retry; removes public GracefulErrorBoundary fallback. Source anchors: PageHeader line n/a, ErrorState line 7, loading line n/a, PageBackLink line n/a. No source orphan closing tags were observed in these route-level JSX components; no TypeScript compiler was run.

#### `src/app/(authenticated)/college/students/register/loading.tsx`

| Property/state | Legacy file and exact sourced value | Current component/value | Result |
| --- | --- | --- | --- |
| Page canvas | old-lms-shell-spec.md:18-20: #ffffff, border #e5e9f0 1px, radius 12px, padding 24px, one canvas | Inherited PageCanvas, no nested canvas owned by this route | **Inherited match; exact render not measured** |
| Page heading / navigation | legacy-styles/components___listing-page-header.scss:33-58: title row with border bottom, title 28px/600/1.3; mobile 20px | Shared PageHeader or shared boundary where applicable, PageBackLink in detail/import routes | **Shared title is 30px desktop; known unresolved mismatch** |
| Buttons/default/hover/focus | old-lms-shell-spec.md:22-24: primary 36px radius 9px 14px/650 white on teal, outlined 36px secondary; button.scss:13-24 150ms transitions | Shared Button/PageBackLink and existing links, no native raw styled buttons | **Shared tokens source reviewed, visual state comparison unverified** |
| Disabled/loading | legacy-styles/components___button.scss:49-51 disabled palette and form.scss:22-36 visible keyboard focus | GracefulPageLoading documented card/directory skeleton, label and eventual retry | **Source contract retained; no browser/loading playback** |
| Error/empty | old-lms-pages.md:6,11: compact in-canvas state, no fake empty result | Loader does not claim empty data | **Shared state; old detail-specific error geometry not sourced** |
| Responsive phone/tablet | listing-page-header.scss:130-153: max 767px stacked, 20px heading, 44px touch target | Shared skeleton fluid width without nested page canvas | **CSS source checked; live 375/767/768 tablet screenshot proof open** |

**Source-specific change:** Shared GracefulPageLoading(card) with explicit student-registration label. Source anchors: PageHeader line n/a, ErrorState line n/a, loading line 3, PageBackLink line n/a. No source orphan closing tags were observed in these route-level JSX components; no TypeScript compiler was run.

#### `src/app/(authenticated)/college/students/register/page.tsx`

| Property/state | Legacy file and exact sourced value | Current component/value | Result |
| --- | --- | --- | --- |
| Page canvas | old-lms-shell-spec.md:18-20: #ffffff, border #e5e9f0 1px, radius 12px, padding 24px, one canvas | Inherited PageCanvas, no nested canvas owned by this route | **Inherited match; exact render not measured** |
| Page heading / navigation | legacy-styles/components___listing-page-header.scss:33-58: title row with border bottom, title 28px/600/1.3; mobile 20px | Shared PageHeader or shared boundary where applicable, PageBackLink in detail/import routes | **Shared title is 30px desktop; known unresolved mismatch** |
| Buttons/default/hover/focus | old-lms-shell-spec.md:22-24: primary 36px radius 9px 14px/650 white on teal, outlined 36px secondary; button.scss:13-24 150ms transitions | Shared Button/PageBackLink and existing links, no native raw styled buttons | **Shared tokens source reviewed, visual state comparison unverified** |
| Disabled/loading | legacy-styles/components___button.scss:49-51 disabled palette and form.scss:22-36 visible keyboard focus | Existing server-side fetch/disabled dependent subcomponents unchanged | **Source contract retained; no browser/loading playback** |
| Error/empty | old-lms-pages.md:6,11: compact in-canvas state, no fake empty result | Shared EmptyState / StatusBadge where route directly owns data; no ACL bypass | **Shared state; old detail-specific error geometry not sourced** |
| Responsive phone/tablet | listing-page-header.scss:130-153: max 767px stacked, 20px heading, 44px touch target | md-grid/filter and shared PageBackLink 44px mobile target; DataTable owns narrower card switch | **CSS source checked; live 375/767/768 tablet screenshot proof open** |

**Source-specific change:** One PageHeader; redundant eyebrow removed; PageBackLink for authorized student return. Source anchors: PageHeader line 13, ErrorState line n/a, loading line n/a, PageBackLink line 15. No source orphan closing tags were observed in these route-level JSX components; no TypeScript compiler was run.

#### `src/app/(authenticated)/college/faculty/import/error.tsx`

| Property/state | Legacy file and exact sourced value | Current component/value | Result |
| --- | --- | --- | --- |
| Page canvas | old-lms-shell-spec.md:18-20: #ffffff, border #e5e9f0 1px, radius 12px, padding 24px, one canvas | Inherited PageCanvas, no nested canvas owned by this route | **Inherited match; exact render not measured** |
| Page heading / navigation | legacy-styles/components___listing-page-header.scss:33-58: title row with border bottom, title 28px/600/1.3; mobile 20px | Shared PageHeader or shared boundary where applicable, PageBackLink in detail/import routes | **Shared title is 30px desktop; known unresolved mismatch** |
| Buttons/default/hover/focus | old-lms-shell-spec.md:22-24: primary 36px radius 9px 14px/650 white on teal, outlined 36px secondary; button.scss:13-24 150ms transitions | Shared Button/PageBackLink and existing links, no native raw styled buttons | **Shared tokens source reviewed, visual state comparison unverified** |
| Disabled/loading | legacy-styles/components___button.scss:49-51 disabled palette and form.scss:22-36 visible keyboard focus | Retry secondary Button from ErrorState, keyboard focus-visible | **Source contract retained; no browser/loading playback** |
| Error/empty | old-lms-pages.md:6,11: compact in-canvas state, no fake empty result | Scoped ErrorState with Retry and preserved non-empty-data wording | **Shared state; old detail-specific error geometry not sourced** |
| Responsive phone/tablet | listing-page-header.scss:130-153: max 767px stacked, 20px heading, 44px touch target | Retry min-h-11 md:min-h-9 | **CSS source checked; live 375/767/768 tablet screenshot proof open** |

**Source-specific change:** Scoped ErrorState and shared Retry; public generic error removed. Source anchors: PageHeader line n/a, ErrorState line 5, loading line n/a, PageBackLink line n/a. No source orphan closing tags were observed in these route-level JSX components; no TypeScript compiler was run.

#### `src/app/(authenticated)/college/faculty/import/loading.tsx`

| Property/state | Legacy file and exact sourced value | Current component/value | Result |
| --- | --- | --- | --- |
| Page canvas | old-lms-shell-spec.md:18-20: #ffffff, border #e5e9f0 1px, radius 12px, padding 24px, one canvas | Inherited PageCanvas, no nested canvas owned by this route | **Inherited match; exact render not measured** |
| Page heading / navigation | legacy-styles/components___listing-page-header.scss:33-58: title row with border bottom, title 28px/600/1.3; mobile 20px | Shared PageHeader or shared boundary where applicable, PageBackLink in detail/import routes | **Shared title is 30px desktop; known unresolved mismatch** |
| Buttons/default/hover/focus | old-lms-shell-spec.md:22-24: primary 36px radius 9px 14px/650 white on teal, outlined 36px secondary; button.scss:13-24 150ms transitions | Shared Button/PageBackLink and existing links, no native raw styled buttons | **Shared tokens source reviewed, visual state comparison unverified** |
| Disabled/loading | legacy-styles/components___button.scss:49-51 disabled palette and form.scss:22-36 visible keyboard focus | GracefulPageLoading documented card/directory skeleton, label and eventual retry | **Source contract retained; no browser/loading playback** |
| Error/empty | old-lms-pages.md:6,11: compact in-canvas state, no fake empty result | Loader does not claim empty data | **Shared state; old detail-specific error geometry not sourced** |
| Responsive phone/tablet | listing-page-header.scss:130-153: max 767px stacked, 20px heading, 44px touch target | Shared skeleton fluid width without nested page canvas | **CSS source checked; live 375/767/768 tablet screenshot proof open** |

**Source-specific change:** GracefulPageLoading(card), faculty-import-specific loading label. Source anchors: PageHeader line n/a, ErrorState line n/a, loading line 3, PageBackLink line n/a. No source orphan closing tags were observed in these route-level JSX components; no TypeScript compiler was run.

#### `src/app/(authenticated)/college/faculty/import/page.tsx`

| Property/state | Legacy file and exact sourced value | Current component/value | Result |
| --- | --- | --- | --- |
| Page canvas | old-lms-shell-spec.md:18-20: #ffffff, border #e5e9f0 1px, radius 12px, padding 24px, one canvas | Inherited PageCanvas, no nested canvas owned by this route | **Inherited match; exact render not measured** |
| Page heading / navigation | legacy-styles/components___listing-page-header.scss:33-58: title row with border bottom, title 28px/600/1.3; mobile 20px | Shared PageHeader or shared boundary where applicable, PageBackLink in detail/import routes | **Shared title is 30px desktop; known unresolved mismatch** |
| Buttons/default/hover/focus | old-lms-shell-spec.md:22-24: primary 36px radius 9px 14px/650 white on teal, outlined 36px secondary; button.scss:13-24 150ms transitions | Shared Button/PageBackLink and existing links, no native raw styled buttons | **Shared tokens source reviewed, visual state comparison unverified** |
| Disabled/loading | legacy-styles/components___button.scss:49-51 disabled palette and form.scss:22-36 visible keyboard focus | Existing server-side fetch/disabled dependent subcomponents unchanged | **Source contract retained; no browser/loading playback** |
| Error/empty | old-lms-pages.md:6,11: compact in-canvas state, no fake empty result | Shared EmptyState / StatusBadge where route directly owns data; no ACL bypass | **Shared state; old detail-specific error geometry not sourced** |
| Responsive phone/tablet | listing-page-header.scss:130-153: max 767px stacked, 20px heading, 44px touch target | md-grid/filter and shared PageBackLink 44px mobile target; DataTable owns narrower card switch | **CSS source checked; live 375/767/768 tablet screenshot proof open** |

**Source-specific change:** Single PageHeader, shared PageBackLink, original permission gate and CSV import component unchanged. Source anchors: PageHeader line 16, ErrorState line n/a, loading line n/a, PageBackLink line 18. No source orphan closing tags were observed in these route-level JSX components; no TypeScript compiler was run.

#### `src/app/(authenticated)/college/faculty/[membershipId]/page.tsx`

| Property/state | Legacy file and exact sourced value | Current component/value | Result |
| --- | --- | --- | --- |
| Page canvas | old-lms-shell-spec.md:18-20: #ffffff, border #e5e9f0 1px, radius 12px, padding 24px, one canvas | Inherited PageCanvas, no nested canvas owned by this route | **Inherited match; exact render not measured** |
| Page heading / navigation | legacy-styles/components___listing-page-header.scss:33-58: title row with border bottom, title 28px/600/1.3; mobile 20px | Shared PageHeader or shared boundary where applicable, PageBackLink in detail/import routes | **Shared title is 30px desktop; known unresolved mismatch** |
| Buttons/default/hover/focus | old-lms-shell-spec.md:22-24: primary 36px radius 9px 14px/650 white on teal, outlined 36px secondary; button.scss:13-24 150ms transitions | Shared Button/PageBackLink and existing links, no native raw styled buttons | **Shared tokens source reviewed, visual state comparison unverified** |
| Disabled/loading | legacy-styles/components___button.scss:49-51 disabled palette and form.scss:22-36 visible keyboard focus | Existing server-side fetch/disabled dependent subcomponents unchanged | **Source contract retained; no browser/loading playback** |
| Error/empty | old-lms-pages.md:6,11: compact in-canvas state, no fake empty result | Shared EmptyState / StatusBadge where route directly owns data; no ACL bypass | **Shared state; old detail-specific error geometry not sourced** |
| Responsive phone/tablet | listing-page-header.scss:130-153: max 767px stacked, 20px heading, 44px touch target | md-grid/filter and shared PageBackLink 44px mobile target; DataTable owns narrower card switch | **CSS source checked; live 375/767/768 tablet screenshot proof open** |

**Source-specific change:** PageHeader single h1, PageBackLink, mobile-friendly faculty info grid, shared StatusBadge and EmptyState. Source anchors: PageHeader line 30, ErrorState line n/a, loading line n/a, PageBackLink line 36. No source orphan closing tags were observed in these route-level JSX components; no TypeScript compiler was run.

#### `src/app/(authenticated)/college/students/[membershipId]/page.tsx`

| Property/state | Legacy file and exact sourced value | Current component/value | Result |
| --- | --- | --- | --- |
| Page canvas | old-lms-shell-spec.md:18-20: #ffffff, border #e5e9f0 1px, radius 12px, padding 24px, one canvas | Inherited PageCanvas, no nested canvas owned by this route | **Inherited match; exact render not measured** |
| Page heading / navigation | legacy-styles/components___listing-page-header.scss:33-58: title row with border bottom, title 28px/600/1.3; mobile 20px | Shared PageHeader or shared boundary where applicable, PageBackLink in detail/import routes | **Shared title is 30px desktop; known unresolved mismatch** |
| Buttons/default/hover/focus | old-lms-shell-spec.md:22-24: primary 36px radius 9px 14px/650 white on teal, outlined 36px secondary; button.scss:13-24 150ms transitions | Shared Button/PageBackLink and existing links, no native raw styled buttons | **Shared tokens source reviewed, visual state comparison unverified** |
| Disabled/loading | legacy-styles/components___button.scss:49-51 disabled palette and form.scss:22-36 visible keyboard focus | Existing server-side fetch/disabled dependent subcomponents unchanged | **Source contract retained; no browser/loading playback** |
| Error/empty | old-lms-pages.md:6,11: compact in-canvas state, no fake empty result | Shared EmptyState / StatusBadge where route directly owns data; no ACL bypass | **Shared state; old detail-specific error geometry not sourced** |
| Responsive phone/tablet | listing-page-header.scss:130-153: max 767px stacked, 20px heading, 44px touch target | md-grid/filter and shared PageBackLink 44px mobile target; DataTable owns narrower card switch | **CSS source checked; live 375/767/768 tablet screenshot proof open** |

**Source-specific change:** PageHeader/PageBackLink; status badge, EmptyState on no enrollment/class, hairline enrollment lists. Source anchors: PageHeader line 27, ErrorState line n/a, loading line n/a, PageBackLink line 29. No source orphan closing tags were observed in these route-level JSX components; no TypeScript compiler was run.

#### `src/app/(authenticated)/college/people/manage/error.tsx`

| Property/state | Legacy file and exact sourced value | Current component/value | Result |
| --- | --- | --- | --- |
| Page canvas | old-lms-shell-spec.md:18-20: #ffffff, border #e5e9f0 1px, radius 12px, padding 24px, one canvas | Inherited PageCanvas, no nested canvas owned by this route | **Inherited match; exact render not measured** |
| Page heading / navigation | legacy-styles/components___listing-page-header.scss:33-58: title row with border bottom, title 28px/600/1.3; mobile 20px | Shared PageHeader or shared boundary where applicable, PageBackLink in detail/import routes | **Shared title is 30px desktop; known unresolved mismatch** |
| Buttons/default/hover/focus | old-lms-shell-spec.md:22-24: primary 36px radius 9px 14px/650 white on teal, outlined 36px secondary; button.scss:13-24 150ms transitions | Shared Button/PageBackLink and existing links, no native raw styled buttons | **Shared tokens source reviewed, visual state comparison unverified** |
| Disabled/loading | legacy-styles/components___button.scss:49-51 disabled palette and form.scss:22-36 visible keyboard focus | Retry secondary Button from ErrorState, keyboard focus-visible | **Source contract retained; no browser/loading playback** |
| Error/empty | old-lms-pages.md:6,11: compact in-canvas state, no fake empty result | Scoped ErrorState with Retry and preserved non-empty-data wording | **Shared state; old detail-specific error geometry not sourced** |
| Responsive phone/tablet | listing-page-header.scss:130-153: max 767px stacked, 20px heading, 44px touch target | Retry min-h-11 md:min-h-9 | **CSS source checked; live 375/767/768 tablet screenshot proof open** |

**Source-specific change:** Tenant-scoped ErrorState and shared Retry Button. Source anchors: PageHeader line n/a, ErrorState line 5, loading line n/a, PageBackLink line n/a. No source orphan closing tags were observed in these route-level JSX components; no TypeScript compiler was run.

#### `src/app/(authenticated)/college/people/manage/loading.tsx`

| Property/state | Legacy file and exact sourced value | Current component/value | Result |
| --- | --- | --- | --- |
| Page canvas | old-lms-shell-spec.md:18-20: #ffffff, border #e5e9f0 1px, radius 12px, padding 24px, one canvas | Inherited PageCanvas, no nested canvas owned by this route | **Inherited match; exact render not measured** |
| Page heading / navigation | legacy-styles/components___listing-page-header.scss:33-58: title row with border bottom, title 28px/600/1.3; mobile 20px | Shared PageHeader or shared boundary where applicable, PageBackLink in detail/import routes | **Shared title is 30px desktop; known unresolved mismatch** |
| Buttons/default/hover/focus | old-lms-shell-spec.md:22-24: primary 36px radius 9px 14px/650 white on teal, outlined 36px secondary; button.scss:13-24 150ms transitions | Shared Button/PageBackLink and existing links, no native raw styled buttons | **Shared tokens source reviewed, visual state comparison unverified** |
| Disabled/loading | legacy-styles/components___button.scss:49-51 disabled palette and form.scss:22-36 visible keyboard focus | GracefulPageLoading documented card/directory skeleton, label and eventual retry | **Source contract retained; no browser/loading playback** |
| Error/empty | old-lms-pages.md:6,11: compact in-canvas state, no fake empty result | Loader does not claim empty data | **Shared state; old detail-specific error geometry not sourced** |
| Responsive phone/tablet | listing-page-header.scss:130-153: max 767px stacked, 20px heading, 44px touch target | Shared skeleton fluid width without nested page canvas | **CSS source checked; live 375/767/768 tablet screenshot proof open** |

**Source-specific change:** Directory-shape GracefulPageLoading with scoped label and bounded recovery. Source anchors: PageHeader line n/a, ErrorState line n/a, loading line 3, PageBackLink line n/a. No source orphan closing tags were observed in these route-level JSX components; no TypeScript compiler was run.

#### `src/app/(authenticated)/college/people/manage/page.tsx`

| Property/state | Legacy file and exact sourced value | Current component/value | Result |
| --- | --- | --- | --- |
| Page canvas | old-lms-shell-spec.md:18-20: #ffffff, border #e5e9f0 1px, radius 12px, padding 24px, one canvas | Inherited PageCanvas, no nested canvas owned by this route | **Inherited match; exact render not measured** |
| Page heading / navigation | legacy-styles/components___listing-page-header.scss:33-58: title row with border bottom, title 28px/600/1.3; mobile 20px | Shared PageHeader or shared boundary where applicable, PageBackLink in detail/import routes | **Shared title is 30px desktop; known unresolved mismatch** |
| Buttons/default/hover/focus | old-lms-shell-spec.md:22-24: primary 36px radius 9px 14px/650 white on teal, outlined 36px secondary; button.scss:13-24 150ms transitions | Shared Button/PageBackLink and existing links, no native raw styled buttons | **Shared tokens source reviewed, visual state comparison unverified** |
| Disabled/loading | legacy-styles/components___button.scss:49-51 disabled palette and form.scss:22-36 visible keyboard focus | Existing server-side fetch/disabled dependent subcomponents unchanged | **Source contract retained; no browser/loading playback** |
| Error/empty | old-lms-pages.md:6,11: compact in-canvas state, no fake empty result | Shared EmptyState / StatusBadge where route directly owns data; no ACL bypass | **Shared state; old detail-specific error geometry not sourced** |
| Responsive phone/tablet | listing-page-header.scss:130-153: max 767px stacked, 20px heading, 44px touch target | md-grid/filter and shared PageBackLink 44px mobile target; DataTable owns narrower card switch | **CSS source checked; live 375/767/768 tablet screenshot proof open** |

**Source-specific change:** Preserves DataTable/filters/role ACL; shared EmptyState with clear-filter action; tokenized linked actions. Source anchors: PageHeader line 62, ErrorState line 63, loading line n/a, PageBackLink line n/a. No source orphan closing tags were observed in these route-level JSX components; no TypeScript compiler was run.

**Strict checkboxes remain open.** PageHeader 28px legacy vs 30px shared desktop, DataTable 640px vs old LMS 767px card threshold, old-LMS exact state values, full-scope grep, browser interaction and responsive visual comparison prevent certification. All thirteen are **SOURCE PASS only**, not full pixel-matched clones.

**Exact next file:** `src/app/(authenticated)/college/people/page.tsx`, then `src/app/(authenticated)/college/people/loading.tsx` and `src/app/(authenticated)/college/people/error.tsx`; continue the Work queue for contacts and roster.


### Replacement chat-4 College Admin route fallback and loading surfaces — 2026-10-20

**Source-refactored:** fifteen error/loading files across contact details, batch students, academics, academic section, companies, college profile and faculty assignments, plus contacts/people directory retry actions. Generic public error boundaries replaced by scoped shared ErrorState, custom animate-pulse page loaders replaced with GracefulPageLoading(card/directory), and retry/clear-filter targets use the 767/768px contract. Original error page has no mutation semantics. No shared UI files changed. No app, tests, TypeScript compiler, browser or CI executed.

**Bounded full-blob grep expressions:** `/<(button|input|select|textarea|table)\b/g`; `/#[a-f0-9]{3,8}\b/gi`; `/fixed inset-0|role=["']dialog["']/g`; `/<h1\b/g`. Checked JSX family closing counts and allowed documented shared props (GracefulPageLoading `shape="card"|"directory"`, ErrorState title/description/action). This does not certify global source grep.

| File | Native controls | Hex colours | Custom overlays | Native h1 | md / sm source tokens |
| --- | ---: | ---: | ---: | ---: | --- |
| `src/app/(authenticated)/college/people/error.tsx` | 0 | 0 | 0 | 0 | 2 / 0 |
| `src/app/(authenticated)/college/contacts/error.tsx` | 0 | 0 | 0 | 0 | 2 / 0 |
| `src/app/(authenticated)/college/contacts/[membershipId]/error.tsx` | 0 | 0 | 0 | 0 | 1 / 0 |
| `src/app/(authenticated)/college/batches/[cohortId]/students/error.tsx` | 0 | 0 | 0 | 0 | 1 / 0 |
| `src/app/(authenticated)/college/academics/sections/[sectionId]/error.tsx` | 0 | 0 | 0 | 0 | 1 / 0 |
| `src/app/(authenticated)/college/companies/error.tsx` | 0 | 0 | 0 | 0 | 1 / 0 |
| `src/app/(authenticated)/college/contacts/[membershipId]/loading.tsx` | 0 | 0 | 0 | 0 | 0 / 0 |
| `src/app/(authenticated)/college/batches/[cohortId]/students/loading.tsx` | 0 | 0 | 0 | 0 | 0 / 0 |
| `src/app/(authenticated)/college/academics/sections/[sectionId]/loading.tsx` | 0 | 0 | 0 | 0 | 0 / 0 |
| `src/app/(authenticated)/college/companies/loading.tsx` | 0 | 0 | 0 | 0 | 0 / 0 |
| `src/app/(authenticated)/college/academics/loading.tsx` | 0 | 0 | 0 | 0 | 0 / 0 |
| `src/app/(authenticated)/college/college-profile/loading.tsx` | 0 | 0 | 0 | 0 | 0 / 0 |
| `src/app/(authenticated)/college/academics/error.tsx` | 0 | 0 | 0 | 0 | 1 / 0 |
| `src/app/(authenticated)/college/college-profile/error.tsx` | 0 | 0 | 0 | 0 | 1 / 0 |
| `src/app/(authenticated)/college/faculty-assignment/error.tsx` | 0 | 0 | 0 | 0 | 1 / 0 |

#### `src/app/(authenticated)/college/people/error.tsx`

| Property/state | Legacy file/value | VNext file/value | Strict verification |
| --- | --- | --- | --- |
| Canvas | old-lms-shell-spec.md:18-20: one white #ffffff 12px radius canvas, border #e5e9f0 1px, padding 24px | Shared ErrorState rendered within parent's PageCanvas | **Structural match, actual computed padding not measured** |
| Heading and copy | legacy-styles/components___listing-page-header.scss:52-58: 28px/600/1.3 desktop title, 20px on phone | Route-specific semantic ErrorState title and safe no-false-empty description | **Full heading typography governed by shared UI and known desktop mismatch** |
| Default and error | old-lms-pages.md:6,11: error state inside canvas without masquerading as empty results | ErrorState with secondary Retry action and preserved scope boundaries | **Source behaviour copied; detailed legacy fallback screenshot missing** |
| Loading/disabled/focus | legacy-styles/components___button.scss:13-24 focus transition 150ms, 49-51 disabled; form.scss:22-36 focus-visible halo | Shared Button with focus-visible 2px, retries via reset() | **Shared state source only; no focus/disabled/timeout replay** |
| Responsive phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked, 44px phone touch target | Retry/clear-filter controls min-h-11 below md, md:min-h-9 >=768px | **Source breakpoint aligns, browser viewport proof pending** |
| Accessibility/JSX | old-lms-pages.md:6: readable page content and recovery | ARIA role alert/description owned by ErrorState, Button keyboard action | **Source pattern reviewed, TypeScript parser and browser not run** |

#### `src/app/(authenticated)/college/contacts/error.tsx`

| Property/state | Legacy file/value | VNext file/value | Strict verification |
| --- | --- | --- | --- |
| Canvas | old-lms-shell-spec.md:18-20: one white #ffffff 12px radius canvas, border #e5e9f0 1px, padding 24px | Shared ErrorState rendered within parent's PageCanvas | **Structural match, actual computed padding not measured** |
| Heading and copy | legacy-styles/components___listing-page-header.scss:52-58: 28px/600/1.3 desktop title, 20px on phone | Route-specific semantic ErrorState title and safe no-false-empty description | **Full heading typography governed by shared UI and known desktop mismatch** |
| Default and error | old-lms-pages.md:6,11: error state inside canvas without masquerading as empty results | ErrorState with secondary Retry action and preserved scope boundaries | **Source behaviour copied; detailed legacy fallback screenshot missing** |
| Loading/disabled/focus | legacy-styles/components___button.scss:13-24 focus transition 150ms, 49-51 disabled; form.scss:22-36 focus-visible halo | Shared Button with focus-visible 2px, retries via reset() | **Shared state source only; no focus/disabled/timeout replay** |
| Responsive phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked, 44px phone touch target | Retry/clear-filter controls min-h-11 below md, md:min-h-9 >=768px | **Source breakpoint aligns, browser viewport proof pending** |
| Accessibility/JSX | old-lms-pages.md:6: readable page content and recovery | ARIA role alert/description owned by ErrorState, Button keyboard action | **Source pattern reviewed, TypeScript parser and browser not run** |

#### `src/app/(authenticated)/college/contacts/[membershipId]/error.tsx`

| Property/state | Legacy file/value | VNext file/value | Strict verification |
| --- | --- | --- | --- |
| Canvas | old-lms-shell-spec.md:18-20: one white #ffffff 12px radius canvas, border #e5e9f0 1px, padding 24px | Shared ErrorState rendered within parent's PageCanvas | **Structural match, actual computed padding not measured** |
| Heading and copy | legacy-styles/components___listing-page-header.scss:52-58: 28px/600/1.3 desktop title, 20px on phone | Route-specific semantic ErrorState title and safe no-false-empty description | **Full heading typography governed by shared UI and known desktop mismatch** |
| Default and error | old-lms-pages.md:6,11: error state inside canvas without masquerading as empty results | ErrorState with secondary Retry action and preserved scope boundaries | **Source behaviour copied; detailed legacy fallback screenshot missing** |
| Loading/disabled/focus | legacy-styles/components___button.scss:13-24 focus transition 150ms, 49-51 disabled; form.scss:22-36 focus-visible halo | Shared Button with focus-visible 2px, retries via reset() | **Shared state source only; no focus/disabled/timeout replay** |
| Responsive phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked, 44px phone touch target | Retry/clear-filter controls min-h-11 below md, md:min-h-9 >=768px | **Source breakpoint aligns, browser viewport proof pending** |
| Accessibility/JSX | old-lms-pages.md:6: readable page content and recovery | ARIA role alert/description owned by ErrorState, Button keyboard action | **Source pattern reviewed, TypeScript parser and browser not run** |

#### `src/app/(authenticated)/college/batches/[cohortId]/students/error.tsx`

| Property/state | Legacy file/value | VNext file/value | Strict verification |
| --- | --- | --- | --- |
| Canvas | old-lms-shell-spec.md:18-20: one white #ffffff 12px radius canvas, border #e5e9f0 1px, padding 24px | Shared ErrorState rendered within parent's PageCanvas | **Structural match, actual computed padding not measured** |
| Heading and copy | legacy-styles/components___listing-page-header.scss:52-58: 28px/600/1.3 desktop title, 20px on phone | Route-specific semantic ErrorState title and safe no-false-empty description | **Full heading typography governed by shared UI and known desktop mismatch** |
| Default and error | old-lms-pages.md:6,11: error state inside canvas without masquerading as empty results | ErrorState with secondary Retry action and preserved scope boundaries | **Source behaviour copied; detailed legacy fallback screenshot missing** |
| Loading/disabled/focus | legacy-styles/components___button.scss:13-24 focus transition 150ms, 49-51 disabled; form.scss:22-36 focus-visible halo | Shared Button with focus-visible 2px, retries via reset() | **Shared state source only; no focus/disabled/timeout replay** |
| Responsive phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked, 44px phone touch target | Retry/clear-filter controls min-h-11 below md, md:min-h-9 >=768px | **Source breakpoint aligns, browser viewport proof pending** |
| Accessibility/JSX | old-lms-pages.md:6: readable page content and recovery | ARIA role alert/description owned by ErrorState, Button keyboard action | **Source pattern reviewed, TypeScript parser and browser not run** |

#### `src/app/(authenticated)/college/academics/sections/[sectionId]/error.tsx`

| Property/state | Legacy file/value | VNext file/value | Strict verification |
| --- | --- | --- | --- |
| Canvas | old-lms-shell-spec.md:18-20: one white #ffffff 12px radius canvas, border #e5e9f0 1px, padding 24px | Shared ErrorState rendered within parent's PageCanvas | **Structural match, actual computed padding not measured** |
| Heading and copy | legacy-styles/components___listing-page-header.scss:52-58: 28px/600/1.3 desktop title, 20px on phone | Route-specific semantic ErrorState title and safe no-false-empty description | **Full heading typography governed by shared UI and known desktop mismatch** |
| Default and error | old-lms-pages.md:6,11: error state inside canvas without masquerading as empty results | ErrorState with secondary Retry action and preserved scope boundaries | **Source behaviour copied; detailed legacy fallback screenshot missing** |
| Loading/disabled/focus | legacy-styles/components___button.scss:13-24 focus transition 150ms, 49-51 disabled; form.scss:22-36 focus-visible halo | Shared Button with focus-visible 2px, retries via reset() | **Shared state source only; no focus/disabled/timeout replay** |
| Responsive phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked, 44px phone touch target | Retry/clear-filter controls min-h-11 below md, md:min-h-9 >=768px | **Source breakpoint aligns, browser viewport proof pending** |
| Accessibility/JSX | old-lms-pages.md:6: readable page content and recovery | ARIA role alert/description owned by ErrorState, Button keyboard action | **Source pattern reviewed, TypeScript parser and browser not run** |

#### `src/app/(authenticated)/college/companies/error.tsx`

| Property/state | Legacy file/value | VNext file/value | Strict verification |
| --- | --- | --- | --- |
| Canvas | old-lms-shell-spec.md:18-20: one white #ffffff 12px radius canvas, border #e5e9f0 1px, padding 24px | Shared ErrorState rendered within parent's PageCanvas | **Structural match, actual computed padding not measured** |
| Heading and copy | legacy-styles/components___listing-page-header.scss:52-58: 28px/600/1.3 desktop title, 20px on phone | Route-specific semantic ErrorState title and safe no-false-empty description | **Full heading typography governed by shared UI and known desktop mismatch** |
| Default and error | old-lms-pages.md:6,11: error state inside canvas without masquerading as empty results | ErrorState with secondary Retry action and preserved scope boundaries | **Source behaviour copied; detailed legacy fallback screenshot missing** |
| Loading/disabled/focus | legacy-styles/components___button.scss:13-24 focus transition 150ms, 49-51 disabled; form.scss:22-36 focus-visible halo | Shared Button with focus-visible 2px, retries via reset() | **Shared state source only; no focus/disabled/timeout replay** |
| Responsive phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked, 44px phone touch target | Retry/clear-filter controls min-h-11 below md, md:min-h-9 >=768px | **Source breakpoint aligns, browser viewport proof pending** |
| Accessibility/JSX | old-lms-pages.md:6: readable page content and recovery | ARIA role alert/description owned by ErrorState, Button keyboard action | **Source pattern reviewed, TypeScript parser and browser not run** |

#### `src/app/(authenticated)/college/contacts/[membershipId]/loading.tsx`

| Property/state | Legacy file/value | VNext file/value | Strict verification |
| --- | --- | --- | --- |
| Canvas | old-lms-shell-spec.md:18-20: one white #ffffff 12px radius canvas, border #e5e9f0 1px, padding 24px | Shared GracefulPageLoading is transparent, no inner canvas | **Structural match, actual computed padding not measured** |
| Heading and copy | legacy-styles/components___listing-page-header.scss:52-58: 28px/600/1.3 desktop title, 20px on phone | Descriptive route-specific aria label in shared skeleton | **Full heading typography governed by shared UI and known desktop mismatch** |
| Default and error | old-lms-pages.md:6,11: error state inside canvas without masquerading as empty results | Shared Skeleton with card or directory layout; no error claims | **Source behaviour copied; detailed legacy fallback screenshot missing** |
| Loading/disabled/focus | legacy-styles/components___button.scss:13-24 focus transition 150ms, 49-51 disabled; form.scss:22-36 focus-visible halo | GracefulPageLoading uses shared Skeleton and eventual recovery CTA | **Shared state source only; no focus/disabled/timeout replay** |
| Responsive phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked, 44px phone touch target | Fluid skeleton width, no nested custom fixed dimensions | **Source breakpoint aligns, browser viewport proof pending** |
| Accessibility/JSX | old-lms-pages.md:6: readable page content and recovery | ARIA busy/status owned by shared loader; props restricted to card/directory | **Source pattern reviewed, TypeScript parser and browser not run** |

#### `src/app/(authenticated)/college/batches/[cohortId]/students/loading.tsx`

| Property/state | Legacy file/value | VNext file/value | Strict verification |
| --- | --- | --- | --- |
| Canvas | old-lms-shell-spec.md:18-20: one white #ffffff 12px radius canvas, border #e5e9f0 1px, padding 24px | Shared GracefulPageLoading is transparent, no inner canvas | **Structural match, actual computed padding not measured** |
| Heading and copy | legacy-styles/components___listing-page-header.scss:52-58: 28px/600/1.3 desktop title, 20px on phone | Descriptive route-specific aria label in shared skeleton | **Full heading typography governed by shared UI and known desktop mismatch** |
| Default and error | old-lms-pages.md:6,11: error state inside canvas without masquerading as empty results | Shared Skeleton with card or directory layout; no error claims | **Source behaviour copied; detailed legacy fallback screenshot missing** |
| Loading/disabled/focus | legacy-styles/components___button.scss:13-24 focus transition 150ms, 49-51 disabled; form.scss:22-36 focus-visible halo | GracefulPageLoading uses shared Skeleton and eventual recovery CTA | **Shared state source only; no focus/disabled/timeout replay** |
| Responsive phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked, 44px phone touch target | Fluid skeleton width, no nested custom fixed dimensions | **Source breakpoint aligns, browser viewport proof pending** |
| Accessibility/JSX | old-lms-pages.md:6: readable page content and recovery | ARIA busy/status owned by shared loader; props restricted to card/directory | **Source pattern reviewed, TypeScript parser and browser not run** |

#### `src/app/(authenticated)/college/academics/sections/[sectionId]/loading.tsx`

| Property/state | Legacy file/value | VNext file/value | Strict verification |
| --- | --- | --- | --- |
| Canvas | old-lms-shell-spec.md:18-20: one white #ffffff 12px radius canvas, border #e5e9f0 1px, padding 24px | Shared GracefulPageLoading is transparent, no inner canvas | **Structural match, actual computed padding not measured** |
| Heading and copy | legacy-styles/components___listing-page-header.scss:52-58: 28px/600/1.3 desktop title, 20px on phone | Descriptive route-specific aria label in shared skeleton | **Full heading typography governed by shared UI and known desktop mismatch** |
| Default and error | old-lms-pages.md:6,11: error state inside canvas without masquerading as empty results | Shared Skeleton with card or directory layout; no error claims | **Source behaviour copied; detailed legacy fallback screenshot missing** |
| Loading/disabled/focus | legacy-styles/components___button.scss:13-24 focus transition 150ms, 49-51 disabled; form.scss:22-36 focus-visible halo | GracefulPageLoading uses shared Skeleton and eventual recovery CTA | **Shared state source only; no focus/disabled/timeout replay** |
| Responsive phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked, 44px phone touch target | Fluid skeleton width, no nested custom fixed dimensions | **Source breakpoint aligns, browser viewport proof pending** |
| Accessibility/JSX | old-lms-pages.md:6: readable page content and recovery | ARIA busy/status owned by shared loader; props restricted to card/directory | **Source pattern reviewed, TypeScript parser and browser not run** |

#### `src/app/(authenticated)/college/companies/loading.tsx`

| Property/state | Legacy file/value | VNext file/value | Strict verification |
| --- | --- | --- | --- |
| Canvas | old-lms-shell-spec.md:18-20: one white #ffffff 12px radius canvas, border #e5e9f0 1px, padding 24px | Shared GracefulPageLoading is transparent, no inner canvas | **Structural match, actual computed padding not measured** |
| Heading and copy | legacy-styles/components___listing-page-header.scss:52-58: 28px/600/1.3 desktop title, 20px on phone | Descriptive route-specific aria label in shared skeleton | **Full heading typography governed by shared UI and known desktop mismatch** |
| Default and error | old-lms-pages.md:6,11: error state inside canvas without masquerading as empty results | Shared Skeleton with card or directory layout; no error claims | **Source behaviour copied; detailed legacy fallback screenshot missing** |
| Loading/disabled/focus | legacy-styles/components___button.scss:13-24 focus transition 150ms, 49-51 disabled; form.scss:22-36 focus-visible halo | GracefulPageLoading uses shared Skeleton and eventual recovery CTA | **Shared state source only; no focus/disabled/timeout replay** |
| Responsive phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked, 44px phone touch target | Fluid skeleton width, no nested custom fixed dimensions | **Source breakpoint aligns, browser viewport proof pending** |
| Accessibility/JSX | old-lms-pages.md:6: readable page content and recovery | ARIA busy/status owned by shared loader; props restricted to card/directory | **Source pattern reviewed, TypeScript parser and browser not run** |

#### `src/app/(authenticated)/college/academics/loading.tsx`

| Property/state | Legacy file/value | VNext file/value | Strict verification |
| --- | --- | --- | --- |
| Canvas | old-lms-shell-spec.md:18-20: one white #ffffff 12px radius canvas, border #e5e9f0 1px, padding 24px | Shared GracefulPageLoading is transparent, no inner canvas | **Structural match, actual computed padding not measured** |
| Heading and copy | legacy-styles/components___listing-page-header.scss:52-58: 28px/600/1.3 desktop title, 20px on phone | Descriptive route-specific aria label in shared skeleton | **Full heading typography governed by shared UI and known desktop mismatch** |
| Default and error | old-lms-pages.md:6,11: error state inside canvas without masquerading as empty results | Shared Skeleton with card or directory layout; no error claims | **Source behaviour copied; detailed legacy fallback screenshot missing** |
| Loading/disabled/focus | legacy-styles/components___button.scss:13-24 focus transition 150ms, 49-51 disabled; form.scss:22-36 focus-visible halo | GracefulPageLoading uses shared Skeleton and eventual recovery CTA | **Shared state source only; no focus/disabled/timeout replay** |
| Responsive phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked, 44px phone touch target | Fluid skeleton width, no nested custom fixed dimensions | **Source breakpoint aligns, browser viewport proof pending** |
| Accessibility/JSX | old-lms-pages.md:6: readable page content and recovery | ARIA busy/status owned by shared loader; props restricted to card/directory | **Source pattern reviewed, TypeScript parser and browser not run** |

#### `src/app/(authenticated)/college/college-profile/loading.tsx`

| Property/state | Legacy file/value | VNext file/value | Strict verification |
| --- | --- | --- | --- |
| Canvas | old-lms-shell-spec.md:18-20: one white #ffffff 12px radius canvas, border #e5e9f0 1px, padding 24px | Shared GracefulPageLoading is transparent, no inner canvas | **Structural match, actual computed padding not measured** |
| Heading and copy | legacy-styles/components___listing-page-header.scss:52-58: 28px/600/1.3 desktop title, 20px on phone | Descriptive route-specific aria label in shared skeleton | **Full heading typography governed by shared UI and known desktop mismatch** |
| Default and error | old-lms-pages.md:6,11: error state inside canvas without masquerading as empty results | Shared Skeleton with card or directory layout; no error claims | **Source behaviour copied; detailed legacy fallback screenshot missing** |
| Loading/disabled/focus | legacy-styles/components___button.scss:13-24 focus transition 150ms, 49-51 disabled; form.scss:22-36 focus-visible halo | GracefulPageLoading uses shared Skeleton and eventual recovery CTA | **Shared state source only; no focus/disabled/timeout replay** |
| Responsive phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked, 44px phone touch target | Fluid skeleton width, no nested custom fixed dimensions | **Source breakpoint aligns, browser viewport proof pending** |
| Accessibility/JSX | old-lms-pages.md:6: readable page content and recovery | ARIA busy/status owned by shared loader; props restricted to card/directory | **Source pattern reviewed, TypeScript parser and browser not run** |

#### `src/app/(authenticated)/college/academics/error.tsx`

| Property/state | Legacy file/value | VNext file/value | Strict verification |
| --- | --- | --- | --- |
| Canvas | old-lms-shell-spec.md:18-20: one white #ffffff 12px radius canvas, border #e5e9f0 1px, padding 24px | Shared ErrorState rendered within parent's PageCanvas | **Structural match, actual computed padding not measured** |
| Heading and copy | legacy-styles/components___listing-page-header.scss:52-58: 28px/600/1.3 desktop title, 20px on phone | Route-specific semantic ErrorState title and safe no-false-empty description | **Full heading typography governed by shared UI and known desktop mismatch** |
| Default and error | old-lms-pages.md:6,11: error state inside canvas without masquerading as empty results | ErrorState with secondary Retry action and preserved scope boundaries | **Source behaviour copied; detailed legacy fallback screenshot missing** |
| Loading/disabled/focus | legacy-styles/components___button.scss:13-24 focus transition 150ms, 49-51 disabled; form.scss:22-36 focus-visible halo | Shared Button with focus-visible 2px, retries via reset() | **Shared state source only; no focus/disabled/timeout replay** |
| Responsive phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked, 44px phone touch target | Retry/clear-filter controls min-h-11 below md, md:min-h-9 >=768px | **Source breakpoint aligns, browser viewport proof pending** |
| Accessibility/JSX | old-lms-pages.md:6: readable page content and recovery | ARIA role alert/description owned by ErrorState, Button keyboard action | **Source pattern reviewed, TypeScript parser and browser not run** |

#### `src/app/(authenticated)/college/college-profile/error.tsx`

| Property/state | Legacy file/value | VNext file/value | Strict verification |
| --- | --- | --- | --- |
| Canvas | old-lms-shell-spec.md:18-20: one white #ffffff 12px radius canvas, border #e5e9f0 1px, padding 24px | Shared ErrorState rendered within parent's PageCanvas | **Structural match, actual computed padding not measured** |
| Heading and copy | legacy-styles/components___listing-page-header.scss:52-58: 28px/600/1.3 desktop title, 20px on phone | Route-specific semantic ErrorState title and safe no-false-empty description | **Full heading typography governed by shared UI and known desktop mismatch** |
| Default and error | old-lms-pages.md:6,11: error state inside canvas without masquerading as empty results | ErrorState with secondary Retry action and preserved scope boundaries | **Source behaviour copied; detailed legacy fallback screenshot missing** |
| Loading/disabled/focus | legacy-styles/components___button.scss:13-24 focus transition 150ms, 49-51 disabled; form.scss:22-36 focus-visible halo | Shared Button with focus-visible 2px, retries via reset() | **Shared state source only; no focus/disabled/timeout replay** |
| Responsive phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked, 44px phone touch target | Retry/clear-filter controls min-h-11 below md, md:min-h-9 >=768px | **Source breakpoint aligns, browser viewport proof pending** |
| Accessibility/JSX | old-lms-pages.md:6: readable page content and recovery | ARIA role alert/description owned by ErrorState, Button keyboard action | **Source pattern reviewed, TypeScript parser and browser not run** |

#### `src/app/(authenticated)/college/faculty-assignment/error.tsx`

| Property/state | Legacy file/value | VNext file/value | Strict verification |
| --- | --- | --- | --- |
| Canvas | old-lms-shell-spec.md:18-20: one white #ffffff 12px radius canvas, border #e5e9f0 1px, padding 24px | Shared ErrorState rendered within parent's PageCanvas | **Structural match, actual computed padding not measured** |
| Heading and copy | legacy-styles/components___listing-page-header.scss:52-58: 28px/600/1.3 desktop title, 20px on phone | Route-specific semantic ErrorState title and safe no-false-empty description | **Full heading typography governed by shared UI and known desktop mismatch** |
| Default and error | old-lms-pages.md:6,11: error state inside canvas without masquerading as empty results | ErrorState with secondary Retry action and preserved scope boundaries | **Source behaviour copied; detailed legacy fallback screenshot missing** |
| Loading/disabled/focus | legacy-styles/components___button.scss:13-24 focus transition 150ms, 49-51 disabled; form.scss:22-36 focus-visible halo | Shared Button with focus-visible 2px, retries via reset() | **Shared state source only; no focus/disabled/timeout replay** |
| Responsive phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked, 44px phone touch target | Retry/clear-filter controls min-h-11 below md, md:min-h-9 >=768px | **Source breakpoint aligns, browser viewport proof pending** |
| Accessibility/JSX | old-lms-pages.md:6: readable page content and recovery | ARIA role alert/description owned by ErrorState, Button keyboard action | **Source pattern reviewed, TypeScript parser and browser not run** |

**Strict ticks: 0.** These files have scoped source value/grep/responsive tables but the global grep across all 434 queue items, exact every-state computed legacy CSS, actual mobile/tablet rendered screenshots and TSX compiler/interaction proof remain open. Do not mark these pixel-perfect based on local source-only checks.

**Next exact file:** `src/app/(authenticated)/college/contacts/page.tsx` (then `src/app/(authenticated)/college/contacts/[membershipId]/page.tsx`, remaining College Admin views).


### Replacement chat-4 College Admin contacts directory and detail source audit — 2026-10-20

Both routes were updated and fetched again. Existing College Admin/tenant access checks, read-only masking, filtered CSV, row links, pagination, IST dates and semantic navigation preserved. The contacts directory keeps two native **`type="hidden"`** input fields solely to persist tab and membership selection in GET filters; they are nonvisual form transport, **documented exemptions** rather than hand-rolled user controls.

**Bounded scoped grep:** `/<(button|select|input|textarea|table)\b/g`; `/#[a-f0-9]{3,8}\b/gi`; `/fixed inset-0|role=["']dialog["']/g`; `/<h1\b/g`. For contacts page, raw-control count is exactly the two hidden inputs named tab and membershipId; do not report a fake zero. Name closing/open JSX tag families compared, no orphan closing families observed. Not a whole-route or repository grep.

| Route | Raw controls | Explicit hidden exemptions | Hex literals | Custom overlay | Native h1 | md / sm source prefixes |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `src/app/(authenticated)/college/contacts/page.tsx` | 2 | 2 | 0 | 0 | 0 | 13 / 0 |
| `src/app/(authenticated)/college/contacts/[membershipId]/page.tsx` | 0 | 0 | 0 | 0 | 0 | 1 / 0 |

#### `src/app/(authenticated)/college/contacts/page.tsx`

| Property/state | Legacy source/value | Current value/source | Strict comparison |
| --- | --- | --- | --- |
| Single page canvas | old-lms-shell-spec.md:18-20: one #fff canvas with #e5e9f0 border 1px, radius 12px, 24px padding | Both routes inherit PageCanvas; no extra nested PageCanvas added | **Source matches inherited canvas, exact runtime coordinates not measured** |
| Heading/title | legacy-styles/components___listing-page-header.scss:33-58: 28px/600/1.3 desktop, 20px mobile | Shared PageHeader; detail redundant eyebrow removed; back action PageBackLink | **Shared desktop 30px vs legacy SCSS 28px upstream mismatch** |
| Filters, forms and tabs | legacy-styles/components___form.scss:117-143: radius 10px input, 14px/20px typography, teal focus shadow | Directory shared FilterBar, Tabs, Disclosure, Input/Select with token chrome; 2 hidden transport inputs | **Interactive shared states source reviewed; exact legacy tab underline/focus mismatch not cleared** |
| States/empty/error | old-lms-pages.md:6,11: slim banners, shared empty copy inside single canvas | Directory bookmark banner => Alert(info), zero results => EmptyState with reset; invalid filters => ErrorState | **Exact legacy warning/empty heights not measured** |
| Row/status detail | old-lms-pages.md:6,11: hairline rows and compact pills | Shared DataTable rows, StatusBadge; contact detail StatusBadge(active/warning) | **Pill values inherited; old LMS contact row precise padding not measured** |
| Buttons/hover/focus | old-lms-shell-spec.md:22-24: 36px desktop CTA, radius 9px, 14px/650, 150ms transitions in button.scss:13-24 | Links 44px min-height phone, 36px md+; PageBackLink 44px with focus-visible; shared Button | **Source token contract only; no pressed/hover/disabled browser comparisons** |
| Responsive | legacy-styles/components___listing-page-header.scss:130-153: stacked <=767px and 44px mobile targets, md from 768px | Contact filter grid now single column under 768px, 2 cols at md, 4 lg; DataTable own mobile card threshold 640px | **Known DataTable cutoff discrepancy; mobile/tablet visual proof open** |
| Data/permission no regression | old-lms-pages.md:6: copy and content unaffected by skin work | Two hidden inputs preserve active tab/selected record; private learner contacts remain masked; links remain scoped | **Code path source intact; service calls not executed** |

#### `src/app/(authenticated)/college/contacts/[membershipId]/page.tsx`

| Property/state | Legacy source/value | Current value/source | Strict comparison |
| --- | --- | --- | --- |
| Single page canvas | old-lms-shell-spec.md:18-20: one #fff canvas with #e5e9f0 border 1px, radius 12px, 24px padding | Both routes inherit PageCanvas; no extra nested PageCanvas added | **Source matches inherited canvas, exact runtime coordinates not measured** |
| Heading/title | legacy-styles/components___listing-page-header.scss:33-58: 28px/600/1.3 desktop, 20px mobile | Shared PageHeader; detail redundant eyebrow removed; back action PageBackLink | **Shared desktop 30px vs legacy SCSS 28px upstream mismatch** |
| Filters, forms and tabs | legacy-styles/components___form.scss:117-143: radius 10px input, 14px/20px typography, teal focus shadow | Directory shared FilterBar, Tabs, Disclosure, Input/Select with token chrome; 2 hidden transport inputs | **Interactive shared states source reviewed; exact legacy tab underline/focus mismatch not cleared** |
| States/empty/error | old-lms-pages.md:6,11: slim banners, shared empty copy inside single canvas | Directory bookmark banner => Alert(info), zero results => EmptyState with reset; invalid filters => ErrorState | **Exact legacy warning/empty heights not measured** |
| Row/status detail | old-lms-pages.md:6,11: hairline rows and compact pills | Shared DataTable rows, StatusBadge; contact detail StatusBadge(active/warning) | **Pill values inherited; old LMS contact row precise padding not measured** |
| Buttons/hover/focus | old-lms-shell-spec.md:22-24: 36px desktop CTA, radius 9px, 14px/650, 150ms transitions in button.scss:13-24 | Links 44px min-height phone, 36px md+; PageBackLink 44px with focus-visible; shared Button | **Source token contract only; no pressed/hover/disabled browser comparisons** |
| Responsive | legacy-styles/components___listing-page-header.scss:130-153: stacked <=767px and 44px mobile targets, md from 768px | Contact filter grid now single column under 768px, 2 cols at md, 4 lg; DataTable own mobile card threshold 640px | **Known DataTable cutoff discrepancy; mobile/tablet visual proof open** |
| Data/permission no regression | old-lms-pages.md:6: copy and content unaffected by skin work | Two hidden inputs preserve active tab/selected record; private learner contacts remain masked; links remain scoped | **Code path source intact; service calls not executed** |

**Strict tick: 0.** Runtime keyboard/phone/tablet, exact legacy hover/focus/disabled/loading geometry and full-scope grep all remain open. The two native hidden fields are explicitly exempted as invisible transport controls; every other source control delegates to shared UI. This confirms source migration, not a pixel clone.

**Exact next file:** `src/app/(authenticated)/college/contacts/[membershipId]/loading.tsx` is source-migrated; continue with `src/app/(authenticated)/college/college-profile/page.tsx`, then remaining Academic and Super Admin queue pages.


### Replacement chat-4 College profile, academics and companies screens — 2026-10-20

Three route screens source-migrated. Service calls, tenant/role scope and existing content intact. `college/companies/page.tsx` explicitly migrated the lone native **checkbox** to the existing shared Checkbox component with `name="showDeleted"`, `value="1"`, and uncontrolled checked state unchanged. No native raw controls remain in these three files. No app execution, CI, compiler, browser resize or keyboard replay.

**Scoped grep:** `/<(button|input|select|textarea|table)\b/g`, `/#[a-f0-9]{3,8}\b/gi`, `/fixed inset-0|role=["']dialog["']/g`, `/<h1\b/g`. Full-file text from GitHub after updates. JSX shared/native opening vs closing tag names compared; source scan only, not whole-repo proof.

| File | Native controls | Hex literals | Hand overlays | Native h1 | md/sm source tokens |
| --- | ---: | ---: | ---: | ---: | --- |
| `src/app/(authenticated)/college/college-profile/page.tsx` | 0 | 0 | 0 | 0 | 1/0 |
| `src/app/(authenticated)/college/academics/page.tsx` | 0 | 0 | 0 | 0 | 1/0 |
| `src/app/(authenticated)/college/companies/page.tsx` | 0 | 0 | 0 | 0 | 5/0 |

#### `src/app/(authenticated)/college/college-profile/page.tsx`

| State/property | Legacy file/value | Current source/value | Strict status |
| --- | --- | --- | --- |
| Canvas | old-lms-shell-spec.md:18-20: one white canvas, 1px #e5e9f0 border, 12px radius, 24px padding | PageHeader and section inside authenticated page canvas, no additional nested PageCanvas | **Shared source structure, precise coordinates unmeasured** |
| Header and heading | legacy-styles/components___listing-page-header.scss:33-58: bottom hairline and h1 28px/600/1.3 desktop, 20px phone | Single PageHeader and scoped description; no native h1 | **Shared PageHeader desktop 30px vs legacy 28px unresolved** |
| Buttons and links | old-lms-shell-spec.md:22-24: 36px / radius 9 / 14px / 650, primary teal #0a7c88 with white text | Shared Button/Link styling and tokenized focus, 44px phone min-height, 36px md+ | **Source values largely delegated; all hover/active focus visuals not live measured** |
| Forms and disabled | legacy-styles/components___form.scss:117-143: field radius 10px, 14px/20px, teal focus shadow | Embedded workspace delegates forms to existing shared components | **Source-only; full disabled/focus data not captured** |
| Errors/empty | old-lms-pages.md:6,11: in-canvas errors and no fake empty results | Informational support policy uses Alert(info) | **Shared source contract; legacy exact state palette unknown** |
| Responsive | legacy-styles/components___listing-page-header.scss:130-153: mobile <=767px stacked and touch 44px; desktop >=768 | Branding workspace action min-h-11/md:min-h-9 | **CSS source breakpoint aligned, actual phone/tablet rendering unverified** |

#### `src/app/(authenticated)/college/academics/page.tsx`

| State/property | Legacy file/value | Current source/value | Strict status |
| --- | --- | --- | --- |
| Canvas | old-lms-shell-spec.md:18-20: one white canvas, 1px #e5e9f0 border, 12px radius, 24px padding | PageHeader and section inside authenticated page canvas, no additional nested PageCanvas | **Shared source structure, precise coordinates unmeasured** |
| Header and heading | legacy-styles/components___listing-page-header.scss:33-58: bottom hairline and h1 28px/600/1.3 desktop, 20px phone | Single PageHeader and scoped description; no native h1 | **Shared PageHeader desktop 30px vs legacy 28px unresolved** |
| Buttons and links | old-lms-shell-spec.md:22-24: 36px / radius 9 / 14px / 650, primary teal #0a7c88 with white text | Shared Button/Link styling and tokenized focus, 44px phone min-height, 36px md+ | **Source values largely delegated; all hover/active focus visuals not live measured** |
| Forms and disabled | legacy-styles/components___form.scss:117-143: field radius 10px, 14px/20px, teal focus shadow | Embedded workspace delegates forms to existing shared components | **Source-only; full disabled/focus data not captured** |
| Errors/empty | old-lms-pages.md:6,11: in-canvas errors and no fake empty results | Academics workspace delegates loading/empty/error behavior to module | **Shared source contract; legacy exact state palette unknown** |
| Responsive | legacy-styles/components___listing-page-header.scss:130-153: mobile <=767px stacked and touch 44px; desktop >=768 | Program directory link min-h-11/md:min-h-9 | **CSS source breakpoint aligned, actual phone/tablet rendering unverified** |

#### `src/app/(authenticated)/college/companies/page.tsx`

| State/property | Legacy file/value | Current source/value | Strict status |
| --- | --- | --- | --- |
| Canvas | old-lms-shell-spec.md:18-20: one white canvas, 1px #e5e9f0 border, 12px radius, 24px padding | PageHeader and section inside authenticated page canvas, no additional nested PageCanvas | **Shared source structure, precise coordinates unmeasured** |
| Header and heading | legacy-styles/components___listing-page-header.scss:33-58: bottom hairline and h1 28px/600/1.3 desktop, 20px phone | Single PageHeader and scoped description; no native h1 | **Shared PageHeader desktop 30px vs legacy 28px unresolved** |
| Buttons and links | old-lms-shell-spec.md:22-24: 36px / radius 9 / 14px / 650, primary teal #0a7c88 with white text | Shared Button/Link styling and tokenized focus, 44px phone min-height, 36px md+ | **Source values largely delegated; all hover/active focus visuals not live measured** |
| Forms and disabled | legacy-styles/components___form.scss:117-143: field radius 10px, 14px/20px, teal focus shadow | Companies uses shared Input, Select and Checkbox; GET name/value transport and query untouched | **Source-only; full disabled/focus data not captured** |
| Errors/empty | old-lms-pages.md:6,11: in-canvas errors and no fake empty results | Invalid filters show ErrorState with clear-filter Link; company list delegated to employer relationships | **Shared source contract; legacy exact state palette unknown** |
| Responsive | legacy-styles/components___listing-page-header.scss:130-153: mobile <=767px stacked and touch 44px; desktop >=768 | Company filter flex-wrap, action links min-h-11/md:min-h-9 | **CSS source breakpoint aligned, actual phone/tablet rendering unverified** |

**Strict tick remains 0.** Complete every-state legacy comparison, global grep, responsive screenshots and typechecking absent under lane rules. Checkbox substitution in company filters retains native GET semantics through shared wrapper; not user-tested. No additional page content was added.

**Next exact file:** `src/app/(authenticated)/college/companies/loading.tsx` has shared source proof; continue `src/app/(authenticated)/college/academics/sections/[sectionId]/page.tsx` and other College Admin workspace pages.

### Replacement chat-4 College batch student roster — 2026-10-20

Full-file source grep proof: `/<(button|input|select|textarea|table)\b/g` → 0; `/#[a-f0-9]{3,8}\b/gi` → 0; `/fixed inset-0|role=["']dialog["']/g` → 0; `/<h1\b/g` → 0. Changed JSX shared tags appear balanced in source scan, not parser proven.

| Property/state | Legacy value and file | VNext value and source | Verification |
| --- | --- | --- | --- |
| Canvas | old-lms-shell-spec.md:18-20: white single #fff canvas, 1px #e5e9f0, radius 12px padding 24px | Page owns no nested PageCanvas; filter form now hairline border-t instead of separate custom card | **Inherited layout source matches structure, computed pixel still open** |
| Header/back | legacy-styles/components___listing-page-header.scss:33-58: one heading and hairline title row; mobile back affordance | Shared PageHeader title 'Students · cohort', shared PageBackLink to /college/batches | **Shared desktop 30px vs legacy 28px discrepancy** |
| Filter controls | legacy-styles/components___form.scss:117-143: 10px radius, 14px/20px, teal 2px focus shadow | Shared Input and Select for name + class, Button shared search | **Legacy control family matches shared token model** |
| Empty/table | old-lms-pages.md:6,11: hairline table and scoped no-record state inside canvas | Shared DataTable and EmptyState, no hand-rolled table | **DataTable mobile switch 640px vs 767px legacy remains** |
| Disabled/focus/hover | legacy-styles/components___button.scss:13-24 150ms transition, 49-51 disabled | Shared Button focus-visible, no native button; scoped action renders only when class membership exists | **Source states reviewed, no keyboard/hover replay** |
| Responsive phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: mobile <=767px, 44px target | Filter flex-wrap, Button min-h-11 md:min-h-9, PageBackLink 44px, DataTable responsive | **Source breakpoint partial match, live 375/767/768 views unverified** |

**Strict tick left open.** No app/runtime, CI, TSX parser or responsive screenshots. Full global grep and exact legacy all-state value table remain absent. Original college-scoped query, UUID verification, filters and max 500 rows remain unchanged.

**Next exact file:** `src/app/(authenticated)/college/batches/[cohortId]/students/loading.tsx` is source-refactored; continue to `src/app/(authenticated)/college/classes/page.tsx` and the next unreviewed academic screen.


### Replacement chat-4 academic directories and recovery controls — 2026-10-20

Six College Admin route files (Classes, Batches, Courses index and their error screens) were updated/re-read. Existing query validators, export URLs/limits, related creation forms and directory actions kept. No shared UI or page content changes except normalized PageHeader JSX whitespace. Raw controls remain delegated to underlying child workspace components; no changes to them. No runtime/CI/TSX parser/browser.

**Full file grep for each named route:** `/<(button|input|select|textarea|table)\b/g`; `/#[a-f0-9]{3,8}\b/gi`; `/fixed inset-0|role=["']dialog["']/g`; `/<h1\b/g`. These are exact source-pattern counts, not whole-tree grep; JSX closing tag names compared with openings for page-owned elements.

| Route | Raw styled controls | Hex | Hand overlay | Native h1 | md/sm prefixes |
| --- | ---: | ---: | ---: | ---: | --- |
| `src/app/(authenticated)/college/classes/page.tsx` | 0 | 0 | 0 | 0 | 3/0 |
| `src/app/(authenticated)/college/batches/page.tsx` | 0 | 0 | 0 | 0 | 2/0 |
| `src/app/(authenticated)/college/courses/page.tsx` | 0 | 0 | 0 | 0 | 0/0 |
| `src/app/(authenticated)/college/classes/error.tsx` | 0 | 0 | 0 | 0 | 1/0 |
| `src/app/(authenticated)/college/batches/error.tsx` | 0 | 0 | 0 | 0 | 1/0 |
| `src/app/(authenticated)/college/courses/error.tsx` | 0 | 0 | 0 | 0 | 1/0 |

#### `src/app/(authenticated)/college/classes/page.tsx`

| Property/state | Legacy file/value | vNext source/value | Result |
| --- | --- | --- | --- |
| Canvas | old-lms-shell-spec.md:18-20: single #ffffff, 1px #e5e9f0, radius 12px, padding 24px | Inherited PageCanvas/transparent content wrapper, no nested PageCanvas | **Inherited structure; exact screen measurements absent** |
| Page title/hairline | legacy-styles/components___listing-page-header.scss:33-58: title 28px/600/1.3 with hairline row | Index uses shared PageHeader where owned, details delegated to workspace; errors share ErrorState | **Shared PageHeader title 30px vs legacy 28px still blocked** |
| Action geometry | old-lms-shell-spec.md:22-24: CTA 36px/9px/14px/650, secondary outlined; button.scss:13-24 transition 150ms | Classes/Batches export, preview, clear-filter links have min-h-11 md:min-h-9; Courses PageHeader normalized | **Source touch/focus contract; exact computed hover not checked** |
| Error/default/empty | old-lms-pages.md:6,11: errors distinct from empty rows | Existing validators and directory child own empty/error; page does not manufacture no-data claims | **Source semantics kept; legacy screen-specific empty copy sizes unverified** |
| Loading/disabled | legacy-styles/components___button.scss:49-51 disabled, form.scss:22-36 keyboard focus | Underlying child components and route loading.tsx unchanged; shared UI handles loading | **Only source static review, no state replay** |
| Responsive | legacy-styles/components___listing-page-header.scss:130-153: mobile <=767px stacked, 44px touch | Action links 44px <=767, 36px >=768; child pages use shared layout | **Source values align for touched controls; tablet/phone browser render unverified** |

#### `src/app/(authenticated)/college/batches/page.tsx`

| Property/state | Legacy file/value | vNext source/value | Result |
| --- | --- | --- | --- |
| Canvas | old-lms-shell-spec.md:18-20: single #ffffff, 1px #e5e9f0, radius 12px, padding 24px | Inherited PageCanvas/transparent content wrapper, no nested PageCanvas | **Inherited structure; exact screen measurements absent** |
| Page title/hairline | legacy-styles/components___listing-page-header.scss:33-58: title 28px/600/1.3 with hairline row | Index uses shared PageHeader where owned, details delegated to workspace; errors share ErrorState | **Shared PageHeader title 30px vs legacy 28px still blocked** |
| Action geometry | old-lms-shell-spec.md:22-24: CTA 36px/9px/14px/650, secondary outlined; button.scss:13-24 transition 150ms | Classes/Batches export, preview, clear-filter links have min-h-11 md:min-h-9; Courses PageHeader normalized | **Source touch/focus contract; exact computed hover not checked** |
| Error/default/empty | old-lms-pages.md:6,11: errors distinct from empty rows | Existing validators and directory child own empty/error; page does not manufacture no-data claims | **Source semantics kept; legacy screen-specific empty copy sizes unverified** |
| Loading/disabled | legacy-styles/components___button.scss:49-51 disabled, form.scss:22-36 keyboard focus | Underlying child components and route loading.tsx unchanged; shared UI handles loading | **Only source static review, no state replay** |
| Responsive | legacy-styles/components___listing-page-header.scss:130-153: mobile <=767px stacked, 44px touch | Action links 44px <=767, 36px >=768; child pages use shared layout | **Source values align for touched controls; tablet/phone browser render unverified** |

#### `src/app/(authenticated)/college/courses/page.tsx`

| Property/state | Legacy file/value | vNext source/value | Result |
| --- | --- | --- | --- |
| Canvas | old-lms-shell-spec.md:18-20: single #ffffff, 1px #e5e9f0, radius 12px, padding 24px | Inherited PageCanvas/transparent content wrapper, no nested PageCanvas | **Inherited structure; exact screen measurements absent** |
| Page title/hairline | legacy-styles/components___listing-page-header.scss:33-58: title 28px/600/1.3 with hairline row | Index uses shared PageHeader where owned, details delegated to workspace; errors share ErrorState | **Shared PageHeader title 30px vs legacy 28px still blocked** |
| Action geometry | old-lms-shell-spec.md:22-24: CTA 36px/9px/14px/650, secondary outlined; button.scss:13-24 transition 150ms | Classes/Batches export, preview, clear-filter links have min-h-11 md:min-h-9; Courses PageHeader normalized | **Source touch/focus contract; exact computed hover not checked** |
| Error/default/empty | old-lms-pages.md:6,11: errors distinct from empty rows | Existing validators and directory child own empty/error; page does not manufacture no-data claims | **Source semantics kept; legacy screen-specific empty copy sizes unverified** |
| Loading/disabled | legacy-styles/components___button.scss:49-51 disabled, form.scss:22-36 keyboard focus | Underlying child components and route loading.tsx unchanged; shared UI handles loading | **Only source static review, no state replay** |
| Responsive | legacy-styles/components___listing-page-header.scss:130-153: mobile <=767px stacked, 44px touch | Action links 44px <=767, 36px >=768; child pages use shared layout | **Source values align for touched controls; tablet/phone browser render unverified** |

#### `src/app/(authenticated)/college/classes/error.tsx`

| Property/state | Legacy file/value | vNext source/value | Result |
| --- | --- | --- | --- |
| Canvas | old-lms-shell-spec.md:18-20: single #ffffff, 1px #e5e9f0, radius 12px, padding 24px | Inherited PageCanvas/transparent content wrapper, no nested PageCanvas | **Inherited structure; exact screen measurements absent** |
| Page title/hairline | legacy-styles/components___listing-page-header.scss:33-58: title 28px/600/1.3 with hairline row | Index uses shared PageHeader where owned, details delegated to workspace; errors share ErrorState | **Shared PageHeader title 30px vs legacy 28px still blocked** |
| Action geometry | old-lms-shell-spec.md:22-24: CTA 36px/9px/14px/650, secondary outlined; button.scss:13-24 transition 150ms | Shared secondary Retry Button explicit min-h-11 md:min-h-9 | **Source touch/focus contract; exact computed hover not checked** |
| Error/default/empty | old-lms-pages.md:6,11: errors distinct from empty rows | Scoped ErrorState retains existing message and retry action | **Source semantics kept; legacy screen-specific empty copy sizes unverified** |
| Loading/disabled | legacy-styles/components___button.scss:49-51 disabled, form.scss:22-36 keyboard focus | Retry Button retains shared focus/disabled; no route mutation | **Only source static review, no state replay** |
| Responsive | legacy-styles/components___listing-page-header.scss:130-153: mobile <=767px stacked, 44px touch | Retry 44px <=767, 36px >=768 | **Source values align for touched controls; tablet/phone browser render unverified** |

#### `src/app/(authenticated)/college/batches/error.tsx`

| Property/state | Legacy file/value | vNext source/value | Result |
| --- | --- | --- | --- |
| Canvas | old-lms-shell-spec.md:18-20: single #ffffff, 1px #e5e9f0, radius 12px, padding 24px | Inherited PageCanvas/transparent content wrapper, no nested PageCanvas | **Inherited structure; exact screen measurements absent** |
| Page title/hairline | legacy-styles/components___listing-page-header.scss:33-58: title 28px/600/1.3 with hairline row | Index uses shared PageHeader where owned, details delegated to workspace; errors share ErrorState | **Shared PageHeader title 30px vs legacy 28px still blocked** |
| Action geometry | old-lms-shell-spec.md:22-24: CTA 36px/9px/14px/650, secondary outlined; button.scss:13-24 transition 150ms | Shared secondary Retry Button explicit min-h-11 md:min-h-9 | **Source touch/focus contract; exact computed hover not checked** |
| Error/default/empty | old-lms-pages.md:6,11: errors distinct from empty rows | Scoped ErrorState retains existing message and retry action | **Source semantics kept; legacy screen-specific empty copy sizes unverified** |
| Loading/disabled | legacy-styles/components___button.scss:49-51 disabled, form.scss:22-36 keyboard focus | Retry Button retains shared focus/disabled; no route mutation | **Only source static review, no state replay** |
| Responsive | legacy-styles/components___listing-page-header.scss:130-153: mobile <=767px stacked, 44px touch | Retry 44px <=767, 36px >=768 | **Source values align for touched controls; tablet/phone browser render unverified** |

#### `src/app/(authenticated)/college/courses/error.tsx`

| Property/state | Legacy file/value | vNext source/value | Result |
| --- | --- | --- | --- |
| Canvas | old-lms-shell-spec.md:18-20: single #ffffff, 1px #e5e9f0, radius 12px, padding 24px | Inherited PageCanvas/transparent content wrapper, no nested PageCanvas | **Inherited structure; exact screen measurements absent** |
| Page title/hairline | legacy-styles/components___listing-page-header.scss:33-58: title 28px/600/1.3 with hairline row | Index uses shared PageHeader where owned, details delegated to workspace; errors share ErrorState | **Shared PageHeader title 30px vs legacy 28px still blocked** |
| Action geometry | old-lms-shell-spec.md:22-24: CTA 36px/9px/14px/650, secondary outlined; button.scss:13-24 transition 150ms | Shared secondary Retry Button explicit min-h-11 md:min-h-9 | **Source touch/focus contract; exact computed hover not checked** |
| Error/default/empty | old-lms-pages.md:6,11: errors distinct from empty rows | Scoped ErrorState retains existing message and retry action | **Source semantics kept; legacy screen-specific empty copy sizes unverified** |
| Loading/disabled | legacy-styles/components___button.scss:49-51 disabled, form.scss:22-36 keyboard focus | Retry Button retains shared focus/disabled; no route mutation | **Only source static review, no state replay** |
| Responsive | legacy-styles/components___listing-page-header.scss:130-153: mobile <=767px stacked, 44px touch | Retry 44px <=767, 36px >=768 | **Source values align for touched controls; tablet/phone browser render unverified** |

**Strict ticks: 0 newly checked.** Child directory/modal states, all computed CSS properties, global zero grep and actual phone/tablet/browser focus remain unverified. Keep open per STRICT TICK RULE.

**Next exact file:** `src/app/(authenticated)/college/academics/sections/[sectionId]/page.tsx` (currently delegates to AcademicsSectionPage), then `src/app/(authenticated)/college/classes/recurring-preview/page.tsx` and remaining Academic screens.


### Replacement chat-4: Academic section, recurring preview, attendance core and correction windows — 2026-10-20

**Scope:** seven complete TSX blobs fetched post-update; no changes to `src/components/ui/*`, auth, services, schema, or content-data contracts. Source checks do not substitute for running page state transitions, actual viewport comparisons, TSX compiler or CI. All strict boxes remain OPEN.

**Scoped grep expressions:** `/<(button|input|select|textarea|table)\b/g` (visible/native controls), `/#[a-f0-9]{3,8}\b/gi` (hex), `/fixed inset-0|role=["']dialog["']/g` (hand overlay), `/<h1\b/g`. Full GitHub blob for each below. This is NOT a repository-wide grep; other owners' files and shared components excluded.

| Full file | Raw controls | Hex literals | Manual overlays | h1 | md / sm / lg tokens |
| --- | ---: | ---: | ---: | ---: | --- |
| `src/app/(authenticated)/college/academics/sections/[sectionId]/page.tsx` | 0 | 0 | 0 | 0 | 0 / 0 / 0 |
| `src/app/(authenticated)/college/classes/recurring-preview/page.tsx` | 0 | 0 | 0 | 0 | 0 / 0 / 0 |
| `src/app/(authenticated)/college/attendance/error.tsx` | 0 | 0 | 0 | 0 | 1 / 0 / 0 |
| `src/app/(authenticated)/college/attendance/loading.tsx` | 0 | 0 | 0 | 0 | 0 / 0 / 0 |
| `src/app/(authenticated)/college/attendance/page.tsx` | 0 | 0 | 0 | 0 | 5 / 0 / 0 |
| `src/app/(authenticated)/college/attendance/settings/page.tsx` | 0 | 0 | 0 | 0 | 0 / 0 / 0 |
| `src/app/(authenticated)/college/attendance/corrections/page.tsx` | 0 | 0 | 0 | 0 | 6 / 0 / 0 |

#### `src/app/(authenticated)/college/academics/sections/[sectionId]/page.tsx`

| Property/state | Legacy source/value | Current source/value | Result |
| --- | --- | --- | --- |
| One page canvas | old-lms-shell-spec.md:18-20: #ffffff, border 1px #e5e9f0, 12px radius, 24px padding; no page-level nested cards | Inherits shell canvas; local div/section wrappers do not create a second PageCanvas; parent 'src/app/(authenticated)/college/academics/sections/[sectionId]/page.tsx' | **Source structure only; browser computed values missing** |
| Head/typography | legacy-styles/components___listing-page-header.scss:26-35 hairline; 52-58 title 28px/600/1.3, mobile 20px | Shared PageHeader / ErrorState / GracefulPageLoading in src/app/(authenticated)/college/academics/sections/[sectionId]/page.tsx:not present; central PageHeader currently 30px desktop | **Known 28-vs-30px SCSS mismatch; cannot tick** |
| Control sizes | old-lms-shell-spec.md:22-24: primary #0a7c88 / #fff text, 36px height, radius 9px, font 14px weight 650; secondary white/hairline 36px | Actions handled via shared PageBackLink or link classes; no native action button | **Source touch targets match; all hover/active states unverified** |
| Focus/disabled/loading | legacy-styles/components___button.scss:13-24 150ms transitions, :disabled 49-51; form.scss:22-36 keyboard focus-visible | Inherited shared controls, focus outlines and busy state are child-component-owned | **State source comparison only; no keyboard/mutation playback** |
| Error and empty | old-lms-pages.md:6,11: in-canvas error, slim banners, no fake empty table | Read-only data/error composition preserved; no artificial no-data claim | **Shared semantics; exact colours / paddings not legacy measured** |
| Phone and tablet | legacy-styles/components___listing-page-header.scss:130-153 at <=767px stack, h1 20px; touch >=44px | No extra fixed-width wrapper, section internals delegate shared Responsive layout | **Source media rules only; 375/767/768px screenshots missing** |
| Markup / permission | old-lms-pages.md:6: content/data behavior unchanged | Scoped existing request-context and service calls preserved; no local raw form/table markup, no handwritten modal | **Open/close tag scan is not a TSX parser; no regression testing** |

#### `src/app/(authenticated)/college/classes/recurring-preview/page.tsx`

| Property/state | Legacy source/value | Current source/value | Result |
| --- | --- | --- | --- |
| One page canvas | old-lms-shell-spec.md:18-20: #ffffff, border 1px #e5e9f0, 12px radius, 24px padding; no page-level nested cards | Inherits shell canvas; local div/section wrappers do not create a second PageCanvas; parent 'src/app/(authenticated)/college/classes/recurring-preview/page.tsx' | **Source structure only; browser computed values missing** |
| Head/typography | legacy-styles/components___listing-page-header.scss:26-35 hairline; 52-58 title 28px/600/1.3, mobile 20px | Shared PageHeader / ErrorState / GracefulPageLoading in src/app/(authenticated)/college/classes/recurring-preview/page.tsx:18; central PageHeader currently 30px desktop | **Known 28-vs-30px SCSS mismatch; cannot tick** |
| Control sizes | old-lms-shell-spec.md:22-24: primary #0a7c88 / #fff text, 36px height, radius 9px, font 14px weight 650; secondary white/hairline 36px | Actions handled via shared PageBackLink or link classes; no native action button | **Source touch targets match; all hover/active states unverified** |
| Focus/disabled/loading | legacy-styles/components___button.scss:13-24 150ms transitions, :disabled 49-51; form.scss:22-36 keyboard focus-visible | Inherited shared controls, focus outlines and busy state are child-component-owned | **State source comparison only; no keyboard/mutation playback** |
| Error and empty | old-lms-pages.md:6,11: in-canvas error, slim banners, no fake empty table | Read-only data/error composition preserved; no artificial no-data claim | **Shared semantics; exact colours / paddings not legacy measured** |
| Phone and tablet | legacy-styles/components___listing-page-header.scss:130-153 at <=767px stack, h1 20px; touch >=44px | md breakpoint 768px, direct links 44px below md, no new absolute/fixed content | **Source media rules only; 375/767/768px screenshots missing** |
| Markup / permission | old-lms-pages.md:6: content/data behavior unchanged | Scoped existing request-context and service calls preserved; no local raw form/table markup, no handwritten modal | **Open/close tag scan is not a TSX parser; no regression testing** |

#### `src/app/(authenticated)/college/attendance/error.tsx`

| Property/state | Legacy source/value | Current source/value | Result |
| --- | --- | --- | --- |
| One page canvas | old-lms-shell-spec.md:18-20: #ffffff, border 1px #e5e9f0, 12px radius, 24px padding; no page-level nested cards | Inherits shell canvas; local div/section wrappers do not create a second PageCanvas; parent 'src/app/(authenticated)/college/attendance/error.tsx' | **Source structure only; browser computed values missing** |
| Head/typography | legacy-styles/components___listing-page-header.scss:26-35 hairline; 52-58 title 28px/600/1.3, mobile 20px | Shared PageHeader / ErrorState / GracefulPageLoading in src/app/(authenticated)/college/attendance/error.tsx:not present; central PageHeader currently 30px desktop | **Known 28-vs-30px SCSS mismatch; cannot tick** |
| Control sizes | old-lms-shell-spec.md:22-24: primary #0a7c88 / #fff text, 36px height, radius 9px, font 14px weight 650; secondary white/hairline 36px | Actions handled via shared Button with min-h-11 md:min-h-9 | **Source touch targets match; all hover/active states unverified** |
| Focus/disabled/loading | legacy-styles/components___button.scss:13-24 150ms transitions, :disabled 49-51; form.scss:22-36 keyboard focus-visible | ErrorState secondary Retry (reset callback), 44px phone and 36px desktop | **State source comparison only; no keyboard/mutation playback** |
| Error and empty | old-lms-pages.md:6,11: in-canvas error, slim banners, no fake empty table | Scoped ErrorState title/description with safe retry | **Shared semantics; exact colours / paddings not legacy measured** |
| Phone and tablet | legacy-styles/components___listing-page-header.scss:130-153 at <=767px stack, h1 20px; touch >=44px | md breakpoint 768px, direct links 44px below md, no new absolute/fixed content | **Source media rules only; 375/767/768px screenshots missing** |
| Markup / permission | old-lms-pages.md:6: content/data behavior unchanged | Scoped existing request-context and service calls preserved; no local raw form/table markup, no handwritten modal | **Open/close tag scan is not a TSX parser; no regression testing** |

#### `src/app/(authenticated)/college/attendance/loading.tsx`

| Property/state | Legacy source/value | Current source/value | Result |
| --- | --- | --- | --- |
| One page canvas | old-lms-shell-spec.md:18-20: #ffffff, border 1px #e5e9f0, 12px radius, 24px padding; no page-level nested cards | Inherits shell canvas; local div/section wrappers do not create a second PageCanvas; parent 'src/app/(authenticated)/college/attendance/loading.tsx' | **Source structure only; browser computed values missing** |
| Head/typography | legacy-styles/components___listing-page-header.scss:26-35 hairline; 52-58 title 28px/600/1.3, mobile 20px | Shared PageHeader / ErrorState / GracefulPageLoading in src/app/(authenticated)/college/attendance/loading.tsx:not present; central PageHeader currently 30px desktop | **Known 28-vs-30px SCSS mismatch; cannot tick** |
| Control sizes | old-lms-shell-spec.md:22-24: primary #0a7c88 / #fff text, 36px height, radius 9px, font 14px weight 650; secondary white/hairline 36px | Actions handled via shared PageBackLink or link classes; no native action button | **Source touch targets match; all hover/active states unverified** |
| Focus/disabled/loading | legacy-styles/components___button.scss:13-24 150ms transitions, :disabled 49-51; form.scss:22-36 keyboard focus-visible | GracefulPageLoading(card/directory) owns shared Skeleton and delayed retry | **State source comparison only; no keyboard/mutation playback** |
| Error and empty | old-lms-pages.md:6,11: in-canvas error, slim banners, no fake empty table | No false empty content while skeleton is busy | **Shared semantics; exact colours / paddings not legacy measured** |
| Phone and tablet | legacy-styles/components___listing-page-header.scss:130-153 at <=767px stack, h1 20px; touch >=44px | md breakpoint 768px, direct links 44px below md, no new absolute/fixed content | **Source media rules only; 375/767/768px screenshots missing** |
| Markup / permission | old-lms-pages.md:6: content/data behavior unchanged | Scoped existing request-context and service calls preserved; no local raw form/table markup, no handwritten modal | **Open/close tag scan is not a TSX parser; no regression testing** |

#### `src/app/(authenticated)/college/attendance/page.tsx`

| Property/state | Legacy source/value | Current source/value | Result |
| --- | --- | --- | --- |
| One page canvas | old-lms-shell-spec.md:18-20: #ffffff, border 1px #e5e9f0, 12px radius, 24px padding; no page-level nested cards | Inherits shell canvas; local div/section wrappers do not create a second PageCanvas; parent 'src/app/(authenticated)/college/attendance/page.tsx' | **Source structure only; browser computed values missing** |
| Head/typography | legacy-styles/components___listing-page-header.scss:26-35 hairline; 52-58 title 28px/600/1.3, mobile 20px | Shared PageHeader / ErrorState / GracefulPageLoading in src/app/(authenticated)/college/attendance/page.tsx:117; central PageHeader currently 30px desktop | **Known 28-vs-30px SCSS mismatch; cannot tick** |
| Control sizes | old-lms-shell-spec.md:22-24: primary #0a7c88 / #fff text, 36px height, radius 9px, font 14px weight 650; secondary white/hairline 36px | Actions handled via shared PageBackLink or link classes; no native action button | **Source touch targets match; all hover/active states unverified** |
| Focus/disabled/loading | legacy-styles/components___button.scss:13-24 150ms transitions, :disabled 49-51; form.scss:22-36 keyboard focus-visible | Inherited shared controls, focus outlines and busy state are child-component-owned | **State source comparison only; no keyboard/mutation playback** |
| Error and empty | old-lms-pages.md:6,11: in-canvas error, slim banners, no fake empty table | Read-only data/error composition preserved; no artificial no-data claim | **Shared semantics; exact colours / paddings not legacy measured** |
| Phone and tablet | legacy-styles/components___listing-page-header.scss:130-153 at <=767px stack, h1 20px; touch >=44px | md breakpoint 768px, direct links 44px below md, no new absolute/fixed content | **Source media rules only; 375/767/768px screenshots missing** |
| Markup / permission | old-lms-pages.md:6: content/data behavior unchanged | Scoped existing request-context and service calls preserved; no local raw form/table markup, no handwritten modal | **Open/close tag scan is not a TSX parser; no regression testing** |

#### `src/app/(authenticated)/college/attendance/settings/page.tsx`

| Property/state | Legacy source/value | Current source/value | Result |
| --- | --- | --- | --- |
| One page canvas | old-lms-shell-spec.md:18-20: #ffffff, border 1px #e5e9f0, 12px radius, 24px padding; no page-level nested cards | Inherits shell canvas; local div/section wrappers do not create a second PageCanvas; parent 'src/app/(authenticated)/college/attendance/settings/page.tsx' | **Source structure only; browser computed values missing** |
| Head/typography | legacy-styles/components___listing-page-header.scss:26-35 hairline; 52-58 title 28px/600/1.3, mobile 20px | Shared PageHeader / ErrorState / GracefulPageLoading in src/app/(authenticated)/college/attendance/settings/page.tsx:31; central PageHeader currently 30px desktop | **Known 28-vs-30px SCSS mismatch; cannot tick** |
| Control sizes | old-lms-shell-spec.md:22-24: primary #0a7c88 / #fff text, 36px height, radius 9px, font 14px weight 650; secondary white/hairline 36px | Actions handled via shared PageBackLink or link classes; no native action button | **Source touch targets match; all hover/active states unverified** |
| Focus/disabled/loading | legacy-styles/components___button.scss:13-24 150ms transitions, :disabled 49-51; form.scss:22-36 keyboard focus-visible | Inherited shared controls, focus outlines and busy state are child-component-owned | **State source comparison only; no keyboard/mutation playback** |
| Error and empty | old-lms-pages.md:6,11: in-canvas error, slim banners, no fake empty table | Read-only data/error composition preserved; no artificial no-data claim | **Shared semantics; exact colours / paddings not legacy measured** |
| Phone and tablet | legacy-styles/components___listing-page-header.scss:130-153 at <=767px stack, h1 20px; touch >=44px | md breakpoint 768px, direct links 44px below md, no new absolute/fixed content | **Source media rules only; 375/767/768px screenshots missing** |
| Markup / permission | old-lms-pages.md:6: content/data behavior unchanged | Scoped existing request-context and service calls preserved; no local raw form/table markup, no handwritten modal | **Open/close tag scan is not a TSX parser; no regression testing** |

#### `src/app/(authenticated)/college/attendance/corrections/page.tsx`

| Property/state | Legacy source/value | Current source/value | Result |
| --- | --- | --- | --- |
| One page canvas | old-lms-shell-spec.md:18-20: #ffffff, border 1px #e5e9f0, 12px radius, 24px padding; no page-level nested cards | Inherits shell canvas; local div/section wrappers do not create a second PageCanvas; parent 'src/app/(authenticated)/college/attendance/corrections/page.tsx' | **Source structure only; browser computed values missing** |
| Head/typography | legacy-styles/components___listing-page-header.scss:26-35 hairline; 52-58 title 28px/600/1.3, mobile 20px | Shared PageHeader / ErrorState / GracefulPageLoading in src/app/(authenticated)/college/attendance/corrections/page.tsx:25; central PageHeader currently 30px desktop | **Known 28-vs-30px SCSS mismatch; cannot tick** |
| Control sizes | old-lms-shell-spec.md:22-24: primary #0a7c88 / #fff text, 36px height, radius 9px, font 14px weight 650; secondary white/hairline 36px | Actions handled via shared Input/Date and Button min-h-11 md:min-h-9 | **Source touch targets match; all hover/active states unverified** |
| Focus/disabled/loading | legacy-styles/components___button.scss:13-24 150ms transitions, :disabled 49-51; form.scss:22-36 keyboard focus-visible | Inherited shared controls, focus outlines and busy state are child-component-owned | **State source comparison only; no keyboard/mutation playback** |
| Error and empty | old-lms-pages.md:6,11: in-canvas error, slim banners, no fake empty table | Alert(info/warning) and EmptyState for absent session rows, no nested individual cards | **Shared semantics; exact colours / paddings not legacy measured** |
| Phone and tablet | legacy-styles/components___listing-page-header.scss:130-153 at <=767px stack, h1 20px; touch >=44px | Form flex wraps, md:grid-cols-3 only at >=768px, controls min-h-11 on phone | **Source media rules only; 375/767/768px screenshots missing** |
| Markup / permission | old-lms-pages.md:6: content/data behavior unchanged | Scoped existing request-context and service calls preserved; no local raw form/table markup, no handwritten modal | **Open/close tag scan is not a TSX parser; no regression testing** |

**Strict status:** 0 newly checked. Known upstream typography mismatch and unobserved browser renders/focus plus no full-scoped zero-grep mean source migration only. `AcademicsSectionPage` caller explicitly passes an empty `eyebrow` string because the callee's TypeScript prop is required; shared header renders no extra eyebrow when blank. No application, build, CI or screenshots.


### Replacement chat-4: Department attendance, policy fallbacks, branding and verification routes — 2026-10-20

**Scope:** seven touched College Admin TSX files; all state changes are purely to shared UI anatomy or error/loading presentation; authorization, data copy and service semantics preserved. Scoped grep uses whole fetched file, **not** global repository coverage. No UI shared component changed or CI/browser compiled.

| File | Raw `<button/input/select/textarea/table>` | Hard-coded hex | Inline fixed/dialog overlay | Native h1 | md / sm prefixes | Orphan closing tag families |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| `src/app/(authenticated)/college/attendance/corrections/error.tsx` | 0 | 0 | 0 | 0 | 1/0 | none found |
| `src/app/(authenticated)/college/attendance/departments/error.tsx` | 0 | 0 | 0 | 0 | 1/0 | none found |
| `src/app/(authenticated)/college/attendance/departments/page.tsx` | 0 | 0 | 0 | 0 | 1/0 | none found |
| `src/app/(authenticated)/college/attendance/settings/error.tsx` | 0 | 0 | 0 | 0 | 1/0 | none found |
| `src/app/(authenticated)/college/attendance/settings/loading.tsx` | 0 | 0 | 0 | 0 | 0/0 | none found |
| `src/app/(authenticated)/college/branding/page.tsx` | 0 | 0 | 0 | 0 | 0/0 | none found |
| `src/app/(authenticated)/college/verification/page.tsx` | 0 | 0 | 0 | 0 | 2/0 | none found |

**Per-file scoped grep:** `/<(button|input|select|textarea|table)\b/g`, `/#[a-f0-9]{3,8}\b/gi`, `/fixed inset-0|role=["']dialog["']/g`, `/<h1\b/g`. The source counts and tag family checks above were gathered from post-save contents. Native JSX parser and keyboard tests were not executed.

#### `src/app/(authenticated)/college/attendance/corrections/error.tsx`

| Property/state | Old LMS source/value | vNext source/value | Status |
| --- | --- | --- | --- |
| Default page surface | old-lms-shell-spec.md:18-20: app #f1f4f9 + ONE white canvas #fff, 1px #e5e9f0 radius12 padding24 | Scoped ErrorState + shared Button secondary Retry, 44px before 768px, 36px from md; no page-level handbuilt overlay | **Shared structure, measured browser geometry pending** |
| Header font/row | legacy-styles/components___listing-page-header.scss:26-35 single row with 1px border; 52-58 title 28px / 600 / 1.3 | Existing PageHeader handles title; central shared header renders 30px desktop and 20px below md | **28 vs 30 old-listing mismatch still unresolved** |
| Button default/secondary | old-lms-shell-spec.md:22-24: 36px/radius9, 14px/650, primary #0a7c88 /white; secondary white/hairline | Scoped ErrorState + shared Button secondary Retry, 44px before 768px, 36px from md; no page-level handbuilt overlay | **Source variant and touch size checked, exact colour state not rendered** |
| Focus/hover/disabled | legacy-styles/components___button.scss:13-24 transition 150ms, 49-51 disabled; form.scss:22-36 :focus-visible keyboard | Shared Button focus-visible on retry, no new disabled action | **Upstream tokens presumed; active/focus live test missing** |
| Error/loading/empty | old-lms-pages.md:6,11-12: in-canvas notices, pale yellow slim info bar; no fake no-data | Scoped ErrorState + shared Button secondary Retry, 44px before 768px, 36px from md; no page-level handbuilt overlay | **Shared treatment but no legacy screenshot of this route** |
| Responsive 767/768 | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked, title 20px; mobile 44px targets | Scoped ErrorState + shared Button secondary Retry, 44px before 768px, 36px from md; no page-level handbuilt overlay; md classes switch at 768px where touched | **Source media clauses reviewed, 375px/768px computed screenshot missing** |
| No visual regression | old-lms-pages.md:6: continuous canvas and data copy unaffected | Permission checks, source service reads and original routed content unchanged | **Source only; no TSX typecheck/CI or browser replay** |

#### `src/app/(authenticated)/college/attendance/departments/error.tsx`

| Property/state | Old LMS source/value | vNext source/value | Status |
| --- | --- | --- | --- |
| Default page surface | old-lms-shell-spec.md:18-20: app #f1f4f9 + ONE white canvas #fff, 1px #e5e9f0 radius12 padding24 | Scoped ErrorState + shared Button secondary Retry, 44px before 768px, 36px from md; no page-level handbuilt overlay | **Shared structure, measured browser geometry pending** |
| Header font/row | legacy-styles/components___listing-page-header.scss:26-35 single row with 1px border; 52-58 title 28px / 600 / 1.3 | Existing PageHeader handles title; central shared header renders 30px desktop and 20px below md | **28 vs 30 old-listing mismatch still unresolved** |
| Button default/secondary | old-lms-shell-spec.md:22-24: 36px/radius9, 14px/650, primary #0a7c88 /white; secondary white/hairline | Scoped ErrorState + shared Button secondary Retry, 44px before 768px, 36px from md; no page-level handbuilt overlay | **Source variant and touch size checked, exact colour state not rendered** |
| Focus/hover/disabled | legacy-styles/components___button.scss:13-24 transition 150ms, 49-51 disabled; form.scss:22-36 :focus-visible keyboard | Shared Button focus-visible on retry, no new disabled action | **Upstream tokens presumed; active/focus live test missing** |
| Error/loading/empty | old-lms-pages.md:6,11-12: in-canvas notices, pale yellow slim info bar; no fake no-data | Scoped ErrorState + shared Button secondary Retry, 44px before 768px, 36px from md; no page-level handbuilt overlay | **Shared treatment but no legacy screenshot of this route** |
| Responsive 767/768 | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked, title 20px; mobile 44px targets | Scoped ErrorState + shared Button secondary Retry, 44px before 768px, 36px from md; no page-level handbuilt overlay; md classes switch at 768px where touched | **Source media clauses reviewed, 375px/768px computed screenshot missing** |
| No visual regression | old-lms-pages.md:6: continuous canvas and data copy unaffected | Permission checks, source service reads and original routed content unchanged | **Source only; no TSX typecheck/CI or browser replay** |

#### `src/app/(authenticated)/college/attendance/departments/page.tsx`

| Property/state | Old LMS source/value | vNext source/value | Status |
| --- | --- | --- | --- |
| Default page surface | old-lms-shell-spec.md:18-20: app #f1f4f9 + ONE white canvas #fff, 1px #e5e9f0 radius12 padding24 | Read-only CollegeDepartmentInsights delegation; invalid filters retain ErrorState and 44px reset-link | **Shared structure, measured browser geometry pending** |
| Header font/row | legacy-styles/components___listing-page-header.scss:26-35 single row with 1px border; 52-58 title 28px / 600 / 1.3 | Existing PageHeader handles title; central shared header renders 30px desktop and 20px below md | **28 vs 30 old-listing mismatch still unresolved** |
| Button default/secondary | old-lms-shell-spec.md:22-24: 36px/radius9, 14px/650, primary #0a7c88 /white; secondary white/hairline | Read-only CollegeDepartmentInsights delegation; invalid filters retain ErrorState and 44px reset-link | **Source variant and touch size checked, exact colour state not rendered** |
| Focus/hover/disabled | legacy-styles/components___button.scss:13-24 transition 150ms, 49-51 disabled; form.scss:22-36 :focus-visible keyboard | Existing shared child components own hover/loading/permission checks | **Upstream tokens presumed; active/focus live test missing** |
| Error/loading/empty | old-lms-pages.md:6,11-12: in-canvas notices, pale yellow slim info bar; no fake no-data | Read-only CollegeDepartmentInsights delegation; invalid filters retain ErrorState and 44px reset-link | **Shared treatment but no legacy screenshot of this route** |
| Responsive 767/768 | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked, title 20px; mobile 44px targets | Read-only CollegeDepartmentInsights delegation; invalid filters retain ErrorState and 44px reset-link; md classes switch at 768px where touched | **Source media clauses reviewed, 375px/768px computed screenshot missing** |
| No visual regression | old-lms-pages.md:6: continuous canvas and data copy unaffected | Permission checks, source service reads and original routed content unchanged | **Source only; no TSX typecheck/CI or browser replay** |

#### `src/app/(authenticated)/college/attendance/settings/error.tsx`

| Property/state | Old LMS source/value | vNext source/value | Status |
| --- | --- | --- | --- |
| Default page surface | old-lms-shell-spec.md:18-20: app #f1f4f9 + ONE white canvas #fff, 1px #e5e9f0 radius12 padding24 | Scoped ErrorState + shared Button secondary Retry, 44px before 768px, 36px from md; no page-level handbuilt overlay | **Shared structure, measured browser geometry pending** |
| Header font/row | legacy-styles/components___listing-page-header.scss:26-35 single row with 1px border; 52-58 title 28px / 600 / 1.3 | Existing PageHeader handles title; central shared header renders 30px desktop and 20px below md | **28 vs 30 old-listing mismatch still unresolved** |
| Button default/secondary | old-lms-shell-spec.md:22-24: 36px/radius9, 14px/650, primary #0a7c88 /white; secondary white/hairline | Scoped ErrorState + shared Button secondary Retry, 44px before 768px, 36px from md; no page-level handbuilt overlay | **Source variant and touch size checked, exact colour state not rendered** |
| Focus/hover/disabled | legacy-styles/components___button.scss:13-24 transition 150ms, 49-51 disabled; form.scss:22-36 :focus-visible keyboard | Shared Button focus-visible on retry, no new disabled action | **Upstream tokens presumed; active/focus live test missing** |
| Error/loading/empty | old-lms-pages.md:6,11-12: in-canvas notices, pale yellow slim info bar; no fake no-data | Scoped ErrorState + shared Button secondary Retry, 44px before 768px, 36px from md; no page-level handbuilt overlay | **Shared treatment but no legacy screenshot of this route** |
| Responsive 767/768 | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked, title 20px; mobile 44px targets | Scoped ErrorState + shared Button secondary Retry, 44px before 768px, 36px from md; no page-level handbuilt overlay; md classes switch at 768px where touched | **Source media clauses reviewed, 375px/768px computed screenshot missing** |
| No visual regression | old-lms-pages.md:6: continuous canvas and data copy unaffected | Permission checks, source service reads and original routed content unchanged | **Source only; no TSX typecheck/CI or browser replay** |

#### `src/app/(authenticated)/college/attendance/settings/loading.tsx`

| Property/state | Old LMS source/value | vNext source/value | Status |
| --- | --- | --- | --- |
| Default page surface | old-lms-shell-spec.md:18-20: app #f1f4f9 + ONE white canvas #fff, 1px #e5e9f0 radius12 padding24 | GracefulPageLoading with supported shape='card' and label, shared skeleton, no custom loading boxes | **Shared structure, measured browser geometry pending** |
| Header font/row | legacy-styles/components___listing-page-header.scss:26-35 single row with 1px border; 52-58 title 28px / 600 / 1.3 | Existing PageHeader handles title; central shared header renders 30px desktop and 20px below md | **28 vs 30 old-listing mismatch still unresolved** |
| Button default/secondary | old-lms-shell-spec.md:22-24: 36px/radius9, 14px/650, primary #0a7c88 /white; secondary white/hairline | GracefulPageLoading with supported shape='card' and label, shared skeleton, no custom loading boxes | **Source variant and touch size checked, exact colour state not rendered** |
| Focus/hover/disabled | legacy-styles/components___button.scss:13-24 transition 150ms, 49-51 disabled; form.scss:22-36 :focus-visible keyboard | Graceful loading skeleton + deferred recovery from shared component | **Upstream tokens presumed; active/focus live test missing** |
| Error/loading/empty | old-lms-pages.md:6,11-12: in-canvas notices, pale yellow slim info bar; no fake no-data | GracefulPageLoading with supported shape='card' and label, shared skeleton, no custom loading boxes | **Shared treatment but no legacy screenshot of this route** |
| Responsive 767/768 | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked, title 20px; mobile 44px targets | GracefulPageLoading with supported shape='card' and label, shared skeleton, no custom loading boxes; md classes switch at 768px where touched | **Source media clauses reviewed, 375px/768px computed screenshot missing** |
| No visual regression | old-lms-pages.md:6: continuous canvas and data copy unaffected | Permission checks, source service reads and original routed content unchanged | **Source only; no TSX typecheck/CI or browser replay** |

#### `src/app/(authenticated)/college/branding/page.tsx`

| Property/state | Old LMS source/value | vNext source/value | Status |
| --- | --- | --- | --- |
| Default page surface | old-lms-shell-spec.md:18-20: app #f1f4f9 + ONE white canvas #fff, 1px #e5e9f0 radius12 padding24 | Branding view Alert(info) for Super-Admin-only changes, shared PageHeader, existing upload and form props | **Shared structure, measured browser geometry pending** |
| Header font/row | legacy-styles/components___listing-page-header.scss:26-35 single row with 1px border; 52-58 title 28px / 600 / 1.3 | Existing PageHeader handles title; central shared header renders 30px desktop and 20px below md | **28 vs 30 old-listing mismatch still unresolved** |
| Button default/secondary | old-lms-shell-spec.md:22-24: 36px/radius9, 14px/650, primary #0a7c88 /white; secondary white/hairline | Branding view Alert(info) for Super-Admin-only changes, shared PageHeader, existing upload and form props | **Source variant and touch size checked, exact colour state not rendered** |
| Focus/hover/disabled | legacy-styles/components___button.scss:13-24 transition 150ms, 49-51 disabled; form.scss:22-36 :focus-visible keyboard | Existing shared child components own hover/loading/permission checks | **Upstream tokens presumed; active/focus live test missing** |
| Error/loading/empty | old-lms-pages.md:6,11-12: in-canvas notices, pale yellow slim info bar; no fake no-data | Branding view Alert(info) for Super-Admin-only changes, shared PageHeader, existing upload and form props | **Shared treatment but no legacy screenshot of this route** |
| Responsive 767/768 | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked, title 20px; mobile 44px targets | Branding view Alert(info) for Super-Admin-only changes, shared PageHeader, existing upload and form props; md classes switch at 768px where touched | **Source media clauses reviewed, 375px/768px computed screenshot missing** |
| No visual regression | old-lms-pages.md:6: continuous canvas and data copy unaffected | Permission checks, source service reads and original routed content unchanged | **Source only; no TSX typecheck/CI or browser replay** |

#### `src/app/(authenticated)/college/verification/page.tsx`

| Property/state | Old LMS source/value | vNext source/value | Status |
| --- | --- | --- | --- |
| Default page surface | old-lms-shell-spec.md:18-20: app #f1f4f9 + ONE white canvas #fff, 1px #e5e9f0 radius12 padding24 | Verification failures display shared ErrorState and PageHeader in one inherited canvas; clear/retry links now min-h-11 md:min-h-9; nested p-4 removed | **Shared structure, measured browser geometry pending** |
| Header font/row | legacy-styles/components___listing-page-header.scss:26-35 single row with 1px border; 52-58 title 28px / 600 / 1.3 | Existing PageHeader handles title; central shared header renders 30px desktop and 20px below md | **28 vs 30 old-listing mismatch still unresolved** |
| Button default/secondary | old-lms-shell-spec.md:22-24: 36px/radius9, 14px/650, primary #0a7c88 /white; secondary white/hairline | Verification failures display shared ErrorState and PageHeader in one inherited canvas; clear/retry links now min-h-11 md:min-h-9; nested p-4 removed | **Source variant and touch size checked, exact colour state not rendered** |
| Focus/hover/disabled | legacy-styles/components___button.scss:13-24 transition 150ms, 49-51 disabled; form.scss:22-36 :focus-visible keyboard | Existing shared child components own hover/loading/permission checks | **Upstream tokens presumed; active/focus live test missing** |
| Error/loading/empty | old-lms-pages.md:6,11-12: in-canvas notices, pale yellow slim info bar; no fake no-data | Verification failures display shared ErrorState and PageHeader in one inherited canvas; clear/retry links now min-h-11 md:min-h-9; nested p-4 removed | **Shared treatment but no legacy screenshot of this route** |
| Responsive 767/768 | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked, title 20px; mobile 44px targets | Verification failures display shared ErrorState and PageHeader in one inherited canvas; clear/retry links now min-h-11 md:min-h-9; nested p-4 removed; md classes switch at 768px where touched | **Source media clauses reviewed, 375px/768px computed screenshot missing** |
| No visual regression | old-lms-pages.md:6: continuous canvas and data copy unaffected | Permission checks, source service reads and original routed content unchanged | **Source only; no TSX typecheck/CI or browser replay** |

**Strict tick count:** 0 newly complete, because exact all-state, all-property side-by-side source values and 375/767/768 browser verification are not recorded. Scope-limited grep cannot certify parent/child workspace tree. No tests, build or CI.


### Replacement chat-4: activity log and notifications failure/loading surfaces — 2026-10-20

Source-fetched complete files after their individual `[chat-4]` commits. No `src/components/ui` mutations or service/API logic changes. Whole-file regex greps apply ONLY to the following seven route files, not to `src/` globally; JSX family closing tag counts checked (not a parser). No CI, app runtime, viewport screenshots or keyboard/hover replay.

**Grep expressions:** `/<(button|input|select|textarea|table)\b/g`; `/#[a-f0-9]{3,8}\b/gi`; `/fixed inset-0|role=["']dialog["']/g`; `/<h1\b/g`.

| File | Native control matches | Literal hex matches | Hand overlay matches | Native h1 | md/sm breakpoint prefixes | Unmatched closing families |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| `src/app/(authenticated)/college/activity/[eventId]/error.tsx` | 0 | 0 | 0 | 0 | 1/0 | none found |
| `src/app/(authenticated)/college/activity/[eventId]/page.tsx` | 0 | 0 | 0 | 0 | 1/0 | none found |
| `src/app/(authenticated)/college/activity/error.tsx` | 0 | 0 | 0 | 0 | 1/0 | none found |
| `src/app/(authenticated)/college/activity/loading.tsx` | 0 | 0 | 0 | 0 | 0/0 | none found |
| `src/app/(authenticated)/college/activity/page.tsx` | 0 | 0 | 0 | 0 | 25/0 | none found |
| `src/app/(authenticated)/college/announcements/error.tsx` | 0 | 0 | 0 | 0 | 1/0 | none found |
| `src/app/(authenticated)/college/announcements/loading.tsx` | 0 | 0 | 0 | 0 | 0/0 | none found |

#### `src/app/(authenticated)/college/activity/[eventId]/error.tsx`

| Property/state | Legacy file:value | vNext file:value | Result |
| --- | --- | --- | --- |
| Canvas geometry | old-lms-shell-spec.md:18-20: one white #fff canvas, 1px solid #e5e9f0, radius 12px, padding 24px | No nested page canvas. Shared ErrorState + secondary Button reset with 44px (<768px) /36px (md+) | **Source anatomy, browser dimensions unmeasured** |
| Title and subtitle | legacy-styles/components___listing-page-header.scss:26-35 border-bottom, 52-58 h1=28px/600/1.3 desktop | PageHeader in route or shared ErrorState; central title desktop 30px / mobile 20px | **Known old-listing 28px-vNext 30px mismatch, strict open** |
| Controls & default | old-lms-shell-spec.md:22-24: primary height36px/radius9/text #fff/14px/650, secondary white/hairline height36 | Only shared controls/links, max 44px mobile hit targets where authored; Shared ErrorState + secondary Button reset with 44px (<768px) /36px (md+) | **Exact complete default style not visually confirmed** |
| Hover/focus/disabled | legacy-styles/components___button.scss:13-24 background/border/colour transition 150ms, disabled 49-51; form.scss:22-36 keyboard focus-visible | Focus-visible via shared controls and explicit links; route retries use reset callback, read-only tables retain previous links | **No browser action-state verification** |
| Loading/error/empty | old-lms-pages.md:6,11-12: nonnested in-canvas notices/empty rows, no fake inferred data | Shared ErrorState + secondary Button reset with 44px (<768px) /36px (md+) | **Matching UI component family, text and state transitions copied; exact banner geometry pending** |
| Responsive | legacy-styles/components___listing-page-header.scss:130-153: <=767px vertical, 20px title; >=768px horizontal | Route md tokens=1, sm=0, shared wrapper fluid; 44px mobile action and 36px from 768px | **Source breakpoint review only; screenshots 375/767/768 absent** |
| Conformance | old-lms-pages.md:6: each screen continuous canvas and row separators | Source anchors: PageHeader:n/a, ErrorState:8, EmptyState:n/a, shared loading:n/a | **Scoped greps complete; global scans and TypeScript parser remain unrun** |

#### `src/app/(authenticated)/college/activity/[eventId]/page.tsx`

| Property/state | Legacy file:value | vNext file:value | Result |
| --- | --- | --- | --- |
| Canvas geometry | old-lms-shell-spec.md:18-20: one white #fff canvas, 1px solid #e5e9f0, radius 12px, padding 24px | No nested page canvas. Shared PageHeader, PageBackLink, 1px section border, responsive 1→2 column definition list, StatusBadge for severity | **Source anatomy, browser dimensions unmeasured** |
| Title and subtitle | legacy-styles/components___listing-page-header.scss:26-35 border-bottom, 52-58 h1=28px/600/1.3 desktop | PageHeader in route or shared ErrorState; central title desktop 30px / mobile 20px | **Known old-listing 28px-vNext 30px mismatch, strict open** |
| Controls & default | old-lms-shell-spec.md:22-24: primary height36px/radius9/text #fff/14px/650, secondary white/hairline height36 | Only shared controls/links, max 44px mobile hit targets where authored; Shared PageHeader, PageBackLink, 1px section border, responsive 1→2 column definition list, StatusBadge for severity | **Exact complete default style not visually confirmed** |
| Hover/focus/disabled | legacy-styles/components___button.scss:13-24 background/border/colour transition 150ms, disabled 49-51; form.scss:22-36 keyboard focus-visible | Focus-visible via shared controls and explicit links; route retries use reset callback, read-only tables retain previous links | **No browser action-state verification** |
| Loading/error/empty | old-lms-pages.md:6,11-12: nonnested in-canvas notices/empty rows, no fake inferred data | Shared PageHeader, PageBackLink, 1px section border, responsive 1→2 column definition list, StatusBadge for severity | **Matching UI component family, text and state transitions copied; exact banner geometry pending** |
| Responsive | legacy-styles/components___listing-page-header.scss:130-153: <=767px vertical, 20px title; >=768px horizontal | Route md tokens=1, sm=0, shared wrapper fluid; 44px mobile action and 36px from 768px | **Source breakpoint review only; screenshots 375/767/768 absent** |
| Conformance | old-lms-pages.md:6: each screen continuous canvas and row separators | Source anchors: PageHeader:17, ErrorState:n/a, EmptyState:n/a, shared loading:n/a | **Scoped greps complete; global scans and TypeScript parser remain unrun** |

#### `src/app/(authenticated)/college/activity/error.tsx`

| Property/state | Legacy file:value | vNext file:value | Result |
| --- | --- | --- | --- |
| Canvas geometry | old-lms-shell-spec.md:18-20: one white #fff canvas, 1px solid #e5e9f0, radius 12px, padding 24px | No nested page canvas. Shared ErrorState + secondary Button reset with 44px (<768px) /36px (md+) | **Source anatomy, browser dimensions unmeasured** |
| Title and subtitle | legacy-styles/components___listing-page-header.scss:26-35 border-bottom, 52-58 h1=28px/600/1.3 desktop | PageHeader in route or shared ErrorState; central title desktop 30px / mobile 20px | **Known old-listing 28px-vNext 30px mismatch, strict open** |
| Controls & default | old-lms-shell-spec.md:22-24: primary height36px/radius9/text #fff/14px/650, secondary white/hairline height36 | Only shared controls/links, max 44px mobile hit targets where authored; Shared ErrorState + secondary Button reset with 44px (<768px) /36px (md+) | **Exact complete default style not visually confirmed** |
| Hover/focus/disabled | legacy-styles/components___button.scss:13-24 background/border/colour transition 150ms, disabled 49-51; form.scss:22-36 keyboard focus-visible | Focus-visible via shared controls and explicit links; route retries use reset callback, read-only tables retain previous links | **No browser action-state verification** |
| Loading/error/empty | old-lms-pages.md:6,11-12: nonnested in-canvas notices/empty rows, no fake inferred data | Shared ErrorState + secondary Button reset with 44px (<768px) /36px (md+) | **Matching UI component family, text and state transitions copied; exact banner geometry pending** |
| Responsive | legacy-styles/components___listing-page-header.scss:130-153: <=767px vertical, 20px title; >=768px horizontal | Route md tokens=1, sm=0, shared wrapper fluid; 44px mobile action and 36px from 768px | **Source breakpoint review only; screenshots 375/767/768 absent** |
| Conformance | old-lms-pages.md:6: each screen continuous canvas and row separators | Source anchors: PageHeader:n/a, ErrorState:8, EmptyState:n/a, shared loading:n/a | **Scoped greps complete; global scans and TypeScript parser remain unrun** |

#### `src/app/(authenticated)/college/activity/loading.tsx`

| Property/state | Legacy file:value | vNext file:value | Result |
| --- | --- | --- | --- |
| Canvas geometry | old-lms-shell-spec.md:18-20: one white #fff canvas, 1px solid #e5e9f0, radius 12px, padding 24px | No nested page canvas. Shared GracefulPageLoading(directory) with named aria label; Skeleton and delayed retry owned by shared component | **Source anatomy, browser dimensions unmeasured** |
| Title and subtitle | legacy-styles/components___listing-page-header.scss:26-35 border-bottom, 52-58 h1=28px/600/1.3 desktop | PageHeader in route or shared ErrorState; central title desktop 30px / mobile 20px | **Known old-listing 28px-vNext 30px mismatch, strict open** |
| Controls & default | old-lms-shell-spec.md:22-24: primary height36px/radius9/text #fff/14px/650, secondary white/hairline height36 | Only shared controls/links, max 44px mobile hit targets where authored; Shared GracefulPageLoading(directory) with named aria label; Skeleton and delayed retry owned by shared component | **Exact complete default style not visually confirmed** |
| Hover/focus/disabled | legacy-styles/components___button.scss:13-24 background/border/colour transition 150ms, disabled 49-51; form.scss:22-36 keyboard focus-visible | Focus-visible via shared controls and explicit links; route retries use reset callback, read-only tables retain previous links | **No browser action-state verification** |
| Loading/error/empty | old-lms-pages.md:6,11-12: nonnested in-canvas notices/empty rows, no fake inferred data | Shared GracefulPageLoading(directory) with named aria label; Skeleton and delayed retry owned by shared component | **Matching UI component family, text and state transitions copied; exact banner geometry pending** |
| Responsive | legacy-styles/components___listing-page-header.scss:130-153: <=767px vertical, 20px title; >=768px horizontal | Route md tokens=0, sm=0, shared wrapper fluid; 44px mobile action and 36px from 768px | **Source breakpoint review only; screenshots 375/767/768 absent** |
| Conformance | old-lms-pages.md:6: each screen continuous canvas and row separators | Source anchors: PageHeader:n/a, ErrorState:n/a, EmptyState:n/a, shared loading:3 | **Scoped greps complete; global scans and TypeScript parser remain unrun** |

#### `src/app/(authenticated)/college/activity/page.tsx`

| Property/state | Legacy file:value | vNext file:value | Result |
| --- | --- | --- | --- |
| Canvas geometry | old-lms-shell-spec.md:18-20: one white #fff canvas, 1px solid #e5e9f0, radius 12px, padding 24px | No nested page canvas. Shared PageHeader, continuous filter section, shared Input/Select/DateInput/Button, hairline DataTable, EmptyState, Alert(error), action and date shortcut links 44/36 | **Source anatomy, browser dimensions unmeasured** |
| Title and subtitle | legacy-styles/components___listing-page-header.scss:26-35 border-bottom, 52-58 h1=28px/600/1.3 desktop | PageHeader in route or shared ErrorState; central title desktop 30px / mobile 20px | **Known old-listing 28px-vNext 30px mismatch, strict open** |
| Controls & default | old-lms-shell-spec.md:22-24: primary height36px/radius9/text #fff/14px/650, secondary white/hairline height36 | Only shared controls/links, max 44px mobile hit targets where authored; Shared PageHeader, continuous filter section, shared Input/Select/DateInput/Button, hairline DataTable, EmptyState, Alert(error), action and date shortcut links 44/36 | **Exact complete default style not visually confirmed** |
| Hover/focus/disabled | legacy-styles/components___button.scss:13-24 background/border/colour transition 150ms, disabled 49-51; form.scss:22-36 keyboard focus-visible | Focus-visible via shared controls and explicit links; route retries use reset callback, read-only tables retain previous links | **No browser action-state verification** |
| Loading/error/empty | old-lms-pages.md:6,11-12: nonnested in-canvas notices/empty rows, no fake inferred data | Shared PageHeader, continuous filter section, shared Input/Select/DateInput/Button, hairline DataTable, EmptyState, Alert(error), action and date shortcut links 44/36 | **Matching UI component family, text and state transitions copied; exact banner geometry pending** |
| Responsive | legacy-styles/components___listing-page-header.scss:130-153: <=767px vertical, 20px title; >=768px horizontal | Route md tokens=25, sm=0, shared wrapper fluid; 44px mobile action and 36px from 768px | **Source breakpoint review only; screenshots 375/767/768 absent** |
| Conformance | old-lms-pages.md:6: each screen continuous canvas and row separators | Source anchors: PageHeader:29, ErrorState:35, EmptyState:192, shared loading:n/a | **Scoped greps complete; global scans and TypeScript parser remain unrun** |

#### `src/app/(authenticated)/college/announcements/error.tsx`

| Property/state | Legacy file:value | vNext file:value | Result |
| --- | --- | --- | --- |
| Canvas geometry | old-lms-shell-spec.md:18-20: one white #fff canvas, 1px solid #e5e9f0, radius 12px, padding 24px | No nested page canvas. Shared ErrorState + secondary Button reset with 44px (<768px) /36px (md+) | **Source anatomy, browser dimensions unmeasured** |
| Title and subtitle | legacy-styles/components___listing-page-header.scss:26-35 border-bottom, 52-58 h1=28px/600/1.3 desktop | PageHeader in route or shared ErrorState; central title desktop 30px / mobile 20px | **Known old-listing 28px-vNext 30px mismatch, strict open** |
| Controls & default | old-lms-shell-spec.md:22-24: primary height36px/radius9/text #fff/14px/650, secondary white/hairline height36 | Only shared controls/links, max 44px mobile hit targets where authored; Shared ErrorState + secondary Button reset with 44px (<768px) /36px (md+) | **Exact complete default style not visually confirmed** |
| Hover/focus/disabled | legacy-styles/components___button.scss:13-24 background/border/colour transition 150ms, disabled 49-51; form.scss:22-36 keyboard focus-visible | Focus-visible via shared controls and explicit links; route retries use reset callback, read-only tables retain previous links | **No browser action-state verification** |
| Loading/error/empty | old-lms-pages.md:6,11-12: nonnested in-canvas notices/empty rows, no fake inferred data | Shared ErrorState + secondary Button reset with 44px (<768px) /36px (md+) | **Matching UI component family, text and state transitions copied; exact banner geometry pending** |
| Responsive | legacy-styles/components___listing-page-header.scss:130-153: <=767px vertical, 20px title; >=768px horizontal | Route md tokens=1, sm=0, shared wrapper fluid; 44px mobile action and 36px from 768px | **Source breakpoint review only; screenshots 375/767/768 absent** |
| Conformance | old-lms-pages.md:6: each screen continuous canvas and row separators | Source anchors: PageHeader:n/a, ErrorState:10, EmptyState:n/a, shared loading:n/a | **Scoped greps complete; global scans and TypeScript parser remain unrun** |

#### `src/app/(authenticated)/college/announcements/loading.tsx`

| Property/state | Legacy file:value | vNext file:value | Result |
| --- | --- | --- | --- |
| Canvas geometry | old-lms-shell-spec.md:18-20: one white #fff canvas, 1px solid #e5e9f0, radius 12px, padding 24px | No nested page canvas. Shared GracefulPageLoading(directory) with named aria label; Skeleton and delayed retry owned by shared component | **Source anatomy, browser dimensions unmeasured** |
| Title and subtitle | legacy-styles/components___listing-page-header.scss:26-35 border-bottom, 52-58 h1=28px/600/1.3 desktop | PageHeader in route or shared ErrorState; central title desktop 30px / mobile 20px | **Known old-listing 28px-vNext 30px mismatch, strict open** |
| Controls & default | old-lms-shell-spec.md:22-24: primary height36px/radius9/text #fff/14px/650, secondary white/hairline height36 | Only shared controls/links, max 44px mobile hit targets where authored; Shared GracefulPageLoading(directory) with named aria label; Skeleton and delayed retry owned by shared component | **Exact complete default style not visually confirmed** |
| Hover/focus/disabled | legacy-styles/components___button.scss:13-24 background/border/colour transition 150ms, disabled 49-51; form.scss:22-36 keyboard focus-visible | Focus-visible via shared controls and explicit links; route retries use reset callback, read-only tables retain previous links | **No browser action-state verification** |
| Loading/error/empty | old-lms-pages.md:6,11-12: nonnested in-canvas notices/empty rows, no fake inferred data | Shared GracefulPageLoading(directory) with named aria label; Skeleton and delayed retry owned by shared component | **Matching UI component family, text and state transitions copied; exact banner geometry pending** |
| Responsive | legacy-styles/components___listing-page-header.scss:130-153: <=767px vertical, 20px title; >=768px horizontal | Route md tokens=0, sm=0, shared wrapper fluid; 44px mobile action and 36px from 768px | **Source breakpoint review only; screenshots 375/767/768 absent** |
| Conformance | old-lms-pages.md:6: each screen continuous canvas and row separators | Source anchors: PageHeader:n/a, ErrorState:n/a, EmptyState:n/a, shared loading:3 | **Scoped greps complete; global scans and TypeScript parser remain unrun** |

**Strict:** 0 new checkboxes. All 7 files source-refactored/grepped, none certified for pixel parity because no app output, all-state legacy computed CSS, global grep, rendered viewport proof or typechecking. The old `listing-page-header.scss` 28px vs shared PageHeader 30px remains a known mismatch; do not tick.


### Replacement chat-4: announcements, promotion workflow and profile verification states — 2026-10-20

Five complete saved route files inspected. No modifications to backend queries, membership/permission guards, API calls, staged migration status or shared controls. Full GitHub blob scan (source only); no compiler, live browser, CI or screenshots.

**Scoped grep:** `/<(button|input|select|textarea|table)\b/g`, `/#[a-f0-9]{3,8}\b/gi`, `/fixed inset-0|role=["']dialog["']/g`, `/<h1\b/g`. Checked matching JSX native/shared opening-close tag families, not source parse. Results apply only to five files, not all children / global repository.

| File | Native controls | Hex | Inline overlays | Native h1 | md/sm prefixes | Orphan closings |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| `src/app/(authenticated)/college/announcements/page.tsx` | 0 | 0 | 0 | 0 | 8/0 | none found |
| `src/app/(authenticated)/college/batch-promotion/error.tsx` | 0 | 0 | 0 | 0 | 1/0 | none found |
| `src/app/(authenticated)/college/batch-promotion/loading.tsx` | 0 | 0 | 0 | 0 | 0/0 | none found |
| `src/app/(authenticated)/college/batch-promotion/page.tsx` | 0 | 0 | 0 | 0 | 4/0 | none found |
| `src/app/(authenticated)/college/verification/error.tsx` | 0 | 0 | 0 | 0 | 1/0 | none found |

#### `src/app/(authenticated)/college/announcements/page.tsx`

| State/property | Legacy source/value | vNext source/value | Proof |
| --- | --- | --- | --- |
| Canvas | old-lms-shell-spec.md:18-20: #f1f4f9 app shell, white #ffffff canvas, #e5e9f0 1px border, radius12, padding24 | No new PageCanvas; Personal-college notification rows divide-y, shared EmptyState for unread/all empty, Alert warning DB readiness, 44px link targets | **Source structural match, no browser geometry** |
| Heading and divider | legacy-styles/components___listing-page-header.scss:26-35 border-bottom, 52-58 title font 28px/600/1.3 desktop, mobile 20px | Existing PageHeader and under-title hairline; Personal-college notification rows divide-y, shared EmptyState for unread/all empty, Alert warning DB readiness, 44px link targets | **Central PageHeader desktop 30px, old listing 28px mismatch** |
| Button/control default | old-lms-shell-spec.md:22-24: primary teal #0a7c88 with #fff text, 36px height, radius9, font14px/650, secondary white/hairline | Delegated shared control variants and links, 44px mobile min height, 36px >=768px | **Source token contracts; exact alternate states not screenshot-proven** |
| Hover/active/focus | legacy-styles/components___button.scss:13-24 transition 150ms and hover rules, 49-51 disabled; form.scss:22-36 keyboard focus-visible | Shared Button or direct Link focus-visible, disabled while request pending in child components | **Not played through in UI, strict open** |
| Loading/error/empty | old-lms-pages.md:6,11-12: small banner strips, hairline records and in-canvas empty feedback | Personal-college notification rows divide-y, shared EmptyState for unread/all empty, Alert warning DB readiness, 44px link targets | **Source component family; exact copy and visual details not matched pixel-to-pixel** |
| Phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked /20px title; 44px touch target | Source md classes: 8, sm classes: 0; Personal-college notification rows divide-y, shared EmptyState for unread/all empty, Alert warning DB readiness, 44px link targets | **Source breakpoint only, screenshots @375/767/768 pending** |
| Preserved behavior | old-lms-pages.md:6: no change to page content or data | Original links, queries, dashboard audience, persisted notifications and scoped read/service calls unchanged | **Source compared only; no runtime/CI or parser** |

Source anchors: PageHeader line 36, ErrorState n/a, EmptyState 51, shared loader n/a.

#### `src/app/(authenticated)/college/batch-promotion/error.tsx`

| State/property | Legacy source/value | vNext source/value | Proof |
| --- | --- | --- | --- |
| Canvas | old-lms-shell-spec.md:18-20: #f1f4f9 app shell, white #ffffff canvas, #e5e9f0 1px border, radius12, padding24 | No new PageCanvas; ErrorState plus shared secondary Retry Button min-h-11 md:min-h-9 | **Source structural match, no browser geometry** |
| Heading and divider | legacy-styles/components___listing-page-header.scss:26-35 border-bottom, 52-58 title font 28px/600/1.3 desktop, mobile 20px | Shared ErrorState heading subordinate to page | **Central PageHeader desktop 30px, old listing 28px mismatch** |
| Button/control default | old-lms-shell-spec.md:22-24: primary teal #0a7c88 with #fff text, 36px height, radius9, font14px/650, secondary white/hairline | Delegated shared control variants and links, 44px mobile min height, 36px >=768px | **Source token contracts; exact alternate states not screenshot-proven** |
| Hover/active/focus | legacy-styles/components___button.scss:13-24 transition 150ms and hover rules, 49-51 disabled; form.scss:22-36 keyboard focus-visible | Shared Button or direct Link focus-visible, disabled while request pending in child components | **Not played through in UI, strict open** |
| Loading/error/empty | old-lms-pages.md:6,11-12: small banner strips, hairline records and in-canvas empty feedback | ErrorState plus shared secondary Retry Button min-h-11 md:min-h-9 | **Source component family; exact copy and visual details not matched pixel-to-pixel** |
| Phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked /20px title; 44px touch target | Source md classes: 1, sm classes: 0; ErrorState plus shared secondary Retry Button min-h-11 md:min-h-9 | **Source breakpoint only, screenshots @375/767/768 pending** |
| Preserved behavior | old-lms-pages.md:6: no change to page content or data | Original links, queries, dashboard audience, persisted notifications and scoped read/service calls unchanged | **Source compared only; no runtime/CI or parser** |

Source anchors: PageHeader line n/a, ErrorState 8, EmptyState n/a, shared loader n/a.

#### `src/app/(authenticated)/college/batch-promotion/loading.tsx`

| State/property | Legacy source/value | vNext source/value | Proof |
| --- | --- | --- | --- |
| Canvas | old-lms-shell-spec.md:18-20: #f1f4f9 app shell, white #ffffff canvas, #e5e9f0 1px border, radius12, padding24 | No new PageCanvas; GracefulPageLoading with supported card skeleton and delayed recovery | **Source structural match, no browser geometry** |
| Heading and divider | legacy-styles/components___listing-page-header.scss:26-35 border-bottom, 52-58 title font 28px/600/1.3 desktop, mobile 20px | Shared GracefulPageLoading visible skeleton | **Central PageHeader desktop 30px, old listing 28px mismatch** |
| Button/control default | old-lms-shell-spec.md:22-24: primary teal #0a7c88 with #fff text, 36px height, radius9, font14px/650, secondary white/hairline | Delegated shared control variants and links, 44px mobile min height, 36px >=768px | **Source token contracts; exact alternate states not screenshot-proven** |
| Hover/active/focus | legacy-styles/components___button.scss:13-24 transition 150ms and hover rules, 49-51 disabled; form.scss:22-36 keyboard focus-visible | Shared Button or direct Link focus-visible, disabled while request pending in child components | **Not played through in UI, strict open** |
| Loading/error/empty | old-lms-pages.md:6,11-12: small banner strips, hairline records and in-canvas empty feedback | GracefulPageLoading with supported card skeleton and delayed recovery | **Source component family; exact copy and visual details not matched pixel-to-pixel** |
| Phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked /20px title; 44px touch target | Source md classes: 0, sm classes: 0; GracefulPageLoading with supported card skeleton and delayed recovery | **Source breakpoint only, screenshots @375/767/768 pending** |
| Preserved behavior | old-lms-pages.md:6: no change to page content or data | Original links, queries, dashboard audience, persisted notifications and scoped read/service calls unchanged | **Source compared only; no runtime/CI or parser** |

Source anchors: PageHeader line n/a, ErrorState n/a, EmptyState n/a, shared loader 3.

#### `src/app/(authenticated)/college/batch-promotion/page.tsx`

| State/property | Legacy source/value | vNext source/value | Proof |
| --- | --- | --- | --- |
| Canvas | old-lms-shell-spec.md:18-20: #f1f4f9 app shell, white #ffffff canvas, #e5e9f0 1px border, radius12, padding24 | No new PageCanvas; PageHeader/Filter form, md:grid-cols-2/lg:grid-cols-4, Preview Button min-h-11 md:min-h-9 and EmptyState for no batch chosen | **Source structural match, no browser geometry** |
| Heading and divider | legacy-styles/components___listing-page-header.scss:26-35 border-bottom, 52-58 title font 28px/600/1.3 desktop, mobile 20px | Existing PageHeader and under-title hairline; PageHeader/Filter form, md:grid-cols-2/lg:grid-cols-4, Preview Button min-h-11 md:min-h-9 and EmptyState for no batch chosen | **Central PageHeader desktop 30px, old listing 28px mismatch** |
| Button/control default | old-lms-shell-spec.md:22-24: primary teal #0a7c88 with #fff text, 36px height, radius9, font14px/650, secondary white/hairline | Delegated shared control variants and links, 44px mobile min height, 36px >=768px | **Source token contracts; exact alternate states not screenshot-proven** |
| Hover/active/focus | legacy-styles/components___button.scss:13-24 transition 150ms and hover rules, 49-51 disabled; form.scss:22-36 keyboard focus-visible | Shared Button or direct Link focus-visible, disabled while request pending in child components | **Not played through in UI, strict open** |
| Loading/error/empty | old-lms-pages.md:6,11-12: small banner strips, hairline records and in-canvas empty feedback | PageHeader/Filter form, md:grid-cols-2/lg:grid-cols-4, Preview Button min-h-11 md:min-h-9 and EmptyState for no batch chosen | **Source component family; exact copy and visual details not matched pixel-to-pixel** |
| Phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked /20px title; 44px touch target | Source md classes: 4, sm classes: 0; PageHeader/Filter form, md:grid-cols-2/lg:grid-cols-4, Preview Button min-h-11 md:min-h-9 and EmptyState for no batch chosen | **Source breakpoint only, screenshots @375/767/768 pending** |
| Preserved behavior | old-lms-pages.md:6: no change to page content or data | Original links, queries, dashboard audience, persisted notifications and scoped read/service calls unchanged | **Source compared only; no runtime/CI or parser** |

Source anchors: PageHeader line 43, ErrorState 44, EmptyState 97, shared loader n/a.

#### `src/app/(authenticated)/college/verification/error.tsx`

| State/property | Legacy source/value | vNext source/value | Proof |
| --- | --- | --- | --- |
| Canvas | old-lms-shell-spec.md:18-20: #f1f4f9 app shell, white #ffffff canvas, #e5e9f0 1px border, radius12, padding24 | No new PageCanvas; ErrorState plus shared secondary Retry Button min-h-11 md:min-h-9 | **Source structural match, no browser geometry** |
| Heading and divider | legacy-styles/components___listing-page-header.scss:26-35 border-bottom, 52-58 title font 28px/600/1.3 desktop, mobile 20px | Shared ErrorState heading subordinate to page | **Central PageHeader desktop 30px, old listing 28px mismatch** |
| Button/control default | old-lms-shell-spec.md:22-24: primary teal #0a7c88 with #fff text, 36px height, radius9, font14px/650, secondary white/hairline | Delegated shared control variants and links, 44px mobile min height, 36px >=768px | **Source token contracts; exact alternate states not screenshot-proven** |
| Hover/active/focus | legacy-styles/components___button.scss:13-24 transition 150ms and hover rules, 49-51 disabled; form.scss:22-36 keyboard focus-visible | Shared Button or direct Link focus-visible, disabled while request pending in child components | **Not played through in UI, strict open** |
| Loading/error/empty | old-lms-pages.md:6,11-12: small banner strips, hairline records and in-canvas empty feedback | ErrorState plus shared secondary Retry Button min-h-11 md:min-h-9 | **Source component family; exact copy and visual details not matched pixel-to-pixel** |
| Phone/tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked /20px title; 44px touch target | Source md classes: 1, sm classes: 0; ErrorState plus shared secondary Retry Button min-h-11 md:min-h-9 | **Source breakpoint only, screenshots @375/767/768 pending** |
| Preserved behavior | old-lms-pages.md:6: no change to page content or data | Original links, queries, dashboard audience, persisted notifications and scoped read/service calls unchanged | **Source compared only; no runtime/CI or parser** |

Source anchors: PageHeader line n/a, ErrorState 5, EmptyState n/a, shared loader n/a.

**Strict checkboxes:** 0 newly ticked. Full source of 26 edited route files has now been covered across four batch audit sections, with per-file scoped grep, value/state and phone/tablet source comparisons, but exact pixel/interaction parity remains unverified. Explicitly known shared typography mismatch, global zero-grep and responsive runtime evidence remain blocking. Avoid claiming complete parity.

**Exact next file:** `src/app/(authenticated)/college/activity/[eventId]/page.tsx` was source-reviewed; next unopened College Admin queue file by area: `src/app/(authenticated)/college/assignments/page.tsx` (plus its error/loading boundaries).


### Replacement chat-4: College assignments and learning progress route error/default/loading states — 2026-10-20

Six edited route files saved with `[chat-4]` and read back. Each preserves college-scoped learner data, aggregate component ownership, query guards and existing wording. Added only filter-recovery actions, min-height/focus links, shared ErrorState and GracefulPageLoading. No `src/components/ui` or service edits. No application execution, CI, browser, or typecheck.

**Scoped grep:** `/<(button|input|select|textarea|table)\b/g`, `/#[a-f0-9]{3,8}\b/gi`, `/fixed inset-0|role=["']dialog["']/g`, `/<h1\b/g`. Counts from entire persisted TSX files; not repository-wide grep. JSX family closing vs opening counts checked for Button, Link, ErrorState, PageHeader, div, section, p, form, and GracefulPageLoading.

| File | Native controls | Literal hex | Hand overlay | Native h1 | md / sm source breakpoint |
| --- | ---: | ---: | ---: | ---: | --- |
| `src/app/(authenticated)/college/assignments/error.tsx` | 0 | 0 | 0 | 0 | 1 / 0 |
| `src/app/(authenticated)/college/assignments/loading.tsx` | 0 | 0 | 0 | 0 | 0 / 0 |
| `src/app/(authenticated)/college/assignments/page.tsx` | 0 | 0 | 0 | 0 | 1 / 0 |
| `src/app/(authenticated)/college/course-progress/error.tsx` | 0 | 0 | 0 | 0 | 1 / 0 |
| `src/app/(authenticated)/college/course-progress/loading.tsx` | 0 | 0 | 0 | 0 | 0 / 0 |
| `src/app/(authenticated)/college/course-progress/page.tsx` | 0 | 0 | 0 | 0 | 2 / 0 |

#### `src/app/(authenticated)/college/assignments/error.tsx`

| Property/state | Legacy source/value | vNext source/value | Verification |
| --- | --- | --- | --- |
| Canvas and section | old-lms-shell-spec.md:18-20: one white #fff canvas 1px solid #e5e9f0 radius12 padding24 | Shared ErrorState and secondary Button retry; min-h-11 md:min-h-9; no second PageCanvas | **Source anatomy aligned, computed dimensions unverified** |
| Title | legacy-styles/components___listing-page-header.scss:52-58: 28px/600/1.3 desktop h1; 137: 20px phone | Shared PageHeader or ErrorState. Upstream shared PageHeader 30px desktop | **Known mismatch blocks strict parity** |
| CTA default | old-lms-shell-spec.md:22-24: height36px radius9, primary #0a7c88 text white 14px/650, secondary white/hairline | Shared ErrorState and secondary Button retry; min-h-11 md:min-h-9 | **Source component family only; hover/default computed values unverified** |
| Hover/focus/disabled | legacy-styles/components___button.scss:13-24 transition 150ms, 49-51 disabled; form.scss:22-36 keyboard focus-visible | Shared ErrorState and secondary Button retry; min-h-11 md:min-h-9; shared controls own focus/disabled rendering | **Browser states not tested** |
| Loading/error/empty | old-lms-pages.md:6,11-12: slim in-canvas notices, no false empty | Errors remain ErrorState, loading uses shared busy Skeleton; invalid query reset rather than fake no-data | **States source reviewed, no full interaction test** |
| Phone / tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked title 20px, actions 44px targets | Shared ErrorState and secondary Button retry; min-h-11 md:min-h-9; md width transition at 768px | **Static responsive class proof, no 375/767/768px browser rendering** |
| No data contract change | old-lms-pages.md:6: preserve content/data semantics | Original workspaces, query schemas, API authorization, upload/report scopes and server reads untouched | **Source review, not compiled TSX** |

#### `src/app/(authenticated)/college/assignments/loading.tsx`

| Property/state | Legacy source/value | vNext source/value | Verification |
| --- | --- | --- | --- |
| Canvas and section | old-lms-shell-spec.md:18-20: one white #fff canvas 1px solid #e5e9f0 radius12 padding24 | GracefulPageLoading(directory) with descriptive label, Skeleton and delayed retry; no second PageCanvas | **Source anatomy aligned, computed dimensions unverified** |
| Title | legacy-styles/components___listing-page-header.scss:52-58: 28px/600/1.3 desktop h1; 137: 20px phone | Shared PageHeader or ErrorState. Upstream shared PageHeader 30px desktop | **Known mismatch blocks strict parity** |
| CTA default | old-lms-shell-spec.md:22-24: height36px radius9, primary #0a7c88 text white 14px/650, secondary white/hairline | GracefulPageLoading(directory) with descriptive label, Skeleton and delayed retry | **Source component family only; hover/default computed values unverified** |
| Hover/focus/disabled | legacy-styles/components___button.scss:13-24 transition 150ms, 49-51 disabled; form.scss:22-36 keyboard focus-visible | GracefulPageLoading(directory) with descriptive label, Skeleton and delayed retry; shared controls own focus/disabled rendering | **Browser states not tested** |
| Loading/error/empty | old-lms-pages.md:6,11-12: slim in-canvas notices, no false empty | Errors remain ErrorState, loading uses shared busy Skeleton; invalid query reset rather than fake no-data | **States source reviewed, no full interaction test** |
| Phone / tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked title 20px, actions 44px targets | GracefulPageLoading(directory) with descriptive label, Skeleton and delayed retry; md width transition at 768px | **Static responsive class proof, no 375/767/768px browser rendering** |
| No data contract change | old-lms-pages.md:6: preserve content/data semantics | Original workspaces, query schemas, API authorization, upload/report scopes and server reads untouched | **Source review, not compiled TSX** |

#### `src/app/(authenticated)/college/assignments/page.tsx`

| Property/state | Legacy source/value | vNext source/value | Verification |
| --- | --- | --- | --- |
| Canvas and section | old-lms-shell-spec.md:18-20: one white #fff canvas 1px solid #e5e9f0 radius12 padding24 | Page-owned errors use ErrorState with explicit Clear filters Link; export uses min-h-11 md:min-h-9; data/pagination delegated unchanged; no second PageCanvas | **Source anatomy aligned, computed dimensions unverified** |
| Title | legacy-styles/components___listing-page-header.scss:52-58: 28px/600/1.3 desktop h1; 137: 20px phone | Shared PageHeader or ErrorState. Upstream shared PageHeader 30px desktop | **Known mismatch blocks strict parity** |
| CTA default | old-lms-shell-spec.md:22-24: height36px radius9, primary #0a7c88 text white 14px/650, secondary white/hairline | Page-owned errors use ErrorState with explicit Clear filters Link; export uses min-h-11 md:min-h-9; data/pagination delegated unchanged | **Source component family only; hover/default computed values unverified** |
| Hover/focus/disabled | legacy-styles/components___button.scss:13-24 transition 150ms, 49-51 disabled; form.scss:22-36 keyboard focus-visible | Page-owned errors use ErrorState with explicit Clear filters Link; export uses min-h-11 md:min-h-9; data/pagination delegated unchanged; shared controls own focus/disabled rendering | **Browser states not tested** |
| Loading/error/empty | old-lms-pages.md:6,11-12: slim in-canvas notices, no false empty | Errors remain ErrorState, loading uses shared busy Skeleton; invalid query reset rather than fake no-data | **States source reviewed, no full interaction test** |
| Phone / tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked title 20px, actions 44px targets | Page-owned errors use ErrorState with explicit Clear filters Link; export uses min-h-11 md:min-h-9; data/pagination delegated unchanged; md width transition at 768px | **Static responsive class proof, no 375/767/768px browser rendering** |
| No data contract change | old-lms-pages.md:6: preserve content/data semantics | Original workspaces, query schemas, API authorization, upload/report scopes and server reads untouched | **Source review, not compiled TSX** |

#### `src/app/(authenticated)/college/course-progress/error.tsx`

| Property/state | Legacy source/value | vNext source/value | Verification |
| --- | --- | --- | --- |
| Canvas and section | old-lms-shell-spec.md:18-20: one white #fff canvas 1px solid #e5e9f0 radius12 padding24 | Shared ErrorState and secondary Button retry; min-h-11 md:min-h-9; no second PageCanvas | **Source anatomy aligned, computed dimensions unverified** |
| Title | legacy-styles/components___listing-page-header.scss:52-58: 28px/600/1.3 desktop h1; 137: 20px phone | Shared PageHeader or ErrorState. Upstream shared PageHeader 30px desktop | **Known mismatch blocks strict parity** |
| CTA default | old-lms-shell-spec.md:22-24: height36px radius9, primary #0a7c88 text white 14px/650, secondary white/hairline | Shared ErrorState and secondary Button retry; min-h-11 md:min-h-9 | **Source component family only; hover/default computed values unverified** |
| Hover/focus/disabled | legacy-styles/components___button.scss:13-24 transition 150ms, 49-51 disabled; form.scss:22-36 keyboard focus-visible | Shared ErrorState and secondary Button retry; min-h-11 md:min-h-9; shared controls own focus/disabled rendering | **Browser states not tested** |
| Loading/error/empty | old-lms-pages.md:6,11-12: slim in-canvas notices, no false empty | Errors remain ErrorState, loading uses shared busy Skeleton; invalid query reset rather than fake no-data | **States source reviewed, no full interaction test** |
| Phone / tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked title 20px, actions 44px targets | Shared ErrorState and secondary Button retry; min-h-11 md:min-h-9; md width transition at 768px | **Static responsive class proof, no 375/767/768px browser rendering** |
| No data contract change | old-lms-pages.md:6: preserve content/data semantics | Original workspaces, query schemas, API authorization, upload/report scopes and server reads untouched | **Source review, not compiled TSX** |

#### `src/app/(authenticated)/college/course-progress/loading.tsx`

| Property/state | Legacy source/value | vNext source/value | Verification |
| --- | --- | --- | --- |
| Canvas and section | old-lms-shell-spec.md:18-20: one white #fff canvas 1px solid #e5e9f0 radius12 padding24 | GracefulPageLoading(directory) with descriptive label, Skeleton and delayed retry; no second PageCanvas | **Source anatomy aligned, computed dimensions unverified** |
| Title | legacy-styles/components___listing-page-header.scss:52-58: 28px/600/1.3 desktop h1; 137: 20px phone | Shared PageHeader or ErrorState. Upstream shared PageHeader 30px desktop | **Known mismatch blocks strict parity** |
| CTA default | old-lms-shell-spec.md:22-24: height36px radius9, primary #0a7c88 text white 14px/650, secondary white/hairline | GracefulPageLoading(directory) with descriptive label, Skeleton and delayed retry | **Source component family only; hover/default computed values unverified** |
| Hover/focus/disabled | legacy-styles/components___button.scss:13-24 transition 150ms, 49-51 disabled; form.scss:22-36 keyboard focus-visible | GracefulPageLoading(directory) with descriptive label, Skeleton and delayed retry; shared controls own focus/disabled rendering | **Browser states not tested** |
| Loading/error/empty | old-lms-pages.md:6,11-12: slim in-canvas notices, no false empty | Errors remain ErrorState, loading uses shared busy Skeleton; invalid query reset rather than fake no-data | **States source reviewed, no full interaction test** |
| Phone / tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked title 20px, actions 44px targets | GracefulPageLoading(directory) with descriptive label, Skeleton and delayed retry; md width transition at 768px | **Static responsive class proof, no 375/767/768px browser rendering** |
| No data contract change | old-lms-pages.md:6: preserve content/data semantics | Original workspaces, query schemas, API authorization, upload/report scopes and server reads untouched | **Source review, not compiled TSX** |

#### `src/app/(authenticated)/college/course-progress/page.tsx`

| Property/state | Legacy source/value | vNext source/value | Verification |
| --- | --- | --- | --- |
| Canvas and section | old-lms-shell-spec.md:18-20: one white #fff canvas 1px solid #e5e9f0 radius12 padding24 | Page-owned errors use ErrorState with explicit Clear filters Link; export uses min-h-11 md:min-h-9; data/pagination delegated unchanged; no second PageCanvas | **Source anatomy aligned, computed dimensions unverified** |
| Title | legacy-styles/components___listing-page-header.scss:52-58: 28px/600/1.3 desktop h1; 137: 20px phone | Shared PageHeader or ErrorState. Upstream shared PageHeader 30px desktop | **Known mismatch blocks strict parity** |
| CTA default | old-lms-shell-spec.md:22-24: height36px radius9, primary #0a7c88 text white 14px/650, secondary white/hairline | Page-owned errors use ErrorState with explicit Clear filters Link; export uses min-h-11 md:min-h-9; data/pagination delegated unchanged | **Source component family only; hover/default computed values unverified** |
| Hover/focus/disabled | legacy-styles/components___button.scss:13-24 transition 150ms, 49-51 disabled; form.scss:22-36 keyboard focus-visible | Page-owned errors use ErrorState with explicit Clear filters Link; export uses min-h-11 md:min-h-9; data/pagination delegated unchanged; shared controls own focus/disabled rendering | **Browser states not tested** |
| Loading/error/empty | old-lms-pages.md:6,11-12: slim in-canvas notices, no false empty | Errors remain ErrorState, loading uses shared busy Skeleton; invalid query reset rather than fake no-data | **States source reviewed, no full interaction test** |
| Phone / tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked title 20px, actions 44px targets | Page-owned errors use ErrorState with explicit Clear filters Link; export uses min-h-11 md:min-h-9; data/pagination delegated unchanged; md width transition at 768px | **Static responsive class proof, no 375/767/768px browser rendering** |
| No data contract change | old-lms-pages.md:6: preserve content/data semantics | Original workspaces, query schemas, API authorization, upload/report scopes and server reads untouched | **Source review, not compiled TSX** |

**Strict ticks:** 0 newly checked. Global repo grep, all-state value equality (including hover, active, disabled) and actual responsive phone/tablet proof are not available; no browser/CI or TypeScript parse performed. Shared heading desktop measurement mismatch remains. This is source migration, not certified pixel clone.

**Exact next file:** `src/app/(authenticated)/college/course-progress/page.tsx` source-refactored; continue `src/app/(authenticated)/college/assignments/page.tsx` child workspace or next queue screen `src/app/(authenticated)/college/course-reports/page.tsx` if present.


### Replacement chat-4: Course offering detail boundaries and College Departments directory — 2026-10-20

Six files saved/re-read with source-only parity improvements: shared ErrorState/GracefulPageLoading, flattened failure canvas, 44px mobile return links, preserved college-scoped department reads, course tenant guard and unchanged page contents. `src/components/ui` untouched; no app execution, browser, tests or CI.

**Scoped whole-blob grep:** `/<(button|input|select|textarea|table)\b/g`; `/#[a-f0-9]{3,8}\b/gi`; `/fixed inset-0|role=["']dialog["']/g`; `/<h1\b/g`. This is NOT whole-repo coverage. Compared closing tag families (div, section, p, Link, Button, ErrorState, PageHeader, GracefulPageLoading), not a TSX parser.

| File | Raw controls | Hex | Hand modal | Native h1 | md/sm tokens |
| --- | ---: | ---: | ---: | ---: | --- |
| `src/app/(authenticated)/college/courses/offerings/[offeringId]/error.tsx` | 0 | 0 | 0 | 0 | 2/0 |
| `src/app/(authenticated)/college/courses/offerings/[offeringId]/loading.tsx` | 0 | 0 | 0 | 0 | 0/0 |
| `src/app/(authenticated)/college/courses/offerings/[offeringId]/not-found.tsx` | 0 | 0 | 0 | 0 | 1/0 |
| `src/app/(authenticated)/college/departments/error.tsx` | 0 | 0 | 0 | 0 | 1/0 |
| `src/app/(authenticated)/college/departments/loading.tsx` | 0 | 0 | 0 | 0 | 0/0 |
| `src/app/(authenticated)/college/departments/page.tsx` | 0 | 0 | 0 | 0 | 1/0 |

#### `src/app/(authenticated)/college/courses/offerings/[offeringId]/error.tsx`

| Property/state | Legacy source/value | vNext source/value | Strict result |
| --- | --- | --- | --- |
| Canvas/default | old-lms-shell-spec.md:18-20: white #fff canvas, border 1px solid #e5e9f0, radius12, padding24 | Shared ErrorState with route-specific title/copy and secondary Retry (44px phone/36px desktop); inherits one parent PageCanvas | **Source structure aligned, no runtime pixel confirmation** |
| Page heading | legacy-styles/components___listing-page-header.scss:26-35 hairline header border, 52-58 title 28px/600/1.3 (mobile 20px) | Shared PageHeader/ErrorState; no handmade h1 in file | **Known shared PageHeader 30px desktop vs old listing 28px** |
| Button default/secondary | old-lms-shell-spec.md:22-24: primary teal #0a7c88 / white, height36px, radius9, 14px/650; secondary white hairline | Shared ErrorState with route-specific title/copy and secondary Retry (44px phone/36px desktop) | **Shared controls match size variant source; full hover active visual unknown** |
| Focus/disabled/loading | legacy-styles/components___button.scss:13-24 150ms transition/hover, 49-51 disabled; form.scss:22-36 :focus-visible | Shared Button/PageBackLink focus-visible, shared loading and error components; no direct hand-rolled controls | **State source reviewed only; no keyboard/hover replay** |
| Error/empty | old-lms-pages.md:6,11: plain in-canvas error/empty, hairline row lists | Shared ErrorState with route-specific title/copy and secondary Retry (44px phone/36px desktop) | **No false empty data, exact old error typography unverified** |
| Phone and tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked with 20px heading, 44px touch | Shared ErrorState with route-specific title/copy and secondary Retry (44px phone/36px desktop); md breakpoint at >=768px, fluid width | **Class-based responsive evidence, browser 375/767/768 missing** |
| Content/scope | old-lms-pages.md:6: visuals may change, service content may not | Original service calls and college scope retained; case of offering not found continues cross-tenant-safe response | **Source only, no typecheck or runtime service read** |

#### `src/app/(authenticated)/college/courses/offerings/[offeringId]/loading.tsx`

| Property/state | Legacy source/value | vNext source/value | Strict result |
| --- | --- | --- | --- |
| Canvas/default | old-lms-shell-spec.md:18-20: white #fff canvas, border 1px solid #e5e9f0, radius12, padding24 | Shared GracefulPageLoading(directory) with route-specific accessible label and no nested custom card; inherits one parent PageCanvas | **Source structure aligned, no runtime pixel confirmation** |
| Page heading | legacy-styles/components___listing-page-header.scss:26-35 hairline header border, 52-58 title 28px/600/1.3 (mobile 20px) | Shared PageHeader/ErrorState; no handmade h1 in file | **Known shared PageHeader 30px desktop vs old listing 28px** |
| Button default/secondary | old-lms-shell-spec.md:22-24: primary teal #0a7c88 / white, height36px, radius9, 14px/650; secondary white hairline | Shared GracefulPageLoading(directory) with route-specific accessible label and no nested custom card | **Shared controls match size variant source; full hover active visual unknown** |
| Focus/disabled/loading | legacy-styles/components___button.scss:13-24 150ms transition/hover, 49-51 disabled; form.scss:22-36 :focus-visible | Shared Button/PageBackLink focus-visible, shared loading and error components; no direct hand-rolled controls | **State source reviewed only; no keyboard/hover replay** |
| Error/empty | old-lms-pages.md:6,11: plain in-canvas error/empty, hairline row lists | Shared GracefulPageLoading(directory) with route-specific accessible label and no nested custom card | **No false empty data, exact old error typography unverified** |
| Phone and tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked with 20px heading, 44px touch | Shared GracefulPageLoading(directory) with route-specific accessible label and no nested custom card; md breakpoint at >=768px, fluid width | **Class-based responsive evidence, browser 375/767/768 missing** |
| Content/scope | old-lms-pages.md:6: visuals may change, service content may not | Original service calls and college scope retained; case of offering not found continues cross-tenant-safe response | **Source only, no typecheck or runtime service read** |

#### `src/app/(authenticated)/college/courses/offerings/[offeringId]/not-found.tsx`

| Property/state | Legacy source/value | vNext source/value | Strict result |
| --- | --- | --- | --- |
| Canvas/default | old-lms-shell-spec.md:18-20: white #fff canvas, border 1px solid #e5e9f0, radius12, padding24 | ErrorState for missing/cross-tenant offering plus safe 44/36px Back link; inherits one parent PageCanvas | **Source structure aligned, no runtime pixel confirmation** |
| Page heading | legacy-styles/components___listing-page-header.scss:26-35 hairline header border, 52-58 title 28px/600/1.3 (mobile 20px) | Shared PageHeader/ErrorState; no handmade h1 in file | **Known shared PageHeader 30px desktop vs old listing 28px** |
| Button default/secondary | old-lms-shell-spec.md:22-24: primary teal #0a7c88 / white, height36px, radius9, 14px/650; secondary white hairline | ErrorState for missing/cross-tenant offering plus safe 44/36px Back link | **Shared controls match size variant source; full hover active visual unknown** |
| Focus/disabled/loading | legacy-styles/components___button.scss:13-24 150ms transition/hover, 49-51 disabled; form.scss:22-36 :focus-visible | Shared Button/PageBackLink focus-visible, shared loading and error components; no direct hand-rolled controls | **State source reviewed only; no keyboard/hover replay** |
| Error/empty | old-lms-pages.md:6,11: plain in-canvas error/empty, hairline row lists | ErrorState for missing/cross-tenant offering plus safe 44/36px Back link | **No false empty data, exact old error typography unverified** |
| Phone and tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked with 20px heading, 44px touch | ErrorState for missing/cross-tenant offering plus safe 44/36px Back link; md breakpoint at >=768px, fluid width | **Class-based responsive evidence, browser 375/767/768 missing** |
| Content/scope | old-lms-pages.md:6: visuals may change, service content may not | Original service calls and college scope retained; case of offering not found continues cross-tenant-safe response | **Source only, no typecheck or runtime service read** |

#### `src/app/(authenticated)/college/departments/error.tsx`

| Property/state | Legacy source/value | vNext source/value | Strict result |
| --- | --- | --- | --- |
| Canvas/default | old-lms-shell-spec.md:18-20: white #fff canvas, border 1px solid #e5e9f0, radius12, padding24 | Shared ErrorState with route-specific title/copy and secondary Retry (44px phone/36px desktop); inherits one parent PageCanvas | **Source structure aligned, no runtime pixel confirmation** |
| Page heading | legacy-styles/components___listing-page-header.scss:26-35 hairline header border, 52-58 title 28px/600/1.3 (mobile 20px) | Shared PageHeader/ErrorState; no handmade h1 in file | **Known shared PageHeader 30px desktop vs old listing 28px** |
| Button default/secondary | old-lms-shell-spec.md:22-24: primary teal #0a7c88 / white, height36px, radius9, 14px/650; secondary white hairline | Shared ErrorState with route-specific title/copy and secondary Retry (44px phone/36px desktop) | **Shared controls match size variant source; full hover active visual unknown** |
| Focus/disabled/loading | legacy-styles/components___button.scss:13-24 150ms transition/hover, 49-51 disabled; form.scss:22-36 :focus-visible | Shared Button/PageBackLink focus-visible, shared loading and error components; no direct hand-rolled controls | **State source reviewed only; no keyboard/hover replay** |
| Error/empty | old-lms-pages.md:6,11: plain in-canvas error/empty, hairline row lists | Shared ErrorState with route-specific title/copy and secondary Retry (44px phone/36px desktop) | **No false empty data, exact old error typography unverified** |
| Phone and tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked with 20px heading, 44px touch | Shared ErrorState with route-specific title/copy and secondary Retry (44px phone/36px desktop); md breakpoint at >=768px, fluid width | **Class-based responsive evidence, browser 375/767/768 missing** |
| Content/scope | old-lms-pages.md:6: visuals may change, service content may not | Original service calls and college scope retained; case of offering not found continues cross-tenant-safe response | **Source only, no typecheck or runtime service read** |

#### `src/app/(authenticated)/college/departments/loading.tsx`

| Property/state | Legacy source/value | vNext source/value | Strict result |
| --- | --- | --- | --- |
| Canvas/default | old-lms-shell-spec.md:18-20: white #fff canvas, border 1px solid #e5e9f0, radius12, padding24 | Shared GracefulPageLoading(directory) with route-specific accessible label and no nested custom card; inherits one parent PageCanvas | **Source structure aligned, no runtime pixel confirmation** |
| Page heading | legacy-styles/components___listing-page-header.scss:26-35 hairline header border, 52-58 title 28px/600/1.3 (mobile 20px) | Shared PageHeader/ErrorState; no handmade h1 in file | **Known shared PageHeader 30px desktop vs old listing 28px** |
| Button default/secondary | old-lms-shell-spec.md:22-24: primary teal #0a7c88 / white, height36px, radius9, 14px/650; secondary white hairline | Shared GracefulPageLoading(directory) with route-specific accessible label and no nested custom card | **Shared controls match size variant source; full hover active visual unknown** |
| Focus/disabled/loading | legacy-styles/components___button.scss:13-24 150ms transition/hover, 49-51 disabled; form.scss:22-36 :focus-visible | Shared Button/PageBackLink focus-visible, shared loading and error components; no direct hand-rolled controls | **State source reviewed only; no keyboard/hover replay** |
| Error/empty | old-lms-pages.md:6,11: plain in-canvas error/empty, hairline row lists | Shared GracefulPageLoading(directory) with route-specific accessible label and no nested custom card | **No false empty data, exact old error typography unverified** |
| Phone and tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked with 20px heading, 44px touch | Shared GracefulPageLoading(directory) with route-specific accessible label and no nested custom card; md breakpoint at >=768px, fluid width | **Class-based responsive evidence, browser 375/767/768 missing** |
| Content/scope | old-lms-pages.md:6: visuals may change, service content may not | Original service calls and college scope retained; case of offering not found continues cross-tenant-safe response | **Source only, no typecheck or runtime service read** |

#### `src/app/(authenticated)/college/departments/page.tsx`

| Property/state | Legacy source/value | vNext source/value | Strict result |
| --- | --- | --- | --- |
| Canvas/default | old-lms-shell-spec.md:18-20: white #fff canvas, border 1px solid #e5e9f0, radius12, padding24 | Single shared PageHeader, explicit Academic navigation link min-h-11/md:min-h-9, existing DepartmentCreateForm and DepartmentDirectory; inherits one parent PageCanvas | **Source structure aligned, no runtime pixel confirmation** |
| Page heading | legacy-styles/components___listing-page-header.scss:26-35 hairline header border, 52-58 title 28px/600/1.3 (mobile 20px) | Shared PageHeader/ErrorState; no handmade h1 in file | **Known shared PageHeader 30px desktop vs old listing 28px** |
| Button default/secondary | old-lms-shell-spec.md:22-24: primary teal #0a7c88 / white, height36px, radius9, 14px/650; secondary white hairline | Single shared PageHeader, explicit Academic navigation link min-h-11/md:min-h-9, existing DepartmentCreateForm and DepartmentDirectory | **Shared controls match size variant source; full hover active visual unknown** |
| Focus/disabled/loading | legacy-styles/components___button.scss:13-24 150ms transition/hover, 49-51 disabled; form.scss:22-36 :focus-visible | Shared Button/PageBackLink focus-visible, shared loading and error components; no direct hand-rolled controls | **State source reviewed only; no keyboard/hover replay** |
| Error/empty | old-lms-pages.md:6,11: plain in-canvas error/empty, hairline row lists | Single shared PageHeader, explicit Academic navigation link min-h-11/md:min-h-9, existing DepartmentCreateForm and DepartmentDirectory | **No false empty data, exact old error typography unverified** |
| Phone and tablet | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacked with 20px heading, 44px touch | Single shared PageHeader, explicit Academic navigation link min-h-11/md:min-h-9, existing DepartmentCreateForm and DepartmentDirectory; md breakpoint at >=768px, fluid width | **Class-based responsive evidence, browser 375/767/768 missing** |
| Content/scope | old-lms-pages.md:6: visuals may change, service content may not | Original service calls and college scope retained; case of offering not found continues cross-tenant-safe response | **Source only, no typecheck or runtime service read** |

**Strict ticks:** 0 newly ticked. Global grep, all legacy property/state equality, rendered mobile/tablet and TSX parse remain outstanding, and upstream shared header typography mismatch persists. Course offering page content/eyebrow intentionally preserved after source-only experiment; this was not counted as a completed file.

**Exact next file:** `src/app/(authenticated)/college/domains/error.tsx`, followed by `src/app/(authenticated)/college/domains/loading.tsx`, then `src/app/(authenticated)/college/domains/page.tsx`.


### Replacement chat-4: College domain controls and electives directory — 2026-10-20

Six complete files fetched after direct `[chat-4]` branch writes. Existing Super Admin restriction on tenant domains, college module availability guard, CSV export cap and tenant-scoped directory service calls remain unchanged. No shared UI code, auth, backend or page content changed. No CI, browser, runtime, TSX parser or screenshots.

**Grep proof for each full file:** `/<(button|input|select|textarea|table)\b/g`, `/#[a-f0-9]{3,8}\b/gi`, `/fixed inset-0|role=["']dialog["']/g`, `/<h1\b/g`; opening and closing JSX component families compared for local markup. Results are scoped ONLY to six files, not whole repository.

| File | Native control tags | Hex literals | Handmade modal | Native h1 | md/sm tokens |
| --- | ---: | ---: | ---: | ---: | --- |
| `src/app/(authenticated)/college/domains/error.tsx` | 0 | 0 | 0 | 0 | 1/0 |
| `src/app/(authenticated)/college/domains/loading.tsx` | 0 | 0 | 0 | 0 | 0/0 |
| `src/app/(authenticated)/college/domains/page.tsx` | 0 | 0 | 0 | 0 | 0/0 |
| `src/app/(authenticated)/college/electives/error.tsx` | 0 | 0 | 0 | 0 | 1/0 |
| `src/app/(authenticated)/college/electives/loading.tsx` | 0 | 0 | 0 | 0 | 0/0 |
| `src/app/(authenticated)/college/electives/page.tsx` | 0 | 0 | 0 | 0 | 3/0 |

#### `src/app/(authenticated)/college/domains/error.tsx`

| Property/state | Legacy file/value | Current file/value | Strict proof |
| --- | --- | --- | --- |
| Canvas anatomy | old-lms-shell-spec.md:18-20: app #f1f4f9, white #ffffff canvas, 1px solid #e5e9f0, 12px radius, 24px padding | One inherited PageCanvas; no extra handmade page card; Scoped ErrorState with shared secondary Retry Button, min-h-11 md:min-h-9 | **Source structure, exact browser geometry not verified** |
| Page heading | legacy-styles/components___listing-page-header.scss:26-35 header hairline, 52-58 title 28px/600/1.3 desktop, mobile 20px | PageHeader/ErrorState shared; PageHeader renders 30px desktop as of inspection | **Known desktop 28px-vs-30px mismatch, not strict** |
| Button default | old-lms-shell-spec.md:22-24: 36px radius9 primary #0a7c88 text #ffffff size14 weight650, secondary white border | Shared Buttons and direct Links, 44px phone touch and 36px >=768px as applicable | **Class-based values sourced; exact old hover values not computed** |
| Hover/focus/disabled | legacy-styles/components___button.scss:13-24 150ms transitions, 49-51 disabled; form.scss:22-36 keyboard focus-visible | Scoped ErrorState with shared secondary Retry Button, min-h-11 md:min-h-9; shared focus and disabled states | **No focus or disabled browser replay** |
| Error/empty/loading | old-lms-pages.md:6,11-12: slim notices and empty data on single canvas, no inferred missing records | Scoped ErrorState with shared secondary Retry Button, min-h-11 md:min-h-9 | **Shared UI state semantics, exact banner height and icon visuals not proven** |
| Responsive | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacking + h1 20px, 44px touch | File md tokens 1, sm 0; Scoped ErrorState with shared secondary Retry Button, min-h-11 md:min-h-9 | **Source breakpoint compared; actual 375/767/768 screenshots missing** |
| Content/API no-regression | old-lms-pages.md:6: vNext page content stays unchanged | No model/service or permission path changes; existing data and route actions preserved | **Not runtime tested or compiled** |

#### `src/app/(authenticated)/college/domains/loading.tsx`

| Property/state | Legacy file/value | Current file/value | Strict proof |
| --- | --- | --- | --- |
| Canvas anatomy | old-lms-shell-spec.md:18-20: app #f1f4f9, white #ffffff canvas, 1px solid #e5e9f0, 12px radius, 24px padding | One inherited PageCanvas; no extra handmade page card; Shared GracefulPageLoading(directory), descriptive aria label and skeleton without handmade cards | **Source structure, exact browser geometry not verified** |
| Page heading | legacy-styles/components___listing-page-header.scss:26-35 header hairline, 52-58 title 28px/600/1.3 desktop, mobile 20px | PageHeader/ErrorState shared; PageHeader renders 30px desktop as of inspection | **Known desktop 28px-vs-30px mismatch, not strict** |
| Button default | old-lms-shell-spec.md:22-24: 36px radius9 primary #0a7c88 text #ffffff size14 weight650, secondary white border | Shared Buttons and direct Links, 44px phone touch and 36px >=768px as applicable | **Class-based values sourced; exact old hover values not computed** |
| Hover/focus/disabled | legacy-styles/components___button.scss:13-24 150ms transitions, 49-51 disabled; form.scss:22-36 keyboard focus-visible | Shared GracefulPageLoading(directory), descriptive aria label and skeleton without handmade cards; shared focus and disabled states | **No focus or disabled browser replay** |
| Error/empty/loading | old-lms-pages.md:6,11-12: slim notices and empty data on single canvas, no inferred missing records | Shared GracefulPageLoading(directory), descriptive aria label and skeleton without handmade cards | **Shared UI state semantics, exact banner height and icon visuals not proven** |
| Responsive | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacking + h1 20px, 44px touch | File md tokens 0, sm 0; Shared GracefulPageLoading(directory), descriptive aria label and skeleton without handmade cards | **Source breakpoint compared; actual 375/767/768 screenshots missing** |
| Content/API no-regression | old-lms-pages.md:6: vNext page content stays unchanged | No model/service or permission path changes; existing data and route actions preserved | **Not runtime tested or compiled** |

#### `src/app/(authenticated)/college/domains/page.tsx`

| Property/state | Legacy file/value | Current file/value | Strict proof |
| --- | --- | --- | --- |
| Canvas anatomy | old-lms-shell-spec.md:18-20: app #f1f4f9, white #ffffff canvas, 1px solid #e5e9f0, 12px radius, 24px padding | One inherited PageCanvas; no extra handmade page card; PageHeader + Alert(info) for College Admin's restricted domain permissions, single canvas; TenantDomainManager for Super Admin | **Source structure, exact browser geometry not verified** |
| Page heading | legacy-styles/components___listing-page-header.scss:26-35 header hairline, 52-58 title 28px/600/1.3 desktop, mobile 20px | PageHeader/ErrorState shared; PageHeader renders 30px desktop as of inspection | **Known desktop 28px-vs-30px mismatch, not strict** |
| Button default | old-lms-shell-spec.md:22-24: 36px radius9 primary #0a7c88 text #ffffff size14 weight650, secondary white border | Shared Buttons and direct Links, 44px phone touch and 36px >=768px as applicable | **Class-based values sourced; exact old hover values not computed** |
| Hover/focus/disabled | legacy-styles/components___button.scss:13-24 150ms transitions, 49-51 disabled; form.scss:22-36 keyboard focus-visible | PageHeader + Alert(info) for College Admin's restricted domain permissions, single canvas; TenantDomainManager for Super Admin; shared focus and disabled states | **No focus or disabled browser replay** |
| Error/empty/loading | old-lms-pages.md:6,11-12: slim notices and empty data on single canvas, no inferred missing records | PageHeader + Alert(info) for College Admin's restricted domain permissions, single canvas; TenantDomainManager for Super Admin | **Shared UI state semantics, exact banner height and icon visuals not proven** |
| Responsive | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacking + h1 20px, 44px touch | File md tokens 0, sm 0; PageHeader + Alert(info) for College Admin's restricted domain permissions, single canvas; TenantDomainManager for Super Admin | **Source breakpoint compared; actual 375/767/768 screenshots missing** |
| Content/API no-regression | old-lms-pages.md:6: vNext page content stays unchanged | No model/service or permission path changes; existing data and route actions preserved | **Not runtime tested or compiled** |

#### `src/app/(authenticated)/college/electives/error.tsx`

| Property/state | Legacy file/value | Current file/value | Strict proof |
| --- | --- | --- | --- |
| Canvas anatomy | old-lms-shell-spec.md:18-20: app #f1f4f9, white #ffffff canvas, 1px solid #e5e9f0, 12px radius, 24px padding | One inherited PageCanvas; no extra handmade page card; Scoped ErrorState with shared secondary Retry Button, min-h-11 md:min-h-9 | **Source structure, exact browser geometry not verified** |
| Page heading | legacy-styles/components___listing-page-header.scss:26-35 header hairline, 52-58 title 28px/600/1.3 desktop, mobile 20px | PageHeader/ErrorState shared; PageHeader renders 30px desktop as of inspection | **Known desktop 28px-vs-30px mismatch, not strict** |
| Button default | old-lms-shell-spec.md:22-24: 36px radius9 primary #0a7c88 text #ffffff size14 weight650, secondary white border | Shared Buttons and direct Links, 44px phone touch and 36px >=768px as applicable | **Class-based values sourced; exact old hover values not computed** |
| Hover/focus/disabled | legacy-styles/components___button.scss:13-24 150ms transitions, 49-51 disabled; form.scss:22-36 keyboard focus-visible | Scoped ErrorState with shared secondary Retry Button, min-h-11 md:min-h-9; shared focus and disabled states | **No focus or disabled browser replay** |
| Error/empty/loading | old-lms-pages.md:6,11-12: slim notices and empty data on single canvas, no inferred missing records | Scoped ErrorState with shared secondary Retry Button, min-h-11 md:min-h-9 | **Shared UI state semantics, exact banner height and icon visuals not proven** |
| Responsive | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacking + h1 20px, 44px touch | File md tokens 1, sm 0; Scoped ErrorState with shared secondary Retry Button, min-h-11 md:min-h-9 | **Source breakpoint compared; actual 375/767/768 screenshots missing** |
| Content/API no-regression | old-lms-pages.md:6: vNext page content stays unchanged | No model/service or permission path changes; existing data and route actions preserved | **Not runtime tested or compiled** |

#### `src/app/(authenticated)/college/electives/loading.tsx`

| Property/state | Legacy file/value | Current file/value | Strict proof |
| --- | --- | --- | --- |
| Canvas anatomy | old-lms-shell-spec.md:18-20: app #f1f4f9, white #ffffff canvas, 1px solid #e5e9f0, 12px radius, 24px padding | One inherited PageCanvas; no extra handmade page card; Shared GracefulPageLoading(directory), descriptive aria label and skeleton without handmade cards | **Source structure, exact browser geometry not verified** |
| Page heading | legacy-styles/components___listing-page-header.scss:26-35 header hairline, 52-58 title 28px/600/1.3 desktop, mobile 20px | PageHeader/ErrorState shared; PageHeader renders 30px desktop as of inspection | **Known desktop 28px-vs-30px mismatch, not strict** |
| Button default | old-lms-shell-spec.md:22-24: 36px radius9 primary #0a7c88 text #ffffff size14 weight650, secondary white border | Shared Buttons and direct Links, 44px phone touch and 36px >=768px as applicable | **Class-based values sourced; exact old hover values not computed** |
| Hover/focus/disabled | legacy-styles/components___button.scss:13-24 150ms transitions, 49-51 disabled; form.scss:22-36 keyboard focus-visible | Shared GracefulPageLoading(directory), descriptive aria label and skeleton without handmade cards; shared focus and disabled states | **No focus or disabled browser replay** |
| Error/empty/loading | old-lms-pages.md:6,11-12: slim notices and empty data on single canvas, no inferred missing records | Shared GracefulPageLoading(directory), descriptive aria label and skeleton without handmade cards | **Shared UI state semantics, exact banner height and icon visuals not proven** |
| Responsive | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacking + h1 20px, 44px touch | File md tokens 0, sm 0; Shared GracefulPageLoading(directory), descriptive aria label and skeleton without handmade cards | **Source breakpoint compared; actual 375/767/768 screenshots missing** |
| Content/API no-regression | old-lms-pages.md:6: vNext page content stays unchanged | No model/service or permission path changes; existing data and route actions preserved | **Not runtime tested or compiled** |

#### `src/app/(authenticated)/college/electives/page.tsx`

| Property/state | Legacy file/value | Current file/value | Strict proof |
| --- | --- | --- | --- |
| Canvas anatomy | old-lms-shell-spec.md:18-20: app #f1f4f9, white #ffffff canvas, 1px solid #e5e9f0, 12px radius, 24px padding | One inherited PageCanvas; no extra handmade page card; PageHeader, module-off explanatory state, existing CollegeSlotManager/CollegeStructureDirectory and CSS-consistent 44px/36px export links | **Source structure, exact browser geometry not verified** |
| Page heading | legacy-styles/components___listing-page-header.scss:26-35 header hairline, 52-58 title 28px/600/1.3 desktop, mobile 20px | PageHeader/ErrorState shared; PageHeader renders 30px desktop as of inspection | **Known desktop 28px-vs-30px mismatch, not strict** |
| Button default | old-lms-shell-spec.md:22-24: 36px radius9 primary #0a7c88 text #ffffff size14 weight650, secondary white border | Shared Buttons and direct Links, 44px phone touch and 36px >=768px as applicable | **Class-based values sourced; exact old hover values not computed** |
| Hover/focus/disabled | legacy-styles/components___button.scss:13-24 150ms transitions, 49-51 disabled; form.scss:22-36 keyboard focus-visible | PageHeader, module-off explanatory state, existing CollegeSlotManager/CollegeStructureDirectory and CSS-consistent 44px/36px export links; shared focus and disabled states | **No focus or disabled browser replay** |
| Error/empty/loading | old-lms-pages.md:6,11-12: slim notices and empty data on single canvas, no inferred missing records | PageHeader, module-off explanatory state, existing CollegeSlotManager/CollegeStructureDirectory and CSS-consistent 44px/36px export links | **Shared UI state semantics, exact banner height and icon visuals not proven** |
| Responsive | legacy-styles/components___listing-page-header.scss:130-153: <=767px stacking + h1 20px, 44px touch | File md tokens 3, sm 0; PageHeader, module-off explanatory state, existing CollegeSlotManager/CollegeStructureDirectory and CSS-consistent 44px/36px export links | **Source breakpoint compared; actual 375/767/768 screenshots missing** |
| Content/API no-regression | old-lms-pages.md:6: vNext page content stays unchanged | No model/service or permission path changes; existing data and route actions preserved | **Not runtime tested or compiled** |

**Strict ticked in this set: 0.** Neither a full page-tree global zero grep nor all-state browser comparison/TSX compiler evidence is available. Known shared PageHeader mismatch remains open.

**Next exact file:** `src/app/(authenticated)/college/electives/[slotId]/allocate/error.tsx`, then `loading.tsx`, then `page.tsx`.


### Replacement chat-4 — Elective allocation / roster and first group boundaries — 2026-10-20

**Scope:** Nine College Admin TSX files; eight changed in this source-migration batch and the Group CSV Preview loader read/verified unchanged because it already uses the correct shared directory loader. All route data, server actions, college permissions, optimistic guards and wording intentionally retained. Changes are pushed directly to `chatgpt/chat-4-b` only with `[chat-4]`. No CI, build, runtime, screenshot or page interaction executed.

**Full fetched-file source grep, not repo-wide:** `/\<(button|input|select|textarea|table)\b/g`, `/#[a-f0-9]{3,8}\b/gi`, `/fixed inset-0|role=["']dialog["']/g`, `/<h1\b/g`. Equivalent bounded text counts shown below; these are not claims of global `grep -rl` zero. A tag-family open/close scan (Button, Input, Select, Textarea, Checkbox, Alert, EmptyState, ErrorState, PageHeader, DataTable, div, section, form, label, p, nav) found no excess closing elements. This scan is not a TSX parser.

| Route file | Native controls | Hidden transport exemptions | Literal hex | Overlay regex | Native h1 | md/sm source prefixes |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `src/app/(authenticated)/college/electives/[slotId]/allocate/error.tsx` | 0 | 0 | 0 | 0 | 0 | 1 / 0 |
| `src/app/(authenticated)/college/electives/[slotId]/allocate/loading.tsx` | 0 | 0 | 0 | 0 | 0 | 0 / 0 |
| `src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx` | 0 | 0 | 0 | 0 | 0 | 6 / 0 |
| `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/error.tsx` | 0 | 0 | 0 | 0 | 0 | 1 / 0 |
| `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/loading.tsx` | 0 | 0 | 0 | 0 | 0 | 0 / 0 |
| `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx` | 7 | 7 | 0 | 0 | 0 | 5 / 0 |
| `src/app/(authenticated)/college/groups/[groupId]/error.tsx` | 0 | 0 | 0 | 0 | 0 | 1 / 0 |
| `src/app/(authenticated)/college/groups/[groupId]/import-preview/error.tsx` | 0 | 0 | 0 | 0 | 0 | 1 / 0 |
| `src/app/(authenticated)/college/groups/[groupId]/import-preview/loading.tsx` | 0 | 0 | 0 | 0 | 0 | 0 / 0 |

#### `src/app/(authenticated)/college/electives/[slotId]/allocate/error.tsx`

| Property/state | Old LMS reference and exact sourced value | vNext value and location | Strict result |
| --- | --- | --- | --- |
| Canvas/default | old-lms-shell-spec.md:18-20: shell #f1f4f9, one canvas white #fff, border 1px solid #e5e9f0, radius 12px, padding 24px | Shared scoped ErrorState and secondary Retry Button at 44px phone / 36px desktop; no extra PageCanvas | **Inherited layout source; actual computed geometry unverified** |
| Head/title | legacy-styles/components___listing-page-header.scss:26-35 border-bottom 1px; :52-58 title 28px/600/1.3 and tracking -.02em | PageHeader/ErrorState shared; `src/components/ui/page-header.tsx` title 30px desktop /20px mobile | **Known 28px listing-title versus shared 30px mismatch; do not tick** |
| Actions/default | old-lms-shell-spec.md:22-24: primary #0a7c88 white text, height 36px/radius 9px/14px/650; outlined secondary 36px | Shared scoped ErrorState and secondary Retry Button at 44px phone / 36px desktop; shared Button variants and styled links | **Source chrome delegated; pressed/hover exact value incomplete** |
| Focus/active/disabled | legacy-styles/components___button.scss:13-24 150ms transitions, :49-51 disabled; components___form.scss:22-36 preserves keyboard focus-visible | Button reset() via React; disabled absent on retry | **Static states only, keyboard and hover replay absent** |
| Form and field | legacy-styles/components___form.scss:117-143: 10px radius, 14px/400/20px, 0.2px tracking, 2px teal focus and red error halo | No editable user form in this file | **Scoped value source, no focus/browser measurements** |
| Error/empty/loading | old-lms-pages.md:6,11-12: in-canvas states and hairline table rows, no nested cards | Shared scoped ErrorState and secondary Retry Button at 44px phone / 36px desktop; no false no-data reports on route failure | **State composition verified in source; exact legacy banner heights/icons not measured** |
| Responsive 375/767/768 | legacy-styles/components___listing-page-header.scss:130-153: phone <=767px column, title20; >=768px desktop row. old-lms-shell-spec.md:22-24 36px desktop controls | Source: md=1, sm=0; shared components have max-[767px]:min-h-11; touched actions min-h-11 md:min-h-9; file width min-w-0 | **Phone/tablet CSS rule compared from source; live 375/767/768 rendered proof absent** |
| Content and accessibility | old-lms-pages.md:6: vNext page content/permissions unchanged | Shared scoped ErrorState and secondary Retry Button at 44px phone / 36px desktop; aria/roles from shared components, no manually scripted modal | **Permission/JSX source review; compiler and browser interactions not run** |

**Source anchors:** PageHeader line n/a, ErrorState line 5, Alert line n/a, DataTable line n/a, GracefulPageLoading line n/a.

#### `src/app/(authenticated)/college/electives/[slotId]/allocate/loading.tsx`

| Property/state | Old LMS reference and exact sourced value | vNext value and location | Strict result |
| --- | --- | --- | --- |
| Canvas/default | old-lms-shell-spec.md:18-20: shell #f1f4f9, one canvas white #fff, border 1px solid #e5e9f0, radius 12px, padding 24px | Shared GracefulPageLoading(directory) with scoped busy label and delayed recovery state; no extra PageCanvas | **Inherited layout source; actual computed geometry unverified** |
| Head/title | legacy-styles/components___listing-page-header.scss:26-35 border-bottom 1px; :52-58 title 28px/600/1.3 and tracking -.02em | PageHeader/ErrorState shared; `src/components/ui/page-header.tsx` title 30px desktop /20px mobile | **Known 28px listing-title versus shared 30px mismatch; do not tick** |
| Actions/default | old-lms-shell-spec.md:22-24: primary #0a7c88 white text, height 36px/radius 9px/14px/650; outlined secondary 36px | Shared GracefulPageLoading(directory) with scoped busy label and delayed recovery state; shared Button variants and styled links | **Source chrome delegated; pressed/hover exact value incomplete** |
| Focus/active/disabled | legacy-styles/components___button.scss:13-24 150ms transitions, :49-51 disabled; components___form.scss:22-36 preserves keyboard focus-visible | Shared skeleton busy; no premature empty state | **Static states only, keyboard and hover replay absent** |
| Form and field | legacy-styles/components___form.scss:117-143: 10px radius, 14px/400/20px, 0.2px tracking, 2px teal focus and red error halo | No editable user form in this file | **Scoped value source, no focus/browser measurements** |
| Error/empty/loading | old-lms-pages.md:6,11-12: in-canvas states and hairline table rows, no nested cards | Shared GracefulPageLoading(directory) with scoped busy label and delayed recovery state; no false no-data reports on route failure | **State composition verified in source; exact legacy banner heights/icons not measured** |
| Responsive 375/767/768 | legacy-styles/components___listing-page-header.scss:130-153: phone <=767px column, title20; >=768px desktop row. old-lms-shell-spec.md:22-24 36px desktop controls | Source: md=0, sm=0; shared components have max-[767px]:min-h-11; touched actions min-h-11 md:min-h-9; file width min-w-0 | **Phone/tablet CSS rule compared from source; live 375/767/768 rendered proof absent** |
| Content and accessibility | old-lms-pages.md:6: vNext page content/permissions unchanged | Shared GracefulPageLoading(directory) with scoped busy label and delayed recovery state; aria/roles from shared components, no manually scripted modal | **Permission/JSX source review; compiler and browser interactions not run** |

**Source anchors:** PageHeader line n/a, ErrorState line n/a, Alert line n/a, DataTable line n/a, GracefulPageLoading line 3.

#### `src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx`

| Property/state | Old LMS reference and exact sourced value | vNext value and location | Strict result |
| --- | --- | --- | --- |
| Canvas/default | old-lms-shell-spec.md:18-20: shell #f1f4f9, one canvas white #fff, border 1px solid #e5e9f0, radius 12px, padding 24px | Allocation form now shared Select/Input/Textarea/Checkbox, DataTable and EmptyState, Alert(success/warning), 500-row cap and server mutation preserved; no extra PageCanvas | **Inherited layout source; actual computed geometry unverified** |
| Head/title | legacy-styles/components___listing-page-header.scss:26-35 border-bottom 1px; :52-58 title 28px/600/1.3 and tracking -.02em | PageHeader/ErrorState shared; `src/components/ui/page-header.tsx` title 30px desktop /20px mobile | **Known 28px listing-title versus shared 30px mismatch; do not tick** |
| Actions/default | old-lms-shell-spec.md:22-24: primary #0a7c88 white text, height 36px/radius 9px/14px/650; outlined secondary 36px | Allocation form now shared Select/Input/Textarea/Checkbox, DataTable and EmptyState, Alert(success/warning), 500-row cap and server mutation preserved; shared Button variants and styled links | **Source chrome delegated; pressed/hover exact value incomplete** |
| Focus/active/disabled | legacy-styles/components___button.scss:13-24 150ms transitions, :49-51 disabled; components___form.scss:22-36 preserves keyboard focus-visible | Submit disabled when zero offerings; native semantics retained through shared Checkbox | **Static states only, keyboard and hover replay absent** |
| Form and field | legacy-styles/components___form.scss:117-143: 10px radius, 14px/400/20px, 0.2px tracking, 2px teal focus and red error halo | `Select/Input/Textarea` use shared field tokens, 1 `Checkbox`, no native visual control | **Scoped value source, no focus/browser measurements** |
| Error/empty/loading | old-lms-pages.md:6,11-12: in-canvas states and hairline table rows, no nested cards | Allocation form now shared Select/Input/Textarea/Checkbox, DataTable and EmptyState, Alert(success/warning), 500-row cap and server mutation preserved; no false no-data reports on route failure | **State composition verified in source; exact legacy banner heights/icons not measured** |
| Responsive 375/767/768 | legacy-styles/components___listing-page-header.scss:130-153: phone <=767px column, title20; >=768px desktop row. old-lms-shell-spec.md:22-24 36px desktop controls | Source: md=6, sm=0; shared components have max-[767px]:min-h-11; touched actions min-h-11 md:min-h-9; file width min-w-0 | **Phone/tablet CSS rule compared from source; live 375/767/768 rendered proof absent** |
| Content and accessibility | old-lms-pages.md:6: vNext page content/permissions unchanged | Allocation form now shared Select/Input/Textarea/Checkbox, DataTable and EmptyState, Alert(success/warning), 500-row cap and server mutation preserved; aria/roles from shared components, no manually scripted modal | **Permission/JSX source review; compiler and browser interactions not run** |

**Source anchors:** PageHeader line 162, ErrorState line n/a, Alert line 165, DataTable line 194, GracefulPageLoading line n/a.

#### `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/error.tsx`

| Property/state | Old LMS reference and exact sourced value | vNext value and location | Strict result |
| --- | --- | --- | --- |
| Canvas/default | old-lms-shell-spec.md:18-20: shell #f1f4f9, one canvas white #fff, border 1px solid #e5e9f0, radius 12px, padding 24px | Shared scoped ErrorState and secondary Retry Button at 44px phone / 36px desktop; no extra PageCanvas | **Inherited layout source; actual computed geometry unverified** |
| Head/title | legacy-styles/components___listing-page-header.scss:26-35 border-bottom 1px; :52-58 title 28px/600/1.3 and tracking -.02em | PageHeader/ErrorState shared; `src/components/ui/page-header.tsx` title 30px desktop /20px mobile | **Known 28px listing-title versus shared 30px mismatch; do not tick** |
| Actions/default | old-lms-shell-spec.md:22-24: primary #0a7c88 white text, height 36px/radius 9px/14px/650; outlined secondary 36px | Shared scoped ErrorState and secondary Retry Button at 44px phone / 36px desktop; shared Button variants and styled links | **Source chrome delegated; pressed/hover exact value incomplete** |
| Focus/active/disabled | legacy-styles/components___button.scss:13-24 150ms transitions, :49-51 disabled; components___form.scss:22-36 preserves keyboard focus-visible | Button reset() via React; disabled absent on retry | **Static states only, keyboard and hover replay absent** |
| Form and field | legacy-styles/components___form.scss:117-143: 10px radius, 14px/400/20px, 0.2px tracking, 2px teal focus and red error halo | No editable user form in this file | **Scoped value source, no focus/browser measurements** |
| Error/empty/loading | old-lms-pages.md:6,11-12: in-canvas states and hairline table rows, no nested cards | Shared scoped ErrorState and secondary Retry Button at 44px phone / 36px desktop; no false no-data reports on route failure | **State composition verified in source; exact legacy banner heights/icons not measured** |
| Responsive 375/767/768 | legacy-styles/components___listing-page-header.scss:130-153: phone <=767px column, title20; >=768px desktop row. old-lms-shell-spec.md:22-24 36px desktop controls | Source: md=1, sm=0; shared components have max-[767px]:min-h-11; touched actions min-h-11 md:min-h-9; file width min-w-0 | **Phone/tablet CSS rule compared from source; live 375/767/768 rendered proof absent** |
| Content and accessibility | old-lms-pages.md:6: vNext page content/permissions unchanged | Shared scoped ErrorState and secondary Retry Button at 44px phone / 36px desktop; aria/roles from shared components, no manually scripted modal | **Permission/JSX source review; compiler and browser interactions not run** |

**Source anchors:** PageHeader line n/a, ErrorState line 5, Alert line n/a, DataTable line n/a, GracefulPageLoading line n/a.

#### `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/loading.tsx`

| Property/state | Old LMS reference and exact sourced value | vNext value and location | Strict result |
| --- | --- | --- | --- |
| Canvas/default | old-lms-shell-spec.md:18-20: shell #f1f4f9, one canvas white #fff, border 1px solid #e5e9f0, radius 12px, padding 24px | Shared GracefulPageLoading(directory) with scoped busy label and delayed recovery state; no extra PageCanvas | **Inherited layout source; actual computed geometry unverified** |
| Head/title | legacy-styles/components___listing-page-header.scss:26-35 border-bottom 1px; :52-58 title 28px/600/1.3 and tracking -.02em | PageHeader/ErrorState shared; `src/components/ui/page-header.tsx` title 30px desktop /20px mobile | **Known 28px listing-title versus shared 30px mismatch; do not tick** |
| Actions/default | old-lms-shell-spec.md:22-24: primary #0a7c88 white text, height 36px/radius 9px/14px/650; outlined secondary 36px | Shared GracefulPageLoading(directory) with scoped busy label and delayed recovery state; shared Button variants and styled links | **Source chrome delegated; pressed/hover exact value incomplete** |
| Focus/active/disabled | legacy-styles/components___button.scss:13-24 150ms transitions, :49-51 disabled; components___form.scss:22-36 preserves keyboard focus-visible | Shared skeleton busy; no premature empty state | **Static states only, keyboard and hover replay absent** |
| Form and field | legacy-styles/components___form.scss:117-143: 10px radius, 14px/400/20px, 0.2px tracking, 2px teal focus and red error halo | No editable user form in this file | **Scoped value source, no focus/browser measurements** |
| Error/empty/loading | old-lms-pages.md:6,11-12: in-canvas states and hairline table rows, no nested cards | Shared GracefulPageLoading(directory) with scoped busy label and delayed recovery state; no false no-data reports on route failure | **State composition verified in source; exact legacy banner heights/icons not measured** |
| Responsive 375/767/768 | legacy-styles/components___listing-page-header.scss:130-153: phone <=767px column, title20; >=768px desktop row. old-lms-shell-spec.md:22-24 36px desktop controls | Source: md=0, sm=0; shared components have max-[767px]:min-h-11; touched actions min-h-11 md:min-h-9; file width min-w-0 | **Phone/tablet CSS rule compared from source; live 375/767/768 rendered proof absent** |
| Content and accessibility | old-lms-pages.md:6: vNext page content/permissions unchanged | Shared GracefulPageLoading(directory) with scoped busy label and delayed recovery state; aria/roles from shared components, no manually scripted modal | **Permission/JSX source review; compiler and browser interactions not run** |

**Source anchors:** PageHeader line n/a, ErrorState line n/a, Alert line n/a, DataTable line n/a, GracefulPageLoading line 3.

#### `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx`

| Property/state | Old LMS reference and exact sourced value | vNext value and location | Strict result |
| --- | --- | --- | --- |
| Canvas/default | old-lms-shell-spec.md:18-20: shell #f1f4f9, one canvas white #fff, border 1px solid #e5e9f0, radius 12px, padding 24px | Roster rows retain hidden action and membershipId transport inputs (7 explicit exemptions); visible two native confirmation checkboxes switched to shared Checkbox, feedback to Alert and StatusBadge; roster DataTable EmptyState, server mutations unchanged; no extra PageCanvas | **Inherited layout source; actual computed geometry unverified** |
| Head/title | legacy-styles/components___listing-page-header.scss:26-35 border-bottom 1px; :52-58 title 28px/600/1.3 and tracking -.02em | PageHeader/ErrorState shared; `src/components/ui/page-header.tsx` title 30px desktop /20px mobile | **Known 28px listing-title versus shared 30px mismatch; do not tick** |
| Actions/default | old-lms-shell-spec.md:22-24: primary #0a7c88 white text, height 36px/radius 9px/14px/650; outlined secondary 36px | Roster rows retain hidden action and membershipId transport inputs (7 explicit exemptions); visible two native confirmation checkboxes switched to shared Checkbox, feedback to Alert and StatusBadge; roster DataTable EmptyState, server mutations unchanged; shared Button variants and styled links | **Source chrome delegated; pressed/hover exact value incomplete** |
| Focus/active/disabled | legacy-styles/components___button.scss:13-24 150ms transitions, :49-51 disabled; components___form.scss:22-36 preserves keyboard focus-visible | Native hidden form values unchanged; shared Confirm Checkbox checked state delegated | **Static states only, keyboard and hover replay absent** |
| Form and field | legacy-styles/components___form.scss:117-143: 10px radius, 14px/400/20px, 0.2px tracking, 2px teal focus and red error halo | `Select/Checkbox` shared; 7 native input type=hidden retained only as form transport | **Scoped value source, no focus/browser measurements** |
| Error/empty/loading | old-lms-pages.md:6,11-12: in-canvas states and hairline table rows, no nested cards | Roster rows retain hidden action and membershipId transport inputs (7 explicit exemptions); visible two native confirmation checkboxes switched to shared Checkbox, feedback to Alert and StatusBadge; roster DataTable EmptyState, server mutations unchanged; no false no-data reports on route failure | **State composition verified in source; exact legacy banner heights/icons not measured** |
| Responsive 375/767/768 | legacy-styles/components___listing-page-header.scss:130-153: phone <=767px column, title20; >=768px desktop row. old-lms-shell-spec.md:22-24 36px desktop controls | Source: md=5, sm=0; shared components have max-[767px]:min-h-11; touched actions min-h-11 md:min-h-9; file width min-w-0 | **Phone/tablet CSS rule compared from source; live 375/767/768 rendered proof absent** |
| Content and accessibility | old-lms-pages.md:6: vNext page content/permissions unchanged | Roster rows retain hidden action and membershipId transport inputs (7 explicit exemptions); visible two native confirmation checkboxes switched to shared Checkbox, feedback to Alert and StatusBadge; roster DataTable EmptyState, server mutations unchanged; aria/roles from shared components, no manually scripted modal | **Permission/JSX source review; compiler and browser interactions not run** |

**Source anchors:** PageHeader line 119, ErrorState line n/a, Alert line 130, DataTable line 165, GracefulPageLoading line n/a. **Explicit native-hidden exemptions:** 7 occurrences, `input type="hidden"` for server-action routing and membership IDs. No visible native input remains.

#### `src/app/(authenticated)/college/groups/[groupId]/error.tsx`

| Property/state | Old LMS reference and exact sourced value | vNext value and location | Strict result |
| --- | --- | --- | --- |
| Canvas/default | old-lms-shell-spec.md:18-20: shell #f1f4f9, one canvas white #fff, border 1px solid #e5e9f0, radius 12px, padding 24px | Shared scoped ErrorState and secondary Retry Button at 44px phone / 36px desktop; no extra PageCanvas | **Inherited layout source; actual computed geometry unverified** |
| Head/title | legacy-styles/components___listing-page-header.scss:26-35 border-bottom 1px; :52-58 title 28px/600/1.3 and tracking -.02em | PageHeader/ErrorState shared; `src/components/ui/page-header.tsx` title 30px desktop /20px mobile | **Known 28px listing-title versus shared 30px mismatch; do not tick** |
| Actions/default | old-lms-shell-spec.md:22-24: primary #0a7c88 white text, height 36px/radius 9px/14px/650; outlined secondary 36px | Shared scoped ErrorState and secondary Retry Button at 44px phone / 36px desktop; shared Button variants and styled links | **Source chrome delegated; pressed/hover exact value incomplete** |
| Focus/active/disabled | legacy-styles/components___button.scss:13-24 150ms transitions, :49-51 disabled; components___form.scss:22-36 preserves keyboard focus-visible | Button reset() via React; disabled absent on retry | **Static states only, keyboard and hover replay absent** |
| Form and field | legacy-styles/components___form.scss:117-143: 10px radius, 14px/400/20px, 0.2px tracking, 2px teal focus and red error halo | No editable user form in this file | **Scoped value source, no focus/browser measurements** |
| Error/empty/loading | old-lms-pages.md:6,11-12: in-canvas states and hairline table rows, no nested cards | Shared scoped ErrorState and secondary Retry Button at 44px phone / 36px desktop; no false no-data reports on route failure | **State composition verified in source; exact legacy banner heights/icons not measured** |
| Responsive 375/767/768 | legacy-styles/components___listing-page-header.scss:130-153: phone <=767px column, title20; >=768px desktop row. old-lms-shell-spec.md:22-24 36px desktop controls | Source: md=1, sm=0; shared components have max-[767px]:min-h-11; touched actions min-h-11 md:min-h-9; file width min-w-0 | **Phone/tablet CSS rule compared from source; live 375/767/768 rendered proof absent** |
| Content and accessibility | old-lms-pages.md:6: vNext page content/permissions unchanged | Shared scoped ErrorState and secondary Retry Button at 44px phone / 36px desktop; aria/roles from shared components, no manually scripted modal | **Permission/JSX source review; compiler and browser interactions not run** |

**Source anchors:** PageHeader line n/a, ErrorState line 10, Alert line n/a, DataTable line n/a, GracefulPageLoading line n/a.

#### `src/app/(authenticated)/college/groups/[groupId]/import-preview/error.tsx`

| Property/state | Old LMS reference and exact sourced value | vNext value and location | Strict result |
| --- | --- | --- | --- |
| Canvas/default | old-lms-shell-spec.md:18-20: shell #f1f4f9, one canvas white #fff, border 1px solid #e5e9f0, radius 12px, padding 24px | Shared scoped ErrorState and secondary Retry Button at 44px phone / 36px desktop; no extra PageCanvas | **Inherited layout source; actual computed geometry unverified** |
| Head/title | legacy-styles/components___listing-page-header.scss:26-35 border-bottom 1px; :52-58 title 28px/600/1.3 and tracking -.02em | PageHeader/ErrorState shared; `src/components/ui/page-header.tsx` title 30px desktop /20px mobile | **Known 28px listing-title versus shared 30px mismatch; do not tick** |
| Actions/default | old-lms-shell-spec.md:22-24: primary #0a7c88 white text, height 36px/radius 9px/14px/650; outlined secondary 36px | Shared scoped ErrorState and secondary Retry Button at 44px phone / 36px desktop; shared Button variants and styled links | **Source chrome delegated; pressed/hover exact value incomplete** |
| Focus/active/disabled | legacy-styles/components___button.scss:13-24 150ms transitions, :49-51 disabled; components___form.scss:22-36 preserves keyboard focus-visible | Button reset() via React; disabled absent on retry | **Static states only, keyboard and hover replay absent** |
| Form and field | legacy-styles/components___form.scss:117-143: 10px radius, 14px/400/20px, 0.2px tracking, 2px teal focus and red error halo | No editable user form in this file | **Scoped value source, no focus/browser measurements** |
| Error/empty/loading | old-lms-pages.md:6,11-12: in-canvas states and hairline table rows, no nested cards | Shared scoped ErrorState and secondary Retry Button at 44px phone / 36px desktop; no false no-data reports on route failure | **State composition verified in source; exact legacy banner heights/icons not measured** |
| Responsive 375/767/768 | legacy-styles/components___listing-page-header.scss:130-153: phone <=767px column, title20; >=768px desktop row. old-lms-shell-spec.md:22-24 36px desktop controls | Source: md=1, sm=0; shared components have max-[767px]:min-h-11; touched actions min-h-11 md:min-h-9; file width min-w-0 | **Phone/tablet CSS rule compared from source; live 375/767/768 rendered proof absent** |
| Content and accessibility | old-lms-pages.md:6: vNext page content/permissions unchanged | Shared scoped ErrorState and secondary Retry Button at 44px phone / 36px desktop; aria/roles from shared components, no manually scripted modal | **Permission/JSX source review; compiler and browser interactions not run** |

**Source anchors:** PageHeader line n/a, ErrorState line 7, Alert line n/a, DataTable line n/a, GracefulPageLoading line n/a.

#### `src/app/(authenticated)/college/groups/[groupId]/import-preview/loading.tsx`

| Property/state | Old LMS reference and exact sourced value | vNext value and location | Strict result |
| --- | --- | --- | --- |
| Canvas/default | old-lms-shell-spec.md:18-20: shell #f1f4f9, one canvas white #fff, border 1px solid #e5e9f0, radius 12px, padding 24px | Shared GracefulPageLoading(directory) with scoped busy label and delayed recovery state; no extra PageCanvas | **Inherited layout source; actual computed geometry unverified** |
| Head/title | legacy-styles/components___listing-page-header.scss:26-35 border-bottom 1px; :52-58 title 28px/600/1.3 and tracking -.02em | PageHeader/ErrorState shared; `src/components/ui/page-header.tsx` title 30px desktop /20px mobile | **Known 28px listing-title versus shared 30px mismatch; do not tick** |
| Actions/default | old-lms-shell-spec.md:22-24: primary #0a7c88 white text, height 36px/radius 9px/14px/650; outlined secondary 36px | Shared GracefulPageLoading(directory) with scoped busy label and delayed recovery state; shared Button variants and styled links | **Source chrome delegated; pressed/hover exact value incomplete** |
| Focus/active/disabled | legacy-styles/components___button.scss:13-24 150ms transitions, :49-51 disabled; components___form.scss:22-36 preserves keyboard focus-visible | Shared skeleton busy; no premature empty state | **Static states only, keyboard and hover replay absent** |
| Form and field | legacy-styles/components___form.scss:117-143: 10px radius, 14px/400/20px, 0.2px tracking, 2px teal focus and red error halo | No editable user form in this file | **Scoped value source, no focus/browser measurements** |
| Error/empty/loading | old-lms-pages.md:6,11-12: in-canvas states and hairline table rows, no nested cards | Shared GracefulPageLoading(directory) with scoped busy label and delayed recovery state; no false no-data reports on route failure | **State composition verified in source; exact legacy banner heights/icons not measured** |
| Responsive 375/767/768 | legacy-styles/components___listing-page-header.scss:130-153: phone <=767px column, title20; >=768px desktop row. old-lms-shell-spec.md:22-24 36px desktop controls | Source: md=0, sm=0; shared components have max-[767px]:min-h-11; touched actions min-h-11 md:min-h-9; file width min-w-0 | **Phone/tablet CSS rule compared from source; live 375/767/768 rendered proof absent** |
| Content and accessibility | old-lms-pages.md:6: vNext page content/permissions unchanged | Shared GracefulPageLoading(directory) with scoped busy label and delayed recovery state; aria/roles from shared components, no manually scripted modal | **Permission/JSX source review; compiler and browser interactions not run** |

**Source anchors:** PageHeader line n/a, ErrorState line n/a, Alert line n/a, DataTable line n/a, GracefulPageLoading line 4.

**STRICT TICK RULE:** zero new checked. Full global coverage grep, full computed-state legacy CSS equality, phone/tablet rendered layout and TypeScript/JSX parser still missing. Review is **source-pass**, not a certified pixel clone.


### Replacement chat-4 — College Groups directory, detail, rule and import preview — 2026-10-20

**Work delivered:** nine routes inspected, seven source-updated in this batch and existing shared detail/root loading pages source-reviewed without unnecessary changes. No content/API/permissions changed. Repaired invalid stray `-` tokens in detail grid class strings. Read-back audit of persisted branch blobs; no CI, app execution or JSX parser/browser.

**Scoped full-file regex/grep:** `/<(button|input|select|textarea|table)\b/g` visible/native form controls; `/#[a-f0-9]{3,8}\b/gi` literal colours; `/fixed inset-0|role=["']dialog["']/g` hand overlays; `/<h1\b/g` native h1. JSX paired closing families checked for local div, p, nav, section, form, label, Button, EmptyState, DataTable, PageHeader, PageBackLink and GracefulPageLoading; zero excess closing families. No global repository proof implied.

| Route | Raw controls | Hex | Manual overlay | Native h1 | md/sm responsive prefixes | Broken `grid gap-4 -` |
| --- | ---: | ---: | ---: | ---: | --- | ---: |
| `src/app/(authenticated)/college/groups/[groupId]/import-preview/page.tsx` | 0 | 0 | 0 | 0 | 0 / 0 | 0 |
| `src/app/(authenticated)/college/groups/[groupId]/loading.tsx` | 0 | 0 | 0 | 0 | 0 / 0 | 0 |
| `src/app/(authenticated)/college/groups/[groupId]/page.tsx` | 0 | 0 | 0 | 0 | 5 / 0 | 0 |
| `src/app/(authenticated)/college/groups/[groupId]/rule-preview/error.tsx` | 0 | 0 | 0 | 0 | 1 / 0 | 0 |
| `src/app/(authenticated)/college/groups/[groupId]/rule-preview/loading.tsx` | 0 | 0 | 0 | 0 | 0 / 0 | 0 |
| `src/app/(authenticated)/college/groups/[groupId]/rule-preview/page.tsx` | 0 | 0 | 0 | 0 | 4 / 0 | 0 |
| `src/app/(authenticated)/college/groups/error.tsx` | 0 | 0 | 0 | 0 | 1 / 0 | 0 |
| `src/app/(authenticated)/college/groups/loading.tsx` | 0 | 0 | 0 | 0 | 0 / 0 | 0 |
| `src/app/(authenticated)/college/groups/page.tsx` | 0 | 0 | 0 | 0 | 6 / 0 | 0 |

#### `src/app/(authenticated)/college/groups/[groupId]/import-preview/page.tsx`

| Property/state | Legacy file and value | vNext source/value | Verification |
| --- | --- | --- | --- |
| Page canvas/default | old-lms-shell-spec.md:18-20 white #fff canvas, border #e5e9f0 1px radius12 padding24, continuous surface | No extra PageCanvas and ordinary group stats/rows separated by hairlines; Shared PageBackLink with unchanged groupId href; PageHeader subtitle unchanged | **Source anatomy; browser-computed px unverified** |
| Heading baseline | legacy-styles/components___listing-page-header.scss:26-35 hairline border, 52-58 title28px weight600 line-height1.3 tracking-.02em; mobile title20px | Shared PageHeader/ErrorState; central header renders desktop30px and mobile20px | **28px vs shared 30px discrepancy blocks tick** |
| Buttons/default | old-lms-shell-spec.md:22-24 primary #0a7c88 on white, radius9 height36 font14/650, secondary border white/36px | Shared Button/PageBackLink or keyboard-capable Link min-h-11/md:min-h-9; Shared PageBackLink with unchanged groupId href; PageHeader subtitle unchanged | **Component source family, exact computed colours/active not verified** |
| Focus/hover/disabled | legacy-styles/components___button.scss:13-24 150ms transitions and hover, :49-51 disabled; form.scss:22-36 :focus-visible keyboard state | Existing form state/disabled guard unchanged; shared components own focus/disabled | **Unplayed browser states and no all-property CSS comparison** |
| List rows/cards | old-lms-pages.md:6,11 compact hairline-bordered DataTable, not a card for each ordinary record | Shared PageBackLink with unchanged groupId href; PageHeader subtitle unchanged | **Source pattern matches canvas layout, measured row heights/spacing not verified** |
| Loading/error/empty | old-lms-pages.md:6,11-12: in-canvas loading/error/empty distinct; pale yellow info strip not fake no-data | Shared PageBackLink with unchanged groupId href; PageHeader subtitle unchanged | **State coverage at source but no screen-specific legacy capture** |
| Responsive @375/767/768 | legacy-styles/components___listing-page-header.scss:130-153 stacked <=767px, 20px h1, action targets44px; 768+ horizontal | md breakpoint count 0, sm count 0; Shared PageBackLink with unchanged groupId href; PageHeader subtitle unchanged | **Static source review only; live responsive render/screenshots not produced** |
| Markup/data preservation | old-lms-pages.md:6: preserve vNext page contents/service records | Original membership rules, waitlist and group boundaries, IST date strings, server reads and actions unchanged; no new public fields | **No typecheck/runtime/keyboard; scope/pair scan only** |

Source anchors: PageHeader:27, DataTable:n/a, EmptyState:n/a, ErrorState:n/a, GracefulPageLoading:n/a, PageBackLink:30. No raw user controls locally.

#### `src/app/(authenticated)/college/groups/[groupId]/loading.tsx`

| Property/state | Legacy file and value | vNext source/value | Verification |
| --- | --- | --- | --- |
| Page canvas/default | old-lms-shell-spec.md:18-20 white #fff canvas, border #e5e9f0 1px radius12 padding24, continuous surface | No extra PageCanvas and ordinary group stats/rows separated by hairlines; Shared GracefulPageLoading with route-specific label; Group Rule Preview uses card-shape skeleton; directory/detail/import-preview use directory-shape skeleton | **Source anatomy; browser-computed px unverified** |
| Heading baseline | legacy-styles/components___listing-page-header.scss:26-35 hairline border, 52-58 title28px weight600 line-height1.3 tracking-.02em; mobile title20px | Shared PageHeader/ErrorState; central header renders desktop30px and mobile20px | **28px vs shared 30px discrepancy blocks tick** |
| Buttons/default | old-lms-shell-spec.md:22-24 primary #0a7c88 on white, radius9 height36 font14/650, secondary border white/36px | Shared Button/PageBackLink or keyboard-capable Link min-h-11/md:min-h-9; Shared GracefulPageLoading with route-specific label; Group Rule Preview uses card-shape skeleton; directory/detail/import-preview use directory-shape skeleton | **Component source family, exact computed colours/active not verified** |
| Focus/hover/disabled | legacy-styles/components___button.scss:13-24 150ms transitions and hover, :49-51 disabled; form.scss:22-36 :focus-visible keyboard state | Skeleton busy and deferred recovery handled by shared loading component | **Unplayed browser states and no all-property CSS comparison** |
| List rows/cards | old-lms-pages.md:6,11 compact hairline-bordered DataTable, not a card for each ordinary record | Shared GracefulPageLoading with route-specific label; Group Rule Preview uses card-shape skeleton; directory/detail/import-preview use directory-shape skeleton | **Source pattern matches canvas layout, measured row heights/spacing not verified** |
| Loading/error/empty | old-lms-pages.md:6,11-12: in-canvas loading/error/empty distinct; pale yellow info strip not fake no-data | Shared GracefulPageLoading with route-specific label; Group Rule Preview uses card-shape skeleton; directory/detail/import-preview use directory-shape skeleton | **State coverage at source but no screen-specific legacy capture** |
| Responsive @375/767/768 | legacy-styles/components___listing-page-header.scss:130-153 stacked <=767px, 20px h1, action targets44px; 768+ horizontal | md breakpoint count 0, sm count 0; Shared GracefulPageLoading with route-specific label; Group Rule Preview uses card-shape skeleton; directory/detail/import-preview use directory-shape skeleton | **Static source review only; live responsive render/screenshots not produced** |
| Markup/data preservation | old-lms-pages.md:6: preserve vNext page contents/service records | Original membership rules, waitlist and group boundaries, IST date strings, server reads and actions unchanged; no new public fields | **No typecheck/runtime/keyboard; scope/pair scan only** |

Source anchors: PageHeader:n/a, DataTable:n/a, EmptyState:n/a, ErrorState:n/a, GracefulPageLoading:4, PageBackLink:n/a. No raw user controls locally.

#### `src/app/(authenticated)/college/groups/[groupId]/page.tsx`

| Property/state | Legacy file and value | vNext source/value | Verification |
| --- | --- | --- | --- |
| Page canvas/default | old-lms-shell-spec.md:18-20 white #fff canvas, border #e5e9f0 1px radius12 padding24, continuous surface | No extra PageCanvas and ordinary group stats/rows separated by hairlines; Broken `grid gap-4 - sm:grid-cols-2/3` class fixed to min-w-0 md:grid-cols-2/3, group status badge and EmptyState in table; 44px navigation | **Source anatomy; browser-computed px unverified** |
| Heading baseline | legacy-styles/components___listing-page-header.scss:26-35 hairline border, 52-58 title28px weight600 line-height1.3 tracking-.02em; mobile title20px | Shared PageHeader/ErrorState; central header renders desktop30px and mobile20px | **28px vs shared 30px discrepancy blocks tick** |
| Buttons/default | old-lms-shell-spec.md:22-24 primary #0a7c88 on white, radius9 height36 font14/650, secondary border white/36px | Shared Button/PageBackLink or keyboard-capable Link min-h-11/md:min-h-9; Broken `grid gap-4 - sm:grid-cols-2/3` class fixed to min-w-0 md:grid-cols-2/3, group status badge and EmptyState in table; 44px navigation | **Component source family, exact computed colours/active not verified** |
| Focus/hover/disabled | legacy-styles/components___button.scss:13-24 150ms transitions and hover, :49-51 disabled; form.scss:22-36 :focus-visible keyboard state | Existing form state/disabled guard unchanged; shared components own focus/disabled | **Unplayed browser states and no all-property CSS comparison** |
| List rows/cards | old-lms-pages.md:6,11 compact hairline-bordered DataTable, not a card for each ordinary record | Broken `grid gap-4 - sm:grid-cols-2/3` class fixed to min-w-0 md:grid-cols-2/3, group status badge and EmptyState in table; 44px navigation | **Source pattern matches canvas layout, measured row heights/spacing not verified** |
| Loading/error/empty | old-lms-pages.md:6,11-12: in-canvas loading/error/empty distinct; pale yellow info strip not fake no-data | Broken `grid gap-4 - sm:grid-cols-2/3` class fixed to min-w-0 md:grid-cols-2/3, group status badge and EmptyState in table; 44px navigation | **State coverage at source but no screen-specific legacy capture** |
| Responsive @375/767/768 | legacy-styles/components___listing-page-header.scss:130-153 stacked <=767px, 20px h1, action targets44px; 768+ horizontal | md breakpoint count 5, sm count 0; Broken `grid gap-4 - sm:grid-cols-2/3` class fixed to min-w-0 md:grid-cols-2/3, group status badge and EmptyState in table; 44px navigation | **Static source review only; live responsive render/screenshots not produced** |
| Markup/data preservation | old-lms-pages.md:6: preserve vNext page contents/service records | Original membership rules, waitlist and group boundaries, IST date strings, server reads and actions unchanged; no new public fields | **No typecheck/runtime/keyboard; scope/pair scan only** |

Source anchors: PageHeader:83, DataTable:162, EmptyState:160, ErrorState:n/a, GracefulPageLoading:n/a, PageBackLink:n/a. No raw user controls locally.

#### `src/app/(authenticated)/college/groups/[groupId]/rule-preview/error.tsx`

| Property/state | Legacy file and value | vNext source/value | Verification |
| --- | --- | --- | --- |
| Page canvas/default | old-lms-shell-spec.md:18-20 white #fff canvas, border #e5e9f0 1px radius12 padding24, continuous surface | No extra PageCanvas and ordinary group stats/rows separated by hairlines; Existing scoped ErrorState and a secondary Retry Button with min-h-11/md:min-h-9 | **Source anatomy; browser-computed px unverified** |
| Heading baseline | legacy-styles/components___listing-page-header.scss:26-35 hairline border, 52-58 title28px weight600 line-height1.3 tracking-.02em; mobile title20px | Shared PageHeader/ErrorState; central header renders desktop30px and mobile20px | **28px vs shared 30px discrepancy blocks tick** |
| Buttons/default | old-lms-shell-spec.md:22-24 primary #0a7c88 on white, radius9 height36 font14/650, secondary border white/36px | Shared Button/PageBackLink or keyboard-capable Link min-h-11/md:min-h-9; Existing scoped ErrorState and a secondary Retry Button with min-h-11/md:min-h-9 | **Component source family, exact computed colours/active not verified** |
| Focus/hover/disabled | legacy-styles/components___button.scss:13-24 150ms transitions and hover, :49-51 disabled; form.scss:22-36 :focus-visible keyboard state | Secondary Retry calls reset; Button keyboard/focus delegated | **Unplayed browser states and no all-property CSS comparison** |
| List rows/cards | old-lms-pages.md:6,11 compact hairline-bordered DataTable, not a card for each ordinary record | Existing scoped ErrorState and a secondary Retry Button with min-h-11/md:min-h-9 | **Source pattern matches canvas layout, measured row heights/spacing not verified** |
| Loading/error/empty | old-lms-pages.md:6,11-12: in-canvas loading/error/empty distinct; pale yellow info strip not fake no-data | Existing scoped ErrorState and a secondary Retry Button with min-h-11/md:min-h-9 | **State coverage at source but no screen-specific legacy capture** |
| Responsive @375/767/768 | legacy-styles/components___listing-page-header.scss:130-153 stacked <=767px, 20px h1, action targets44px; 768+ horizontal | md breakpoint count 1, sm count 0; Existing scoped ErrorState and a secondary Retry Button with min-h-11/md:min-h-9 | **Static source review only; live responsive render/screenshots not produced** |
| Markup/data preservation | old-lms-pages.md:6: preserve vNext page contents/service records | Original membership rules, waitlist and group boundaries, IST date strings, server reads and actions unchanged; no new public fields | **No typecheck/runtime/keyboard; scope/pair scan only** |

Source anchors: PageHeader:n/a, DataTable:n/a, EmptyState:n/a, ErrorState:8, GracefulPageLoading:n/a, PageBackLink:n/a. No raw user controls locally.

#### `src/app/(authenticated)/college/groups/[groupId]/rule-preview/loading.tsx`

| Property/state | Legacy file and value | vNext source/value | Verification |
| --- | --- | --- | --- |
| Page canvas/default | old-lms-shell-spec.md:18-20 white #fff canvas, border #e5e9f0 1px radius12 padding24, continuous surface | No extra PageCanvas and ordinary group stats/rows separated by hairlines; Shared GracefulPageLoading with route-specific label; Group Rule Preview uses card-shape skeleton; directory/detail/import-preview use directory-shape skeleton | **Source anatomy; browser-computed px unverified** |
| Heading baseline | legacy-styles/components___listing-page-header.scss:26-35 hairline border, 52-58 title28px weight600 line-height1.3 tracking-.02em; mobile title20px | Shared PageHeader/ErrorState; central header renders desktop30px and mobile20px | **28px vs shared 30px discrepancy blocks tick** |
| Buttons/default | old-lms-shell-spec.md:22-24 primary #0a7c88 on white, radius9 height36 font14/650, secondary border white/36px | Shared Button/PageBackLink or keyboard-capable Link min-h-11/md:min-h-9; Shared GracefulPageLoading with route-specific label; Group Rule Preview uses card-shape skeleton; directory/detail/import-preview use directory-shape skeleton | **Component source family, exact computed colours/active not verified** |
| Focus/hover/disabled | legacy-styles/components___button.scss:13-24 150ms transitions and hover, :49-51 disabled; form.scss:22-36 :focus-visible keyboard state | Skeleton busy and deferred recovery handled by shared loading component | **Unplayed browser states and no all-property CSS comparison** |
| List rows/cards | old-lms-pages.md:6,11 compact hairline-bordered DataTable, not a card for each ordinary record | Shared GracefulPageLoading with route-specific label; Group Rule Preview uses card-shape skeleton; directory/detail/import-preview use directory-shape skeleton | **Source pattern matches canvas layout, measured row heights/spacing not verified** |
| Loading/error/empty | old-lms-pages.md:6,11-12: in-canvas loading/error/empty distinct; pale yellow info strip not fake no-data | Shared GracefulPageLoading with route-specific label; Group Rule Preview uses card-shape skeleton; directory/detail/import-preview use directory-shape skeleton | **State coverage at source but no screen-specific legacy capture** |
| Responsive @375/767/768 | legacy-styles/components___listing-page-header.scss:130-153 stacked <=767px, 20px h1, action targets44px; 768+ horizontal | md breakpoint count 0, sm count 0; Shared GracefulPageLoading with route-specific label; Group Rule Preview uses card-shape skeleton; directory/detail/import-preview use directory-shape skeleton | **Static source review only; live responsive render/screenshots not produced** |
| Markup/data preservation | old-lms-pages.md:6: preserve vNext page contents/service records | Original membership rules, waitlist and group boundaries, IST date strings, server reads and actions unchanged; no new public fields | **No typecheck/runtime/keyboard; scope/pair scan only** |

Source anchors: PageHeader:n/a, DataTable:n/a, EmptyState:n/a, ErrorState:n/a, GracefulPageLoading:4, PageBackLink:n/a. No raw user controls locally.

#### `src/app/(authenticated)/college/groups/[groupId]/rule-preview/page.tsx`

| Property/state | Legacy file and value | vNext source/value | Verification |
| --- | --- | --- | --- |
| Page canvas/default | old-lms-shell-spec.md:18-20 white #fff canvas, border #e5e9f0 1px radius12 padding24, continuous surface | No extra PageCanvas and ordinary group stats/rows separated by hairlines; Back links 44px phone/36px desktop; rule summary flattened to hairline-separated cells, criteria md:grid-cols-2 rather than sm | **Source anatomy; browser-computed px unverified** |
| Heading baseline | legacy-styles/components___listing-page-header.scss:26-35 hairline border, 52-58 title28px weight600 line-height1.3 tracking-.02em; mobile title20px | Shared PageHeader/ErrorState; central header renders desktop30px and mobile20px | **28px vs shared 30px discrepancy blocks tick** |
| Buttons/default | old-lms-shell-spec.md:22-24 primary #0a7c88 on white, radius9 height36 font14/650, secondary border white/36px | Shared Button/PageBackLink or keyboard-capable Link min-h-11/md:min-h-9; Back links 44px phone/36px desktop; rule summary flattened to hairline-separated cells, criteria md:grid-cols-2 rather than sm | **Component source family, exact computed colours/active not verified** |
| Focus/hover/disabled | legacy-styles/components___button.scss:13-24 150ms transitions and hover, :49-51 disabled; form.scss:22-36 :focus-visible keyboard state | Existing form state/disabled guard unchanged; shared components own focus/disabled | **Unplayed browser states and no all-property CSS comparison** |
| List rows/cards | old-lms-pages.md:6,11 compact hairline-bordered DataTable, not a card for each ordinary record | Back links 44px phone/36px desktop; rule summary flattened to hairline-separated cells, criteria md:grid-cols-2 rather than sm | **Source pattern matches canvas layout, measured row heights/spacing not verified** |
| Loading/error/empty | old-lms-pages.md:6,11-12: in-canvas loading/error/empty distinct; pale yellow info strip not fake no-data | Back links 44px phone/36px desktop; rule summary flattened to hairline-separated cells, criteria md:grid-cols-2 rather than sm | **State coverage at source but no screen-specific legacy capture** |
| Responsive @375/767/768 | legacy-styles/components___listing-page-header.scss:130-153 stacked <=767px, 20px h1, action targets44px; 768+ horizontal | md breakpoint count 4, sm count 0; Back links 44px phone/36px desktop; rule summary flattened to hairline-separated cells, criteria md:grid-cols-2 rather than sm | **Static source review only; live responsive render/screenshots not produced** |
| Markup/data preservation | old-lms-pages.md:6: preserve vNext page contents/service records | Original membership rules, waitlist and group boundaries, IST date strings, server reads and actions unchanged; no new public fields | **No typecheck/runtime/keyboard; scope/pair scan only** |

Source anchors: PageHeader:35, DataTable:n/a, EmptyState:n/a, ErrorState:24, GracefulPageLoading:n/a, PageBackLink:n/a. No raw user controls locally.

#### `src/app/(authenticated)/college/groups/error.tsx`

| Property/state | Legacy file and value | vNext source/value | Verification |
| --- | --- | --- | --- |
| Page canvas/default | old-lms-shell-spec.md:18-20 white #fff canvas, border #e5e9f0 1px radius12 padding24, continuous surface | No extra PageCanvas and ordinary group stats/rows separated by hairlines; Existing scoped ErrorState and a secondary Retry Button with min-h-11/md:min-h-9 | **Source anatomy; browser-computed px unverified** |
| Heading baseline | legacy-styles/components___listing-page-header.scss:26-35 hairline border, 52-58 title28px weight600 line-height1.3 tracking-.02em; mobile title20px | Shared PageHeader/ErrorState; central header renders desktop30px and mobile20px | **28px vs shared 30px discrepancy blocks tick** |
| Buttons/default | old-lms-shell-spec.md:22-24 primary #0a7c88 on white, radius9 height36 font14/650, secondary border white/36px | Shared Button/PageBackLink or keyboard-capable Link min-h-11/md:min-h-9; Existing scoped ErrorState and a secondary Retry Button with min-h-11/md:min-h-9 | **Component source family, exact computed colours/active not verified** |
| Focus/hover/disabled | legacy-styles/components___button.scss:13-24 150ms transitions and hover, :49-51 disabled; form.scss:22-36 :focus-visible keyboard state | Secondary Retry calls reset; Button keyboard/focus delegated | **Unplayed browser states and no all-property CSS comparison** |
| List rows/cards | old-lms-pages.md:6,11 compact hairline-bordered DataTable, not a card for each ordinary record | Existing scoped ErrorState and a secondary Retry Button with min-h-11/md:min-h-9 | **Source pattern matches canvas layout, measured row heights/spacing not verified** |
| Loading/error/empty | old-lms-pages.md:6,11-12: in-canvas loading/error/empty distinct; pale yellow info strip not fake no-data | Existing scoped ErrorState and a secondary Retry Button with min-h-11/md:min-h-9 | **State coverage at source but no screen-specific legacy capture** |
| Responsive @375/767/768 | legacy-styles/components___listing-page-header.scss:130-153 stacked <=767px, 20px h1, action targets44px; 768+ horizontal | md breakpoint count 1, sm count 0; Existing scoped ErrorState and a secondary Retry Button with min-h-11/md:min-h-9 | **Static source review only; live responsive render/screenshots not produced** |
| Markup/data preservation | old-lms-pages.md:6: preserve vNext page contents/service records | Original membership rules, waitlist and group boundaries, IST date strings, server reads and actions unchanged; no new public fields | **No typecheck/runtime/keyboard; scope/pair scan only** |

Source anchors: PageHeader:n/a, DataTable:n/a, EmptyState:n/a, ErrorState:10, GracefulPageLoading:n/a, PageBackLink:n/a. No raw user controls locally.

#### `src/app/(authenticated)/college/groups/loading.tsx`

| Property/state | Legacy file and value | vNext source/value | Verification |
| --- | --- | --- | --- |
| Page canvas/default | old-lms-shell-spec.md:18-20 white #fff canvas, border #e5e9f0 1px radius12 padding24, continuous surface | No extra PageCanvas and ordinary group stats/rows separated by hairlines; Shared GracefulPageLoading with route-specific label; Group Rule Preview uses card-shape skeleton; directory/detail/import-preview use directory-shape skeleton | **Source anatomy; browser-computed px unverified** |
| Heading baseline | legacy-styles/components___listing-page-header.scss:26-35 hairline border, 52-58 title28px weight600 line-height1.3 tracking-.02em; mobile title20px | Shared PageHeader/ErrorState; central header renders desktop30px and mobile20px | **28px vs shared 30px discrepancy blocks tick** |
| Buttons/default | old-lms-shell-spec.md:22-24 primary #0a7c88 on white, radius9 height36 font14/650, secondary border white/36px | Shared Button/PageBackLink or keyboard-capable Link min-h-11/md:min-h-9; Shared GracefulPageLoading with route-specific label; Group Rule Preview uses card-shape skeleton; directory/detail/import-preview use directory-shape skeleton | **Component source family, exact computed colours/active not verified** |
| Focus/hover/disabled | legacy-styles/components___button.scss:13-24 150ms transitions and hover, :49-51 disabled; form.scss:22-36 :focus-visible keyboard state | Skeleton busy and deferred recovery handled by shared loading component | **Unplayed browser states and no all-property CSS comparison** |
| List rows/cards | old-lms-pages.md:6,11 compact hairline-bordered DataTable, not a card for each ordinary record | Shared GracefulPageLoading with route-specific label; Group Rule Preview uses card-shape skeleton; directory/detail/import-preview use directory-shape skeleton | **Source pattern matches canvas layout, measured row heights/spacing not verified** |
| Loading/error/empty | old-lms-pages.md:6,11-12: in-canvas loading/error/empty distinct; pale yellow info strip not fake no-data | Shared GracefulPageLoading with route-specific label; Group Rule Preview uses card-shape skeleton; directory/detail/import-preview use directory-shape skeleton | **State coverage at source but no screen-specific legacy capture** |
| Responsive @375/767/768 | legacy-styles/components___listing-page-header.scss:130-153 stacked <=767px, 20px h1, action targets44px; 768+ horizontal | md breakpoint count 0, sm count 0; Shared GracefulPageLoading with route-specific label; Group Rule Preview uses card-shape skeleton; directory/detail/import-preview use directory-shape skeleton | **Static source review only; live responsive render/screenshots not produced** |
| Markup/data preservation | old-lms-pages.md:6: preserve vNext page contents/service records | Original membership rules, waitlist and group boundaries, IST date strings, server reads and actions unchanged; no new public fields | **No typecheck/runtime/keyboard; scope/pair scan only** |

Source anchors: PageHeader:n/a, DataTable:n/a, EmptyState:n/a, ErrorState:n/a, GracefulPageLoading:4, PageBackLink:n/a. No raw user controls locally.

#### `src/app/(authenticated)/college/groups/page.tsx`

| Property/state | Legacy file and value | vNext source/value | Verification |
| --- | --- | --- | --- |
| Page canvas/default | old-lms-shell-spec.md:18-20 white #fff canvas, border #e5e9f0 1px radius12 padding24, continuous surface | No extra PageCanvas and ordinary group stats/rows separated by hairlines; Single PageHeader, group filter Select/Button, DataTable empty state, 44px mobile clear/prev/next links; pagination wraps | **Source anatomy; browser-computed px unverified** |
| Heading baseline | legacy-styles/components___listing-page-header.scss:26-35 hairline border, 52-58 title28px weight600 line-height1.3 tracking-.02em; mobile title20px | Shared PageHeader/ErrorState; central header renders desktop30px and mobile20px | **28px vs shared 30px discrepancy blocks tick** |
| Buttons/default | old-lms-shell-spec.md:22-24 primary #0a7c88 on white, radius9 height36 font14/650, secondary border white/36px | Shared Button/PageBackLink or keyboard-capable Link min-h-11/md:min-h-9; Single PageHeader, group filter Select/Button, DataTable empty state, 44px mobile clear/prev/next links; pagination wraps | **Component source family, exact computed colours/active not verified** |
| Focus/hover/disabled | legacy-styles/components___button.scss:13-24 150ms transitions and hover, :49-51 disabled; form.scss:22-36 :focus-visible keyboard state | Existing form state/disabled guard unchanged; shared components own focus/disabled | **Unplayed browser states and no all-property CSS comparison** |
| List rows/cards | old-lms-pages.md:6,11 compact hairline-bordered DataTable, not a card for each ordinary record | Single PageHeader, group filter Select/Button, DataTable empty state, 44px mobile clear/prev/next links; pagination wraps | **Source pattern matches canvas layout, measured row heights/spacing not verified** |
| Loading/error/empty | old-lms-pages.md:6,11-12: in-canvas loading/error/empty distinct; pale yellow info strip not fake no-data | Single PageHeader, group filter Select/Button, DataTable empty state, 44px mobile clear/prev/next links; pagination wraps | **State coverage at source but no screen-specific legacy capture** |
| Responsive @375/767/768 | legacy-styles/components___listing-page-header.scss:130-153 stacked <=767px, 20px h1, action targets44px; 768+ horizontal | md breakpoint count 6, sm count 0; Single PageHeader, group filter Select/Button, DataTable empty state, 44px mobile clear/prev/next links; pagination wraps | **Static source review only; live responsive render/screenshots not produced** |
| Markup/data preservation | old-lms-pages.md:6: preserve vNext page contents/service records | Original membership rules, waitlist and group boundaries, IST date strings, server reads and actions unchanged; no new public fields | **No typecheck/runtime/keyboard; scope/pair scan only** |

Source anchors: PageHeader:55, DataTable:138, EmptyState:128, ErrorState:56, GracefulPageLoading:n/a, PageBackLink:n/a. No raw user controls locally.

**STRICT TICK RULE: 0 newly checked.** Scope and props audited by reading, but repo-wide greps, computed CSS for every hover/active/focus/disabled/loading state, actual 375/767/768 responsive render and TSX parser proof are outstanding. Do not conflate scoped source review with finished pixel-level parity.

**Exact next route:** `src/app/(authenticated)/college/groups/[groupId]/rule-preview/page.tsx` source-review complete; proceed to `src/app/(authenticated)/college/groups/[groupId]/import-preview/page.tsx` child component `src/components/groups/college-group-import-preview.tsx`, then the next College Admin unticked component.
