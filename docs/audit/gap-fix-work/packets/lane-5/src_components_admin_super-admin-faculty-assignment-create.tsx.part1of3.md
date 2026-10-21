# Work packet: edit src/components/admin/super-admin-faculty-assignment-create.tsx (part 1 of 3)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/superadmin-faculty-assignment.md, docs/audit/gap2/lane-4/superadmin-sections-faculty-assignment.md

## G2-4-008-008  [P1] GAP  facet F03  effort M
- Legacy: Row buttons Edit and danger Delete with icons, ID-specific aria labels. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:370-379`)
- vNext now: Active row has `Manage assignment` Disclosure, nested Edit role and End; no complete Edit/Delete icon. (`src/app/(authenticated)/admin/faculty-assignment/page.tsx:33-44;src/components/admin/super-admin-faculty-assignment-create.tsx:151-170;src/components/courses/admin-course-actions.tsx:548-555`)
- Fix: Expose full Edit modal with legacy icon/action placement, clarify End vs Delete.

## G2-4-008-012  [P1] GAP  facet F03  effort M
- Legacy: Legacy assignment Create form and Edit modal expose all academic/candidate controls. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:405-473;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:516-598`)
- vNext now: Create has limited delivery/faculty/role controls, Edit role changes only role. (`src/components/admin/super-admin-faculty-assignment-create.tsx:69-117;src/components/admin/super-admin-faculty-assignment-create.tsx:125-172`)
- Fix: Restore complete form fields and edit permissions.

## G2-4-008-023  [P1] MISSING  facet F06  effort M
- Legacy: Create Program/Batches/Classes/Semester separately with required labels and cascading choices. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:405-440`)
- vNext now: New single `Course / Class / Semester` combined select, no Program/Batch/semester fields. (`src/components/admin/super-admin-faculty-assignment-create.tsx:70-77`)
- Fix: Restore separate required Program, Batch, Class/Section and Semester controls.

## G2-4-008-024  [P1] MISSING  facet F06  effort M
- Legacy: Academic Year accepts suggested or manually typed historical/future value `YYYY-YY` and variants. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:27-39;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:443-446`)
- vNext now: New academic year inferred from delivery; no independent field. (`src/components/admin/super-admin-faculty-assignment-create.tsx:69-105`)
- Fix: Implement autocomplete and original regex for historical/future years.

## G2-4-008-025  [P1] GAP  facet F06  effort M
- Legacy: Faculty dropdown searchable by name. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:449-454`)
- vNext now: New native select lists up to first500 active members; no search. (`src/components/admin/super-admin-faculty-assignment-create.tsx:92-99;src/components/admin/super-admin-faculty-assignment-create.tsx:107-109`)
- Fix: Provide searchable all-faculty picker or on-demand paging beyond 500.

## G2-4-008-026  [P1] GAP  facet F06  effort M
- Legacy: Course(s) AntD multiple searchable chips, no hard 10-course bulk maximum in UI. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:456-463`)
- vNext now: Checkbox region chooses one primary + up to 9 additional same-class courses. (`src/components/admin/super-admin-faculty-assignment-create.tsx:30-38;src/components/admin/super-admin-faculty-assignment-create.tsx:79-90`)
- Fix: Decide bulk cap parity and restore searchable multi-select/tag presentation.

## G2-4-008-032  [P1] GAP  facet F07  effort M
- Legacy: Old edit validates complete fields and maps backend field errors to each Form.Item. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:270-303`)
- vNext now: New Edit role has simple API error banner/conflict wording. (`src/components/admin/super-admin-faculty-assignment-create.tsx:133-149`)
- Fix: Support field-level edit errors for class, cohort, course, year and role.

## G2-4-008-036  [P1] GAP  facet F09  effort M
- Legacy: Legacy edit modal width500; title `Edit assignment: FACULTY · COURSE`, Save Changes and Cancel. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:516-520`)
- vNext now: Only inline Edit role Disclosure; no width500 modal or full fields. (`src/components/admin/super-admin-faculty-assignment-create.tsx:151-172`)
- Fix: Rebuild full edit modal width500 with all legacy Form.Item controls.

## G2-4-008-039  [P1] GAP  facet F10  effort M
- Legacy: Legacy create POST `/api/v1/teaching-assignment/create` or `/createBulk` with course IDs and explicit class,batch,year,semester,role,is_active. (`docs/legacy-source/frontend/src/api/Services/FacultyAssignmentService.js:5-9;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:206-223`)
- vNext now: New POST `/api/admin/faculty-assignment/batch` with deliveryIds,membershipId,role only. (`src/components/admin/super-admin-faculty-assignment-create.tsx:34-51`)
- Fix: Preserve explicit academic year/semester and class scope in backend validation.

