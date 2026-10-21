# Work packet: edit src/db/schema/course-assignment-materials.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-admin-assignments.md, docs/audit/gap2/lane-4/superadmin-assignments.md, docs/audit/gap2/lane-4/superadmin-sections-assignments.md

## G2-4-004-037  [P1] MISSING  facet F06  effort M
- Legacy: Legacy resources support PDF/file/link, resource title, optional uploaded file and Drive import. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:367-427`)
- vNext now: vNext create lacks resource controls; separate `course_assignment_materials` schema stores link-like rows. (`src/components/courses/college-assignment-create.tsx:127-140; src/db/schema/course-assignment-materials.ts:7-18`)
- Fix: Integrate file/link/Drive resources with existing signed storage API and persistence.

## G2-4-004-074  [P1] MISSING  facet F14  effort M
- Legacy: Legacy attachment accepts PDF/file, HTTPS links, Upload from Drive, presigned file upload and original filename. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:149-183; docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:367-427`)
- vNext now: No attachments on vNext initial create, though separate materials table supports LINK. (`src/components/courses/college-assignment-create.tsx:127-140; src/db/schema/course-assignment-materials.ts:7-18`)
- Fix: Wire signed file uploads/Drive and rich resource attachments into builder; avoid plain link-only parity.

## G2-4-004-092  [P1] MISSING  facet F21  effort M
- Legacy: File upload through `uploadFileViaPresign` to assignment folder; optional Upload from Drive import. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:163-183; docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:418-423`)
- vNext now: VNext form lacks upload/Drive integration but schema has material links. (`src/components/courses/college-assignment-create.tsx:127-140; src/db/schema/course-assignment-materials.ts:7-18`)
- Fix: Connect existing signed R2 API and Drive importer into assignment authoring.

## G2-4-004-097  [P1] GAP  facet F22  effort M
- Legacy: Legacy resource content embedded in LessonContents.content_data JSON with file_dto and links. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LessonContents.java:39-41; docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:149-161`)
- vNext now: VNext separate `course_assignment_materials` external_url and kind default LINK, doesn't reflect all file_dto fields. (`src/db/schema/course-assignment-materials.ts:7-18`)
- Fix: Extend normalized material/file references to preserve rich resources and original filenames.

## G2-4-007-058  [P1] GAP  facet F22  effort M
- Legacy: Legacy assignments stored lesson_contents with class_id, points, deadline, embedded JSON resources. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LessonContents.java:19-70`)
- vNext now: vNext course_assignments plus course_assignment_materials links. (`src/db/schema/assessments.ts:26-124;src/db/schema/course-assignment-materials.ts:7-18`)
- Fix: Map rich legacy materials and audience scoping to normalized schema.

## G2-4-010-037  [P1] MISSING  facet F06  effort M
- Legacy: Legacy resources support PDF/file/link, resource title, optional uploaded file and Drive import. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:367-427`)
- vNext now: vNext create lacks resource controls; separate `course_assignment_materials` schema stores link-like rows. (`src/components/courses/college-assignment-create.tsx:127-140; src/db/schema/course-assignment-materials.ts:7-18`)
- Fix: Integrate file/link/Drive resources with existing signed storage API and persistence.

## G2-4-010-074  [P1] MISSING  facet F14  effort M
- Legacy: Legacy attachment accepts PDF/file, HTTPS links, Upload from Drive, presigned file upload and original filename. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:149-183; docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:367-427`)
- vNext now: No attachments on vNext initial create, though separate materials table supports LINK. (`src/components/courses/college-assignment-create.tsx:127-140; src/db/schema/course-assignment-materials.ts:7-18`)
- Fix: Wire signed file uploads/Drive and rich resource attachments into builder; avoid plain link-only parity.

## G2-4-010-092  [P1] MISSING  facet F21  effort M
- Legacy: File upload through `uploadFileViaPresign` to assignment folder; optional Upload from Drive import. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:163-183; docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:418-423`)
- vNext now: VNext form lacks upload/Drive integration but schema has material links. (`src/components/courses/college-assignment-create.tsx:127-140; src/db/schema/course-assignment-materials.ts:7-18`)
- Fix: Connect existing signed R2 API and Drive importer into assignment authoring.

## G2-4-010-097  [P1] GAP  facet F22  effort M
- Legacy: Legacy resource content embedded in LessonContents.content_data JSON with file_dto and links. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LessonContents.java:39-41; docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:149-161`)
- vNext now: VNext separate `course_assignment_materials` external_url and kind default LINK, doesn't reflect all file_dto fields. (`src/db/schema/course-assignment-materials.ts:7-18`)
- Fix: Extend normalized material/file references to preserve rich resources and original filenames.

## G2-4-010-132  [P1] GAP  facet F22  effort M
- Legacy: Legacy persisted LessonContents.content_data embeds material links/files and StudentAssignment gradePublished. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LessonContents.java:39-70;docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentAssignment.java:46-85`)
- vNext now: New normalized course_assignments and course_assignment_materials omit resource DTO from creator. (`src/db/schema/assessments.ts:26-124;src/db/schema/course-assignment-materials.ts:7-18`)
- Fix: Complete material/grade schema mapping and connect new authoring service.
