# Lane 14 — responsive layout values at 375/768/1280

Spec: `docs/design/old-lms-shell.css`, `docs/design/ui-clone-checklist.md`; source inspection, no CI.
src/app/(authenticated)/activity/[eventId]/page.tsx | 34 instances | 375px: min control 44px ↔ min-h-11=44px; 768px: control 36px ↔ md:min-h-9=36px; 375px: heading/actions stack ↔ shared PageHeader flex-col | none
src/app/(authenticated)/admin/assignments/page.tsx | 18 instances | 375px: min control 44px ↔ min-h-11=44px; 768px: control 36px ↔ md:min-h-9=36px; 375px: heading/actions stack ↔ shared PageHeader flex-col | none
src/app/(authenticated)/admin/audit/page.tsx | 6 instances | 375px: min control 44px ↔ min-h-11=44px; 768px: control 36px ↔ md:min-h-9=36px; 375px: heading/actions stack ↔ shared PageHeader flex-col | none
src/app/(authenticated)/admin/batches/[batchId]/students/page.tsx | 12 instances | 375px: min control 44px ↔ min-h-11=44px; 768px: control 36px ↔ md:min-h-9=36px; 375px: heading/actions stack ↔ shared PageHeader flex-col | none
src/app/(authenticated)/admin/colleges/[collegeId]/admins/[userId]/history/page.tsx | 17 instances | 375px: min control 44px ↔ min-h-11=44px; 768px: control 36px ↔ md:min-h-9=36px; 375px: heading/actions stack ↔ shared PageHeader flex-col | none
src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx | 14 instances | 375px: min control 44px ↔ min-h-11=44px; 768px: control 36px ↔ md:min-h-9=36px; 375px: heading/actions stack ↔ shared PageHeader flex-col | none
src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx | 10 instances | 375px: min control 44px ↔ min-h-11=44px; 375px: heading/actions stack ↔ shared PageHeader flex-col; 768px: head actions row ↔ md:flex-row | none
src/app/(authenticated)/admin/colleges/[collegeId]/verification/page.tsx | 9 instances | 375px: min control 44px ↔ min-h-11=44px; 768px: control 36px ↔ md:min-h-9=36px; 375px: heading/actions stack ↔ shared PageHeader flex-col | none
src/app/(authenticated)/admin/companies/[companyId]/drives/page.tsx | 10 JSX responsive instances | 375 tap ≥44px ↔ min-h-11 (44px); 768 control 36px ↔ md:min-h-9 (36px); 375 head column ↔ PageHeader flex-col | 375 grid stack
src/app/(authenticated)/admin/faculty-assignment/page.tsx | 5 JSX responsive instances | 375 tap ≥44px ↔ min-h-11 (44px); 768 control 36px ↔ md:min-h-9 (36px); 375 min width 0 ↔ min-w-0 | none
src/app/(authenticated)/admin/faculty/page.tsx | 7 JSX responsive instances | 375 tap ≥44px ↔ min-h-11 (44px); 768 control 36px ↔ md:min-h-9 (36px); 375 min width 0 ↔ min-w-0 | none
src/app/(authenticated)/admin/features/[collegeId]/history/page.tsx | 15 JSX responsive instances | 375 tap ≥44px ↔ min-h-11 (44px); 768 control 36px ↔ md:min-h-9 (36px); 375 head column ↔ PageHeader flex-col | none
src/app/(authenticated)/admin/features/[collegeId]/students/[membershipId]/page.tsx | 14 JSX responsive instances | 375 tap ≥44px ↔ min-h-11 (44px); 768 control 36px ↔ md:min-h-9 (36px); 375 head column ↔ PageHeader flex-col | none
src/app/(authenticated)/admin/hr/page.tsx | 4 JSX responsive instances | 375 tap ≥44px ↔ min-h-11 (44px); 768 control 36px ↔ md:min-h-9 (36px); 375 head column ↔ PageHeader flex-col | none
src/app/(authenticated)/admin/lecture-halls/[hallId]/page.tsx | 27 JSX responsive instances | 375 tap ≥44px ↔ min-h-11 (44px); 768 control 36px ↔ md:min-h-9 (36px); 375 Button ≥44px ↔ shared Button @max767 44px | none
src/app/(authenticated)/admin/people/directory/[membershipId]/page.tsx | 11 JSX responsive instances | 375 tap ≥44px ↔ min-h-11 (44px); 768 control 36px ↔ md:min-h-9 (36px); 375 head column ↔ PageHeader flex-col | none
src/app/(authenticated)/admin/placements/applications/[applicationId]/page.tsx | 15 layout/control instances | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min-width 0 ↔ min-w-0 | none
src/app/(authenticated)/admin/placements/page.tsx | 17 layout/control instances | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stacks ↔ PageHeader flex-col | 375 header action 100%
src/app/(authenticated)/admin/placements/shortlisted/[applicationId]/page.tsx | 8 layout/control instances | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stacks ↔ PageHeader flex-col | none
src/app/(authenticated)/admin/programs/page.tsx | 13 layout/control instances | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stacks ↔ PageHeader flex-col | none
src/app/(authenticated)/admin/projects/page.tsx | 20 layout/control instances | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stacks ↔ PageHeader flex-col | none
src/app/(authenticated)/admin/projects/templates/[templateId]/colleges/page.tsx | 29 layout/control instances | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 button 44px ↔ shared Button max767 min-h-11 | none
src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx | 15 layout/control instances | 375 heading stacks ↔ PageHeader flex-col; 768 heading/actions row ↔ PageHeader md:flex-row; 375 min-width 0 ↔ min-w-0 | mobile pre local scroll
src/app/(authenticated)/admin/quizzes/page.tsx | 17 layout/control instances | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stacks ↔ PageHeader flex-col | none
src/app/(authenticated)/admin/students/page.tsx | 25 layout/control instances | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stacks ↔ PageHeader flex-col | none
src/app/(authenticated)/admin/tenants/create/page.tsx | 21 layout/control instances | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stacks ↔ PageHeader flex-col | none
src/app/(authenticated)/college/academics/page.tsx | 3 layout/control instances | 375 heading stacks ↔ PageHeader flex-col; 768 heading/actions row ↔ PageHeader md:flex-row; 375 min-width 0 ↔ min-w-0 | none
src/app/(authenticated)/college/activity/[eventId]/page.tsx | 18 layout/control instances | 375 heading stacks ↔ PageHeader flex-col; 768 heading/actions row ↔ PageHeader md:flex-row; 375 min-width 0 ↔ min-w-0 | none
src/app/(authenticated)/college/assignments/page.tsx | 5 layout/control instances | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stacks ↔ PageHeader flex-col | none
src/app/(authenticated)/college/attendance/departments/page.tsx | 5 layout/control instances | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stacks ↔ PageHeader flex-col | none
src/app/(authenticated)/college/attendance/page.tsx | 10 layout/control instances | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stacks ↔ PageHeader flex-col | none
src/app/(authenticated)/college/batch-promotion/page.tsx | 35 layout/control instances | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 button 44px ↔ shared Button max767 min-h-11 | 375 header action 100%
src/app/(authenticated)/college/batches/[cohortId]/students/page.tsx | 15 layout/control instances | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 button 44px ↔ shared Button max767 min-h-11 | none
src/app/(authenticated)/college/batches/page.tsx | 8 layout/control instances | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stacks ↔ PageHeader flex-col | none
src/app/(authenticated)/college/classes/page.tsx | 10 layout/control instances | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stacks ↔ PageHeader flex-col | none
src/app/(authenticated)/college/contacts/error.tsx | 4 layout/control instances | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 button 44px ↔ shared Button max767 min-h-11 | none
src/app/(authenticated)/college/course-progress/page.tsx | 11 layout/control instances | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stacks ↔ PageHeader flex-col | none
src/app/(authenticated)/college/courses/offerings/[offeringId]/error.tsx | 5 layout/control instances | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 button 44px ↔ shared Button max767 min-h-11 | none
src/app/(authenticated)/college/electives/[slotId]/allocate/page.tsx | 22 layout/control instances | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 button 44px ↔ shared Button max767 min-h-11 | 375 header action 100%
src/app/(authenticated)/college/electives/[slotId]/offerings/[offeringId]/roster/page.tsx | 32 layout/control instances | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 button 44px ↔ shared Button max767 min-h-11 | 375 header action 100%
src/app/(authenticated)/college/electives/page.tsx | 14 layout/control instances | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stacks ↔ PageHeader flex-col | none
src/app/(authenticated)/college/faculty/[membershipId]/page.tsx | 33 layout/control instances | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 button 44px ↔ shared Button max767 min-h-11 | none
src/app/(authenticated)/college/groups/[groupId]/rule-preview/page.tsx | 24 layout/control instances | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stacks ↔ PageHeader flex-col | none
src/app/(authenticated)/college/hiring-dashboard/page.tsx | 12 layout/control instances | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stacks ↔ PageHeader flex-col | 375 header action 100%, 375 header action 100%
src/app/(authenticated)/college/lecture-halls/[hallId]/page.tsx | 27 layout/control instances | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 button 44px ↔ shared Button max767 min-h-11 | none
src/app/(authenticated)/college/lecture-halls/page.tsx | 37 layout/control instances | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 button 44px ↔ shared Button max767 min-h-11 | 375 header action 100%
src/app/(authenticated)/college/lessons/page.tsx | 9 layout/control instances | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stacks ↔ PageHeader flex-col | none
src/app/(authenticated)/college/live-classes/page.tsx | 9 layout/control instances | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stacks ↔ PageHeader flex-col | none
src/app/(authenticated)/college/people/error.tsx | 5 instances | 375 44px ↔ min-h-11=44px; 768 36px ↔ md:min-h-9=36px; 375 Button ≥44px ↔ shared max767:min-h-11 | none
src/app/(authenticated)/college/placements/drives/page.tsx | 45 instances | 375 44px ↔ min-h-11=44px; 768 36px ↔ md:min-h-9=36px; 375 Button ≥44px ↔ shared max767:min-h-11 | 375 actions width
src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx | 37 instances | 375 44px ↔ min-h-11=44px; 768 36px ↔ md:min-h-9=36px; 375 Button ≥44px ↔ shared max767:min-h-11 | 375 actions width
src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx | 28 instances | 375 44px ↔ min-h-11=44px; 768 36px ↔ md:min-h-9=36px; 375 Button ≥44px ↔ shared max767:min-h-11 | 375 actions width
src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx | 18 instances | 375 44px ↔ min-h-11=44px; 768 36px ↔ md:min-h-9=36px; 375 head column ↔ shared flex-col | 375 grid stack
src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx | 8 instances | 375 44px ↔ min-h-11=44px; 375 head column ↔ shared flex-col; 768 head row ↔ shared md:flex-row | 375 actions width
src/app/(authenticated)/college/placements/retention/page.tsx | 11 instances | 375 44px ↔ min-h-11=44px; 768 36px ↔ md:min-h-9=36px; 375 head column ↔ shared flex-col | 375 actions width
src/app/(authenticated)/college/placements/student-lookup/page.tsx | 19 instances | 375 44px ↔ min-h-11=44px; 768 36px ↔ md:min-h-9=36px; 375 Button ≥44px ↔ shared max767:min-h-11 | 375 actions width
src/app/(authenticated)/college/profile/page.tsx | 15 instances | 375 44px ↔ min-h-11=44px; 768 36px ↔ md:min-h-9=36px; 375 head column ↔ shared flex-col | none
src/app/(authenticated)/college/projects/create/page.tsx | 8 instances | 375 44px ↔ min-h-11=44px; 768 36px ↔ md:min-h-9=36px; 375 head column ↔ shared flex-col | 375 actions width
src/app/(authenticated)/college/projects/page.tsx | 25 instances | 375 44px ↔ min-h-11=44px; 768 36px ↔ md:min-h-9=36px; 375 head column ↔ shared flex-col | 375 flex wrap
src/app/(authenticated)/college/projects/templates/page.tsx | 20 instances | 375 44px ↔ min-h-11=44px; 768 36px ↔ md:min-h-9=36px; 375 Button ≥44px ↔ shared max767:min-h-11 | none
src/app/(authenticated)/college/resources/page.tsx | 10 JSX layout/control instances | 375 tap target 44px ↔ min-h-11 (44px); 768 control 36px ↔ md:min-h-9 (36px); 375 header stacked ↔ PageHeader flex-col | 375 header action width
src/app/(authenticated)/college/semesters/page.tsx | 8 JSX layout/control instances | 375 tap target 44px ↔ min-h-11 (44px); 375 header stacked ↔ PageHeader flex-col; 768 header row ↔ PageHeader md:flex-row | 375 header action width
src/app/(authenticated)/college/students/[membershipId]/page.tsx | 26 JSX layout/control instances | 375 tap target 44px ↔ min-h-11 (44px); 768 control 36px ↔ md:min-h-9 (36px); 375 header stacked ↔ PageHeader flex-col | none
src/app/(authenticated)/college/verification/page.tsx | 10 JSX layout/control instances | 375 tap target 44px ↔ min-h-11 (44px); 768 control 36px ↔ md:min-h-9 (36px); 375 header stacked ↔ PageHeader flex-col | none
src/app/(authenticated)/dashboard/page.tsx | 22 JSX layout/control instances | 375 tap target 44px ↔ min-h-11 (44px); 375 header stacked ↔ PageHeader flex-col; 768 header row ↔ PageHeader md:flex-row | none
src/app/(authenticated)/hr/profile/page.tsx | 38 JSX layout/control instances | 375 tap target 44px ↔ min-h-11 (44px); 375 header stacked ↔ PageHeader flex-col; 768 header row ↔ PageHeader md:flex-row | none
src/app/(authenticated)/learn/allQuizzes/[quizId]/page.tsx | 35 JSX layout/control instances | 375 tap target 44px ↔ min-h-11 (44px); 768 control 36px ↔ md:min-h-9 (36px); 375 header stacked ↔ PageHeader flex-col | none
src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx | 12 JSX layout/control instances | 375 tap target 44px ↔ min-h-11 (44px); 768 control 36px ↔ md:min-h-9 (36px); 375 header stacked ↔ PageHeader flex-col | none
src/app/(authenticated)/learn/courses/[deliveryId]/attendance-summary/page.tsx | 21 JSX layout/control instances | 375 tap target 44px ↔ min-h-11 (44px); 768 control 36px ↔ md:min-h-9 (36px); 375 header stacked ↔ PageHeader flex-col | none
src/app/(authenticated)/learn/my-placements/applications/[applicationId]/company/page.tsx | 32 JSX layout/control instances | 375 tap target 44px ↔ min-h-11 (44px); 768 control 36px ↔ md:min-h-9 (36px); 375 header stacked ↔ PageHeader flex-col | none
src/app/(authenticated)/learn/my-placements/applications/[applicationId]/page.tsx | 21 JSX responsive checks | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stack ↔ PageHeader flex-col | none
src/app/(authenticated)/learn/my-placements/preparation/page.tsx | 19 JSX responsive checks | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stack ↔ PageHeader flex-col | 375 header action width
src/app/(authenticated)/learn/my-placements/support/page.tsx | 28 JSX responsive checks | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stack ↔ PageHeader flex-col | none
src/app/(authenticated)/learn/profile/academic-record/page.tsx | 11 JSX responsive checks | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stack ↔ PageHeader flex-col | none
src/app/(authenticated)/learn/profile/completeness/page.tsx | 25 JSX responsive checks | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stack ↔ PageHeader flex-col | none
src/app/(authenticated)/learn/projects/[projectId]/page.tsx | 14 JSX responsive checks | 375 tap 44px ↔ min-h-11; 375 heading stack ↔ PageHeader flex-col; 768 header row ↔ PageHeader md:flex-row | none
src/app/(authenticated)/mentor/notifications/page.tsx | 38 JSX responsive checks | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stack ↔ PageHeader flex-col | none
src/app/(authenticated)/mentor/projects/[projectId]/deliveries/[submissionId]/review/page.tsx | 60 JSX responsive checks | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stack ↔ PageHeader flex-col | 375 header action width
src/app/(authenticated)/mentor/projects/[projectId]/review-completeness/page.tsx | 25 JSX responsive checks | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stack ↔ PageHeader flex-col | 375 header action width
src/app/(authenticated)/teach/courses/[deliveryId]/page.tsx | 13 JSX responsive checks | 375 tap 44px ↔ min-h-11; 375 width floor 0 ↔ min-w-0; 375 wraps ↔ flex-wrap | none
src/app/(authenticated)/teacher/calendar/page.tsx | 41 JSX responsive checks | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stack ↔ PageHeader flex-col | none
src/app/(authenticated)/teacher/contacts/[contactsTab]/[membershipId]/page.tsx | 15 JSX responsive checks | 375 tap 44px ↔ min-h-11; 375 heading stack ↔ PageHeader flex-col; 768 header row ↔ PageHeader md:flex-row | none
src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx | 19 JSX responsive checks | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stack ↔ PageHeader flex-col | none
src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-history/page.tsx | 22 JSX responsive checks | 375 tap 44px ↔ min-h-11; 375 heading stack ↔ PageHeader flex-col; 768 header row ↔ PageHeader md:flex-row | none
src/app/(authenticated)/teacher/courses/[deliveryId]/students/[membershipId]/page.tsx | 22 JSX responsive checks | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stack ↔ PageHeader flex-col | 375 grid 1col
src/app/(authenticated)/teacher/live-classes/page.tsx | 26 JSX responsive checks | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stack ↔ PageHeader flex-col | none
src/app/(authenticated)/teacher/profile/contacts/page.tsx | 21 JSX responsive checks | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stack ↔ PageHeader flex-col | none
src/app/(authenticated)/teacher/profile/page.tsx | 15 JSX responsive checks | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stack ↔ PageHeader flex-col | none
src/app/(authenticated)/tpo/batches/[batchId]/classes/page.tsx | 15 JSX responsive checks | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stack ↔ PageHeader flex-col | 375 header action width
src/app/(authenticated)/tpo/calendar/export/page.tsx | 18 JSX responsive checks | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stack ↔ PageHeader flex-col | 375 header action width
src/app/(authenticated)/tpo/calendar/page.tsx | 5 JSX responsive checks | 375 tap 44px ↔ min-h-11; 375 heading stack ↔ PageHeader flex-col; 768 header row ↔ PageHeader md:flex-row | none
src/app/(authenticated)/tpo/calendar/rounds/page.tsx | 15 JSX responsive checks | 375 tap 44px ↔ min-h-11; 375 heading stack ↔ PageHeader flex-col; 768 header row ↔ PageHeader md:flex-row | none
src/app/(authenticated)/tpo/companies/[companyId]/contact-log/page.tsx | 22 JSX responsive checks | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stack ↔ PageHeader flex-col | 375 header action width
src/app/(authenticated)/tpo/companies/[companyId]/feedback/page.tsx | 23 JSX responsive checks | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stack ↔ PageHeader flex-col | 375 header action width
src/app/(authenticated)/tpo/companies/archived/page.tsx | 14 JSX responsive checks | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stack ↔ PageHeader flex-col | none
src/app/(authenticated)/tpo/drive-day/[roundId]/no-shows/page.tsx | 24 JSX responsive checks | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stack ↔ PageHeader flex-col | 375 grid 1col
src/app/(authenticated)/tpo/home/page.tsx | 43 JSX responsive checks | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stack ↔ PageHeader flex-col | 375 grid 1col
src/app/(authenticated)/tpo/placements/jobs/[jobId]/about/page.tsx | 55 JSX responsive checks | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 heading stack ↔ PageHeader flex-col | none
src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants/[applicationId]/page.tsx | 28 JSX responsive checks | 375 tap 44px ↔ min-h-11; 375 heading stack ↔ PageHeader flex-col; 768 header row ↔ PageHeader md:flex-row | none
src/app/(authenticated)/tpo/placements/jobs/[jobId]/applications-export/page.tsx | 45 JSX responsive checks | 375 tap 44px ↔ min-h-11; 375 heading stack ↔ PageHeader flex-col; 768 header row ↔ PageHeader md:flex-row | 375 header action width, 375 grid 1col
src/app/(authenticated)/tpo/placements/jobs/[jobId]/closeout/page.tsx | 14 responsive instances | 375 tap 44px ↔ min-h-11; 375 header stacks ↔ PageHeader flex-col; 768 header row ↔ PageHeader md:flex-row | phone header action full width, phone grid one column
src/app/(authenticated)/tpo/placements/jobs/[jobId]/discussion/page.tsx | 18 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 header stacks ↔ PageHeader flex-col | phone header action full width
src/app/(authenticated)/tpo/placements/jobs/[jobId]/joining/page.tsx | 18 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 header stacks ↔ PageHeader flex-col | phone grid one column
src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/[offerId]/page.tsx | 19 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 header stacks ↔ PageHeader flex-col | phone grid one column
src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-audit/page.tsx | 16 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 header stacks ↔ PageHeader flex-col | none
src/app/(authenticated)/tpo/placements/jobs/[jobId]/share-preview/company-share-controls.tsx | 29 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | phone flex wrap
src/app/(authenticated)/tpo/placements/jobs/[jobId]/shortlist/page.tsx | 11 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 header stacks ↔ PageHeader flex-col | none
src/app/(authenticated)/tpo/placements/new/page.tsx | 6 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/app/(authenticated)/tpo/placements/overview/page.tsx | 10 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 header stacks ↔ PageHeader flex-col | none
src/app/(authenticated)/tpo/profile/page.tsx | 16 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 header stacks ↔ PageHeader flex-col | none
src/app/(authenticated)/tpo/recruiters/campaigns/drafts/[campaignId]/page.tsx | 25 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 header stacks ↔ PageHeader flex-col | none
src/app/(authenticated)/tpo/reports/branch-season/page.tsx | 17 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 header stacks ↔ PageHeader flex-col | none
src/app/(authenticated)/tpo/reports/intelligence/page.tsx | 18 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 header stacks ↔ PageHeader flex-col | phone grid one column
src/app/(authenticated)/tpo/reports/offers-expiry/page.tsx | 21 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 header stacks ↔ PageHeader flex-col | none
src/app/(authenticated)/tpo/settings/notices/page.tsx | 31 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 header stacks ↔ PageHeader flex-col | none
src/app/(authenticated)/tpo/settings/public-page/page.tsx | 14 responsive instances | 375 tap 44px ↔ min-h-11; 375 header stacks ↔ PageHeader flex-col; 768 header row ↔ PageHeader md:flex-row | none
src/app/(authenticated)/tpo/settings/season/page.tsx | 21 responsive instances | 375 header stacks ↔ PageHeader flex-col; 768 header row ↔ PageHeader md:flex-row; 375 min width zero ↔ min-w-0 | none
src/app/(authenticated)/tpo/settings/see/page.tsx | 32 responsive instances | 375 header stacks ↔ PageHeader flex-col; 768 header row ↔ PageHeader md:flex-row; 375 min width zero ↔ min-w-0 | none
src/app/(authenticated)/tpo/settings/team/page.tsx | 27 responsive instances | 375 tap 44px ↔ min-h-11; 375 header stacks ↔ PageHeader flex-col; 768 header row ↔ PageHeader md:flex-row | none
src/app/(authenticated)/tpo/settings/templates/page.tsx | 16 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 header stacks ↔ PageHeader flex-col | none
src/app/(authenticated)/tpo/settings/trusted/page.tsx | 22 responsive instances | 375 tap 44px ↔ min-h-11; 375 header stacks ↔ PageHeader flex-col; 768 header row ↔ PageHeader md:flex-row | none
src/app/(authenticated)/tpo/students/[membershipId]/participation/page.tsx | 21 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 header stacks ↔ PageHeader flex-col | none
src/app/(authenticated)/tpo/students/preparation-plan/page.tsx | 13 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 header stacks ↔ PageHeader flex-col | none
src/app/(authenticated)/tpo/team/everyone/page.tsx | 16 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 header stacks ↔ PageHeader flex-col | none
src/app/(authenticated)/tracker/audit-findings/page.tsx | 40 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 header stacks ↔ PageHeader flex-col | none
src/app/(authenticated)/tracker/issues/[publicId]/page.tsx | 51 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 header stacks ↔ PageHeader flex-col | none
src/app/(authenticated)/tracker/mine/page.tsx | 19 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 header stacks ↔ PageHeader flex-col | phone header action full width
src/app/home/page.tsx | 15 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/app/placements/page.tsx | 12 responsive instances | 375 header stacks ↔ PageHeader flex-col; 768 header row ↔ PageHeader md:flex-row; 375 min width zero ↔ min-w-0 | none
src/app/quiz/page.tsx | 5 responsive instances | 375 tap 44px ↔ min-h-11; 375 min width zero ↔ min-w-0; 375 sidebar hidden ↔ shell @max767 | none
src/app/request-demo/page.tsx | 8 responsive instances | 375 tap 44px ↔ min-h-11; 375 header stacks ↔ PageHeader flex-col; 768 header row ↔ PageHeader md:flex-row | none
src/components/academics/college-hall-booking-action.tsx | 23 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/academics/college-semester-management.tsx | 28 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/academics/college-term-mapping-manager.tsx | 44 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 table card ↔ DataTable block | phone grid one column
src/components/academics/learner-class-schedule.tsx | 91 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | phone flex wrap, phone flex wrap
src/components/activity/activity-center.tsx | 24 responsive instances | 375 tap 44px ↔ min-h-11; 375 min width zero ↔ min-w-0; 375 wraps ↔ flex-wrap | none
src/components/activity/notification-toolbar.tsx | 8 responsive instances | 375 tap 44px ↔ min-h-11; 375 min width zero ↔ min-w-0; 375 grid 1 ↔ grid-cols-1 | phone grid one column
src/components/admin/academic-module-scope-inventory.tsx | 23 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 table card ↔ DataTable block | none
src/components/admin/academic-setup-steps.tsx | 12 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/admin/admin-dashboard-actions.tsx | 29 responsive instances | 375 tap 44px ↔ min-h-11; 375 min width zero ↔ min-w-0; 375 sidebar hidden ↔ shell @max767 | none
src/components/admin/college-archive-button.tsx | 8 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 sidebar hidden ↔ shell @max767 | none
src/components/admin/college-at-glance-panel.tsx | 9 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 wraps ↔ flex-wrap | none
src/components/admin/college-bulk-import.tsx | 17 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 table card ↔ DataTable block | none
src/components/admin/college-logo-uploader.tsx | 25 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/admin/department-directory.tsx | 29 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 table card ↔ DataTable block | none
src/components/admin/learner-module-access-drawer.tsx | 34 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/admin/managed-college-subdomain.tsx | 23 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/admin/organization-create-form.tsx | 8 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/admin/person-membership-actions.tsx | 13 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | phone flex wrap
src/components/admin/scoped-membership-lifecycle-actions.tsx | 15 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/admin/student-rule-editor.tsx | 14 responsive instances | 375 tap 44px ↔ min-h-11; 375 min width zero ↔ min-w-0; 375 wraps ↔ flex-wrap | none
src/components/admin/super-admin-attendance-settings-editor.tsx | 13 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
