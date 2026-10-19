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
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/history/page.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/loading.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/page.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/error.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/loading.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/branding/error.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/branding/loading.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/error.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/loading.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/readiness/error.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/readiness/loading.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/readiness/page.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/signin/error.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/signin/loading.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/error.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/loading.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/verification/error.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/verification/loading.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/error.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/layout.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/loading.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/page.tsx`
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
- [ ] `src/app/(authenticated)/admin/tenants/create/page.tsx`
- [ ] `src/app/(authenticated)/admin/tenants/error.tsx`
- [ ] `src/app/(authenticated)/admin/tenants/layout.tsx`
- [ ] `src/app/(authenticated)/admin/tenants/loading.tsx`
- [ ] `src/app/(authenticated)/admin/tenants/page.tsx`
- [ ] `src/app/(authenticated)/admin/tenants/setup/error.tsx`
- [ ] `src/app/(authenticated)/admin/tenants/setup/loading.tsx`
- [ ] `src/app/(authenticated)/admin/tenants/setup/page.tsx`
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
- [ ] `src/components/admin/college-admin-lifecycle-action.tsx`
- [ ] `src/components/admin/college-archive-button.tsx`
- [ ] `src/components/admin/college-at-glance-panel.tsx`
- [ ] `src/components/admin/college-branding-form.tsx`
- [ ] `src/components/admin/college-branding-preview.tsx`
- [ ] `src/components/admin/college-bulk-import.tsx`
- [ ] `src/components/admin/college-closing-quizzes-card.tsx`
- [ ] `src/components/admin/college-create-form.tsx`
- [ ] `src/components/admin/college-dashboard-cards.tsx`
- [ ] `src/components/admin/college-dashboard-section-failure.tsx`
- [ ] `src/components/admin/college-edit-dialog.tsx`
- [ ] `src/components/admin/college-feature-rule-editor.tsx`
- [ ] `src/components/admin/college-logo-uploader.tsx`
- [ ] `src/components/admin/college-setup-checklist.tsx`
- [ ] `src/components/admin/college-signin-method-form.tsx`
- [ ] `src/components/admin/managed-college-subdomain.tsx`
- [ ] `src/components/admin/super-admin-college-company-actions.tsx`
- [ ] `src/components/admin/super-admin-company-verification.tsx`
- [ ] `src/components/admin/tenant-directory-csv-control.tsx`
- [ ] `src/components/admin/tenant-domain-manager.tsx`
- [ ] `src/components/admin/tenant-restore-action.tsx`
- [ ] `src/components/admin/tenant-settings-editor.tsx`
- [ ] `src/components/admin/tenant-settings-other-keys.tsx`

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
