# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-4-011-030 [P1] MISSING facet F06
- Files: src/components/admin/super-admin-faculty-assignment-create.tsx
- Legacy: Create Class/Section required and disabled until Batch. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:423-430`)
- Expected fix: Add dependent required Class select.

## G2-4-011-031 [P1] MISSING facet F06
- Files: src/components/admin/super-admin-faculty-assignment-create.tsx
- Legacy: Create Semester required, loaded from selected Program. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:160-175`; `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:432-440`)
- Expected fix: Add semester lookup and selection with retry.

## G2-4-011-032 [P1] MISSING facet F06
- Files: src/components/admin/super-admin-faculty-assignment-create.tsx
- Legacy: Academic Year accepts YYYY, YYYY-YY, YYYY-YYYY and 27 autocomplete year suggestions. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:27-39`; `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:442-446`)
- Expected fix: Restore optional AutoComplete, regex and suggestions.

## G2-4-011-048 [P1] GAP facet F09
- Files: src/components/admin/super-admin-faculty-assignment-create.tsx
- Legacy: Unsaved edit cancel opens Discard assignment changes? confirmation. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:309-317`)
- Expected fix: Track dirty state and require discard confirmation.

## G2-4-011-050 [P1] GAP facet F10
- Files: src/components/admin/super-admin-faculty-assignment-create.tsx
- Legacy: Single create POST /api/v1/teaching-assignment/create with course_id, faculty_id, class_id, batch_id, semester_number, academic_year, role, is_active. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:206-223`; `docs/legacy-source/frontend/src/api/Services/FacultyAssignmentService.js:5-6`)
- Expected fix: Provide complete field mapping, especially historical semester/year.

## G2-4-011-052 [P1] GAP facet F10
- Files: src/components/admin/super-admin-faculty-assignment-create.tsx
- Legacy: Edit PUT /api/v1/teaching-assignment/update/:id with full fields. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:270-285`; `docs/legacy-source/frontend/src/api/Services/FacultyAssignmentService.js:11-12`)
- Expected fix: Implement full update for all editable fields.

## G2-4-011-057 [P1] GAP facet F12
- Files: src/components/admin/super-admin-faculty-assignment-create.tsx, src/db/schema/courses.ts
- Legacy: Role PRIMARY and is_active true defaults, optional academic year string. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:211-216`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyTeachingAssignment.java:39-47`)
- Expected fix: Specify boolean-to-timestamp lifecycle mapping.

## G2-4-011-078 [P1] GAP facet F20
- Files: src/components/admin/super-admin-faculty-assignment-create.tsx
- Legacy: Dirty cancel requires discard confirm. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:309-317`)
- Expected fix: Confirm before losing changed role/form inputs.

## G2-4-011-081 [P1] GAP facet F22
- Files: src/components/admin/super-admin-faculty-assignment-create.tsx
- Legacy: DTO fields academicYear and role max255, IDs min1, optional startDate/endDate. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/FacultyTeachingAssignmentDTO.java:13-35`)
- Expected fix: Map missing validation and write fields or record approved retirement.

## G2-4-011-084 [P1] GAP facet F23
- Files: src/components/admin/super-admin-faculty-assignment-create.tsx
- Legacy: Legacy full edit and historical year authoring are present. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:405-473`; `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:516-593`)
- Expected fix: Seek explicit owner approval before declaring either removal intentional.

## G2-4-013-002 [P1] GAP facet F01
- Files: src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx
- Legacy: Report opens from teacher All Assignments row and course Blueprint preview; both navigate with contentId alone. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:29-33`)
- Expected fix: Add legacy URL compatibility where single authorized delivery is known, safe chooser for multiple.

