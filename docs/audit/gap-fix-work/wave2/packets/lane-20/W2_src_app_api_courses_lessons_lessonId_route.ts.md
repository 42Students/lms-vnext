# Work packet (wave 2): edit src/app/api/courses/lessons/[lessonId]/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u002-superadmin-lessons.md

## G2-18-002-065  [P2] GAP  facet F10  effort M
- Legacy: Legacy delete DELETE `/api/v1/lesson/delete/:id` soft deletes parent and contents; restore separate POST. `docs/legacy-source/frontend/src/api/Services/AdminService.js:579-590`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LessonServiceImpl.java:344-392`
- vNext now: vNext DELETE `/api/courses/lessons/:id` archives lesson, restore service toggles ARCHIVED→ACTIVE. `src/app/api/courses/lessons/[lessonId]/route.ts:43-65`, `src/modules/courses/lesson-service.ts:238-336`
- Fix: Document retention differences, file preservation and restored child visibility; keep no hard deletes.

## G2-18-002-116  [P2] GAP  facet F21  effort M
- Legacy: Legacy API Axios calls Spring REST and Antd message notifications; no direct third-party integration from page. `docs/legacy-source/frontend/src/api/Services/AdminService.js:559-590`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:255-388`
- vNext now: vNext uses same-origin Next routes, Drizzle DB and useToast on actions. `src/app/api/courses/lessons/route.ts:30-51`, `src/app/api/courses/lessons/[lessonId]/route.ts:16-65`, `src/components/courses/admin-learning-structure-actions.tsx:43-75`
- Fix: Document API bridge only for migration links; maintain same scoped side effects.
