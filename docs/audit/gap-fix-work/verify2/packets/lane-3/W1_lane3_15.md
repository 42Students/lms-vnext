# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-4-004-062 [P1] GAP facet F12
- Files: src/components/courses/college-assignment-create.tsx, src/db/schema/assessments.ts
- Legacy: Legacy create allows points 0 while grading editor permits 0..max; total points stored as long. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:129-131; docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:361-363; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:28-30`)
- Expected fix: Resolve UI/DB inconsistency and match zero-point authoring.

## G2-4-004-064 [P1] GAP facet F12
- Files: src/components/courses/faculty-assignment-review.tsx
- Legacy: Legacy grade remains private after points saved; publish flips is_grade_published; saving privately again hides grade. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:62-84; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:120-128; docs/legacy-source/backend/src/main/java/com/_42students/lms/model/StudentAssignment.java:80-82`)
- Expected fix: Provide explicit Save & hide from learner control preserving grade privacy semantics.

## G2-4-004-074 [P1] MISSING facet F14
- Files: src/components/courses/college-assignment-create.tsx, src/db/schema/course-assignment-materials.ts
- Legacy: Legacy attachment accepts PDF/file, HTTPS links, Upload from Drive, presigned file upload and original filename. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:149-183; docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:367-427`)
- Expected fix: Wire signed file uploads/Drive and rich resource attachments into builder; avoid plain link-only parity.

## G2-4-004-089 [P1] GAP facet F20
- Files: src/components/courses/college-assignment-review.tsx
- Legacy: Legacy bulk publisher limits 1000 recent submissions, skips ungraded/published, independent commits and failed reasons. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java:48-50; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java:85-132`)
- Expected fix: Move bulk into resumable server operation with idempotency and audit trail; avoid browser-lifetime dependency.

## G2-4-004-092 [P1] MISSING facet F21
- Files: src/components/courses/college-assignment-create.tsx, src/db/schema/course-assignment-materials.ts
- Legacy: File upload through `uploadFileViaPresign` to assignment folder; optional Upload from Drive import. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:163-183; docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:418-423`)
- Expected fix: Connect existing signed R2 API and Drive importer into assignment authoring.

## G2-4-004-101 [P1] GAP facet F23
- Files: src/components/courses/college-assignment-review.tsx
- Legacy: Legacy publisher can handle graded submissions across entire assignment via single request. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java:63-132`)
- Expected fix: Add assignment-wide publish-all with aggregated stats and audit while permitting Section-specific controls.

## G2-14-027-008 [P1] GAP facet F05
- Files: src/modules/courses/teaching-assignment-service.ts
- Legacy: GET /fetchAllCoursesByFacultyId returns all mappings even inactive via repository `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:66-72`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/FacultyCourseAssociationRepository.java:14-15`
- Expected fix: Offer includeEnded mode for legacy fetchAll vs active-only endpoint.

## G2-14-027-010 [P1] MISSING facet F05
- Files: src/modules/courses/teaching-assignment-service.ts
- Legacy: GET active faculty IDs and FacultyInfo by courseSlug or courseId `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:103-125`
- Expected fix: Implement course-wide active faculty lookup aggregated across eligible deliveries.

## G2-14-027-012 [P1] GAP facet F06
- Files: src/modules/courses/validation.ts
- Legacy: Single create DTO requires facultyId min1, courseIds non-null List<Integer> `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/FacultyCourseAssociationCreateRequestDTO.java:9-14`
- Expected fix: Implement safe facultyId/courseIds→membership/delivery conversion with selected class/period.

## G2-14-027-024 [P1] GAP facet F10
- Files: src/modules/courses/teaching-assignment-service.ts
- Legacy: POST /create loops courseIds and saves one active mapping each `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:53-64`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:38-48`
- Expected fix: Map old course-wide creation to exact offerings/deliveries, never cross college.

## G2-14-027-027 [P1] GAP facet F10
- Files: src/modules/courses/teaching-assignment-service.ts
- Legacy: GET courseSlug ID resolution resolves to int courseId `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:103-124`
- Expected fix: Expose safe courseSlug compatibility lookup for active faculty selectors.

