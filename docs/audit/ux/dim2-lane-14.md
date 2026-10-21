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
src/components/admin/super-admin-batch-roster-manager.tsx | 25 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 table card ↔ DataTable block | none
src/components/admin/super-admin-company-edit.tsx | 19 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 sidebar hidden ↔ shell @max767 | none
src/components/admin/super-admin-company-identities.tsx | 13 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | phone flex wrap
src/components/admin/super-admin-company-merge.tsx | 11 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/admin/super-admin-faculty-bulk-import.tsx | 15 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 table card ↔ DataTable block | none
src/components/admin/super-admin-faculty-schedule-reassign-action.tsx | 12 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/admin/super-admin-student-bulk-access.tsx | 19 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/admin/tenant-settings-editor.tsx | 30 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/admin/tenant-settings-other-keys.tsx | 23 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/announcements/super-admin-college-broadcast-form.tsx | 33 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/attendance/admin-attendance-parent-contact-editor.tsx | 19 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/attendance/admin-attendance-workspace.tsx | 76 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | phone flex wrap, phone grid one column, phone grid one column
src/components/attendance/college-attendance-policy-form.tsx | 23 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/college/college-faculty-assignment-actions.tsx | 31 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/college/college-faculty-csv-import.tsx | 23 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 table card ↔ DataTable block | none
src/components/college/college-faculty-reassign-action.tsx | 9 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/college/college-faculty-schedule-reassign.tsx | 20 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/college/college-offering-metadata-action.tsx | 13 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/college/college-person-profile-overview-modal.tsx | 27 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/college/college-student-import-history.tsx | 14 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 table card ↔ DataTable block | phone flex wrap
src/components/college/student-class-move-action.tsx | 14 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/courses/admin-course-display-editor.tsx | 28 responsive instances | 375 min width zero ↔ min-w-0; 375 wraps ↔ flex-wrap; 375 sidebar hidden ↔ shell @max767 | none
src/components/courses/admin-offering-learning-overview.tsx | 56 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | phone grid one column
src/components/courses/assignment-multipart-parts-editor.tsx | 13 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 sidebar hidden ↔ shell @max767 | none
src/components/courses/college-assignment-review.tsx | 9 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 wraps ↔ flex-wrap | none
src/components/courses/college-content-authoring-control.tsx | 61 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/courses/college-lesson-visibility-controls.tsx | 17 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/courses/faculty-assignment-material-links.tsx | 16 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/courses/faculty-content-editor.tsx | 21 responsive instances | 375 tap 44px ↔ min-h-11; 375 min width zero ↔ min-w-0; 375 grid 1 ↔ grid-cols-1 | none
src/components/courses/faculty-course-tab-navigation.tsx | 13 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/courses/faculty-report-student-table.tsx | 17 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 table card ↔ DataTable block | phone flex wrap
src/components/courses/learner-rich-response-editor.tsx | 10 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | phone grid one column
src/components/courses/super-admin-course-bulk-visibility.tsx | 14 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 wraps ↔ flex-wrap | none
src/components/courses/super-admin-lesson-bulk-visibility.tsx | 17 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/courses/super-admin-lesson-create.tsx | 12 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/electives/college-slot-manager.tsx | 19 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/hr/recruiter-notification-bell.tsx | 16 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/hr/recruiter-profile-details-editor.tsx | 10 responsive instances | 375 tap 44px ↔ min-h-11; 375 min width zero ↔ min-w-0; 375 sidebar hidden ↔ shell @max767 | none
src/components/people/faculty-profile-editor.tsx | 11 responsive instances | 375 tap 44px ↔ min-h-11; 375 min width zero ↔ min-w-0; 375 sidebar hidden ↔ shell @max767 | none
src/components/people/faculty-profile-skills.tsx | 26 responsive instances | 375 tap 44px ↔ min-h-11; 375 min width zero ↔ min-w-0; 375 wraps ↔ flex-wrap | none
src/components/people/faculty-profile-text-section.tsx | 11 responsive instances | 375 tap 44px ↔ min-h-11; 375 min width zero ↔ min-w-0; 375 sidebar hidden ↔ shell @max767 | none
src/components/placements/college-application-pipeline-controls.tsx | 34 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 table card ↔ DataTable block | none
src/components/placements/college-company-create.tsx | 19 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/placements/drive-day-roster.tsx | 26 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 header stacks ↔ PageHeader flex-col | phone grid one column, phone grid one column
src/components/placements/hr-recruiter-drives-grid.tsx | 13 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 wraps ↔ flex-wrap | none
src/components/placements/learner-application-detail-withdraw.tsx | 11 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/placements/learner-interview-withdrawal-request.tsx | 17 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 wraps ↔ flex-wrap | none
src/components/placements/learner-own-drive-journey.tsx | 17 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/placements/learner-placement-academic-evidence.tsx | 20 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/placements/learner-placement-alerts.tsx | 14 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/placements/learner-placement-notification-settings.tsx | 25 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 wraps ↔ flex-wrap | none
src/components/placements/learner-placement-preferences.tsx | 31 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/placements/learner-recent-placement-activity.tsx | 15 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/placements/learner-schedule-reschedule.tsx | 20 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 sidebar hidden ↔ shell @max767 | none
src/components/placements/learner-support-cancel.tsx | 10 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 sidebar hidden ↔ shell @max767 | none
src/components/placements/placement-candidate-evidence-editor.tsx | 22 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/placements/placement-drive-day-overview.tsx | 36 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 table card ↔ DataTable block | phone grid one column, phone grid one column
src/components/placements/placement-employer-relationships.tsx | 25 responsive instances | 375 tap 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 min width zero ↔ min-w-0 | none
src/components/placements/placement-offer-controls.tsx | 33 responsive tokens checked | 375 control 44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 768 grid two columns ↔ md:grid-cols-2; 375 flex min-width 0 ↔ min-w-0 | 375/768 control height
src/components/placements/placement-operations-overview.tsx | 32 responsive tokens checked | 375 control 44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 375 grid single column ↔ grid-cols-1; 768 existing breakpoint ↔ sm:grid-cols | 375 grid 2→1; desktop retained
src/components/placements/placement-role-options.tsx | 29 responsive tokens checked | 375 control 44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 375 flex min-width 0 ↔ min-w-0; 375 actions wrap ↔ flex-wrap | 375/768 control height
src/components/placements/placement-season-manager.tsx | 16 responsive tokens checked | 375 control 44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 768 existing breakpoint ↔ sm:grid-cols; 375 flex min-width 0 ↔ min-w-0 | none
src/components/placements/public-recruiter-join-form.tsx | 15 responsive tokens checked | 375 target 44px ↔ min-h-11; 375 toolbar wraps ↔ flex-wrap; 375 flex width shrink ↔ min-w-0; 375 content fits width ↔ w-full | none
src/components/placements/recorded-outside-form.tsx | 23 responsive tokens checked | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 768 grid 2 columns ↔ md:grid-cols-2; 375 flex width shrink ↔ min-w-0 | none
src/components/placements/recruiter-interview-slot-form.tsx | 52 responsive tokens checked | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 grid 1 column ↔ grid-cols-1; ≥768 grid has responsive override ↔ sm:grid-cols-* | none
src/components/placements/tpo-applicant-review-drawer.tsx | 21 responsive tokens checked | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 grid 1 column ↔ grid-cols-1; 768 grid 2 columns ↔ md:grid-cols-2 | none
src/components/placements/tpo-applicant-review-form.tsx | 15 responsive tokens checked | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 grid 1 column ↔ grid-cols-1; 375 toolbar wraps ↔ flex-wrap | none
src/components/placements/tpo-calendar-followup-actions.tsx | 12 responsive tokens checked | 375 target 44px ↔ min-h-11; ≥768 grid has responsive override ↔ sm:grid-cols-*; 1280 grid expansion ↔ xl:grid-cols-*; 375 flex width shrink ↔ min-w-0 | none
src/components/placements/tpo-college-rules-control.tsx | 15 responsive tokens checked | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; ≥768 grid has responsive override ↔ sm:grid-cols-*; 375 flex width shrink ↔ min-w-0 | none
src/components/placements/tpo-drive-cancel-form.tsx | 13 responsive tokens checked | 375 target 44px ↔ min-h-11; 375 grid 1 column ↔ grid-cols-1; 768 grid 2 columns ↔ md:grid-cols-2; 375 toolbar wraps ↔ flex-wrap | phone grid 2→1
src/components/placements/tpo-drive-change-requests.tsx | 32 responsive tokens checked | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 375 grid 1 column ↔ grid-cols-1; 375 toolbar wraps ↔ flex-wrap | none
src/components/placements/tpo-drive-edit-form.tsx | 39 responsive tokens inspected | 375 ≥44px tap ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 768 adaptive grid ↔ sm:grid-cols-*; 1280 columns ↔ xl:grid-cols-* | none
src/components/placements/tpo-drive-workspace-nav.tsx | 9 responsive tokens inspected | 375 ≥44px tap ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 375 shrink width 0 ↔ min-w-0; 375 width 100% ↔ w-full | none
src/components/placements/tpo-interview-reschedule-form.tsx | 18 responsive tokens inspected | 375 ≥44px tap ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 375 grid stack ↔ grid-cols-1; 768 adaptive grid ↔ sm:grid-cols-* | none
src/components/placements/tpo-offer-lifecycle-panel.tsx | 21 responsive tokens inspected | 375 ≥44px tap ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 375 shrink width 0 ↔ min-w-0; 375 actions wrap ↔ flex-wrap | none
src/components/placements/tpo-outside-participants-editor.tsx | 26 responsive tokens inspected | 375 ≥44px tap ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 768 adaptive grid ↔ sm:grid-cols-*; 375 shrink width 0 ↔ min-w-0 | none
src/components/placements/tpo-public-placement-content-editor.tsx | 19 responsive tokens inspected | 375 ≥44px tap ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 768 adaptive grid ↔ sm:grid-cols-*; 375 shrink width 0 ↔ min-w-0 | none
src/components/placements/tpo-report-record-links.tsx | 5 responsive tokens inspected | 375 ≥44px tap ↔ min-h-11; 768 grid 2 columns ↔ md:grid-cols-2; 375 shrink width 0 ↔ min-w-0 | none
src/components/placements/tpo-round-apply-control.tsx | 12 responsive tokens inspected | 375 ≥44px tap ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 375 grid stack ↔ grid-cols-1; 768 adaptive grid ↔ sm:grid-cols-* | phone grid 2→1
src/components/placements/tpo-round-reorder.tsx | 10 responsive tokens inspected | 375 ≥44px tap ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 375 actions wrap ↔ flex-wrap; 375 Button inherits shared sizing | none
src/components/placements/tpo-round-result-entry-form.tsx | 22 responsive class tokens inspected | 768 grid 2 columns ↔ md:grid-cols-2; 375 shrink constraint 0 ↔ min-w-0; 375 vertical header ↔ sm:flex-row; 375 width 100% ↔ w-full | none
src/components/placements/tpo-round-results-import.tsx | 25 responsive class tokens inspected | 375 ≥44px ↔ min-h-11; 768 36px ↔ md:min-h-9; 375 shrink constraint 0 ↔ min-w-0; 375 vertical header ↔ sm:flex-row | none
src/components/placements/tpo-season-controls.tsx | 30 responsive class tokens inspected | 375 ≥44px ↔ min-h-11; 768 36px ↔ md:min-h-9; 768 responsive columns ↔ sm:grid-cols-*; 375 shrink constraint 0 ↔ min-w-0 | none
src/components/placements/tpo-settings-nav.tsx | 23 responsive class tokens inspected | 375 ≥44px ↔ min-h-11; 768 36px ↔ md:min-h-9; 375 shrink constraint 0 ↔ min-w-0; 375 width 100% ↔ w-full | none
src/components/profile/learner-verification-withdraw.tsx | 5 responsive class tokens inspected | 375 ≥44px ↔ min-h-11; 375 header wrap ↔ flex-wrap; 375 shared control ↔ Button | none
src/components/projects/admin-readiness-workspace-picker.tsx | 15 responsive class tokens inspected | 375 ≥44px ↔ min-h-11; 768 36px ↔ md:min-h-9; 375 shrink constraint 0 ↔ min-w-0; 375 header wrap ↔ flex-wrap | none
src/components/projects/class-team-workspace-creator.tsx | 43 responsive class tokens inspected | 375 ≥44px ↔ min-h-11; 768 36px ↔ md:min-h-9; 375 grid 1 column ↔ grid-cols-1; 768 grid 2 columns ↔ md:grid-cols-2 | none
src/components/projects/mentor-lane-board.tsx | 26 responsive class tokens inspected | 375 ≥44px ↔ min-h-11; 768 36px ↔ md:min-h-9; 768 grid 2 columns ↔ md:grid-cols-2; 1280 columns ↔ xl:grid-cols-* | none
src/components/projects/mentor-meeting-notes-editor.tsx | 8 responsive class tokens inspected | 375 ≥44px ↔ min-h-11; 768 36px ↔ md:min-h-9; 375 shrink constraint 0 ↔ min-w-0; 375 vertical header ↔ sm:flex-row | none
src/components/projects/mentor-product-backlog.tsx | 22 responsive tokens checked | 375 control 44px ↔ min-h-11; 375 flex min width 0 ↔ min-w-0; 375 action wrap ↔ flex-wrap; 375 vertical actions ↔ sm:flex-row | none
src/components/projects/mentor-release-editor.tsx | 14 responsive tokens checked | 375 control 44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 375 vertical actions ↔ sm:flex-row; 375 fluid width ↔ w-full | none
src/components/projects/mentor-task-create.tsx | 25 responsive tokens checked | 375 control 44px ↔ min-h-11; 375 flex min width 0 ↔ min-w-0; 375 vertical actions ↔ sm:flex-row; 375 fluid width ↔ w-full | none
src/components/projects/project-admin-at-risk-page.tsx | 31 responsive tokens checked | 375 control 44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 375 flex min width 0 ↔ min-w-0; 375 action wrap ↔ flex-wrap | none
src/components/projects/project-admin-collection-controls.tsx | 17 responsive tokens checked | 375 control 44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 375 grid stacks ↔ grid-cols-1; 768 grid has 2 columns ↔ md:grid-cols-2 | none
src/components/projects/project-admin-readiness-page.tsx | 31 responsive tokens checked | 375 control 44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 375 grid stacks ↔ grid-cols-1; 375 flex min width 0 ↔ min-w-0 | 375 columns 2→1
src/components/projects/project-admin-workspace-list.tsx | 38 responsive tokens checked | 375 control 44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 375 grid stacks ↔ grid-cols-1; ≥768 grid breakpoint ↔ sm:grid-cols-* | 375 columns 2→1
src/components/projects/project-resource-files-panel.tsx | 56 responsive tokens checked | 375 control 44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 375 grid stacks ↔ grid-cols-1; ≥768 grid breakpoint ↔ sm:grid-cols-* | none
src/components/projects/super-admin-template-create-form.tsx | 32 responsive tokens checked | 375 control 44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 768 grid has 2 columns ↔ md:grid-cols-2; 375 flex min width 0 ↔ min-w-0 | none
src/components/projects/super-admin-template-overview-editor.tsx | 7 responsive tokens checked | 768 grid has 2 columns ↔ md:grid-cols-2; 375 fluid width ↔ w-full; 375 shared control ↔ Button | none
src/components/projects/super-admin-template-resource-editor.tsx | 33 responsive rules/tokens checked | 375 control 44px ↔ min-h-11; 768 grid 2col ↔ md:grid-cols-2; 375 flex shrink ↔ min-w-0; 375 wrap ↔ flex-wrap | none
src/components/shell/sidebar-legacy.css | 7 responsive rules/tokens checked | 375 mobile max767px ↔ @media max-width:767px; 768 tablet min768px ↔ @media min-width:768px; 375 inherited sidebar rule max-width:767px | none
src/components/tpo/recruiter-bulk-invite-controls.tsx | 13 responsive rules/tokens checked | 375 control 44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 375 flex shrink ↔ min-w-0; 375 width 100% ↔ w-full | none
src/components/tpo/recruiter-bulk-stage-controls.tsx | 9 responsive rules/tokens checked | 375 control 44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 375 flex shrink ↔ min-w-0; 375 wrap ↔ flex-wrap | none
src/components/tpo/recruiter-inline-owner.tsx | 9 responsive rules/tokens checked | 375 control 44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 375 flex shrink ↔ min-w-0; 375 width 100% ↔ w-full | none
src/components/tpo/recruiter-inline-stage.tsx | 11 responsive rules/tokens checked | 375 control 44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 375 flex shrink ↔ min-w-0; 375 width 100% ↔ w-full | none
src/components/tpo/tpo-after-college-bulk-editor.tsx | 26 responsive rules/tokens checked | 375 control 44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 375 flex shrink ↔ min-w-0; 375 wrap ↔ flex-wrap | none
src/components/tpo/tpo-after-college-editor.tsx | 22 responsive rules/tokens checked | 375 control 44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 375 flex shrink ↔ min-w-0; 375 wrap ↔ flex-wrap | none
src/components/tpo/tpo-audit-grid.tsx | 24 responsive rules/tokens checked | 375 control 44px ↔ min-h-11; 375 stacked grid ↔ grid-cols-1; 768 responsive cols ↔ sm:grid-cols; 375 flex shrink ↔ min-w-0 | none
src/components/tpo/tpo-batch-rule-editor.tsx | 41 responsive rules/tokens checked | 375 control 44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 375 stacked grid ↔ grid-cols-1; 375 flex shrink ↔ min-w-0 | none
src/components/tpo/tpo-batch-student-saved-views.tsx | 37 responsive tokens reviewed | 375 control 44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 375 grid stack ↔ grid-cols-1; 768 2 columns ↔ md:grid-cols-2 | 375 grid 2→1, 375 grid 2→1
src/components/tpo/tpo-bulk-action-panel.tsx | 71 responsive tokens reviewed | 375 control 44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 768 2 columns ↔ md:grid-cols-2; 375 actions wrap ↔ flex-wrap | none
src/components/tpo/tpo-campaign-compose.tsx | 10 responsive tokens reviewed | 375 control 44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 375 min-width 0 ↔ min-w-0; 375 width fluid ↔ w-full | none
src/components/tpo/tpo-communication-settings-editors.tsx | 7 responsive tokens reviewed | 375 control 44px ↔ min-h-11; 375 actions wrap ↔ flex-wrap; 375 width fluid ↔ w-full; 375 shared button sizing ↔ Button | none
src/components/tpo/tpo-company-create-form.tsx | 16 responsive tokens reviewed | 375 control 44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 375 min-width 0 ↔ min-w-0; 375 width fluid ↔ w-full | none
src/components/tpo/tpo-company-memory-workspace.tsx | 61 responsive tokens reviewed | 375 control 44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 375 grid stack ↔ grid-cols-1; 768 responsive grid ↔ sm:grid-cols | 375 grid 2→1
src/components/tpo/tpo-find-shortcut.tsx | 20 responsive tokens reviewed | 375 control 44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 375 actions wrap ↔ flex-wrap; 375 min-width 0 ↔ min-w-0 | none
src/components/tpo/tpo-grid-column-chooser.tsx | 15 responsive tokens reviewed | 375 control 44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 375 actions wrap ↔ flex-wrap; 375 min-width 0 ↔ min-w-0 | none
src/components/tpo/tpo-grid-filter-panel.tsx | 19 responsive tokens reviewed | 375 control 44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 768 responsive grid ↔ sm:grid-cols; 375 actions wrap ↔ flex-wrap | none
src/components/tpo/tpo-job-types-editor.tsx | 17 responsive tokens reviewed | 375 control 44px ↔ min-h-11; 375 grid stack ↔ grid-cols-1; 375 min-width 0 ↔ min-w-0; 375 width fluid ↔ w-full | none
src/components/tpo/tpo-new-followup-modal.tsx | 16 responsive tokens checked | 375 tap 44px ↔ min-h-11; 768 tap 36px ↔ md:min-h-9; 375 actions stack ↔ sm:flex-row; 375 width 100% ↔ w-full | none
src/components/tpo/tpo-new-recruiter-conversation.tsx | 20 responsive tokens checked | 375 tap 44px ↔ min-h-11; 768 tap 36px ↔ md:min-h-9; 375 min-width 0 ↔ min-w-0; 375 actions wrap ↔ flex-wrap | none
src/components/tpo/tpo-notice-audience-picker.tsx | 17 responsive tokens checked | 375 tap 44px ↔ min-h-11; 375 1-column grid ↔ grid-cols-1; ≥768 responsive grid ↔ sm:grid-cols-*; 375 min-width 0 ↔ min-w-0 | none
src/components/tpo/tpo-notice-delete-confirm.tsx | 10 responsive tokens checked | 375 tap 44px ↔ min-h-11; 768 tap 36px ↔ md:min-h-9; 375 min-width 0 ↔ min-w-0; 375 actions stack ↔ sm:flex-row | none
src/components/tpo/tpo-participation-decision-form.tsx | 11 responsive tokens checked | 375 tap 44px ↔ min-h-11; 768 tap 36px ↔ md:min-h-9; 375 min-width 0 ↔ min-w-0; 375 actions wrap ↔ flex-wrap | none
src/components/tpo/tpo-prep-readiness-editor.tsx | 12 responsive tokens checked | 375 tap 44px ↔ min-h-11; 375 min-width 0 ↔ min-w-0; 375 width 100% ↔ w-full; 375 control ↔ shared Button | none
src/components/tpo/tpo-public-join-link-card.tsx | 29 responsive tokens checked | 375 tap 44px ↔ min-h-11; 768 tap 36px ↔ md:min-h-9; ≥768 responsive grid ↔ sm:grid-cols-*; 375 min-width 0 ↔ min-w-0 | none
src/components/tpo/tpo-recruiter-message-reply.tsx | 19 responsive tokens checked | 375 tap 44px ↔ min-h-11; 768 tap 36px ↔ md:min-h-9; 375 min-width 0 ↔ min-w-0; 375 actions wrap ↔ flex-wrap | none
src/components/tpo/tpo-student-clipboard-actions.tsx | 8 responsive tokens checked | 375 tap 44px ↔ min-h-11; 768 tap 36px ↔ md:min-h-9; 375 actions wrap ↔ flex-wrap; 375 control ↔ shared Button | none
src/components/tpo/tpo-students-bulk-debar.tsx | 40 responsive tokens checked | 375 tap 44px ↔ min-h-11; 768 tap 36px ↔ md:min-h-9; 375 min-width 0 ↔ min-w-0; 375 actions stack ↔ sm:flex-row | none
src/components/tpo/tpo-team-away-form.tsx | 8 responsive tokens checked | 375 tap ≥44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 375 min-width 0 ↔ min-w-0; 375 header wraps ↔ flex-wrap | none
src/components/tpo/tpo-team-forms.tsx | 9 responsive tokens checked | 375 tap ≥44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 375 full width ↔ w-full; 375 controls ↔ shared Button | none
src/components/tpo/tpo-team-message-actions.tsx | 26 responsive tokens checked | 375 tap ≥44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 375 min-width 0 ↔ min-w-0; 375 header wraps ↔ flex-wrap | none
src/components/tpo/tpo-team-rename.tsx | 8 responsive tokens checked | 375 tap ≥44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 375 controls ↔ shared Button | none
src/components/tpo/tpo-trusted-domain-editor.tsx | 17 responsive tokens checked | 375 tap ≥44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; ≥768 responsive columns ↔ sm:grid-cols-*; 375 min-width 0 ↔ min-w-0 | none
src/components/tracker/audit-finding-status-action.tsx | 14 responsive tokens checked | 375 tap ≥44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; ≥768 responsive columns ↔ sm:grid-cols-*; 375 min-width 0 ↔ min-w-0 | none
src/components/tracker/tracker-issue-copy-actions.tsx | 10 responsive tokens checked | 375 tap ≥44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 375 min-width 0 ↔ min-w-0; 375 full width ↔ w-full | none
src/components/tracker/tracker-issue-saved-views.tsx | 18 responsive tokens checked | 375 tap ≥44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 375 min-width 0 ↔ min-w-0; 375 header wraps ↔ flex-wrap | none
src/components/ui/action-pagination.tsx | 10 responsive tokens checked | 375 tap ≥44px ↔ min-h-11; 768 control 36px ↔ md:min-h-9; 375 min-width 0 ↔ min-w-0; 375 header wraps ↔ flex-wrap | none
src/components/ui/button.tsx | 12 responsive tokens/properties inspected | 375 touch height 44px ↔ max-[767px]:min-h-11; 375 target 44px ↔ min-h-11; 375 breakpoint ≤767px ↔ max-[767px]; 768 breakpoint ≥768px ↔ md: | none
src/components/ui/dialog.tsx | 14 responsive tokens/properties inspected | 375 target 44px ↔ min-h-11; 375 breakpoint ≤767px ↔ max-[767px]; 768 breakpoint ≥768px ↔ md:; 768 breakpoint ≥640px ↔ sm: | none
src/components/ui/drawer.tsx | 46 responsive tokens/properties inspected | 375 target 44px ↔ min-h-11; 768 tablet breakpoint ≥768px ↔ media min-width:768px; 768 breakpoint ≥768px ↔ md:; 768 breakpoint ≥640px ↔ sm: | none
src/components/ui/dropdown.tsx | 25 responsive tokens/properties inspected | 375 target 44px ↔ min-h-11; 768 target 36px ↔ md:min-h-9; 768 tablet breakpoint ≥768px ↔ media min-width:768px; 768 breakpoint ≥768px ↔ md: | none
src/components/ui/legacy-overlays.css | 19 responsive tokens/properties inspected | 375 mobile breakpoint ≤767px ↔ media max-width:767px; 768 tablet breakpoint ≥768px ↔ media min-width:768px; 375 sidebar hidden ≤767px ↔ inherited old LMS shell rule | none
src/components/ui/multi-select.tsx | 11 responsive tokens/properties inspected | 375 touch height 44px ↔ max-[767px]:min-h-11; 375 target 44px ↔ min-h-11; 375 breakpoint ≤767px ↔ max-[767px]; 375 width 100% ↔ w-full | none
src/components/ui/page-header.tsx | 33 responsive tokens/properties inspected | 768 breakpoint ≥768px ↔ md:; 375 width 100% ↔ w-full; 375 content cap 100% ↔ max-w-full; 375 flex shrink ↔ min-w-0 | none
src/components/ui/search-field.tsx | 8 responsive tokens/properties inspected | 375 touch height 44px ↔ max-[767px]:min-h-11; 375 target 44px ↔ min-h-11; 375 breakpoint ≤767px ↔ max-[767px]; 375 width 100% ↔ w-full | none
src/components/ui/tabs.tsx | 8 responsive tokens/properties inspected | 375 target 44px ↔ min-h-11; 768 breakpoint ≥768px ↔ md:; 375 width 100% ↔ w-full; 375 flex shrink ↔ min-w-0 | none
src/components/ui/third-party-link.tsx | 9 responsive tokens/properties inspected | 375 target 44px ↔ min-h-11; 768 breakpoint ≥768px ↔ md:; 375 flex shrink ↔ min-w-0; 375 heading wrap ↔ flex-wrap | none
