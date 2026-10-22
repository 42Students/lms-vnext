# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-4-007-041 [P1] GAP facet F12
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/courses/faculty-assignment-review.tsx
- Legacy: Save points privately, publish explicitly to learner; hide published grade on private save. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:62-85;docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:120-128`)
- Expected fix: Expose re-hide published grade action and equivalent privacy transition.

## G2-4-007-046 [P1] MISSING facet F14
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/courses/college-assignment-create.tsx
- Legacy: Resource uploader supports PDF/file and HTTPS link + Upload from Drive. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:367-427`)
- Expected fix: Restore signed file upload and Drive ingestion.

## G2-4-007-056 [P1] MISSING facet F21
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/courses/college-assignment-create.tsx
- Legacy: Legacy file upload via presign and optional Drive provider. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:149-183`)
- Expected fix: Connect presigned file APIs/Drive importer.

## G2-4-007-057 [P1] GAP facet F21
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/courses/college-assignment-review.tsx
- Legacy: Bulk publish makes ADMIN_ASSIGNMENT_GRADES audit event with successes/skips. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java:118-124`)
- Expected fix: Create bulk parent audit entry.

## G2-4-008-041 [P1] GAP facet F10
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/courses/admin-course-actions.tsx
- Legacy: Legacy DELETE separate from soft deactivate endpoint. (`docs/legacy-source/frontend/src/api/Services/FacultyAssignmentService.js:14-18;docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyTeachingAssignmentController.java:159-190`)
- Expected fix: Explicitly decide hard deletion vs history-preserving End; expose distinct actions if needed.

## G2-4-010-015 [P1] MISSING facet F03
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/courses/college-assignment-create.tsx
- Legacy: Builder has `Upload from Drive` and attachment add picker. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:367-427`)
- Expected fix: Add legacy resource picker (PDF/file/HTTPS link) and Google Drive import in assignment builder.

## G2-4-010-030 [P1] GAP facet F06
- Verification: OK — create form defaults to zero points, SHARED audience and WRITTEN_RESPONSE; title uses 255-character bound and exact placeholder; zero-point input accepted.
- Files: src/components/courses/college-assignment-create.tsx
- Legacy: Builder modal create defaults points 0, audience ALL, submit method WRITTEN_RESPONSE. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:80-135`)
- Expected fix: Use legacy initial points=0 and written-response-only method unless changed by owner.

## G2-4-010-031 [P1] GAP facet F06
- Verification: OK — create form defaults to zero points, SHARED audience and WRITTEN_RESPONSE; title uses 255-character bound and exact placeholder; zero-point input accepted.
- Files: src/components/courses/college-assignment-create.tsx, src/components/courses/college-assignment-actions.tsx
- Legacy: Title field max 255 characters, input placeholder `e.g., Module 1 Project`. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:355-357`)
- Expected fix: Allow 255-character title as in legacy and reproduce placeholder.

## G2-4-010-032 [P1] GAP facet F06
- Verification: OK — create form defaults to zero points, SHARED audience and WRITTEN_RESPONSE; title uses 255-character bound and exact placeholder; zero-point input accepted.
- Files: src/components/courses/college-assignment-create.tsx
- Legacy: Points InputNumber min 0 (zero allowed) with `Enter points` required validation. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:361-363`)
- Expected fix: Decide zero-point assignment support; restore 0 lower bound and backend check if parity required.

## G2-4-010-036 [P1] GAP facet F06
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/courses/college-assignment-actions.tsx
- Legacy: Legacy edit fetches full content record/version and includes resources/submission settings. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:90-135; docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:199-218`)
- Expected fix: Add resource editor and version-aware edit parity while preserving vNext concurrency checks.

## G2-4-010-037 [P1] MISSING facet F06
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/courses/college-assignment-create.tsx, src/db/schema/course-assignment-materials.ts
- Legacy: Legacy resources support PDF/file/link, resource title, optional uploaded file and Drive import. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:367-427`)
- Expected fix: Integrate file/link/Drive resources with existing signed storage API and persistence.

## G2-4-010-042 [P1] MISSING facet F07
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/courses/college-assignment-create.tsx
- Legacy: Legacy upload error `Select a PDF file.` for invalid .pdf MIME/name. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:163-169`)
- Expected fix: Restore PDF validation and exact inline/server error behavior.

## G2-4-010-052 [P1] GAP facet F10
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/courses/college-assignment-create.tsx, src/components/courses/college-assignment-actions.tsx
- Legacy: Legacy creates/edits POST `/api/v1/admin/assignments/content/save` with content_data_dto and resources, edits include lesson_content_id. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:199-235; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentContentWriteController.java:44-60`)
- Expected fix: Port all authoring payload fields/materials and protect edits with optimistic version.

