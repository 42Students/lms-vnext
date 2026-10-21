# Work packet: edit src/components/admin/super-admin-faculty-assignment-create.tsx (part 2 of 3)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/superadmin-sections-faculty-assignment.md, docs/audit/gap2/lane-4/l14-u027-faculty-course-association-controller.md, docs/audit/gap2/lane-4/superadmin-faculty-assignment.md

## G2-4-011-052  [P1] GAP  facet F10  effort L
- Legacy: Edit PUT /api/v1/teaching-assignment/update/:id with full fields. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:270-285`; `docs/legacy-source/frontend/src/api/Services/FacultyAssignmentService.js:11-12`)
- vNext now: PATCH /api/courses/teaching-assignments/:id only role and expectedUpdatedAt. (`src/components/admin/super-admin-faculty-assignment-create.tsx:136-146`)
- Fix: Implement full update for all editable fields.

## G2-4-011-057  [P1] GAP  facet F12  effort M
- Legacy: Role PRIMARY and is_active true defaults, optional academic year string. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:211-216`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyTeachingAssignment.java:39-47`)
- vNext now: Role PRIMARY and active derived from endedAt. (`src/components/admin/super-admin-faculty-assignment-create.tsx:26-26`; `src/db/schema/courses.ts:242-250`)
- Fix: Specify boolean-to-timestamp lifecycle mapping.

## G2-4-011-078  [P1] GAP  facet F20  effort S
- Legacy: Dirty cancel requires discard confirm. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:309-317`)
- vNext now: Role editor resets on toggle. (`src/components/admin/super-admin-faculty-assignment-create.tsx:152-160`)
- Fix: Confirm before losing changed role/form inputs.

## G2-4-011-081  [P1] GAP  facet F22  effort M
- Legacy: DTO fields academicYear and role max255, IDs min1, optional startDate/endDate. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/FacultyTeachingAssignmentDTO.java:13-35`)
- vNext now: New payload has deliveryIds/membershipId/role, no free text year/date. (`src/components/admin/super-admin-faculty-assignment-create.tsx:35-47`)
- Fix: Map missing validation and write fields or record approved retirement.

## G2-4-011-082  [P1] GAP  facet F22  effort M
- Legacy: Old active boolean can be toggled in edit form. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyTeachingAssignment.java:46-53`; `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:588-590`)
- vNext now: New endedAt lifecycle and optimistic timestamp edit for role. (`src/db/schema/courses.ts:242-260`; `src/components/admin/super-admin-faculty-assignment-create.tsx:136-146`)
- Fix: Preserve explicit active state or document reversible lifecycle.

## G2-4-011-084  [P1] GAP  facet F23  effort M
- Legacy: Legacy full edit and historical year authoring are present. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:405-473`; `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:516-593`)
- vNext now: New removes those from UI; decision rationale not present. (`src/components/admin/super-admin-faculty-assignment-create.tsx:69-118`; `src/components/admin/super-admin-faculty-assignment-create.tsx:123-171`)
- Fix: Seek explicit owner approval before declaring either removal intentional.

## G2-14-027-021  [P2] GAP  facet F08  effort M
- Legacy: Legacy bulk exact 'Bulk associations created successfully.' `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:75-87`
- vNext now: New SA create notice 'Teaching assignment created.' or N-count `src/components/admin/super-admin-faculty-assignment-create.tsx:44-52`
- Fix: Specify exact bulk partial success copy and distinguish atomic SA vs partial college.

## G2-4-008-029  [P2] MISSING  facet F07  effort M
- Legacy: Missing program/batch/class/semester each has exact field error `Select a program/batch/class/semester`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:405-440`)
- vNext now: Only one combined required select with browser-native message; generic error choose active delivery and faculty. (`src/components/admin/super-admin-faculty-assignment-create.tsx:34-40;src/components/admin/super-admin-faculty-assignment-create.tsx:69-78`)
- Fix: Restore per-field validators and messages.

