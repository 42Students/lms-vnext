# UI surface registry (generated)

Every thing a user can see or interact with, by id. Source of truth for any future pass (scrolls, motion, copy, accessibility, mobile, theming). Machine copy: `ui-surfaces.json`. Regenerate: `node scripts/audit/build-ui-surface-registry.mjs`.

## Counts

| Kind | Count |
|---|---|
| PAGE | 521 |
| ROUTE-STATE | 1041 |
| OVERLAY | 207 |
| WIDGET | 160 |
| KIT | 36 |
| MESSAGE | 115 |

## Pages per area

| Area | Pages |
|---|---|
| /tpo | 130 |
| /admin | 112 |
| /college | 86 |
| /learn | 44 |
| /teacher | 36 |
| /mentor | 32 |
| /hr | 22 |
| /recruiter | 17 |
| /tracker | 8 |
| /superadmin | 4 |
| /activity | 2 |
| /college-admin | 2 |
| /teach | 2 |
| /campaign-unsubscribe | 2 |
| /account | 1 |
| /dashboard | 1 |
| /notifications | 1 |
| /auth | 1 |
| /college-join | 1 |
| /company-join | 1 |
| /company-share | 1 |
| /e2e | 1 |
| /enterprises | 1 |
| /forbidden | 1 |
| /home | 1 |
| /hr-invite | 1 |
| /login | 1 |
| /(root) | 1 |
| /placements | 1 |
| /platform | 1 |
| /privacy-policy | 1 |
| /quiz | 1 |
| /recruiter-invite | 1 |
| /request-demo | 1 |
| /superadmin-login | 1 |
| /universities | 1 |

## Pages

