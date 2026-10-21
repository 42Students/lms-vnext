# Work packet: edit src/app/(authenticated)/college/faculty-assignment/page.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l19-u019-faculty-teaching-assignment.md, docs/audit/gap2/lane-19/faculty-teaching-assignment-entity.md, docs/audit/gap2/lane-4/college-admin-faculty-assignment.md, docs/audit/gap2/lane-3/faculty-course-association.md

## G2-19-019-007  [P1] GAP  facet F03  effort L
- Legacy: FacultyTeachingAssignmentController.java:98-190 Create, Bulk, Update, Delete, Deactivate controls
- vNext now: src/app/(authenticated)/college/faculty-assignment/page.tsx:154-168 visible actions end/reassign; bulk/inline edit not evidenced
- Fix: Restore reachable Create, Create bulk, Edit Role and Deactivate actions with correct confirmation, or name replacement entry points

## G2-19-019-071  [P1] GAP  facet F23  effort L
- Legacy: Old page offers change faculty, course, class, batch, semester, year and active in one edit modal. `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:516-592`
- vNext now: vNext separates assignment creation, end, reassign, role edit and scoped delivery workflows. `src/app/(authenticated)/college/faculty-assignment/page.tsx:153-166` `src/app/(authenticated)/admin/faculty-assignment/page.tsx:33-43`
- Fix: Do not mark editing parity satisfied until every old field can be changed or a supported transition is documented.

## G2-4-005-002  [P1] GAP  facet F01  effort M
- Legacy: No college displays Admin not assigned to a college plus contact-admin guidance. (`docs/legacy-source/frontend/src/pages/college-admin/faculty-assignment.js:17-31`)
- vNext now: No membership redirects to dashboard. (`src/app/(authenticated)/college/faculty-assignment/page.tsx:32-33`)
- Fix: Provide missing-college warning instead of redirect.

## G2-4-005-006  [P1] GAP  facet F03  effort M
- Legacy: Edit and Delete icons/actions each row. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:370-379`)
- vNext now: End assignment and Reassign buttons instead. (`src/app/(authenticated)/college/faculty-assignment/page.tsx:153-167`)
- Fix: Implement complete edit and restore/delete policy.

## G2-4-005-009  [P1] GAP  facet F04  effort M
- Legacy: Fields faculty/course/class/batch/semester/year/role/is_active. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:353-380`)
- vNext now: Roster uses faculty/course/cohort/section/Period/role/active, no Year or Semester. (`src/app/(authenticated)/college/faculty-assignment/page.tsx:134-168`)
- Fix: Reinstate semester/year fields.

## G2-4-005-012  [P1] GAP  facet F05  effort M
- Legacy: Eight columns Faculty Course Class Semester Year Role Active Actions. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:353-380`)
- vNext now: Seven columns replacing Semester+Year with Period. (`src/app/(authenticated)/college/faculty-assignment/page.tsx:134-168`)
- Fix: Restore eight columns and order.

## G2-4-005-014  [P1] GAP  facet F05  effort M
- Legacy: Class filter by classId with complete options. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:477-483`)
- vNext now: Section-code filter from first200 delivery options. (`src/app/(authenticated)/college/faculty-assignment/page.tsx:87-97`)
- Fix: Allow all current/historical authorized classes.

## G2-3-020-019  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:66-133`
- vNext now: `src/app/(authenticated)/college/faculty-assignment/page.tsx:125-127`
- Fix: Legacy successful read returns bare list, vNext College roster page shows filters/error/skeleton and empty state `No matching assignments`. Ensure legacy fetch empty remains no data and UI clarity.
