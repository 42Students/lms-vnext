# State-route work queue — chat-5

## Replacement lane continuation (2026-10-19)

Main fast-forward base: `12ee0a58fd9af5e0e1f1ad975155f864966cb6c0`; only `chatgpt/chat-5-b` was updated. **26 route/page source files** changed (21 state-route files indexed below, 1 round-results page, 4 other TPO placement pages), alongside 2 owned shared primitives. Exactly **0 strict F3/F4/F5 category items ticked**, because whole-project counts and legacy responsive measurements are still missing. See `clone-states.md` replacement-turn evidence. Do not conflate source conversion with verified pixel parity.

**Next exact file:** `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx`. Invalid-filter `role="alert"` and Suspense fallback `role="status"` remain. Follow with share-audit and round-slot pages. The older 1,041-path route checklist remains intentionally unticked even when a listed route has been migrated.


Generated from the complete, non-truncated main Git tree (2026-10-19), with duplicate paths removed. These are path-inventory counts, not in-file content grep counts, compilation results or proof of visual parity.

Totals: **1041 unique files** = **511 loading**, **512 error**, **18 not-found**. Prior turn changed **38 loading routes**, and the second bounded turn changed **20 TPO loading routes**; all strict parity checkboxes stay OPEN until the F3–F5 value/state, grep and responsive proofs are completed.

Equivalent local path inventory command (not executed): git ls-tree -r --name-only main src/app | grep -E '(^|/)(loading|error|not-found)\.tsx$' | sort

Next required source command (not executed): grep -rlE 'animate-pulse|bg-muted|bg-surface-secondary' src/app --include='loading.tsx' | sort

Extended sprint (2026-10-19): **62** source `loading.tsx` and **24** source `error.tsx` conversions, all separately committed to `chatgpt/chat-5-b`. The 15 authenticated `not-found.tsx` pages were read and remain unchanged because they already preserve headings and recovery links. No route checkbox is ticked without value, grep and responsive proof.

Every item below requires inspection. Routes already using shared components may need no source changes. Do not tick a path merely because its loader was migrated.


## account / error (1)

- [ ] `src/app/(authenticated)/account/security/error.tsx`

## account / loading (1)

- [ ] `src/app/(authenticated)/account/security/loading.tsx`

## activity / error (2)

- [ ] `src/app/(authenticated)/activity/[eventId]/error.tsx`
- [ ] `src/app/(authenticated)/activity/error.tsx`

## activity / loading (2)

- [ ] `src/app/(authenticated)/activity/[eventId]/loading.tsx`
- [ ] `src/app/(authenticated)/activity/loading.tsx`

## admin / error (112)

- [ ] `src/app/(authenticated)/admin/academics/error.tsx`
- [ ] `src/app/(authenticated)/admin/academics/sections/[sectionId]/error.tsx`
- [ ] `src/app/(authenticated)/admin/announcements/error.tsx`
- [ ] `src/app/(authenticated)/admin/assignments/error.tsx`
- [ ] `src/app/(authenticated)/admin/attendance/error.tsx`
- [ ] `src/app/(authenticated)/admin/audit/error.tsx`
- [ ] `src/app/(authenticated)/admin/batch-promotion/error.tsx`
- [ ] `src/app/(authenticated)/admin/batches/[batchId]/students/error.tsx`
- [ ] `src/app/(authenticated)/admin/batches/error.tsx`
- [ ] `src/app/(authenticated)/admin/classes/error.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/error.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/history/error.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/error.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/branding/error.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/error.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/readiness/error.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/signin/error.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/error.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/verification/error.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/error.tsx`
- [ ] `src/app/(authenticated)/admin/companies/[companyId]/drives/error.tsx`
- [ ] `src/app/(authenticated)/admin/companies/error.tsx`
- [ ] `src/app/(authenticated)/admin/course-progress/error.tsx`
- [ ] `src/app/(authenticated)/admin/courses/error.tsx`
- [ ] `src/app/(authenticated)/admin/courses/offerings/[offeringId]/error.tsx`
- [ ] `src/app/(authenticated)/admin/departments/error.tsx`
- [ ] `src/app/(authenticated)/admin/domains/error.tsx`
- [ ] `src/app/(authenticated)/admin/electives/error.tsx`
- [ ] `src/app/(authenticated)/admin/error.tsx`
- [ ] `src/app/(authenticated)/admin/faculty-assignment/error.tsx`
- [ ] `src/app/(authenticated)/admin/faculty/error.tsx`
- [ ] `src/app/(authenticated)/admin/features/[collegeId]/error.tsx`
- [ ] `src/app/(authenticated)/admin/features/[collegeId]/history/error.tsx`
- [ ] `src/app/(authenticated)/admin/features/[collegeId]/students/[membershipId]/error.tsx`
- [ ] `src/app/(authenticated)/admin/features/[collegeId]/students/[membershipId]/history/error.tsx`
- [ ] `src/app/(authenticated)/admin/features/[collegeId]/trace/error.tsx`
- [ ] `src/app/(authenticated)/admin/features/error.tsx`
- [ ] `src/app/(authenticated)/admin/hr/error.tsx`
- [ ] `src/app/(authenticated)/admin/inbound-mail/error.tsx`
- [ ] `src/app/(authenticated)/admin/lecture-halls/[hallId]/error.tsx`
- [ ] `src/app/(authenticated)/admin/lecture-halls/error.tsx`
- [ ] `src/app/(authenticated)/admin/lessons/error.tsx`
- [ ] `src/app/(authenticated)/admin/live-classes/error.tsx`
- [ ] `src/app/(authenticated)/admin/module-access/error.tsx`
- [ ] `src/app/(authenticated)/admin/organizations/error.tsx`
- [ ] `src/app/(authenticated)/admin/people/directory/[membershipId]/audit/error.tsx`
- [ ] `src/app/(authenticated)/admin/people/directory/[membershipId]/error.tsx`
- [ ] `src/app/(authenticated)/admin/people/directory/error.tsx`
- [ ] `src/app/(authenticated)/admin/people/error.tsx`
- [ ] `src/app/(authenticated)/admin/people/unassigned/error.tsx`
- [ ] `src/app/(authenticated)/admin/placements/analytics/error.tsx`
- [ ] `src/app/(authenticated)/admin/placements/applications/[applicationId]/error.tsx`
- [ ] `src/app/(authenticated)/admin/placements/applications/error.tsx`
- [ ] `src/app/(authenticated)/admin/placements/calendar/error.tsx`
- [ ] `src/app/(authenticated)/admin/placements/drives/error.tsx`
- [ ] `src/app/(authenticated)/admin/placements/error.tsx`
- [ ] `src/app/(authenticated)/admin/placements/hiring/error.tsx`
- [ ] `src/app/(authenticated)/admin/placements/interviews/[roundId]/error.tsx`
- [ ] `src/app/(authenticated)/admin/placements/interviews/error.tsx`
- [ ] `src/app/(authenticated)/admin/placements/job-settings/[jobId]/error.tsx`
- [ ] `src/app/(authenticated)/admin/placements/job-settings/error.tsx`
- [ ] `src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/error.tsx`
- [ ] `src/app/(authenticated)/admin/placements/jobs/[jobId]/error.tsx`
- [ ] `src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/error.tsx`
- [ ] `src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/error.tsx`
- [ ] `src/app/(authenticated)/admin/placements/joining/[offerId]/error.tsx`
- [ ] `src/app/(authenticated)/admin/placements/joining/error.tsx`
- [ ] `src/app/(authenticated)/admin/placements/new/error.tsx`
- [ ] `src/app/(authenticated)/admin/placements/offers/[offerId]/error.tsx`
- [ ] `src/app/(authenticated)/admin/placements/offers/error.tsx`
- [ ] `src/app/(authenticated)/admin/placements/retention/error.tsx`
- [ ] `src/app/(authenticated)/admin/placements/screenings/[applicationId]/error.tsx`
- [ ] `src/app/(authenticated)/admin/placements/screenings/error.tsx`
- [ ] `src/app/(authenticated)/admin/placements/seasons/[seasonId]/error.tsx`
- [ ] `src/app/(authenticated)/admin/placements/seasons/error.tsx`
- [ ] `src/app/(authenticated)/admin/placements/shortlisted/[applicationId]/error.tsx`
- [ ] `src/app/(authenticated)/admin/placements/shortlisted/error.tsx`
- [ ] `src/app/(authenticated)/admin/placements/student-lookup/error.tsx`
- [ ] `src/app/(authenticated)/admin/programs/error.tsx`
- [ ] `src/app/(authenticated)/admin/projects/[projectId]/[section]/error.tsx`
- [ ] `src/app/(authenticated)/admin/projects/[projectId]/error.tsx`
- [ ] `src/app/(authenticated)/admin/projects/[projectId]/readiness/error.tsx`
- [ ] `src/app/(authenticated)/admin/projects/at-risk/error.tsx`
- [ ] `src/app/(authenticated)/admin/projects/audit/error.tsx`
- [ ] `src/app/(authenticated)/admin/projects/error.tsx`
- [ ] `src/app/(authenticated)/admin/projects/readiness/error.tsx`
- [ ] `src/app/(authenticated)/admin/projects/reassign-mentor/error.tsx`
- [ ] `src/app/(authenticated)/admin/projects/submissions/error.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/colleges/error.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/error.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/overview/error.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/resources/error.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/sprints/error.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/tasks/error.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/error.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/versions/error.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/error.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/new/error.tsx`
- [ ] `src/app/(authenticated)/admin/projects/workspaces/new/error.tsx`
- [ ] `src/app/(authenticated)/admin/quizzes/error.tsx`
- [ ] `src/app/(authenticated)/admin/recruiters/error.tsx`
- [ ] `src/app/(authenticated)/admin/resources/error.tsx`
- [ ] `src/app/(authenticated)/admin/semester-courses/error.tsx`
- [ ] `src/app/(authenticated)/admin/semesters/error.tsx`
- [ ] `src/app/(authenticated)/admin/settings/auth/error.tsx`
- [ ] `src/app/(authenticated)/admin/settings/error.tsx`
- [ ] `src/app/(authenticated)/admin/students/error.tsx`
- [ ] `src/app/(authenticated)/admin/tenants/create/error.tsx`
- [ ] `src/app/(authenticated)/admin/tenants/error.tsx`
- [ ] `src/app/(authenticated)/admin/tenants/setup/error.tsx`
- [ ] `src/app/(authenticated)/admin/verification/error.tsx`
- [ ] `src/app/(authenticated)/admin/videos/error.tsx`

## admin / loading (112)