| Id | Route | Loading | Error | DataTable | Forms | UX test | UX note | File |
|---|---|---|---|---|---|---|---|---|
| PAGE-0001 | /account/security | y | y | - | - | y | y | src/app/(authenticated)/account/security/page.tsx |
| PAGE-0002 | /activity/[eventId] | y | y | - | - | y | y | src/app/(authenticated)/activity/[eventId]/page.tsx |
| PAGE-0003 | /activity | y | y | - | 1 | y | y | src/app/(authenticated)/activity/page.tsx |
| PAGE-0004 | /admin/academics | y | y | - | - | y | y | src/app/(authenticated)/admin/academics/page.tsx |
| PAGE-0005 | /admin/academics/sections/[sectionId] | y | y | - | - | y | y | src/app/(authenticated)/admin/academics/sections/[sectionId]/page.tsx |
| PAGE-0006 | /admin/announcements | y | y | - | 1 | y | y | src/app/(authenticated)/admin/announcements/page.tsx |
| PAGE-0007 | /admin/assignments | y | y | - | - | y | y | src/app/(authenticated)/admin/assignments/page.tsx |
| PAGE-0008 | /admin/attendance | y | y | - | - | y | y | src/app/(authenticated)/admin/attendance/page.tsx |
| PAGE-0009 | /admin/audit | y | y | - | - | y | y | src/app/(authenticated)/admin/audit/page.tsx |
| PAGE-0010 | /admin/batch-promotion | y | y | y | 1 | y | y | src/app/(authenticated)/admin/batch-promotion/page.tsx |
| PAGE-0011 | /admin/batches/[batchId]/students | y | y | y | - | y | y | src/app/(authenticated)/admin/batches/[batchId]/students/page.tsx |
| PAGE-0012 | /admin/batches | y | y | y | 1 | y | y | src/app/(authenticated)/admin/batches/page.tsx |
| PAGE-0013 | /admin/classes | y | y | y | 1 | y | y | src/app/(authenticated)/admin/classes/page.tsx |
| PAGE-0014 | /admin/colleges/[collegeId]/admins/[userId]/history | y | y | y | - | y | y | src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/history/page.tsx |
| PAGE-0015 | /admin/colleges/[collegeId]/admins/[userId] | y | y | y | - | y | y | src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/page.tsx |
| PAGE-0016 | /admin/colleges/[collegeId]/admins | y | y | y | - | y | y | src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx |
| PAGE-0017 | /admin/colleges/[collegeId]/branding | y | y | - | - | y | y | src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx |
| PAGE-0018 | /admin/colleges/[collegeId] | y | y | - | - | y | y | src/app/(authenticated)/admin/colleges/[collegeId]/page.tsx |
| PAGE-0019 | /admin/colleges/[collegeId]/readiness | y | y | - | 1 | y | y | src/app/(authenticated)/admin/colleges/[collegeId]/readiness/page.tsx |
| PAGE-0020 | /admin/colleges/[collegeId]/signin | y | y | - | - | y | y | src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx |
| PAGE-0021 | /admin/colleges/[collegeId]/subdomain | y | y | - | - | y | y | src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx |
| PAGE-0022 | /admin/colleges/[collegeId]/verification | y | y | - | - | y | y | src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx |
| PAGE-0023 | /admin/colleges | y | y | y | 1 | y | y | src/app/(authenticated)/admin/colleges/page.tsx |
| PAGE-0024 | /admin/companies/[companyId]/drives | y | y | y | - | y | y | src/app/(authenticated)/admin/companies/[companyId]/drives/page.tsx |
| PAGE-0025 | /admin/companies | y | y | - | 1 | y | y | src/app/(authenticated)/admin/companies/page.tsx |
| PAGE-0026 | /admin/course-progress | y | y | - | 1 | y | y | src/app/(authenticated)/admin/course-progress/page.tsx |
| PAGE-0027 | /admin/course-progress/students | n | n | - | - | n | y | src/app/(authenticated)/admin/course-progress/students/page.tsx |
| PAGE-0028 | /admin/courses/offerings/[offeringId] | y | y | - | - | y | y | src/app/(authenticated)/admin/courses/offerings/[offeringId]/page.tsx |
| PAGE-0029 | /admin/courses | y | y | - | - | y | y | src/app/(authenticated)/admin/courses/page.tsx |
| PAGE-0030 | /admin/departments | y | y | - | - | y | y | src/app/(authenticated)/admin/departments/page.tsx |
| PAGE-0031 | /admin/domains | y | y | - | - | y | y | src/app/(authenticated)/admin/domains/page.tsx |
| PAGE-0032 | /admin/electives | y | y | - | 2 | y | y | src/app/(authenticated)/admin/electives/page.tsx |
| PAGE-0033 | /admin/faculty-assignment | y | y | - | - | y | y | src/app/(authenticated)/admin/faculty-assignment/page.tsx |
| PAGE-0034 | /admin/faculty | y | y | - | - | y | y | src/app/(authenticated)/admin/faculty/page.tsx |
| PAGE-0035 | /admin/features/[collegeId]/history | y | y | - | - | y | y | src/app/(authenticated)/admin/features/[collegeId]/history/page.tsx |
| PAGE-0036 | /admin/features/[collegeId] | y | y | y | 1 | y | y | src/app/(authenticated)/admin/features/[collegeId]/page.tsx |
| PAGE-0037 | /admin/features/[collegeId]/students/[membershipId]/history | y | y | - | 1 | y | y | src/app/(authenticated)/admin/features/[collegeId]/students/[membershipId]/history/page.tsx |
| PAGE-0038 | /admin/features/[collegeId]/students/[membershipId] | y | y | - | - | y | y | src/app/(authenticated)/admin/features/[collegeId]/students/[membershipId]/page.tsx |
| PAGE-0039 | /admin/features/[collegeId]/trace | y | y | y | 1 | y | y | src/app/(authenticated)/admin/features/[collegeId]/trace/page.tsx |
| PAGE-0040 | /admin/features | y | y | y | 1 | y | y | src/app/(authenticated)/admin/features/page.tsx |
| PAGE-0041 | /admin/hr | y | y | - | - | y | y | src/app/(authenticated)/admin/hr/page.tsx |
| PAGE-0042 | /admin/inbound-mail | y | y | - | 1 | y | y | src/app/(authenticated)/admin/inbound-mail/page.tsx |
| PAGE-0043 | /admin/lecture-halls/[hallId] | y | y | - | 1 | y | y | src/app/(authenticated)/admin/lecture-halls/[hallId]/page.tsx |
| PAGE-0044 | /admin/lecture-halls | y | y | - | 2 | y | y | src/app/(authenticated)/admin/lecture-halls/page.tsx |
| PAGE-0045 | /admin/lessons | y | y | - | 1 | y | y | src/app/(authenticated)/admin/lessons/page.tsx |
| PAGE-0046 | /admin/live-classes | y | y | - | - | y | y | src/app/(authenticated)/admin/live-classes/page.tsx |
| PAGE-0047 | /admin/module-access | y | y | - | 1 | y | y | src/app/(authenticated)/admin/module-access/page.tsx |
| PAGE-0048 | /admin/organizations | y | y | y | 1 | y | y | src/app/(authenticated)/admin/organizations/page.tsx |
| PAGE-0049 | /admin/people/directory/[membershipId]/audit | y | y | - | - | y | y | src/app/(authenticated)/admin/people/directory/[membershipId]/audit/page.tsx |
| PAGE-0050 | /admin/people/directory/[membershipId] | y | y | - | - | y | y | src/app/(authenticated)/admin/people/directory/[membershipId]/page.tsx |
| PAGE-0051 | /admin/people/directory | y | y | - | 1 | y | y | src/app/(authenticated)/admin/people/directory/page.tsx |
| PAGE-0052 | /admin/people | y | y | y | 1 | y | y | src/app/(authenticated)/admin/people/page.tsx |
| PAGE-0053 | /admin/people/unassigned | y | y | - | 1 | y | y | src/app/(authenticated)/admin/people/unassigned/page.tsx |
| PAGE-0054 | /admin/placements/analytics | y | y | y | 1 | y | y | src/app/(authenticated)/admin/placements/analytics/page.tsx |
| PAGE-0055 | /admin/placements/applications/[applicationId] | y | y | - | - | y | y | src/app/(authenticated)/admin/placements/applications/[applicationId]/page.tsx |
| PAGE-0056 | /admin/placements/applications | y | y | - | - | y | y | src/app/(authenticated)/admin/placements/applications/page.tsx |
| PAGE-0057 | /admin/placements/calendar | y | y | - | - | y | y | src/app/(authenticated)/admin/placements/calendar/page.tsx |
| PAGE-0058 | /admin/placements/drives | y | y | y | 1 | y | y | src/app/(authenticated)/admin/placements/drives/page.tsx |
| PAGE-0059 | /admin/placements/hiring | y | y | - | - | y | y | src/app/(authenticated)/admin/placements/hiring/page.tsx |
| PAGE-0060 | /admin/placements/interviews/[roundId] | y | y | - | - | y | y | src/app/(authenticated)/admin/placements/interviews/[roundId]/page.tsx |
| PAGE-0061 | /admin/placements/interviews | y | y | - | - | y | y | src/app/(authenticated)/admin/placements/interviews/page.tsx |
| PAGE-0062 | /admin/placements/job-settings/[jobId] | y | y | - | - | y | y | src/app/(authenticated)/admin/placements/job-settings/[jobId]/page.tsx |
| PAGE-0063 | /admin/placements/job-settings | y | y | - | - | y | y | src/app/(authenticated)/admin/placements/job-settings/page.tsx |
| PAGE-0064 | /admin/placements/jobs/[jobId]/applications | y | y | y | 1 | y | y | src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx |
| PAGE-0065 | /admin/placements/jobs/[jobId] | y | y | - | - | y | y | src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx |
| PAGE-0066 | /admin/placements/jobs/[jobId]/schedule | y | y | y | 1 | y | y | src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx |
| PAGE-0067 | /admin/placements/jobs/[jobId]/settings | y | y | - | - | y | y | src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/page.tsx |
| PAGE-0068 | /admin/placements/joining/[offerId] | y | y | - | - | y | y | src/app/(authenticated)/admin/placements/joining/[offerId]/page.tsx |
| PAGE-0069 | /admin/placements/joining | y | y | - | - | y | y | src/app/(authenticated)/admin/placements/joining/page.tsx |
| PAGE-0070 | /admin/placements/new | y | y | - | - | y | y | src/app/(authenticated)/admin/placements/new/page.tsx |
| PAGE-0071 | /admin/placements/offers/[offerId] | y | y | - | - | y | y | src/app/(authenticated)/admin/placements/offers/[offerId]/page.tsx |
| PAGE-0072 | /admin/placements/offers | y | y | - | - | y | y | src/app/(authenticated)/admin/placements/offers/page.tsx |
| PAGE-0073 | /admin/placements | y | y | - | - | y | y | src/app/(authenticated)/admin/placements/page.tsx |
| PAGE-0074 | /admin/placements/retention | y | y | y | - | y | y | src/app/(authenticated)/admin/placements/retention/page.tsx |
| PAGE-0075 | /admin/placements/screenings/[applicationId] | y | y | - | - | y | y | src/app/(authenticated)/admin/placements/screenings/[applicationId]/page.tsx |
| PAGE-0076 | /admin/placements/screenings | y | y | - | - | y | y | src/app/(authenticated)/admin/placements/screenings/page.tsx |
| PAGE-0077 | /admin/placements/seasons/[seasonId] | y | y | - | - | y | y | src/app/(authenticated)/admin/placements/seasons/[seasonId]/page.tsx |
| PAGE-0078 | /admin/placements/seasons | y | y | - | - | y | y | src/app/(authenticated)/admin/placements/seasons/page.tsx |
| PAGE-0079 | /admin/placements/shortlisted/[applicationId] | y | y | - | - | y | y | src/app/(authenticated)/admin/placements/shortlisted/[applicationId]/page.tsx |
| PAGE-0080 | /admin/placements/shortlisted | y | y | - | - | y | y | src/app/(authenticated)/admin/placements/shortlisted/page.tsx |
| PAGE-0081 | /admin/placements/student-lookup | y | y | y | 1 | y | y | src/app/(authenticated)/admin/placements/student-lookup/page.tsx |
| PAGE-0082 | /admin/programs | y | y | - | - | y | y | src/app/(authenticated)/admin/programs/page.tsx |
| PAGE-0083 | /admin/projects/[projectId]/[section] | y | y | - | - | y | y | src/app/(authenticated)/admin/projects/[projectId]/[section]/page.tsx |
| PAGE-0084 | /admin/projects/[projectId] | y | y | - | - | y | y | src/app/(authenticated)/admin/projects/[projectId]/page.tsx |
| PAGE-0085 | /admin/projects/[projectId]/readiness | y | y | - | - | y | y | src/app/(authenticated)/admin/projects/[projectId]/readiness/page.tsx |
| PAGE-0086 | /admin/projects/at-risk | y | y | - | - | y | y | src/app/(authenticated)/admin/projects/at-risk/page.tsx |
| PAGE-0087 | /admin/projects/audit | y | y | - | - | y | y | src/app/(authenticated)/admin/projects/audit/page.tsx |
| PAGE-0088 | /admin/projects | y | y | - | - | y | y | src/app/(authenticated)/admin/projects/page.tsx |
| PAGE-0089 | /admin/projects/readiness | y | y | - | - | y | y | src/app/(authenticated)/admin/projects/readiness/page.tsx |
| PAGE-0090 | /admin/projects/reassign-mentor | y | y | - | - | y | y | src/app/(authenticated)/admin/projects/reassign-mentor/page.tsx |
| PAGE-0091 | /admin/projects/submissions | y | y | - | - | y | y | src/app/(authenticated)/admin/projects/submissions/page.tsx |
| PAGE-0092 | /admin/projects/templates/[templateId]/colleges | y | y | - | 1 | y | y | src/app/(authenticated)/admin/projects/templates/[templateId]/colleges/page.tsx |
| PAGE-0093 | /admin/projects/templates/[templateId]/overview | y | y | - | - | y | y | src/app/(authenticated)/admin/projects/templates/[templateId]/overview/page.tsx |
| PAGE-0094 | /admin/projects/templates/[templateId] | y | y | - | - | y | y | src/app/(authenticated)/admin/projects/templates/[templateId]/page.tsx |
| PAGE-0095 | /admin/projects/templates/[templateId]/resources | y | y | - | - | y | y | src/app/(authenticated)/admin/projects/templates/[templateId]/resources/page.tsx |
| PAGE-0096 | /admin/projects/templates/[templateId]/sprints | y | y | - | - | y | y | src/app/(authenticated)/admin/projects/templates/[templateId]/sprints/page.tsx |
| PAGE-0097 | /admin/projects/templates/[templateId]/tasks | y | y | - | - | y | y | src/app/(authenticated)/admin/projects/templates/[templateId]/tasks/page.tsx |
| PAGE-0098 | /admin/projects/templates/[templateId]/versions/[versionId] | y | y | - | - | y | y | src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx |
| PAGE-0099 | /admin/projects/templates/[templateId]/versions | y | y | - | - | y | y | src/app/(authenticated)/admin/projects/templates/[templateId]/versions/page.tsx |
| PAGE-0100 | /admin/projects/templates/new | y | y | - | - | y | y | src/app/(authenticated)/admin/projects/templates/new/page.tsx |
| PAGE-0101 | /admin/projects/templates | y | y | - | 1 | y | y | src/app/(authenticated)/admin/projects/templates/page.tsx |
| PAGE-0102 | /admin/projects/workspaces/new | y | y | - | - | y | y | src/app/(authenticated)/admin/projects/workspaces/new/page.tsx |
| PAGE-0103 | /admin/quizzes | y | y | - | - | y | y | src/app/(authenticated)/admin/quizzes/page.tsx |
| PAGE-0104 | /admin/recruiters | y | y | - | - | y | y | src/app/(authenticated)/admin/recruiters/page.tsx |
| PAGE-0105 | /admin/resources | y | y | - | - | y | y | src/app/(authenticated)/admin/resources/page.tsx |
| PAGE-0106 | /admin/semester-courses | y | y | - | - | y | y | src/app/(authenticated)/admin/semester-courses/page.tsx |
| PAGE-0107 | /admin/semesters | y | y | y | 2 | y | y | src/app/(authenticated)/admin/semesters/page.tsx |
| PAGE-0108 | /admin/settings/auth | y | y | - | - | y | y | src/app/(authenticated)/admin/settings/auth/page.tsx |
| PAGE-0109 | /admin/settings | y | y | - | 1 | y | y | src/app/(authenticated)/admin/settings/page.tsx |
| PAGE-0110 | /admin/students | y | y | - | - | y | y | src/app/(authenticated)/admin/students/page.tsx |
| PAGE-0111 | /admin/tenants/create | y | y | - | - | y | y | src/app/(authenticated)/admin/tenants/create/page.tsx |
| PAGE-0112 | /admin/tenants | y | y | - | 1 | y | y | src/app/(authenticated)/admin/tenants/page.tsx |
| PAGE-0113 | /admin/tenants/setup | y | y | - | - | y | y | src/app/(authenticated)/admin/tenants/setup/page.tsx |
| PAGE-0114 | /admin/verification | y | y | - | - | y | y | src/app/(authenticated)/admin/verification/page.tsx |
| PAGE-0115 | /admin/videos | y | y | - | - | y | y | src/app/(authenticated)/admin/videos/page.tsx |
| PAGE-0116 | /college-admin/departments | y | y | - | - | n | y | src/app/(authenticated)/college-admin/departments/page.tsx |
| PAGE-0117 | /college-admin/programs | y | y | - | - | n | y | src/app/(authenticated)/college-admin/programs/page.tsx |
| PAGE-0118 | /college/academics | y | y | - | - | y | y | src/app/(authenticated)/college/academics/page.tsx |
| PAGE-0119 | /college/academics/sections/[sectionId] | y | y | - | - | y | y | src/app/(authenticated)/college/academics/sections/[sectionId]/page.tsx |
| PAGE-0120 | /college/activity/[eventId] | y | y | - | - | y | y | src/app/(authenticated)/college/activity/[eventId]/page.tsx |
| PAGE-0121 | /college/activity | y | y | - | 1 | y | y | src/app/(authenticated)/college/activity/page.tsx |
| PAGE-0122 | /college/announcements | y | y | - | - | y | y | src/app/(authenticated)/college/announcements/page.tsx |
| PAGE-0123 | /college/assignments | y | y | - | - | y | y | src/app/(authenticated)/college/assignments/page.tsx |
| PAGE-0124 | /college/attendance/corrections | y | y | - | 1 | y | y | src/app/(authenticated)/college/attendance/corrections/page.tsx |
| PAGE-0125 | /college/attendance/departments | y | y | - | - | y | y | src/app/(authenticated)/college/attendance/departments/page.tsx |
| PAGE-0126 | /college/attendance | y | y | - | - | y | y | src/app/(authenticated)/college/attendance/page.tsx |
| PAGE-0127 | /college/attendance/settings | y | y | - | - | y | y | src/app/(authenticated)/college/attendance/settings/page.tsx |
| PAGE-0128 | /college/batch-promotion | y | y | - | 1 | y | y | src/app/(authenticated)/college/batch-promotion/page.tsx |
| PAGE-0129 | /college/batches/[cohortId]/students | y | y | - | 1 | y | y | src/app/(authenticated)/college/batches/[cohortId]/students/page.tsx |
| PAGE-0130 | /college/batches | y | y | - | - | y | y | src/app/(authenticated)/college/batches/page.tsx |
| PAGE-0131 | /college/branding | y | y | - | - | y | y | src/app/(authenticated)/college/branding/page.tsx |
| PAGE-0132 | /college/classes | y | y | - | - | y | y | src/app/(authenticated)/college/classes/page.tsx |
| PAGE-0133 | /college/classes/recurring-preview | y | y | - | - | y | y | src/app/(authenticated)/college/classes/recurring-preview/page.tsx |
| PAGE-0134 | /college/college-profile | y | y | - | - | y | y | src/app/(authenticated)/college/college-profile/page.tsx |
| PAGE-0135 | /college/companies | y | y | - | 1 | y | y | src/app/(authenticated)/college/companies/page.tsx |
| PAGE-0136 | /college/contacts/[membershipId] | y | y | - | - | y | y | src/app/(authenticated)/college/contacts/[membershipId]/page.tsx |
| PAGE-0137 | /college/contacts | y | y | y | 1 | y | y | src/app/(authenticated)/college/contacts/page.tsx |
| PAGE-0138 | /college/course-progress | y | y | - | - | y | y | src/app/(authenticated)/college/course-progress/page.tsx |
| PAGE-0139 | /college/courses/offerings/[offeringId] | y | y | - | - | y | y | src/app/(authenticated)/college/courses/offerings/[offeringId]/page.tsx |
| PAGE-0140 | /college/courses | y | y | - | - | y | y | src/app/(authenticated)/college/courses/page.tsx |
| PAGE-0141 | /college/departments | y | y | - | - | y | y | src/app/(authenticated)/college/departments/page.tsx |
| PAGE-0142 | /college/domains | y | y | - | - | y | y | src/app/(authenticated)/college/domains/page.tsx |
| PAGE-0143 | /college/electives/[slotId]/allocate | y | y | - | 2 | y | y | src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx |
| PAGE-0144 | /college/electives/[slotId]/offerings/[offeringId]/roster | y | y | - | 4 | y | y | src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx |
| PAGE-0145 | /college/electives | y | y | - | - | y | y | src/app/(authenticated)/college/electives/page.tsx |
| PAGE-0146 | /college/faculty-assignment | y | y | - | 1 | y | y | src/app/(authenticated)/college/faculty-assignment/page.tsx |
| PAGE-0147 | /college/faculty/[membershipId] | y | y | - | 1 | y | y | src/app/(authenticated)/college/faculty/[membershipId]/page.tsx |
| PAGE-0148 | /college/faculty/import | y | y | - | - | y | y | src/app/(authenticated)/college/faculty/import/page.tsx |
| PAGE-0149 | /college/faculty | y | y | - | - | y | y | src/app/(authenticated)/college/faculty/page.tsx |
| PAGE-0150 | /college/groups/[groupId]/import-preview | y | y | - | - | y | y | src/app/(authenticated)/college/groups/[groupId]/import-preview/page.tsx |
| PAGE-0151 | /college/groups/[groupId] | y | y | y | - | y | y | src/app/(authenticated)/college/groups/[groupId]/page.tsx |
| PAGE-0152 | /college/groups/[groupId]/rule-preview | y | y | - | - | y | y | src/app/(authenticated)/college/groups/[groupId]/rule-preview/page.tsx |
| PAGE-0153 | /college/groups | y | y | y | 1 | y | y | src/app/(authenticated)/college/groups/page.tsx |
| PAGE-0154 | /college/hiring-dashboard | y | y | - | - | y | y | src/app/(authenticated)/college/hiring-dashboard/page.tsx |
| PAGE-0155 | /college/lecture-halls/[hallId] | y | y | - | 1 | y | y | src/app/(authenticated)/college/lecture-halls/[hallId]/page.tsx |
| PAGE-0156 | /college/lecture-halls | y | y | - | 1 | y | y | src/app/(authenticated)/college/lecture-halls/page.tsx |
| PAGE-0157 | /college/lessons | y | y | - | - | y | y | src/app/(authenticated)/college/lessons/page.tsx |
| PAGE-0158 | /college/live-classes | y | y | - | - | y | y | src/app/(authenticated)/college/live-classes/page.tsx |
| PAGE-0159 | /college | y | y | - | - | y | y | src/app/(authenticated)/college/page.tsx |
| PAGE-0160 | /college/people/manage | y | y | y | 1 | y | y | src/app/(authenticated)/college/people/manage/page.tsx |
| PAGE-0161 | /college/people | y | y | - | - | y | y | src/app/(authenticated)/college/people/page.tsx |
| PAGE-0162 | /college/placements/calendar | y | y | - | - | y | y | src/app/(authenticated)/college/placements/calendar/page.tsx |
| PAGE-0163 | /college/placements/drives | y | y | y | 1 | y | y | src/app/(authenticated)/college/placements/drives/page.tsx |
| PAGE-0164 | /college/placements/interviews | y | y | y | 1 | y | y | src/app/(authenticated)/college/placements/interviews/page.tsx |
| PAGE-0165 | /college/placements/jobs/[jobId]/applications | y | y | y | 1 | y | y | src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx |
| PAGE-0166 | /college/placements/jobs/[jobId]/interviews | y | y | y | 1 | y | y | src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx |
| PAGE-0167 | /college/placements/jobs/[jobId]/overview | y | y | - | - | y | y | src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx |
| PAGE-0168 | /college/placements/jobs/[jobId] | y | y | - | - | y | y | src/app/(authenticated)/college/placements/jobs/[jobId]/page.tsx |
| PAGE-0169 | /college/placements/jobs/[jobId]/settings | y | y | - | - | y | y | src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx |
| PAGE-0170 | /college/placements/jobs/[jobId]/shortlisted | y | y | y | 1 | y | y | src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx |
| PAGE-0171 | /college/placements/new | y | y | - | - | y | y | src/app/(authenticated)/college/placements/new/page.tsx |
| PAGE-0172 | /college/placements | y | y | - | - | y | y | src/app/(authenticated)/college/placements/page.tsx |
| PAGE-0173 | /college/placements/readiness-by-department | y | y | - | - | y | y | src/app/(authenticated)/college/placements/readiness-by-department/page.tsx |
| PAGE-0174 | /college/placements/retention | y | y | y | - | y | y | src/app/(authenticated)/college/placements/retention/page.tsx |
| PAGE-0175 | /college/placements/student-lookup | y | y | y | 1 | y | y | src/app/(authenticated)/college/placements/student-lookup/page.tsx |
| PAGE-0176 | /college/profile | y | y | - | - | y | y | src/app/(authenticated)/college/profile/page.tsx |
| PAGE-0177 | /college/programs | y | y | - | - | y | y | src/app/(authenticated)/college/programs/page.tsx |
| PAGE-0178 | /college/projects/[projectId]/[section] | y | y | - | - | y | y | src/app/(authenticated)/college/projects/[projectId]/[section]/page.tsx |
| PAGE-0179 | /college/projects/[projectId] | y | y | - | - | y | y | src/app/(authenticated)/college/projects/[projectId]/page.tsx |
| PAGE-0180 | /college/projects/[projectId]/readiness | y | y | - | - | y | y | src/app/(authenticated)/college/projects/[projectId]/readiness/page.tsx |
| PAGE-0181 | /college/projects/at-risk | y | y | - | - | y | y | src/app/(authenticated)/college/projects/at-risk/page.tsx |
| PAGE-0182 | /college/projects/audit | y | y | - | - | y | y | src/app/(authenticated)/college/projects/audit/page.tsx |
| PAGE-0183 | /college/projects/create | n | n | - | - | n | y | src/app/(authenticated)/college/projects/create/page.tsx |
| PAGE-0184 | /college/projects | y | y | - | - | y | y | src/app/(authenticated)/college/projects/page.tsx |
| PAGE-0185 | /college/projects/readiness | y | y | - | - | y | y | src/app/(authenticated)/college/projects/readiness/page.tsx |
| PAGE-0186 | /college/projects/reassign-mentor | y | y | - | - | y | y | src/app/(authenticated)/college/projects/reassign-mentor/page.tsx |
| PAGE-0187 | /college/projects/submissions | y | y | - | - | y | y | src/app/(authenticated)/college/projects/submissions/page.tsx |
| PAGE-0188 | /college/projects/templates/[templateId] | y | y | - | - | y | y | src/app/(authenticated)/college/projects/templates/[templateId]/page.tsx |
| PAGE-0189 | /college/projects/templates | y | y | y | 1 | y | y | src/app/(authenticated)/college/projects/templates/page.tsx |
| PAGE-0190 | /college/projects/workspaces/[workspaceId]/[section] | y | y | - | - | y | y | src/app/(authenticated)/college/projects/workspaces/[workspaceId]/[section]/page.tsx |
| PAGE-0191 | /college/projects/workspaces/[workspaceId] | y | y | - | - | y | y | src/app/(authenticated)/college/projects/workspaces/[workspaceId]/page.tsx |
| PAGE-0192 | /college/projects/workspaces/new | y | y | - | - | y | y | src/app/(authenticated)/college/projects/workspaces/new/page.tsx |
| PAGE-0193 | /college/projects/workspaces | y | y | - | - | y | y | src/app/(authenticated)/college/projects/workspaces/page.tsx |
| PAGE-0194 | /college/quizzes | y | y | - | - | y | y | src/app/(authenticated)/college/quizzes/page.tsx |
| PAGE-0195 | /college/resources | y | y | - | - | y | y | src/app/(authenticated)/college/resources/page.tsx |
| PAGE-0196 | /college/semester-courses | y | y | - | - | y | y | src/app/(authenticated)/college/semester-courses/page.tsx |
| PAGE-0197 | /college/semesters | y | y | - | - | y | y | src/app/(authenticated)/college/semesters/page.tsx |
| PAGE-0198 | /college/students/[membershipId] | y | y | - | 1 | y | y | src/app/(authenticated)/college/students/[membershipId]/page.tsx |
| PAGE-0199 | /college/students/import | y | y | - | - | y | y | src/app/(authenticated)/college/students/import/page.tsx |
| PAGE-0200 | /college/students | y | y | - | - | y | y | src/app/(authenticated)/college/students/page.tsx |
| PAGE-0201 | /college/students/register | y | y | - | - | y | y | src/app/(authenticated)/college/students/register/page.tsx |
| PAGE-0202 | /college/verification | y | y | - | - | y | y | src/app/(authenticated)/college/verification/page.tsx |
| PAGE-0203 | /college/videos | y | y | - | - | y | y | src/app/(authenticated)/college/videos/page.tsx |
| PAGE-0204 | /dashboard | y | y | - | - | y | y | src/app/(authenticated)/dashboard/page.tsx |
| PAGE-0205 | /hr/activity | y | y | - | 1 | y | y | src/app/(authenticated)/hr/activity/page.tsx |
| PAGE-0206 | /hr/calendar | y | y | - | 1 | y | y | src/app/(authenticated)/hr/calendar/page.tsx |
| PAGE-0207 | /hr/colleges | y | y | - | - | y | y | src/app/(authenticated)/hr/colleges/page.tsx |
| PAGE-0208 | /hr/company | y | y | - | 1 | y | y | src/app/(authenticated)/hr/company/page.tsx |
| PAGE-0209 | /hr/company/reports | y | y | - | 1 | y | y | src/app/(authenticated)/hr/company/reports/page.tsx |
| PAGE-0210 | /hr/conversations/[threadId] | y | y | - | - | y | y | src/app/(authenticated)/hr/conversations/[threadId]/page.tsx |
| PAGE-0211 | /hr/conversations | y | y | - | 3 | y | y | src/app/(authenticated)/hr/conversations/page.tsx |
| PAGE-0212 | /hr/drives/[jobId]/interview-slots | y | y | - | - | y | y | src/app/(authenticated)/hr/drives/[jobId]/interview-slots/page.tsx |
| PAGE-0213 | /hr/drives/[jobId]/messages | y | y | - | 1 | y | y | src/app/(authenticated)/hr/drives/[jobId]/messages/page.tsx |
| PAGE-0214 | /hr/drives/[jobId]/rounds/editor | y | y | - | 2 | y | y | src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/page.tsx |
| PAGE-0215 | /hr/drives/[jobId]/rounds/editor/remove/[roundId] | y | y | - | 1 | y | y | src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/remove/[roundId]/page.tsx |
| PAGE-0216 | /hr/drives/new | y | y | - | - | y | y | src/app/(authenticated)/hr/drives/new/page.tsx |
| PAGE-0217 | /hr/drives | y | y | - | 1 | y | y | src/app/(authenticated)/hr/drives/page.tsx |
| PAGE-0218 | /hr/drives/proposals | y | y | - | 1 | y | y | src/app/(authenticated)/hr/drives/proposals/page.tsx |
| PAGE-0219 | /hr/drives/recorded-outside | y | y | - | - | y | y | src/app/(authenticated)/hr/drives/recorded-outside/page.tsx |
| PAGE-0220 | /hr/home | y | y | - | - | y | y | src/app/(authenticated)/hr/home/page.tsx |
| PAGE-0221 | /hr/messages | y | y | - | - | y | y | src/app/(authenticated)/hr/messages/page.tsx |
| PAGE-0222 | /hr/notifications | y | y | - | 1 | y | y | src/app/(authenticated)/hr/notifications/page.tsx |
| PAGE-0223 | /hr/placements/jobs/[jobId] | y | y | - | 1 | y | y | src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx |
| PAGE-0224 | /hr/placements | y | y | - | - | y | y | src/app/(authenticated)/hr/placements/page.tsx |
| PAGE-0225 | /hr/profile | y | y | - | - | y | y | src/app/(authenticated)/hr/profile/page.tsx |
| PAGE-0226 | /hr/round-results | y | y | - | - | y | y | src/app/(authenticated)/hr/round-results/page.tsx |
| PAGE-0227 | /learn/allAssignments/[assignmentId] | y | y | - | - | y | y | src/app/(authenticated)/learn/allAssignments/[assignmentId]/page.tsx |
| PAGE-0228 | /learn/allAssignments | y | y | - | - | y | y | src/app/(authenticated)/learn/allAssignments/page.tsx |
| PAGE-0229 | /learn/allQuizzes/[quizId] | y | y | - | - | y | y | src/app/(authenticated)/learn/allQuizzes/[quizId]/page.tsx |
| PAGE-0230 | /learn/allQuizzes | y | y | - | - | y | y | src/app/(authenticated)/learn/allQuizzes/page.tsx |
| PAGE-0231 | /learn/assignments | y | y | - | - | y | y | src/app/(authenticated)/learn/assignments/page.tsx |
| PAGE-0232 | /learn/attendance/calendar | y | y | - | 1 | y | y | src/app/(authenticated)/learn/attendance/calendar/page.tsx |
| PAGE-0233 | /learn/attendance | y | y | - | - | y | y | src/app/(authenticated)/learn/attendance/page.tsx |
| PAGE-0234 | /learn/calendar | y | y | - | - | y | y | src/app/(authenticated)/learn/calendar/page.tsx |
| PAGE-0235 | /learn/courses/[deliveryId]/[...courseTab] | y | y | - | - | y | y | src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx |
| PAGE-0236 | /learn/courses/[deliveryId]/attendance-summary | y | y | - | - | y | y | src/app/(authenticated)/learn/courses/[deliveryId]/attendance-summary/page.tsx |
| PAGE-0237 | /learn/courses/[deliveryId] | y | y | - | - | y | y | src/app/(authenticated)/learn/courses/[deliveryId]/page.tsx |
| PAGE-0238 | /learn/courses/[deliveryId]/progress | y | y | - | - | y | y | src/app/(authenticated)/learn/courses/[deliveryId]/progress/page.tsx |
| PAGE-0239 | /learn/courses | y | y | - | - | y | y | src/app/(authenticated)/learn/courses/page.tsx |
| PAGE-0240 | /learn/my-placements/announcements | y | y | - | 3 | y | y | src/app/(authenticated)/learn/my-placements/announcements/page.tsx |
| PAGE-0241 | /learn/my-placements/applications/[applicationId]/company | y | y | - | - | y | y | src/app/(authenticated)/learn/my-placements/applications/[applicationId]/company/page.tsx |
| PAGE-0242 | /learn/my-placements/applications/[applicationId]/history | y | y | - | - | y | y | src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/page.tsx |
| PAGE-0243 | /learn/my-placements/applications/[applicationId] | y | y | - | - | y | y | src/app/(authenticated)/learn/my-placements/applications/[applicationId]/page.tsx |
| PAGE-0244 | /learn/my-placements/applications | y | y | - | - | y | y | src/app/(authenticated)/learn/my-placements/applications/page.tsx |
| PAGE-0245 | /learn/my-placements/assessments | y | y | - | - | y | y | src/app/(authenticated)/learn/my-placements/assessments/page.tsx |
| PAGE-0246 | /learn/my-placements/assessments/results | y | y | - | 1 | y | y | src/app/(authenticated)/learn/my-placements/assessments/results/page.tsx |
| PAGE-0247 | /learn/my-placements/calendar | y | y | - | - | y | y | src/app/(authenticated)/learn/my-placements/calendar/page.tsx |
| PAGE-0248 | /learn/my-placements/interviews | y | y | - | - | y | y | src/app/(authenticated)/learn/my-placements/interviews/page.tsx |
| PAGE-0249 | /learn/my-placements/jobs/[jobId] | y | y | - | - | y | y | src/app/(authenticated)/learn/my-placements/jobs/[jobId]/page.tsx |
| PAGE-0250 | /learn/my-placements/jobs | y | y | - | - | y | y | src/app/(authenticated)/learn/my-placements/jobs/page.tsx |
| PAGE-0251 | /learn/my-placements/notification-preferences | y | y | - | - | y | y | src/app/(authenticated)/learn/my-placements/notification-preferences/page.tsx |
| PAGE-0252 | /learn/my-placements/offers | y | y | - | 2 | y | y | src/app/(authenticated)/learn/my-placements/offers/page.tsx |
| PAGE-0253 | /learn/my-placements | y | y | - | - | y | y | src/app/(authenticated)/learn/my-placements/page.tsx |
| PAGE-0254 | /learn/my-placements/placement | y | y | - | - | y | y | src/app/(authenticated)/learn/my-placements/placement/page.tsx |
| PAGE-0255 | /learn/my-placements/preparation | y | y | - | - | y | y | src/app/(authenticated)/learn/my-placements/preparation/page.tsx |
| PAGE-0256 | /learn/my-placements/rules | y | y | - | - | y | y | src/app/(authenticated)/learn/my-placements/rules/page.tsx |
| PAGE-0257 | /learn/my-placements/schedule | y | y | - | - | y | y | src/app/(authenticated)/learn/my-placements/schedule/page.tsx |
| PAGE-0258 | /learn/my-placements/support | y | y | - | - | y | y | src/app/(authenticated)/learn/my-placements/support/page.tsx |
| PAGE-0259 | /learn/notifications/history | y | y | - | - | y | y | src/app/(authenticated)/learn/notifications/history/page.tsx |
| PAGE-0260 | /learn/notifications | y | y | - | - | y | y | src/app/(authenticated)/learn/notifications/page.tsx |
| PAGE-0261 | /learn | y | y | - | - | y | y | src/app/(authenticated)/learn/page.tsx |
| PAGE-0262 | /learn/placements | y | y | - | - | y | y | src/app/(authenticated)/learn/placements/page.tsx |
| PAGE-0263 | /learn/profile/academic-record | y | y | - | - | y | y | src/app/(authenticated)/learn/profile/academic-record/page.tsx |
| PAGE-0264 | /learn/profile/completeness | y | y | - | - | y | y | src/app/(authenticated)/learn/profile/completeness/page.tsx |
| PAGE-0265 | /learn/profile/data-access | n | n | - | - | n | y | src/app/(authenticated)/learn/profile/data-access/page.tsx |
| PAGE-0266 | /learn/profile | y | y | - | - | y | y | src/app/(authenticated)/learn/profile/page.tsx |
| PAGE-0267 | /learn/profile/verification | y | y | - | - | y | y | src/app/(authenticated)/learn/profile/verification/page.tsx |
| PAGE-0268 | /learn/projects/[projectId] | y | y | - | - | y | y | src/app/(authenticated)/learn/projects/[projectId]/page.tsx |
| PAGE-0269 | /learn/projects | y | y | - | - | y | y | src/app/(authenticated)/learn/projects/page.tsx |
| PAGE-0270 | /learn/quizzes | y | y | - | - | y | y | src/app/(authenticated)/learn/quizzes/page.tsx |
| PAGE-0271 | /mentor/activity | y | y | - | 1 | y | y | src/app/(authenticated)/mentor/activity/page.tsx |
| PAGE-0272 | /mentor/allQuizzes | n | n | - | - | n | y | src/app/(authenticated)/mentor/allQuizzes/page.tsx |
| PAGE-0273 | /mentor/calendar | y | y | - | 1 | y | y | src/app/(authenticated)/mentor/calendar/page.tsx |
| PAGE-0274 | /mentor/contacts/[[...contactsTab]] | n | n | - | - | n | y | src/app/(authenticated)/mentor/contacts/[[...contactsTab]]/page.tsx |
| PAGE-0275 | /mentor/courses/[courseId]/[[...courseTab]] | n | n | - | - | n | y | src/app/(authenticated)/mentor/courses/[courseId]/[[...courseTab]]/page.tsx |
| PAGE-0276 | /mentor/courses | n | n | - | - | n | y | src/app/(authenticated)/mentor/courses/page.tsx |
| PAGE-0277 | /mentor/fileExplorer | n | n | - | - | n | y | src/app/(authenticated)/mentor/fileExplorer/page.tsx |
| PAGE-0278 | /mentor/notifications | y | y | - | 1 | y | y | src/app/(authenticated)/mentor/notifications/page.tsx |
| PAGE-0279 | /mentor | y | y | - | - | y | y | src/app/(authenticated)/mentor/page.tsx |
| PAGE-0280 | /mentor/profile | n | n | - | - | n | y | src/app/(authenticated)/mentor/profile/page.tsx |
| PAGE-0281 | /mentor/projects/[projectId]/activity-history | y | y | - | 1 | y | y | src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx |
| PAGE-0282 | /mentor/projects/[projectId]/board-review | y | y | - | 1 | y | y | src/app/(authenticated)/mentor/projects/[projectId]/board-review/page.tsx |
| PAGE-0283 | /mentor/projects/[projectId]/closeout | y | y | - | - | y | y | src/app/(authenticated)/mentor/projects/[projectId]/closeout/page.tsx |
| PAGE-0284 | /mentor/projects/[projectId]/deliveries/[submissionId]/review | y | y | - | - | y | y | src/app/(authenticated)/mentor/projects/[projectId]/deliveries/[submissionId]/review/page.tsx |
| PAGE-0285 | /mentor/projects/[projectId]/meetings/[meetingId]/notes | y | y | - | - | y | y | src/app/(authenticated)/mentor/projects/[projectId]/meetings/[meetingId]/notes/page.tsx |
| PAGE-0286 | /mentor/projects/[projectId] | y | y | - | - | y | y | src/app/(authenticated)/mentor/projects/[projectId]/page.tsx |
| PAGE-0287 | /mentor/projects/[projectId]/resources-directory | y | y | - | 1 | y | y | src/app/(authenticated)/mentor/projects/[projectId]/resources-directory/page.tsx |
| PAGE-0288 | /mentor/projects/[projectId]/review-completeness | y | y | - | - | y | y | src/app/(authenticated)/mentor/projects/[projectId]/review-completeness/page.tsx |
| PAGE-0289 | /mentor/projects/[projectId]/review-overview | y | y | - | 1 | y | y | src/app/(authenticated)/mentor/projects/[projectId]/review-overview/page.tsx |
| PAGE-0290 | /mentor/projects/[projectId]/risk-readiness | y | y | - | 1 | y | y | src/app/(authenticated)/mentor/projects/[projectId]/risk-readiness/page.tsx |
| PAGE-0291 | /mentor/projects/[projectId]/tasks/[taskId]/feedback | y | y | - | - | y | y | src/app/(authenticated)/mentor/projects/[projectId]/tasks/[taskId]/feedback/page.tsx |
| PAGE-0292 | /mentor/projects/[projectId]/team-history | y | y | - | 1 | y | y | src/app/(authenticated)/mentor/projects/[projectId]/team-history/page.tsx |
| PAGE-0293 | /mentor/projects/[projectId]/team-meetings | y | y | - | 1 | y | y | src/app/(authenticated)/mentor/projects/[projectId]/team-meetings/page.tsx |
| PAGE-0294 | /mentor/projects/[projectId]/timeline | y | y | - | - | y | y | src/app/(authenticated)/mentor/projects/[projectId]/timeline/page.tsx |
| PAGE-0295 | /mentor/projects | y | y | - | - | y | y | src/app/(authenticated)/mentor/projects/page.tsx |
| PAGE-0296 | /mentor/reports | y | y | - | 1 | y | y | src/app/(authenticated)/mentor/reports/page.tsx |
| PAGE-0297 | /mentor/review-history | y | y | - | 1 | y | y | src/app/(authenticated)/mentor/review-history/page.tsx |
| PAGE-0298 | /mentor/reviews | y | y | - | 1 | y | y | src/app/(authenticated)/mentor/reviews/page.tsx |
| PAGE-0299 | /mentor/sprint-progress | y | y | - | 1 | y | y | src/app/(authenticated)/mentor/sprint-progress/page.tsx |
| PAGE-0300 | /mentor/task-review-history | y | y | - | 1 | y | y | src/app/(authenticated)/mentor/task-review-history/page.tsx |
| PAGE-0301 | /mentor/task-reviews | y | y | - | 1 | y | y | src/app/(authenticated)/mentor/task-reviews/page.tsx |
| PAGE-0302 | /mentor/team-coverage | y | y | - | 1 | y | y | src/app/(authenticated)/mentor/team-coverage/page.tsx |
| PAGE-0303 | /notifications | y | y | - | - | y | y | src/app/(authenticated)/notifications/page.tsx |
| PAGE-0304 | /recruiter/calendar | y | y | - | - | y | y | src/app/(authenticated)/recruiter/calendar/page.tsx |
| PAGE-0305 | /recruiter/colleges | y | y | - | - | y | y | src/app/(authenticated)/recruiter/colleges/page.tsx |
| PAGE-0306 | /recruiter/company | y | y | - | - | y | y | src/app/(authenticated)/recruiter/company/page.tsx |
| PAGE-0307 | /recruiter/drives/[jobId]/change-requests | y | y | - | - | y | y | src/app/(authenticated)/recruiter/drives/[jobId]/change-requests/page.tsx |
| PAGE-0308 | /recruiter/drives/[jobId]/interview-slots | y | y | - | - | y | y | src/app/(authenticated)/recruiter/drives/[jobId]/interview-slots/page.tsx |
| PAGE-0309 | /recruiter/drives/[jobId]/messages | y | y | - | - | y | y | src/app/(authenticated)/recruiter/drives/[jobId]/messages/page.tsx |
| PAGE-0310 | /recruiter/drives/[jobId] | y | y | - | - | y | y | src/app/(authenticated)/recruiter/drives/[jobId]/page.tsx |
| PAGE-0311 | /recruiter/drives/[jobId]/rounds/editor | y | y | - | - | y | y | src/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/page.tsx |
| PAGE-0312 | /recruiter/drives/[jobId]/rounds/editor/remove/[roundId] | y | y | - | - | y | y | src/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/remove/[roundId]/page.tsx |
| PAGE-0313 | /recruiter/drives/new | y | y | - | - | y | y | src/app/(authenticated)/recruiter/drives/new/page.tsx |
| PAGE-0314 | /recruiter/drives | y | y | - | - | y | y | src/app/(authenticated)/recruiter/drives/page.tsx |
| PAGE-0315 | /recruiter/drives/proposals | y | y | - | - | y | y | src/app/(authenticated)/recruiter/drives/proposals/page.tsx |
| PAGE-0316 | /recruiter/drives/recorded-outside | y | y | - | - | y | y | src/app/(authenticated)/recruiter/drives/recorded-outside/page.tsx |
| PAGE-0317 | /recruiter/home | y | y | - | - | y | y | src/app/(authenticated)/recruiter/home/page.tsx |
| PAGE-0318 | /recruiter/messages | y | y | - | - | y | y | src/app/(authenticated)/recruiter/messages/page.tsx |
| PAGE-0319 | /recruiter | y | y | - | - | y | y | src/app/(authenticated)/recruiter/page.tsx |
| PAGE-0320 | /recruiter/profile | y | y | - | - | y | y | src/app/(authenticated)/recruiter/profile/page.tsx |
| PAGE-0321 | /superadmin/[...legacy] | y | y | - | - | y | y | src/app/(authenticated)/superadmin/[...legacy]/page.tsx |
| PAGE-0322 | /superadmin/departments | y | y | - | - | y | y | src/app/(authenticated)/superadmin/departments/page.tsx |
| PAGE-0323 | /superadmin | y | y | - | - | y | y | src/app/(authenticated)/superadmin/page.tsx |
| PAGE-0324 | /superadmin/programs | y | y | - | - | y | y | src/app/(authenticated)/superadmin/programs/page.tsx |
| PAGE-0325 | /teach/courses/[deliveryId] | y | y | - | - | n | y | src/app/(authenticated)/teach/courses/[deliveryId]/page.tsx |
| PAGE-0326 | /teach/courses | y | y | - | - | n | y | src/app/(authenticated)/teach/courses/page.tsx |
| PAGE-0327 | /teacher/allAssignments | y | y | - | - | n | y | src/app/(authenticated)/teacher/allAssignments/page.tsx |
| PAGE-0328 | /teacher/allQuizzes | y | y | - | - | n | y | src/app/(authenticated)/teacher/allQuizzes/page.tsx |
| PAGE-0329 | /teacher/calendar | y | y | - | 1 | n | y | src/app/(authenticated)/teacher/calendar/page.tsx |
| PAGE-0330 | /teacher/contacts/[contactsTab]/[membershipId] | y | y | - | - | n | y | src/app/(authenticated)/teacher/contacts/[contactsTab]/[membershipId]/page.tsx |
| PAGE-0331 | /teacher/contacts/[contactsTab] | y | y | - | 1 | n | y | src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx |
| PAGE-0332 | /teacher/contacts | y | y | - | - | y | y | src/app/(authenticated)/teacher/contacts/page.tsx |
| PAGE-0333 | /teacher/courses/[deliveryId]/[...courseTab] | y | y | - | - | n | y | src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx |
| PAGE-0334 | /teacher/courses/[deliveryId]/assessment-health | y | y | - | 1 | n | y | src/app/(authenticated)/teacher/courses/[deliveryId]/assessment-health/page.tsx |
| PAGE-0335 | /teacher/courses/[deliveryId]/assignments/manage | y | y | - | - | n | y | src/app/(authenticated)/teacher/courses/[deliveryId]/assignments/manage/page.tsx |
| PAGE-0336 | /teacher/courses/[deliveryId]/attendance-corrections | y | y | - | - | n | y | src/app/(authenticated)/teacher/courses/[deliveryId]/attendance-corrections/page.tsx |
| PAGE-0337 | /teacher/courses/[deliveryId]/attendanceDetail | y | y | - | - | n | y | src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx |
| PAGE-0338 | /teacher/courses/[deliveryId]/discussion-history | y | y | - | 1 | n | y | src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-history/page.tsx |
| PAGE-0339 | /teacher/courses/[deliveryId]/discussion-participation | y | y | - | - | n | y | src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-participation/page.tsx |
| PAGE-0340 | /teacher/courses/[deliveryId]/discussions | y | y | - | - | n | y | src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/page.tsx |
| PAGE-0341 | /teacher/courses/[deliveryId]/gradebook/[learnerMembershipId] | y | y | - | - | n | y | src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/[learnerMembershipId]/page.tsx |
| PAGE-0342 | /teacher/courses/[deliveryId]/gradebook | y | y | - | 1 | n | y | src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/page.tsx |
| PAGE-0343 | /teacher/courses/[deliveryId]/notices | y | y | - | - | n | y | src/app/(authenticated)/teacher/courses/[deliveryId]/notices/page.tsx |
| PAGE-0344 | /teacher/courses/[deliveryId] | y | y | - | - | n | y | src/app/(authenticated)/teacher/courses/[deliveryId]/page.tsx |
| PAGE-0345 | /teacher/courses/[deliveryId]/quizzes/manage | y | y | - | - | n | y | src/app/(authenticated)/teacher/courses/[deliveryId]/quizzes/manage/page.tsx |
| PAGE-0346 | /teacher/courses/[deliveryId]/reports | y | y | - | 1 | n | y | src/app/(authenticated)/teacher/courses/[deliveryId]/reports/page.tsx |
| PAGE-0347 | /teacher/courses/[deliveryId]/session-coverage | y | y | - | - | n | y | src/app/(authenticated)/teacher/courses/[deliveryId]/session-coverage/page.tsx |
| PAGE-0348 | /teacher/courses/[deliveryId]/students/[membershipId] | y | y | - | - | n | y | src/app/(authenticated)/teacher/courses/[deliveryId]/students/[membershipId]/page.tsx |
| PAGE-0349 | /teacher/courses/[deliveryId]/students | y | y | - | - | n | y | src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx |
| PAGE-0350 | /teacher/courses | y | y | - | - | n | y | src/app/(authenticated)/teacher/courses/page.tsx |
| PAGE-0351 | /teacher/live-classes | y | y | - | 1 | y | y | src/app/(authenticated)/teacher/live-classes/page.tsx |
| PAGE-0352 | /teacher/notifications | y | y | - | - | n | y | src/app/(authenticated)/teacher/notifications/page.tsx |
| PAGE-0353 | /teacher/profile/contacts | y | y | - | - | n | y | src/app/(authenticated)/teacher/profile/contacts/page.tsx |
| PAGE-0354 | /teacher/profile/details | y | y | - | - | y | y | src/app/(authenticated)/teacher/profile/details/page.tsx |
| PAGE-0355 | /teacher/profile | y | y | - | - | y | y | src/app/(authenticated)/teacher/profile/page.tsx |
| PAGE-0356 | /teacher/profile/teaching | y | y | - | 1 | n | y | src/app/(authenticated)/teacher/profile/teaching/page.tsx |
| PAGE-0357 | /teacher/report/assignment/[contentId] | y | y | - | - | y | y | src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx |
| PAGE-0358 | /teacher/report/assignment/[contentId]/submissions | y | y | - | 1 | y | y | src/app/(authenticated)/teacher/report/assignment/[contentId]/submissions/page.tsx |
| PAGE-0359 | /teacher/report/quiz/[quizId]/attempts | y | y | - | 1 | y | y | src/app/(authenticated)/teacher/report/quiz/[quizId]/attempts/page.tsx |
| PAGE-0360 | /teacher/report/quiz/[quizId] | y | y | - | - | y | y | src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx |
| PAGE-0361 | /teacher/response-followups | y | y | - | 1 | y | y | src/app/(authenticated)/teacher/response-followups/page.tsx |
| PAGE-0362 | /teacher/results | y | y | - | 1 | y | y | src/app/(authenticated)/teacher/results/page.tsx |
| PAGE-0363 | /tpo/announcements | y | y | - | 5 | y | y | src/app/(authenticated)/tpo/announcements/page.tsx |
| PAGE-0364 | /tpo/audit/actors | y | y | y | 1 | y | y | src/app/(authenticated)/tpo/audit/actors/page.tsx |
| PAGE-0365 | /tpo/audit | y | y | - | 1 | y | y | src/app/(authenticated)/tpo/audit/page.tsx |
| PAGE-0366 | /tpo/batches/[batchId]/classes | y | y | - | - | y | y | src/app/(authenticated)/tpo/batches/[batchId]/classes/page.tsx |
| PAGE-0367 | /tpo/batches/[batchId]/history | y | y | - | 1 | y | y | src/app/(authenticated)/tpo/batches/[batchId]/history/page.tsx |
| PAGE-0368 | /tpo/batches/[batchId]/invitation-prep | y | y | - | - | y | y | src/app/(authenticated)/tpo/batches/[batchId]/invitation-prep/page.tsx |
| PAGE-0369 | /tpo/batches/[batchId]/nudge-prep | y | y | - | - | y | y | src/app/(authenticated)/tpo/batches/[batchId]/nudge-prep/page.tsx |
| PAGE-0370 | /tpo/batches/[batchId] | y | y | - | - | y | y | src/app/(authenticated)/tpo/batches/[batchId]/page.tsx |
| PAGE-0371 | /tpo/batches/[batchId]/registrations/[membershipId]/history | y | y | - | 1 | y | y | src/app/(authenticated)/tpo/batches/[batchId]/registrations/[membershipId]/history/page.tsx |
| PAGE-0372 | /tpo/batches/[batchId]/registrations | y | y | - | 1 | y | y | src/app/(authenticated)/tpo/batches/[batchId]/registrations/page.tsx |
| PAGE-0373 | /tpo/batches/[batchId]/reminder-prep | y | y | - | - | y | y | src/app/(authenticated)/tpo/batches/[batchId]/reminder-prep/page.tsx |
| PAGE-0374 | /tpo/batches/[batchId]/rules | y | y | - | - | y | y | src/app/(authenticated)/tpo/batches/[batchId]/rules/page.tsx |
| PAGE-0375 | /tpo/batches/[batchId]/students | y | y | - | 1 | y | y | src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx |
| PAGE-0376 | /tpo/batches | y | y | - | 1 | y | y | src/app/(authenticated)/tpo/batches/page.tsx |
| PAGE-0377 | /tpo/calendar/export | y | y | - | 1 | y | y | src/app/(authenticated)/tpo/calendar/export/page.tsx |
| PAGE-0378 | /tpo/calendar/interviews | y | y | - | 1 | y | y | src/app/(authenticated)/tpo/calendar/interviews/page.tsx |
| PAGE-0379 | /tpo/calendar | y | y | - | - | y | y | src/app/(authenticated)/tpo/calendar/page.tsx |
| PAGE-0380 | /tpo/calendar/rounds | y | y | - | 1 | y | y | src/app/(authenticated)/tpo/calendar/rounds/page.tsx |
| PAGE-0381 | /tpo/companies/[companyId]/contact-log | y | y | y | 1 | y | y | src/app/(authenticated)/tpo/companies/[companyId]/contact-log/page.tsx |
| PAGE-0382 | /tpo/companies/[companyId]/feedback | y | y | - | - | y | y | src/app/(authenticated)/tpo/companies/[companyId]/feedback/page.tsx |
| PAGE-0383 | /tpo/companies/[companyId]/manage | y | y | - | - | y | y | src/app/(authenticated)/tpo/companies/[companyId]/manage/page.tsx |
| PAGE-0384 | /tpo/companies/[companyId] | y | y | y | - | y | y | src/app/(authenticated)/tpo/companies/[companyId]/page.tsx |
| PAGE-0385 | /tpo/companies/[companyId]/people | y | y | - | - | y | y | src/app/(authenticated)/tpo/companies/[companyId]/people/page.tsx |
| PAGE-0386 | /tpo/companies/[companyId]/team | n | n | - | - | n | y | src/app/(authenticated)/tpo/companies/[companyId]/team/page.tsx |
| PAGE-0387 | /tpo/companies/archived | y | y | - | - | y | y | src/app/(authenticated)/tpo/companies/archived/page.tsx |
| PAGE-0388 | /tpo/companies | y | y | y | 1 | y | y | src/app/(authenticated)/tpo/companies/page.tsx |
| PAGE-0389 | /tpo/drive-day/[roundId]/no-shows | y | y | y | - | y | y | src/app/(authenticated)/tpo/drive-day/[roundId]/no-shows/page.tsx |
| PAGE-0390 | /tpo/drive-day/[roundId] | y | y | - | - | y | y | src/app/(authenticated)/tpo/drive-day/[roundId]/page.tsx |
| PAGE-0391 | /tpo/drive-day | y | y | - | 1 | y | y | src/app/(authenticated)/tpo/drive-day/page.tsx |
| PAGE-0392 | /tpo/find | y | y | - | 1 | y | y | src/app/(authenticated)/tpo/find/page.tsx |
| PAGE-0393 | /tpo/follow-ups | y | y | - | 1 | y | y | src/app/(authenticated)/tpo/follow-ups/page.tsx |
| PAGE-0394 | /tpo/home | y | y | - | - | y | y | src/app/(authenticated)/tpo/home/page.tsx |
| PAGE-0395 | /tpo/messages/[threadId] | y | y | - | - | y | y | src/app/(authenticated)/tpo/messages/[threadId]/page.tsx |
| PAGE-0396 | /tpo/messages/notifications | y | y | - | - | y | y | src/app/(authenticated)/tpo/messages/notifications/page.tsx |
| PAGE-0397 | /tpo/messages | y | y | y | 1 | y | y | src/app/(authenticated)/tpo/messages/page.tsx |
| PAGE-0398 | /tpo/more | y | y | - | - | y | y | src/app/(authenticated)/tpo/more/page.tsx |
| PAGE-0399 | /tpo/notifications | y | y | - | - | y | y | src/app/(authenticated)/tpo/notifications/page.tsx |
| PAGE-0400 | /tpo | y | y | - | - | y | y | src/app/(authenticated)/tpo/page.tsx |
| PAGE-0401 | /tpo/placements/jobs/[jobId]/about | y | y | y | - | y | y | src/app/(authenticated)/tpo/placements/jobs/[jobId]/about/page.tsx |
| PAGE-0402 | /tpo/placements/jobs/[jobId]/applicants-pipeline | y | y | - | 1 | y | y | src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx |
| PAGE-0403 | /tpo/placements/jobs/[jobId]/applicants/[applicationId] | y | y | - | - | y | y | src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants/[applicationId]/page.tsx |
| PAGE-0404 | /tpo/placements/jobs/[jobId]/applicants | y | y | - | - | y | y | src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants/page.tsx |
| PAGE-0405 | /tpo/placements/jobs/[jobId]/applications-export | y | y | - | 1 | y | y | src/app/(authenticated)/tpo/placements/jobs/[jobId]/applications-export/page.tsx |
| PAGE-0406 | /tpo/placements/jobs/[jobId]/cancel-preview | y | y | - | - | y | y | src/app/(authenticated)/tpo/placements/jobs/[jobId]/cancel-preview/page.tsx |
| PAGE-0407 | /tpo/placements/jobs/[jobId]/candidate-schedule | y | y | y | - | y | y | src/app/(authenticated)/tpo/placements/jobs/[jobId]/candidate-schedule/page.tsx |
| PAGE-0408 | /tpo/placements/jobs/[jobId]/change-requests | y | y | - | - | y | y | src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/page.tsx |
| PAGE-0409 | /tpo/placements/jobs/[jobId]/close-preview | y | y | - | - | y | y | src/app/(authenticated)/tpo/placements/jobs/[jobId]/close-preview/page.tsx |
| PAGE-0410 | /tpo/placements/jobs/[jobId]/closeout | y | y | - | - | y | y | src/app/(authenticated)/tpo/placements/jobs/[jobId]/closeout/page.tsx |
| PAGE-0411 | /tpo/placements/jobs/[jobId]/discussion | y | y | - | - | y | y | src/app/(authenticated)/tpo/placements/jobs/[jobId]/discussion/page.tsx |
| PAGE-0412 | /tpo/placements/jobs/[jobId]/drive-day | y | y | - | - | y | y | src/app/(authenticated)/tpo/placements/jobs/[jobId]/drive-day/page.tsx |
| PAGE-0413 | /tpo/placements/jobs/[jobId]/edit | y | y | - | - | y | y | src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/page.tsx |
| PAGE-0414 | /tpo/placements/jobs/[jobId]/extend-deadline | y | y | - | - | y | y | src/app/(authenticated)/tpo/placements/jobs/[jobId]/extend-deadline/page.tsx |
| PAGE-0415 | /tpo/placements/jobs/[jobId]/interview-slots | y | y | - | - | y | y | src/app/(authenticated)/tpo/placements/jobs/[jobId]/interview-slots/page.tsx |
| PAGE-0416 | /tpo/placements/jobs/[jobId]/joining | y | y | - | - | y | y | src/app/(authenticated)/tpo/placements/jobs/[jobId]/joining/page.tsx |
| PAGE-0417 | /tpo/placements/jobs/[jobId]/letters | y | y | y | - | y | y | src/app/(authenticated)/tpo/placements/jobs/[jobId]/letters/page.tsx |
| PAGE-0418 | /tpo/placements/jobs/[jobId]/offers/[offerId] | y | y | - | - | y | y | src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/[offerId]/page.tsx |
| PAGE-0419 | /tpo/placements/jobs/[jobId]/offers | y | y | - | 1 | y | y | src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/page.tsx |
| PAGE-0420 | /tpo/placements/jobs/[jobId] | y | y | - | - | y | y | src/app/(authenticated)/tpo/placements/jobs/[jobId]/page.tsx |
| PAGE-0421 | /tpo/placements/jobs/[jobId]/rounds/[roundId]/results | y | y | - | 1 | y | y | src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/results/page.tsx |
| PAGE-0422 | /tpo/placements/jobs/[jobId]/rounds/[roundId]/slots | y | y | - | - | y | y | src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/slots/page.tsx |
| PAGE-0423 | /tpo/placements/jobs/[jobId]/rounds | y | y | - | - | y | y | src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/page.tsx |
| PAGE-0424 | /tpo/placements/jobs/[jobId]/selections | y | y | - | - | y | y | src/app/(authenticated)/tpo/placements/jobs/[jobId]/selections/page.tsx |
| PAGE-0425 | /tpo/placements/jobs/[jobId]/share-audit | y | y | y | - | y | y | src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-audit/page.tsx |
| PAGE-0426 | /tpo/placements/jobs/[jobId]/share-preview | y | y | y | 1 | y | y | src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-preview/page.tsx |
| PAGE-0427 | /tpo/placements/jobs/[jobId]/shortlist | y | y | y | - | y | y | src/app/(authenticated)/tpo/placements/jobs/[jobId]/shortlist/page.tsx |
| PAGE-0428 | /tpo/placements/jobs/[jobId]/waitlist | y | y | - | - | y | y | src/app/(authenticated)/tpo/placements/jobs/[jobId]/waitlist/page.tsx |
| PAGE-0429 | /tpo/placements/lifecycle | y | y | - | 2 | y | y | src/app/(authenticated)/tpo/placements/lifecycle/page.tsx |
| PAGE-0430 | /tpo/placements/new/draft | y | y | - | - | y | y | src/app/(authenticated)/tpo/placements/new/draft/page.tsx |
| PAGE-0431 | /tpo/placements/new | y | y | - | - | y | y | src/app/(authenticated)/tpo/placements/new/page.tsx |
| PAGE-0432 | /tpo/placements/overview | y | y | - | - | y | y | src/app/(authenticated)/tpo/placements/overview/page.tsx |
| PAGE-0433 | /tpo/placements | y | y | - | - | y | y | src/app/(authenticated)/tpo/placements/page.tsx |
| PAGE-0434 | /tpo/placements/recorded-outside/[recordId] | n | n | - | 1 | n | y | src/app/(authenticated)/tpo/placements/recorded-outside/[recordId]/page.tsx |
| PAGE-0435 | /tpo/placements/recorded-outside | y | y | - | - | y | y | src/app/(authenticated)/tpo/placements/recorded-outside/page.tsx |
| PAGE-0436 | /tpo/placements/schedule-conflicts | y | y | - | 1 | y | y | src/app/(authenticated)/tpo/placements/schedule-conflicts/page.tsx |
| PAGE-0437 | /tpo/profile | y | y | - | - | y | y | src/app/(authenticated)/tpo/profile/page.tsx |
| PAGE-0438 | /tpo/recruiters/[leadId] | y | y | - | - | y | y | src/app/(authenticated)/tpo/recruiters/[leadId]/page.tsx |
| PAGE-0439 | /tpo/recruiters/campaigns/[batchId] | y | y | - | - | y | y | src/app/(authenticated)/tpo/recruiters/campaigns/[batchId]/page.tsx |
| PAGE-0440 | /tpo/recruiters/campaigns/drafts/[campaignId] | y | y | - | - | y | y | src/app/(authenticated)/tpo/recruiters/campaigns/drafts/[campaignId]/page.tsx |
| PAGE-0441 | /tpo/recruiters/campaigns/new | y | y | - | - | y | y | src/app/(authenticated)/tpo/recruiters/campaigns/new/page.tsx |
| PAGE-0442 | /tpo/recruiters/campaigns | y | y | - | 1 | y | y | src/app/(authenticated)/tpo/recruiters/campaigns/page.tsx |
| PAGE-0443 | /tpo/recruiters/campaigns/preview | y | y | - | - | y | y | src/app/(authenticated)/tpo/recruiters/campaigns/preview/page.tsx |
| PAGE-0444 | /tpo/recruiters | y | y | - | - | y | y | src/app/(authenticated)/tpo/recruiters/page.tsx |
| PAGE-0445 | /tpo/reports/[slug] | n | n | - | - | n | y | src/app/(authenticated)/tpo/reports/[slug]/page.tsx |
| PAGE-0446 | /tpo/reports/accreditation | y | y | y | 1 | y | y | src/app/(authenticated)/tpo/reports/accreditation/page.tsx |
| PAGE-0447 | /tpo/reports/after-college | y | y | y | 1 | y | y | src/app/(authenticated)/tpo/reports/after-college/page.tsx |
| PAGE-0448 | /tpo/reports/branch-season | y | y | y | 1 | y | y | src/app/(authenticated)/tpo/reports/branch-season/page.tsx |
| PAGE-0449 | /tpo/reports/by-branch | y | y | - | - | y | y | src/app/(authenticated)/tpo/reports/by-branch/page.tsx |
| PAGE-0450 | /tpo/reports/by-company | y | y | - | 1 | y | y | src/app/(authenticated)/tpo/reports/by-company/page.tsx |
| PAGE-0451 | /tpo/reports/ctc | y | y | - | - | y | y | src/app/(authenticated)/tpo/reports/ctc/page.tsx |
| PAGE-0452 | /tpo/reports/failure-reasons | y | y | - | - | y | y | src/app/(authenticated)/tpo/reports/failure-reasons/page.tsx |
| PAGE-0453 | /tpo/reports/intelligence | y | y | - | - | y | y | src/app/(authenticated)/tpo/reports/intelligence/page.tsx |
| PAGE-0454 | /tpo/reports/joining-followups | y | y | - | 1 | y | y | src/app/(authenticated)/tpo/reports/joining-followups/page.tsx |
| PAGE-0455 | /tpo/reports/joining-status | y | y | - | - | y | y | src/app/(authenticated)/tpo/reports/joining-status/page.tsx |
| PAGE-0456 | /tpo/reports/leads | y | y | - | 1 | y | y | src/app/(authenticated)/tpo/reports/leads/page.tsx |
| PAGE-0457 | /tpo/reports/offers-acceptance | y | y | - | - | y | y | src/app/(authenticated)/tpo/reports/offers-acceptance/page.tsx |
| PAGE-0458 | /tpo/reports/offers-expiry | y | y | - | 1 | y | y | src/app/(authenticated)/tpo/reports/offers-expiry/page.tsx |
| PAGE-0459 | /tpo/reports | y | y | - | 1 | y | y | src/app/(authenticated)/tpo/reports/page.tsx |
| PAGE-0460 | /tpo/reports/placed-branch | y | y | - | 1 | y | y | src/app/(authenticated)/tpo/reports/placed-branch/page.tsx |
| PAGE-0461 | /tpo/reports/placement-summary | y | y | - | 1 | y | y | src/app/(authenticated)/tpo/reports/placement-summary/page.tsx |
| PAGE-0462 | /tpo/reports/season-pipeline | y | y | - | 1 | y | y | src/app/(authenticated)/tpo/reports/season-pipeline/page.tsx |
| PAGE-0463 | /tpo/reports/unplaced | y | y | - | 1 | y | y | src/app/(authenticated)/tpo/reports/unplaced/page.tsx |
| PAGE-0464 | /tpo/requests | y | y | - | 1 | y | y | src/app/(authenticated)/tpo/requests/page.tsx |
| PAGE-0465 | /tpo/settings/after-college | y | y | - | - | y | y | src/app/(authenticated)/tpo/settings/after-college/page.tsx |
| PAGE-0466 | /tpo/settings/blocked-dates | y | y | - | - | y | y | src/app/(authenticated)/tpo/settings/blocked-dates/page.tsx |
| PAGE-0467 | /tpo/settings/branding | y | y | - | - | y | y | src/app/(authenticated)/tpo/settings/branding/page.tsx |
| PAGE-0468 | /tpo/settings/job-types | y | y | - | - | y | y | src/app/(authenticated)/tpo/settings/job-types/page.tsx |
| PAGE-0469 | /tpo/settings/notices | y | y | - | - | y | y | src/app/(authenticated)/tpo/settings/notices/page.tsx |
| PAGE-0470 | /tpo/settings/notifications | y | y | y | 1 | y | y | src/app/(authenticated)/tpo/settings/notifications/page.tsx |
| PAGE-0471 | /tpo/settings | y | y | - | - | y | y | src/app/(authenticated)/tpo/settings/page.tsx |
| PAGE-0472 | /tpo/settings/prep-readiness | y | y | - | - | y | y | src/app/(authenticated)/tpo/settings/prep-readiness/page.tsx |
| PAGE-0473 | /tpo/settings/public-link | y | y | - | - | y | y | src/app/(authenticated)/tpo/settings/public-link/page.tsx |
| PAGE-0474 | /tpo/settings/public-page | y | y | - | - | y | y | src/app/(authenticated)/tpo/settings/public-page/page.tsx |
| PAGE-0475 | /tpo/settings/recruiters | y | y | y | 1 | y | y | src/app/(authenticated)/tpo/settings/recruiters/page.tsx |
| PAGE-0476 | /tpo/settings/rules | y | y | - | - | y | y | src/app/(authenticated)/tpo/settings/rules/page.tsx |
| PAGE-0477 | /tpo/settings/season | y | y | - | - | y | y | src/app/(authenticated)/tpo/settings/season/page.tsx |
| PAGE-0478 | /tpo/settings/see | y | y | - | - | y | y | src/app/(authenticated)/tpo/settings/see/page.tsx |
| PAGE-0479 | /tpo/settings/team | y | y | y | - | y | y | src/app/(authenticated)/tpo/settings/team/page.tsx |
| PAGE-0480 | /tpo/settings/templates | y | y | - | - | y | y | src/app/(authenticated)/tpo/settings/templates/page.tsx |
| PAGE-0481 | /tpo/settings/trusted | y | y | y | - | y | y | src/app/(authenticated)/tpo/settings/trusted/page.tsx |
| PAGE-0482 | /tpo/students/[membershipId]/history | y | y | - | - | y | y | src/app/(authenticated)/tpo/students/[membershipId]/history/page.tsx |
| PAGE-0483 | /tpo/students/[membershipId]/participation | y | y | - | - | y | y | src/app/(authenticated)/tpo/students/[membershipId]/participation/page.tsx |
| PAGE-0484 | /tpo/students | y | y | - | 2 | y | y | src/app/(authenticated)/tpo/students/page.tsx |
| PAGE-0485 | /tpo/students/preparation-plan | y | y | - | - | y | y | src/app/(authenticated)/tpo/students/preparation-plan/page.tsx |
| PAGE-0486 | /tpo/students/preparation-prep | y | y | - | - | y | y | src/app/(authenticated)/tpo/students/preparation-prep/page.tsx |
| PAGE-0487 | /tpo/students/requests | y | y | - | 1 | y | y | src/app/(authenticated)/tpo/students/requests/page.tsx |
| PAGE-0488 | /tpo/team/[threadId] | y | y | - | 1 | y | y | src/app/(authenticated)/tpo/team/[threadId]/page.tsx |
| PAGE-0489 | /tpo/team/company/[companyId] | n | n | - | - | n | y | src/app/(authenticated)/tpo/team/company/[companyId]/page.tsx |
| PAGE-0490 | /tpo/team/everyone | y | y | - | - | n | y | src/app/(authenticated)/tpo/team/everyone/page.tsx |
| PAGE-0491 | /tpo/team | y | y | - | - | y | y | src/app/(authenticated)/tpo/team/page.tsx |
| PAGE-0492 | /tpo/verification | y | y | - | 1 | n | y | src/app/(authenticated)/tpo/verification/page.tsx |
| PAGE-0493 | /tracker/audit-findings/[publicId] | y | y | - | - | y | y | src/app/(authenticated)/tracker/audit-findings/[publicId]/page.tsx |
| PAGE-0494 | /tracker/audit-findings | y | y | y | 1 | y | y | src/app/(authenticated)/tracker/audit-findings/page.tsx |
| PAGE-0495 | /tracker/issues/[publicId] | y | y | - | - | y | y | src/app/(authenticated)/tracker/issues/[publicId]/page.tsx |
| PAGE-0496 | /tracker/issues | y | y | - | 1 | y | y | src/app/(authenticated)/tracker/issues/page.tsx |
| PAGE-0497 | /tracker/logs | y | y | - | - | y | y | src/app/(authenticated)/tracker/logs/page.tsx |
| PAGE-0498 | /tracker/mine/[publicId] | n | n | - | - | n | y | src/app/(authenticated)/tracker/mine/[publicId]/page.tsx |
| PAGE-0499 | /tracker/mine | n | n | - | - | n | y | src/app/(authenticated)/tracker/mine/page.tsx |
| PAGE-0500 | /tracker | y | y | - | - | y | y | src/app/(authenticated)/tracker/page.tsx |
| PAGE-0501 | /auth/handoff | y | y | - | - | y | y | src/app/auth/handoff/page.tsx |
| PAGE-0502 | /campaign-unsubscribe/[token] | y | y | - | - | y | y | src/app/campaign-unsubscribe/[token]/page.tsx |
| PAGE-0503 | /campaign-unsubscribe/confirmed | y | y | - | - | y | y | src/app/campaign-unsubscribe/confirmed/page.tsx |
| PAGE-0504 | /college-join/[token] | y | y | - | - | y | y | src/app/college-join/[token]/page.tsx |
| PAGE-0505 | /company-join/[token] | y | y | - | - | y | y | src/app/company-join/[token]/page.tsx |
| PAGE-0506 | /company-share/[token] | y | y | y | 2 | n | y | src/app/company-share/[token]/page.tsx |
| PAGE-0507 | /e2e/superadmin-login | y | y | - | - | n | y | src/app/e2e/superadmin-login/page.tsx |
| PAGE-0508 | /enterprises | y | y | - | - | y | y | src/app/enterprises/page.tsx |
| PAGE-0509 | /forbidden | y | y | - | - | n | y | src/app/forbidden/page.tsx |
| PAGE-0510 | /home | y | y | - | - | y | y | src/app/home/page.tsx |
| PAGE-0511 | /hr-invite/[token] | y | y | - | - | y | y | src/app/hr-invite/[token]/page.tsx |
| PAGE-0512 | /login | y | y | - | - | y | y | src/app/login/page.tsx |
| PAGE-0513 | / | y | y | - | - | y | y | src/app/page.tsx |
| PAGE-0514 | /placements | y | y | - | - | y | y | src/app/placements/page.tsx |
| PAGE-0515 | /platform | y | y | - | - | y | y | src/app/platform/page.tsx |
| PAGE-0516 | /privacy-policy | y | y | - | - | y | y | src/app/privacy-policy/page.tsx |
| PAGE-0517 | /quiz | y | y | - | - | y | y | src/app/quiz/page.tsx |
| PAGE-0518 | /recruiter-invite/[token] | y | y | - | - | y | y | src/app/recruiter-invite/[token]/page.tsx |
| PAGE-0519 | /request-demo | y | y | - | - | n | y | src/app/request-demo/page.tsx |
| PAGE-0520 | /superadmin-login | y | y | - | - | y | y | src/app/superadmin-login/page.tsx |
| PAGE-0521 | /universities | y | y | - | - | y | y | src/app/universities/page.tsx |

