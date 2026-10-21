# Work packet: edit src/components/courses/college-assignment-create.tsx (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-admin-assignments.md, docs/audit/gap2/lane-4/superadmin-assignments.md, docs/audit/gap2/lane-4/superadmin-sections-assignments.md

## G2-4-004-015  [P1] MISSING  facet F03  effort M
- Legacy: Builder has `Upload from Drive` and attachment add picker. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:367-427`)
- vNext now: Create form only instructions and method picker; no resource/Drive attachment surface. (`src/components/courses/college-assignment-create.tsx:127-140`)
- Fix: Add legacy resource picker (PDF/file/HTTPS link) and Google Drive import in assignment builder.

## G2-4-004-030  [P1] GAP  facet F06  effort M
- Legacy: Builder modal create defaults points 0, audience ALL, submit method WRITTEN_RESPONSE. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:80-135`)
- vNext now: Defaults points 10, audience all, allowed methods ALL. (`src/components/courses/college-assignment-create.tsx:23-31`)
- Fix: Use legacy initial points=0 and written-response-only method unless changed by owner.

## G2-4-004-031  [P1] GAP  facet F06  effort M
- Legacy: Title field max 255 characters, input placeholder `e.g., Module 1 Project`. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:355-357`)
- vNext now: Title field max 200, no example placeholder. (`src/components/courses/college-assignment-create.tsx:116-118; src/components/courses/college-assignment-actions.tsx:105-107`)
- Fix: Allow 255-character title as in legacy and reproduce placeholder.

## G2-4-004-032  [P1] GAP  facet F06  effort M
- Legacy: Points InputNumber min 0 (zero allowed) with `Enter points` required validation. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:361-363`)
- vNext now: Points integer1–10000, rejects 0, error `Enter an assignment title and 1–10000 points.` (`src/components/courses/college-assignment-create.tsx:39; src/components/courses/college-assignment-create.tsx:54-59`)
- Fix: Decide zero-point assignment support; restore 0 lower bound and backend check if parity required.

## G2-4-004-037  [P1] MISSING  facet F06  effort M
- Legacy: Legacy resources support PDF/file/link, resource title, optional uploaded file and Drive import. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:367-427`)
- vNext now: vNext create lacks resource controls; separate `course_assignment_materials` schema stores link-like rows. (`src/components/courses/college-assignment-create.tsx:127-140; src/db/schema/course-assignment-materials.ts:7-18`)
- Fix: Integrate file/link/Drive resources with existing signed storage API and persistence.

## G2-4-004-042  [P1] MISSING  facet F07  effort M
- Legacy: Legacy upload error `Select a PDF file.` for invalid .pdf MIME/name. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:163-169`)
- vNext now: No assignment resource upload picker on new create form. (`src/components/courses/college-assignment-create.tsx:127-140`)
- Fix: Restore PDF validation and exact inline/server error behavior.

## G2-4-004-052  [P1] GAP  facet F10  effort M
- Legacy: Legacy creates/edits POST `/api/v1/admin/assignments/content/save` with content_data_dto and resources, edits include lesson_content_id. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:199-235; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentContentWriteController.java:44-60`)
- vNext now: Create POST `/api/courses/assignments`; edit PATCH `/api/courses/assignments/{id}`, JSON different schema, no builder resource writes. (`src/components/courses/college-assignment-create.tsx:71-89; src/components/courses/college-assignment-actions.tsx:34-70`)
- Fix: Port all authoring payload fields/materials and protect edits with optimistic version.

## G2-4-004-062  [P1] GAP  facet F12  effort M
- Legacy: Legacy create allows points 0 while grading editor permits 0..max; total points stored as long. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:129-131; docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:361-363; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:28-30`)
- vNext now: vNext create requires at least 1, DB check accepts zero to 10000. (`src/components/courses/college-assignment-create.tsx:39-59; src/db/schema/assessments.ts:123-124`)
- Fix: Resolve UI/DB inconsistency and match zero-point authoring.

## G2-4-004-074  [P1] MISSING  facet F14  effort M
- Legacy: Legacy attachment accepts PDF/file, HTTPS links, Upload from Drive, presigned file upload and original filename. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:149-183; docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:367-427`)
- vNext now: No attachments on vNext initial create, though separate materials table supports LINK. (`src/components/courses/college-assignment-create.tsx:127-140; src/db/schema/course-assignment-materials.ts:7-18`)
- Fix: Wire signed file uploads/Drive and rich resource attachments into builder; avoid plain link-only parity.

## G2-4-004-092  [P1] MISSING  facet F21  effort M
- Legacy: File upload through `uploadFileViaPresign` to assignment folder; optional Upload from Drive import. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:163-183; docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:418-423`)
- vNext now: VNext form lacks upload/Drive integration but schema has material links. (`src/components/courses/college-assignment-create.tsx:127-140; src/db/schema/course-assignment-materials.ts:7-18`)
- Fix: Connect existing signed R2 API and Drive importer into assignment authoring.

