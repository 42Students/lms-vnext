# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-20-011-015 [P1] GAP facet F08
- Verification: DEFERRED — quick grep insufficient for a safe mutation/UI parity decision.
- Files: (none, new feature)
- Legacy: Service catch-and-log persist failure, main operation continues `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobApplicationStatusHistoryServiceImpl.java:37-52`
- Expected fix: Decide audit integrity fail-closed vs legacy fail-open, implement consistent safe response/retry

## G2-20-029-004 [P1] GAP facet F02
- Verification: DEFERRED — quick grep insufficient for a safe mutation/UI parity decision.
- Files: src/components/admin/admin-program-directory.tsx
- Legacy: Create form always visible inside left Card (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:268-291`)
- Expected fix: Keep form expanded by default regardless of directory length

## G2-20-029-035 [P1] GAP facet F07
- Verification: DEFERRED — quick grep insufficient for a safe mutation/UI parity decision.
- Files: src/components/admin/admin-program-directory.tsx, src/components/academics/academics-actions.tsx
- Legacy: Create/update failure keeps closable Alert with field mapped BE validation and toast if no field error (`docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:125-129`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:151-159`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Programs.js:273-276`)
- Expected fix: Map backend field errors onto controls and display dismissible Alert

## G2-3-009-051 [P1] GAP facet F20
- Verification: DEFERRED — quick grep insufficient for a safe mutation/UI parity decision.
- Files: src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/Dashboard/course/Sudent/student.js:234-268`
- Expected fix: Legacy effect cancels stale roster fetch when classId switches, new redirect server scoped but client search/preview state may linger if deliveryId param changes.

## G2-3-031-041 [P1] MISSING facet F10
- Verification: OK — related UI/service behavior found in source; extended parity tests remain independent.
- Files: src/components/admin/super-admin-hr-accounts.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:531-536`
- Expected fix: Legacy detail Drawer has explicit Delete recruiter action; vNext account actions offer Suspend/Reactivate, session termination, grant edits but not deletion. Record product decision.

## G2-3-031-072 [P1] MISSING facet F23
- Verification: OK — related UI/service behavior found in source; extended parity tests remain independent.
- Files: src/components/admin/super-admin-hr-accounts.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:531-536`
- Expected fix: Delete recruiter not represented in new visible actions; verify separate authorized deletion route before dropping.

## G2-4-005-002 [P1] GAP facet F01
- Verification: DEFERRED — quick grep insufficient for a safe mutation/UI parity decision.
- Files: src/app/(authenticated)/college/faculty-assignment/page.tsx
- Legacy: No college displays Admin not assigned to a college plus contact-admin guidance. (`docs/legacy-source/frontend/src/pages/college-admin/faculty-assignment.js:17-31`)
- Expected fix: Provide missing-college warning instead of redirect.

## G2-4-027-028 [P1] GAP facet F07
- Verification: OK — related UI/service behavior found in source; extended parity tests remain independent.
- Files: src/components/admin/lecture-hall-manager.tsx
- Legacy: Delete conflict `Cannot delete lecture hall: it has scheduled classes. Remove or reassign those schedules first.` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LectureHallServiceImpl.java:148-151`)
- Expected fix: Restore delete conflict guidance or explicitly replace with archive policy.

## G2-4-027-035 [P1] MISSING facet F09
- Verification: DEFERRED — quick grep insufficient for a safe mutation/UI parity decision.
- Files: src/components/admin/lecture-hall-manager.tsx
- Legacy: Cancel dirty edit prompts `Discard edits to ...` with danger confirm (`docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:173-185`)
- Expected fix: Restore unsaved-changes guard and exact discard modal.

## G2-4-008-008 [P1] GAP facet F03
- Verification: DEFERRED — quick grep insufficient for a safe mutation/UI parity decision.
- Files: src/app/(authenticated)/admin/faculty-assignment/page.tsx, src/components/admin/super-admin-faculty-assignment-create.tsx, src/components/courses/admin-course-actions.tsx
- Legacy: Row buttons Edit and danger Delete with icons, ID-specific aria labels. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:370-379`)
- Expected fix: Expose full Edit modal with legacy icon/action placement, clarify End vs Delete.

## G2-4-008-012 [P1] GAP facet F03
- Verification: DEFERRED — quick grep insufficient for a safe mutation/UI parity decision.
- Files: src/components/admin/super-admin-faculty-assignment-create.tsx
- Legacy: Legacy assignment Create form and Edit modal expose all academic/candidate controls. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:405-473;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:516-598`)
- Expected fix: Restore complete form fields and edit permissions.

## G2-4-008-018 [P1] GAP facet F05
- Verification: DEFERRED — quick grep insufficient for a safe mutation/UI parity decision.
- Files: src/components/admin/admin-scoped-read-page.tsx, src/modules/admin-ui/super-admin-faculty-assignments-service.ts
- Legacy: Table columns Faculty, Course, Class, Semester, Year, Role, Active, Actions. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:353-381`)
- Expected fix: Restore 8-column DataTable with exact headings and tags.