- [ ] `src/app/(authenticated)/admin/academics/loading.tsx`
- [ ] `src/app/(authenticated)/admin/academics/sections/[sectionId]/loading.tsx`
- [ ] `src/app/(authenticated)/admin/announcements/loading.tsx`
- [ ] `src/app/(authenticated)/admin/assignments/loading.tsx`
- [ ] `src/app/(authenticated)/admin/attendance/loading.tsx`
- [ ] `src/app/(authenticated)/admin/audit/loading.tsx`
- [ ] `src/app/(authenticated)/admin/batch-promotion/loading.tsx`
- [ ] `src/app/(authenticated)/admin/batches/[batchId]/students/loading.tsx`
- [ ] `src/app/(authenticated)/admin/batches/loading.tsx`
- [ ] `src/app/(authenticated)/admin/classes/loading.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/history/loading.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/loading.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/admins/loading.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/branding/loading.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/loading.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/readiness/loading.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/signin/loading.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/loading.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/[collegeId]/verification/loading.tsx`
- [ ] `src/app/(authenticated)/admin/colleges/loading.tsx`
- [ ] `src/app/(authenticated)/admin/companies/[companyId]/drives/loading.tsx`
- [ ] `src/app/(authenticated)/admin/companies/loading.tsx`
- [ ] `src/app/(authenticated)/admin/course-progress/loading.tsx`
- [ ] `src/app/(authenticated)/admin/courses/loading.tsx`
- [ ] `src/app/(authenticated)/admin/courses/offerings/[offeringId]/loading.tsx`
- [ ] `src/app/(authenticated)/admin/departments/loading.tsx`
- [ ] `src/app/(authenticated)/admin/domains/loading.tsx`
- [ ] `src/app/(authenticated)/admin/electives/loading.tsx`
- [ ] `src/app/(authenticated)/admin/faculty-assignment/loading.tsx`
- [ ] `src/app/(authenticated)/admin/faculty/loading.tsx`
- [ ] `src/app/(authenticated)/admin/features/[collegeId]/history/loading.tsx`
- [ ] `src/app/(authenticated)/admin/features/[collegeId]/loading.tsx`
- [ ] `src/app/(authenticated)/admin/features/[collegeId]/students/[membershipId]/history/loading.tsx`
- [ ] `src/app/(authenticated)/admin/features/[collegeId]/students/[membershipId]/loading.tsx`
- [ ] `src/app/(authenticated)/admin/features/[collegeId]/trace/loading.tsx`
- [ ] `src/app/(authenticated)/admin/features/loading.tsx`
- [ ] `src/app/(authenticated)/admin/hr/loading.tsx`
- [ ] `src/app/(authenticated)/admin/inbound-mail/loading.tsx`
- [ ] `src/app/(authenticated)/admin/lecture-halls/[hallId]/loading.tsx`
- [ ] `src/app/(authenticated)/admin/lecture-halls/loading.tsx`
- [ ] `src/app/(authenticated)/admin/lessons/loading.tsx`
- [ ] `src/app/(authenticated)/admin/live-classes/loading.tsx`
- [ ] `src/app/(authenticated)/admin/loading.tsx`
- [ ] `src/app/(authenticated)/admin/module-access/loading.tsx`
- [ ] `src/app/(authenticated)/admin/organizations/loading.tsx`
- [ ] `src/app/(authenticated)/admin/people/directory/[membershipId]/audit/loading.tsx`
- [ ] `src/app/(authenticated)/admin/people/directory/[membershipId]/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/admin/people/directory/loading.tsx`
- [ ] `src/app/(authenticated)/admin/people/loading.tsx`
- [ ] `src/app/(authenticated)/admin/people/unassigned/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/admin/placements/analytics/loading.tsx`
- [ ] `src/app/(authenticated)/admin/placements/applications/[applicationId]/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/admin/placements/applications/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/admin/placements/calendar/loading.tsx`
- [ ] `src/app/(authenticated)/admin/placements/drives/loading.tsx`
- [ ] `src/app/(authenticated)/admin/placements/hiring/loading.tsx`
- [ ] `src/app/(authenticated)/admin/placements/interviews/[roundId]/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/admin/placements/interviews/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/admin/placements/job-settings/[jobId]/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/admin/placements/job-settings/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/loading.tsx`
- [ ] `src/app/(authenticated)/admin/placements/jobs/[jobId]/loading.tsx`
- [ ] `src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/loading.tsx`
- [ ] `src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/loading.tsx`
- [ ] `src/app/(authenticated)/admin/placements/joining/[offerId]/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/admin/placements/joining/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/admin/placements/loading.tsx`
- [ ] `src/app/(authenticated)/admin/placements/new/loading.tsx`
- [ ] `src/app/(authenticated)/admin/placements/offers/[offerId]/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/admin/placements/offers/loading.tsx`
- [ ] `src/app/(authenticated)/admin/placements/retention/loading.tsx`
- [ ] `src/app/(authenticated)/admin/placements/screenings/[applicationId]/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/admin/placements/screenings/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/admin/placements/seasons/[seasonId]/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/admin/placements/seasons/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/admin/placements/shortlisted/[applicationId]/loading.tsx`
- [ ] `src/app/(authenticated)/admin/placements/shortlisted/loading.tsx`
- [ ] `src/app/(authenticated)/admin/placements/student-lookup/loading.tsx`
- [ ] `src/app/(authenticated)/admin/programs/loading.tsx`
- [ ] `src/app/(authenticated)/admin/projects/[projectId]/[section]/loading.tsx`
- [ ] `src/app/(authenticated)/admin/projects/[projectId]/loading.tsx`
- [ ] `src/app/(authenticated)/admin/projects/[projectId]/readiness/loading.tsx`
- [ ] `src/app/(authenticated)/admin/projects/at-risk/loading.tsx`
- [ ] `src/app/(authenticated)/admin/projects/audit/loading.tsx`
- [ ] `src/app/(authenticated)/admin/projects/loading.tsx`
- [ ] `src/app/(authenticated)/admin/projects/readiness/loading.tsx`
- [ ] `src/app/(authenticated)/admin/projects/reassign-mentor/loading.tsx`
- [ ] `src/app/(authenticated)/admin/projects/submissions/loading.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/colleges/loading.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/loading.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/overview/loading.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/resources/loading.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/sprints/loading.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/tasks/loading.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/loading.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/[templateId]/versions/loading.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/loading.tsx`
- [ ] `src/app/(authenticated)/admin/projects/templates/new/loading.tsx`
- [ ] `src/app/(authenticated)/admin/projects/workspaces/new/loading.tsx`
- [ ] `src/app/(authenticated)/admin/quizzes/loading.tsx`
- [ ] `src/app/(authenticated)/admin/recruiters/loading.tsx`
- [ ] `src/app/(authenticated)/admin/resources/loading.tsx`
- [ ] `src/app/(authenticated)/admin/semester-courses/loading.tsx`
- [ ] `src/app/(authenticated)/admin/semesters/loading.tsx`
- [ ] `src/app/(authenticated)/admin/settings/auth/loading.tsx`
- [ ] `src/app/(authenticated)/admin/settings/loading.tsx`
- [ ] `src/app/(authenticated)/admin/students/loading.tsx`
- [ ] `src/app/(authenticated)/admin/tenants/create/loading.tsx`
- [ ] `src/app/(authenticated)/admin/tenants/loading.tsx`
- [ ] `src/app/(authenticated)/admin/tenants/setup/loading.tsx`
- [ ] `src/app/(authenticated)/admin/verification/loading.tsx`
- [ ] `src/app/(authenticated)/admin/videos/loading.tsx`

## admin / not-found (1)

- [ ] `src/app/(authenticated)/admin/not-found.tsx`

## college / error (85)

- [ ] `src/app/(authenticated)/college/academics/error.tsx`
- [ ] `src/app/(authenticated)/college/academics/sections/[sectionId]/error.tsx`
- [ ] `src/app/(authenticated)/college/activity/[eventId]/error.tsx`
- [ ] `src/app/(authenticated)/college/activity/error.tsx`
- [ ] `src/app/(authenticated)/college/announcements/error.tsx`
- [ ] `src/app/(authenticated)/college/assignments/error.tsx`
- [ ] `src/app/(authenticated)/college/attendance/corrections/error.tsx`
- [ ] `src/app/(authenticated)/college/attendance/departments/error.tsx`
- [ ] `src/app/(authenticated)/college/attendance/error.tsx`
- [ ] `src/app/(authenticated)/college/attendance/settings/error.tsx`
- [ ] `src/app/(authenticated)/college/batch-promotion/error.tsx`
- [ ] `src/app/(authenticated)/college/batches/[cohortId]/students/error.tsx`
- [ ] `src/app/(authenticated)/college/batches/error.tsx`
- [ ] `src/app/(authenticated)/college/branding/error.tsx`
- [ ] `src/app/(authenticated)/college/classes/error.tsx`
- [ ] `src/app/(authenticated)/college/classes/recurring-preview/error.tsx`
- [ ] `src/app/(authenticated)/college/college-profile/error.tsx`
- [ ] `src/app/(authenticated)/college/companies/error.tsx`
- [ ] `src/app/(authenticated)/college/contacts/[membershipId]/error.tsx`
- [ ] `src/app/(authenticated)/college/contacts/error.tsx`
- [ ] `src/app/(authenticated)/college/course-progress/error.tsx`
- [ ] `src/app/(authenticated)/college/courses/error.tsx`
- [ ] `src/app/(authenticated)/college/courses/offerings/[offeringId]/error.tsx`
- [ ] `src/app/(authenticated)/college/departments/error.tsx`
- [ ] `src/app/(authenticated)/college/domains/error.tsx`
- [ ] `src/app/(authenticated)/college/electives/[slotId]/allocate/error.tsx`
- [ ] `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/error.tsx`
- [ ] `src/app/(authenticated)/college/electives/error.tsx`
- [ ] `src/app/(authenticated)/college/error.tsx`
- [ ] `src/app/(authenticated)/college/faculty-assignment/error.tsx`
- [ ] `src/app/(authenticated)/college/faculty/[membershipId]/error.tsx`
- [ ] `src/app/(authenticated)/college/faculty/error.tsx`
- [ ] `src/app/(authenticated)/college/faculty/import/error.tsx`
- [ ] `src/app/(authenticated)/college/groups/[groupId]/error.tsx`
- [ ] `src/app/(authenticated)/college/groups/[groupId]/import-preview/error.tsx`
- [ ] `src/app/(authenticated)/college/groups/[groupId]/rule-preview/error.tsx`
- [ ] `src/app/(authenticated)/college/groups/error.tsx`
- [ ] `src/app/(authenticated)/college/hiring-dashboard/error.tsx`
- [ ] `src/app/(authenticated)/college/lecture-halls/[hallId]/error.tsx`
- [ ] `src/app/(authenticated)/college/lecture-halls/error.tsx`
- [ ] `src/app/(authenticated)/college/lessons/error.tsx`
- [ ] `src/app/(authenticated)/college/live-classes/error.tsx`
- [ ] `src/app/(authenticated)/college/people/error.tsx`
- [ ] `src/app/(authenticated)/college/people/manage/error.tsx`
- [ ] `src/app/(authenticated)/college/placements/calendar/error.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/college/placements/drives/error.tsx`
- [ ] `src/app/(authenticated)/college/placements/error.tsx`
- [ ] `src/app/(authenticated)/college/placements/interviews/error.tsx`
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/error.tsx`
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/error.tsx`
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/error.tsx`
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/error.tsx`
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/error.tsx`
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/error.tsx`
- [ ] `src/app/(authenticated)/college/placements/new/error.tsx`
- [ ] `src/app/(authenticated)/college/placements/readiness-by-department/error.tsx`
- [ ] `src/app/(authenticated)/college/placements/retention/error.tsx`
- [ ] `src/app/(authenticated)/college/placements/student-lookup/error.tsx`
- [ ] `src/app/(authenticated)/college/profile/error.tsx`
- [ ] `src/app/(authenticated)/college/programs/error.tsx`
- [ ] `src/app/(authenticated)/college/projects/[projectId]/[section]/error.tsx`
- [ ] `src/app/(authenticated)/college/projects/[projectId]/error.tsx`
- [ ] `src/app/(authenticated)/college/projects/[projectId]/readiness/error.tsx`
- [ ] `src/app/(authenticated)/college/projects/at-risk/error.tsx`
- [ ] `src/app/(authenticated)/college/projects/audit/error.tsx`
- [ ] `src/app/(authenticated)/college/projects/error.tsx`
- [ ] `src/app/(authenticated)/college/projects/readiness/error.tsx`
- [ ] `src/app/(authenticated)/college/projects/reassign-mentor/error.tsx`
- [ ] `src/app/(authenticated)/college/projects/submissions/error.tsx`
- [ ] `src/app/(authenticated)/college/projects/templates/[templateId]/error.tsx`
- [ ] `src/app/(authenticated)/college/projects/templates/error.tsx`
- [ ] `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/[section]/error.tsx`
- [ ] `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/error.tsx`
- [ ] `src/app/(authenticated)/college/projects/workspaces/error.tsx`
- [ ] `src/app/(authenticated)/college/projects/workspaces/new/error.tsx`
- [ ] `src/app/(authenticated)/college/quizzes/error.tsx`
- [ ] `src/app/(authenticated)/college/resources/error.tsx`
- [ ] `src/app/(authenticated)/college/semester-courses/error.tsx`
- [ ] `src/app/(authenticated)/college/semesters/error.tsx`
- [ ] `src/app/(authenticated)/college/students/[membershipId]/error.tsx`
- [ ] `src/app/(authenticated)/college/students/error.tsx`
- [ ] `src/app/(authenticated)/college/students/import/error.tsx`
- [ ] `src/app/(authenticated)/college/students/register/error.tsx`
- [ ] `src/app/(authenticated)/college/verification/error.tsx`
- [ ] `src/app/(authenticated)/college/videos/error.tsx`