## G2-14-027-028 [P1] GAP facet F11
- Files: src/modules/courses/teaching-assignment-service.ts, src/modules/courses/teaching-assignment-batch-service.ts
- Legacy: Legacy mutations allow superadmin, ADMIN or admin faculty type `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:40-50`
- Expected fix: Map admin faculty roles to explicit permissions rather than broad global mutation.

## G2-14-027-030 [P1] GAP facet F11
- Files: src/modules/courses/teaching-assignment-service.ts
- Legacy: Legacy active course reads authorize courseSlug/courseId `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:103-124`
- Expected fix: Retain faculty read scope with same-course aggregated view.

## G2-4-019-001 [P1] GAP facet F01
- Files: src/app/api/courses/progress/[contentId]/route.ts, src/app/(authenticated)/learn/courses/[deliveryId]/progress/page.tsx
- Legacy: Learner progress saved per lesson content, read in lesson and course progress; admin can start retake. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LearnerContentProgress.java:10-12`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:68-74`)
- Expected fix: Expose deliberate admin retake flow and show current attempt in learner progress.

## G2-4-019-018 [P1] GAP facet F05
- Files: src/modules/courses/progress-service.ts
- Legacy: Legacy current-attempt batch read uses maximum attempt correlated subquery. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LearnerContentProgressRepository.java:29-43`)
- Expected fix: Read latest attempt explicitly after unique-key migration.

## G2-4-019-025 [P1] MISSING facet F06
- Files: src/modules/courses/progress-service.ts
- Legacy: Legacy allows completed false to clear completion without clearing first completion. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:86-87`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:176-187`)
- Expected fix: Add explicit rewatch/unmark request with preserved audit invariant.

## G2-4-019-037 [P1] GAP facet F10
- Files: src/modules/courses/progress-service.ts
- Legacy: Legacy saves current attempt via JpaRepository in transaction, recovers unique races. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:123-160`)
- Expected fix: Adapt race logic to attempt-scoped unique key and preserve latest current row.

## G2-4-019-042 [P1] GAP facet F11
- Files: src/modules/courses/progress-service.ts
- Legacy: Legacy admin retake requires principal access to both learner and course. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:81-90`)
- Expected fix: Provide separate admin-only route with both resource checks.

## G2-4-019-054 [P1] MISSING facet F15
- Files: src/modules/courses/progress-service.ts
- Legacy: Legacy start-attempt emits AdminAuditLog LEARNER_PROGRESS_START_ATTEMPT. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminLearnerProgressController.java:109-117`)
- Expected fix: Write immutable admin retake audit with actor, learner, course and attempt numbers.

## G2-4-019-065 [P1] GAP facet F20
- Files: src/modules/courses/progress-service.ts
- Legacy: Legacy concurrent first insert recovers transaction with exact attempted key. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:144-158`)
- Expected fix: Use exact attempt key in insert race recovery and test admin retake vs device write.

## G2-4-007-020 [P1] GAP facet F06
- Files: src/components/courses/college-assignment-create.tsx
- Legacy: Legacy builder Course then Lesson, Audience radio, Title, Instructions, Points, Deadline, Resources, Methods. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:303-437`)
- Expected fix: Restore resource/Drive picker and separate Course/Lesson selectors.

## G2-4-007-021 [P1] GAP facet F06
- Files: src/components/courses/college-assignment-create.tsx
- Legacy: Title maxlength255 with example placeholder. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:355-357`)
- Expected fix: Accept 255 chars and original placeholder.

## G2-4-007-022 [P1] GAP facet F06
- Files: src/components/courses/college-assignment-create.tsx
- Legacy: Create points defaults0, minimum0. (`docs/legacy-source/frontend/src/components/admin/AdminAssignmentBuilderModal.jsx:80-135`)
- Expected fix: Permit zero-point assignments and start at 0 if parity required.

## G2-4-007-036 [P1] GAP facet F10
- Files: src/components/courses/college-assignment-create.tsx
- Legacy: Save builder POST /api/v1/admin/assignments/content/save, supports resources and content_data. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentContentWriteController.java:44-60`)
- Expected fix: Port resources/material payload and authoring parity.

## G2-4-007-037 [P1] GAP facet F10
- Files: src/components/courses/college-assignment-review.tsx
- Legacy: Java bulk POST publish grades scopes whole lesson assignment, server publishes up to1000 with partial failures. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminAssignmentPublishController.java:63-132`)
- Expected fix: Provide server bulk publisher and bulk audit receipt.