## G2-4-008-024 [P1] MISSING facet F06
- Verification: DEFERRED — quick grep insufficient for a safe mutation/UI parity decision.
- Files: src/components/admin/super-admin-faculty-assignment-create.tsx
- Legacy: Academic Year accepts suggested or manually typed historical/future value `YYYY-YY` and variants. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:27-39;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:443-446`)
- Expected fix: Implement autocomplete and original regex for historical/future years.

## G2-4-008-025 [P1] GAP facet F06
- Verification: DEFERRED — quick grep insufficient for a safe mutation/UI parity decision.
- Files: src/components/admin/super-admin-faculty-assignment-create.tsx
- Legacy: Faculty dropdown searchable by name. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:449-454`)
- Expected fix: Provide searchable all-faculty picker or on-demand paging beyond 500.

## G2-4-008-026 [P1] GAP facet F06
- Verification: DEFERRED — quick grep insufficient for a safe mutation/UI parity decision.
- Files: src/components/admin/super-admin-faculty-assignment-create.tsx
- Legacy: Course(s) AntD multiple searchable chips, no hard 10-course bulk maximum in UI. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:456-463`)
- Expected fix: Decide bulk cap parity and restore searchable multi-select/tag presentation.

## G2-4-008-032 [P1] GAP facet F07
- Verification: DEFERRED — quick grep insufficient for a safe mutation/UI parity decision.
- Files: src/components/admin/super-admin-faculty-assignment-create.tsx
- Legacy: Old edit validates complete fields and maps backend field errors to each Form.Item. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:270-303`)
- Expected fix: Support field-level edit errors for class, cohort, course, year and role.

## G2-4-008-036 [P1] GAP facet F09
- Verification: DEFERRED — quick grep insufficient for a safe mutation/UI parity decision.
- Files: src/components/admin/super-admin-faculty-assignment-create.tsx
- Legacy: Legacy edit modal width500; title `Edit assignment: FACULTY · COURSE`, Save Changes and Cancel. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:516-520`)
- Expected fix: Rebuild full edit modal width500 with all legacy Form.Item controls.

## G2-4-008-039 [P1] GAP facet F10
- Verification: DEFERRED — quick grep insufficient for a safe mutation/UI parity decision.
- Files: src/components/admin/super-admin-faculty-assignment-create.tsx
- Legacy: Legacy create POST `/api/v1/teaching-assignment/create` or `/createBulk` with course IDs and explicit class,batch,year,semester,role,is_active. (`docs/legacy-source/frontend/src/api/Services/FacultyAssignmentService.js:5-9;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:206-223`)
- Expected fix: Preserve explicit academic year/semester and class scope in backend validation.

## G2-4-008-040 [P1] GAP facet F10
- Verification: DEFERRED — quick grep insufficient for a safe mutation/UI parity decision.
- Files: src/components/admin/super-admin-faculty-assignment-create.tsx
- Legacy: Legacy PUT `/api/v1/teaching-assignment/update/ID` can edit course/faculty/class/year/is_active. (`docs/legacy-source/frontend/src/api/Services/FacultyAssignmentService.js:11-12;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:270-284`)
- Expected fix: Create full update contract preserving optimistic protection.

## G2-4-008-069 [P1] GAP facet F21
- Verification: DEFERRED — quick grep insufficient for a safe mutation/UI parity decision.
- Files: src/components/admin/super-admin-faculty-assignment-create.tsx, src/components/courses/admin-course-actions.tsx
- Legacy: Legacy Java Admin APIs create, bulk, update, hard delete, deactivate; Java security scope validator. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyTeachingAssignmentController.java:98-190`)
- Expected fix: Map all five old mutation classes, ensure acting scope privilege.

## G2-4-008-070 [P1] GAP facet F21
- Verification: DEFERRED — quick grep insufficient for a safe mutation/UI parity decision.
- Files: src/components/admin/super-admin-faculty-assignment-create.tsx
- Legacy: Legacy per-course assignment selection derived from all course options, no 500 cap noted. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:111-130;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:456-463`)
- Expected fix: Implement paged searchable membership and deliveries beyond static caps.

## G2-4-029-036 [P1] GAP facet F11
- Verification: DEFERRED — quick grep insufficient for a safe mutation/UI parity decision.
- Files: src/modules/projects/resource-service.ts
- Legacy: Workspace detail independent of college module availability (`docs/legacy-source/frontend/src/components/admin/SuperAdminWorkspaceShell.jsx:9-10`)
- Expected fix: Ensure Super Admin global audit read not blocked by college module flag if old access allowed.

## G2-4-011-011 [P1] GAP facet F03
- Verification: DEFERRED — quick grep insufficient for a safe mutation/UI parity decision.
- Files: src/app/(authenticated)/admin/faculty-assignment/page.tsx, src/components/admin/super-admin-faculty-assignment-create.tsx
- Legacy: Edit pencil and Delete trash danger actions exist per row. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:370-379`)
- Expected fix: Expose full Edit and Delete per row with icons.

## G2-4-011-028 [P1] MISSING facet F06
- Verification: OK — related UI/service behavior found in source; extended parity tests remain independent.
- Files: src/components/admin/super-admin-faculty-assignment-create.tsx
- Legacy: Create Program required, searchable, placeholder Select program; changing resets dependent fields. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:196-200`; `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:406-412`)
- Expected fix: Add Program selector, required message, dependent clear.

## G2-4-011-029 [P1] MISSING facet F06
- Verification: DEFERRED — quick grep insufficient for a safe mutation/UI parity decision.
- Files: src/components/admin/super-admin-faculty-assignment-create.tsx
- Legacy: Create Batch required and disabled until Program. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:413-421`)
- Expected fix: Add dependent required Batch select.