## college / loading (85)

- [ ] `src/app/(authenticated)/college/academics/loading.tsx`
- [ ] `src/app/(authenticated)/college/academics/sections/[sectionId]/loading.tsx`
- [ ] `src/app/(authenticated)/college/activity/[eventId]/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/college/activity/loading.tsx`
- [ ] `src/app/(authenticated)/college/announcements/loading.tsx`
- [ ] `src/app/(authenticated)/college/assignments/loading.tsx`
- [ ] `src/app/(authenticated)/college/attendance/corrections/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/college/attendance/departments/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/college/attendance/loading.tsx`
- [ ] `src/app/(authenticated)/college/attendance/settings/loading.tsx`
- [ ] `src/app/(authenticated)/college/batch-promotion/loading.tsx`
- [ ] `src/app/(authenticated)/college/batches/[cohortId]/students/loading.tsx`
- [ ] `src/app/(authenticated)/college/batches/loading.tsx`
- [ ] `src/app/(authenticated)/college/branding/loading.tsx`
- [ ] `src/app/(authenticated)/college/classes/loading.tsx`
- [ ] `src/app/(authenticated)/college/classes/recurring-preview/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/college/college-profile/loading.tsx`
- [ ] `src/app/(authenticated)/college/companies/loading.tsx`
- [ ] `src/app/(authenticated)/college/contacts/[membershipId]/loading.tsx`
- [ ] `src/app/(authenticated)/college/contacts/loading.tsx`
- [ ] `src/app/(authenticated)/college/course-progress/loading.tsx`
- [ ] `src/app/(authenticated)/college/courses/loading.tsx`
- [ ] `src/app/(authenticated)/college/courses/offerings/[offeringId]/loading.tsx` — migrated to shared component in extended sprint; strict parity proof pending
- [ ] `src/app/(authenticated)/college/departments/loading.tsx`
- [ ] `src/app/(authenticated)/college/domains/loading.tsx`
- [ ] `src/app/(authenticated)/college/electives/[slotId]/allocate/loading.tsx`
- [ ] `src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/loading.tsx`
- [ ] `src/app/(authenticated)/college/electives/loading.tsx`
- [ ] `src/app/(authenticated)/college/faculty-assignment/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/college/faculty/[membershipId]/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/college/faculty/import/loading.tsx`
- [ ] `src/app/(authenticated)/college/faculty/loading.tsx`
- [ ] `src/app/(authenticated)/college/groups/[groupId]/import-preview/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/college/groups/[groupId]/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/college/groups/[groupId]/rule-preview/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/college/groups/loading.tsx`
- [ ] `src/app/(authenticated)/college/hiring-dashboard/loading.tsx`
- [ ] `src/app/(authenticated)/college/lecture-halls/[hallId]/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/college/lecture-halls/loading.tsx`
- [ ] `src/app/(authenticated)/college/lessons/loading.tsx`
- [ ] `src/app/(authenticated)/college/live-classes/loading.tsx`
- [ ] `src/app/(authenticated)/college/loading.tsx`
- [ ] `src/app/(authenticated)/college/people/loading.tsx`
- [ ] `src/app/(authenticated)/college/people/manage/loading.tsx`
- [ ] `src/app/(authenticated)/college/placements/calendar/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/college/placements/drives/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/college/placements/interviews/loading.tsx`
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/loading.tsx`
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/loading.tsx`
- [ ] `src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/loading.tsx`
- [ ] `src/app/(authenticated)/college/placements/loading.tsx`
- [ ] `src/app/(authenticated)/college/placements/new/loading.tsx`
- [ ] `src/app/(authenticated)/college/placements/readiness-by-department/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/college/placements/retention/loading.tsx`
- [ ] `src/app/(authenticated)/college/placements/student-lookup/loading.tsx`
- [ ] `src/app/(authenticated)/college/profile/loading.tsx`
- [ ] `src/app/(authenticated)/college/programs/loading.tsx`
- [ ] `src/app/(authenticated)/college/projects/[projectId]/[section]/loading.tsx`
- [ ] `src/app/(authenticated)/college/projects/[projectId]/loading.tsx`
- [ ] `src/app/(authenticated)/college/projects/[projectId]/readiness/loading.tsx`
- [ ] `src/app/(authenticated)/college/projects/at-risk/loading.tsx`
- [ ] `src/app/(authenticated)/college/projects/audit/loading.tsx`
- [ ] `src/app/(authenticated)/college/projects/loading.tsx`
- [ ] `src/app/(authenticated)/college/projects/readiness/loading.tsx`
- [ ] `src/app/(authenticated)/college/projects/reassign-mentor/loading.tsx`
- [ ] `src/app/(authenticated)/college/projects/submissions/loading.tsx`
- [ ] `src/app/(authenticated)/college/projects/templates/[templateId]/loading.tsx`
- [ ] `src/app/(authenticated)/college/projects/templates/loading.tsx`
- [ ] `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/[section]/loading.tsx`
- [ ] `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/loading.tsx`
- [ ] `src/app/(authenticated)/college/projects/workspaces/loading.tsx`
- [ ] `src/app/(authenticated)/college/projects/workspaces/new/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/college/quizzes/loading.tsx`
- [ ] `src/app/(authenticated)/college/resources/loading.tsx`
- [ ] `src/app/(authenticated)/college/semester-courses/loading.tsx`
- [ ] `src/app/(authenticated)/college/semesters/loading.tsx`
- [ ] `src/app/(authenticated)/college/students/[membershipId]/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/college/students/import/loading.tsx`
- [ ] `src/app/(authenticated)/college/students/loading.tsx`
- [ ] `src/app/(authenticated)/college/students/register/loading.tsx`
- [ ] `src/app/(authenticated)/college/verification/loading.tsx`
- [ ] `src/app/(authenticated)/college/videos/loading.tsx`

## college / not-found (2)

- [ ] `src/app/(authenticated)/college/courses/offerings/[offeringId]/not-found.tsx`
- [ ] `src/app/(authenticated)/college/not-found.tsx`

## college-admin / error (2)

- [ ] `src/app/(authenticated)/college-admin/departments/error.tsx`
- [ ] `src/app/(authenticated)/college-admin/programs/error.tsx`

## college-admin / loading (2)

- [ ] `src/app/(authenticated)/college-admin/departments/loading.tsx`
- [ ] `src/app/(authenticated)/college-admin/programs/loading.tsx`

## college-admin / not-found (1)

- [ ] `src/app/(authenticated)/college-admin/not-found.tsx`

## dashboard / error (1)

- [ ] `src/app/(authenticated)/dashboard/error.tsx`

## dashboard / loading (1)

- [ ] `src/app/(authenticated)/dashboard/loading.tsx`

## error.tsx / error (1)

- [ ] `src/app/(authenticated)/error.tsx`

## hr / error (23)

- [ ] `src/app/(authenticated)/hr/activity/error.tsx` — migrated to shared component in extended sprint; strict parity proof pending
- [ ] `src/app/(authenticated)/hr/calendar/error.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/hr/colleges/error.tsx`
- [ ] `src/app/(authenticated)/hr/company/error.tsx` — migrated to shared component in extended sprint; strict parity proof pending
- [ ] `src/app/(authenticated)/hr/company/reports/error.tsx`
- [ ] `src/app/(authenticated)/hr/conversations/[threadId]/error.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/hr/conversations/error.tsx` — migrated to shared component in extended sprint; strict parity proof pending
- [ ] `src/app/(authenticated)/hr/drives/[jobId]/interview-slots/error.tsx`
- [ ] `src/app/(authenticated)/hr/drives/[jobId]/messages/error.tsx`
- [ ] `src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/error.tsx`
- [ ] `src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/remove/[roundId]/error.tsx`
- [ ] `src/app/(authenticated)/hr/drives/error.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/hr/drives/new/error.tsx`
- [ ] `src/app/(authenticated)/hr/drives/proposals/error.tsx`
- [ ] `src/app/(authenticated)/hr/drives/recorded-outside/error.tsx`
- [ ] `src/app/(authenticated)/hr/error.tsx`
- [ ] `src/app/(authenticated)/hr/home/error.tsx` — migrated to shared component in extended sprint; strict parity proof pending
- [ ] `src/app/(authenticated)/hr/messages/error.tsx` — migrated to shared component in extended sprint; strict parity proof pending
- [ ] `src/app/(authenticated)/hr/notifications/error.tsx`
- [ ] `src/app/(authenticated)/hr/placements/error.tsx`
- [ ] `src/app/(authenticated)/hr/placements/jobs/[jobId]/error.tsx`
- [ ] `src/app/(authenticated)/hr/profile/error.tsx` — migrated to shared component in extended sprint; strict parity proof pending
- [ ] `src/app/(authenticated)/hr/round-results/error.tsx`

## hr / loading (23)

- [ ] `src/app/(authenticated)/hr/activity/loading.tsx`
- [ ] `src/app/(authenticated)/hr/calendar/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/hr/colleges/loading.tsx`
- [ ] `src/app/(authenticated)/hr/company/loading.tsx`
- [ ] `src/app/(authenticated)/hr/company/reports/loading.tsx`
- [ ] `src/app/(authenticated)/hr/conversations/[threadId]/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/hr/conversations/loading.tsx`
- [ ] `src/app/(authenticated)/hr/drives/[jobId]/interview-slots/loading.tsx`
- [ ] `src/app/(authenticated)/hr/drives/[jobId]/messages/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/loading.tsx`
- [ ] `src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/remove/[roundId]/loading.tsx`
- [ ] `src/app/(authenticated)/hr/drives/loading.tsx`
- [ ] `src/app/(authenticated)/hr/drives/new/loading.tsx` — migrated with source-label preservation; strict parity open
- [ ] `src/app/(authenticated)/hr/drives/proposals/loading.tsx`
- [ ] `src/app/(authenticated)/hr/drives/recorded-outside/loading.tsx`
- [ ] `src/app/(authenticated)/hr/home/loading.tsx`
- [ ] `src/app/(authenticated)/hr/loading.tsx`
- [ ] `src/app/(authenticated)/hr/messages/loading.tsx`
- [ ] `src/app/(authenticated)/hr/notifications/loading.tsx`
- [ ] `src/app/(authenticated)/hr/placements/jobs/[jobId]/loading.tsx`
- [ ] `src/app/(authenticated)/hr/placements/loading.tsx`
- [ ] `src/app/(authenticated)/hr/profile/loading.tsx`
- [ ] `src/app/(authenticated)/hr/round-results/loading.tsx`

## hr / not-found (2)

- [ ] `src/app/(authenticated)/hr/not-found.tsx`
- [ ] `src/app/(authenticated)/hr/placements/jobs/[jobId]/not-found.tsx`

## learn / error (43)

