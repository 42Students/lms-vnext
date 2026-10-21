# Work packet (wave 2): edit src/app/api/courses/lessons/reorder-all/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u002-superadmin-lessons.md

## G2-18-002-066  [P2] GAP  facet F10  effort M
- Legacy: Legacy reorder PUT `/api/v1/lesson/reorder` full list IDs; controller audits LESSON_REORDER. `docs/legacy-source/frontend/src/api/Services/AdminService.js:615-617`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonController.java:77-125`
- vNext now: vNext POST `/api/courses/lessons/reorder` per-item UP/DOWN, also POST `/reorder-all` for full list, audit activity in service. `src/app/api/courses/lessons/reorder/route.ts:9-19`, `src/app/api/courses/lessons/reorder-all/route.ts:8-15`, `src/modules/courses/lesson-service.ts:338-421`
- Fix: Use reorder-all from drag/table mode with full expected order optimistic check.
