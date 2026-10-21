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