- [ ] `src/app/(authenticated)/learn/allAssignments/[assignmentId]/error.tsx`
- [ ] `src/app/(authenticated)/learn/allAssignments/error.tsx`
- [ ] `src/app/(authenticated)/learn/allQuizzes/[quizId]/error.tsx`
- [ ] `src/app/(authenticated)/learn/allQuizzes/error.tsx`
- [ ] `src/app/(authenticated)/learn/assignments/error.tsx`
- [ ] `src/app/(authenticated)/learn/attendance/calendar/error.tsx`
- [ ] `src/app/(authenticated)/learn/attendance/error.tsx`
- [ ] `src/app/(authenticated)/learn/calendar/error.tsx`
- [ ] `src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/error.tsx`
- [ ] `src/app/(authenticated)/learn/courses/[deliveryId]/attendance-summary/error.tsx`
- [ ] `src/app/(authenticated)/learn/courses/[deliveryId]/error.tsx`
- [ ] `src/app/(authenticated)/learn/courses/[deliveryId]/progress/error.tsx`
- [ ] `src/app/(authenticated)/learn/courses/error.tsx`
- [ ] `src/app/(authenticated)/learn/error.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/announcements/error.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/company/error.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/error.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/error.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/applications/error.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/assessments/error.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/assessments/results/error.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/calendar/error.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/error.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/interviews/error.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/jobs/[jobId]/error.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/jobs/error.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/notification-preferences/error.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/offers/error.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/placement/error.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/preparation/error.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/rules/error.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/schedule/error.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/support/error.tsx`
- [ ] `src/app/(authenticated)/learn/notifications/error.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/learn/notifications/history/error.tsx`
- [ ] `src/app/(authenticated)/learn/placements/error.tsx`
- [ ] `src/app/(authenticated)/learn/profile/academic-record/error.tsx`
- [ ] `src/app/(authenticated)/learn/profile/completeness/error.tsx`
- [ ] `src/app/(authenticated)/learn/profile/error.tsx` — migrated to shared component in extended sprint; strict parity proof pending
- [ ] `src/app/(authenticated)/learn/profile/verification/error.tsx`
- [ ] `src/app/(authenticated)/learn/projects/[projectId]/error.tsx`
- [ ] `src/app/(authenticated)/learn/projects/error.tsx` — migrated to shared component in extended sprint; strict parity proof pending
- [ ] `src/app/(authenticated)/learn/quizzes/error.tsx`

## learn / loading (43)

- [ ] `src/app/(authenticated)/learn/allAssignments/[assignmentId]/loading.tsx`
- [ ] `src/app/(authenticated)/learn/allAssignments/loading.tsx`
- [ ] `src/app/(authenticated)/learn/allQuizzes/[quizId]/loading.tsx`
- [ ] `src/app/(authenticated)/learn/allQuizzes/loading.tsx`
- [ ] `src/app/(authenticated)/learn/assignments/loading.tsx`
- [ ] `src/app/(authenticated)/learn/attendance/calendar/loading.tsx`
- [ ] `src/app/(authenticated)/learn/attendance/loading.tsx`
- [ ] `src/app/(authenticated)/learn/calendar/loading.tsx`
- [ ] `src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/loading.tsx`
- [ ] `src/app/(authenticated)/learn/courses/[deliveryId]/attendance-summary/loading.tsx`
- [ ] `src/app/(authenticated)/learn/courses/[deliveryId]/loading.tsx`
- [ ] `src/app/(authenticated)/learn/courses/[deliveryId]/progress/loading.tsx`
- [ ] `src/app/(authenticated)/learn/courses/loading.tsx`
- [ ] `src/app/(authenticated)/learn/loading.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/announcements/loading.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/company/loading.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/loading.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/applications/[applicationId]/loading.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/applications/loading.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/assessments/loading.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/assessments/results/loading.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/calendar/loading.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/interviews/loading.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/jobs/[jobId]/loading.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/jobs/loading.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/loading.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/notification-preferences/loading.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/offers/loading.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/placement/loading.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/preparation/loading.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/rules/loading.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/schedule/loading.tsx`
- [ ] `src/app/(authenticated)/learn/my-placements/support/loading.tsx`
- [ ] `src/app/(authenticated)/learn/notifications/history/loading.tsx`
- [ ] `src/app/(authenticated)/learn/notifications/loading.tsx`
- [ ] `src/app/(authenticated)/learn/placements/loading.tsx`
- [ ] `src/app/(authenticated)/learn/profile/academic-record/loading.tsx`
- [ ] `src/app/(authenticated)/learn/profile/completeness/loading.tsx`
- [ ] `src/app/(authenticated)/learn/profile/loading.tsx`
- [ ] `src/app/(authenticated)/learn/profile/verification/loading.tsx`
- [ ] `src/app/(authenticated)/learn/projects/[projectId]/loading.tsx`
- [ ] `src/app/(authenticated)/learn/projects/loading.tsx`
- [ ] `src/app/(authenticated)/learn/quizzes/loading.tsx`

## learn / not-found (3)

- [ ] `src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/not-found.tsx`
- [ ] `src/app/(authenticated)/learn/not-found.tsx`
- [ ] `src/app/(authenticated)/learn/projects/[projectId]/not-found.tsx`

## loading.tsx / loading (1)

- [ ] `src/app/(authenticated)/loading.tsx`

## mentor / error (26)

- [ ] `src/app/(authenticated)/mentor/activity/error.tsx` — migrated to shared component in extended sprint; strict parity proof pending
- [ ] `src/app/(authenticated)/mentor/calendar/error.tsx`
- [ ] `src/app/(authenticated)/mentor/error.tsx`
- [ ] `src/app/(authenticated)/mentor/notifications/error.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/error.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/board-review/error.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/closeout/error.tsx` — migrated to shared component in extended sprint; strict parity proof pending
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/deliveries/[submissionId]/review/error.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/error.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/meetings/[meetingId]/notes/error.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/resources-directory/error.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/review-completeness/error.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/review-overview/error.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/risk-readiness/error.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/tasks/[taskId]/feedback/error.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/team-history/error.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/team-meetings/error.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/timeline/error.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/error.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/mentor/reports/error.tsx` — migrated to shared component in extended sprint; strict parity proof pending
- [ ] `src/app/(authenticated)/mentor/review-history/error.tsx`
- [ ] `src/app/(authenticated)/mentor/reviews/error.tsx` — migrated to shared component in extended sprint; strict parity proof pending
- [ ] `src/app/(authenticated)/mentor/sprint-progress/error.tsx`
- [ ] `src/app/(authenticated)/mentor/task-review-history/error.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/mentor/task-reviews/error.tsx`
- [ ] `src/app/(authenticated)/mentor/team-coverage/error.tsx`

## mentor / loading (26)

- [ ] `src/app/(authenticated)/mentor/activity/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/calendar/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/notifications/loading.tsx` — migrated with source-label preservation; strict parity open
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/board-review/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/closeout/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/deliveries/[submissionId]/review/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/meetings/[meetingId]/notes/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/resources-directory/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/review-completeness/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/review-overview/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/risk-readiness/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/tasks/[taskId]/feedback/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/team-history/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/team-meetings/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/mentor/projects/[projectId]/timeline/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/mentor/projects/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/reports/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/review-history/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/reviews/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/sprint-progress/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/task-review-history/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/mentor/task-reviews/loading.tsx`
- [ ] `src/app/(authenticated)/mentor/team-coverage/loading.tsx`

## mentor / not-found (1)

- [ ] `src/app/(authenticated)/mentor/not-found.tsx`

## notifications / error (1)

- [ ] `src/app/(authenticated)/notifications/error.tsx`

## notifications / loading (1)

- [ ] `src/app/(authenticated)/notifications/loading.tsx`

## public / error (21)

- [ ] `src/app/auth/handoff/error.tsx`
- [ ] `src/app/campaign-unsubscribe/[token]/error.tsx`
- [ ] `src/app/campaign-unsubscribe/confirmed/error.tsx`
- [ ] `src/app/college-join/[token]/error.tsx`
- [ ] `src/app/company-join/[token]/error.tsx`
- [ ] `src/app/company-share/[token]/error.tsx`
- [ ] `src/app/e2e/superadmin-login/error.tsx`
- [ ] `src/app/enterprises/error.tsx`
- [ ] `src/app/error.tsx`
- [ ] `src/app/forbidden/error.tsx`
- [ ] `src/app/home/error.tsx`
- [ ] `src/app/hr-invite/[token]/error.tsx`
- [ ] `src/app/login/error.tsx`
- [ ] `src/app/placements/error.tsx`
- [ ] `src/app/platform/error.tsx`
- [ ] `src/app/privacy-policy/error.tsx`
- [ ] `src/app/quiz/error.tsx`
- [ ] `src/app/recruiter-invite/[token]/error.tsx`
- [ ] `src/app/request-demo/error.tsx`
- [ ] `src/app/superadmin-login/error.tsx`
- [ ] `src/app/universities/error.tsx`

## public / loading (21)

- [ ] `src/app/auth/handoff/loading.tsx`
- [ ] `src/app/campaign-unsubscribe/[token]/loading.tsx`
- [ ] `src/app/campaign-unsubscribe/confirmed/loading.tsx`
- [ ] `src/app/college-join/[token]/loading.tsx`
- [ ] `src/app/company-join/[token]/loading.tsx`
- [ ] `src/app/company-share/[token]/loading.tsx`
- [ ] `src/app/e2e/superadmin-login/loading.tsx`
- [ ] `src/app/enterprises/loading.tsx`
- [ ] `src/app/forbidden/loading.tsx`
- [ ] `src/app/home/loading.tsx`
- [ ] `src/app/hr-invite/[token]/loading.tsx`
- [ ] `src/app/loading.tsx`
- [ ] `src/app/login/loading.tsx`
- [ ] `src/app/placements/loading.tsx`
- [ ] `src/app/platform/loading.tsx`
- [ ] `src/app/privacy-policy/loading.tsx`
- [ ] `src/app/quiz/loading.tsx`
- [ ] `src/app/recruiter-invite/[token]/loading.tsx`
- [ ] `src/app/request-demo/loading.tsx`
- [ ] `src/app/superadmin-login/loading.tsx`
- [ ] `src/app/universities/loading.tsx`

## public / not-found (3)

- [ ] `src/app/company-share/[token]/not-found.tsx`
- [ ] `src/app/not-found.tsx`
- [ ] `src/app/placements/not-found.tsx`

## recruiter / error (17)

- [ ] `src/app/(authenticated)/recruiter/calendar/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/colleges/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/company/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/change-requests/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/interview-slots/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/messages/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/remove/[roundId]/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/new/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/proposals/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/recorded-outside/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/home/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/messages/error.tsx`
- [ ] `src/app/(authenticated)/recruiter/profile/error.tsx`

## recruiter / loading (17)

- [ ] `src/app/(authenticated)/recruiter/calendar/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/colleges/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/company/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/change-requests/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/interview-slots/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/messages/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/remove/[roundId]/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/new/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/proposals/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/drives/recorded-outside/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/home/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/messages/loading.tsx`
- [ ] `src/app/(authenticated)/recruiter/profile/loading.tsx`

## recruiter / not-found (1)

- [ ] `src/app/(authenticated)/recruiter/not-found.tsx`

## superadmin / error (4)

- [ ] `src/app/(authenticated)/superadmin/[...legacy]/error.tsx`
- [ ] `src/app/(authenticated)/superadmin/departments/error.tsx`
- [ ] `src/app/(authenticated)/superadmin/error.tsx`
- [ ] `src/app/(authenticated)/superadmin/programs/error.tsx`

## superadmin / loading (4)

- [ ] `src/app/(authenticated)/superadmin/[...legacy]/loading.tsx`
- [ ] `src/app/(authenticated)/superadmin/departments/loading.tsx`
- [ ] `src/app/(authenticated)/superadmin/loading.tsx`
- [ ] `src/app/(authenticated)/superadmin/programs/loading.tsx`

## superadmin / not-found (1)

- [ ] `src/app/(authenticated)/superadmin/not-found.tsx`

