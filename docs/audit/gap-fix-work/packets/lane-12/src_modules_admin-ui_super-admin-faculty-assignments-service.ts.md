# Work packet: edit src/modules/admin-ui/super-admin-faculty-assignments-service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/superadmin-faculty-assignment.md, docs/audit/gap2/lane-4/superadmin-sections-faculty-assignment.md

## G2-4-008-013  [P1] GAP  facet F04  effort M
- Legacy: Legacy row includes facultyId, courseId, classId, batchId, semesterNumber, academicYear, role and isActive. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:353-380;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:206-216`)
- vNext now: New joined DB row includes membership, delivery, section, period derived attributes, role, status and dates. (`src/modules/admin-ui/super-admin-faculty-assignments-service.ts:15-29;src/modules/admin-ui/super-admin-faculty-assignments-service.ts:67-73`)
- Fix: Map exact semester number and explicit academic year, not academicPeriod start year by default.

## G2-4-008-018  [P1] GAP  facet F05  effort M
- Legacy: Table columns Faculty, Course, Class, Semester, Year, Role, Active, Actions. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:353-381`)
- vNext now: Generic article rows with title/subtitle/details and action disclosure, no column headings. (`src/components/admin/admin-scoped-read-page.tsx:223-263;src/modules/admin-ui/super-admin-faculty-assignments-service.ts:67-73`)
- Fix: Restore 8-column DataTable with exact headings and tags.

## G2-4-008-046  [P1] GAP  facet F12  effort M
- Legacy: Legacy updates `is_active=false` via Edit, can later reactivate; separate deactivate endpoint. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:259-284;docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyTeachingAssignmentController.java:176-190`)
- vNext now: New ENDED when teaching/delivery end, End retention, no reactivation UI. (`src/modules/admin-ui/super-admin-faculty-assignments-service.ts:51-73;src/components/courses/admin-course-actions.tsx:566-575`)
- Fix: Specify reactivation/end transition parity and add allowed operations.

## G2-4-008-072  [P1] GAP  facet F22  effort M
- Legacy: Legacy deletion and deactivate distinct; old stats count inactives. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyTeachingAssignmentController.java:159-190;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:383-392`)
- vNext now: New End retains record and class count derived from scoped active/ended list. (`src/modules/admin-ui/super-admin-faculty-assignments-service.ts:51-73`)
- Fix: Resolve archived-history semantics and counting of inactive assignments.

## G2-4-011-018  [P1] GAP  facet F04  effort M
- Legacy: Semester number and academic year string show as Sem N or em dash and raw year or em dash. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:366-367`)
- vNext now: Period name and first four chars of start date displayed instead. (`src/modules/admin-ui/super-admin-faculty-assignments-service.ts:25-27`; `src/modules/admin-ui/super-admin-faculty-assignments-service.ts:71-72`)
- Fix: Return original semester and academic-year semantics including empty value placeholders.

## G2-4-011-019  [P1] GAP  facet F04  effort M
- Legacy: Legacy is_active bool defaults true; table says Yes or No. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyTeachingAssignment.java:46-47`; `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:369-369`)
- vNext now: New active derived from assignment and delivery ended_at. (`src/modules/admin-ui/super-admin-faculty-assignments-service.ts:14-14`; `src/modules/admin-ui/super-admin-faculty-assignments-service.ts:70-72`)
- Fix: Define active/status mapping and display legacy Yes/No field.

## G2-4-011-080  [P1] GAP  facet F22  effort L
- Legacy: Old table has int faculty/course/class/batch, int semester, varchar academic_year, bool is_active, role, start/end date. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyTeachingAssignment.java:18-60`)
- vNext now: New table has UUID delivery/membership, role, startedAt/endedAt timestamps; join resolves cohort/section/year. (`src/db/schema/courses.ts:228-260`; `src/modules/admin-ui/super-admin-faculty-assignments-service.ts:29-48`)
- Fix: Document each column transformation, null and history semantics.
