# Work packet (wave 2): edit src/components/admin/super-admin-faculty-assignment-create.tsx

28 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/l14-u027-faculty-course-association-controller.md, docs/audit/gap2/lane-4/superadmin-faculty-assignment.md, docs/audit/gap2/lane-4/superadmin-sections-faculty-assignment.md

## G2-14-027-040  [P2] GAP  facet F18  effort M
- Legacy: Exact API success wording 'Association created successfully.' and 'Bulk associations created successfully.' `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:62-64`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:86-87`
- vNext now: New 'Teaching assignment created.' and 'Created N...' `src/components/admin/super-admin-faculty-assignment-create.tsx:44-52`
- Fix: Create copy matrix for compatibility actions.

## G2-4-008-007  [P2] GAP  facet F03  effort M
- Legacy: Create `Create Assignment` primary with Plus icon; immediately visible form. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:400-405;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:471-473`)
- vNext now: Secondary toggle `Create teaching assignment` opens create form, submit `Assign faculty`. (`src/components/admin/super-admin-faculty-assignment-create.tsx:59-70;src/components/admin/super-admin-faculty-assignment-create.tsx:111-117`)
- Fix: Use legacy primary submit label/icon and expanded initial form.

## G2-4-008-017  [P2] GAP  facet F04  effort M
- Legacy: Client success notices use `Created teaching assignment for this class` and `Created N teaching assignments for this class`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:206-223`)
- vNext now: New one-course success `Teaching assignment created.` and plural matches old. (`src/components/admin/super-admin-faculty-assignment-create.tsx:44-51`)
- Fix: Match singular toast exactly.

## G2-4-008-028  [P2] GAP  facet F06  effort M
- Legacy: After save, retained program/batch/class/semester/year/faculty/role; only course selection reset. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:224-230`)
- vNext now: New closes form and resets all selected delivery/faculty/role values. (`src/components/admin/super-admin-faculty-assignment-create.tsx:44-51`)
- Fix: Retain cohort and faculty context for rapid consecutive assignments.

## G2-4-008-037  [P2] GAP  facet F09  effort M
- Legacy: Dirty edit Cancel asks `Discard assignment changes?`, confirm danger `Discard changes`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:305-317`)
- vNext now: Role edit disclosure toggles off without confirming dirty values. (`src/components/admin/super-admin-faculty-assignment-create.tsx:152-169`)
- Fix: Guard dirty-form cancel with discard confirmation.

## G2-4-008-047  [P2] GAP  facet F12  effort M
- Legacy: Legacy bulk create can choose multiple courses for chosen cohort and semester. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:206-230`)
- vNext now: New enforces <=10 deliveryIds all in same section, includes fixed academicPeriod. (`src/components/admin/super-admin-faculty-assignment-create.tsx:30-39`)
- Fix: Reconcile any old >10-course selection and semester/year mapping.

## G2-4-008-056  [P2] GAP  facet F16  effort M
- Legacy: Legacy desktop AntD two-card Row Col xs24 lg10/lg14; form has sm12 columns. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:400-476;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:476-514`)
- vNext now: New full-width responsive form md2 columns above article rows. (`src/components/admin/super-admin-faculty-assignment-create.tsx:69-117;src/components/admin/admin-scoped-read-page.tsx:247-263`)
- Fix: Reproduce legacy lg card split and form breakpoint.

## G2-4-008-058  [P2] GAP  facet F16  effort M
- Legacy: Old edit 500px modal centered with maskClosable=false. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:516-520`)
- vNext now: New inline role edit instead of modal; no analogous width/backdrop. (`src/components/admin/super-admin-faculty-assignment-create.tsx:151-172`)
- Fix: Reintroduce modal width and responsive max-width handling.