## teach / error (3)

- [ ] `src/app/(authenticated)/teach/courses/[deliveryId]/error.tsx`
- [ ] `src/app/(authenticated)/teach/courses/error.tsx`
- [ ] `src/app/(authenticated)/teach/error.tsx`

## teach / loading (3)

- [ ] `src/app/(authenticated)/teach/courses/[deliveryId]/loading.tsx`
- [ ] `src/app/(authenticated)/teach/courses/loading.tsx`
- [ ] `src/app/(authenticated)/teach/loading.tsx`

## teach / not-found (1)

- [ ] `src/app/(authenticated)/teach/not-found.tsx`

## teacher / error (37)

- [ ] `src/app/(authenticated)/teacher/allAssignments/error.tsx`
- [ ] `src/app/(authenticated)/teacher/allQuizzes/error.tsx`
- [ ] `src/app/(authenticated)/teacher/calendar/error.tsx`
- [ ] `src/app/(authenticated)/teacher/contacts/[contactsTab]/[membershipId]/error.tsx`
- [ ] `src/app/(authenticated)/teacher/contacts/[contactsTab]/error.tsx`
- [ ] `src/app/(authenticated)/teacher/contacts/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/assessment-health/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/assignments/manage/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/attendance-corrections/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-history/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-participation/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/[learnerMembershipId]/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/notices/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/quizzes/manage/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/reports/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/session-coverage/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/students/[membershipId]/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/students/error.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/error.tsx`
- [ ] `src/app/(authenticated)/teacher/error.tsx`
- [ ] `src/app/(authenticated)/teacher/live-classes/error.tsx`
- [ ] `src/app/(authenticated)/teacher/notifications/error.tsx`
- [ ] `src/app/(authenticated)/teacher/profile/contacts/error.tsx`
- [ ] `src/app/(authenticated)/teacher/profile/details/error.tsx`
- [ ] `src/app/(authenticated)/teacher/profile/error.tsx`
- [ ] `src/app/(authenticated)/teacher/profile/teaching/error.tsx`
- [ ] `src/app/(authenticated)/teacher/report/assignment/[contentId]/error.tsx`
- [ ] `src/app/(authenticated)/teacher/report/assignment/[contentId]/submissions/error.tsx`
- [ ] `src/app/(authenticated)/teacher/report/quiz/[quizId]/attempts/error.tsx`
- [ ] `src/app/(authenticated)/teacher/report/quiz/[quizId]/error.tsx`
- [ ] `src/app/(authenticated)/teacher/response-followups/error.tsx`
- [ ] `src/app/(authenticated)/teacher/results/error.tsx` — migrated to shared component in extended sprint; strict parity proof pending

## teacher / loading (37)

- [ ] `src/app/(authenticated)/teacher/allAssignments/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/allQuizzes/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/calendar/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/contacts/[contactsTab]/[membershipId]/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/contacts/[contactsTab]/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/contacts/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/assessment-health/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/assignments/manage/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/attendance-corrections/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-history/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-participation/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/[learnerMembershipId]/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/notices/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/quizzes/manage/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/reports/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/session-coverage/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/students/[membershipId]/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/[deliveryId]/students/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/courses/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/live-classes/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/notifications/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/profile/contacts/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/profile/details/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/profile/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/profile/teaching/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/report/assignment/[contentId]/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/report/assignment/[contentId]/submissions/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/report/quiz/[quizId]/attempts/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/report/quiz/[quizId]/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/response-followups/loading.tsx`
- [ ] `src/app/(authenticated)/teacher/results/loading.tsx`

## teacher / not-found (1)

- [ ] `src/app/(authenticated)/teacher/not-found.tsx`

## tpo / error (126)

- [ ] `src/app/(authenticated)/tpo/announcements/error.tsx`
- [ ] `src/app/(authenticated)/tpo/audit/actors/error.tsx`
- [ ] `src/app/(authenticated)/tpo/audit/error.tsx`
- [ ] `src/app/(authenticated)/tpo/batches/[batchId]/classes/error.tsx`
- [ ] `src/app/(authenticated)/tpo/batches/[batchId]/error.tsx`
- [ ] `src/app/(authenticated)/tpo/batches/[batchId]/history/error.tsx`
- [ ] `src/app/(authenticated)/tpo/batches/[batchId]/invitation-prep/error.tsx`
- [ ] `src/app/(authenticated)/tpo/batches/[batchId]/nudge-prep/error.tsx`
- [ ] `src/app/(authenticated)/tpo/batches/[batchId]/registrations/[membershipId]/history/error.tsx`
- [ ] `src/app/(authenticated)/tpo/batches/[batchId]/registrations/error.tsx`
- [ ] `src/app/(authenticated)/tpo/batches/[batchId]/reminder-prep/error.tsx`
- [ ] `src/app/(authenticated)/tpo/batches/[batchId]/rules/error.tsx`
- [ ] `src/app/(authenticated)/tpo/batches/[batchId]/students/error.tsx`
- [ ] `src/app/(authenticated)/tpo/batches/error.tsx`
- [ ] `src/app/(authenticated)/tpo/calendar/error.tsx`
- [ ] `src/app/(authenticated)/tpo/calendar/export/error.tsx`
- [ ] `src/app/(authenticated)/tpo/calendar/interviews/error.tsx`
- [ ] `src/app/(authenticated)/tpo/calendar/rounds/error.tsx`
- [ ] `src/app/(authenticated)/tpo/companies/[companyId]/contact-log/error.tsx`
- [ ] `src/app/(authenticated)/tpo/companies/[companyId]/error.tsx`
- [ ] `src/app/(authenticated)/tpo/companies/[companyId]/feedback/error.tsx`
- [ ] `src/app/(authenticated)/tpo/companies/[companyId]/manage/error.tsx`
- [ ] `src/app/(authenticated)/tpo/companies/[companyId]/people/error.tsx`
- [ ] `src/app/(authenticated)/tpo/companies/archived/error.tsx`
- [ ] `src/app/(authenticated)/tpo/companies/error.tsx`
- [ ] `src/app/(authenticated)/tpo/drive-day/[roundId]/error.tsx`
- [ ] `src/app/(authenticated)/tpo/drive-day/[roundId]/no-shows/error.tsx`
- [ ] `src/app/(authenticated)/tpo/drive-day/error.tsx`
- [ ] `src/app/(authenticated)/tpo/error.tsx`
- [ ] `src/app/(authenticated)/tpo/find/error.tsx`
- [ ] `src/app/(authenticated)/tpo/follow-ups/error.tsx`
- [ ] `src/app/(authenticated)/tpo/home/error.tsx`
- [ ] `src/app/(authenticated)/tpo/messages/[threadId]/error.tsx`
- [ ] `src/app/(authenticated)/tpo/messages/error.tsx`
- [ ] `src/app/(authenticated)/tpo/messages/notifications/error.tsx`
- [ ] `src/app/(authenticated)/tpo/more/error.tsx`
- [ ] `src/app/(authenticated)/tpo/notifications/error.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/error.tsx` — replacement source updated; F3–F5 strict proof OPEN
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/about/error.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/error.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants/[applicationId]/error.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants/error.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applications-export/error.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/cancel-preview/error.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/candidate-schedule/error.tsx` — replacement source updated; F3–F5 strict proof OPEN
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/error.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/close-preview/error.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/closeout/error.tsx` — replacement source updated; F3–F5 strict proof OPEN
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/discussion/error.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/drive-day/error.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/error.tsx` — replacement source updated; F3–F5 strict proof OPEN
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/error.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/extend-deadline/error.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/interview-slots/error.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/joining/error.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/letters/error.tsx` — replacement source updated; F3–F5 strict proof OPEN
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/[offerId]/error.tsx` — replacement source updated; F3–F5 strict proof OPEN
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/error.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/results/error.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/slots/error.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/error.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/selections/error.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-audit/error.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-preview/error.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/shortlist/error.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/waitlist/error.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/lifecycle/error.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/new/draft/error.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/new/error.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/overview/error.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/recorded-outside/error.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/schedule-conflicts/error.tsx`
- [ ] `src/app/(authenticated)/tpo/profile/error.tsx`
- [ ] `src/app/(authenticated)/tpo/recruiters/[leadId]/error.tsx`
- [ ] `src/app/(authenticated)/tpo/recruiters/campaigns/[batchId]/error.tsx`
- [ ] `src/app/(authenticated)/tpo/recruiters/campaigns/drafts/[campaignId]/error.tsx`
- [ ] `src/app/(authenticated)/tpo/recruiters/campaigns/error.tsx`
- [ ] `src/app/(authenticated)/tpo/recruiters/campaigns/new/error.tsx`
- [ ] `src/app/(authenticated)/tpo/recruiters/campaigns/preview/error.tsx`
- [ ] `src/app/(authenticated)/tpo/recruiters/error.tsx`
- [ ] `src/app/(authenticated)/tpo/reports/accreditation/error.tsx` — replacement source updated; F3–F5 strict proof OPEN
- [ ] `src/app/(authenticated)/tpo/reports/after-college/error.tsx`
- [ ] `src/app/(authenticated)/tpo/reports/branch-season/error.tsx` — replacement source updated; F3–F5 strict proof OPEN
- [ ] `src/app/(authenticated)/tpo/reports/by-branch/error.tsx` — source-complete 2026-10-19: value table, per-file grep counters and phone/tablet source review in clone-states.md; strict runtime/whole-area parity remains open
- [ ] `src/app/(authenticated)/tpo/reports/by-company/error.tsx` — source-complete 2026-10-19: value table, per-file grep counters and phone/tablet source review in clone-states.md; strict runtime/whole-area parity remains open
- [ ] `src/app/(authenticated)/tpo/reports/ctc/error.tsx` — replacement source updated; F3–F5 strict proof OPEN
- [ ] `src/app/(authenticated)/tpo/reports/error.tsx` — replacement source updated; F3–F5 strict proof OPEN
- [ ] `src/app/(authenticated)/tpo/reports/failure-reasons/error.tsx` — replacement source updated; F3–F5 strict proof OPEN
- [ ] `src/app/(authenticated)/tpo/reports/intelligence/error.tsx`
- [ ] `src/app/(authenticated)/tpo/reports/joining-followups/error.tsx`
- [ ] `src/app/(authenticated)/tpo/reports/joining-status/error.tsx` — source-complete 2026-10-19: value table, per-file grep counters and phone/tablet source review in clone-states.md; strict runtime/whole-area parity remains open
- [ ] `src/app/(authenticated)/tpo/reports/leads/error.tsx` — source-complete 2026-10-19: value table, per-file grep counters and phone/tablet source review in clone-states.md; strict runtime/whole-area parity remains open
- [ ] `src/app/(authenticated)/tpo/reports/offers-acceptance/error.tsx` — source-complete 2026-10-19: value table, per-file grep counters and phone/tablet source review in clone-states.md; strict runtime/whole-area parity remains open
- [ ] `src/app/(authenticated)/tpo/reports/offers-expiry/error.tsx` — source-complete 2026-10-19: value table, per-file grep counters and phone/tablet source review in clone-states.md; strict runtime/whole-area parity remains open
- [ ] `src/app/(authenticated)/tpo/reports/placed-branch/error.tsx` — source-complete 2026-10-19: value table, per-file grep counters and phone/tablet source review in clone-states.md; strict runtime/whole-area parity remains open
- [ ] `src/app/(authenticated)/tpo/reports/placement-summary/error.tsx` — source-complete 2026-10-19: value table, per-file grep counters and phone/tablet source review in clone-states.md; strict runtime/whole-area parity remains open
- [ ] `src/app/(authenticated)/tpo/reports/season-pipeline/error.tsx` — source-complete 2026-10-19: value table, per-file grep counters and phone/tablet source review in clone-states.md; strict runtime/whole-area parity remains open
- [ ] `src/app/(authenticated)/tpo/reports/unplaced/error.tsx` — source-complete 2026-10-19: value table, per-file grep counters and phone/tablet source review in clone-states.md; strict runtime/whole-area parity remains open
- [ ] `src/app/(authenticated)/tpo/requests/error.tsx` — migrated to shared component in extended sprint; strict parity proof pending
- [ ] `src/app/(authenticated)/tpo/settings/after-college/error.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/blocked-dates/error.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/branding/error.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/error.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/job-types/error.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/notices/error.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/notifications/error.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/prep-readiness/error.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/public-link/error.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/public-page/error.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/recruiters/error.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/rules/error.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/season/error.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/see/error.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/team/error.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/templates/error.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/trusted/error.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/tpo/students/[membershipId]/history/error.tsx`
- [ ] `src/app/(authenticated)/tpo/students/[membershipId]/participation/error.tsx`
- [ ] `src/app/(authenticated)/tpo/students/error.tsx` — migrated to shared component in extended sprint; strict parity proof pending
- [ ] `src/app/(authenticated)/tpo/students/preparation-plan/error.tsx`
- [ ] `src/app/(authenticated)/tpo/students/preparation-prep/error.tsx`
- [ ] `src/app/(authenticated)/tpo/students/requests/error.tsx`
- [ ] `src/app/(authenticated)/tpo/team/[threadId]/error.tsx`
- [ ] `src/app/(authenticated)/tpo/team/error.tsx` — migrated to shared component in extended sprint; strict parity proof pending
- [ ] `src/app/(authenticated)/tpo/team/everyone/error.tsx`
- [ ] `src/app/(authenticated)/tpo/verification/error.tsx`

