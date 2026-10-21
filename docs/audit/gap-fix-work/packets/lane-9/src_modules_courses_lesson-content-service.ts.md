# Work packet: edit src/modules/courses/lesson-content-service.ts

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l13-u027-faculty-lesson-content-controller.md, docs/audit/gap2/lane-14/l18-u018-lesson.md, docs/audit/gap2/lane-17/superadmin-lesson-content-wrapper.md, docs/audit/gap2/lane-19/lesson-content.md, docs/audit/gap2/lane-3/lesson-content-controller.md

## G2-13-027-023  [P1] GAP  facet F11  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyLessonContentController.java:57-59 — explicit principal.isFaculty requirement
- vNext now: src/modules/courses/lesson-content-service.ts:423-435 — authorize delivery mutation or manage permission
- Fix: Confirm no roles outside intended teacher/admin gain write privilege, retaining old faculty/admin scope intent.

## G2-18-018-025  [P1] GAP  facet F10  effort L
- Legacy: POST create persists lesson and optional multiple child contents in one DB transaction (`LessonServiceImpl.java:110-170`).
- vNext now: `src/modules/courses/lesson-service.ts:134-167` inserts only `courseLessons`; content via separate `lesson-content-service.ts`.
- Fix: Support atomic multi-content create when legacy form sends contents, or explicitly split with recovery path and no orphaned lesson.

## G2-18-018-039  [P1] GAP  facet F14  effort M
- Legacy: Lesson create nested `contentsDTOs` includes contentType/title/points/classId and data (`LessonServiceImpl.java:147-169`).
- vNext now: Separate `src/modules/courses/lesson-content-service.ts:95-120` content per lesson.
- Fix: Preserve class targeting and input fields in separate authoring step; provide rollback/partial failure guidance.

## G2-17-003-029  [P1] GAP  facet F10  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:70-74 switches rendered components by query; docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:532-669 then calls createLessonContent/getLessonContents and R2 presign.
- vNext now: src/components/courses/super-admin-content-directory-page.tsx:89-91 delegates to server backed authoring; src/modules/courses/lesson-content-service.ts:100-110 normalizes new content input, separate CRUD API.
- Fix: Build old VIDEO upload plus content linking and server-side scoped authoring, retain schema compatibility.

## G2-17-003-051  [P1] GAP  facet F21  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:400-447 integrates presigned R2 and URL import (first party storage); no scheduling job in wrapper.
- vNext now: src/components/courses/super-admin-content-authoring.tsx:30-32 states storage actor bucket/scanner/migration pending; src/modules/courses/lesson-content-service.ts:100-110 stores metadata only.
- Fix: Complete secure upload integration rather than replacing it with informational paragraph.

## G2-19-002-051  [P1] GAP  facet F10  effort L
- Legacy: Legacy POST `/api/v1/lesson/contents/create` accepts LessonContentsDTO with faculty_id/course_id/class_id `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:214-279` `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LessonContentsDTO.java:12-32`
- vNext now: vNext createLessonContent takes lessonId/deliveryId and createdByUserId, validated transaction `src/modules/courses/lesson-content-service.ts:395-460` `src/db/schema/courses.ts:374-408`
- Fix: Map faculty association and class scoping before treating write paths as equivalent.

## G2-19-002-058  [P1] GAP  facet F11  effort L
- Legacy: Legacy can create on behalf of a selected faculty `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:256-268` `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1220-1231`
- vNext now: vNext records `createdByUserId=context.user.id`, no delegated author selection `src/modules/courses/lesson-content-service.ts:449-457` `src/components/courses/super-admin-content-authoring.tsx:20-29`
- Fix: Define delegated faculty author semantics, require scoped faculty membership on write.

## G2-3-027-018  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LessonContentsDTO.java:12-37`
- vNext now: `src/modules/courses/lesson-content-service.ts:100-147`
- Fix: Legacy content DTO supports assignment deadline and `clearDeadline`, generic long points; vNext generic lesson-content writer excludes deadline and uses separate assignment writer.

## G2-3-027-042  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:287-323`
- vNext now: `src/modules/courses/lesson-content-service.ts:283-393`
- Fix: Legacy learner fetch mixes generic/class content, admin fetch all; vNext shared/delivery filtering also requires published learning path and lesson visibility; reconcile intentional gates.

## G2-3-027-052  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:439-461`
- vNext now: `src/modules/courses/lesson-content-service.ts:263-280`
- Fix: Legacy ordinary faculty cannot fetch colleagues' authored assignments, admin may; vNext content mutation guard is delivery/courses.manage, and exact authored-by listing parity must be tested.

## G2-3-027-031  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:218-234`
- vNext now: `src/modules/courses/lesson-content-service.ts:395-426`
- Fix: Legacy missing lesson responds 404 Lesson not found, class/course mismatch 400 CLASS_COURSE_COLLEGE_MISMATCH; vNext errors use CONTENT_DELIVERY_MISMATCH/LESSON_NOT_FOUND.