## G2-4-008-030  [P2] MISSING  facet F07  effort M
- Legacy: Year must satisfy YYYY or YYYY-YY/YYYY-YYYY, error `Use YYYY-YY, YYYY-YYYY or YYYY.`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:27-39`)
- vNext now: No year input/error since derived via selected delivery. (`src/components/admin/super-admin-faculty-assignment-create.tsx:69-105`)
- Fix: Restore exact year syntax validation.

## G2-4-008-031  [P2] GAP  facet F07  effort M
- Legacy: Lookup failures display named programs/batches/classes/faculty/courses errors and `Retry options`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:103-132;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:395-399`)
- vNext now: No equivalent independent option load retries; only truncated faculty notice. (`src/components/admin/super-admin-faculty-assignment-create.tsx:59-70;src/components/admin/super-admin-faculty-assignment-create.tsx:107-110`)
- Fix: Add per-channel fetch retry and disable mutation on missing required options.

## G2-4-008-033  [P2] GAP  facet F08  effort M
- Legacy: Single-create toast `Created teaching assignment for this class.`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:217-223`)
- vNext now: One-create banner `Teaching assignment created.`. (`src/components/admin/super-admin-faculty-assignment-create.tsx:48-51`)
- Fix: Use exact success text when one delivery created.

## G2-4-008-034  [P2] GAP  facet F08  effort M
- Legacy: Updated toast `Updated assignment #ID.`; Delete `Deleted assignment #ID.`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:279-286;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:319-327`)
- vNext now: Edit role closes without success notice; End toast `Teaching assignment removed; history retained.`. (`src/components/admin/super-admin-faculty-assignment-create.tsx:133-148;src/components/courses/admin-course-actions.tsx:566-575`)
- Fix: Restore mutation ID/copy for equivalent actions and nonblocking toast.

## G2-4-011-038  [P2] GAP  facet F07  effort S
- Legacy: Required Program shows Select a program. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:406-408`)
- vNext now: No Program field; generic invalid-selection error. (`src/components/admin/super-admin-faculty-assignment-create.tsx:35-40`)
- Fix: Use field-level legacy program message.

## G2-4-011-039  [P2] GAP  facet F07  effort S
- Legacy: Required Batch shows Select a batch, Class shows Select a class. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:415-426`)
- vNext now: No Batch or Class fields. (`src/components/admin/super-admin-faculty-assignment-create.tsx:71-78`)
- Fix: Use two field-level required messages.

## G2-4-011-040  [P2] GAP  facet F07  effort S
- Legacy: Required Semester shows Select a semester. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:434-438`)
- vNext now: No Semester form validation. (`src/components/admin/super-admin-faculty-assignment-create.tsx:71-78`)
- Fix: Validate required semester explicitly.

## G2-4-011-041  [P2] GAP  facet F07  effort S
- Legacy: Required faculty shows Select faculty; courses shows Select one or more courses. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:449-459`)
- vNext now: New native-required plus generic Choose an active class delivery and faculty member. (`src/components/admin/super-admin-faculty-assignment-create.tsx:35-40`; `src/components/admin/super-admin-faculty-assignment-create.tsx:92-98`)
- Fix: Display distinct field validation messages.

## G2-4-011-042  [P2] MISSING  facet F07  effort S
- Legacy: Bad year shows Use YYYY-YY, YYYY-YYYY or YYYY. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:32-38`)
- vNext now: Year cannot be edited. (`src/components/admin/super-admin-faculty-assignment-create.tsx:69-78`)
- Fix: Restore exact regex error.

## G2-4-011-043  [P2] GAP  facet F07  effort M
- Legacy: Server field errors mapped by snake_case keys to AntD Form items. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:232-245`; `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:287-301`)
- vNext now: New FriendlyFetchError is displayed in one Alert. (`src/components/admin/super-admin-faculty-assignment-create.tsx:52-55`; `src/components/admin/super-admin-faculty-assignment-create.tsx:107-110`)
- Fix: Bind server validation to individual controls.

## G2-4-011-044  [P2] GAP  facet F08  effort S
- Legacy: Single success toast Created teaching assignment for this class. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:220-223`)
- vNext now: Inline notice Teaching assignment created. (`src/components/admin/super-admin-faculty-assignment-create.tsx:48-50`; `src/components/admin/super-admin-faculty-assignment-create.tsx:68-68`)
- Fix: Restore transient toast text.

## G2-4-011-045  [P2] GAP  facet F08  effort S
- Legacy: Bulk success toast Created N teaching assignments for this class. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:217-219`)
- vNext now: Similar text shown as persistent Alert rather than toast. (`src/components/admin/super-admin-faculty-assignment-create.tsx:49-50`; `src/components/admin/super-admin-faculty-assignment-create.tsx:68-68`)
- Fix: Use legacy transient toast position and duration.