## G2-4-008-040  [P1] GAP  facet F10  effort M
- Legacy: Legacy PUT `/api/v1/teaching-assignment/update/ID` can edit course/faculty/class/year/is_active. (`docs/legacy-source/frontend/src/api/Services/FacultyAssignmentService.js:11-12;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:270-284`)
- vNext now: New PATCH `/api/courses/teaching-assignments/ID` only role+expectedUpdatedAt. (`src/components/admin/super-admin-faculty-assignment-create.tsx:133-142`)
- Fix: Create full update contract preserving optimistic protection.

## G2-4-008-069  [P1] GAP  facet F21  effort M
- Legacy: Legacy Java Admin APIs create, bulk, update, hard delete, deactivate; Java security scope validator. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyTeachingAssignmentController.java:98-190`)
- vNext now: New batched admin creation and generic course teaching assignment role edit/end API. (`src/components/admin/super-admin-faculty-assignment-create.tsx:34-51;src/components/admin/super-admin-faculty-assignment-create.tsx:133-149;src/components/courses/admin-course-actions.tsx:566-575`)
- Fix: Map all five old mutation classes, ensure acting scope privilege.

## G2-4-008-070  [P1] GAP  facet F21  effort M
- Legacy: Legacy per-course assignment selection derived from all course options, no 500 cap noted. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:111-130;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:456-463`)
- vNext now: New workspace restricts active delivery list and first500 faculty warning. (`src/components/admin/super-admin-faculty-assignment-create.tsx:30-39;src/components/admin/super-admin-faculty-assignment-create.tsx:107-109`)
- Fix: Implement paged searchable membership and deliveries beyond static caps.

## G2-4-011-011  [P1] GAP  facet F03  effort M
- Legacy: Edit pencil and Delete trash danger actions exist per row. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:370-379`)
- vNext now: Manage assignment disclosure and Edit role plus other actions. (`src/app/(authenticated)/admin/faculty-assignment/page.tsx:33-43`; `src/components/admin/super-admin-faculty-assignment-create.tsx:152-171`)
- Fix: Expose full Edit and Delete per row with icons.

## G2-4-011-028  [P1] MISSING  facet F06  effort M
- Legacy: Create Program required, searchable, placeholder Select program; changing resets dependent fields. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:196-200`; `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:406-412`)
- vNext now: No Program field; delivery text combines several entities. (`src/components/admin/super-admin-faculty-assignment-create.tsx:70-78`)
- Fix: Add Program selector, required message, dependent clear.

## G2-4-011-029  [P1] MISSING  facet F06  effort M
- Legacy: Create Batch required and disabled until Program. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:413-421`)
- vNext now: Batch is embedded in delivery option. (`src/components/admin/super-admin-faculty-assignment-create.tsx:71-77`)
- Fix: Add dependent required Batch select.

## G2-4-011-030  [P1] MISSING  facet F06  effort M
- Legacy: Create Class/Section required and disabled until Batch. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:423-430`)
- vNext now: Class is embedded in delivery option. (`src/components/admin/super-admin-faculty-assignment-create.tsx:71-77`)
- Fix: Add dependent required Class select.

## G2-4-011-031  [P1] MISSING  facet F06  effort M
- Legacy: Create Semester required, loaded from selected Program. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:160-175`; `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:432-440`)
- vNext now: No independent semester selection. (`src/components/admin/super-admin-faculty-assignment-create.tsx:71-77`)
- Fix: Add semester lookup and selection with retry.

## G2-4-011-032  [P1] MISSING  facet F06  effort M
- Legacy: Academic Year accepts YYYY, YYYY-YY, YYYY-YYYY and 27 autocomplete year suggestions. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:27-39`; `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:442-446`)
- vNext now: No editable academic year input. (`src/components/admin/super-admin-faculty-assignment-create.tsx:69-78`)
- Fix: Restore optional AutoComplete, regex and suggestions.

## G2-4-011-048  [P1] GAP  facet F09  effort M
- Legacy: Unsaved edit cancel opens Discard assignment changes? confirmation. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:309-317`)
- vNext now: Role editor closes/reset without discard confirm. (`src/components/admin/super-admin-faculty-assignment-create.tsx:152-160`)
- Fix: Track dirty state and require discard confirmation.

## G2-4-011-050  [P1] GAP  facet F10  effort L
- Legacy: Single create POST /api/v1/teaching-assignment/create with course_id, faculty_id, class_id, batch_id, semester_number, academic_year, role, is_active. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:206-223`; `docs/legacy-source/frontend/src/api/Services/FacultyAssignmentService.js:5-6`)
- vNext now: POST /api/admin/faculty-assignment/batch with deliveryIds, membershipId, role. (`src/components/admin/super-admin-faculty-assignment-create.tsx:41-47`)
- Fix: Provide complete field mapping, especially historical semester/year.
