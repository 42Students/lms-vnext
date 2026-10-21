# Work packet (wave 2): edit src/components/college/college-faculty-assignment-actions.tsx

18 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/faculty-course-association.md, docs/audit/gap2/lane-4/college-admin-faculty-assignment.md, docs/audit/gap2/lane-4/l14-u027-faculty-course-association-controller.md, docs/audit/gap2/lane-9/l19-u019-faculty-teaching-assignment.md, docs/audit/gap2/lane-19/faculty-teaching-assignment-entity.md

## G2-3-020-006  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:90-99`
- vNext now: `src/components/college/college-faculty-assignment-actions.tsx:175-217`
- Fix: Legacy deactivate action responds `Association deactivated successfully.`, vNext End assignment succeeds with `Deleted assignment. Teaching history is retained.`. Match workflow message if this is the mapped control.

## G2-3-020-012  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/FacultyCourseAssociationCreateRequestDTO.java:9-13`
- vNext now: `src/components/college/college-faculty-assignment-actions.tsx:110-168`
- Fix: Legacy create takes facultyId int and list of courseIds, possibly empty; vNext creator requires college program/batch/class/faculty/role and checked courses. Align default role and labels.

## G2-3-020-013  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/BulkFacultyCourseAssociationCreateRequestDTO.java:6-8`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:77-95`
- vNext now: `src/components/college/college-faculty-assignment-actions.tsx:151-168`, `src/modules/courses/teaching-assignment-service.ts:139-277`
- Fix: Legacy createBulk allows many faculty each with list courseIds in one bulk request; vNext UI assign-many courses to one faculty and service creates individual delivery assignment. Add multiple-faculty batch import with partial diagnostics.

## G2-3-020-036  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:53-64`, `75-99`
- vNext now: `src/components/college/college-faculty-assignment-actions.tsx:163-171`, `197-211`
- Fix: Legacy literal create/bulk/deactivate messages differ from VNext `Assign to N course(s)` and `Deleted assignment. Teaching history is retained.`. Restore exact copy on mapped actions.

## G2-3-020-039  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:77-96`
- vNext now: `src/components/college/college-faculty-assignment-actions.tsx:151-168`
- Fix: Legacy bulk writes saveAll in one service call; vNext multiple selected assignments may generate one API request per selected course. Batch in transaction with bounded result/errors.

## G2-4-005-005  [P2] GAP  facet F03  effort M
- Legacy: Create Assignment with PlusOutlined; disabled while lookups fail. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:471-473`)
- vNext now: Assign to N course(s) button without plus icon. (`src/components/college/college-faculty-assignment-actions.tsx:163-166`)
- Fix: Restore exact legacy value and interaction unless explicitly approved.

## G2-4-005-017  [P2] GAP  facet F06  effort M
- Legacy: Program, dependent Batch, Class, semester, academic year, Faculty, multi-courses, role. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:405-473`)
- vNext now: Similar cascade but courses displayed as checkbox list, year fixed choices. (`src/components/college/college-faculty-assignment-actions.tsx:100-168`)
- Fix: Restore exact legacy value and interaction unless explicitly approved.

## G2-4-005-020  [P2] GAP  facet F06  effort M
- Legacy: Course multi searchable select with responsive tags. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:456-463`)
- vNext now: Scrollable checkbox course list. (`src/components/college/college-faculty-assignment-actions.tsx:151-162`)
- Fix: Restore exact legacy value and interaction unless explicitly approved.

## G2-4-005-030  [P2] GAP  facet F09  effort M
- Legacy: Delete confirm says Delete teaching assignment? Removes faculty from course. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:373-379`)
- vNext now: End ROLE assignment? history retained, cannot undo. (`src/components/college/college-faculty-assignment-actions.tsx:205-218`)
- Fix: Restore exact legacy value and interaction unless explicitly approved.

## G2-4-005-038  [P2] GAP  facet F13  effort M
- Legacy: Lookup errors aggregate five sources, show Some selection options are unavailable + Retry options. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:103-132;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:395-399`)
- vNext now: Static server options and first200 truncation warning, no retry. (`src/app/(authenticated)/college/faculty-assignment/page.tsx:51-58;src/components/college/college-faculty-assignment-actions.tsx:169-171`)
- Fix: Restore exact legacy value and interaction unless explicitly approved.

## G2-4-005-045  [P2] GAP  facet F16  effort M
- Legacy: Desktop two card columns lg10/lg14, compact small tables. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:400-476`)
- vNext now: Disclosure form xl four columns, full roster below. (`src/app/(authenticated)/college/faculty-assignment/page.tsx:59-82;src/components/college/college-faculty-assignment-actions.tsx:100-151`)
- Fix: Restore exact legacy value and interaction unless explicitly approved.

## G2-4-005-047  [P2] GAP  facet F17  effort M
- Legacy: Legacy row buttons aria-label include assignment ID. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:370-379`)
- vNext now: End/Reassign buttons repeated accessible name. (`src/components/college/college-faculty-assignment-actions.tsx:205-208;src/components/college/college-faculty-reassign-action.tsx:41-45`)
- Fix: Include row-specific faculty/class/id in accessible name.

## G2-4-005-050  [P2] GAP  facet F18  effort M
- Legacy: Create card Create teaching assignment; button Create Assignment. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:402;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:471-473`)
- vNext now: Disclosure and Assign to N course(s) action. (`src/app/(authenticated)/college/faculty-assignment/page.tsx:67-69;src/components/college/college-faculty-assignment-actions.tsx:163-166`)
- Fix: Restore exact legacy value and interaction unless explicitly approved.

## G2-4-005-051  [P2] GAP  facet F18  effort M
- Legacy: Year placeholder YYYY-YY, course Select one or more courses. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:443-461`)
- vNext now: Years dropdown; courses checklist. (`src/components/college/college-faculty-assignment-actions.tsx:129-161`)
- Fix: Restore exact legacy value and interaction unless explicitly approved.

## G2-4-005-058  [P2] GAP  facet F21  effort M
- Legacy: Legacy separate create/update/delete/deactivate controllers. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyTeachingAssignmentController.java:98-190`)
- vNext now: vNext exposes bulk/reassign/end from UI. (`src/components/college/college-faculty-assignment-actions.tsx:79-82;src/components/college/college-faculty-reassign-action.tsx:28-33`)
- Fix: Map each supported mutation.

## G2-14-027-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy endpoint base /api/v1/faculty-course-associations with six operations `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:20-22`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:53-134`
- vNext now: New routes /api/college/teaching-assignments/bulk and /api/admin/faculty-assignment/batch `src/components/college/college-faculty-assignment-actions.tsx:81-90`; `src/app/api/admin/faculty-assignment/batch/route.ts:9-17`
- Fix: Document endpoint migration and each caller's course-vs-delivery ID mapping.

## G2-19-019-075  [P2] MISSING  facet F23  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyTeachingAssignment.java:49-53 optional planned teaching start/end dates
- vNext now: src/components/college/college-faculty-assignment-actions.tsx:40-62,97-168 filters academic year but no editable teacher start/end
- Fix: Add dates to form or approved retirement note.

## G2-19-019-059  [P3] GAP  facet F18  effort S
- Legacy: Old prompts Select program, Select batch, Select class, Select semester, Select faculty, Select one or more courses. `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:405-463`
- vNext now: vNext Choose program, Choose batch, Choose class and semester/year All options. `src/components/college/college-faculty-assignment-actions.tsx:101-143`
- Fix: Align exact placeholder verbs and required-field messages.