## tpo / loading (126)

- [ ] `src/app/(authenticated)/tpo/announcements/loading.tsx` — replacement source updated; F3–F5 strict proof OPEN
- [ ] `src/app/(authenticated)/tpo/audit/actors/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/audit/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/batches/[batchId]/classes/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/batches/[batchId]/history/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/batches/[batchId]/invitation-prep/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/batches/[batchId]/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/batches/[batchId]/nudge-prep/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/batches/[batchId]/registrations/[membershipId]/history/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/batches/[batchId]/registrations/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/batches/[batchId]/reminder-prep/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/batches/[batchId]/rules/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/batches/[batchId]/students/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/batches/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/calendar/export/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/calendar/interviews/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/calendar/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/calendar/rounds/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/companies/[companyId]/contact-log/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/companies/[companyId]/feedback/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/companies/[companyId]/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/companies/[companyId]/manage/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/companies/[companyId]/people/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/companies/archived/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/companies/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/drive-day/[roundId]/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/drive-day/[roundId]/no-shows/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/drive-day/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/find/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/follow-ups/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/home/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/messages/[threadId]/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/messages/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/messages/notifications/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/more/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/notifications/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/about/loading.tsx` — migrated/labelled on bounded turn 2; strict proof pending
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants/[applicationId]/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants/loading.tsx` — migrated/labelled on bounded turn 2; strict proof pending
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applications-export/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/cancel-preview/loading.tsx` — migrated/labelled on bounded turn 2; strict proof pending
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/candidate-schedule/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/close-preview/loading.tsx` — migrated/labelled on bounded turn 2; strict proof pending
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/closeout/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/discussion/loading.tsx` — migrated/labelled on bounded turn 2; strict proof pending
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/drive-day/loading.tsx` — migrated/labelled on bounded turn 2; strict proof pending
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/extend-deadline/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/interview-slots/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/joining/loading.tsx` — migrated/labelled on bounded turn 2; strict proof pending
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/letters/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/[offerId]/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/loading.tsx` — migrated/labelled on bounded turn 2; strict proof pending
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/results/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/slots/loading.tsx` — migrated/labelled on bounded turn 2; strict proof pending
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/loading.tsx` — migrated/labelled on bounded turn 2; strict proof pending
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/selections/loading.tsx` — migrated/labelled on bounded turn 2; strict proof pending
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-audit/loading.tsx` — migrated/labelled on bounded turn 2; strict proof pending
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-preview/loading.tsx` — migrated/labelled on bounded turn 2; strict proof pending
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/shortlist/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/waitlist/loading.tsx` — migrated/labelled on bounded turn 2; strict proof pending
- [ ] `src/app/(authenticated)/tpo/placements/lifecycle/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/new/draft/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/new/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/overview/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/recorded-outside/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/placements/schedule-conflicts/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/profile/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/recruiters/[leadId]/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/recruiters/campaigns/[batchId]/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/recruiters/campaigns/drafts/[campaignId]/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/recruiters/campaigns/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/recruiters/campaigns/new/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/recruiters/campaigns/preview/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/recruiters/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/reports/accreditation/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/reports/after-college/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/reports/branch-season/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/reports/by-branch/loading.tsx` — replacement source updated; F3–F5 strict proof OPEN
- [ ] `src/app/(authenticated)/tpo/reports/by-company/loading.tsx` — replacement source updated; F3–F5 strict proof OPEN
- [ ] `src/app/(authenticated)/tpo/reports/ctc/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/reports/failure-reasons/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/tpo/reports/intelligence/loading.tsx` — migrated/labelled on bounded turn 2; strict proof pending
- [ ] `src/app/(authenticated)/tpo/reports/joining-followups/loading.tsx` — migrated/labelled on bounded turn 2; strict proof pending
- [ ] `src/app/(authenticated)/tpo/reports/joining-status/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/tpo/reports/leads/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/reports/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/reports/offers-acceptance/loading.tsx` — migrated/labelled on bounded turn 2; strict proof pending
- [ ] `src/app/(authenticated)/tpo/reports/offers-expiry/loading.tsx` — migrated/labelled on bounded turn 2; strict proof pending
- [ ] `src/app/(authenticated)/tpo/reports/placed-branch/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/tpo/reports/placement-summary/loading.tsx` — migrated/labelled on bounded turn 2; strict proof pending
- [ ] `src/app/(authenticated)/tpo/reports/season-pipeline/loading.tsx` — migrated/labelled on bounded turn 2; strict proof pending
- [ ] `src/app/(authenticated)/tpo/reports/unplaced/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/requests/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/after-college/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/blocked-dates/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/branding/loading.tsx` — replacement source updated; F3–F5 strict proof OPEN
- [ ] `src/app/(authenticated)/tpo/settings/job-types/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/notices/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/notifications/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/tpo/settings/prep-readiness/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/public-link/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/public-page/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/recruiters/loading.tsx` — replacement source updated; F3–F5 strict proof OPEN
- [ ] `src/app/(authenticated)/tpo/settings/rules/loading.tsx` — replacement source updated; F3–F5 strict proof OPEN
- [ ] `src/app/(authenticated)/tpo/settings/season/loading.tsx` — replacement source updated; F3–F5 strict proof OPEN
- [ ] `src/app/(authenticated)/tpo/settings/see/loading.tsx` — migrated with source-label preservation; strict parity open
- [ ] `src/app/(authenticated)/tpo/settings/team/loading.tsx` — replacement source updated; F3–F5 strict proof OPEN
- [ ] `src/app/(authenticated)/tpo/settings/templates/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/settings/trusted/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/tpo/students/[membershipId]/history/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/tpo/students/[membershipId]/participation/loading.tsx` — shared source state migrated in extended sprint; strict visual proof pending
- [ ] `src/app/(authenticated)/tpo/students/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/students/preparation-plan/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/students/preparation-prep/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/students/requests/loading.tsx` — replacement source updated; F3–F5 strict proof OPEN
- [ ] `src/app/(authenticated)/tpo/team/[threadId]/loading.tsx` — replacement source updated; F3–F5 strict proof OPEN
- [ ] `src/app/(authenticated)/tpo/team/everyone/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/team/loading.tsx`
- [ ] `src/app/(authenticated)/tpo/verification/loading.tsx`

## tpo / not-found (1)

- [ ] `src/app/(authenticated)/tpo/not-found.tsx`

## tracker / error (7)

- [ ] `src/app/(authenticated)/tracker/audit-findings/[publicId]/error.tsx`
- [ ] `src/app/(authenticated)/tracker/audit-findings/error.tsx`
- [ ] `src/app/(authenticated)/tracker/error.tsx`
- [ ] `src/app/(authenticated)/tracker/issues/[publicId]/error.tsx`
- [ ] `src/app/(authenticated)/tracker/issues/error.tsx`
- [ ] `src/app/(authenticated)/tracker/logs/error.tsx`
- [ ] `src/app/(authenticated)/tracker/mine/[publicId]/error.tsx`

## tracker / loading (6)

- [ ] `src/app/(authenticated)/tracker/audit-findings/[publicId]/loading.tsx`
- [ ] `src/app/(authenticated)/tracker/audit-findings/loading.tsx`
- [ ] `src/app/(authenticated)/tracker/issues/[publicId]/loading.tsx`
- [ ] `src/app/(authenticated)/tracker/issues/loading.tsx`
- [ ] `src/app/(authenticated)/tracker/loading.tsx`
- [ ] `src/app/(authenticated)/tracker/logs/loading.tsx`

## Source-derived placement page state queue — 2026-10-19 chat-5 replacement continuation

**16 TPO placement page sources migrated and individually re-read.** Listed here as source-completed (not Strict Ticks), since complete pixel parity, entire-repository greps and viewport/browser comparison remain outstanding. The original 1,041 route-state inventory stays unticked by design. Per-page remote-byte regex counts, shared-component opening/closing proof, token source value table and responsive source notes appear in clone-states.md.

- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx` — source migration completed and remote JSX tag pairs verified; **strict 320px/767px/tablet and computed-style proof pending**
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-audit/page.tsx` — source migration completed and remote JSX tag pairs verified; **strict 320px/767px/tablet and computed-style proof pending**
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/slots/page.tsx` — source migration completed and remote JSX tag pairs verified; **strict 320px/767px/tablet and computed-style proof pending**
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/cancel-preview/page.tsx` — source migration completed and remote JSX tag pairs verified; **strict 320px/767px/tablet and computed-style proof pending**
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/close-preview/page.tsx` — source migration completed and remote JSX tag pairs verified; **strict 320px/767px/tablet and computed-style proof pending**
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/closeout/page.tsx` — source migration completed and remote JSX tag pairs verified; **strict 320px/767px/tablet and computed-style proof pending**
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/page.tsx` — source migration completed and remote JSX tag pairs verified; **strict 320px/767px/tablet and computed-style proof pending**
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-preview/page.tsx` — source migration completed and remote JSX tag pairs verified; **strict 320px/767px/tablet and computed-style proof pending**
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/about/page.tsx` — source migration completed and remote JSX tag pairs verified; **strict 320px/767px/tablet and computed-style proof pending**
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/candidate-schedule/page.tsx` — source migration completed and remote JSX tag pairs verified; **strict 320px/767px/tablet and computed-style proof pending**
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/joining/page.tsx` — source migration completed and remote JSX tag pairs verified; **strict 320px/767px/tablet and computed-style proof pending**
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/page.tsx` — source migration completed and remote JSX tag pairs verified; **strict 320px/767px/tablet and computed-style proof pending**
- [ ] `src/app/(authenticated)/tpo/placements/recorded-outside/page.tsx` — source migration completed and remote JSX tag pairs verified; **strict 320px/767px/tablet and computed-style proof pending**
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/selections/page.tsx` — source migration completed and remote JSX tag pairs verified; **strict 320px/767px/tablet and computed-style proof pending**
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applications-export/page.tsx` — source migration completed and remote JSX tag pairs verified; **strict 320px/767px/tablet and computed-style proof pending**
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/discussion/page.tsx` — source migration completed and remote JSX tag pairs verified; **strict 320px/767px/tablet and computed-style proof pending**