## Overlays (modals, drawers, sheets, confirms)

| Id | Component | Kinds | Titles | UX test | UX note | File |
|---|---|---|---|---|---|---|
| OVERLAY-0001 | academics-actions | dialog, confirm, toast | Edit program; Discard program changes?; Reopen academic period?; Edit academic period | n | y | src/components/academics/academics-actions.tsx |
| OVERLAY-0002 | college-cohort-management | dialog, confirm, form | Create batch; Edit batch ; Discard unsaved batch changes? | y | n | src/components/academics/college-cohort-management.tsx |
| OVERLAY-0003 | college-promotion-confirmation | confirm | Promote Batch | y | n | src/components/academics/college-promotion-confirmation.tsx |
| OVERLAY-0004 | college-recurring-preview | confirm, table, form | Schedule preview results; Create recurring sessions? | n | y | src/components/academics/college-recurring-preview.tsx |
| OVERLAY-0005 | college-section-lifecycle-action | confirm |  | n | y | src/components/academics/college-section-lifecycle-action.tsx |
| OVERLAY-0006 | college-section-management | dialog, confirm, form | Create class; Edit class ; Discard unsaved class changes? | y | n | src/components/academics/college-section-management.tsx |
| OVERLAY-0007 | college-semester-management | dialog, confirm, form | Discard semester changes? | n | y | src/components/academics/college-semester-management.tsx |
| OVERLAY-0008 | college-term-mapping-manager | confirm, table, form | Edit mapping for ; Move ; Move  | n | y | src/components/academics/college-term-mapping-manager.tsx |
| OVERLAY-0009 | learner-notifications-inbox | dialog | Learner notifications inbox; Filter notifications by type; Mark all personal notifications as read? | n | y | src/components/activity/learner-notifications-inbox.tsx |
| OVERLAY-0010 | admin-revoke-sessions | confirm | Sign out everywhere? | y | n | src/components/admin/admin-revoke-sessions.tsx |
| OVERLAY-0011 | college-admin-lifecycle-action | confirm |  | y | n | src/components/admin/college-admin-lifecycle-action.tsx |
| OVERLAY-0012 | college-archive-button | dialog, toast | Archive college | n | y | src/components/admin/college-archive-button.tsx |
| OVERLAY-0013 | college-bulk-import | confirm, toast, table | Create ; Discard Bulk Import draft? | y | n | src/components/admin/college-bulk-import.tsx |
| OVERLAY-0014 | college-edit-dialog | dialog, toast |  | n | y | src/components/admin/college-edit-dialog.tsx |
| OVERLAY-0015 | college-feature-rule-editor | confirm |  | y | n | src/components/admin/college-feature-rule-editor.tsx |
| OVERLAY-0016 | college-logo-uploader | confirm | College logo upload; Horizontal crop position; Vertical crop position; Crop zoom | y | n | src/components/admin/college-logo-uploader.tsx |
| OVERLAY-0017 | college-signin-method-form | confirm | College sign-in methods; Change allowed sign-in methods for this college? | y | n | src/components/admin/college-signin-method-form.tsx |
| OVERLAY-0018 | department-actions | dialog, confirm, toast | Discard department changes?; Archive department | n | y | src/components/admin/department-actions.tsx |
| OVERLAY-0019 | inbound-mail-list | drawer |  | n | y | src/components/admin/inbound-mail-list.tsx |
| OVERLAY-0020 | learner-module-access-drawer | drawer | Why a learner sees a module; Matching learners; Student module access explanation; Close student explanation | y | n | src/components/admin/learner-module-access-drawer.tsx |
| OVERLAY-0021 | lecture-hall-manager | dialog, confirm, toast, table | Archive lecture hall | n | y | src/components/admin/lecture-hall-manager.tsx |
| OVERLAY-0022 | managed-college-subdomain | confirm | Managed college web address | y | n | src/components/admin/managed-college-subdomain.tsx |
| OVERLAY-0023 | organization-actions | dialog, confirm, toast | Rename organization | n | y | src/components/admin/organization-actions.tsx |
| OVERLAY-0024 | person-membership-actions | dialog, confirm, toast |  | n | y | src/components/admin/person-membership-actions.tsx |
| OVERLAY-0025 | person-onboard-dialog | dialog, toast |  | n | y | src/components/admin/person-onboard-dialog.tsx |
| OVERLAY-0026 | person-profile-dialog | dialog, toast |  | n | y | src/components/admin/person-profile-dialog.tsx |
| OVERLAY-0027 | student-rule-editor | confirm | Confirm learner module access change | y | n | src/components/admin/student-rule-editor.tsx |
| OVERLAY-0028 | super-admin-attendance-settings-editor | confirm | Attendance policy; Save attendance settings for this college? | n | y | src/components/admin/super-admin-attendance-settings-editor.tsx |
| OVERLAY-0029 | super-admin-batch-graduate-action | confirm | Mark  | n | y | src/components/admin/super-admin-batch-graduate-action.tsx |
| OVERLAY-0030 | super-admin-batch-roster-manager | confirm, table | Batch student roster; Destination class for ; Move  | y | n | src/components/admin/super-admin-batch-roster-manager.tsx |
| OVERLAY-0031 | super-admin-faculty-schedule-reassign-action | dialog, confirm | Reassign class schedules; Reassign upcoming class schedules? | n | y | src/components/admin/super-admin-faculty-schedule-reassign-action.tsx |
| OVERLAY-0032 | super-admin-hr-account-dialog | dialog, form |  | n | y | src/components/admin/super-admin-hr-account-dialog.tsx |
| OVERLAY-0033 | super-admin-hr-accounts | confirm, toast, table, form | Recruiter accounts; Recruiter account lifecycle; Could not load recruiter accounts; No recruiter accounts found | y | n | src/components/admin/super-admin-hr-accounts.tsx |
| OVERLAY-0034 | super-admin-hr-detail-drawer | drawer | Could not load recruiter; No recruiter selected; College grant history; Action failed | n | y | src/components/admin/super-admin-hr-detail-drawer.tsx |
| OVERLAY-0035 | super-admin-student-import-history | native-dialog, table | Bulk import history | n | y | src/components/admin/super-admin-student-import-history.tsx |
| OVERLAY-0036 | tenant-domain-manager | confirm, toast |  | n | y | src/components/admin/tenant-domain-manager.tsx |
| OVERLAY-0037 | tenant-restore-action | confirm, toast | Restore  | n | y | src/components/admin/tenant-restore-action.tsx |
| OVERLAY-0038 | tenant-settings-editor | confirm | Edit Tenant Settings; Review high-impact tenant setting changes | n | y | src/components/admin/tenant-settings-editor.tsx |
| OVERLAY-0039 | tenant-settings-other-keys | confirm | Other stored keys | n | y | src/components/admin/tenant-settings-other-keys.tsx |
| OVERLAY-0040 | announcement-admin-workspace | dialog, toast, form | Confirm announcement publication; Edit announcement | y | n | src/components/announcements/announcement-admin-workspace.tsx |
| OVERLAY-0041 | super-admin-college-broadcast-form | confirm | Approve announcement to placement cells | y | n | src/components/announcements/super-admin-college-broadcast-form.tsx |
| OVERLAY-0042 | admin-attendance-workspace | drawer, table, form | Previous month; Attendance month; Next month; No assigned class courses | n | y | src/components/attendance/admin-attendance-workspace.tsx |
| OVERLAY-0043 | college-attendance-policy-form | confirm, form | Reset attendance policy to default? | n | y | src/components/attendance/college-attendance-policy-form.tsx |
| OVERLAY-0044 | faculty-attendance-schedule-editor | confirm | Faculty attendance session scheduling; Confirm  | y | n | src/components/attendance/faculty-attendance-schedule-editor.tsx |
| OVERLAY-0045 | faculty-attendance-workspace | drawer, confirm, table, form | Previous month; Next month; Monthly class health; Attendance threshold guidance | y | y | src/components/attendance/faculty-attendance-workspace.tsx |
| OVERLAY-0046 | device-list | confirm, toast |  | y | n | src/components/auth/device-list.tsx |
| OVERLAY-0047 | college-faculty-reassign-action | dialog | Reassign  | y | n | src/components/college/college-faculty-reassign-action.tsx |
| OVERLAY-0048 | college-faculty-schedule-reassign | dialog | Reassign class schedules | y | n | src/components/college/college-faculty-schedule-reassign.tsx |
| OVERLAY-0049 | college-offering-metadata-action | dialog | Edit offering  | y | n | src/components/college/college-offering-metadata-action.tsx |
| OVERLAY-0050 | college-person-audit-modal | dialog | Audit trail for  | y | n | src/components/college/college-person-audit-modal.tsx |
| OVERLAY-0051 | college-person-edit-action | dialog, form |  | y | n | src/components/college/college-person-edit-action.tsx |
| OVERLAY-0052 | college-person-profile-overview-modal | dialog | Profile for  | y | n | src/components/college/college-person-profile-overview-modal.tsx |
| OVERLAY-0053 | college-student-import-history | dialog, table | Bulk import history; Import history pages | y | y | src/components/college/college-student-import-history.tsx |
| OVERLAY-0054 | use-college-confirmation | confirm |  | y | n | src/components/college/use-college-confirmation.tsx |
| OVERLAY-0055 | admin-course-actions | dialog, confirm, toast | Edit Course; Archive ; Edit Course Offering | n | y | src/components/courses/admin-course-actions.tsx |
| OVERLAY-0056 | admin-course-create-panel | confirm, toast, form | Course setup workflow; Course setup steps; Create this Course Offering? | n | y | src/components/courses/admin-course-create-panel.tsx |
| OVERLAY-0057 | admin-learning-structure-actions | dialog, confirm, toast, form | Edit Learning Path; Unpublish learning path?; Edit Lesson | n | y | src/components/courses/admin-learning-structure-actions.tsx |
| OVERLAY-0058 | assignment-submission-control | dialog, form | Submission type; Discard this submission? | n | y | src/components/courses/assignment-submission-control.tsx |
| OVERLAY-0059 | college-archived-lesson-restore | confirm | Restore  | n | y | src/components/courses/college-archived-lesson-restore.tsx |
| OVERLAY-0060 | college-assignment-create | confirm | Create assignment as a draft?; Discard unsaved assignment changes? | y | n | src/components/courses/college-assignment-create.tsx |
| OVERLAY-0061 | college-content-preview | aria-dialog | Content preview | n | y | src/components/courses/college-content-preview.tsx |
| OVERLAY-0062 | college-lesson-reorder-actions | confirm, toast | Lesson order controls; Change lesson order? | n | y | src/components/courses/college-lesson-reorder-actions.tsx |
| OVERLAY-0063 | faculty-assessment-create | drawer | Select course and class; Select lesson | n | y | src/components/courses/faculty-assessment-create.tsx |
| OVERLAY-0064 | faculty-assessment-editor | drawer, form |  | n | y | src/components/courses/faculty-assessment-editor.tsx |
| OVERLAY-0065 | faculty-assignment-editor | confirm |  | y | n | src/components/courses/faculty-assignment-editor.tsx |
| OVERLAY-0066 | faculty-assignment-review | drawer, form | Assignment submissions; Assignment submissions; Submission grading filters; Submission student navigation | n | y | src/components/courses/faculty-assignment-review.tsx |
| OVERLAY-0067 | faculty-choice-quiz-builder | dialog, confirm | Quiz preview; Move answer ; Move answer ; Insert answer after  | y | n | src/components/courses/faculty-choice-quiz-builder.tsx |
| OVERLAY-0068 | faculty-content-editor | drawer, form | Edit  | n | y | src/components/courses/faculty-content-editor.tsx |
| OVERLAY-0069 | faculty-course-roster | dialog, table | No students yet; Download roster CSV; Search students; No students match this search | n | y | src/components/courses/faculty-course-roster.tsx |
| OVERLAY-0070 | faculty-lesson-authoring | confirm, form | Discard this content draft? | n | y | src/components/courses/faculty-lesson-authoring.tsx |
| OVERLAY-0071 | faculty-live-class-editor | confirm | Manage Faculty live classes | y | n | src/components/courses/faculty-live-class-editor.tsx |
| OVERLAY-0072 | faculty-quiz-question-editor | drawer | Edit Quiz questions | n | y | src/components/courses/faculty-quiz-question-editor.tsx |
| OVERLAY-0073 | faculty-quiz-review | drawer |  | n | y | src/components/courses/faculty-quiz-review.tsx |
| OVERLAY-0074 | faculty-report-download | confirm | This report is incomplete | n | y | src/components/courses/faculty-report-download.tsx |
| OVERLAY-0075 | learner-assessment-overview | drawer, table, disclosure | You haven; Quiz summary | y | y | src/components/courses/learner-assessment-overview.tsx |
| OVERLAY-0076 | learner-course-discussion | confirm, form | Delete this message?; Discard your unsent discussion message?; No messages yet | y | n | src/components/courses/learner-course-discussion.tsx |
| OVERLAY-0077 | learner-quiz-attempt | confirm | Cancel quiz?; Submit quiz attempt?; Your quiz answer review | y | n | src/components/courses/learner-quiz-attempt.tsx |
| OVERLAY-0078 | learner-roadmap-item-dialog | native-dialog |  | n | y | src/components/courses/learner-roadmap-item-dialog.tsx |
| OVERLAY-0079 | resource-progress-control | confirm |  | n | y | src/components/courses/resource-progress-control.tsx |
| OVERLAY-0080 | college-group-actions | dialog, confirm, form |  | n | y | src/components/groups/college-group-actions.tsx |
| OVERLAY-0081 | college-study-member-actions | confirm, form |  | n | y | src/components/groups/college-study-member-actions.tsx |
| OVERLAY-0082 | hr-drive-draft-form | confirm | Discard this drive draft?; Choose hiring round preset; Move ; Move  | n | n | src/components/hr/hr-drive-draft-form.tsx |
| OVERLAY-0083 | recruiter-applicant-review-drawer | drawer |  | y | n | src/components/hr/recruiter-applicant-review-drawer.tsx |
| OVERLAY-0084 | recruiter-notification-bell | aria-dialog | Notifications; Close notifications | n | y | src/components/hr/recruiter-notification-bell.tsx |
| OVERLAY-0085 | recruiter-request-cancel-button | confirm | Cancel this drive request? | n | y | src/components/hr/recruiter-request-cancel-button.tsx |
| OVERLAY-0086 | recruiter-round-inline-editor | aria-dialog, form | Remove this round? | n | y | src/components/hr/recruiter-round-inline-editor.tsx |
| OVERLAY-0087 | faculty-profile-editor | confirm | Reload the latest Faculty profile?; Profile sections; About; Personal details | y | n | src/components/people/faculty-profile-editor.tsx |
| OVERLAY-0088 | faculty-profile-metadata | confirm, form | Additional metadata | y | n | src/components/people/faculty-profile-metadata.tsx |
| OVERLAY-0089 | faculty-profile-repeatable | confirm, form | Move ; Move  | y | n | src/components/people/faculty-profile-repeatable.tsx |
| OVERLAY-0090 | faculty-profile-skills | confirm, form | Skills | y | n | src/components/people/faculty-profile-skills.tsx |
| OVERLAY-0091 | faculty-profile-text-section | confirm, form | Discard unsaved changes to  | y | n | src/components/people/faculty-profile-text-section.tsx |
| OVERLAY-0092 | college-application-detail-drawer | dialog | Application Details | y | n | src/components/placements/college-application-detail-drawer.tsx |
| OVERLAY-0093 | college-application-pipeline-controls | dialog, table | Bulk application action; Application mobile cards; Move ; Select  | y | y | src/components/placements/college-application-pipeline-controls.tsx |
| OVERLAY-0094 | college-drive-deadline-action | dialog | Extend deadline —  | y | n | src/components/placements/college-drive-deadline-action.tsx |
| OVERLAY-0095 | college-interview-appointments | dialog, confirm, table |  | y | y | src/components/placements/college-interview-appointments.tsx |
| OVERLAY-0096 | college-interview-status-actions | confirm |  | y | n | src/components/placements/college-interview-status-actions.tsx |
| OVERLAY-0097 | learner-application-detail-withdraw | dialog |  | n | y | src/components/placements/learner-application-detail-withdraw.tsx |
| OVERLAY-0098 | learner-applications-browse | dialog, drawer | Application screening updates; Application list filters; Application stage views; Screening stage filter chips | n | y | src/components/placements/learner-applications-browse.tsx |
| OVERLAY-0099 | learner-career-calendar | drawer | Learner Career Calendar; Calendar view; Previous calendar period; Next calendar period | n | y | src/components/placements/learner-career-calendar.tsx |
| OVERLAY-0100 | learner-career-rounds-workspace | dialog, drawer | Filter by schedule; Assessment due buckets; Past scheduled assessments; Assessments without a recorded date | n | y | src/components/placements/learner-career-rounds-workspace.tsx |
| OVERLAY-0101 | learner-placement-jobs | dialog, toast | Withdraw Application; Ready to apply?; Confirm your external application; No live opportunities yet | n | y | src/components/placements/learner-placement-jobs.tsx |
| OVERLAY-0102 | learner-placement-notification-settings | dialog, toast | Confirm placement notification choices | n | y | src/components/placements/learner-placement-notification-settings.tsx |
| OVERLAY-0103 | learner-placement-offers | dialog, toast | Request an offer deadline extension | y | n | src/components/placements/learner-placement-offers.tsx |
| OVERLAY-0104 | learner-support-cancel | dialog | Cancel placement request | n | y | src/components/placements/learner-support-cancel.tsx |
| OVERLAY-0105 | placement-drive-controls | confirm, toast, disclosure | Replace current round plan with  | n | y | src/components/placements/placement-drive-controls.tsx |
| OVERLAY-0106 | placement-employer-relationships | confirm, toast | Restore this company? | n | y | src/components/placements/placement-employer-relationships.tsx |
| OVERLAY-0107 | placement-offer-controls | aria-dialog, toast | Record type for ; Withdraw offer confirmation | n | y | src/components/placements/placement-offer-controls.tsx |
| OVERLAY-0108 | recruiter-focused-review-shortcuts | native-dialog |  | n | y | src/components/placements/recruiter-focused-review-shortcuts.tsx |
| OVERLAY-0109 | recruiter-result-controls | confirm, toast | Recruiter results editor; Outcome; Score %; Waitlist rank | n | y | src/components/placements/recruiter-result-controls.tsx |
| OVERLAY-0110 | tpo-applicant-review-drawer | drawer | Review neighbours | n | y | src/components/placements/tpo-applicant-review-drawer.tsx |
| OVERLAY-0111 | tpo-bulk-round-result-recorder | confirm, disclosure | Bulk stage round results; Stage  | y | n | src/components/placements/tpo-bulk-round-result-recorder.tsx |
| OVERLAY-0112 | tpo-drive-act-on-panel | confirm | Act on selected drives; Apply  | y | n | src/components/placements/tpo-drive-act-on-panel.tsx |
| OVERLAY-0113 | tpo-drive-change-requests | confirm |  | n | y | src/components/placements/tpo-drive-change-requests.tsx |
| OVERLAY-0114 | tpo-drive-clone-action | confirm | Run this drive again as a new draft? | n | y | src/components/placements/tpo-drive-clone-action.tsx |
| OVERLAY-0115 | tpo-drive-close-preview-form | confirm, form | Close this drive? | y | n | src/components/placements/tpo-drive-close-preview-form.tsx |
| OVERLAY-0116 | tpo-drive-deadline-form | confirm, form |  | n | y | src/components/placements/tpo-drive-deadline-form.tsx |
| OVERLAY-0117 | tpo-drive-edit-form | dialog, confirm, form | Save changes to a live drive?; Save changes to this draft drive? | n | y | src/components/placements/tpo-drive-edit-form.tsx |
| OVERLAY-0118 | tpo-drive-selection-manager | dialog, confirm, table | Verify and release  | y | n | src/components/placements/tpo-drive-selection-manager.tsx |
| OVERLAY-0119 | tpo-general-requests-panel | dialog | Other student requests; Review  | n | y | src/components/placements/tpo-general-requests-panel.tsx |
| OVERLAY-0120 | tpo-interview-slot-planner | confirm | New slot for ; Reason for ; Select learner for slot; Move to available slot | y | n | src/components/placements/tpo-interview-slot-planner.tsx |
| OVERLAY-0121 | tpo-joining-update-form | confirm | Record  | y | n | src/components/placements/tpo-joining-update-form.tsx |
| OVERLAY-0122 | tpo-remind-non-applicants | aria-dialog | Review not-applied reminder | n | y | src/components/placements/tpo-remind-non-applicants.tsx |
| OVERLAY-0123 | tpo-request-bulk-decision | dialog | Bulk request decisions | n | y | src/components/placements/tpo-request-bulk-decision.tsx |
| OVERLAY-0124 | tpo-request-decision-control | dialog, toast | Rejection reasons | n | y | src/components/placements/tpo-request-decision-control.tsx |
| OVERLAY-0125 | tpo-round-result-entry-form | confirm, form | Stage this round result? | y | n | src/components/placements/tpo-round-result-entry-form.tsx |
| OVERLAY-0126 | tpo-round-results-import | confirm, disclosure | Match row ; Stage this reviewed result import? | y | n | src/components/placements/tpo-round-results-import.tsx |
| OVERLAY-0127 | tpo-selection-import | confirm, disclosure | Record  | y | n | src/components/placements/tpo-selection-import.tsx |
| OVERLAY-0128 | tpo-waitlist-promotion-control | confirm, table |  | y | n | src/components/placements/tpo-waitlist-promotion-control.tsx |
| OVERLAY-0129 | tpo-week-hour-calendar | aria-dialog | TPO weekly time calendar; Add follow-up on ; Current time; Move follow-up:  | n | y | src/components/placements/tpo-week-hour-calendar.tsx |
| OVERLAY-0130 | learner-profile-workspace | dialog, confirm, toast | Quick access to unfinished profile sections; Contacts; Job Preferences; Social profiles | y | n | src/components/profile/learner-profile-workspace.tsx |
| OVERLAY-0131 | college-project-mentor-dialog | dialog, toast | Reassign mentor | n | y | src/components/projects/college-project-mentor-dialog.tsx |
| OVERLAY-0132 | college-project-student-roster-dialog | dialog, confirm, toast | Manage students; Remove  | n | y | src/components/projects/college-project-student-roster-dialog.tsx |
| OVERLAY-0133 | learner-board-task-detail-dialog | native-dialog, form | Close task details; Task approach; Task Activity | n | y | src/components/projects/learner-board-task-detail-dialog.tsx |
| OVERLAY-0134 | mentor-board-task-detail-dialog | native-dialog |  | y | n | src/components/projects/mentor-board-task-detail-dialog.tsx |
| OVERLAY-0135 | mentor-meeting-notes-editor | dialog, confirm, toast, form | Meeting outcome notes; Save meeting outcome notes?; Discard meeting notes? | y | n | src/components/projects/mentor-meeting-notes-editor.tsx |
| OVERLAY-0136 | mentor-meeting-reschedule | dialog, confirm, toast, form | Reschedule meeting; Confirm meeting reschedule?; Discard reschedule changes? | y | n | src/components/projects/mentor-meeting-reschedule.tsx |
| OVERLAY-0137 | mentor-product-backlog | confirm, form, disclosure | Discard backlog task changes? | y | n | src/components/projects/mentor-product-backlog.tsx |
| OVERLAY-0138 | mentor-project-closeout-control | confirm | Complete this project? | y | y | src/components/projects/mentor-project-closeout-control.tsx |
| OVERLAY-0139 | mentor-release-editor | confirm | Discard unsaved project changes?; Delete this release? | n | y | src/components/projects/mentor-release-editor.tsx |
| OVERLAY-0140 | mentor-sprint-details-edit | dialog, confirm, toast, form | Edit sprint details; Confirm sprint changes?; Discard sprint changes? | n | y | src/components/projects/mentor-sprint-details-edit.tsx |
| OVERLAY-0141 | mentor-sprint-write | dialog, confirm, toast | Create sprint; Discard sprint changes? | n | y | src/components/projects/mentor-sprint-write.tsx |
| OVERLAY-0142 | mentor-task-create | dialog, confirm, toast | Confirm new task; Discard task changes? | n | y | src/components/projects/mentor-task-create.tsx |
| OVERLAY-0143 | mentor-task-delete-control | confirm | Delete this task? | y | n | src/components/projects/mentor-task-delete-control.tsx |
| OVERLAY-0144 | mentor-task-details-edit | dialog, confirm, toast, form | Edit task details; Confirm task changes?; Discard task changes? | n | y | src/components/projects/mentor-task-details-edit.tsx |
| OVERLAY-0145 | mentor-task-status-transition | confirm, toast | Next task state for task ; Blocker note for task ; Review status change: ; Change this task state? | n | y | src/components/projects/mentor-task-status-transition.tsx |
| OVERLAY-0146 | project-admin-submission-review | dialog, confirm | Review final submission; Review — ; Lock this submission? | n | y | src/components/projects/project-admin-submission-review.tsx |
| OVERLAY-0147 | project-archive-control | dialog, toast | Restore this workspace?; Archive project? | n | y | src/components/projects/project-archive-control.tsx |
| OVERLAY-0148 | project-create-control | dialog, toast, form | Create workspace; Create workspace | n | y | src/components/projects/project-create-control.tsx |
| OVERLAY-0149 | project-delivery-reopen-control | dialog, confirm, toast | Reopen this submission for revision?; Discard review feedback? | n | y | src/components/projects/project-delivery-reopen-control.tsx |
| OVERLAY-0150 | project-final-delivery-controls | dialog, confirm, toast, form | What is left before you can submit; Discard final review feedback?; Evaluate approved project; Discard project evaluation? | n | y | src/components/projects/project-final-delivery-controls.tsx |
| OVERLAY-0151 | project-lifecycle-actions | dialog, confirm, toast | Review task submission | n | y | src/components/projects/project-lifecycle-actions.tsx |
| OVERLAY-0152 | project-meeting-controls | dialog, confirm, toast, form | Request a meeting; Discard meeting request?; Discard meeting changes?; Discard meeting note? | n | y | src/components/projects/project-meeting-controls.tsx |
| OVERLAY-0153 | project-mentor-reassignment | dialog, confirm, toast | Reassign ; Some workspaces were not reassigned | n | y | src/components/projects/project-mentor-reassignment.tsx |
| OVERLAY-0154 | project-readiness-override-form | confirm, form |  | n | y | src/components/projects/project-readiness-override-form.tsx |
| OVERLAY-0155 | project-resource-controls | dialog, confirm, toast, form | Discard this resource?; Edit resource; Discard resource changes?; Archive  | n | y | src/components/projects/project-resource-controls.tsx |
| OVERLAY-0156 | project-resource-files-panel | confirm, form | Discard resource changes? | n | y | src/components/projects/project-resource-files-panel.tsx |
| OVERLAY-0157 | project-task-submission-control | dialog, toast, form | Submit for review | n | y | src/components/projects/project-task-submission-control.tsx |
| OVERLAY-0158 | project-team-controls | dialog, confirm, toast, form | Add Project teammate; Find eligible member; Project member | n | y | src/components/projects/project-team-controls.tsx |
| OVERLAY-0159 | project-template-controls | dialog, toast, form | Create project template; Duplicate project template; Revoke college assignment?; Archive project template? | n | y | src/components/projects/project-template-controls.tsx |
| OVERLAY-0160 | super-admin-template-college-bulk | confirm | Template college bulk assignment | n | y | src/components/projects/super-admin-template-college-bulk.tsx |
| OVERLAY-0161 | template-metadata-edit-control | dialog, toast, form | Revise draft metadata | n | y | src/components/projects/template-metadata-edit-control.tsx |
| OVERLAY-0162 | learner-notification-bell | aria-dialog | Notifications; Assignments due soon | n | y | src/components/shell/learner-notification-bell.tsx |
| OVERLAY-0163 | mobile-navigation | aria-dialog | Open navigation menu; Close navigation; Navigation menu; Close navigation | n | y | src/components/shell/mobile-navigation.tsx |
| OVERLAY-0164 | route-announcer | aria-dialog |  | n | y | src/components/shell/route-announcer.tsx |
| OVERLAY-0165 | recruiter-lead-csv-import | aria-dialog, table | Import recruiter leads; Import preview groups; Include row  | n | y | src/components/tpo/recruiter-lead-csv-import.tsx |
| OVERLAY-0166 | recruiter-lead-detail-workspace | aria-dialog, form | Company; Interaction type; Call outcome; Edit contact details | n | y | src/components/tpo/recruiter-lead-detail-workspace.tsx |
| OVERLAY-0167 | recruiter-leads-workspace | dialog, confirm, table, form, disclosure | Recruiter leads; Needs doing; Engage views; Active recruiter filters | y | n | src/components/tpo/recruiter-leads-workspace.tsx |
| OVERLAY-0168 | tpo-academic-import-workspace | dialog, table | Import academic details; Include ; Import verified academic details | n | y | src/components/tpo/tpo-academic-import-workspace.tsx |
| OVERLAY-0169 | tpo-after-college-bulk-editor | dialog | After college bulk actions | n | y | src/components/tpo/tpo-after-college-bulk-editor.tsx |
| OVERLAY-0170 | tpo-after-college-editor | dialog | After college for  | n | y | src/components/tpo/tpo-after-college-editor.tsx |
| OVERLAY-0171 | tpo-batch-class-decision | confirm | Set this class to  | n | y | src/components/tpo/tpo-batch-class-decision.tsx |
| OVERLAY-0172 | tpo-batch-eligibility-import | confirm, native-dialog | Import eligibility decisions; Import preview filters; Import preview pages; Discard import review? | n | y | src/components/tpo/tpo-batch-eligibility-import.tsx |
| OVERLAY-0173 | tpo-batch-inline-decision | native-dialog | Learner eligibility override; Mark learner ineligible; Common ineligibility reasons; Reason for ineligibility | n | y | src/components/tpo/tpo-batch-inline-decision.tsx |
| OVERLAY-0174 | tpo-batch-invitation-control | confirm | Registration deadline; Registration deadline; Remove the registration deadline?; Invite batch | n | y | src/components/tpo/tpo-batch-invitation-control.tsx |
| OVERLAY-0175 | tpo-batch-rule-editor | confirm | Batch placement rules; Counts as placed when; Discard your unsaved batch-rule changes? | n | y | src/components/tpo/tpo-batch-rule-editor.tsx |
| OVERLAY-0176 | tpo-batch-student-saved-views | confirm | BATCH_STUDENTS saved views; Pinned batch views; Delete this saved batch view? | n | y | src/components/tpo/tpo-batch-student-saved-views.tsx |
| OVERLAY-0177 | tpo-bell-panel | drawer | Notifications, ; Notifications | n | y | src/components/tpo/tpo-bell-panel.tsx |
| OVERLAY-0178 | tpo-bulk-action-panel | dialog, disclosure | Ineligibility reason presets; Actions window; Share selected applicants with the company; Selected applicant share URL | n | y | src/components/tpo/tpo-bulk-action-panel.tsx |
| OVERLAY-0179 | tpo-campaign-send-control | confirm | Campaign send; Send to up to  | y | n | src/components/tpo/tpo-campaign-send-control.tsx |
| OVERLAY-0180 | tpo-company-create-form | aria-dialog, form | Add placement company | n | y | src/components/tpo/tpo-company-create-form.tsx |
| OVERLAY-0181 | tpo-company-team-conversation | confirm, form | Company Team conversation for ; Pinned company Team decisions; Company Team messages; Delete this message? | n | y | src/components/tpo/tpo-company-team-conversation.tsx |
| OVERLAY-0182 | tpo-due-followup-workspace | confirm | Schedule this follow-up and record an immutable staff audit entry? | n | n | src/components/tpo/tpo-due-followup-workspace.tsx |
| OVERLAY-0183 | tpo-find-shortcut | dialog | Find a student, recruiter or company; Matching records | n | y | src/components/tpo/tpo-find-shortcut.tsx |
| OVERLAY-0184 | tpo-grid-filter-panel | sheet | Active student filters; Remove ; Filter students; Filter students | n | n | src/components/tpo/tpo-grid-filter-panel.tsx |
| OVERLAY-0185 | tpo-keyboard-shortcuts | drawer | Keyboard shortcuts; Keyboard shortcuts | n | y | src/components/tpo/tpo-keyboard-shortcuts.tsx |
| OVERLAY-0186 | tpo-mobile-footer | aria-dialog | TPO mobile footer; More TPO workspaces; More TPO workspaces | n | y | src/components/tpo/tpo-mobile-footer.tsx |
| OVERLAY-0187 | tpo-new-followup-modal | dialog, confirm, form | New follow-up; Discard this unfinished follow-up? | n | y | src/components/tpo/tpo-new-followup-modal.tsx |
| OVERLAY-0188 | tpo-new-recruiter-conversation | dialog, form | New message to a recruiter; Recruiter; Quick replies; New message | n | y | src/components/tpo/tpo-new-recruiter-conversation.tsx |
| OVERLAY-0189 | tpo-notice-composer-dialog | native-dialog |  | n | y | src/components/tpo/tpo-notice-composer-dialog.tsx |
| OVERLAY-0190 | tpo-notice-delete-confirm | aria-dialog, form |  | n | n | src/components/tpo/tpo-notice-delete-confirm.tsx |
| OVERLAY-0191 | tpo-public-join-link-card | confirm | Company email domain | n | y | src/components/tpo/tpo-public-join-link-card.tsx |
| OVERLAY-0192 | tpo-student-nudge-panel | dialog | Send a message to students; Send a message | n | y | src/components/tpo/tpo-student-nudge-panel.tsx |
| OVERLAY-0193 | tpo-student-quick-panel | aria-dialog | Student panel for ; Student panel pages | n | y | src/components/tpo/tpo-student-quick-panel.tsx |
| OVERLAY-0194 | tpo-student-saved-views | dialog | Select ; Delete saved view | n | y | src/components/tpo/tpo-student-saved-views.tsx |
| OVERLAY-0195 | tpo-students-assign-prep | dialog | Assign preparation course; Assign preparation course? | n | y | src/components/tpo/tpo-students-assign-prep.tsx |
| OVERLAY-0196 | tpo-students-bulk-add | dialog | Add selected students to a drive | n | y | src/components/tpo/tpo-students-bulk-add.tsx |
| OVERLAY-0197 | tpo-students-bulk-debar | dialog | Bulk student debarment | n | y | src/components/tpo/tpo-students-bulk-debar.tsx |
| OVERLAY-0198 | tpo-students-drive-visibility | dialog | Show or hide a drive for selected students; Confirm drive eligibility overrides? | n | y | src/components/tpo/tpo-students-drive-visibility.tsx |
| OVERLAY-0199 | tpo-team-ask-panel | aria-dialog, form | Asks here | n | n | src/components/tpo/tpo-team-ask-panel.tsx |
| OVERLAY-0200 | tpo-team-message-actions | aria-dialog, form | Delete this message? | n | n | src/components/tpo/tpo-team-message-actions.tsx |
| OVERLAY-0201 | tpo-timed-debar-control | dialog | Timed debarment | n | y | src/components/tpo/tpo-timed-debar-control.tsx |
| OVERLAY-0202 | audit-finding-status-action | confirm | Confirm tracker finding status | n | y | src/components/tracker/audit-finding-status-action.tsx |
| OVERLAY-0203 | independent-finding-actions | confirm | Finding actions; Save this finding update? An immutable audit event will be recorded. | n | y | src/components/tracker/independent-finding-actions.tsx |
| OVERLAY-0204 | tracker-live-logs-explorer | confirm, aria-dialog, disclosure | Live logs; Report for Claude | n | y | src/components/tracker/tracker-live-logs-explorer.tsx |
| OVERLAY-0205 | tracker-quick-report-launcher | aria-dialog, disclosure |  | n | y | src/components/tracker/tracker-quick-report-launcher.tsx |
| OVERLAY-0206 | tracker-telegram-manual-panel | dialog, confirm | Daily digest | n | y | src/components/tracker/tracker-telegram-manual-panel.tsx |
| OVERLAY-0207 | VerificationReviewDrawer | aria-dialog, table | Sequential verification progress; Previous verification decision; Verification history; Confirm verification decision | n | y | src/components/verification/VerificationReviewDrawer.tsx |

