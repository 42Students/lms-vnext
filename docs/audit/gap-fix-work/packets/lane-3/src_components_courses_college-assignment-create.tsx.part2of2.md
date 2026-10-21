# Work packet: edit src/components/courses/college-assignment-create.tsx (part 2 of 2)

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/superadmin-sections-assignments.md, docs/audit/gap2/lane-4/college-admin-assignments.md, docs/audit/gap2/lane-4/superadmin-assignments.md

## G2-4-010-037  [P1] MISSING  facet F06  effort M
- Legacy: Legacy resources support PDF/file/link, resource title, optional uploaded file and Drive import. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:367-427`)
- vNext now: vNext create lacks resource controls; separate `course_assignment_materials` schema stores link-like rows. (`src/components/courses/college-assignment-create.tsx:127-140; src/db/schema/course-assignment-materials.ts:7-18`)
- Fix: Integrate file/link/Drive resources with existing signed storage API and persistence.

## G2-4-010-042  [P1] MISSING  facet F07  effort M
- Legacy: Legacy upload error `Select a PDF file.` for invalid .pdf MIME/name. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:163-169`)
- vNext now: No assignment resource upload picker on new create form. (`src/components/courses/college-assignment-create.tsx:127-140`)
- Fix: Restore PDF validation and exact inline/server error behavior.

## G2-4-010-052  [P1] GAP  facet F10  effort M
- Legacy: Legacy creates/edits POST `/api/v1/admin/assignments/content/save` with content_data_dto and resources, edits include lesson_content_id. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:199-235; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentContentWriteController.java:44-60`)
- vNext now: Create POST `/api/courses/assignments`; edit PATCH `/api/courses/assignments/{id}`, JSON different schema, no builder resource writes. (`src/components/courses/college-assignment-create.tsx:71-89; src/components/courses/college-assignment-actions.tsx:34-70`)
- Fix: Port all authoring payload fields/materials and protect edits with optimistic version.

## G2-4-010-062  [P1] GAP  facet F12  effort M
- Legacy: Legacy create allows points 0 while grading editor permits 0..max; total points stored as long. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:129-131; docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:361-363; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:28-30`)
- vNext now: vNext create requires at least 1, DB check accepts zero to 10000. (`src/components/courses/college-assignment-create.tsx:39-59; src/db/schema/assessments.ts:123-124`)
- Fix: Resolve UI/DB inconsistency and match zero-point authoring.

## G2-4-010-074  [P1] MISSING  facet F14  effort M
- Legacy: Legacy attachment accepts PDF/file, HTTPS links, Upload from Drive, presigned file upload and original filename. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:149-183; docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:367-427`)
- vNext now: No attachments on vNext initial create, though separate materials table supports LINK. (`src/components/courses/college-assignment-create.tsx:127-140; src/db/schema/course-assignment-materials.ts:7-18`)
- Fix: Wire signed file uploads/Drive and rich resource attachments into builder; avoid plain link-only parity.

## G2-4-010-092  [P1] MISSING  facet F21  effort M
- Legacy: File upload through `uploadFileViaPresign` to assignment folder; optional Upload from Drive import. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:163-183; docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:418-423`)
- vNext now: VNext form lacks upload/Drive integration but schema has material links. (`src/components/courses/college-assignment-create.tsx:127-140; src/db/schema/course-assignment-materials.ts:7-18`)
- Fix: Connect existing signed R2 API and Drive importer into assignment authoring.

## G2-4-010-113  [P1] GAP  facet F06  effort M
- Legacy: Legacy title max255 with example placeholder `e.g., Module 1 Project`. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:355-357`)
- vNext now: SA creation component title maxlength200. (`src/components/courses/college-assignment-create.tsx:116-118`)
- Fix: Allow 255, apply same backend Zod constraint and placeholder.

## G2-4-010-114  [P1] GAP  facet F06  effort M
- Legacy: Old builder zero-point initial and min0. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:80-135`)
- vNext now: SA create starts10 and blocks zero-point. (`src/components/courses/college-assignment-create.tsx:23-39;src/components/courses/college-assignment-create.tsx:54-59`)
- Fix: Permit zero-point assignments in UI/server and align initial value.

## G2-4-010-131  [P1] MISSING  facet F21  effort M
- Legacy: Legacy resource upload presign and Google Drive importer in builder. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:149-183;docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:418-423`)
- vNext now: New SA create lacks material upload picker. (`src/components/courses/college-assignment-create.tsx:127-140`)
- Fix: Wire existing signed file upload, safe URL resource list and Drive attachment importer.

## G2-4-004-039  [P2] GAP  facet F07  effort M
- Legacy: Legacy builder required Course `Select a course`, Lesson `Select a lesson`, Audience `Choose who receives this assignment`, Section `Select a section`. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:303-338`)
- vNext now: New builder validates chosen lesson through dropdown and audience but no matching per-field errors. (`src/components/courses/college-assignment-create.tsx:54-70; src/components/courses/college-assignment-create.tsx:100-125`)
- Fix: Surface legacy field-level validation/messages for course, lesson, audience, section.

## G2-4-004-043  [P2] GAP  facet F08  effort M
- Legacy: Legacy create/edit success toast `Assignment created` / `Assignment updated`. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:233-237`)
- vNext now: New create success notice `Assignment draft created. Publish it to let learners submit.`; edit `Assignment updated.` (`src/components/courses/college-assignment-create.tsx:82-89; src/components/courses/college-assignment-actions.tsx:67-69`)
- Fix: Align exact success copy where workflow matches; keep draft disclosure prominently if intentional.

## G2-4-007-031  [P2] GAP  facet F08  effort M
- Legacy: Builder create success Assignment created. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:229-237`)
- vNext now: New Assignment draft created. Publish it to let learners submit. (`src/components/courses/college-assignment-create.tsx:82-89`)
- Fix: Match exact legacy interaction and value or explicitly record approved divergence.

## G2-4-010-039  [P2] GAP  facet F07  effort M
- Legacy: Legacy builder required Course `Select a course`, Lesson `Select a lesson`, Audience `Choose who receives this assignment`, Section `Select a section`. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:303-338`)
- vNext now: New builder validates chosen lesson through dropdown and audience but no matching per-field errors. (`src/components/courses/college-assignment-create.tsx:54-70; src/components/courses/college-assignment-create.tsx:100-125`)
- Fix: Surface legacy field-level validation/messages for course, lesson, audience, section.

## G2-4-010-043  [P2] GAP  facet F08  effort M
- Legacy: Legacy create/edit success toast `Assignment created` / `Assignment updated`. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:233-237`)
- vNext now: New create success notice `Assignment draft created. Publish it to let learners submit.`; edit `Assignment updated.` (`src/components/courses/college-assignment-create.tsx:82-89; src/components/courses/college-assignment-actions.tsx:67-69`)
- Fix: Align exact success copy where workflow matches; keep draft disclosure prominently if intentional.

## G2-4-010-117  [P2] GAP  facet F08  effort M
- Legacy: Create success `Assignment created` after modal closes. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:229-237`)
- vNext now: SA create success notice `Assignment draft created. Publish it to let learners submit.` (`src/components/courses/college-assignment-create.tsx:82-89`)
- Fix: Use exact success when workflow equivalent; if added draft state, explain separately.