Next discovered grep candidates:
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants/[applicationId]/page.tsx` — two raw capped-result role=status notices
- [ ] `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx` — access-ended raw role=alert
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/[offerId]/page.tsx` — inspect result/offer feedback
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-preview/company-share-controls.tsx` — inspect inline notice and loading states



## Chat-5 next-batch source passes — 36 files (2026-10-19)

This list distinguishes completed **source migration** from STRICT F3/F4/F5 category parity: these 36 sources are fetched and migrated; all strict checkboxes stay **unticked** until exact old-LMS value equality, zero whole-repo bespoke grep (with exemptions), 320px/767px/tablet behavior, TS/JSX validation and visual proof. See the exact per-source table and value discrepancies in `docs/audit/ux/clone-states.md`. Do not claim zero remaining notices based on these bounded source checks.

- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants/[applicationId]/page.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/page.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/drive-day/page.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/extend-deadline/page.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/letters/page.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/[offerId]/page.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-preview/company-share-controls.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/components/placements/tpo-applicant-review-form.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/components/placements/tpo-bulk-drive-reminder.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/components/placements/tpo-company-feedback-form.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/components/placements/tpo-company-interaction-form.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/components/placements/tpo-drive-cancel-form.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/components/placements/tpo-drive-change-requests.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/components/placements/tpo-drive-clone-action.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/components/placements/tpo-drive-close-preview-form.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/components/placements/tpo-drive-deadline-form.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/components/placements/tpo-drive-edit-form.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/components/placements/tpo-drive-saved-views.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/components/placements/tpo-drive-selection-manager.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/components/placements/tpo-general-requests-panel.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/components/placements/tpo-interview-slot-planner.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/components/placements/tpo-joining-update-form.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/components/placements/tpo-remind-non-applicants.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/components/placements/tpo-report-invalid-filters.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/components/placements/tpo-request-bulk-decision.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/components/placements/tpo-request-decision-control.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/components/placements/tpo-round-apply-control.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/components/placements/tpo-round-calendar-control.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/components/placements/tpo-round-check-in.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/components/placements/tpo-round-reorder.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/components/placements/tpo-round-result-entry-form.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/components/placements/tpo-round-results-import.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/components/placements/tpo-selection-import.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/components/placements/tpo-trust-toggle.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**
- [ ] `src/components/placements/tpo-waitlist-promotion-control.tsx` — shared feedback source migrated and re-fetched; **strict pixel parity OPEN**

**Next exact source:** `src/components/placements/tpo-sequential-request-review.tsx`, then `src/components/placements/tpo-recruiter-grant-controls.tsx`. Continue with remaining `src/components/placements/tpo-*.tsx` bespoke roles, then apply shared F3/F4/F5 components across other portals. Keep full route-state inventory unchanged until full grep and responsive proof. This batch used no app execution, TS build, CI, or tests.


## Chat-5 supplemental 14 components (50 distinct source files) — 2026-10-19

The following 14 sources were converted after the 36-source listing above. `clone-states.md` contains separate value, fetched-content grep and static responsive evidence. **Source migrated ≠ strict F3/F4/F5 tick**; the strict tick stays open because exact legacy geometry/focus color values and full responsive/browser parity are not proven.

- [ ] `src/components/placements/tpo-sequential-request-review.tsx` — source migrated and re-fetched; strict F3/F5 parity and full grep still OPEN
- [ ] `src/components/placements/tpo-public-placement-toggle.tsx` — source migrated and re-fetched; strict F3/F5 parity and full grep still OPEN
- [ ] `src/components/placements/tpo-company-lifecycle-editor.tsx` — source migrated and re-fetched; strict F3/F5 parity and full grep still OPEN
- [ ] `src/components/placements/tpo-round-result-recorder.tsx` — source migrated and re-fetched; strict F3/F5 parity and full grep still OPEN
- [ ] `src/components/placements/tpo-request-page-clipboard.tsx` — source migrated and re-fetched; strict F3/F5 parity and full grep still OPEN
- [ ] `src/components/placements/tpo-recruiter-grant-controls.tsx` — source migrated and re-fetched; strict F3/F5 parity and full grep still OPEN
- [ ] `src/components/placements/tpo-college-rules-control.tsx` — source migrated and re-fetched; strict F3/F5 parity and full grep still OPEN
- [ ] `src/components/placements/tpo-outside-participants-editor.tsx` — source migrated and re-fetched; strict F3/F5 parity and full grep still OPEN
- [ ] `src/components/placements/tpo-company-person-editor.tsx` — source migrated and re-fetched; strict F3/F5 parity and full grep still OPEN
- [ ] `src/components/placements/tpo-season-controls.tsx` — source migrated and re-fetched; strict F3/F5 parity and full grep still OPEN
- [ ] `src/components/placements/tpo-public-placement-content-editor.tsx` — source migrated and re-fetched; strict F3/F5 parity and full grep still OPEN
- [ ] `src/components/placements/tpo-drive-act-on-panel.tsx` — source migrated and re-fetched; strict F3/F5 parity and full grep still OPEN
- [ ] `src/components/placements/tpo-report-presentation.tsx` — source migrated and re-fetched; strict F3/F5 parity and full grep still OPEN
- [ ] `src/components/placements/tpo-report-record-links.tsx` — source migrated and re-fetched; strict F3/F5 parity and full grep still OPEN

**Next exact file:** `src/components/placements/tpo-report-saved-filters.tsx`, then other remaining `src/components/placements/tpo-*.tsx` alerts/empty states and cross-portal route-state inventory. Keep the 1,041-path original route inventory unticked until its actual counts are reverified.


## Chat-5 next continuation source queue — 37 TSX (2026-10-19)

These 37 TSX files were updated, pushed to `chatgpt/chat-5-b`, and re-fetched for bounded source comparison. They are **source-migrated** only, not Strict Tick completions. All category F3/F4/F5 and original 1,041 route-state path checkboxes remain [ ] until all legacy values, repository-wide grep counts, actual phone/tablet comparison and no-regression proof are present. Detailed per-file grep-equivalent counts and literal old SCSS/vNext value tables are in `docs/audit/ux/clone-states.md`.

**3 owned shared component state primitives:** `src/components/ui/alert.tsx`, `banner.tsx`, `inline-notice.tsx` now use semantic warning/info background tokens matching old SCSS colors. Geometry, focus offsets and old responsive breakpoint remain open. Existing public API untouched.

**11 placement components, 23 TPO route files:**
- [ ] `src/components/placements/tpo-report-saved-filters.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN
- [ ] `src/components/placements/tpo-interview-reschedule-form.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN
- [ ] `src/components/placements/tpo-delete-draft-action.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN
- [ ] `src/components/placements/tpo-mark-own-notification-read.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN
- [ ] `src/components/placements/tpo-drive-refresh-control.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN
- [ ] `src/components/placements/tpo-offer-lifecycle-panel.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN
- [ ] `src/components/placements/tpo-week-hour-calendar.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN
- [ ] `src/components/placements/tpo-drive-lifecycle-controls.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN
- [ ] `src/components/placements/tpo-round-drive-day-read-only.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN
- [ ] `src/components/placements/tpo-bulk-round-result-recorder.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN
- [ ] `src/components/placements/tpo-calendar-followup-actions.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN
- [ ] `src/app/(authenticated)/tpo/calendar/error.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN
- [ ] `src/app/(authenticated)/tpo/calendar/export/page.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN
- [ ] `src/app/(authenticated)/tpo/calendar/page.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN
- [ ] `src/app/(authenticated)/tpo/follow-ups/page.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN
- [ ] `src/app/(authenticated)/tpo/drive-day/[roundId]/no-shows/page.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN
- [ ] `src/app/(authenticated)/tpo/drive-day/page.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN
- [ ] `src/app/(authenticated)/tpo/requests/page.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN
- [ ] `src/app/(authenticated)/tpo/companies/page.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN
- [ ] `src/app/(authenticated)/tpo/notifications/page.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN
- [ ] `src/app/(authenticated)/tpo/verification/page.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN
- [ ] `src/app/(authenticated)/tpo/team/page.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN
- [ ] `src/app/(authenticated)/tpo/announcements/page.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN
- [ ] `src/app/(authenticated)/tpo/batches/page.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN
- [ ] `src/app/(authenticated)/tpo/find/page.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN
- [ ] `src/app/(authenticated)/tpo/companies/[companyId]/page.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN
- [ ] `src/app/(authenticated)/tpo/companies/[companyId]/people/page.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN
- [ ] `src/app/(authenticated)/tpo/companies/[companyId]/contact-log/page.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN
- [ ] `src/app/(authenticated)/tpo/companies/[companyId]/feedback/page.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN
- [ ] `src/app/(authenticated)/tpo/students/page.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN
- [ ] `src/app/(authenticated)/tpo/students/[membershipId]/history/page.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN
- [ ] `src/app/(authenticated)/tpo/students/preparation-plan/page.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN
- [ ] `src/app/(authenticated)/tpo/students/requests/page.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN
- [ ] `src/app/(authenticated)/tpo/students/preparation-prep/page.tsx` — state source converted and re-read; exact visual/strict responsive proof still OPEN

**Cross-portal repetitive migration codemod:** `scripts/codemods/chat-5-alerts.cjs` (TypeScript TSX AST safe leaf error notices, both tags replaced, dry-run first), committed but **not executed**. No rows may be checked from codemod output until orchestrator runs it and proves parser/TSX and responsive behavior.

**Known exemptions**: plain `role="status"` live count/selection summaries, itemized results with overflow area, in-label search suggestion, and run-time progress labels are deliberate accessibility text, not bespoke decorative F3/F5 notice boxes.

**Exact next file**: `src/app/(authenticated)/tpo/settings/prep-readiness/page.tsx`; then the other TPO settings/state pages and the remaining global route-state inventory. Do not move to main directly or remove this pending work queue.


## 2026-10-20 continuation — main fast-forward and 41 TSX source passes

At start: origin/main `a7616350ee830c5e187533defabafb477a27172e`; chat-5 branch was zero ahead, 1,114 behind. Non-forcibly fast-forwarded **only** `chatgpt/chat-5-b` to `main`, then pushed only `[chat-5]` commits to the lane branch. Exact source re-read/value tables/scoped grep equivalents and responsive boundaries are in the 2026-10-20 section of `docs/audit/ux/clone-states.md`. **41 distinct TSX source files** (23 TPO pages, 15 TPO controls, 3 shared primitives), both tags of every converted JSX pair checked; page copy, data, filters, retry and permissions preserved. No CI, application code run, lint, typecheck or browser rendering.