## Other interactive widgets (toasts, tooltips, menus, tabs, filters, uploads, tables, forms)

| Id | Component | Kinds | File |
|---|---|---|---|
| WIDGET-0001 | academics-create-panel | toast, form | src/components/academics/academics-create-panel.tsx |
| WIDGET-0002 | academics-overview | table | src/components/academics/academics-overview.tsx |
| WIDGET-0003 | college-academic-directory | table, form, disclosure | src/components/academics/college-academic-directory.tsx |
| WIDGET-0004 | college-hall-booking-action | form | src/components/academics/college-hall-booking-action.tsx |
| WIDGET-0005 | college-structure-directory | table, form, disclosure | src/components/academics/college-structure-directory.tsx |
| WIDGET-0006 | learner-class-schedule | disclosure | src/components/academics/learner-class-schedule.tsx |
| WIDGET-0007 | section-operations | toast, table | src/components/academics/section-operations.tsx |
| WIDGET-0008 | activity-center | disclosure | src/components/activity/activity-center.tsx |
| WIDGET-0009 | notification-list | toast | src/components/activity/notification-list.tsx |
| WIDGET-0010 | notification-toolbar | toast | src/components/activity/notification-toolbar.tsx |
| WIDGET-0011 | academic-module-scope-inventory | table | src/components/admin/academic-module-scope-inventory.tsx |
| WIDGET-0012 | admin-program-directory | toast, table, form | src/components/admin/admin-program-directory.tsx |
| WIDGET-0013 | admin-scoped-read-page | form | src/components/admin/admin-scoped-read-page.tsx |
| WIDGET-0014 | college-branding-form | toast, form | src/components/admin/college-branding-form.tsx |
| WIDGET-0015 | college-create-form | form, disclosure | src/components/admin/college-create-form.tsx |
| WIDGET-0016 | college-setup-checklist | disclosure | src/components/admin/college-setup-checklist.tsx |
| WIDGET-0017 | department-create-form | form | src/components/admin/department-create-form.tsx |
| WIDGET-0018 | department-directory | table | src/components/admin/department-directory.tsx |
| WIDGET-0019 | organization-create-form | toast, form | src/components/admin/organization-create-form.tsx |
| WIDGET-0020 | super-admin-college-company-actions | form | src/components/admin/super-admin-college-company-actions.tsx |
| WIDGET-0021 | super-admin-company-edit | form | src/components/admin/super-admin-company-edit.tsx |
| WIDGET-0022 | super-admin-company-identities | form | src/components/admin/super-admin-company-identities.tsx |
| WIDGET-0023 | super-admin-faculty-assignment-create | form | src/components/admin/super-admin-faculty-assignment-create.tsx |
| WIDGET-0024 | super-admin-faculty-bulk-import | table | src/components/admin/super-admin-faculty-bulk-import.tsx |
| WIDGET-0025 | super-admin-interview-operations | table | src/components/admin/super-admin-interview-operations.tsx |
| WIDGET-0026 | super-admin-placement-oversight-nav | disclosure | src/components/admin/super-admin-placement-oversight-nav.tsx |
| WIDGET-0027 | learner-attendance-workspace | table, disclosure | src/components/attendance/learner-attendance-workspace.tsx |
| WIDGET-0028 | login-form | form | src/components/auth/login-form.tsx |
| WIDGET-0029 | college-admin-profile-editor | form | src/components/college/college-admin-profile-editor.tsx |
| WIDGET-0030 | college-department-insights | table, form | src/components/college/college-department-insights.tsx |
| WIDGET-0031 | college-faculty-assignment-actions | form | src/components/college/college-faculty-assignment-actions.tsx |
| WIDGET-0032 | college-faculty-csv-import | table | src/components/college/college-faculty-csv-import.tsx |
| WIDGET-0033 | college-role-directory-workspace | table, form, disclosure | src/components/college/college-role-directory-workspace.tsx |
| WIDGET-0034 | college-student-csv-import | table | src/components/college/college-student-csv-import.tsx |
| WIDGET-0035 | college-student-register-form | form | src/components/college/college-student-register-form.tsx |
| WIDGET-0036 | college-contact-profile-form | form | src/components/colleges/college-contact-profile-form.tsx |
| WIDGET-0037 | admin-assessment-read-directory | form | src/components/courses/admin-assessment-read-directory.tsx |
| WIDGET-0038 | admin-course-display-editor | toast | src/components/courses/admin-course-display-editor.tsx |
| WIDGET-0039 | admin-course-overview | table, form | src/components/courses/admin-course-overview.tsx |
| WIDGET-0040 | admin-offering-section-preview | form | src/components/courses/admin-offering-section-preview.tsx |
| WIDGET-0041 | college-assessment-aggregate | table, form | src/components/courses/college-assessment-aggregate.tsx |
| WIDGET-0042 | college-content-aggregate | table, form | src/components/courses/college-content-aggregate.tsx |
| WIDGET-0043 | college-learner-progress-report | table, form | src/components/courses/college-learner-progress-report.tsx |
| WIDGET-0044 | college-learning-directory | table, form | src/components/courses/college-learning-directory.tsx |
| WIDGET-0045 | college-lesson-drag-order | toast | src/components/courses/college-lesson-drag-order.tsx |
| WIDGET-0046 | college-lesson-visibility-controls | disclosure | src/components/courses/college-lesson-visibility-controls.tsx |
| WIDGET-0047 | college-live-classes-directory | form | src/components/courses/college-live-classes-directory.tsx |
| WIDGET-0048 | college-quiz-attempts | disclosure | src/components/courses/college-quiz-attempts.tsx |
| WIDGET-0049 | faculty-assessment-overview | disclosure | src/components/courses/faculty-assessment-overview.tsx |
| WIDGET-0050 | faculty-content-order-editor | toast | src/components/courses/faculty-content-order-editor.tsx |
| WIDGET-0051 | faculty-course-home-signals | disclosure | src/components/courses/faculty-course-home-signals.tsx |
| WIDGET-0052 | faculty-course-list | form, disclosure | src/components/courses/faculty-course-list.tsx |
| WIDGET-0053 | faculty-course-workspace | disclosure | src/components/courses/faculty-course-workspace.tsx |
| WIDGET-0054 | faculty-report-student-table | table | src/components/courses/faculty-report-student-table.tsx |
| WIDGET-0055 | learner-course-attendance | table | src/components/courses/learner-course-attendance.tsx |
| WIDGET-0056 | learner-course-list | disclosure | src/components/courses/learner-course-list.tsx |
| WIDGET-0057 | learner-course-workspace | disclosure | src/components/courses/learner-course-workspace.tsx |
| WIDGET-0058 | quiz-attempt-control | disclosure | src/components/courses/quiz-attempt-control.tsx |
| WIDGET-0059 | super-admin-content-directory-page | form | src/components/courses/super-admin-content-directory-page.tsx |
| WIDGET-0060 | super-admin-lesson-create | form | src/components/courses/super-admin-lesson-create.tsx |
| WIDGET-0061 | college-slot-manager | form | src/components/electives/college-slot-manager.tsx |
| WIDGET-0062 | college-group-import-preview | table, form | src/components/groups/college-group-import-preview.tsx |
| WIDGET-0063 | recruiter-conversation-reply-form | form | src/components/hr/recruiter-conversation-reply-form.tsx |
| WIDGET-0064 | recruiter-designation-editor | form | src/components/hr/recruiter-designation-editor.tsx |
| WIDGET-0065 | recruiter-display-name-editor | form | src/components/hr/recruiter-display-name-editor.tsx |
| WIDGET-0066 | recruiter-private-rating-editor | form | src/components/hr/recruiter-private-rating-editor.tsx |
| WIDGET-0067 | recruiter-profile-details-editor | form | src/components/hr/recruiter-profile-details-editor.tsx |
| WIDGET-0068 | applicant-notes-panel | form | src/components/placements/applicant-notes-panel.tsx |
| WIDGET-0069 | campaign-unsubscribe-confirm | form | src/components/placements/campaign-unsubscribe-confirm.tsx |
| WIDGET-0070 | college-company-create | form | src/components/placements/college-company-create.tsx |
| WIDGET-0071 | college-drive-attention-cards | disclosure | src/components/placements/college-drive-attention-cards.tsx |
| WIDGET-0072 | college-hiring-funnel | table, form | src/components/placements/college-hiring-funnel.tsx |
| WIDGET-0073 | drive-day-roster | toast | src/components/placements/drive-day-roster.tsx |
| WIDGET-0074 | learner-jobs-browse | disclosure | src/components/placements/learner-jobs-browse.tsx |
| WIDGET-0075 | learner-placement-academic-evidence | toast, form | src/components/placements/learner-placement-academic-evidence.tsx |
| WIDGET-0076 | learner-placement-preferences | toast | src/components/placements/learner-placement-preferences.tsx |
| WIDGET-0077 | learner-placement-requests | toast | src/components/placements/learner-placement-requests.tsx |
| WIDGET-0078 | placement-calendar-workspace | form | src/components/placements/placement-calendar-workspace.tsx |
| WIDGET-0079 | placement-candidate-evidence-editor | toast, form, disclosure | src/components/placements/placement-candidate-evidence-editor.tsx |
| WIDGET-0080 | placement-draft-edit-form | toast, form, disclosure | src/components/placements/placement-draft-edit-form.tsx |
| WIDGET-0081 | placement-drive-day-overview | table | src/components/placements/placement-drive-day-overview.tsx |
| WIDGET-0082 | placement-drive-workspace | disclosure | src/components/placements/placement-drive-workspace.tsx |
| WIDGET-0083 | placement-job-create-form | toast, form | src/components/placements/placement-job-create-form.tsx |
| WIDGET-0084 | placement-job-create-workspace | disclosure | src/components/placements/placement-job-create-workspace.tsx |
| WIDGET-0085 | placement-job-lifecycle-controls | toast | src/components/placements/placement-job-lifecycle-controls.tsx |
| WIDGET-0086 | placement-operations-overview | form | src/components/placements/placement-operations-overview.tsx |
| WIDGET-0087 | placement-recruiter-access | toast | src/components/placements/placement-recruiter-access.tsx |
| WIDGET-0088 | placement-report-ui | form | src/components/placements/placement-report-ui.tsx |
| WIDGET-0089 | placement-request-queue | toast | src/components/placements/placement-request-queue.tsx |
| WIDGET-0090 | placement-role-options | toast | src/components/placements/placement-role-options.tsx |
| WIDGET-0091 | placement-season-manager | toast, form | src/components/placements/placement-season-manager.tsx |
| WIDGET-0092 | public-recruit-from-us | form | src/components/placements/public-recruit-from-us.tsx |
| WIDGET-0093 | public-recruiter-join-form | form | src/components/placements/public-recruiter-join-form.tsx |
| WIDGET-0094 | recorded-outside-form | form | src/components/placements/recorded-outside-form.tsx |
| WIDGET-0095 | recruiter-interview-slot-form | form | src/components/placements/recruiter-interview-slot-form.tsx |
| WIDGET-0096 | report-interactive-table | table, disclosure | src/components/placements/report-interactive-table.tsx |
| WIDGET-0097 | super-admin-drive-archive | form | src/components/placements/super-admin-drive-archive.tsx |
| WIDGET-0098 | super-admin-drive-deadline | form | src/components/placements/super-admin-drive-deadline.tsx |
| WIDGET-0099 | super-admin-published-drive-edit | form | src/components/placements/super-admin-published-drive-edit.tsx |
| WIDGET-0100 | tpo-applicant-review-form | form | src/components/placements/tpo-applicant-review-form.tsx |
| WIDGET-0101 | tpo-calendar-followup-actions | form | src/components/placements/tpo-calendar-followup-actions.tsx |
| WIDGET-0102 | tpo-drive-cancel-form | form | src/components/placements/tpo-drive-cancel-form.tsx |
| WIDGET-0103 | tpo-drive-workspace-nav | disclosure | src/components/placements/tpo-drive-workspace-nav.tsx |
| WIDGET-0104 | tpo-interview-reschedule-form | form | src/components/placements/tpo-interview-reschedule-form.tsx |
| WIDGET-0105 | tpo-report-saved-filters | disclosure | src/components/placements/tpo-report-saved-filters.tsx |
| WIDGET-0106 | tpo-request-page-clipboard | table, disclosure | src/components/placements/tpo-request-page-clipboard.tsx |
| WIDGET-0107 | tpo-round-drive-day-read-only | table | src/components/placements/tpo-round-drive-day-read-only.tsx |
| WIDGET-0108 | admin-readiness-workspace-picker | form | src/components/projects/admin-readiness-workspace-picker.tsx |
| WIDGET-0109 | class-team-workspace-creator | table | src/components/projects/class-team-workspace-creator.tsx |
| WIDGET-0110 | college-project-summary-editor-full | form | src/components/projects/college-project-summary-editor-full.tsx |
| WIDGET-0111 | learner-own-task-controls | form | src/components/projects/learner-own-task-controls.tsx |
| WIDGET-0112 | learner-project-activity | form | src/components/projects/learner-project-activity.tsx |
| WIDGET-0113 | learner-project-board-search | form, disclosure | src/components/projects/learner-project-board-search.tsx |
| WIDGET-0114 | learner-project-mobile-filters | form, disclosure | src/components/projects/learner-project-mobile-filters.tsx |
| WIDGET-0115 | learner-task-progress-control | toast | src/components/projects/learner-task-progress-control.tsx |
| WIDGET-0116 | mentor-lane-board | disclosure | src/components/projects/mentor-lane-board.tsx |
| WIDGET-0117 | mentor-project-tabs | tabs | src/components/projects/mentor-project-tabs.tsx |
| WIDGET-0118 | mentor-task-allocation | table | src/components/projects/mentor-task-allocation.tsx |
| WIDGET-0119 | project-admin-audit-page | form | src/components/projects/project-admin-audit-page.tsx |
| WIDGET-0120 | project-admin-collection-controls | form | src/components/projects/project-admin-collection-controls.tsx |
| WIDGET-0121 | project-admin-readiness-page | table | src/components/projects/project-admin-readiness-page.tsx |
| WIDGET-0122 | project-admin-reassign-mentor-page | form | src/components/projects/project-admin-reassign-mentor-page.tsx |
| WIDGET-0123 | project-admin-submissions-page | table | src/components/projects/project-admin-submissions-page.tsx |
| WIDGET-0124 | project-admin-workspace-list | table | src/components/projects/project-admin-workspace-list.tsx |
| WIDGET-0125 | project-participant-list-controls | form | src/components/projects/project-participant-list-controls.tsx |
| WIDGET-0126 | project-workspace | disclosure | src/components/projects/project-workspace.tsx |
| WIDGET-0127 | super-admin-template-create-form | form | src/components/projects/super-admin-template-create-form.tsx |
| WIDGET-0128 | super-admin-template-plan-editor | form | src/components/projects/super-admin-template-plan-editor.tsx |
| WIDGET-0129 | super-admin-template-subview-page | table | src/components/projects/super-admin-template-subview-page.tsx |
| WIDGET-0130 | recruiter-roster-display-controls | disclosure | src/components/tpo/recruiter-roster-display-controls.tsx |
| WIDGET-0131 | tpo-audit-grid | table | src/components/tpo/tpo-audit-grid.tsx |
| WIDGET-0132 | tpo-audit-saved-views | disclosure | src/components/tpo/tpo-audit-saved-views.tsx |
| WIDGET-0133 | tpo-batch-facet-filters | form, disclosure | src/components/tpo/tpo-batch-facet-filters.tsx |
| WIDGET-0134 | tpo-blocked-dates-editor | form, disclosure | src/components/tpo/tpo-blocked-dates-editor.tsx |
| WIDGET-0135 | tpo-builtin-job-types-editor | table | src/components/tpo/tpo-builtin-job-types-editor.tsx |
| WIDGET-0136 | tpo-bulk-action-preview | disclosure | src/components/tpo/tpo-bulk-action-preview.tsx |
| WIDGET-0137 | tpo-campaign-compose | form | src/components/tpo/tpo-campaign-compose.tsx |
| WIDGET-0138 | tpo-company-memory-workspace | table, disclosure | src/components/tpo/tpo-company-memory-workspace.tsx |
| WIDGET-0139 | tpo-company-team-composer | form | src/components/tpo/tpo-company-team-composer.tsx |
| WIDGET-0140 | tpo-company-visibility-editor | disclosure | src/components/tpo/tpo-company-visibility-editor.tsx |
| WIDGET-0141 | tpo-debar-control | form | src/components/tpo/tpo-debar-control.tsx |
| WIDGET-0142 | tpo-draft-drive-step-one-form | form | src/components/tpo/tpo-draft-drive-step-one-form.tsx |
| WIDGET-0143 | tpo-everyone-controls | form | src/components/tpo/tpo-everyone-controls.tsx |
| WIDGET-0144 | tpo-job-types-editor | form | src/components/tpo/tpo-job-types-editor.tsx |
| WIDGET-0145 | tpo-notice-read-progress | disclosure | src/components/tpo/tpo-notice-read-progress.tsx |
| WIDGET-0146 | tpo-notice-undo-toast | form | src/components/tpo/tpo-notice-undo-toast.tsx |
| WIDGET-0147 | tpo-participation-decision-form | form | src/components/tpo/tpo-participation-decision-form.tsx |
| WIDGET-0148 | tpo-recruiter-message-reply | form | src/components/tpo/tpo-recruiter-message-reply.tsx |
| WIDGET-0149 | tpo-spreadsheet-grid | table, disclosure | src/components/tpo/tpo-spreadsheet-grid.tsx |
| WIDGET-0150 | tpo-students-spreadsheet | disclosure | src/components/tpo/tpo-students-spreadsheet.tsx |
| WIDGET-0151 | tpo-team-away-form | form | src/components/tpo/tpo-team-away-form.tsx |
| WIDGET-0152 | tpo-team-forms | form | src/components/tpo/tpo-team-forms.tsx |
| WIDGET-0153 | tpo-team-rename | form | src/components/tpo/tpo-team-rename.tsx |
| WIDGET-0154 | tpo-topbar-new-menu | disclosure | src/components/tpo/tpo-topbar-new-menu.tsx |
| WIDGET-0155 | known-errors-workspace | toast | src/components/tracker/known-errors-workspace.tsx |
| WIDGET-0156 | tracker-report-form | form | src/components/tracker/tracker-report-form.tsx |
| WIDGET-0157 | tracker-workflow-panel | toast | src/components/tracker/tracker-workflow-panel.tsx |
| WIDGET-0158 | SuperAdminVerificationPanel | toast | src/components/verification/SuperAdminVerificationPanel.tsx |
| WIDGET-0159 | TpoVerificationPanel | toast | src/components/verification/TpoVerificationPanel.tsx |
| WIDGET-0160 | VerificationFilterPanel | form, disclosure | src/components/verification/VerificationFilterPanel.tsx |