## G2-4-008-059  [P2] GAP  facet F17  effort M
- Legacy: Old Edit/Delete buttons aria-label with assignment ID; class filter aria-label. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:370-379;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:477-483`)
- vNext now: Manage disclosure and generic Edit role/End buttons repeat across rows. (`src/app/(authenticated)/admin/faculty-assignment/page.tsx:33-44;src/components/admin/super-admin-faculty-assignment-create.tsx:151-156`)
- Fix: Make every action accessible name record-unique.

## G2-4-008-061  [P2] GAP  facet F18  effort M
- Legacy: Heading `Faculty Assignments`, cards `Create teaching assignment` and `Current teaching assignments`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:383-386;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:402;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:477`)
- vNext now: New heading matches, intro create toggle, no Current teaching assignments card heading. (`src/app/(authenticated)/admin/faculty-assignment/page.tsx:25-31;src/components/admin/super-admin-faculty-assignment-create.tsx:59-64`)
- Fix: Restore card heading and title placements.

## G2-4-008-062  [P2] GAP  facet F18  effort M
- Legacy: Old `Create Assignment`, `Edit`, `Delete`, `Save Changes`, `Filter by class`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:370-379;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:471-483;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:516-520`)
- vNext now: New `Create teaching assignment`, `Assign faculty`, `Edit role`, `End`, `All classes`. (`src/components/admin/super-admin-faculty-assignment-create.tsx:59-64;src/components/admin/super-admin-faculty-assignment-create.tsx:111-117;src/components/admin/super-admin-faculty-assignment-create.tsx:151-169;src/components/courses/admin-course-actions.tsx:548-555;src/components/admin/admin-scoped-read-page.tsx:179-183`)
- Fix: Match exact legacy action copy or scope-approved variants.

## G2-4-008-063  [P2] GAP  facet F18  effort M
- Legacy: Old Academic Year placeholder YYYY-YY and Course(s) `Select one or more courses`. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:443-463`)
- vNext now: No year field; Course/Class/Semester combined, checkbox list. (`src/components/admin/super-admin-faculty-assignment-create.tsx:70-90`)
- Fix: Restore exact placeholder/help and field order.

## G2-4-008-067  [P2] GAP  facet F20  effort M
- Legacy: Legacy post-create retains choices (except courses), facilitating multiple creates. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:224-230`)
- vNext now: New clears everything and collapses form. (`src/components/admin/super-admin-faculty-assignment-create.tsx:44-51`)
- Fix: Retain last cohort/faculty context.

## G2-4-011-006  [P2] GAP  facet F02  effort M
- Legacy: Create teaching assignment form appears directly inside left Card. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:400-405`)
- vNext now: Create form is collapsed until secondary button is clicked. (`src/components/admin/super-admin-faculty-assignment-create.tsx:59-69`)
- Fix: Show create form in left card initially.

## G2-4-011-008  [P2] GAP  facet F02  effort M
- Legacy: Fields run Program then Batch/Class, Semester/Year, Faculty, Courses, Role, submit. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:405-473`)
- vNext now: Single Course/Class/Semester delivery select precedes course checkboxes, faculty and role. (`src/components/admin/super-admin-faculty-assignment-create.tsx:69-118`)
- Fix: Restore field order and grouped row layout.

## G2-4-011-010  [P2] GAP  facet F03  effort S
- Legacy: Primary Create Assignment button has PlusOutlined and loading state. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:471-473`)
- vNext now: Trigger Create teaching assignment, submit Assign faculty; no plus icon. (`src/components/admin/super-admin-faculty-assignment-create.tsx:59-64`; `src/components/admin/super-admin-faculty-assignment-create.tsx:111-117`)
- Fix: Restore exact CTA, icon and states.

## G2-4-011-014  [P2] GAP  facet F03  effort M
- Legacy: Lookups error banner lists each failed source and Retry options. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:395-399`)
- vNext now: Create form only shows no deliveries/faculty or submit error. (`src/components/admin/super-admin-faculty-assignment-create.tsx:65-70`; `src/components/admin/super-admin-faculty-assignment-create.tsx:107-110`)
- Fix: Report lookup-specific failures with retry.

## G2-4-011-033  [P2] GAP  facet F06  effort M
- Legacy: Create Faculty is searchable required select placeholder Select faculty. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:449-455`)
- vNext now: Native select placeholder Choose faculty, capped at first 500 active faculty. (`src/components/admin/super-admin-faculty-assignment-create.tsx:92-108`)
- Fix: Match searchable faculty picker and complete lookup/paging.

