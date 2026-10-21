# Work packet: edit src/app/api/courses/lesson-contents/route.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/lesson-content-controller.md, docs/audit/gap2/lane-9/superadmin-admin-resources.md, docs/audit/gap2/lane-1/l13-u027-faculty-lesson-content-controller.md

## G2-3-027-086  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:439-512`
- vNext now: `src/app/api/courses/lesson-contents/route.ts:12-54`
- Fix: Legacy cross-course faculty/learner assignment listing absent in content route, may exist elsewhere; record route-by-route verification before deleting parity requirement.

## G2-9-025-040  [P1] GAP  facet F10  effort L
- Legacy: POST /api/v1/lesson/contents/create with content_data_dto.resource_materials and class/lesson/course `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:5-15,255-288`
- vNext now: POST /api/courses/lesson-contents with single externalUrl, notes, deliveryId, lesson UUID `src/components/courses/faculty-lesson-authoring.tsx:281-297` `src/app/api/courses/lesson-contents/route.ts:30-49`
- Fix: Add mixed-material storage mapping and audience scoped to delivery.

## G2-13-027-015  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyLessonContentController.java:58-66 — Faculty access required / Valid lessonId required / Lesson not found
- vNext now: src/app/api/courses/lesson-contents/route.ts:38-52 — general apiErrorResponse with course code mapping
- Fix: Map legacy error strings to route and field-level messages.

## G2-3-027-034  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:634-644`
- vNext now: `src/app/api/courses/lesson-contents/route.ts:12-26`
- Fix: Legacy missing content by ID returns 404 Lesson content not found; vNext cannot directly GET by content ID via the PATCH-only [contentId] route.

## G2-3-027-035  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:280-284`
- vNext now: `src/app/api/courses/lesson-contents/route.ts:30-50`
- Fix: Legacy create returns 200 with Response(status,reason,LessonContents); vNext returns 201 `{content}`. Adapt clients and toasts.