## Route states (loading, error, not-found)

| Id | State | File |
|---|---|---|
| ROUTE-STATE-0001 | error | src/app/(authenticated)/account/security/error.tsx |
| ROUTE-STATE-0002 | loading | src/app/(authenticated)/account/security/loading.tsx |
| ROUTE-STATE-0003 | error | src/app/(authenticated)/activity/[eventId]/error.tsx |
| ROUTE-STATE-0004 | loading | src/app/(authenticated)/activity/[eventId]/loading.tsx |
| ROUTE-STATE-0005 | error | src/app/(authenticated)/activity/error.tsx |
| ROUTE-STATE-0006 | loading | src/app/(authenticated)/activity/loading.tsx |
| ROUTE-STATE-0007 | error | src/app/(authenticated)/admin/academics/error.tsx |
| ROUTE-STATE-0008 | loading | src/app/(authenticated)/admin/academics/loading.tsx |
| ROUTE-STATE-0009 | error | src/app/(authenticated)/admin/academics/sections/[sectionId]/error.tsx |
| ROUTE-STATE-0010 | loading | src/app/(authenticated)/admin/academics/sections/[sectionId]/loading.tsx |
| ROUTE-STATE-0011 | error | src/app/(authenticated)/admin/announcements/error.tsx |
| ROUTE-STATE-0012 | loading | src/app/(authenticated)/admin/announcements/loading.tsx |
| ROUTE-STATE-0013 | error | src/app/(authenticated)/admin/assignments/error.tsx |
| ROUTE-STATE-0014 | loading | src/app/(authenticated)/admin/assignments/loading.tsx |
| ROUTE-STATE-0015 | error | src/app/(authenticated)/admin/attendance/error.tsx |
| ROUTE-STATE-0016 | loading | src/app/(authenticated)/admin/attendance/loading.tsx |
| ROUTE-STATE-0017 | error | src/app/(authenticated)/admin/audit/error.tsx |
| ROUTE-STATE-0018 | loading | src/app/(authenticated)/admin/audit/loading.tsx |
| ROUTE-STATE-0019 | error | src/app/(authenticated)/admin/batch-promotion/error.tsx |
| ROUTE-STATE-0020 | loading | src/app/(authenticated)/admin/batch-promotion/loading.tsx |
| ROUTE-STATE-0021 | error | src/app/(authenticated)/admin/batches/[batchId]/students/error.tsx |
| ROUTE-STATE-0022 | loading | src/app/(authenticated)/admin/batches/[batchId]/students/loading.tsx |
| ROUTE-STATE-0023 | error | src/app/(authenticated)/admin/batches/error.tsx |
| ROUTE-STATE-0024 | loading | src/app/(authenticated)/admin/batches/loading.tsx |
| ROUTE-STATE-0025 | error | src/app/(authenticated)/admin/classes/error.tsx |
| ROUTE-STATE-0026 | loading | src/app/(authenticated)/admin/classes/loading.tsx |
| ROUTE-STATE-0027 | error | src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/error.tsx |
| ROUTE-STATE-0028 | error | src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/history/error.tsx |
| ROUTE-STATE-0029 | loading | src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/history/loading.tsx |
| ROUTE-STATE-0030 | loading | src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/loading.tsx |
| ROUTE-STATE-0031 | error | src/app/(authenticated)/admin/colleges/[collegeId]/admins/error.tsx |
| ROUTE-STATE-0032 | loading | src/app/(authenticated)/admin/colleges/[collegeId]/admins/loading.tsx |
| ROUTE-STATE-0033 | error | src/app/(authenticated)/admin/colleges/[collegeId]/branding/error.tsx |
| ROUTE-STATE-0034 | loading | src/app/(authenticated)/admin/colleges/[collegeId]/branding/loading.tsx |
| ROUTE-STATE-0035 | error | src/app/(authenticated)/admin/colleges/[collegeId]/error.tsx |
| ROUTE-STATE-0036 | loading | src/app/(authenticated)/admin/colleges/[collegeId]/loading.tsx |
| ROUTE-STATE-0037 | error | src/app/(authenticated)/admin/colleges/[collegeId]/readiness/error.tsx |
| ROUTE-STATE-0038 | loading | src/app/(authenticated)/admin/colleges/[collegeId]/readiness/loading.tsx |
| ROUTE-STATE-0039 | error | src/app/(authenticated)/admin/colleges/[collegeId]/signin/error.tsx |
| ROUTE-STATE-0040 | loading | src/app/(authenticated)/admin/colleges/[collegeId]/signin/loading.tsx |
| ROUTE-STATE-0041 | error | src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/error.tsx |
| ROUTE-STATE-0042 | loading | src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/loading.tsx |
| ROUTE-STATE-0043 | error | src/app/(authenticated)/admin/colleges/[collegeId]/verification/error.tsx |
| ROUTE-STATE-0044 | loading | src/app/(authenticated)/admin/colleges/[collegeId]/verification/loading.tsx |
| ROUTE-STATE-0045 | error | src/app/(authenticated)/admin/colleges/error.tsx |
| ROUTE-STATE-0046 | loading | src/app/(authenticated)/admin/colleges/loading.tsx |
| ROUTE-STATE-0047 | error | src/app/(authenticated)/admin/companies/[companyId]/drives/error.tsx |
| ROUTE-STATE-0048 | loading | src/app/(authenticated)/admin/companies/[companyId]/drives/loading.tsx |
| ROUTE-STATE-0049 | error | src/app/(authenticated)/admin/companies/error.tsx |
| ROUTE-STATE-0050 | loading | src/app/(authenticated)/admin/companies/loading.tsx |
| ROUTE-STATE-0051 | error | src/app/(authenticated)/admin/course-progress/error.tsx |
| ROUTE-STATE-0052 | loading | src/app/(authenticated)/admin/course-progress/loading.tsx |
| ROUTE-STATE-0053 | error | src/app/(authenticated)/admin/courses/error.tsx |
| ROUTE-STATE-0054 | loading | src/app/(authenticated)/admin/courses/loading.tsx |
| ROUTE-STATE-0055 | error | src/app/(authenticated)/admin/courses/offerings/[offeringId]/error.tsx |
| ROUTE-STATE-0056 | loading | src/app/(authenticated)/admin/courses/offerings/[offeringId]/loading.tsx |
| ROUTE-STATE-0057 | error | src/app/(authenticated)/admin/departments/error.tsx |
| ROUTE-STATE-0058 | loading | src/app/(authenticated)/admin/departments/loading.tsx |
| ROUTE-STATE-0059 | error | src/app/(authenticated)/admin/domains/error.tsx |
| ROUTE-STATE-0060 | loading | src/app/(authenticated)/admin/domains/loading.tsx |
| ROUTE-STATE-0061 | error | src/app/(authenticated)/admin/electives/error.tsx |
| ROUTE-STATE-0062 | loading | src/app/(authenticated)/admin/electives/loading.tsx |
| ROUTE-STATE-0063 | error | src/app/(authenticated)/admin/error.tsx |
| ROUTE-STATE-0064 | error | src/app/(authenticated)/admin/faculty-assignment/error.tsx |
| ROUTE-STATE-0065 | loading | src/app/(authenticated)/admin/faculty-assignment/loading.tsx |
| ROUTE-STATE-0066 | error | src/app/(authenticated)/admin/faculty/error.tsx |
| ROUTE-STATE-0067 | loading | src/app/(authenticated)/admin/faculty/loading.tsx |
| ROUTE-STATE-0068 | error | src/app/(authenticated)/admin/features/[collegeId]/error.tsx |
| ROUTE-STATE-0069 | error | src/app/(authenticated)/admin/features/[collegeId]/history/error.tsx |
| ROUTE-STATE-0070 | loading | src/app/(authenticated)/admin/features/[collegeId]/history/loading.tsx |
| ROUTE-STATE-0071 | loading | src/app/(authenticated)/admin/features/[collegeId]/loading.tsx |
| ROUTE-STATE-0072 | error | src/app/(authenticated)/admin/features/[collegeId]/students/[membershipId]/error.tsx |
| ROUTE-STATE-0073 | error | src/app/(authenticated)/admin/features/[collegeId]/students/[membershipId]/history/error.tsx |
| ROUTE-STATE-0074 | loading | src/app/(authenticated)/admin/features/[collegeId]/students/[membershipId]/history/loading.tsx |
| ROUTE-STATE-0075 | loading | src/app/(authenticated)/admin/features/[collegeId]/students/[membershipId]/loading.tsx |
| ROUTE-STATE-0076 | error | src/app/(authenticated)/admin/features/[collegeId]/trace/error.tsx |
| ROUTE-STATE-0077 | loading | src/app/(authenticated)/admin/features/[collegeId]/trace/loading.tsx |
| ROUTE-STATE-0078 | error | src/app/(authenticated)/admin/features/error.tsx |
| ROUTE-STATE-0079 | loading | src/app/(authenticated)/admin/features/loading.tsx |
| ROUTE-STATE-0080 | error | src/app/(authenticated)/admin/hr/error.tsx |
| ROUTE-STATE-0081 | loading | src/app/(authenticated)/admin/hr/loading.tsx |
| ROUTE-STATE-0082 | error | src/app/(authenticated)/admin/inbound-mail/error.tsx |
| ROUTE-STATE-0083 | loading | src/app/(authenticated)/admin/inbound-mail/loading.tsx |
| ROUTE-STATE-0084 | error | src/app/(authenticated)/admin/lecture-halls/[hallId]/error.tsx |
| ROUTE-STATE-0085 | loading | src/app/(authenticated)/admin/lecture-halls/[hallId]/loading.tsx |
| ROUTE-STATE-0086 | error | src/app/(authenticated)/admin/lecture-halls/error.tsx |
| ROUTE-STATE-0087 | loading | src/app/(authenticated)/admin/lecture-halls/loading.tsx |
| ROUTE-STATE-0088 | error | src/app/(authenticated)/admin/lessons/error.tsx |
| ROUTE-STATE-0089 | loading | src/app/(authenticated)/admin/lessons/loading.tsx |
| ROUTE-STATE-0090 | error | src/app/(authenticated)/admin/live-classes/error.tsx |
| ROUTE-STATE-0091 | loading | src/app/(authenticated)/admin/live-classes/loading.tsx |
| ROUTE-STATE-0092 | loading | src/app/(authenticated)/admin/loading.tsx |
| ROUTE-STATE-0093 | error | src/app/(authenticated)/admin/module-access/error.tsx |
| ROUTE-STATE-0094 | loading | src/app/(authenticated)/admin/module-access/loading.tsx |
| ROUTE-STATE-0095 | not-found | src/app/(authenticated)/admin/not-found.tsx |
| ROUTE-STATE-0096 | error | src/app/(authenticated)/admin/organizations/error.tsx |
| ROUTE-STATE-0097 | loading | src/app/(authenticated)/admin/organizations/loading.tsx |
| ROUTE-STATE-0098 | error | src/app/(authenticated)/admin/people/directory/[membershipId]/audit/error.tsx |
| ROUTE-STATE-0099 | loading | src/app/(authenticated)/admin/people/directory/[membershipId]/audit/loading.tsx |
| ROUTE-STATE-0100 | error | src/app/(authenticated)/admin/people/directory/[membershipId]/error.tsx |
| ROUTE-STATE-0101 | loading | src/app/(authenticated)/admin/people/directory/[membershipId]/loading.tsx |
| ROUTE-STATE-0102 | error | src/app/(authenticated)/admin/people/directory/error.tsx |
| ROUTE-STATE-0103 | loading | src/app/(authenticated)/admin/people/directory/loading.tsx |
| ROUTE-STATE-0104 | error | src/app/(authenticated)/admin/people/error.tsx |
| ROUTE-STATE-0105 | loading | src/app/(authenticated)/admin/people/loading.tsx |
| ROUTE-STATE-0106 | error | src/app/(authenticated)/admin/people/unassigned/error.tsx |
| ROUTE-STATE-0107 | loading | src/app/(authenticated)/admin/people/unassigned/loading.tsx |
| ROUTE-STATE-0108 | error | src/app/(authenticated)/admin/placements/analytics/error.tsx |
| ROUTE-STATE-0109 | loading | src/app/(authenticated)/admin/placements/analytics/loading.tsx |
| ROUTE-STATE-0110 | error | src/app/(authenticated)/admin/placements/applications/[applicationId]/error.tsx |
| ROUTE-STATE-0111 | loading | src/app/(authenticated)/admin/placements/applications/[applicationId]/loading.tsx |
| ROUTE-STATE-0112 | error | src/app/(authenticated)/admin/placements/applications/error.tsx |
| ROUTE-STATE-0113 | loading | src/app/(authenticated)/admin/placements/applications/loading.tsx |
| ROUTE-STATE-0114 | error | src/app/(authenticated)/admin/placements/calendar/error.tsx |
| ROUTE-STATE-0115 | loading | src/app/(authenticated)/admin/placements/calendar/loading.tsx |
| ROUTE-STATE-0116 | error | src/app/(authenticated)/admin/placements/drives/error.tsx |
| ROUTE-STATE-0117 | loading | src/app/(authenticated)/admin/placements/drives/loading.tsx |
| ROUTE-STATE-0118 | error | src/app/(authenticated)/admin/placements/error.tsx |
| ROUTE-STATE-0119 | error | src/app/(authenticated)/admin/placements/hiring/error.tsx |
| ROUTE-STATE-0120 | loading | src/app/(authenticated)/admin/placements/hiring/loading.tsx |
| ROUTE-STATE-0121 | error | src/app/(authenticated)/admin/placements/interviews/[roundId]/error.tsx |
| ROUTE-STATE-0122 | loading | src/app/(authenticated)/admin/placements/interviews/[roundId]/loading.tsx |
| ROUTE-STATE-0123 | error | src/app/(authenticated)/admin/placements/interviews/error.tsx |
| ROUTE-STATE-0124 | loading | src/app/(authenticated)/admin/placements/interviews/loading.tsx |
| ROUTE-STATE-0125 | error | src/app/(authenticated)/admin/placements/job-settings/[jobId]/error.tsx |
| ROUTE-STATE-0126 | loading | src/app/(authenticated)/admin/placements/job-settings/[jobId]/loading.tsx |
| ROUTE-STATE-0127 | error | src/app/(authenticated)/admin/placements/job-settings/error.tsx |
| ROUTE-STATE-0128 | loading | src/app/(authenticated)/admin/placements/job-settings/loading.tsx |
| ROUTE-STATE-0129 | error | src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/error.tsx |
| ROUTE-STATE-0130 | loading | src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/loading.tsx |
| ROUTE-STATE-0131 | error | src/app/(authenticated)/admin/placements/jobs/[jobId]/error.tsx |
| ROUTE-STATE-0132 | loading | src/app/(authenticated)/admin/placements/jobs/[jobId]/loading.tsx |
| ROUTE-STATE-0133 | error | src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/error.tsx |
| ROUTE-STATE-0134 | loading | src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/loading.tsx |
| ROUTE-STATE-0135 | error | src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/error.tsx |
| ROUTE-STATE-0136 | loading | src/app/(authenticated)/admin/placements/jobs/[jobId]/settings/loading.tsx |
| ROUTE-STATE-0137 | error | src/app/(authenticated)/admin/placements/joining/[offerId]/error.tsx |
| ROUTE-STATE-0138 | loading | src/app/(authenticated)/admin/placements/joining/[offerId]/loading.tsx |
| ROUTE-STATE-0139 | error | src/app/(authenticated)/admin/placements/joining/error.tsx |
| ROUTE-STATE-0140 | loading | src/app/(authenticated)/admin/placements/joining/loading.tsx |
| ROUTE-STATE-0141 | loading | src/app/(authenticated)/admin/placements/loading.tsx |
| ROUTE-STATE-0142 | error | src/app/(authenticated)/admin/placements/new/error.tsx |
| ROUTE-STATE-0143 | loading | src/app/(authenticated)/admin/placements/new/loading.tsx |
| ROUTE-STATE-0144 | error | src/app/(authenticated)/admin/placements/offers/[offerId]/error.tsx |
| ROUTE-STATE-0145 | loading | src/app/(authenticated)/admin/placements/offers/[offerId]/loading.tsx |
| ROUTE-STATE-0146 | error | src/app/(authenticated)/admin/placements/offers/error.tsx |
| ROUTE-STATE-0147 | loading | src/app/(authenticated)/admin/placements/offers/loading.tsx |
| ROUTE-STATE-0148 | error | src/app/(authenticated)/admin/placements/retention/error.tsx |
| ROUTE-STATE-0149 | loading | src/app/(authenticated)/admin/placements/retention/loading.tsx |
| ROUTE-STATE-0150 | error | src/app/(authenticated)/admin/placements/screenings/[applicationId]/error.tsx |
| ROUTE-STATE-0151 | loading | src/app/(authenticated)/admin/placements/screenings/[applicationId]/loading.tsx |
| ROUTE-STATE-0152 | error | src/app/(authenticated)/admin/placements/screenings/error.tsx |
| ROUTE-STATE-0153 | loading | src/app/(authenticated)/admin/placements/screenings/loading.tsx |
| ROUTE-STATE-0154 | error | src/app/(authenticated)/admin/placements/seasons/[seasonId]/error.tsx |
| ROUTE-STATE-0155 | loading | src/app/(authenticated)/admin/placements/seasons/[seasonId]/loading.tsx |
| ROUTE-STATE-0156 | error | src/app/(authenticated)/admin/placements/seasons/error.tsx |
| ROUTE-STATE-0157 | loading | src/app/(authenticated)/admin/placements/seasons/loading.tsx |
| ROUTE-STATE-0158 | error | src/app/(authenticated)/admin/placements/shortlisted/[applicationId]/error.tsx |
| ROUTE-STATE-0159 | loading | src/app/(authenticated)/admin/placements/shortlisted/[applicationId]/loading.tsx |
| ROUTE-STATE-0160 | error | src/app/(authenticated)/admin/placements/shortlisted/error.tsx |
| ROUTE-STATE-0161 | loading | src/app/(authenticated)/admin/placements/shortlisted/loading.tsx |
| ROUTE-STATE-0162 | error | src/app/(authenticated)/admin/placements/student-lookup/error.tsx |
| ROUTE-STATE-0163 | loading | src/app/(authenticated)/admin/placements/student-lookup/loading.tsx |
| ROUTE-STATE-0164 | error | src/app/(authenticated)/admin/programs/error.tsx |
| ROUTE-STATE-0165 | loading | src/app/(authenticated)/admin/programs/loading.tsx |
| ROUTE-STATE-0166 | error | src/app/(authenticated)/admin/projects/[projectId]/[section]/error.tsx |
| ROUTE-STATE-0167 | loading | src/app/(authenticated)/admin/projects/[projectId]/[section]/loading.tsx |
| ROUTE-STATE-0168 | error | src/app/(authenticated)/admin/projects/[projectId]/error.tsx |
| ROUTE-STATE-0169 | loading | src/app/(authenticated)/admin/projects/[projectId]/loading.tsx |
| ROUTE-STATE-0170 | error | src/app/(authenticated)/admin/projects/[projectId]/readiness/error.tsx |
| ROUTE-STATE-0171 | loading | src/app/(authenticated)/admin/projects/[projectId]/readiness/loading.tsx |
| ROUTE-STATE-0172 | error | src/app/(authenticated)/admin/projects/at-risk/error.tsx |
| ROUTE-STATE-0173 | loading | src/app/(authenticated)/admin/projects/at-risk/loading.tsx |
| ROUTE-STATE-0174 | error | src/app/(authenticated)/admin/projects/audit/error.tsx |
| ROUTE-STATE-0175 | loading | src/app/(authenticated)/admin/projects/audit/loading.tsx |
| ROUTE-STATE-0176 | error | src/app/(authenticated)/admin/projects/error.tsx |
| ROUTE-STATE-0177 | loading | src/app/(authenticated)/admin/projects/loading.tsx |
| ROUTE-STATE-0178 | error | src/app/(authenticated)/admin/projects/readiness/error.tsx |
| ROUTE-STATE-0179 | loading | src/app/(authenticated)/admin/projects/readiness/loading.tsx |
| ROUTE-STATE-0180 | error | src/app/(authenticated)/admin/projects/reassign-mentor/error.tsx |
| ROUTE-STATE-0181 | loading | src/app/(authenticated)/admin/projects/reassign-mentor/loading.tsx |
| ROUTE-STATE-0182 | error | src/app/(authenticated)/admin/projects/submissions/error.tsx |
| ROUTE-STATE-0183 | loading | src/app/(authenticated)/admin/projects/submissions/loading.tsx |
| ROUTE-STATE-0184 | error | src/app/(authenticated)/admin/projects/templates/[templateId]/colleges/error.tsx |
| ROUTE-STATE-0185 | loading | src/app/(authenticated)/admin/projects/templates/[templateId]/colleges/loading.tsx |
| ROUTE-STATE-0186 | error | src/app/(authenticated)/admin/projects/templates/[templateId]/error.tsx |
| ROUTE-STATE-0187 | loading | src/app/(authenticated)/admin/projects/templates/[templateId]/loading.tsx |
| ROUTE-STATE-0188 | error | src/app/(authenticated)/admin/projects/templates/[templateId]/overview/error.tsx |
| ROUTE-STATE-0189 | loading | src/app/(authenticated)/admin/projects/templates/[templateId]/overview/loading.tsx |
| ROUTE-STATE-0190 | error | src/app/(authenticated)/admin/projects/templates/[templateId]/resources/error.tsx |
| ROUTE-STATE-0191 | loading | src/app/(authenticated)/admin/projects/templates/[templateId]/resources/loading.tsx |
| ROUTE-STATE-0192 | error | src/app/(authenticated)/admin/projects/templates/[templateId]/sprints/error.tsx |
| ROUTE-STATE-0193 | loading | src/app/(authenticated)/admin/projects/templates/[templateId]/sprints/loading.tsx |
| ROUTE-STATE-0194 | error | src/app/(authenticated)/admin/projects/templates/[templateId]/tasks/error.tsx |
| ROUTE-STATE-0195 | loading | src/app/(authenticated)/admin/projects/templates/[templateId]/tasks/loading.tsx |
| ROUTE-STATE-0196 | error | src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/error.tsx |
| ROUTE-STATE-0197 | loading | src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/loading.tsx |
| ROUTE-STATE-0198 | error | src/app/(authenticated)/admin/projects/templates/[templateId]/versions/error.tsx |
| ROUTE-STATE-0199 | loading | src/app/(authenticated)/admin/projects/templates/[templateId]/versions/loading.tsx |
| ROUTE-STATE-0200 | error | src/app/(authenticated)/admin/projects/templates/error.tsx |
| ROUTE-STATE-0201 | loading | src/app/(authenticated)/admin/projects/templates/loading.tsx |
| ROUTE-STATE-0202 | error | src/app/(authenticated)/admin/projects/templates/new/error.tsx |
| ROUTE-STATE-0203 | loading | src/app/(authenticated)/admin/projects/templates/new/loading.tsx |
| ROUTE-STATE-0204 | error | src/app/(authenticated)/admin/projects/workspaces/new/error.tsx |
| ROUTE-STATE-0205 | loading | src/app/(authenticated)/admin/projects/workspaces/new/loading.tsx |
| ROUTE-STATE-0206 | error | src/app/(authenticated)/admin/quizzes/error.tsx |
| ROUTE-STATE-0207 | loading | src/app/(authenticated)/admin/quizzes/loading.tsx |
| ROUTE-STATE-0208 | error | src/app/(authenticated)/admin/recruiters/error.tsx |
| ROUTE-STATE-0209 | loading | src/app/(authenticated)/admin/recruiters/loading.tsx |
| ROUTE-STATE-0210 | error | src/app/(authenticated)/admin/resources/error.tsx |
| ROUTE-STATE-0211 | loading | src/app/(authenticated)/admin/resources/loading.tsx |
| ROUTE-STATE-0212 | error | src/app/(authenticated)/admin/semester-courses/error.tsx |
| ROUTE-STATE-0213 | loading | src/app/(authenticated)/admin/semester-courses/loading.tsx |
| ROUTE-STATE-0214 | error | src/app/(authenticated)/admin/semesters/error.tsx |
| ROUTE-STATE-0215 | loading | src/app/(authenticated)/admin/semesters/loading.tsx |
| ROUTE-STATE-0216 | error | src/app/(authenticated)/admin/settings/auth/error.tsx |
| ROUTE-STATE-0217 | loading | src/app/(authenticated)/admin/settings/auth/loading.tsx |
| ROUTE-STATE-0218 | error | src/app/(authenticated)/admin/settings/error.tsx |
| ROUTE-STATE-0219 | loading | src/app/(authenticated)/admin/settings/loading.tsx |
| ROUTE-STATE-0220 | error | src/app/(authenticated)/admin/students/error.tsx |
| ROUTE-STATE-0221 | loading | src/app/(authenticated)/admin/students/loading.tsx |
| ROUTE-STATE-0222 | error | src/app/(authenticated)/admin/tenants/create/error.tsx |
| ROUTE-STATE-0223 | loading | src/app/(authenticated)/admin/tenants/create/loading.tsx |
| ROUTE-STATE-0224 | error | src/app/(authenticated)/admin/tenants/error.tsx |
| ROUTE-STATE-0225 | loading | src/app/(authenticated)/admin/tenants/loading.tsx |
| ROUTE-STATE-0226 | error | src/app/(authenticated)/admin/tenants/setup/error.tsx |
| ROUTE-STATE-0227 | loading | src/app/(authenticated)/admin/tenants/setup/loading.tsx |
| ROUTE-STATE-0228 | error | src/app/(authenticated)/admin/verification/error.tsx |
| ROUTE-STATE-0229 | loading | src/app/(authenticated)/admin/verification/loading.tsx |
| ROUTE-STATE-0230 | error | src/app/(authenticated)/admin/videos/error.tsx |
| ROUTE-STATE-0231 | loading | src/app/(authenticated)/admin/videos/loading.tsx |
| ROUTE-STATE-0232 | error | src/app/(authenticated)/college-admin/departments/error.tsx |
| ROUTE-STATE-0233 | loading | src/app/(authenticated)/college-admin/departments/loading.tsx |
| ROUTE-STATE-0234 | not-found | src/app/(authenticated)/college-admin/not-found.tsx |
| ROUTE-STATE-0235 | error | src/app/(authenticated)/college-admin/programs/error.tsx |
| ROUTE-STATE-0236 | loading | src/app/(authenticated)/college-admin/programs/loading.tsx |
| ROUTE-STATE-0237 | error | src/app/(authenticated)/college/academics/error.tsx |
| ROUTE-STATE-0238 | loading | src/app/(authenticated)/college/academics/loading.tsx |
| ROUTE-STATE-0239 | error | src/app/(authenticated)/college/academics/sections/[sectionId]/error.tsx |
| ROUTE-STATE-0240 | loading | src/app/(authenticated)/college/academics/sections/[sectionId]/loading.tsx |
| ROUTE-STATE-0241 | error | src/app/(authenticated)/college/activity/[eventId]/error.tsx |
| ROUTE-STATE-0242 | loading | src/app/(authenticated)/college/activity/[eventId]/loading.tsx |
| ROUTE-STATE-0243 | error | src/app/(authenticated)/college/activity/error.tsx |
| ROUTE-STATE-0244 | loading | src/app/(authenticated)/college/activity/loading.tsx |
| ROUTE-STATE-0245 | error | src/app/(authenticated)/college/announcements/error.tsx |
| ROUTE-STATE-0246 | loading | src/app/(authenticated)/college/announcements/loading.tsx |
| ROUTE-STATE-0247 | error | src/app/(authenticated)/college/assignments/error.tsx |
| ROUTE-STATE-0248 | loading | src/app/(authenticated)/college/assignments/loading.tsx |
| ROUTE-STATE-0249 | error | src/app/(authenticated)/college/attendance/corrections/error.tsx |
| ROUTE-STATE-0250 | loading | src/app/(authenticated)/college/attendance/corrections/loading.tsx |
| ROUTE-STATE-0251 | error | src/app/(authenticated)/college/attendance/departments/error.tsx |
| ROUTE-STATE-0252 | loading | src/app/(authenticated)/college/attendance/departments/loading.tsx |
| ROUTE-STATE-0253 | error | src/app/(authenticated)/college/attendance/error.tsx |
| ROUTE-STATE-0254 | loading | src/app/(authenticated)/college/attendance/loading.tsx |
| ROUTE-STATE-0255 | error | src/app/(authenticated)/college/attendance/settings/error.tsx |
| ROUTE-STATE-0256 | loading | src/app/(authenticated)/college/attendance/settings/loading.tsx |
| ROUTE-STATE-0257 | error | src/app/(authenticated)/college/batch-promotion/error.tsx |
| ROUTE-STATE-0258 | loading | src/app/(authenticated)/college/batch-promotion/loading.tsx |
| ROUTE-STATE-0259 | error | src/app/(authenticated)/college/batches/[cohortId]/students/error.tsx |
| ROUTE-STATE-0260 | loading | src/app/(authenticated)/college/batches/[cohortId]/students/loading.tsx |
| ROUTE-STATE-0261 | error | src/app/(authenticated)/college/batches/error.tsx |
| ROUTE-STATE-0262 | loading | src/app/(authenticated)/college/batches/loading.tsx |
| ROUTE-STATE-0263 | error | src/app/(authenticated)/college/branding/error.tsx |
| ROUTE-STATE-0264 | loading | src/app/(authenticated)/college/branding/loading.tsx |
| ROUTE-STATE-0265 | error | src/app/(authenticated)/college/classes/error.tsx |
| ROUTE-STATE-0266 | loading | src/app/(authenticated)/college/classes/loading.tsx |
| ROUTE-STATE-0267 | error | src/app/(authenticated)/college/classes/recurring-preview/error.tsx |
| ROUTE-STATE-0268 | loading | src/app/(authenticated)/college/classes/recurring-preview/loading.tsx |
| ROUTE-STATE-0269 | error | src/app/(authenticated)/college/college-profile/error.tsx |
| ROUTE-STATE-0270 | loading | src/app/(authenticated)/college/college-profile/loading.tsx |
| ROUTE-STATE-0271 | error | src/app/(authenticated)/college/companies/error.tsx |
| ROUTE-STATE-0272 | loading | src/app/(authenticated)/college/companies/loading.tsx |
| ROUTE-STATE-0273 | error | src/app/(authenticated)/college/contacts/[membershipId]/error.tsx |
| ROUTE-STATE-0274 | loading | src/app/(authenticated)/college/contacts/[membershipId]/loading.tsx |
| ROUTE-STATE-0275 | error | src/app/(authenticated)/college/contacts/error.tsx |
| ROUTE-STATE-0276 | loading | src/app/(authenticated)/college/contacts/loading.tsx |
| ROUTE-STATE-0277 | error | src/app/(authenticated)/college/course-progress/error.tsx |
| ROUTE-STATE-0278 | loading | src/app/(authenticated)/college/course-progress/loading.tsx |
| ROUTE-STATE-0279 | error | src/app/(authenticated)/college/courses/error.tsx |
| ROUTE-STATE-0280 | loading | src/app/(authenticated)/college/courses/loading.tsx |
| ROUTE-STATE-0281 | error | src/app/(authenticated)/college/courses/offerings/[offeringId]/error.tsx |
| ROUTE-STATE-0282 | loading | src/app/(authenticated)/college/courses/offerings/[offeringId]/loading.tsx |
| ROUTE-STATE-0283 | not-found | src/app/(authenticated)/college/courses/offerings/[offeringId]/not-found.tsx |
| ROUTE-STATE-0284 | error | src/app/(authenticated)/college/departments/error.tsx |
| ROUTE-STATE-0285 | loading | src/app/(authenticated)/college/departments/loading.tsx |
| ROUTE-STATE-0286 | error | src/app/(authenticated)/college/domains/error.tsx |
| ROUTE-STATE-0287 | loading | src/app/(authenticated)/college/domains/loading.tsx |
| ROUTE-STATE-0288 | error | src/app/(authenticated)/college/electives/[slotId]/allocate/error.tsx |
| ROUTE-STATE-0289 | loading | src/app/(authenticated)/college/electives/[slotId]/allocate/loading.tsx |
| ROUTE-STATE-0290 | error | src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/error.tsx |
| ROUTE-STATE-0291 | loading | src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/loading.tsx |
| ROUTE-STATE-0292 | error | src/app/(authenticated)/college/electives/error.tsx |
| ROUTE-STATE-0293 | loading | src/app/(authenticated)/college/electives/loading.tsx |
| ROUTE-STATE-0294 | error | src/app/(authenticated)/college/error.tsx |
| ROUTE-STATE-0295 | error | src/app/(authenticated)/college/faculty-assignment/error.tsx |
| ROUTE-STATE-0296 | loading | src/app/(authenticated)/college/faculty-assignment/loading.tsx |
| ROUTE-STATE-0297 | error | src/app/(authenticated)/college/faculty/[membershipId]/error.tsx |
| ROUTE-STATE-0298 | loading | src/app/(authenticated)/college/faculty/[membershipId]/loading.tsx |
| ROUTE-STATE-0299 | error | src/app/(authenticated)/college/faculty/error.tsx |
| ROUTE-STATE-0300 | error | src/app/(authenticated)/college/faculty/import/error.tsx |
| ROUTE-STATE-0301 | loading | src/app/(authenticated)/college/faculty/import/loading.tsx |
| ROUTE-STATE-0302 | loading | src/app/(authenticated)/college/faculty/loading.tsx |
| ROUTE-STATE-0303 | error | src/app/(authenticated)/college/groups/[groupId]/error.tsx |
| ROUTE-STATE-0304 | error | src/app/(authenticated)/college/groups/[groupId]/import-preview/error.tsx |
| ROUTE-STATE-0305 | loading | src/app/(authenticated)/college/groups/[groupId]/import-preview/loading.tsx |
| ROUTE-STATE-0306 | loading | src/app/(authenticated)/college/groups/[groupId]/loading.tsx |
| ROUTE-STATE-0307 | error | src/app/(authenticated)/college/groups/[groupId]/rule-preview/error.tsx |
| ROUTE-STATE-0308 | loading | src/app/(authenticated)/college/groups/[groupId]/rule-preview/loading.tsx |
| ROUTE-STATE-0309 | error | src/app/(authenticated)/college/groups/error.tsx |
| ROUTE-STATE-0310 | loading | src/app/(authenticated)/college/groups/loading.tsx |
| ROUTE-STATE-0311 | error | src/app/(authenticated)/college/hiring-dashboard/error.tsx |
| ROUTE-STATE-0312 | loading | src/app/(authenticated)/college/hiring-dashboard/loading.tsx |
| ROUTE-STATE-0313 | error | src/app/(authenticated)/college/lecture-halls/[hallId]/error.tsx |
| ROUTE-STATE-0314 | loading | src/app/(authenticated)/college/lecture-halls/[hallId]/loading.tsx |
| ROUTE-STATE-0315 | error | src/app/(authenticated)/college/lecture-halls/error.tsx |
| ROUTE-STATE-0316 | loading | src/app/(authenticated)/college/lecture-halls/loading.tsx |
| ROUTE-STATE-0317 | error | src/app/(authenticated)/college/lessons/error.tsx |
| ROUTE-STATE-0318 | loading | src/app/(authenticated)/college/lessons/loading.tsx |
| ROUTE-STATE-0319 | error | src/app/(authenticated)/college/live-classes/error.tsx |
| ROUTE-STATE-0320 | loading | src/app/(authenticated)/college/live-classes/loading.tsx |
| ROUTE-STATE-0321 | loading | src/app/(authenticated)/college/loading.tsx |
| ROUTE-STATE-0322 | not-found | src/app/(authenticated)/college/not-found.tsx |
| ROUTE-STATE-0323 | error | src/app/(authenticated)/college/people/error.tsx |
| ROUTE-STATE-0324 | loading | src/app/(authenticated)/college/people/loading.tsx |
| ROUTE-STATE-0325 | error | src/app/(authenticated)/college/people/manage/error.tsx |
| ROUTE-STATE-0326 | loading | src/app/(authenticated)/college/people/manage/loading.tsx |
| ROUTE-STATE-0327 | error | src/app/(authenticated)/college/placements/calendar/error.tsx |
| ROUTE-STATE-0328 | loading | src/app/(authenticated)/college/placements/calendar/loading.tsx |
| ROUTE-STATE-0329 | error | src/app/(authenticated)/college/placements/drives/error.tsx |
| ROUTE-STATE-0330 | loading | src/app/(authenticated)/college/placements/drives/loading.tsx |
| ROUTE-STATE-0331 | error | src/app/(authenticated)/college/placements/error.tsx |
| ROUTE-STATE-0332 | error | src/app/(authenticated)/college/placements/interviews/error.tsx |
| ROUTE-STATE-0333 | loading | src/app/(authenticated)/college/placements/interviews/loading.tsx |
| ROUTE-STATE-0334 | error | src/app/(authenticated)/college/placements/jobs/[jobId]/applications/error.tsx |
| ROUTE-STATE-0335 | loading | src/app/(authenticated)/college/placements/jobs/[jobId]/applications/loading.tsx |
| ROUTE-STATE-0336 | error | src/app/(authenticated)/college/placements/jobs/[jobId]/error.tsx |
| ROUTE-STATE-0337 | error | src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/error.tsx |
| ROUTE-STATE-0338 | loading | src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/loading.tsx |
| ROUTE-STATE-0339 | loading | src/app/(authenticated)/college/placements/jobs/[jobId]/loading.tsx |
| ROUTE-STATE-0340 | error | src/app/(authenticated)/college/placements/jobs/[jobId]/overview/error.tsx |
| ROUTE-STATE-0341 | loading | src/app/(authenticated)/college/placements/jobs/[jobId]/overview/loading.tsx |
| ROUTE-STATE-0342 | error | src/app/(authenticated)/college/placements/jobs/[jobId]/settings/error.tsx |
| ROUTE-STATE-0343 | loading | src/app/(authenticated)/college/placements/jobs/[jobId]/settings/loading.tsx |
| ROUTE-STATE-0344 | error | src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/error.tsx |
| ROUTE-STATE-0345 | loading | src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/loading.tsx |
| ROUTE-STATE-0346 | loading | src/app/(authenticated)/college/placements/loading.tsx |
| ROUTE-STATE-0347 | error | src/app/(authenticated)/college/placements/new/error.tsx |
| ROUTE-STATE-0348 | loading | src/app/(authenticated)/college/placements/new/loading.tsx |
| ROUTE-STATE-0349 | error | src/app/(authenticated)/college/placements/readiness-by-department/error.tsx |
| ROUTE-STATE-0350 | loading | src/app/(authenticated)/college/placements/readiness-by-department/loading.tsx |
| ROUTE-STATE-0351 | error | src/app/(authenticated)/college/placements/retention/error.tsx |
| ROUTE-STATE-0352 | loading | src/app/(authenticated)/college/placements/retention/loading.tsx |
| ROUTE-STATE-0353 | error | src/app/(authenticated)/college/placements/student-lookup/error.tsx |
| ROUTE-STATE-0354 | loading | src/app/(authenticated)/college/placements/student-lookup/loading.tsx |
| ROUTE-STATE-0355 | error | src/app/(authenticated)/college/profile/error.tsx |
| ROUTE-STATE-0356 | loading | src/app/(authenticated)/college/profile/loading.tsx |
| ROUTE-STATE-0357 | error | src/app/(authenticated)/college/programs/error.tsx |
| ROUTE-STATE-0358 | loading | src/app/(authenticated)/college/programs/loading.tsx |
| ROUTE-STATE-0359 | error | src/app/(authenticated)/college/projects/[projectId]/[section]/error.tsx |
| ROUTE-STATE-0360 | loading | src/app/(authenticated)/college/projects/[projectId]/[section]/loading.tsx |
| ROUTE-STATE-0361 | error | src/app/(authenticated)/college/projects/[projectId]/error.tsx |
| ROUTE-STATE-0362 | loading | src/app/(authenticated)/college/projects/[projectId]/loading.tsx |
| ROUTE-STATE-0363 | error | src/app/(authenticated)/college/projects/[projectId]/readiness/error.tsx |
| ROUTE-STATE-0364 | loading | src/app/(authenticated)/college/projects/[projectId]/readiness/loading.tsx |
| ROUTE-STATE-0365 | error | src/app/(authenticated)/college/projects/at-risk/error.tsx |
| ROUTE-STATE-0366 | loading | src/app/(authenticated)/college/projects/at-risk/loading.tsx |
| ROUTE-STATE-0367 | error | src/app/(authenticated)/college/projects/audit/error.tsx |
| ROUTE-STATE-0368 | loading | src/app/(authenticated)/college/projects/audit/loading.tsx |
| ROUTE-STATE-0369 | error | src/app/(authenticated)/college/projects/error.tsx |
| ROUTE-STATE-0370 | loading | src/app/(authenticated)/college/projects/loading.tsx |
| ROUTE-STATE-0371 | error | src/app/(authenticated)/college/projects/readiness/error.tsx |
| ROUTE-STATE-0372 | loading | src/app/(authenticated)/college/projects/readiness/loading.tsx |
| ROUTE-STATE-0373 | error | src/app/(authenticated)/college/projects/reassign-mentor/error.tsx |
| ROUTE-STATE-0374 | loading | src/app/(authenticated)/college/projects/reassign-mentor/loading.tsx |
| ROUTE-STATE-0375 | error | src/app/(authenticated)/college/projects/submissions/error.tsx |
| ROUTE-STATE-0376 | loading | src/app/(authenticated)/college/projects/submissions/loading.tsx |
| ROUTE-STATE-0377 | error | src/app/(authenticated)/college/projects/templates/[templateId]/error.tsx |
| ROUTE-STATE-0378 | loading | src/app/(authenticated)/college/projects/templates/[templateId]/loading.tsx |
| ROUTE-STATE-0379 | error | src/app/(authenticated)/college/projects/templates/error.tsx |
| ROUTE-STATE-0380 | loading | src/app/(authenticated)/college/projects/templates/loading.tsx |
| ROUTE-STATE-0381 | error | src/app/(authenticated)/college/projects/workspaces/[workspaceId]/[section]/error.tsx |
| ROUTE-STATE-0382 | loading | src/app/(authenticated)/college/projects/workspaces/[workspaceId]/[section]/loading.tsx |
| ROUTE-STATE-0383 | error | src/app/(authenticated)/college/projects/workspaces/[workspaceId]/error.tsx |
| ROUTE-STATE-0384 | loading | src/app/(authenticated)/college/projects/workspaces/[workspaceId]/loading.tsx |
| ROUTE-STATE-0385 | error | src/app/(authenticated)/college/projects/workspaces/error.tsx |
| ROUTE-STATE-0386 | loading | src/app/(authenticated)/college/projects/workspaces/loading.tsx |
| ROUTE-STATE-0387 | error | src/app/(authenticated)/college/projects/workspaces/new/error.tsx |
| ROUTE-STATE-0388 | loading | src/app/(authenticated)/college/projects/workspaces/new/loading.tsx |
| ROUTE-STATE-0389 | error | src/app/(authenticated)/college/quizzes/error.tsx |
| ROUTE-STATE-0390 | loading | src/app/(authenticated)/college/quizzes/loading.tsx |
| ROUTE-STATE-0391 | error | src/app/(authenticated)/college/resources/error.tsx |
| ROUTE-STATE-0392 | loading | src/app/(authenticated)/college/resources/loading.tsx |
| ROUTE-STATE-0393 | error | src/app/(authenticated)/college/semester-courses/error.tsx |
| ROUTE-STATE-0394 | loading | src/app/(authenticated)/college/semester-courses/loading.tsx |
| ROUTE-STATE-0395 | error | src/app/(authenticated)/college/semesters/error.tsx |
| ROUTE-STATE-0396 | loading | src/app/(authenticated)/college/semesters/loading.tsx |
| ROUTE-STATE-0397 | error | src/app/(authenticated)/college/students/[membershipId]/error.tsx |
| ROUTE-STATE-0398 | loading | src/app/(authenticated)/college/students/[membershipId]/loading.tsx |
| ROUTE-STATE-0399 | error | src/app/(authenticated)/college/students/error.tsx |
| ROUTE-STATE-0400 | error | src/app/(authenticated)/college/students/import/error.tsx |
| ROUTE-STATE-0401 | loading | src/app/(authenticated)/college/students/import/loading.tsx |
| ROUTE-STATE-0402 | loading | src/app/(authenticated)/college/students/loading.tsx |
| ROUTE-STATE-0403 | error | src/app/(authenticated)/college/students/register/error.tsx |
| ROUTE-STATE-0404 | loading | src/app/(authenticated)/college/students/register/loading.tsx |
| ROUTE-STATE-0405 | error | src/app/(authenticated)/college/verification/error.tsx |
| ROUTE-STATE-0406 | loading | src/app/(authenticated)/college/verification/loading.tsx |
| ROUTE-STATE-0407 | error | src/app/(authenticated)/college/videos/error.tsx |
| ROUTE-STATE-0408 | loading | src/app/(authenticated)/college/videos/loading.tsx |
| ROUTE-STATE-0409 | error | src/app/(authenticated)/dashboard/error.tsx |
| ROUTE-STATE-0410 | loading | src/app/(authenticated)/dashboard/loading.tsx |
| ROUTE-STATE-0411 | error | src/app/(authenticated)/error.tsx |
| ROUTE-STATE-0412 | error | src/app/(authenticated)/hr/activity/error.tsx |
| ROUTE-STATE-0413 | loading | src/app/(authenticated)/hr/activity/loading.tsx |
| ROUTE-STATE-0414 | error | src/app/(authenticated)/hr/calendar/error.tsx |
| ROUTE-STATE-0415 | loading | src/app/(authenticated)/hr/calendar/loading.tsx |
| ROUTE-STATE-0416 | error | src/app/(authenticated)/hr/colleges/error.tsx |
| ROUTE-STATE-0417 | loading | src/app/(authenticated)/hr/colleges/loading.tsx |
| ROUTE-STATE-0418 | error | src/app/(authenticated)/hr/company/error.tsx |
| ROUTE-STATE-0419 | loading | src/app/(authenticated)/hr/company/loading.tsx |
| ROUTE-STATE-0420 | error | src/app/(authenticated)/hr/company/reports/error.tsx |
| ROUTE-STATE-0421 | loading | src/app/(authenticated)/hr/company/reports/loading.tsx |
| ROUTE-STATE-0422 | error | src/app/(authenticated)/hr/conversations/[threadId]/error.tsx |
| ROUTE-STATE-0423 | loading | src/app/(authenticated)/hr/conversations/[threadId]/loading.tsx |
| ROUTE-STATE-0424 | error | src/app/(authenticated)/hr/conversations/error.tsx |
| ROUTE-STATE-0425 | loading | src/app/(authenticated)/hr/conversations/loading.tsx |
| ROUTE-STATE-0426 | error | src/app/(authenticated)/hr/drives/[jobId]/interview-slots/error.tsx |
| ROUTE-STATE-0427 | loading | src/app/(authenticated)/hr/drives/[jobId]/interview-slots/loading.tsx |
| ROUTE-STATE-0428 | error | src/app/(authenticated)/hr/drives/[jobId]/messages/error.tsx |
| ROUTE-STATE-0429 | loading | src/app/(authenticated)/hr/drives/[jobId]/messages/loading.tsx |
| ROUTE-STATE-0430 | error | src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/error.tsx |
| ROUTE-STATE-0431 | loading | src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/loading.tsx |
| ROUTE-STATE-0432 | error | src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/remove/[roundId]/error.tsx |
| ROUTE-STATE-0433 | loading | src/app/(authenticated)/hr/drives/[jobId]/rounds/editor/remove/[roundId]/loading.tsx |
| ROUTE-STATE-0434 | error | src/app/(authenticated)/hr/drives/error.tsx |
| ROUTE-STATE-0435 | loading | src/app/(authenticated)/hr/drives/loading.tsx |
| ROUTE-STATE-0436 | error | src/app/(authenticated)/hr/drives/new/error.tsx |
| ROUTE-STATE-0437 | loading | src/app/(authenticated)/hr/drives/new/loading.tsx |
| ROUTE-STATE-0438 | error | src/app/(authenticated)/hr/drives/proposals/error.tsx |
| ROUTE-STATE-0439 | loading | src/app/(authenticated)/hr/drives/proposals/loading.tsx |
| ROUTE-STATE-0440 | error | src/app/(authenticated)/hr/drives/recorded-outside/error.tsx |
| ROUTE-STATE-0441 | loading | src/app/(authenticated)/hr/drives/recorded-outside/loading.tsx |
| ROUTE-STATE-0442 | error | src/app/(authenticated)/hr/error.tsx |
| ROUTE-STATE-0443 | error | src/app/(authenticated)/hr/home/error.tsx |
| ROUTE-STATE-0444 | loading | src/app/(authenticated)/hr/home/loading.tsx |
| ROUTE-STATE-0445 | loading | src/app/(authenticated)/hr/loading.tsx |
| ROUTE-STATE-0446 | error | src/app/(authenticated)/hr/messages/error.tsx |
| ROUTE-STATE-0447 | loading | src/app/(authenticated)/hr/messages/loading.tsx |
| ROUTE-STATE-0448 | not-found | src/app/(authenticated)/hr/not-found.tsx |
| ROUTE-STATE-0449 | error | src/app/(authenticated)/hr/notifications/error.tsx |
| ROUTE-STATE-0450 | loading | src/app/(authenticated)/hr/notifications/loading.tsx |
| ROUTE-STATE-0451 | error | src/app/(authenticated)/hr/placements/error.tsx |
| ROUTE-STATE-0452 | error | src/app/(authenticated)/hr/placements/jobs/[jobId]/error.tsx |
| ROUTE-STATE-0453 | loading | src/app/(authenticated)/hr/placements/jobs/[jobId]/loading.tsx |
| ROUTE-STATE-0454 | not-found | src/app/(authenticated)/hr/placements/jobs/[jobId]/not-found.tsx |
| ROUTE-STATE-0455 | loading | src/app/(authenticated)/hr/placements/loading.tsx |
| ROUTE-STATE-0456 | error | src/app/(authenticated)/hr/profile/error.tsx |
| ROUTE-STATE-0457 | loading | src/app/(authenticated)/hr/profile/loading.tsx |
| ROUTE-STATE-0458 | error | src/app/(authenticated)/hr/round-results/error.tsx |
| ROUTE-STATE-0459 | loading | src/app/(authenticated)/hr/round-results/loading.tsx |
| ROUTE-STATE-0460 | error | src/app/(authenticated)/learn/allAssignments/[assignmentId]/error.tsx |
| ROUTE-STATE-0461 | loading | src/app/(authenticated)/learn/allAssignments/[assignmentId]/loading.tsx |
| ROUTE-STATE-0462 | error | src/app/(authenticated)/learn/allAssignments/error.tsx |
| ROUTE-STATE-0463 | loading | src/app/(authenticated)/learn/allAssignments/loading.tsx |
| ROUTE-STATE-0464 | error | src/app/(authenticated)/learn/allQuizzes/[quizId]/error.tsx |
| ROUTE-STATE-0465 | loading | src/app/(authenticated)/learn/allQuizzes/[quizId]/loading.tsx |
| ROUTE-STATE-0466 | error | src/app/(authenticated)/learn/allQuizzes/error.tsx |
| ROUTE-STATE-0467 | loading | src/app/(authenticated)/learn/allQuizzes/loading.tsx |
| ROUTE-STATE-0468 | error | src/app/(authenticated)/learn/assignments/error.tsx |
| ROUTE-STATE-0469 | loading | src/app/(authenticated)/learn/assignments/loading.tsx |
| ROUTE-STATE-0470 | error | src/app/(authenticated)/learn/attendance/calendar/error.tsx |
| ROUTE-STATE-0471 | loading | src/app/(authenticated)/learn/attendance/calendar/loading.tsx |
| ROUTE-STATE-0472 | error | src/app/(authenticated)/learn/attendance/error.tsx |
| ROUTE-STATE-0473 | loading | src/app/(authenticated)/learn/attendance/loading.tsx |
| ROUTE-STATE-0474 | error | src/app/(authenticated)/learn/calendar/error.tsx |
| ROUTE-STATE-0475 | loading | src/app/(authenticated)/learn/calendar/loading.tsx |
| ROUTE-STATE-0476 | error | src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/error.tsx |
| ROUTE-STATE-0477 | loading | src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/loading.tsx |
| ROUTE-STATE-0478 | not-found | src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/not-found.tsx |
| ROUTE-STATE-0479 | error | src/app/(authenticated)/learn/courses/[deliveryId]/attendance-summary/error.tsx |
| ROUTE-STATE-0480 | loading | src/app/(authenticated)/learn/courses/[deliveryId]/attendance-summary/loading.tsx |
| ROUTE-STATE-0481 | error | src/app/(authenticated)/learn/courses/[deliveryId]/error.tsx |
| ROUTE-STATE-0482 | loading | src/app/(authenticated)/learn/courses/[deliveryId]/loading.tsx |
| ROUTE-STATE-0483 | error | src/app/(authenticated)/learn/courses/[deliveryId]/progress/error.tsx |
| ROUTE-STATE-0484 | loading | src/app/(authenticated)/learn/courses/[deliveryId]/progress/loading.tsx |
| ROUTE-STATE-0485 | error | src/app/(authenticated)/learn/courses/error.tsx |
| ROUTE-STATE-0486 | loading | src/app/(authenticated)/learn/courses/loading.tsx |
| ROUTE-STATE-0487 | error | src/app/(authenticated)/learn/error.tsx |
| ROUTE-STATE-0488 | loading | src/app/(authenticated)/learn/loading.tsx |
| ROUTE-STATE-0489 | error | src/app/(authenticated)/learn/my-placements/announcements/error.tsx |
| ROUTE-STATE-0490 | loading | src/app/(authenticated)/learn/my-placements/announcements/loading.tsx |
| ROUTE-STATE-0491 | error | src/app/(authenticated)/learn/my-placements/applications/[applicationId]/company/error.tsx |
| ROUTE-STATE-0492 | loading | src/app/(authenticated)/learn/my-placements/applications/[applicationId]/company/loading.tsx |
| ROUTE-STATE-0493 | error | src/app/(authenticated)/learn/my-placements/applications/[applicationId]/error.tsx |
| ROUTE-STATE-0494 | error | src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/error.tsx |
| ROUTE-STATE-0495 | loading | src/app/(authenticated)/learn/my-placements/applications/[applicationId]/history/loading.tsx |
| ROUTE-STATE-0496 | loading | src/app/(authenticated)/learn/my-placements/applications/[applicationId]/loading.tsx |
| ROUTE-STATE-0497 | error | src/app/(authenticated)/learn/my-placements/applications/error.tsx |
| ROUTE-STATE-0498 | loading | src/app/(authenticated)/learn/my-placements/applications/loading.tsx |
| ROUTE-STATE-0499 | error | src/app/(authenticated)/learn/my-placements/assessments/error.tsx |
| ROUTE-STATE-0500 | loading | src/app/(authenticated)/learn/my-placements/assessments/loading.tsx |
| ROUTE-STATE-0501 | error | src/app/(authenticated)/learn/my-placements/assessments/results/error.tsx |
| ROUTE-STATE-0502 | loading | src/app/(authenticated)/learn/my-placements/assessments/results/loading.tsx |
| ROUTE-STATE-0503 | error | src/app/(authenticated)/learn/my-placements/calendar/error.tsx |
| ROUTE-STATE-0504 | loading | src/app/(authenticated)/learn/my-placements/calendar/loading.tsx |
| ROUTE-STATE-0505 | error | src/app/(authenticated)/learn/my-placements/error.tsx |
| ROUTE-STATE-0506 | error | src/app/(authenticated)/learn/my-placements/interviews/error.tsx |
| ROUTE-STATE-0507 | loading | src/app/(authenticated)/learn/my-placements/interviews/loading.tsx |
| ROUTE-STATE-0508 | error | src/app/(authenticated)/learn/my-placements/jobs/[jobId]/error.tsx |
| ROUTE-STATE-0509 | loading | src/app/(authenticated)/learn/my-placements/jobs/[jobId]/loading.tsx |
| ROUTE-STATE-0510 | error | src/app/(authenticated)/learn/my-placements/jobs/error.tsx |
| ROUTE-STATE-0511 | loading | src/app/(authenticated)/learn/my-placements/jobs/loading.tsx |
| ROUTE-STATE-0512 | loading | src/app/(authenticated)/learn/my-placements/loading.tsx |
| ROUTE-STATE-0513 | error | src/app/(authenticated)/learn/my-placements/notification-preferences/error.tsx |
| ROUTE-STATE-0514 | loading | src/app/(authenticated)/learn/my-placements/notification-preferences/loading.tsx |
| ROUTE-STATE-0515 | error | src/app/(authenticated)/learn/my-placements/offers/error.tsx |
| ROUTE-STATE-0516 | loading | src/app/(authenticated)/learn/my-placements/offers/loading.tsx |
| ROUTE-STATE-0517 | error | src/app/(authenticated)/learn/my-placements/placement/error.tsx |
| ROUTE-STATE-0518 | loading | src/app/(authenticated)/learn/my-placements/placement/loading.tsx |
| ROUTE-STATE-0519 | error | src/app/(authenticated)/learn/my-placements/preparation/error.tsx |
| ROUTE-STATE-0520 | loading | src/app/(authenticated)/learn/my-placements/preparation/loading.tsx |
| ROUTE-STATE-0521 | error | src/app/(authenticated)/learn/my-placements/rules/error.tsx |
| ROUTE-STATE-0522 | loading | src/app/(authenticated)/learn/my-placements/rules/loading.tsx |
| ROUTE-STATE-0523 | error | src/app/(authenticated)/learn/my-placements/schedule/error.tsx |
| ROUTE-STATE-0524 | loading | src/app/(authenticated)/learn/my-placements/schedule/loading.tsx |
| ROUTE-STATE-0525 | error | src/app/(authenticated)/learn/my-placements/support/error.tsx |
| ROUTE-STATE-0526 | loading | src/app/(authenticated)/learn/my-placements/support/loading.tsx |
| ROUTE-STATE-0527 | not-found | src/app/(authenticated)/learn/not-found.tsx |
| ROUTE-STATE-0528 | error | src/app/(authenticated)/learn/notifications/error.tsx |
| ROUTE-STATE-0529 | error | src/app/(authenticated)/learn/notifications/history/error.tsx |
| ROUTE-STATE-0530 | loading | src/app/(authenticated)/learn/notifications/history/loading.tsx |
| ROUTE-STATE-0531 | loading | src/app/(authenticated)/learn/notifications/loading.tsx |
| ROUTE-STATE-0532 | error | src/app/(authenticated)/learn/placements/error.tsx |
| ROUTE-STATE-0533 | loading | src/app/(authenticated)/learn/placements/loading.tsx |
| ROUTE-STATE-0534 | error | src/app/(authenticated)/learn/profile/academic-record/error.tsx |
| ROUTE-STATE-0535 | loading | src/app/(authenticated)/learn/profile/academic-record/loading.tsx |
| ROUTE-STATE-0536 | error | src/app/(authenticated)/learn/profile/completeness/error.tsx |
| ROUTE-STATE-0537 | loading | src/app/(authenticated)/learn/profile/completeness/loading.tsx |
| ROUTE-STATE-0538 | error | src/app/(authenticated)/learn/profile/error.tsx |
| ROUTE-STATE-0539 | loading | src/app/(authenticated)/learn/profile/loading.tsx |
| ROUTE-STATE-0540 | error | src/app/(authenticated)/learn/profile/verification/error.tsx |
| ROUTE-STATE-0541 | loading | src/app/(authenticated)/learn/profile/verification/loading.tsx |
| ROUTE-STATE-0542 | error | src/app/(authenticated)/learn/projects/[projectId]/error.tsx |
| ROUTE-STATE-0543 | loading | src/app/(authenticated)/learn/projects/[projectId]/loading.tsx |
| ROUTE-STATE-0544 | not-found | src/app/(authenticated)/learn/projects/[projectId]/not-found.tsx |
| ROUTE-STATE-0545 | error | src/app/(authenticated)/learn/projects/error.tsx |
| ROUTE-STATE-0546 | loading | src/app/(authenticated)/learn/projects/loading.tsx |
| ROUTE-STATE-0547 | error | src/app/(authenticated)/learn/quizzes/error.tsx |
| ROUTE-STATE-0548 | loading | src/app/(authenticated)/learn/quizzes/loading.tsx |
| ROUTE-STATE-0549 | loading | src/app/(authenticated)/loading.tsx |
| ROUTE-STATE-0550 | error | src/app/(authenticated)/mentor/activity/error.tsx |
| ROUTE-STATE-0551 | loading | src/app/(authenticated)/mentor/activity/loading.tsx |
| ROUTE-STATE-0552 | error | src/app/(authenticated)/mentor/calendar/error.tsx |
| ROUTE-STATE-0553 | loading | src/app/(authenticated)/mentor/calendar/loading.tsx |
| ROUTE-STATE-0554 | error | src/app/(authenticated)/mentor/error.tsx |
| ROUTE-STATE-0555 | loading | src/app/(authenticated)/mentor/loading.tsx |
| ROUTE-STATE-0556 | not-found | src/app/(authenticated)/mentor/not-found.tsx |
| ROUTE-STATE-0557 | error | src/app/(authenticated)/mentor/notifications/error.tsx |
| ROUTE-STATE-0558 | loading | src/app/(authenticated)/mentor/notifications/loading.tsx |
| ROUTE-STATE-0559 | error | src/app/(authenticated)/mentor/projects/[projectId]/activity-history/error.tsx |
| ROUTE-STATE-0560 | loading | src/app/(authenticated)/mentor/projects/[projectId]/activity-history/loading.tsx |
| ROUTE-STATE-0561 | error | src/app/(authenticated)/mentor/projects/[projectId]/board-review/error.tsx |
| ROUTE-STATE-0562 | loading | src/app/(authenticated)/mentor/projects/[projectId]/board-review/loading.tsx |
| ROUTE-STATE-0563 | error | src/app/(authenticated)/mentor/projects/[projectId]/closeout/error.tsx |
| ROUTE-STATE-0564 | loading | src/app/(authenticated)/mentor/projects/[projectId]/closeout/loading.tsx |
| ROUTE-STATE-0565 | error | src/app/(authenticated)/mentor/projects/[projectId]/deliveries/[submissionId]/review/error.tsx |
| ROUTE-STATE-0566 | loading | src/app/(authenticated)/mentor/projects/[projectId]/deliveries/[submissionId]/review/loading.tsx |
| ROUTE-STATE-0567 | error | src/app/(authenticated)/mentor/projects/[projectId]/error.tsx |
| ROUTE-STATE-0568 | loading | src/app/(authenticated)/mentor/projects/[projectId]/loading.tsx |
| ROUTE-STATE-0569 | error | src/app/(authenticated)/mentor/projects/[projectId]/meetings/[meetingId]/notes/error.tsx |
| ROUTE-STATE-0570 | loading | src/app/(authenticated)/mentor/projects/[projectId]/meetings/[meetingId]/notes/loading.tsx |
| ROUTE-STATE-0571 | error | src/app/(authenticated)/mentor/projects/[projectId]/resources-directory/error.tsx |
| ROUTE-STATE-0572 | loading | src/app/(authenticated)/mentor/projects/[projectId]/resources-directory/loading.tsx |
| ROUTE-STATE-0573 | error | src/app/(authenticated)/mentor/projects/[projectId]/review-completeness/error.tsx |
| ROUTE-STATE-0574 | loading | src/app/(authenticated)/mentor/projects/[projectId]/review-completeness/loading.tsx |
| ROUTE-STATE-0575 | error | src/app/(authenticated)/mentor/projects/[projectId]/review-overview/error.tsx |
| ROUTE-STATE-0576 | loading | src/app/(authenticated)/mentor/projects/[projectId]/review-overview/loading.tsx |
| ROUTE-STATE-0577 | error | src/app/(authenticated)/mentor/projects/[projectId]/risk-readiness/error.tsx |
| ROUTE-STATE-0578 | loading | src/app/(authenticated)/mentor/projects/[projectId]/risk-readiness/loading.tsx |
| ROUTE-STATE-0579 | error | src/app/(authenticated)/mentor/projects/[projectId]/tasks/[taskId]/feedback/error.tsx |
| ROUTE-STATE-0580 | loading | src/app/(authenticated)/mentor/projects/[projectId]/tasks/[taskId]/feedback/loading.tsx |
| ROUTE-STATE-0581 | error | src/app/(authenticated)/mentor/projects/[projectId]/team-history/error.tsx |
| ROUTE-STATE-0582 | loading | src/app/(authenticated)/mentor/projects/[projectId]/team-history/loading.tsx |
| ROUTE-STATE-0583 | error | src/app/(authenticated)/mentor/projects/[projectId]/team-meetings/error.tsx |
| ROUTE-STATE-0584 | loading | src/app/(authenticated)/mentor/projects/[projectId]/team-meetings/loading.tsx |
| ROUTE-STATE-0585 | error | src/app/(authenticated)/mentor/projects/[projectId]/timeline/error.tsx |
| ROUTE-STATE-0586 | loading | src/app/(authenticated)/mentor/projects/[projectId]/timeline/loading.tsx |
| ROUTE-STATE-0587 | error | src/app/(authenticated)/mentor/projects/error.tsx |
| ROUTE-STATE-0588 | loading | src/app/(authenticated)/mentor/projects/loading.tsx |
| ROUTE-STATE-0589 | error | src/app/(authenticated)/mentor/reports/error.tsx |
| ROUTE-STATE-0590 | loading | src/app/(authenticated)/mentor/reports/loading.tsx |
| ROUTE-STATE-0591 | error | src/app/(authenticated)/mentor/review-history/error.tsx |
| ROUTE-STATE-0592 | loading | src/app/(authenticated)/mentor/review-history/loading.tsx |
| ROUTE-STATE-0593 | error | src/app/(authenticated)/mentor/reviews/error.tsx |
| ROUTE-STATE-0594 | loading | src/app/(authenticated)/mentor/reviews/loading.tsx |
| ROUTE-STATE-0595 | error | src/app/(authenticated)/mentor/sprint-progress/error.tsx |
| ROUTE-STATE-0596 | loading | src/app/(authenticated)/mentor/sprint-progress/loading.tsx |
| ROUTE-STATE-0597 | error | src/app/(authenticated)/mentor/task-review-history/error.tsx |
| ROUTE-STATE-0598 | loading | src/app/(authenticated)/mentor/task-review-history/loading.tsx |
| ROUTE-STATE-0599 | error | src/app/(authenticated)/mentor/task-reviews/error.tsx |
| ROUTE-STATE-0600 | loading | src/app/(authenticated)/mentor/task-reviews/loading.tsx |
| ROUTE-STATE-0601 | error | src/app/(authenticated)/mentor/team-coverage/error.tsx |
| ROUTE-STATE-0602 | loading | src/app/(authenticated)/mentor/team-coverage/loading.tsx |
| ROUTE-STATE-0603 | error | src/app/(authenticated)/notifications/error.tsx |
| ROUTE-STATE-0604 | loading | src/app/(authenticated)/notifications/loading.tsx |
| ROUTE-STATE-0605 | error | src/app/(authenticated)/recruiter/calendar/error.tsx |
| ROUTE-STATE-0606 | loading | src/app/(authenticated)/recruiter/calendar/loading.tsx |
| ROUTE-STATE-0607 | error | src/app/(authenticated)/recruiter/colleges/error.tsx |
| ROUTE-STATE-0608 | loading | src/app/(authenticated)/recruiter/colleges/loading.tsx |
| ROUTE-STATE-0609 | error | src/app/(authenticated)/recruiter/company/error.tsx |
| ROUTE-STATE-0610 | loading | src/app/(authenticated)/recruiter/company/loading.tsx |
| ROUTE-STATE-0611 | error | src/app/(authenticated)/recruiter/drives/[jobId]/change-requests/error.tsx |
| ROUTE-STATE-0612 | loading | src/app/(authenticated)/recruiter/drives/[jobId]/change-requests/loading.tsx |
| ROUTE-STATE-0613 | error | src/app/(authenticated)/recruiter/drives/[jobId]/error.tsx |
| ROUTE-STATE-0614 | error | src/app/(authenticated)/recruiter/drives/[jobId]/interview-slots/error.tsx |
| ROUTE-STATE-0615 | loading | src/app/(authenticated)/recruiter/drives/[jobId]/interview-slots/loading.tsx |
| ROUTE-STATE-0616 | loading | src/app/(authenticated)/recruiter/drives/[jobId]/loading.tsx |
| ROUTE-STATE-0617 | error | src/app/(authenticated)/recruiter/drives/[jobId]/messages/error.tsx |
| ROUTE-STATE-0618 | loading | src/app/(authenticated)/recruiter/drives/[jobId]/messages/loading.tsx |
| ROUTE-STATE-0619 | error | src/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/error.tsx |
| ROUTE-STATE-0620 | loading | src/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/loading.tsx |
| ROUTE-STATE-0621 | error | src/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/remove/[roundId]/error.tsx |
| ROUTE-STATE-0622 | loading | src/app/(authenticated)/recruiter/drives/[jobId]/rounds/editor/remove/[roundId]/loading.tsx |
| ROUTE-STATE-0623 | error | src/app/(authenticated)/recruiter/drives/error.tsx |
| ROUTE-STATE-0624 | loading | src/app/(authenticated)/recruiter/drives/loading.tsx |
| ROUTE-STATE-0625 | error | src/app/(authenticated)/recruiter/drives/new/error.tsx |
| ROUTE-STATE-0626 | loading | src/app/(authenticated)/recruiter/drives/new/loading.tsx |
| ROUTE-STATE-0627 | error | src/app/(authenticated)/recruiter/drives/proposals/error.tsx |
| ROUTE-STATE-0628 | loading | src/app/(authenticated)/recruiter/drives/proposals/loading.tsx |
| ROUTE-STATE-0629 | error | src/app/(authenticated)/recruiter/drives/recorded-outside/error.tsx |
| ROUTE-STATE-0630 | loading | src/app/(authenticated)/recruiter/drives/recorded-outside/loading.tsx |
| ROUTE-STATE-0631 | error | src/app/(authenticated)/recruiter/error.tsx |
| ROUTE-STATE-0632 | error | src/app/(authenticated)/recruiter/home/error.tsx |
| ROUTE-STATE-0633 | loading | src/app/(authenticated)/recruiter/home/loading.tsx |
| ROUTE-STATE-0634 | loading | src/app/(authenticated)/recruiter/loading.tsx |
| ROUTE-STATE-0635 | error | src/app/(authenticated)/recruiter/messages/error.tsx |
| ROUTE-STATE-0636 | loading | src/app/(authenticated)/recruiter/messages/loading.tsx |
| ROUTE-STATE-0637 | not-found | src/app/(authenticated)/recruiter/not-found.tsx |
| ROUTE-STATE-0638 | error | src/app/(authenticated)/recruiter/profile/error.tsx |
| ROUTE-STATE-0639 | loading | src/app/(authenticated)/recruiter/profile/loading.tsx |
| ROUTE-STATE-0640 | error | src/app/(authenticated)/superadmin/[...legacy]/error.tsx |
| ROUTE-STATE-0641 | loading | src/app/(authenticated)/superadmin/[...legacy]/loading.tsx |
| ROUTE-STATE-0642 | error | src/app/(authenticated)/superadmin/departments/error.tsx |
| ROUTE-STATE-0643 | loading | src/app/(authenticated)/superadmin/departments/loading.tsx |
| ROUTE-STATE-0644 | error | src/app/(authenticated)/superadmin/error.tsx |
| ROUTE-STATE-0645 | loading | src/app/(authenticated)/superadmin/loading.tsx |
| ROUTE-STATE-0646 | not-found | src/app/(authenticated)/superadmin/not-found.tsx |
| ROUTE-STATE-0647 | error | src/app/(authenticated)/superadmin/programs/error.tsx |
| ROUTE-STATE-0648 | loading | src/app/(authenticated)/superadmin/programs/loading.tsx |
| ROUTE-STATE-0649 | error | src/app/(authenticated)/teach/courses/[deliveryId]/error.tsx |
| ROUTE-STATE-0650 | loading | src/app/(authenticated)/teach/courses/[deliveryId]/loading.tsx |
| ROUTE-STATE-0651 | error | src/app/(authenticated)/teach/courses/error.tsx |
| ROUTE-STATE-0652 | loading | src/app/(authenticated)/teach/courses/loading.tsx |
| ROUTE-STATE-0653 | error | src/app/(authenticated)/teach/error.tsx |
| ROUTE-STATE-0654 | loading | src/app/(authenticated)/teach/loading.tsx |
| ROUTE-STATE-0655 | not-found | src/app/(authenticated)/teach/not-found.tsx |
| ROUTE-STATE-0656 | error | src/app/(authenticated)/teacher/allAssignments/error.tsx |
| ROUTE-STATE-0657 | loading | src/app/(authenticated)/teacher/allAssignments/loading.tsx |
| ROUTE-STATE-0658 | error | src/app/(authenticated)/teacher/allQuizzes/error.tsx |
| ROUTE-STATE-0659 | loading | src/app/(authenticated)/teacher/allQuizzes/loading.tsx |
| ROUTE-STATE-0660 | error | src/app/(authenticated)/teacher/calendar/error.tsx |
| ROUTE-STATE-0661 | loading | src/app/(authenticated)/teacher/calendar/loading.tsx |
| ROUTE-STATE-0662 | error | src/app/(authenticated)/teacher/contacts/[contactsTab]/[membershipId]/error.tsx |
| ROUTE-STATE-0663 | loading | src/app/(authenticated)/teacher/contacts/[contactsTab]/[membershipId]/loading.tsx |
| ROUTE-STATE-0664 | error | src/app/(authenticated)/teacher/contacts/[contactsTab]/error.tsx |
| ROUTE-STATE-0665 | loading | src/app/(authenticated)/teacher/contacts/[contactsTab]/loading.tsx |
| ROUTE-STATE-0666 | error | src/app/(authenticated)/teacher/contacts/error.tsx |
| ROUTE-STATE-0667 | loading | src/app/(authenticated)/teacher/contacts/loading.tsx |
| ROUTE-STATE-0668 | error | src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/error.tsx |
| ROUTE-STATE-0669 | loading | src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/loading.tsx |
| ROUTE-STATE-0670 | error | src/app/(authenticated)/teacher/courses/[deliveryId]/assessment-health/error.tsx |
| ROUTE-STATE-0671 | loading | src/app/(authenticated)/teacher/courses/[deliveryId]/assessment-health/loading.tsx |
| ROUTE-STATE-0672 | error | src/app/(authenticated)/teacher/courses/[deliveryId]/assignments/manage/error.tsx |
| ROUTE-STATE-0673 | loading | src/app/(authenticated)/teacher/courses/[deliveryId]/assignments/manage/loading.tsx |
| ROUTE-STATE-0674 | error | src/app/(authenticated)/teacher/courses/[deliveryId]/attendance-corrections/error.tsx |
| ROUTE-STATE-0675 | loading | src/app/(authenticated)/teacher/courses/[deliveryId]/attendance-corrections/loading.tsx |
| ROUTE-STATE-0676 | error | src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/error.tsx |
| ROUTE-STATE-0677 | loading | src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/loading.tsx |
| ROUTE-STATE-0678 | error | src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-history/error.tsx |
| ROUTE-STATE-0679 | loading | src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-history/loading.tsx |
| ROUTE-STATE-0680 | error | src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-participation/error.tsx |
| ROUTE-STATE-0681 | loading | src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-participation/loading.tsx |
| ROUTE-STATE-0682 | error | src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/error.tsx |
| ROUTE-STATE-0683 | loading | src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/loading.tsx |
| ROUTE-STATE-0684 | error | src/app/(authenticated)/teacher/courses/[deliveryId]/error.tsx |
| ROUTE-STATE-0685 | error | src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/[learnerMembershipId]/error.tsx |
| ROUTE-STATE-0686 | loading | src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/[learnerMembershipId]/loading.tsx |
| ROUTE-STATE-0687 | error | src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/error.tsx |
| ROUTE-STATE-0688 | loading | src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/loading.tsx |
| ROUTE-STATE-0689 | loading | src/app/(authenticated)/teacher/courses/[deliveryId]/loading.tsx |
| ROUTE-STATE-0690 | error | src/app/(authenticated)/teacher/courses/[deliveryId]/notices/error.tsx |
| ROUTE-STATE-0691 | loading | src/app/(authenticated)/teacher/courses/[deliveryId]/notices/loading.tsx |
| ROUTE-STATE-0692 | error | src/app/(authenticated)/teacher/courses/[deliveryId]/quizzes/manage/error.tsx |
| ROUTE-STATE-0693 | loading | src/app/(authenticated)/teacher/courses/[deliveryId]/quizzes/manage/loading.tsx |
| ROUTE-STATE-0694 | error | src/app/(authenticated)/teacher/courses/[deliveryId]/reports/error.tsx |
| ROUTE-STATE-0695 | loading | src/app/(authenticated)/teacher/courses/[deliveryId]/reports/loading.tsx |
| ROUTE-STATE-0696 | error | src/app/(authenticated)/teacher/courses/[deliveryId]/session-coverage/error.tsx |
| ROUTE-STATE-0697 | loading | src/app/(authenticated)/teacher/courses/[deliveryId]/session-coverage/loading.tsx |
| ROUTE-STATE-0698 | error | src/app/(authenticated)/teacher/courses/[deliveryId]/students/[membershipId]/error.tsx |
| ROUTE-STATE-0699 | loading | src/app/(authenticated)/teacher/courses/[deliveryId]/students/[membershipId]/loading.tsx |
| ROUTE-STATE-0700 | error | src/app/(authenticated)/teacher/courses/[deliveryId]/students/error.tsx |
| ROUTE-STATE-0701 | loading | src/app/(authenticated)/teacher/courses/[deliveryId]/students/loading.tsx |
| ROUTE-STATE-0702 | error | src/app/(authenticated)/teacher/courses/error.tsx |
| ROUTE-STATE-0703 | loading | src/app/(authenticated)/teacher/courses/loading.tsx |
| ROUTE-STATE-0704 | error | src/app/(authenticated)/teacher/error.tsx |
| ROUTE-STATE-0705 | error | src/app/(authenticated)/teacher/live-classes/error.tsx |
| ROUTE-STATE-0706 | loading | src/app/(authenticated)/teacher/live-classes/loading.tsx |
| ROUTE-STATE-0707 | loading | src/app/(authenticated)/teacher/loading.tsx |
| ROUTE-STATE-0708 | not-found | src/app/(authenticated)/teacher/not-found.tsx |
| ROUTE-STATE-0709 | error | src/app/(authenticated)/teacher/notifications/error.tsx |
| ROUTE-STATE-0710 | loading | src/app/(authenticated)/teacher/notifications/loading.tsx |
| ROUTE-STATE-0711 | error | src/app/(authenticated)/teacher/profile/contacts/error.tsx |
| ROUTE-STATE-0712 | loading | src/app/(authenticated)/teacher/profile/contacts/loading.tsx |
| ROUTE-STATE-0713 | error | src/app/(authenticated)/teacher/profile/details/error.tsx |
| ROUTE-STATE-0714 | loading | src/app/(authenticated)/teacher/profile/details/loading.tsx |
| ROUTE-STATE-0715 | error | src/app/(authenticated)/teacher/profile/error.tsx |
| ROUTE-STATE-0716 | loading | src/app/(authenticated)/teacher/profile/loading.tsx |
| ROUTE-STATE-0717 | error | src/app/(authenticated)/teacher/profile/teaching/error.tsx |
| ROUTE-STATE-0718 | loading | src/app/(authenticated)/teacher/profile/teaching/loading.tsx |
| ROUTE-STATE-0719 | error | src/app/(authenticated)/teacher/report/assignment/[contentId]/error.tsx |
| ROUTE-STATE-0720 | loading | src/app/(authenticated)/teacher/report/assignment/[contentId]/loading.tsx |
| ROUTE-STATE-0721 | error | src/app/(authenticated)/teacher/report/assignment/[contentId]/submissions/error.tsx |
| ROUTE-STATE-0722 | loading | src/app/(authenticated)/teacher/report/assignment/[contentId]/submissions/loading.tsx |
| ROUTE-STATE-0723 | error | src/app/(authenticated)/teacher/report/quiz/[quizId]/attempts/error.tsx |
| ROUTE-STATE-0724 | loading | src/app/(authenticated)/teacher/report/quiz/[quizId]/attempts/loading.tsx |
| ROUTE-STATE-0725 | error | src/app/(authenticated)/teacher/report/quiz/[quizId]/error.tsx |
| ROUTE-STATE-0726 | loading | src/app/(authenticated)/teacher/report/quiz/[quizId]/loading.tsx |
| ROUTE-STATE-0727 | error | src/app/(authenticated)/teacher/response-followups/error.tsx |
| ROUTE-STATE-0728 | loading | src/app/(authenticated)/teacher/response-followups/loading.tsx |
| ROUTE-STATE-0729 | error | src/app/(authenticated)/teacher/results/error.tsx |
| ROUTE-STATE-0730 | loading | src/app/(authenticated)/teacher/results/loading.tsx |
| ROUTE-STATE-0731 | error | src/app/(authenticated)/tpo/announcements/error.tsx |
| ROUTE-STATE-0732 | loading | src/app/(authenticated)/tpo/announcements/loading.tsx |
| ROUTE-STATE-0733 | error | src/app/(authenticated)/tpo/audit/actors/error.tsx |
| ROUTE-STATE-0734 | loading | src/app/(authenticated)/tpo/audit/actors/loading.tsx |
| ROUTE-STATE-0735 | error | src/app/(authenticated)/tpo/audit/error.tsx |
| ROUTE-STATE-0736 | loading | src/app/(authenticated)/tpo/audit/loading.tsx |
| ROUTE-STATE-0737 | error | src/app/(authenticated)/tpo/batches/[batchId]/classes/error.tsx |
| ROUTE-STATE-0738 | loading | src/app/(authenticated)/tpo/batches/[batchId]/classes/loading.tsx |
| ROUTE-STATE-0739 | error | src/app/(authenticated)/tpo/batches/[batchId]/error.tsx |
| ROUTE-STATE-0740 | error | src/app/(authenticated)/tpo/batches/[batchId]/history/error.tsx |
| ROUTE-STATE-0741 | loading | src/app/(authenticated)/tpo/batches/[batchId]/history/loading.tsx |
| ROUTE-STATE-0742 | error | src/app/(authenticated)/tpo/batches/[batchId]/invitation-prep/error.tsx |
| ROUTE-STATE-0743 | loading | src/app/(authenticated)/tpo/batches/[batchId]/invitation-prep/loading.tsx |
| ROUTE-STATE-0744 | loading | src/app/(authenticated)/tpo/batches/[batchId]/loading.tsx |
| ROUTE-STATE-0745 | error | src/app/(authenticated)/tpo/batches/[batchId]/nudge-prep/error.tsx |
| ROUTE-STATE-0746 | loading | src/app/(authenticated)/tpo/batches/[batchId]/nudge-prep/loading.tsx |
| ROUTE-STATE-0747 | error | src/app/(authenticated)/tpo/batches/[batchId]/registrations/[membershipId]/history/error.tsx |
| ROUTE-STATE-0748 | loading | src/app/(authenticated)/tpo/batches/[batchId]/registrations/[membershipId]/history/loading.tsx |
| ROUTE-STATE-0749 | error | src/app/(authenticated)/tpo/batches/[batchId]/registrations/error.tsx |
| ROUTE-STATE-0750 | loading | src/app/(authenticated)/tpo/batches/[batchId]/registrations/loading.tsx |
| ROUTE-STATE-0751 | error | src/app/(authenticated)/tpo/batches/[batchId]/reminder-prep/error.tsx |
| ROUTE-STATE-0752 | loading | src/app/(authenticated)/tpo/batches/[batchId]/reminder-prep/loading.tsx |
| ROUTE-STATE-0753 | error | src/app/(authenticated)/tpo/batches/[batchId]/rules/error.tsx |
| ROUTE-STATE-0754 | loading | src/app/(authenticated)/tpo/batches/[batchId]/rules/loading.tsx |
| ROUTE-STATE-0755 | error | src/app/(authenticated)/tpo/batches/[batchId]/students/error.tsx |
| ROUTE-STATE-0756 | loading | src/app/(authenticated)/tpo/batches/[batchId]/students/loading.tsx |
| ROUTE-STATE-0757 | error | src/app/(authenticated)/tpo/batches/error.tsx |
| ROUTE-STATE-0758 | loading | src/app/(authenticated)/tpo/batches/loading.tsx |
| ROUTE-STATE-0759 | error | src/app/(authenticated)/tpo/calendar/error.tsx |
| ROUTE-STATE-0760 | error | src/app/(authenticated)/tpo/calendar/export/error.tsx |
| ROUTE-STATE-0761 | loading | src/app/(authenticated)/tpo/calendar/export/loading.tsx |
| ROUTE-STATE-0762 | error | src/app/(authenticated)/tpo/calendar/interviews/error.tsx |
| ROUTE-STATE-0763 | loading | src/app/(authenticated)/tpo/calendar/interviews/loading.tsx |
| ROUTE-STATE-0764 | loading | src/app/(authenticated)/tpo/calendar/loading.tsx |
| ROUTE-STATE-0765 | error | src/app/(authenticated)/tpo/calendar/rounds/error.tsx |
| ROUTE-STATE-0766 | loading | src/app/(authenticated)/tpo/calendar/rounds/loading.tsx |
| ROUTE-STATE-0767 | error | src/app/(authenticated)/tpo/companies/[companyId]/contact-log/error.tsx |
| ROUTE-STATE-0768 | loading | src/app/(authenticated)/tpo/companies/[companyId]/contact-log/loading.tsx |
| ROUTE-STATE-0769 | error | src/app/(authenticated)/tpo/companies/[companyId]/error.tsx |
| ROUTE-STATE-0770 | error | src/app/(authenticated)/tpo/companies/[companyId]/feedback/error.tsx |
| ROUTE-STATE-0771 | loading | src/app/(authenticated)/tpo/companies/[companyId]/feedback/loading.tsx |
| ROUTE-STATE-0772 | loading | src/app/(authenticated)/tpo/companies/[companyId]/loading.tsx |
| ROUTE-STATE-0773 | error | src/app/(authenticated)/tpo/companies/[companyId]/manage/error.tsx |
| ROUTE-STATE-0774 | loading | src/app/(authenticated)/tpo/companies/[companyId]/manage/loading.tsx |
| ROUTE-STATE-0775 | error | src/app/(authenticated)/tpo/companies/[companyId]/people/error.tsx |
| ROUTE-STATE-0776 | loading | src/app/(authenticated)/tpo/companies/[companyId]/people/loading.tsx |
| ROUTE-STATE-0777 | error | src/app/(authenticated)/tpo/companies/archived/error.tsx |
| ROUTE-STATE-0778 | loading | src/app/(authenticated)/tpo/companies/archived/loading.tsx |
| ROUTE-STATE-0779 | error | src/app/(authenticated)/tpo/companies/error.tsx |
| ROUTE-STATE-0780 | loading | src/app/(authenticated)/tpo/companies/loading.tsx |
| ROUTE-STATE-0781 | error | src/app/(authenticated)/tpo/drive-day/[roundId]/error.tsx |
| ROUTE-STATE-0782 | loading | src/app/(authenticated)/tpo/drive-day/[roundId]/loading.tsx |
| ROUTE-STATE-0783 | error | src/app/(authenticated)/tpo/drive-day/[roundId]/no-shows/error.tsx |
| ROUTE-STATE-0784 | loading | src/app/(authenticated)/tpo/drive-day/[roundId]/no-shows/loading.tsx |
| ROUTE-STATE-0785 | error | src/app/(authenticated)/tpo/drive-day/error.tsx |
| ROUTE-STATE-0786 | loading | src/app/(authenticated)/tpo/drive-day/loading.tsx |
| ROUTE-STATE-0787 | error | src/app/(authenticated)/tpo/error.tsx |
| ROUTE-STATE-0788 | error | src/app/(authenticated)/tpo/find/error.tsx |
| ROUTE-STATE-0789 | loading | src/app/(authenticated)/tpo/find/loading.tsx |
| ROUTE-STATE-0790 | error | src/app/(authenticated)/tpo/follow-ups/error.tsx |
| ROUTE-STATE-0791 | loading | src/app/(authenticated)/tpo/follow-ups/loading.tsx |
| ROUTE-STATE-0792 | error | src/app/(authenticated)/tpo/home/error.tsx |
| ROUTE-STATE-0793 | loading | src/app/(authenticated)/tpo/home/loading.tsx |
| ROUTE-STATE-0794 | loading | src/app/(authenticated)/tpo/loading.tsx |
| ROUTE-STATE-0795 | error | src/app/(authenticated)/tpo/messages/[threadId]/error.tsx |
| ROUTE-STATE-0796 | loading | src/app/(authenticated)/tpo/messages/[threadId]/loading.tsx |
| ROUTE-STATE-0797 | error | src/app/(authenticated)/tpo/messages/error.tsx |
| ROUTE-STATE-0798 | loading | src/app/(authenticated)/tpo/messages/loading.tsx |
| ROUTE-STATE-0799 | error | src/app/(authenticated)/tpo/messages/notifications/error.tsx |
| ROUTE-STATE-0800 | loading | src/app/(authenticated)/tpo/messages/notifications/loading.tsx |
| ROUTE-STATE-0801 | error | src/app/(authenticated)/tpo/more/error.tsx |
| ROUTE-STATE-0802 | loading | src/app/(authenticated)/tpo/more/loading.tsx |
| ROUTE-STATE-0803 | not-found | src/app/(authenticated)/tpo/not-found.tsx |
| ROUTE-STATE-0804 | error | src/app/(authenticated)/tpo/notifications/error.tsx |
| ROUTE-STATE-0805 | loading | src/app/(authenticated)/tpo/notifications/loading.tsx |
| ROUTE-STATE-0806 | error | src/app/(authenticated)/tpo/placements/error.tsx |
| ROUTE-STATE-0807 | error | src/app/(authenticated)/tpo/placements/jobs/[jobId]/about/error.tsx |
| ROUTE-STATE-0808 | loading | src/app/(authenticated)/tpo/placements/jobs/[jobId]/about/loading.tsx |
| ROUTE-STATE-0809 | error | src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/error.tsx |
| ROUTE-STATE-0810 | loading | src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/loading.tsx |
| ROUTE-STATE-0811 | error | src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants/[applicationId]/error.tsx |
| ROUTE-STATE-0812 | loading | src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants/[applicationId]/loading.tsx |
| ROUTE-STATE-0813 | error | src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants/error.tsx |
| ROUTE-STATE-0814 | loading | src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants/loading.tsx |
| ROUTE-STATE-0815 | error | src/app/(authenticated)/tpo/placements/jobs/[jobId]/applications-export/error.tsx |
| ROUTE-STATE-0816 | loading | src/app/(authenticated)/tpo/placements/jobs/[jobId]/applications-export/loading.tsx |
| ROUTE-STATE-0817 | error | src/app/(authenticated)/tpo/placements/jobs/[jobId]/cancel-preview/error.tsx |
| ROUTE-STATE-0818 | loading | src/app/(authenticated)/tpo/placements/jobs/[jobId]/cancel-preview/loading.tsx |
| ROUTE-STATE-0819 | error | src/app/(authenticated)/tpo/placements/jobs/[jobId]/candidate-schedule/error.tsx |
| ROUTE-STATE-0820 | loading | src/app/(authenticated)/tpo/placements/jobs/[jobId]/candidate-schedule/loading.tsx |
| ROUTE-STATE-0821 | error | src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/error.tsx |
| ROUTE-STATE-0822 | loading | src/app/(authenticated)/tpo/placements/jobs/[jobId]/change-requests/loading.tsx |
| ROUTE-STATE-0823 | error | src/app/(authenticated)/tpo/placements/jobs/[jobId]/close-preview/error.tsx |
| ROUTE-STATE-0824 | loading | src/app/(authenticated)/tpo/placements/jobs/[jobId]/close-preview/loading.tsx |
| ROUTE-STATE-0825 | error | src/app/(authenticated)/tpo/placements/jobs/[jobId]/closeout/error.tsx |
| ROUTE-STATE-0826 | loading | src/app/(authenticated)/tpo/placements/jobs/[jobId]/closeout/loading.tsx |
| ROUTE-STATE-0827 | error | src/app/(authenticated)/tpo/placements/jobs/[jobId]/discussion/error.tsx |
| ROUTE-STATE-0828 | loading | src/app/(authenticated)/tpo/placements/jobs/[jobId]/discussion/loading.tsx |
| ROUTE-STATE-0829 | error | src/app/(authenticated)/tpo/placements/jobs/[jobId]/drive-day/error.tsx |
| ROUTE-STATE-0830 | loading | src/app/(authenticated)/tpo/placements/jobs/[jobId]/drive-day/loading.tsx |
| ROUTE-STATE-0831 | error | src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/error.tsx |
| ROUTE-STATE-0832 | loading | src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/loading.tsx |
| ROUTE-STATE-0833 | error | src/app/(authenticated)/tpo/placements/jobs/[jobId]/error.tsx |
| ROUTE-STATE-0834 | error | src/app/(authenticated)/tpo/placements/jobs/[jobId]/extend-deadline/error.tsx |
| ROUTE-STATE-0835 | loading | src/app/(authenticated)/tpo/placements/jobs/[jobId]/extend-deadline/loading.tsx |
| ROUTE-STATE-0836 | error | src/app/(authenticated)/tpo/placements/jobs/[jobId]/interview-slots/error.tsx |
| ROUTE-STATE-0837 | loading | src/app/(authenticated)/tpo/placements/jobs/[jobId]/interview-slots/loading.tsx |
| ROUTE-STATE-0838 | error | src/app/(authenticated)/tpo/placements/jobs/[jobId]/joining/error.tsx |
| ROUTE-STATE-0839 | loading | src/app/(authenticated)/tpo/placements/jobs/[jobId]/joining/loading.tsx |
| ROUTE-STATE-0840 | error | src/app/(authenticated)/tpo/placements/jobs/[jobId]/letters/error.tsx |
| ROUTE-STATE-0841 | loading | src/app/(authenticated)/tpo/placements/jobs/[jobId]/letters/loading.tsx |
| ROUTE-STATE-0842 | loading | src/app/(authenticated)/tpo/placements/jobs/[jobId]/loading.tsx |
| ROUTE-STATE-0843 | error | src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/[offerId]/error.tsx |
| ROUTE-STATE-0844 | loading | src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/[offerId]/loading.tsx |
| ROUTE-STATE-0845 | error | src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/error.tsx |
| ROUTE-STATE-0846 | loading | src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/loading.tsx |
| ROUTE-STATE-0847 | error | src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/results/error.tsx |
| ROUTE-STATE-0848 | loading | src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/results/loading.tsx |
| ROUTE-STATE-0849 | error | src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/slots/error.tsx |
| ROUTE-STATE-0850 | loading | src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/slots/loading.tsx |
| ROUTE-STATE-0851 | error | src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/error.tsx |
| ROUTE-STATE-0852 | loading | src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/loading.tsx |
| ROUTE-STATE-0853 | error | src/app/(authenticated)/tpo/placements/jobs/[jobId]/selections/error.tsx |
| ROUTE-STATE-0854 | loading | src/app/(authenticated)/tpo/placements/jobs/[jobId]/selections/loading.tsx |
| ROUTE-STATE-0855 | error | src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-audit/error.tsx |
| ROUTE-STATE-0856 | loading | src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-audit/loading.tsx |
| ROUTE-STATE-0857 | error | src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-preview/error.tsx |
| ROUTE-STATE-0858 | loading | src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-preview/loading.tsx |
| ROUTE-STATE-0859 | error | src/app/(authenticated)/tpo/placements/jobs/[jobId]/shortlist/error.tsx |
| ROUTE-STATE-0860 | loading | src/app/(authenticated)/tpo/placements/jobs/[jobId]/shortlist/loading.tsx |
| ROUTE-STATE-0861 | error | src/app/(authenticated)/tpo/placements/jobs/[jobId]/waitlist/error.tsx |
| ROUTE-STATE-0862 | loading | src/app/(authenticated)/tpo/placements/jobs/[jobId]/waitlist/loading.tsx |
| ROUTE-STATE-0863 | error | src/app/(authenticated)/tpo/placements/lifecycle/error.tsx |
| ROUTE-STATE-0864 | loading | src/app/(authenticated)/tpo/placements/lifecycle/loading.tsx |
| ROUTE-STATE-0865 | loading | src/app/(authenticated)/tpo/placements/loading.tsx |
| ROUTE-STATE-0866 | error | src/app/(authenticated)/tpo/placements/new/draft/error.tsx |
| ROUTE-STATE-0867 | loading | src/app/(authenticated)/tpo/placements/new/draft/loading.tsx |
| ROUTE-STATE-0868 | error | src/app/(authenticated)/tpo/placements/new/error.tsx |
| ROUTE-STATE-0869 | loading | src/app/(authenticated)/tpo/placements/new/loading.tsx |
| ROUTE-STATE-0870 | error | src/app/(authenticated)/tpo/placements/overview/error.tsx |
| ROUTE-STATE-0871 | loading | src/app/(authenticated)/tpo/placements/overview/loading.tsx |
| ROUTE-STATE-0872 | error | src/app/(authenticated)/tpo/placements/recorded-outside/error.tsx |
| ROUTE-STATE-0873 | loading | src/app/(authenticated)/tpo/placements/recorded-outside/loading.tsx |
| ROUTE-STATE-0874 | error | src/app/(authenticated)/tpo/placements/schedule-conflicts/error.tsx |
| ROUTE-STATE-0875 | loading | src/app/(authenticated)/tpo/placements/schedule-conflicts/loading.tsx |
| ROUTE-STATE-0876 | error | src/app/(authenticated)/tpo/profile/error.tsx |
| ROUTE-STATE-0877 | loading | src/app/(authenticated)/tpo/profile/loading.tsx |
| ROUTE-STATE-0878 | error | src/app/(authenticated)/tpo/recruiters/[leadId]/error.tsx |
| ROUTE-STATE-0879 | loading | src/app/(authenticated)/tpo/recruiters/[leadId]/loading.tsx |
| ROUTE-STATE-0880 | error | src/app/(authenticated)/tpo/recruiters/campaigns/[batchId]/error.tsx |
| ROUTE-STATE-0881 | loading | src/app/(authenticated)/tpo/recruiters/campaigns/[batchId]/loading.tsx |
| ROUTE-STATE-0882 | error | src/app/(authenticated)/tpo/recruiters/campaigns/drafts/[campaignId]/error.tsx |
| ROUTE-STATE-0883 | loading | src/app/(authenticated)/tpo/recruiters/campaigns/drafts/[campaignId]/loading.tsx |
| ROUTE-STATE-0884 | error | src/app/(authenticated)/tpo/recruiters/campaigns/error.tsx |
| ROUTE-STATE-0885 | loading | src/app/(authenticated)/tpo/recruiters/campaigns/loading.tsx |
| ROUTE-STATE-0886 | error | src/app/(authenticated)/tpo/recruiters/campaigns/new/error.tsx |
| ROUTE-STATE-0887 | loading | src/app/(authenticated)/tpo/recruiters/campaigns/new/loading.tsx |
| ROUTE-STATE-0888 | error | src/app/(authenticated)/tpo/recruiters/campaigns/preview/error.tsx |
| ROUTE-STATE-0889 | loading | src/app/(authenticated)/tpo/recruiters/campaigns/preview/loading.tsx |
| ROUTE-STATE-0890 | error | src/app/(authenticated)/tpo/recruiters/error.tsx |
| ROUTE-STATE-0891 | loading | src/app/(authenticated)/tpo/recruiters/loading.tsx |
| ROUTE-STATE-0892 | error | src/app/(authenticated)/tpo/reports/accreditation/error.tsx |
| ROUTE-STATE-0893 | loading | src/app/(authenticated)/tpo/reports/accreditation/loading.tsx |
| ROUTE-STATE-0894 | error | src/app/(authenticated)/tpo/reports/after-college/error.tsx |
| ROUTE-STATE-0895 | loading | src/app/(authenticated)/tpo/reports/after-college/loading.tsx |
| ROUTE-STATE-0896 | error | src/app/(authenticated)/tpo/reports/branch-season/error.tsx |
| ROUTE-STATE-0897 | loading | src/app/(authenticated)/tpo/reports/branch-season/loading.tsx |
| ROUTE-STATE-0898 | error | src/app/(authenticated)/tpo/reports/by-branch/error.tsx |
| ROUTE-STATE-0899 | loading | src/app/(authenticated)/tpo/reports/by-branch/loading.tsx |
| ROUTE-STATE-0900 | error | src/app/(authenticated)/tpo/reports/by-company/error.tsx |
| ROUTE-STATE-0901 | loading | src/app/(authenticated)/tpo/reports/by-company/loading.tsx |
| ROUTE-STATE-0902 | error | src/app/(authenticated)/tpo/reports/ctc/error.tsx |
| ROUTE-STATE-0903 | loading | src/app/(authenticated)/tpo/reports/ctc/loading.tsx |
| ROUTE-STATE-0904 | error | src/app/(authenticated)/tpo/reports/error.tsx |
| ROUTE-STATE-0905 | error | src/app/(authenticated)/tpo/reports/failure-reasons/error.tsx |
| ROUTE-STATE-0906 | loading | src/app/(authenticated)/tpo/reports/failure-reasons/loading.tsx |
| ROUTE-STATE-0907 | error | src/app/(authenticated)/tpo/reports/intelligence/error.tsx |
| ROUTE-STATE-0908 | loading | src/app/(authenticated)/tpo/reports/intelligence/loading.tsx |
| ROUTE-STATE-0909 | error | src/app/(authenticated)/tpo/reports/joining-followups/error.tsx |
| ROUTE-STATE-0910 | loading | src/app/(authenticated)/tpo/reports/joining-followups/loading.tsx |
| ROUTE-STATE-0911 | error | src/app/(authenticated)/tpo/reports/joining-status/error.tsx |
| ROUTE-STATE-0912 | loading | src/app/(authenticated)/tpo/reports/joining-status/loading.tsx |
| ROUTE-STATE-0913 | error | src/app/(authenticated)/tpo/reports/leads/error.tsx |
| ROUTE-STATE-0914 | loading | src/app/(authenticated)/tpo/reports/leads/loading.tsx |
| ROUTE-STATE-0915 | loading | src/app/(authenticated)/tpo/reports/loading.tsx |
| ROUTE-STATE-0916 | error | src/app/(authenticated)/tpo/reports/offers-acceptance/error.tsx |
| ROUTE-STATE-0917 | loading | src/app/(authenticated)/tpo/reports/offers-acceptance/loading.tsx |
| ROUTE-STATE-0918 | error | src/app/(authenticated)/tpo/reports/offers-expiry/error.tsx |
| ROUTE-STATE-0919 | loading | src/app/(authenticated)/tpo/reports/offers-expiry/loading.tsx |
| ROUTE-STATE-0920 | error | src/app/(authenticated)/tpo/reports/placed-branch/error.tsx |
| ROUTE-STATE-0921 | loading | src/app/(authenticated)/tpo/reports/placed-branch/loading.tsx |
| ROUTE-STATE-0922 | error | src/app/(authenticated)/tpo/reports/placement-summary/error.tsx |
| ROUTE-STATE-0923 | loading | src/app/(authenticated)/tpo/reports/placement-summary/loading.tsx |
| ROUTE-STATE-0924 | error | src/app/(authenticated)/tpo/reports/season-pipeline/error.tsx |
| ROUTE-STATE-0925 | loading | src/app/(authenticated)/tpo/reports/season-pipeline/loading.tsx |
| ROUTE-STATE-0926 | error | src/app/(authenticated)/tpo/reports/unplaced/error.tsx |
| ROUTE-STATE-0927 | loading | src/app/(authenticated)/tpo/reports/unplaced/loading.tsx |
| ROUTE-STATE-0928 | error | src/app/(authenticated)/tpo/requests/error.tsx |
| ROUTE-STATE-0929 | loading | src/app/(authenticated)/tpo/requests/loading.tsx |
| ROUTE-STATE-0930 | error | src/app/(authenticated)/tpo/settings/after-college/error.tsx |
| ROUTE-STATE-0931 | loading | src/app/(authenticated)/tpo/settings/after-college/loading.tsx |
| ROUTE-STATE-0932 | error | src/app/(authenticated)/tpo/settings/blocked-dates/error.tsx |
| ROUTE-STATE-0933 | loading | src/app/(authenticated)/tpo/settings/blocked-dates/loading.tsx |
| ROUTE-STATE-0934 | error | src/app/(authenticated)/tpo/settings/branding/error.tsx |
| ROUTE-STATE-0935 | loading | src/app/(authenticated)/tpo/settings/branding/loading.tsx |
| ROUTE-STATE-0936 | error | src/app/(authenticated)/tpo/settings/error.tsx |
| ROUTE-STATE-0937 | error | src/app/(authenticated)/tpo/settings/job-types/error.tsx |
| ROUTE-STATE-0938 | loading | src/app/(authenticated)/tpo/settings/job-types/loading.tsx |
| ROUTE-STATE-0939 | loading | src/app/(authenticated)/tpo/settings/loading.tsx |
| ROUTE-STATE-0940 | error | src/app/(authenticated)/tpo/settings/notices/error.tsx |
| ROUTE-STATE-0941 | loading | src/app/(authenticated)/tpo/settings/notices/loading.tsx |
| ROUTE-STATE-0942 | error | src/app/(authenticated)/tpo/settings/notifications/error.tsx |
| ROUTE-STATE-0943 | loading | src/app/(authenticated)/tpo/settings/notifications/loading.tsx |
| ROUTE-STATE-0944 | error | src/app/(authenticated)/tpo/settings/prep-readiness/error.tsx |
| ROUTE-STATE-0945 | loading | src/app/(authenticated)/tpo/settings/prep-readiness/loading.tsx |
| ROUTE-STATE-0946 | error | src/app/(authenticated)/tpo/settings/public-link/error.tsx |
| ROUTE-STATE-0947 | loading | src/app/(authenticated)/tpo/settings/public-link/loading.tsx |
| ROUTE-STATE-0948 | error | src/app/(authenticated)/tpo/settings/public-page/error.tsx |
| ROUTE-STATE-0949 | loading | src/app/(authenticated)/tpo/settings/public-page/loading.tsx |
| ROUTE-STATE-0950 | error | src/app/(authenticated)/tpo/settings/recruiters/error.tsx |
| ROUTE-STATE-0951 | loading | src/app/(authenticated)/tpo/settings/recruiters/loading.tsx |
| ROUTE-STATE-0952 | error | src/app/(authenticated)/tpo/settings/rules/error.tsx |
| ROUTE-STATE-0953 | loading | src/app/(authenticated)/tpo/settings/rules/loading.tsx |
| ROUTE-STATE-0954 | error | src/app/(authenticated)/tpo/settings/season/error.tsx |
| ROUTE-STATE-0955 | loading | src/app/(authenticated)/tpo/settings/season/loading.tsx |
| ROUTE-STATE-0956 | error | src/app/(authenticated)/tpo/settings/see/error.tsx |
| ROUTE-STATE-0957 | loading | src/app/(authenticated)/tpo/settings/see/loading.tsx |
| ROUTE-STATE-0958 | error | src/app/(authenticated)/tpo/settings/team/error.tsx |
| ROUTE-STATE-0959 | loading | src/app/(authenticated)/tpo/settings/team/loading.tsx |
| ROUTE-STATE-0960 | error | src/app/(authenticated)/tpo/settings/templates/error.tsx |
| ROUTE-STATE-0961 | loading | src/app/(authenticated)/tpo/settings/templates/loading.tsx |
| ROUTE-STATE-0962 | error | src/app/(authenticated)/tpo/settings/trusted/error.tsx |
| ROUTE-STATE-0963 | loading | src/app/(authenticated)/tpo/settings/trusted/loading.tsx |
| ROUTE-STATE-0964 | error | src/app/(authenticated)/tpo/students/[membershipId]/history/error.tsx |
| ROUTE-STATE-0965 | loading | src/app/(authenticated)/tpo/students/[membershipId]/history/loading.tsx |
| ROUTE-STATE-0966 | error | src/app/(authenticated)/tpo/students/[membershipId]/participation/error.tsx |
| ROUTE-STATE-0967 | loading | src/app/(authenticated)/tpo/students/[membershipId]/participation/loading.tsx |
| ROUTE-STATE-0968 | error | src/app/(authenticated)/tpo/students/error.tsx |
| ROUTE-STATE-0969 | loading | src/app/(authenticated)/tpo/students/loading.tsx |
| ROUTE-STATE-0970 | error | src/app/(authenticated)/tpo/students/preparation-plan/error.tsx |
| ROUTE-STATE-0971 | loading | src/app/(authenticated)/tpo/students/preparation-plan/loading.tsx |
| ROUTE-STATE-0972 | error | src/app/(authenticated)/tpo/students/preparation-prep/error.tsx |
| ROUTE-STATE-0973 | loading | src/app/(authenticated)/tpo/students/preparation-prep/loading.tsx |
| ROUTE-STATE-0974 | error | src/app/(authenticated)/tpo/students/requests/error.tsx |
| ROUTE-STATE-0975 | loading | src/app/(authenticated)/tpo/students/requests/loading.tsx |
| ROUTE-STATE-0976 | error | src/app/(authenticated)/tpo/team/[threadId]/error.tsx |
| ROUTE-STATE-0977 | loading | src/app/(authenticated)/tpo/team/[threadId]/loading.tsx |
| ROUTE-STATE-0978 | error | src/app/(authenticated)/tpo/team/error.tsx |
| ROUTE-STATE-0979 | error | src/app/(authenticated)/tpo/team/everyone/error.tsx |
| ROUTE-STATE-0980 | loading | src/app/(authenticated)/tpo/team/everyone/loading.tsx |
| ROUTE-STATE-0981 | loading | src/app/(authenticated)/tpo/team/loading.tsx |
| ROUTE-STATE-0982 | error | src/app/(authenticated)/tpo/verification/error.tsx |
| ROUTE-STATE-0983 | loading | src/app/(authenticated)/tpo/verification/loading.tsx |
| ROUTE-STATE-0984 | error | src/app/(authenticated)/tracker/audit-findings/[publicId]/error.tsx |
| ROUTE-STATE-0985 | loading | src/app/(authenticated)/tracker/audit-findings/[publicId]/loading.tsx |
| ROUTE-STATE-0986 | error | src/app/(authenticated)/tracker/audit-findings/error.tsx |
| ROUTE-STATE-0987 | loading | src/app/(authenticated)/tracker/audit-findings/loading.tsx |
| ROUTE-STATE-0988 | error | src/app/(authenticated)/tracker/error.tsx |
| ROUTE-STATE-0989 | error | src/app/(authenticated)/tracker/issues/[publicId]/error.tsx |
| ROUTE-STATE-0990 | loading | src/app/(authenticated)/tracker/issues/[publicId]/loading.tsx |
| ROUTE-STATE-0991 | error | src/app/(authenticated)/tracker/issues/error.tsx |
| ROUTE-STATE-0992 | loading | src/app/(authenticated)/tracker/issues/loading.tsx |
| ROUTE-STATE-0993 | loading | src/app/(authenticated)/tracker/loading.tsx |
| ROUTE-STATE-0994 | error | src/app/(authenticated)/tracker/logs/error.tsx |
| ROUTE-STATE-0995 | loading | src/app/(authenticated)/tracker/logs/loading.tsx |
| ROUTE-STATE-0996 | error | src/app/auth/handoff/error.tsx |
| ROUTE-STATE-0997 | loading | src/app/auth/handoff/loading.tsx |
| ROUTE-STATE-0998 | error | src/app/campaign-unsubscribe/[token]/error.tsx |
| ROUTE-STATE-0999 | loading | src/app/campaign-unsubscribe/[token]/loading.tsx |
| ROUTE-STATE-1000 | error | src/app/campaign-unsubscribe/confirmed/error.tsx |
| ROUTE-STATE-1001 | loading | src/app/campaign-unsubscribe/confirmed/loading.tsx |
| ROUTE-STATE-1002 | error | src/app/college-join/[token]/error.tsx |
| ROUTE-STATE-1003 | loading | src/app/college-join/[token]/loading.tsx |
| ROUTE-STATE-1004 | error | src/app/company-join/[token]/error.tsx |
| ROUTE-STATE-1005 | loading | src/app/company-join/[token]/loading.tsx |
| ROUTE-STATE-1006 | error | src/app/company-share/[token]/error.tsx |
| ROUTE-STATE-1007 | loading | src/app/company-share/[token]/loading.tsx |
| ROUTE-STATE-1008 | not-found | src/app/company-share/[token]/not-found.tsx |
| ROUTE-STATE-1009 | error | src/app/e2e/superadmin-login/error.tsx |
| ROUTE-STATE-1010 | loading | src/app/e2e/superadmin-login/loading.tsx |
| ROUTE-STATE-1011 | error | src/app/enterprises/error.tsx |
| ROUTE-STATE-1012 | loading | src/app/enterprises/loading.tsx |
| ROUTE-STATE-1013 | error | src/app/error.tsx |
| ROUTE-STATE-1014 | error | src/app/forbidden/error.tsx |
| ROUTE-STATE-1015 | loading | src/app/forbidden/loading.tsx |
| ROUTE-STATE-1016 | global-error | src/app/global-error.tsx |
| ROUTE-STATE-1017 | error | src/app/home/error.tsx |
| ROUTE-STATE-1018 | loading | src/app/home/loading.tsx |
| ROUTE-STATE-1019 | error | src/app/hr-invite/[token]/error.tsx |
| ROUTE-STATE-1020 | loading | src/app/hr-invite/[token]/loading.tsx |
| ROUTE-STATE-1021 | loading | src/app/loading.tsx |
| ROUTE-STATE-1022 | error | src/app/login/error.tsx |
| ROUTE-STATE-1023 | loading | src/app/login/loading.tsx |
| ROUTE-STATE-1024 | not-found | src/app/not-found.tsx |
| ROUTE-STATE-1025 | error | src/app/placements/error.tsx |
| ROUTE-STATE-1026 | loading | src/app/placements/loading.tsx |
| ROUTE-STATE-1027 | not-found | src/app/placements/not-found.tsx |
| ROUTE-STATE-1028 | error | src/app/platform/error.tsx |
| ROUTE-STATE-1029 | loading | src/app/platform/loading.tsx |
| ROUTE-STATE-1030 | error | src/app/privacy-policy/error.tsx |
| ROUTE-STATE-1031 | loading | src/app/privacy-policy/loading.tsx |
| ROUTE-STATE-1032 | error | src/app/quiz/error.tsx |
| ROUTE-STATE-1033 | loading | src/app/quiz/loading.tsx |
| ROUTE-STATE-1034 | error | src/app/recruiter-invite/[token]/error.tsx |
| ROUTE-STATE-1035 | loading | src/app/recruiter-invite/[token]/loading.tsx |
| ROUTE-STATE-1036 | error | src/app/request-demo/error.tsx |
| ROUTE-STATE-1037 | loading | src/app/request-demo/loading.tsx |
| ROUTE-STATE-1038 | error | src/app/superadmin-login/error.tsx |
| ROUTE-STATE-1039 | loading | src/app/superadmin-login/loading.tsx |
| ROUTE-STATE-1040 | error | src/app/universities/error.tsx |
| ROUTE-STATE-1041 | loading | src/app/universities/loading.tsx |