## G2-4-007-020  [P1] GAP  facet F06  effort M
- Legacy: Legacy builder Course then Lesson, Audience radio, Title, Instructions, Points, Deadline, Resources, Methods. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:303-437`)
- vNext now: New inline Lesson/Delivery plus title, points, deadline, instructions, methods; resources absent. (`src/components/courses/college-assignment-create.tsx:100-152`)
- Fix: Restore resource/Drive picker and separate Course/Lesson selectors.

## G2-4-007-021  [P1] GAP  facet F06  effort M
- Legacy: Title maxlength255 with example placeholder. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:355-357`)
- vNext now: New maxlength200. (`src/components/courses/college-assignment-create.tsx:116-118`)
- Fix: Accept 255 chars and original placeholder.

## G2-4-007-022  [P1] GAP  facet F06  effort M
- Legacy: Create points defaults0, minimum0. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:80-135`)
- vNext now: New points default10 and validation1..10000. (`src/components/courses/college-assignment-create.tsx:23-39;src/components/courses/college-assignment-create.tsx:54-59`)
- Fix: Permit zero-point assignments and start at 0 if parity required.

## G2-4-007-036  [P1] GAP  facet F10  effort M
- Legacy: Save builder POST /api/v1/admin/assignments/content/save, supports resources and content_data. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentContentWriteController.java:44-60`)
- vNext now: JSON API `/api/courses/assignments` creates without legacy attachment resource picker. (`src/components/courses/college-assignment-create.tsx:71-89`)
- Fix: Port resources/material payload and authoring parity.

## G2-4-007-046  [P1] MISSING  facet F14  effort M
- Legacy: Resource uploader supports PDF/file and HTTPS link + Upload from Drive. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:367-427`)
- vNext now: New initial create lacks file/resource picker. (`src/components/courses/college-assignment-create.tsx:127-140`)
- Fix: Restore signed file upload and Drive ingestion.

## G2-4-007-056  [P1] MISSING  facet F21  effort M
- Legacy: Legacy file upload via presign and optional Drive provider. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:149-183`)
- vNext now: vNext create omits resource transport despite separate material schema. (`src/components/courses/college-assignment-create.tsx:127-140`)
- Fix: Connect presigned file APIs/Drive importer.

## G2-4-010-015  [P1] MISSING  facet F03  effort M
- Legacy: Builder has `Upload from Drive` and attachment add picker. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:367-427`)
- vNext now: Create form only instructions and method picker; no resource/Drive attachment surface. (`src/components/courses/college-assignment-create.tsx:127-140`)
- Fix: Add legacy resource picker (PDF/file/HTTPS link) and Google Drive import in assignment builder.

## G2-4-010-030  [P1] GAP  facet F06  effort M
- Legacy: Builder modal create defaults points 0, audience ALL, submit method WRITTEN_RESPONSE. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:80-135`)
- vNext now: Defaults points 10, audience all, allowed methods ALL. (`src/components/courses/college-assignment-create.tsx:23-31`)
- Fix: Use legacy initial points=0 and written-response-only method unless changed by owner.

## G2-4-010-031  [P1] GAP  facet F06  effort M
- Legacy: Title field max 255 characters, input placeholder `e.g., Module 1 Project`. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:355-357`)
- vNext now: Title field max 200, no example placeholder. (`src/components/courses/college-assignment-create.tsx:116-118; src/components/courses/college-assignment-actions.tsx:105-107`)
- Fix: Allow 255-character title as in legacy and reproduce placeholder.

## G2-4-010-032  [P1] GAP  facet F06  effort M
- Legacy: Points InputNumber min 0 (zero allowed) with `Enter points` required validation. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:361-363`)
- vNext now: Points integer1–10000, rejects 0, error `Enter an assignment title and 1–10000 points.` (`src/components/courses/college-assignment-create.tsx:39; src/components/courses/college-assignment-create.tsx:54-59`)
- Fix: Decide zero-point assignment support; restore 0 lower bound and backend check if parity required.