**Completed source-migration set (not STRICT TICK):**
- [ ] `src/app/(authenticated)/tpo/settings/after-college/page.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/app/(authenticated)/tpo/settings/blocked-dates/page.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/app/(authenticated)/tpo/settings/branding/page.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/app/(authenticated)/tpo/settings/job-types/page.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/app/(authenticated)/tpo/settings/notices/page.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/app/(authenticated)/tpo/settings/notifications/page.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/app/(authenticated)/tpo/settings/prep-readiness/page.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/app/(authenticated)/tpo/settings/public-page/page.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/app/(authenticated)/tpo/settings/recruiters/page.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/app/(authenticated)/tpo/settings/team/page.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/app/(authenticated)/tpo/settings/trusted/page.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/app/(authenticated)/tpo/reports/[slug]/page.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/app/(authenticated)/tpo/reports/accreditation/page.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/app/(authenticated)/tpo/reports/after-college/page.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/app/(authenticated)/tpo/reports/branch-season/page.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/app/(authenticated)/tpo/reports/by-company/page.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/app/(authenticated)/tpo/reports/intelligence/page.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/app/(authenticated)/tpo/reports/joining-followups/page.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/app/(authenticated)/tpo/reports/leads/page.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/app/(authenticated)/tpo/reports/offers-expiry/page.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/app/(authenticated)/tpo/reports/placement-summary/page.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/app/(authenticated)/tpo/reports/unplaced/page.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/app/(authenticated)/tpo/reports/page.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/components/tpo/tpo-batch-undo-control.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/components/tpo/tpo-builtin-job-types-editor.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/components/tpo/tpo-communication-settings-editors.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/components/tpo/tpo-custom-job-type-placed.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/components/tpo/tpo-custom-job-type-rename.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/components/tpo/tpo-find-shortcut.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/components/tpo/tpo-home-return-refresh.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/components/tpo/tpo-notice-acknowledge.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/components/tpo/tpo-notice-read-progress.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/components/tpo/tpo-notification-refresh.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/components/tpo/tpo-placement-cell-read-action.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/components/tpo/tpo-safe-csv-download.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/components/tpo/tpo-student-clipboard-actions.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/components/tpo/tpo-student-note-editor.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/components/tpo/tpo-trusted-domain-editor.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/components/ui/alert.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/components/ui/banner.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN
- [ ] `src/components/ui/inline-notice.tsx` — migrated/re-read; exact all-states value + repo-wide grep + rendered phone/tablet proof still OPEN

**Scoped re-read source grep equivalents:** 46 shared `<Alert` opens and 46 closes; 19 `<InlineNotice` calls; 17 `<EmptyState` occurrences across 38 page/control files; 13 raw role=status/alert for bounded metadata, listbox and disabled controls (three styled exemptions). No whole-project zero-count claim. Three shared primitives now use `--lms-radius-control:6px` matching legacy `$radius-control:6px`, and InlineNotice's focus dismiss uses a 3px offset matching legacy accessibility. F3/F4/F5 remain unticked until missing proofs are supplied, especially 640–767px/real tablet visual comparison and state timing.

**Exact next file:** `src/components/tpo/tpo-prep-readiness-editor.tsx`. Next after that: `src/components/tpo/tpo-job-types-editor.tsx`, `src/components/tpo/tpo-grid-filter-panel.tsx`, then unconverted role-notice controls across other portals. Keep the north star: *new vNext module inside old LMS*, pixel-level, no page-content edits. Do not push to main.


## Chat-5 2026-10-20 next TPO control batch — 20 TSX

Source files below were migrated, pushed only to `chatgpt/chat-5-b` with `[chat-5]` commits, independently re-fetched, source-grep-counted, paired-tag balanced and compared against old LMS value tokens (all 20 per-file tables in `docs/audit/ux/clone-states.md`). Logic tokens (`apiFetch`, `fetch`, `onClick`, `onChange`, `disabled`, `href`, form action/method) retain the exact baseline occurrence counts. Each of these is a **finished source migration**, **not** a verified F3/F4/F5 pixel clone; keep strict status open until browser responsiveness and complete repo-wide grep are proven.

- [ ] `src/components/tpo/tpo-prep-readiness-editor.tsx` — source migrated / re-fetched; strict tick OPEN: live phone/tablet side-by-side + all legacy hover/active/focus/disabled + repo-wide grep
- [ ] `src/components/tpo/tpo-job-types-editor.tsx` — source migrated / re-fetched; strict tick OPEN: live phone/tablet side-by-side + all legacy hover/active/focus/disabled + repo-wide grep
- [ ] `src/components/tpo/tpo-optional-emails-editor.tsx` — source migrated / re-fetched; strict tick OPEN: live phone/tablet side-by-side + all legacy hover/active/focus/disabled + repo-wide grep
- [ ] `src/components/tpo/tpo-prep-percentage-editor.tsx` — source migrated / re-fetched; strict tick OPEN: live phone/tablet side-by-side + all legacy hover/active/focus/disabled + repo-wide grep
- [ ] `src/components/tpo/tpo-after-college-editor.tsx` — source migrated / re-fetched; strict tick OPEN: live phone/tablet side-by-side + all legacy hover/active/focus/disabled + repo-wide grep
- [ ] `src/components/tpo/tpo-my-notification-preferences-editor.tsx` — source migrated / re-fetched; strict tick OPEN: live phone/tablet side-by-side + all legacy hover/active/focus/disabled + repo-wide grep
- [ ] `src/components/tpo/tpo-blocked-dates-editor.tsx` — source migrated / re-fetched; strict tick OPEN: live phone/tablet side-by-side + all legacy hover/active/focus/disabled + repo-wide grep
- [ ] `src/components/tpo/tpo-grid-filter-panel.tsx` — source migrated / re-fetched; strict tick OPEN: live phone/tablet side-by-side + all legacy hover/active/focus/disabled + repo-wide grep
- [ ] `src/components/tpo/tpo-notice-audience-picker.tsx` — source migrated / re-fetched; strict tick OPEN: live phone/tablet side-by-side + all legacy hover/active/focus/disabled + repo-wide grep
- [ ] `src/components/tpo/tpo-students-assign-prep.tsx` — source migrated / re-fetched; strict tick OPEN: live phone/tablet side-by-side + all legacy hover/active/focus/disabled + repo-wide grep
- [ ] `src/components/tpo/tpo-student-nudge-panel.tsx` — source migrated / re-fetched; strict tick OPEN: live phone/tablet side-by-side + all legacy hover/active/focus/disabled + repo-wide grep
- [ ] `src/components/tpo/tpo-batch-rule-editor.tsx` — source migrated / re-fetched; strict tick OPEN: live phone/tablet side-by-side + all legacy hover/active/focus/disabled + repo-wide grep
- [ ] `src/components/tpo/tpo-batch-decision-control.tsx` — source migrated / re-fetched; strict tick OPEN: live phone/tablet side-by-side + all legacy hover/active/focus/disabled + repo-wide grep
- [ ] `src/components/tpo/tpo-batch-inline-decision.tsx` — source migrated / re-fetched; strict tick OPEN: live phone/tablet side-by-side + all legacy hover/active/focus/disabled + repo-wide grep
- [ ] `src/components/tpo/tpo-batch-lifecycle-control.tsx` — source migrated / re-fetched; strict tick OPEN: live phone/tablet side-by-side + all legacy hover/active/focus/disabled + repo-wide grep
- [ ] `src/components/tpo/tpo-timed-debar-control.tsx` — source migrated / re-fetched; strict tick OPEN: live phone/tablet side-by-side + all legacy hover/active/focus/disabled + repo-wide grep
- [ ] `src/components/tpo/tpo-team-away-form.tsx` — source migrated / re-fetched; strict tick OPEN: live phone/tablet side-by-side + all legacy hover/active/focus/disabled + repo-wide grep
- [ ] `src/components/tpo/tpo-team-follow-controls.tsx` — source migrated / re-fetched; strict tick OPEN: live phone/tablet side-by-side + all legacy hover/active/focus/disabled + repo-wide grep
- [ ] `src/components/tpo/tpo-students-bulk-add.tsx` — source migrated / re-fetched; strict tick OPEN: live phone/tablet side-by-side + all legacy hover/active/focus/disabled + repo-wide grep
- [ ] `src/components/tpo/tpo-students-bulk-debar.tsx` — source migrated / re-fetched; strict tick OPEN: live phone/tablet side-by-side + all legacy hover/active/focus/disabled + repo-wide grep

**Scoped source proof:** 3 Alert opens / 3 closes, 1 Banner open / 1 close, 39 InlineNotice references, 5 EmptyState references, 13 exempt native in-place role=status and **0 raw role=alert** in these 20 sources. Original error/empty text and business conditions retained; no TSX compile, app execution, CI, tests, or runtime viewport snapshots.

**Next exact file** `src/components/tpo/tpo-team-forms.tsx`; next `src/components/tpo/tpo-team-handover.tsx` and `src/components/tpo/tpo-campaign-compose.tsx`.

North star remains: vNext looks like a new module inside the old LMS, pixel-level clone of every tiny detail. Do not equate source updates with strict visual parity.


## Chat-5 2026-10-20 — 15 TPO messaging/team/campaign source files

The following 15 files were migrated on the branch `chatgpt/chat-5-b` (only `[chat-5]` commits), individually re-fetched, with literal value tables for each file, scoped grep counts, responsive source excerpts and static action-guard non-regression proof recorded in `docs/audit/ux/clone-states.md`. A non-forced fast-forward from the synchronized main baseline `75cef123a9bafdf9126daaeb23556f66cb878caa` preceded branch-only edits. **Do not tick strict F3/F4/F5** from source-only results: full repo grep and phone/tablet rendered pixel proof remain unexecuted.

- [ ] `src/components/tpo/tpo-team-forms.tsx` — source migrated, re-fetched, source value/grep/responsive evidence recorded; **STRICT visual tick OPEN**
- [ ] `src/components/tpo/tpo-team-handover.tsx` — source migrated, re-fetched, source value/grep/responsive evidence recorded; **STRICT visual tick OPEN**
- [ ] `src/components/tpo/tpo-team-assign-unowned.tsx` — source migrated, re-fetched, source value/grep/responsive evidence recorded; **STRICT visual tick OPEN**
- [ ] `src/components/tpo/tpo-team-message-actions.tsx` — source migrated, re-fetched, source value/grep/responsive evidence recorded; **STRICT visual tick OPEN**
- [ ] `src/components/tpo/tpo-team-decision-toggle.tsx` — source migrated, re-fetched, source value/grep/responsive evidence recorded; **STRICT visual tick OPEN**
- [ ] `src/components/tpo/tpo-team-rename.tsx` — source migrated, re-fetched, source value/grep/responsive evidence recorded; **STRICT visual tick OPEN**
- [ ] `src/components/tpo/tpo-company-team-composer.tsx` — source migrated, re-fetched, source value/grep/responsive evidence recorded; **STRICT visual tick OPEN**
- [ ] `src/components/tpo/tpo-team-open-read.tsx` — source migrated, re-fetched, source value/grep/responsive evidence recorded; **STRICT visual tick OPEN**
- [ ] `src/components/tpo/tpo-team-ask-panel.tsx` — source migrated, re-fetched, source value/grep/responsive evidence recorded; **STRICT visual tick OPEN**
- [ ] `src/components/tpo/tpo-new-followup-modal.tsx` — source migrated, re-fetched, source value/grep/responsive evidence recorded; **STRICT visual tick OPEN**
- [ ] `src/components/tpo/tpo-new-recruiter-conversation.tsx` — source migrated, re-fetched, source value/grep/responsive evidence recorded; **STRICT visual tick OPEN**
- [ ] `src/components/tpo/tpo-recruiter-message-reply.tsx` — source migrated, re-fetched, source value/grep/responsive evidence recorded; **STRICT visual tick OPEN**
- [ ] `src/components/tpo/tpo-campaign-send-control.tsx` — source migrated, re-fetched, source value/grep/responsive evidence recorded; **STRICT visual tick OPEN**
- [ ] `src/components/tpo/tpo-campaign-compose.tsx` — source migrated, re-fetched, source value/grep/responsive evidence recorded; **STRICT visual tick OPEN**
- [ ] `src/components/tpo/tpo-due-followup-workspace.tsx` — source migrated, re-fetched, source value/grep/responsive evidence recorded; **STRICT visual tick OPEN**

**Scoped source proof:** 9 balanced Alert pairs, 23 InlineNotice occurrences, 3 EmptyState occurrences, **zero** decorated raw alert/status panels; 7 intentionally retained, unstyled live role-status messages. All 15 source file mutation/event/disabled/href probes unchanged from start-of-turn baseline. Fixed invalid block feedback nested inside a span in `tpo-team-decision-toggle.tsx`, and duplicate shared Input/Select/Textarea/Button imports in `tpo-team-forms.tsx`. No code run, no CI/tests/TS typecheck/screenshots.

**Next exact file:** `src/components/tpo/tpo-company-team-conversation.tsx`; then `src/components/tpo/tpo-selected-review-queue.tsx`. Continue lane-only pushing and full legacy value + responsive proof before any strict tick.