## Shared kit

| Id | Component | File |
|---|---|---|
| KIT-0001 | avatar | src/components/ui/avatar.tsx |
| KIT-0002 | bottom-sheet | src/components/ui/bottom-sheet.tsx |
| KIT-0003 | breadcrumbs | src/components/ui/breadcrumbs.tsx |
| KIT-0004 | button | src/components/ui/button.tsx |
| KIT-0005 | card | src/components/ui/card.tsx |
| KIT-0006 | confirm-action-dialog | src/components/ui/confirm-action-dialog.tsx |
| KIT-0007 | confirm-dialog | src/components/ui/confirm-dialog.tsx |
| KIT-0008 | data-table | src/components/ui/data-table.tsx |
| KIT-0009 | dialog | src/components/ui/dialog.tsx |
| KIT-0010 | disabled-reason | src/components/ui/disabled-reason.tsx |
| KIT-0011 | drawer | src/components/ui/drawer.tsx |
| KIT-0012 | empty-state | src/components/ui/empty-state.tsx |
| KIT-0013 | error-state | src/components/ui/error-state.tsx |
| KIT-0014 | file-upload | src/components/ui/file-upload.tsx |
| KIT-0015 | filter-bar | src/components/ui/filter-bar.tsx |
| KIT-0016 | form-field | src/components/ui/form-field.tsx |
| KIT-0017 | graceful-page-loading | src/components/ui/graceful-page-loading.tsx |
| KIT-0018 | inline-notice | src/components/ui/inline-notice.tsx |
| KIT-0019 | input | src/components/ui/input.tsx |
| KIT-0020 | loading-state | src/components/ui/loading-state.tsx |
| KIT-0021 | long-text | src/components/ui/long-text.tsx |
| KIT-0022 | page-header | src/components/ui/page-header.tsx |
| KIT-0023 | page-loading | src/components/ui/page-loading.tsx |
| KIT-0024 | pagination | src/components/ui/pagination.tsx |
| KIT-0025 | permission-action | src/components/ui/permission-action.tsx |
| KIT-0026 | select | src/components/ui/select.tsx |
| KIT-0027 | selection-controls | src/components/ui/selection-controls.tsx |
| KIT-0028 | skeleton | src/components/ui/skeleton.tsx |
| KIT-0029 | stat-tile | src/components/ui/stat-tile.tsx |
| KIT-0030 | status-badge | src/components/ui/status-badge.tsx |
| KIT-0031 | tabs | src/components/ui/tabs.tsx |
| KIT-0032 | textarea | src/components/ui/textarea.tsx |
| KIT-0033 | third-party-link | src/components/ui/third-party-link.tsx |
| KIT-0034 | toast | src/components/ui/toast.tsx |
| KIT-0035 | tooltip | src/components/ui/tooltip.tsx |
| KIT-0036 | use-confirm-flow | src/components/ui/use-confirm-flow.tsx |