## G2-4-023-020 [P1] MISSING facet F06
- Files: src/components/tpo/tpo-company-create-form.tsx, src/app/api/placements/tpo/companies/create/route.ts
- Legacy: ResolveRequest fields name, website, recruiterEmail, notTheSame (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoCompanyController.java:39-45,52-58`)
- Expected fix: Accept/validate recruiterEmail domain and explicit distinct-company intent in resolution flow.

## G2-13-021-002 [P1] GAP facet F01
- Files: src/app/(authenticated)/admin/placements/screenings/page.tsx
- Legacy: Legacy score visible in job application sorting/details. `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ApplicationScreeningRepository.java:16-26`
- Expected fix: Provide read-only assessment details if retained.

## G2-5-002-068 [P1] GAP facet F22 Models/migrations
- Files: (none, new feature)
- Legacy: Status CONFIRMED and RESCHEDULE_REQUESTED persist. (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:49-54)
- Expected fix: Persist/respecify transitions with proper model migration.

## G2-5-006-068 [P1] GAP facet F22 Data/migrations
- Files: (none, new feature)
- Legacy: Settings stored global/org/college app_setting keys (docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:20-24; docs/legacy-source/frontend/src/components/admin/PolicySettingField.js:59-74)
- Expected fix: Migrate effective overrides without losing organization default/reset.

## G2-5-009-005 [P1] GAP facet F02 Layout/section order
- Files: (none, new feature)
- Legacy: Option/class-course error banners precede filters (docs/legacy-source/frontend/src/pages/superadmin/sections/Attendance.js:487-496)
- Expected fix: Show validation and retry banners in exact order.

## G2-5-010-036 [P1] GAP facet F07 Validation/errors
- Files: (none, new feature)
- Legacy: Partial setup lookup failure Retry options (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:429-435)
- Expected fix: Distinguish options unavailable vs zero programs.

## G2-5-017-026 [P1] GAP facet F10
- Files: src/modules/projects/template-rollback-service.ts
- Legacy: Legacy rollback restores full snapshot including lifecycle, publishedAt, archivedAt, deletion `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/versions.js:114-121`
- Expected fix: Document accepted intentional safer semantics and update legacy warning/rollback tests.

## G2-5-017-027 [P1] GAP facet F10
- Files: src/modules/projects/template-rollback-service.ts
- Legacy: Legacy changes generate history actions independent of version numbering `docs/legacy-source/backend/src/main/resources/db/migration/V160__project_template_version_sort_index.sql:1-7`
- Expected fix: Preserve all legacy action events in audit/event migration.

## G2-5-030-061 [P1] GAP facet F21
- Files: src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx
- Legacy: Legacy Sign-in writes branding loginMethods for actual college login. `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:109-148`
- Expected fix: Confirm selected method consumed by auth before claiming live.

## G2-5-031-021 [P1] GAP facet F06
- Files: src/components/admin/person-onboard-dialog.tsx
- Legacy: Legacy onValuesChange marks dirty for Manage College close guard. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:376-380`
- Expected fix: Add dirty confirm on modal/drawer close.

## G2-5-031-036 [P1] GAP facet F10
- Files: src/components/admin/person-onboard-dialog.tsx
- Legacy: Legacy createFacultyAdmin API, body includes role, first/last, mobile/email, college and org. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:131-173`, `docs/legacy-source/frontend/src/api/Services/SuperAdminUsersService.js:1-12`
- Expected fix: Map duplicate identity/role collision into exact admin creation results.

## G2-6-001-022 [P1] GAP facet F06
- Files: src/components/admin/person-onboard-dialog.tsx
- Legacy: Old registration requires First, Last, 10-digit Mobile, Department, Faculty Type `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:982-1065`
- Expected fix: Require department and explicit legacy Faculty Type selection during onboarding

## G2-6-001-028 [P1] GAP facet F06
- Files: src/components/admin/person-onboard-dialog.tsx, src/components/college/college-person-edit-action.tsx
- Legacy: Old submit Register Faculty inside inline Form; Edit Save Changes in 600px modal `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1103-1109` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1379-1393`
- Expected fix: Match button wording and dialog width/interaction conventions

## G2-6-001-040 [P1] GAP facet F10
- Files: src/components/admin/person-onboard-dialog.tsx, src/app/api/people/onboard/route.ts
- Legacy: Old POST `/api/v1/faculty/register` persists faculty `docs/legacy-source/frontend/src/api/Services/AdminService.js:213-215` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:106-170`
- Expected fix: Map department, faculty enum and old profile metadata into new transactional onboarding
