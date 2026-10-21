# Work packet: edit src/components/college/college-faculty-assignment-actions.tsx

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/faculty-course-association.md, docs/audit/gap2/lane-4/college-admin-faculty-assignment.md, docs/audit/gap2/lane-4/l14-u027-faculty-course-association-controller.md

## G2-3-020-046  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:77-96`
- vNext now: `src/components/college/college-faculty-assignment-actions.tsx:151-168`
- Fix: Bulk associating multiple faculty each with multiple courses in one operation is not evidenced in current vNext college creator; restore multi-faculty bulk parity or document approved scope reduction.

## G2-4-005-018  [P1] GAP  facet F06  effort M
- Legacy: Semester Select required with Select a semester error. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:432-440`)
- vNext now: Semester dropdown optional All semesters. (`src/components/college/college-faculty-assignment-actions.tsx:122-128`)
- Fix: Require exact semester selection.

## G2-4-005-019  [P1] GAP  facet F06  effort M
- Legacy: Academic year AutoComplete accepts YYYY, YYYY-YY or YYYY-YYYY, with 27 suggestions. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:27-39;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:443-446`)
- vNext now: Year dropdown from active deliveries only. (`src/components/college/college-faculty-assignment-actions.tsx:59-62;src/components/college/college-faculty-assignment-actions.tsx:129-134`)
- Fix: Allow custom historic/future year.

## G2-4-005-031  [P1] GAP  facet F10  effort M
- Legacy: Create POST create/createBulk sends explicit year, semester, class, batch. (`docs/legacy-source/frontend/src/api/Services/FacultyAssignmentService.js:5-9;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:206-223`)
- vNext now: Bulk sends delivery IDs/member/role; year derived from offering. (`src/components/college/college-faculty-assignment-actions.tsx:70-94`)
- Fix: Preserve year/semester selection in data contract.

## G2-4-005-032  [P1] GAP  facet F10  effort M
- Legacy: Edit PUT update/id accepts complete assignment fields. (`docs/legacy-source/frontend/src/api/Services/FacultyAssignmentService.js:11-12;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:270-284`)
- vNext now: Only PATCH Reassign, DELETE End. (`src/components/college/college-faculty-reassign-action.tsx:28-33;src/components/college/college-faculty-assignment-actions.tsx:193-196`)
- Fix: Restore complete edit mutation.

## G2-4-005-033  [P1] GAP  facet F10  effort M
- Legacy: Deletion and deactivation are distinct Java endpoints. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyTeachingAssignmentController.java:319-337;docs/legacy-source/frontend/src/api/Services/FacultyAssignmentService.js:14-18`)
- vNext now: End always retains historical record. (`src/components/college/college-faculty-assignment-actions.tsx:193-218`)
- Fix: Decide hard-delete vs soft-end and preserve parity.

## G2-4-005-054  [P1] GAP  facet F20  effort M
- Legacy: Legacy supports historical/future custom academic years. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:27-39;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:443-446`)
- vNext now: Only active delivery years selected. (`src/components/college/college-faculty-assignment-actions.tsx:59-62;src/components/college/college-faculty-assignment-actions.tsx:129-134`)
- Fix: Allow free year entry.

## G2-4-005-060  [P1] GAP  facet F22  effort M
- Legacy: Legacy delete versus soft-deactivate distinct. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyTeachingAssignmentController.java:159-190`)
- vNext now: History always kept on End. (`src/components/college/college-faculty-assignment-actions.tsx:193-218`)
- Fix: Document deletion mapping.

## G2-3-020-018  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:53-64`, `75-87`, `90-99`
- vNext now: `src/components/college/college-faculty-assignment-actions.tsx:163-171`, `197-211`
- Fix: Legacy success strings `Association created successfully.`, `Bulk associations created successfully.`, `Association deactivated successfully.`; vNext success alerts and End history message differ. Match UI copy per operation.

## G2-4-005-022  [P2] GAP  facet F07  effort M
- Legacy: Specific validation Select a program, Select a batch, Select a class. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:405-429`)
- vNext now: Native required select errors. (`src/components/college/college-faculty-assignment-actions.tsx:100-120`)
- Fix: Restore exact legacy value and interaction unless explicitly approved.

## G2-4-005-023  [P2] MISSING  facet F07  effort M
- Legacy: Year error Use YYYY-YY, YYYY-YYYY or YYYY. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:32-39`)
- vNext now: No free year entry or equivalent error. (`src/components/college/college-faculty-assignment-actions.tsx:129-134`)
- Fix: Restore validator and custom input.

## G2-4-005-024  [P2] GAP  facet F07  effort M
- Legacy: Faculty required Select faculty; course Select one or more courses. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:449-463`)
- vNext now: Combined error Select a faculty member and at least one course to assign. (`src/components/college/college-faculty-assignment-actions.tsx:70-76`)
- Fix: Restore exact legacy value and interaction unless explicitly approved.

## G2-4-005-025  [P2] GAP  facet F08  effort M
- Legacy: Singular create message Created teaching assignment for this class. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:206-223`)
- vNext now: Created 1 teaching assignments for this class. (`src/components/college/college-faculty-assignment-actions.tsx:83-89`)
- Fix: Restore exact legacy value and interaction unless explicitly approved.

## G2-4-005-027  [P2] GAP  facet F08  effort M
- Legacy: Edit toast Updated assignment #id; delete toast Deleted assignment #id. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:279-286;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:319-327`)
- vNext now: End says Deleted assignment. Teaching history is retained. (`src/components/college/college-faculty-assignment-actions.tsx:193-200`)
- Fix: Restore exact legacy value and interaction unless explicitly approved.

## G2-14-027-020  [P2] GAP  facet F08  effort M
- Legacy: Legacy single create response exactly 'Association created successfully.' `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:53-64`
- vNext now: New batch 201 JSON assignments, UI 'Created N teaching assignments for this class.' `src/app/api/admin/faculty-assignment/batch/route.ts:9-18`; `src/components/college/college-faculty-assignment-actions.tsx:91-99`
- Fix: Align old toast response for legacy callers or approve improved count copy.