## Outbound messages (email, SMS, Telegram, notifications, exports)

| Id | Channel | File |
|---|---|---|
| MESSAGE-0001 | export | src/modules/academics/college-academic-export-model.ts |
| MESSAGE-0002 | export | src/modules/academics/college-academic-export-service.ts |
| MESSAGE-0003 | export | src/modules/academics/college-classes-export-model.ts |
| MESSAGE-0004 | export | src/modules/academics/college-classes-export-service.ts |
| MESSAGE-0005 | export | src/modules/academics/college-directory-export-model.ts |
| MESSAGE-0006 | export | src/modules/academics/college-elective-export-model.ts |
| MESSAGE-0007 | export | src/modules/academics/college-elective-export-service.ts |
| MESSAGE-0008 | export | src/modules/academics/college-faculty-assignment-export-model.ts |
| MESSAGE-0009 | export | src/modules/academics/college-faculty-assignment-export-service.ts |
| MESSAGE-0010 | export | src/modules/academics/college-lecture-halls-export-model.ts |
| MESSAGE-0011 | export | src/modules/academics/college-lecture-halls-export-service.ts |
| MESSAGE-0012 | export | src/modules/academics/college-mapping-export-model.ts |
| MESSAGE-0013 | export | src/modules/academics/college-mapping-export-service.ts |
| MESSAGE-0014 | export | src/modules/activity/college-activity-export-model.ts |
| MESSAGE-0015 | export | src/modules/activity/college-activity-export-service.ts |
| MESSAGE-0016 | export | src/modules/activity/super-admin-audit-export-model.ts |
| MESSAGE-0017 | export | src/modules/activity/super-admin-audit-export-service.ts |
| MESSAGE-0018 | export | src/modules/admin-ui/super-admin-batch-roster-export-model.ts |
| MESSAGE-0019 | export | src/modules/admin-ui/super-admin-faculty-assignments-csv-service.ts |
| MESSAGE-0020 | export | src/modules/admin-ui/super-admin-learning-csv-service.ts |
| MESSAGE-0021 | export | src/modules/admin-ui/super-admin-scoped-csv-model.ts |
| MESSAGE-0022 | export | src/modules/admin-ui/super-admin-scoped-csv-service.ts |
| MESSAGE-0023 | export | src/modules/announcements/admin-csv-model.ts |
| MESSAGE-0024 | export | src/modules/attendance/college-department-csv-model.ts |
| MESSAGE-0025 | export | src/modules/attendance/college-department-csv-service.ts |
| MESSAGE-0026 | export | src/modules/attendance/learner-attendance-history-csv-model.ts |
| MESSAGE-0027 | export | src/modules/bug-tracker/audit-findings-csv-model.ts |
| MESSAGE-0028 | export | src/modules/colleges/admin-history-export-model.ts |
| MESSAGE-0029 | export | src/modules/colleges/admin-readiness-export-model.ts |
| MESSAGE-0030 | export | src/modules/colleges/admin-tenant-export-model.ts |
| MESSAGE-0031 | export | src/modules/courses/college-assessment-export-model.ts |
| MESSAGE-0032 | export | src/modules/courses/college-assessment-export-service.ts |
| MESSAGE-0033 | export | src/modules/courses/college-content-csv-model.ts |
| MESSAGE-0034 | export | src/modules/courses/college-content-export-model.ts |
| MESSAGE-0035 | export | src/modules/courses/college-content-export-service.ts |
| MESSAGE-0036 | export | src/modules/courses/college-course-catalogue-export-model.ts |
| MESSAGE-0037 | export | src/modules/courses/college-lessons-export-model.ts |
| MESSAGE-0038 | export | src/modules/courses/college-lessons-export-service.ts |
| MESSAGE-0039 | export | src/modules/courses/college-progress-export-model.ts |
| MESSAGE-0040 | export | src/modules/courses/college-progress-export-service.ts |
| MESSAGE-0041 | export | src/modules/courses/faculty-quiz-csv-cap.ts |
| MESSAGE-0042 | export | src/modules/courses/faculty-quiz-question-csv-service.ts |
| MESSAGE-0043 | export | src/modules/courses/faculty-quiz-question-csv.ts |
| MESSAGE-0044 | export | src/modules/courses/faculty-report-csv-request.ts |
| MESSAGE-0045 | export | src/modules/courses/faculty-report-csv-service.ts |
| MESSAGE-0046 | export | src/modules/courses/faculty-report-csv.ts |
| MESSAGE-0047 | export | src/modules/groups/college-group-csv-preview-model.ts |
| MESSAGE-0048 | export | src/modules/groups/college-group-csv-preview-service.ts |
| MESSAGE-0049 | telegram | src/modules/log-alerts/telegram-notifier.ts |
| MESSAGE-0050 | telegram | src/modules/log-alerts/telegram-webhook.ts |
| MESSAGE-0051 | export | src/modules/messaging/receipt-history-export-model.ts |
| MESSAGE-0052 | export | src/modules/people/admin-users-export-model.ts |
| MESSAGE-0053 | export | src/modules/people/admin-users-export-service.ts |
| MESSAGE-0054 | export | src/modules/people/college-contacts-export-model.ts |
| MESSAGE-0055 | export | src/modules/people/college-contacts-export-service.ts |
| MESSAGE-0056 | export | src/modules/people/college-faculty-csv-columns.ts |
| MESSAGE-0057 | export | src/modules/people/college-faculty-csv-service.ts |
| MESSAGE-0058 | export | src/modules/people/college-people-export-model.ts |
| MESSAGE-0059 | export | src/modules/people/college-people-export-service.ts |
| MESSAGE-0060 | export | src/modules/people/college-role-directory-export-service.ts |
| MESSAGE-0061 | export | src/modules/people/college-student-csv-model.ts |
| MESSAGE-0062 | export | src/modules/people/college-student-csv-service.ts |
| MESSAGE-0063 | export | src/modules/placements/admin-company-directory-export-model.ts |
| MESSAGE-0064 | export | src/modules/placements/applicant-export-model.ts |
| MESSAGE-0065 | export | src/modules/placements/applicant-export-service.ts |
| MESSAGE-0066 | export | src/modules/placements/college-directory-csv.ts |
| MESSAGE-0067 | export | src/modules/placements/company-share/audit-csv-model.ts |
| MESSAGE-0068 | export | src/modules/placements/company-share/export-headers-model.ts |
| MESSAGE-0069 | export | src/modules/placements/hr-activity-csv-model.ts |
| MESSAGE-0070 | export | src/modules/placements/hr-applicant-export-model.ts |
| MESSAGE-0071 | export | src/modules/placements/hr-calendar-export-model.ts |
| MESSAGE-0072 | export | src/modules/placements/hr-company-report-export-model.ts |
| MESSAGE-0073 | export | src/modules/placements/hr-drive-proposal-export-model.ts |
| MESSAGE-0074 | export | src/modules/placements/hr-drives-csv-model.ts |
| MESSAGE-0075 | export | src/modules/placements/hr-inbox-csv-model.ts |
| MESSAGE-0076 | export | src/modules/placements/hr-offer-export-model.ts |
| MESSAGE-0077 | export | src/modules/placements/hr-team-csv-model.ts |
| MESSAGE-0078 | export | src/modules/placements/learner-applications-csv-model.ts |
| MESSAGE-0079 | export | src/modules/placements/learner-csv-safe-cell-model.ts |
| MESSAGE-0080 | export | src/modules/placements/learner-offers-csv-model.ts |
| MESSAGE-0081 | export | src/modules/placements/tpo-audit-csv-model.ts |
| MESSAGE-0082 | export | src/modules/placements/tpo-batch-history-csv-model.ts |
| MESSAGE-0083 | export | src/modules/placements/tpo-batch-registration-export-model.ts |
| MESSAGE-0084 | export | src/modules/placements/tpo-batch-student-filtered-export-model.ts |
| MESSAGE-0085 | export | src/modules/placements/tpo-batch-students-export-model.ts |
| MESSAGE-0086 | export | src/modules/placements/tpo-calendar-export-model.ts |
| MESSAGE-0087 | export | src/modules/placements/tpo-company-directory-export-model.ts |
| MESSAGE-0088 | export | src/modules/placements/tpo-company-drive-export-model.ts |
| MESSAGE-0089 | export | src/modules/placements/tpo-company-engagement-csv-model.ts |
| MESSAGE-0090 | export | src/modules/placements/tpo-company-page-csv-model.ts |
| MESSAGE-0091 | export | src/modules/placements/tpo-drive-applications-export-model.ts |
| MESSAGE-0092 | export | src/modules/placements/tpo-drive-list-export-service.ts |
| MESSAGE-0093 | export | src/modules/placements/tpo-eligibility-preview-csv-model.ts |
| MESSAGE-0094 | export | src/modules/placements/tpo-import-csv-parser.ts |
| MESSAGE-0095 | export | src/modules/placements/tpo-lead-csv-import-model.ts |
| MESSAGE-0096 | export | src/modules/placements/tpo-lead-csv-import-service.ts |
| MESSAGE-0097 | export | src/modules/placements/tpo-live-drive-day-csv-model.ts |
| MESSAGE-0098 | export | src/modules/placements/tpo-operations-export-model.ts |
| MESSAGE-0099 | export | src/modules/placements/tpo-recruiter-export-model.ts |
| MESSAGE-0100 | export | src/modules/placements/tpo-recruiter-grant-export-model.ts |
| MESSAGE-0101 | export | src/modules/placements/tpo-registration-event-history-csv-model.ts |
| MESSAGE-0102 | export | src/modules/placements/tpo-requests-page-csv-model.ts |
| MESSAGE-0103 | export | src/modules/placements/tpo-round-apply-csv-model.ts |
| MESSAGE-0104 | export | src/modules/placements/tpo-round-failure-csv-model.ts |
| MESSAGE-0105 | export | src/modules/placements/tpo-students-csv.ts |
| MESSAGE-0106 | export | src/modules/placements/tpo-unplaced-filtered-export-model.ts |
| MESSAGE-0107 | export | src/modules/projects/class-team-csv-export.ts |
| MESSAGE-0108 | export | src/modules/projects/learner-project-activity-csv-model.ts |
| MESSAGE-0109 | export | src/modules/projects/mentor-calendar-export-model.ts |
| MESSAGE-0110 | export | src/modules/projects/mentor-portfolio-activity-export-model.ts |
| MESSAGE-0111 | export | src/modules/projects/mentor-project-activity-export-model.ts |
| MESSAGE-0112 | export | src/modules/projects/mentor-review-export-model.ts |
| MESSAGE-0113 | export | src/modules/projects/mentor-task-review-export-model.ts |
| MESSAGE-0114 | notification | src/modules/verification/notification-copy.ts |
| MESSAGE-0115 | export | src/modules/verification/staff-export-service.ts |