## G2-4-011-034  [P2] GAP  facet F06  effort M
- Legacy: Create Courses is searchable multi-select with responsive tags. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:456-462`)
- vNext now: New checkbox region caps selected deliveries at 10. (`src/components/admin/super-admin-faculty-assignment-create.tsx:79-91`)
- Fix: Restore multi-select/chips; separately confirm 10-course cap.

## G2-4-011-037  [P2] MISSING  facet F06  effort S
- Legacy: Edit Semester uses fallback 1 through 12 if lookup empty. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:552-562`)
- vNext now: No standalone semester editor. (`src/components/admin/super-admin-faculty-assignment-create.tsx:152-171`)
- Fix: Restore fallback options 1–12.

## G2-4-011-047  [P2] GAP  facet F09  effort M
- Legacy: Edit is 500px Modal; Save Changes/Cancel; mask cannot close; keyboard disabled during save. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:516-521`)
- vNext now: Inline Edit role disclosure, Save role. (`src/components/admin/super-admin-faculty-assignment-create.tsx:152-171`)
- Fix: Restore modal sizing, pending and footer semantics.

## G2-4-011-051  [P2] GAP  facet F10  effort M
- Legacy: Bulk create POST /api/v1/teaching-assignment/createBulk; retains cohort and faculty, clears courses only. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:217-231`; `docs/legacy-source/frontend/src/api/Services/FacultyAssignmentService.js:8-9`)
- vNext now: New batch endpoint also handles single and resets all selectors/closes form. (`src/components/admin/super-admin-faculty-assignment-create.tsx:44-51`)
- Fix: Retain previous form context for multiple creation.

## G2-4-011-058  [P2] GAP  facet F12  effort M
- Legacy: Year autocomplete includes historical/future range relative current year. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:27-31`)
- vNext now: Can select only active deliveries, year is derived. (`src/components/admin/super-admin-faculty-assignment-create.tsx:70-78`)
- Fix: Restore explicit year input and all 27 suggestions if parity required.

## G2-4-011-067  [P2] GAP  facet F16  effort M
- Legacy: Create/roster cards stack xs, split lg 10:14. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:400-402`; `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:475-477`)
- vNext now: Create form md two columns but roster stays vertically separate. (`src/app/(authenticated)/admin/faculty-assignment/page.tsx:23-45`; `src/components/admin/super-admin-faculty-assignment-create.tsx:69-70`)
- Fix: Reproduce legacy breakpoint and column proportions.

## G2-4-011-069  [P2] GAP  facet F17  effort S
- Legacy: Edit/Delete have per-id aria-labels; class filter has accessible label. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:370-378`; `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:477-483`)
- vNext now: Actions under Manage assignment; Edit role button is generic. (`src/app/(authenticated)/admin/faculty-assignment/page.tsx:37-43`; `src/components/admin/super-admin-faculty-assignment-create.tsx:152-171`)
- Fix: Give actions ID-bearing accessible names and match focus path.

## G2-4-011-071  [P2] GAP  facet F18  effort S
- Legacy: Create action wording Create Assignment. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:471-473`)
- vNext now: Assign faculty and Create teaching assignment. (`src/components/admin/super-admin-faculty-assignment-create.tsx:59-64`; `src/components/admin/super-admin-faculty-assignment-create.tsx:111-117`)
- Fix: Match exact action capitalization/wording.

## G2-4-011-073  [P2] GAP  facet F18  effort S
- Legacy: Edit Save Changes, active helper text explains past grades preserved. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:516-519`; `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:588-590`)
- vNext now: Save role only; no Active helper. (`src/components/admin/super-admin-faculty-assignment-create.tsx:152-171`)
- Fix: Restore exact edit CTA and explanatory active text.

## G2-4-011-075  [P2] GAP  facet F19  effort M
- Legacy: Legacy prevents duplicate async reads via lookup and table request counters. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:83-85`; `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:103-133`; `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:135-158`)
- vNext now: Server data load and guarded mutation, but no per-lookup retry. (`src/app/(authenticated)/admin/faculty-assignment/page.tsx:19-22`; `src/components/admin/super-admin-faculty-assignment-create.tsx:107-110`)
- Fix: Expose per-lookup retry and loading boundaries.
