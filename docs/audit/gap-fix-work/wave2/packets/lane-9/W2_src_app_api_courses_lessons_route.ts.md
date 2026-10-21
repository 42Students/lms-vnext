# Work packet (wave 2): edit src/app/api/courses/lessons/route.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/lesson-search-controller.md, docs/audit/gap2/lane-17/college-admin-lessons.md, docs/audit/gap2/lane-18/u002-superadmin-lessons.md

## G2-13-013-010  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:79` Response('success','Lessons retrieved', List DTO)
- vNext now: `src/app/api/courses/lessons/route.ts:24` emits JSON {lessons} with no status/message wrapper
- Fix: Provide consistent compatibility response or version existing clients with migration spec

## G2-13-013-016  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:50-52` unbounded String query, int limit, optional Integer courseId
- vNext now: `src/modules/courses/college-learning-directory-model.ts:9-13` q trimmed max100, page 1..1000, page size enum; `src/app/api/courses/lessons/route.ts:18-22` UUID learningPathId required
- Fix: Normalize API query bounds and provide explicit 400 for illegal numeric limits/course filter

## G2-17-007-082  [P2] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LessonDTO.java:14-22 — DTO allows contentsDTOs and optional slug for course resolver.
- vNext now: src/app/api/courses/lessons/route.ts:24-42 — Create API accepts normalized learningPathId via schema.
- Fix: Preserve equivalent content linkage/legacy slug support only if old deep links must work.

## G2-18-002-062  [P2] GAP  facet F10  effort M
- Legacy: Legacy create POST `/api/v1/lesson/create` with lesson_name, course_id/slug, sequence=0, active and enabled. `docs/legacy-source/frontend/src/api/Services/AdminService.js:559-563`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:255-268`
- vNext now: vNext GET lessons to compute next sequence then POST `/api/courses/lessons` with learningPathId, name, description, sequence. `src/components/courses/super-admin-lesson-create.tsx:21-35`, `src/app/api/courses/lessons/route.ts:30-51`
- Fix: Map semantics and avoid two round trips by server-chosen append sequence to prevent races.

## G2-18-002-116  [P2] GAP  facet F21  effort M
- Legacy: Legacy API Axios calls Spring REST and Antd message notifications; no direct third-party integration from page. `docs/legacy-source/frontend/src/api/Services/AdminService.js:559-590`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:255-388`
- vNext now: vNext uses same-origin Next routes, Drizzle DB and useToast on actions. `src/app/api/courses/lessons/route.ts:30-51`, `src/app/api/courses/lessons/[lessonId]/route.ts:16-65`, `src/components/courses/admin-learning-structure-actions.tsx:43-75`
- Fix: Document API bridge only for migration links; maintain same scoped side effects.

## G2-13-013-044  [P3] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:79` 'Lessons retrieved', `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:93` 'Stats retrieved', `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:101` 'Cache refreshed'
- vNext now: `src/app/api/courses/lessons/route.ts:24` {lessons} result without strings; `src/app/(authenticated)/admin/lessons/page.tsx:31` etc page title 'Lessons'
- Fix: Map legacy API wording when supporting historical clients; no need add to modern UI toast
