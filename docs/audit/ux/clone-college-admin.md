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
- [ ] `src/app/(authenticated)/college/academics/error.tsx`
- [ ] `src/app/(authenticated)/college/academics/loading.tsx`
- [ ] `src/app/(authenticated)/college/academics/page.tsx`
- [ ] `src/app/(authenticated)/college/academics/sections/[sectionId]/error.tsx`
- [ ] `src/app/(authenticated)/college/academics/sections/[sectionId]/loading.tsx`
- [ ] `src/app/(authenticated)/college/academics/sections/[sectionId]/page.tsx`
- [ ] `src/app/(authenticated)/college/activity/[eventId]/error.tsx`
- [ ] `src/app/(authenticated)/college/activity/[eventId]/loading.tsx`
- [ ] `src/app/(authenticated)/college/activity/[eventId]/page.tsx`
- [ ] `src/app/(authenticated)/college/activity/error.tsx`
- [ ] `src/app/(authenticated)/college/activity/loading.tsx`
- [ ] `src/app/(authenticated)/college/activity/page.tsx`
- [ ] `src/app/(authenticated)/college/announcements/error.tsx`
- [ ] `src/app/(authenticated)/college/announcements/loading.tsx`
- [ ] `src/app/(authenticated)/college/announcements/page.tsx`
- [ ] `src/app/(authenticated)/college/assignments/error.tsx`
- [ ] `src/app/(authenticated)/college/assignments/loading.tsx`
- [ ] `src/app/(authenticated)/college/assignments/page.tsx`
- [ ] `src/app/(authenticated)/college/attendance/corrections/error.tsx`
- [ ] `src/app/(authenticated)/college/attendance/corrections/loading.tsx`
- [ ] `src/app/(authenticated)/college/attendance/corrections/page.tsx`
- [ ] `src/app/(authenticated)/college/attendance/departments/error.tsx`
- [ ] `src/app/(authenticated)/college/attendance/departments/loading.tsx`
- [ ] `src/app/(authenticated)/college/attendance/departments/page.tsx`
- [ ] `src/app/(authenticated)/college/attendance/error.tsx`
- [ ] `src/app/(authenticated)/college/attendance/loading.tsx`
- [ ] `src/app/(authenticated)/college/attendance/page.tsx`
- [ ] `src/app/(authenticated)/college/attendance/settings/error.tsx`
- [ ] `src/app/(authenticated)/college/attendance/settings/loading.tsx`
- [ ] `src/app/(authenticated)/college/attendance/settings/page.tsx`
- [ ] `src/app/(authenticated)/college/batch-promotion/error.tsx`
- [ ] `src/app/(authenticated)/college/batch-promotion/loading.tsx`
- [ ] `src/app/(authenticated)/college/batch-promotion/page.tsx`
- [ ] `src/app/(authenticated)/college/batches/[cohortId]/students/error.tsx`
- [ ] `src/app/(authenticated)/college/batches/[cohortId]/students/loading.tsx`
- [ ] `src/app/(authenticated)/college/batches/[cohortId]/students/page.tsx`
- [ ] `src/app/(authenticated)/college/batches/error.tsx`
- [ ] `src/app/(authenticated)/college/batches/loading.tsx`
- [ ] `src/app/(authenticated)/college/batches/page.tsx`
- [ ] `src/app/(authenticated)/college/branding/error.tsx`
- [ ] `src/app/(authenticated)/college/branding/loading.tsx`
- [ ] `src/app/(authenticated)/college/branding/page.tsx`
- [ ] `src/app/(authenticated)/college/classes/error.tsx`
- [ ] `src/app/(authenticated)/college/classes/loading.tsx`
- [ ] `src/app/(authenticated)/college/classes/page.tsx`
- [ ] `src/app/(authenticated)/college/classes/recurring-preview/error.tsx`
- [ ] `src/app/(authenticated)/college/classes/recurring-preview/loading.tsx`
- [ ] `src/app/(authenticated)/college/classes/recurring-preview/page.tsx`
- [ ] `src/app/(authenticated)/college/college-profile/error.tsx`
- [ ] `src/app/(authenticated)/college/college-profile/loading.tsx`
- [ ] `src/app/(authenticated)/college/college-profile/page.tsx`
- [ ] `src/app/(authenticated)/college/companies/error.tsx`
- [ ] `src/app/(authenticated)/college/companies/loading.tsx`
- [ ] `src/app/(authenticated)/college/companies/page.tsx`
- [ ] `src/app/(authenticated)/college/contacts/[membershipId]/error.tsx`
- [ ] `src/app/(authenticated)/college/contacts/[membershipId]/loading.tsx`
- [ ] `src/app/(authenticated)/college/contacts/[membershipId]/page.tsx`
- [ ] `src/app/(authenticated)/college/contacts/error.tsx`
- [ ] `src/app/(authenticated)/college/contacts/loading.tsx`
- [ ] `src/app/(authenticated)/college/contacts/page.tsx`
- [ ] `src/app/(authenticated)/college/course-progress/error.tsx`
- [ ] `src/app/(authenticated)/college/course-progress/loading.tsx`
- [ ] `src/app/(authenticated)/college/course-progress/page.tsx`
- [ ] `src/app/(authenticated)/college/courses/error.tsx`
- [ ] `src/app/(authenticated)/college/courses/loading.tsx`
- [ ] `src/app/(authenticated)/college/courses/offerings/[offeringId]/error.tsx`
- [ ] `src/app/(authenticated)/college/courses/offerings/[offeringId]/loading.tsx`
- [ ] `src/app/(authenticated)/college/courses/offerings/[offeringId]/not-found.tsx`
- [ ] `src/app/(authenticated)/college/courses/offerings/[offeringId]/page.tsx`
- [ ] `src/app/(authenticated)/college/courses/page.tsx`
- [ ] `src/app/(authenticated)/college/departments/error.tsx`
- [ ] `src/app/(authenticated)/college/departments/loading.tsx`
- [ ] `src/app/(authenticated)/college/departments/page.tsx`
- [ ] `src/app/(authenticated)/college/domains/error.tsx`
- [ ] `src/app/(authenticated)/college/domains/loading.tsx`
- [ ] `src/app/(authenticated)/college/domains/page.tsx`
- [ ] `src/app/(authenticated)/college/electives/[slotId]/allocate/error.tsx`
- [ ] `src/app/(authenticated)/college/electives/[slotId]/allocate/loading.tsx`
- [ ] `src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx`
- [ ] `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/error.tsx`
- [ ] `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/loading.tsx`
- [ ] `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx`
- [ ] `src/app/(authenticated)/college/electives/error.tsx`
- [ ] `src/app/(authenticated)/college/electives/loading.tsx`
- [ ] `src/app/(authenticated)/college/electives/page.tsx`
- [ ] `src/app/(authenticated)/college/error.tsx`
- [ ] `src/app/(authenticated)/college/faculty-assignment/error.tsx`
- [ ] `src/app/(authenticated)/college/faculty-assignment/loading.tsx`
- [ ] `src/app/(authenticated)/college/faculty-assignment/page.tsx`
- [ ] `src/app/(authenticated)/college/faculty/[membershipId]/error.tsx`
- [ ] `src/app/(authenticated)/college/faculty/[membershipId]/loading.tsx`
- [ ] `src/app/(authenticated)/college/faculty/[membershipId]/page.tsx`
- [ ] `src/app/(authenticated)/college/faculty/error.tsx`
- [ ] `src/app/(authenticated)/college/faculty/import/error.tsx`
- [ ] `src/app/(authenticated)/college/faculty/import/loading.tsx`
- [ ] `src/app/(authenticated)/college/faculty/import/page.tsx`
- [ ] `src/app/(authenticated)/college/faculty/loading.tsx`
- [ ] `src/app/(authenticated)/college/faculty/page.tsx`
- [ ] `src/app/(authenticated)/college/groups/[groupId]/error.tsx`
- [ ] `src/app/(authenticated)/college/groups/[groupId]/import-preview/error.tsx`
- [ ] `src/app/(authenticated)/college/groups/[groupId]/import-preview/loading.tsx`
- [ ] `src/app/(authenticated)/college/groups/[groupId]/import-preview/page.tsx`
- [ ] `src/app/(authenticated)/college/groups/[groupId]/loading.tsx`
- [ ] `src/app/(authenticated)/college/groups/[groupId]/page.tsx`
- [ ] `src/app/(authenticated)/college/groups/[groupId]/rule-preview/error.tsx`
- [ ] `src/app/(authenticated)/college/groups/[groupId]/rule-preview/loading.tsx`
- [ ] `src/app/(authenticated)/college/groups/[groupId]/rule-preview/page.tsx`
- [ ] `src/app/(authenticated)/college/groups/error.tsx`
- [ ] `src/app/(authenticated)/college/groups/loading.tsx`
- [ ] `src/app/(authenticated)/college/groups/page.tsx`
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
- [ ] `src/app/(authenticated)/college/people/error.tsx`
- [ ] `src/app/(authenticated)/college/people/loading.tsx`
- [ ] `src/app/(authenticated)/college/people/manage/error.tsx`
- [ ] `src/app/(authenticated)/college/people/manage/loading.tsx`
- [ ] `src/app/(authenticated)/college/people/manage/page.tsx`
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
- [ ] `src/app/(authenticated)/college/students/[membershipId]/page.tsx`
- [ ] `src/app/(authenticated)/college/students/error.tsx`
- [ ] `src/app/(authenticated)/college/students/import/error.tsx`
- [ ] `src/app/(authenticated)/college/students/import/loading.tsx`
- [ ] `src/app/(authenticated)/college/students/import/page.tsx`
- [ ] `src/app/(authenticated)/college/students/loading.tsx`
- [ ] `src/app/(authenticated)/college/students/page.tsx`
- [ ] `src/app/(authenticated)/college/students/register/error.tsx`
- [ ] `src/app/(authenticated)/college/students/register/loading.tsx`
- [ ] `src/app/(authenticated)/college/students/register/page.tsx`
- [ ] `src/app/(authenticated)/college/verification/error.tsx`
- [ ] `src/app/(authenticated)/college/verification/loading.tsx`
- [ ] `src/app/(authenticated)/college/verification/page.tsx`
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
- [ ] `src/components/college/college-admin-profile-editor.tsx`
- [ ] `src/components/college/college-department-insights.tsx`
- [ ] `src/components/college/college-faculty-assignment-actions.tsx`
- [ ] `src/components/college/college-faculty-csv-import.tsx`
- [ ] `src/components/college/college-faculty-lifecycle-action.tsx`
- [ ] `src/components/college/college-faculty-reassign-action.tsx`
- [ ] `src/components/college/college-faculty-schedule-reassign.tsx`
- [ ] `src/components/college/college-legacy-group-tabs.tsx`
- [ ] `src/components/college/college-offering-lifecycle-action.tsx`
- [ ] `src/components/college/college-offering-metadata-action.tsx`
- [ ] `src/components/college/college-person-audit-modal.tsx`
- [ ] `src/components/college/college-person-edit-action.tsx`
- [ ] `src/components/college/college-person-profile-overview-modal.tsx`
- [ ] `src/components/college/college-role-directory-workspace.tsx`
- [ ] `src/components/college/college-student-csv-import.tsx`
- [ ] `src/components/college/college-student-import-history.tsx`
- [ ] `src/components/college/college-student-lifecycle-action.tsx`
- [ ] `src/components/college/college-student-register-form.tsx`
- [ ] `src/components/college/student-class-move-action.tsx`
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
- [ ] `src/components/admin/college-closing-quizzes-card.tsx`
- [ ] `src/components/admin/college-create-form.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/admin/organization-create-form.tsx` — **SOURCE PASS, strict parity open (replacement chat-4)**
- [ ] `src/components/admin/college-dashboard-cards.tsx`
- [ ] `src/components/admin/college-dashboard-section-failure.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/admin/college-edit-dialog.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/admin/college-feature-rule-editor.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/admin/college-logo-uploader.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/admin/college-setup-checklist.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/admin/college-signin-method-form.tsx` — **SOURCE IMPLEMENTATION REVIEWED**, strict parity unverified; see source-proof batch below (Sign-in method controls)
- [ ] `src/components/admin/managed-college-subdomain.tsx` — **SOURCE REFACTOR REVIEWED (replacement chat-4); strict proof pending**
- [ ] `src/components/admin/super-admin-college-company-actions.tsx`
- [ ] `src/components/admin/super-admin-company-verification.tsx`
- [ ] `src/components/admin/tenant-directory-csv-control.tsx`
- [ ] `src/components/admin/tenant-domain-manager.tsx` — **SOURCE PASS (replacement chat-4), strict parity open**
- [ ] `src/components/admin/tenant-restore-action.tsx`
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