## G2-4-010-054 [P1] GAP facet F10
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/courses/college-assignment-review.tsx
- Legacy: Legacy bulk POST `/api/v1/admin/assignments/{id}/publish-grades` performs server-side partial commits and one bulk audit entry. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java:63-132`)
- Expected fix: Provide server-side atomic-scope partial publishing endpoint with bulk audit and retry receipt; avoid client interruption.

## G2-4-010-055 [P1] GAP facet F10
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/courses/college-assignment-actions.tsx
- Legacy: Legacy delete invokes `deleteLessonContent(id)` and confirms existing submissions. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:316-327; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:373-378`)
- Expected fix: Match deletion semantics, archival visibility and restrictions, particularly for submissions already present.

## G2-4-010-062 [P1] GAP facet F12
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/courses/college-assignment-create.tsx, src/db/schema/assessments.ts
- Legacy: Legacy create allows points 0 while grading editor permits 0..max; total points stored as long. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:129-131; docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:361-363; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:28-30`)
- Expected fix: Resolve UI/DB inconsistency and match zero-point authoring.

## G2-4-010-064 [P1] GAP facet F12
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/courses/faculty-assignment-review.tsx
- Legacy: Legacy grade remains private after points saved; publish flips is_grade_published; saving privately again hides grade. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:62-84; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:120-128; docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentAssignment.java:80-82`)
- Expected fix: Provide explicit Save & hide from learner control preserving grade privacy semantics.

## G2-4-010-074 [P1] MISSING facet F14
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/courses/college-assignment-create.tsx, src/db/schema/course-assignment-materials.ts
- Legacy: Legacy attachment accepts PDF/file, HTTPS links, Upload from Drive, presigned file upload and original filename. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:149-183; docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:367-427`)
- Expected fix: Wire signed file uploads/Drive and rich resource attachments into builder; avoid plain link-only parity.

## G2-4-010-089 [P1] GAP facet F20
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/courses/college-assignment-review.tsx
- Legacy: Legacy bulk publisher limits 1000 recent submissions, skips ungraded/published, independent commits and failed reasons. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java:48-50; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java:85-132`)
- Expected fix: Move bulk into resumable server operation with idempotency and audit trail; avoid browser-lifetime dependency.

## G2-4-010-092 [P1] MISSING facet F21
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/courses/college-assignment-create.tsx, src/db/schema/course-assignment-materials.ts
- Legacy: File upload through `uploadFileViaPresign` to assignment folder; optional Upload from Drive import. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:163-183; docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:418-423`)
- Expected fix: Connect existing signed R2 API and Drive importer into assignment authoring.

## G2-4-010-101 [P1] GAP facet F23
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/courses/college-assignment-review.tsx
- Legacy: Legacy publisher can handle graded submissions across entire assignment via single request. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java:63-132`)
- Expected fix: Add assignment-wide publish-all with aggregated stats and audit while permitting Section-specific controls.

## G2-4-010-114 [P1] GAP facet F06
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/courses/college-assignment-create.tsx
- Legacy: Old builder zero-point initial and min0. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:80-135`)
- Expected fix: Permit zero-point assignments in UI/server and align initial value.

## G2-4-010-120 [P1] GAP facet F10
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/courses/college-assignment-review.tsx
- Legacy: Old bulk publish across entire assignment in one server POST, emits summarized audit event. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java:63-132`)
- Expected fix: Add server-side assignment-wide idempotent bulk publish and audit receipt.

## G2-4-010-122 [P1] GAP facet F12
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/courses/faculty-assignment-review.tsx
- Legacy: Save grade privately must keep results hidden; Save and hide from student can conceal published grade. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:62-84;docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:120-128`)
- Expected fix: Expose re-hide published grade with accurate visibility transition.

## G2-4-010-124 [P1] GAP facet F14
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/app/(authenticated)/admin/assignments/page.tsx
- Legacy: Old Export CSV (page) filename assignments-college-ID-page-P.csv, columns title/course/scope/points/deadline/submitted/total/graded. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:329-341`)
- Expected fix: Offer page-only filename/columns with separate full-filter export if useful.
