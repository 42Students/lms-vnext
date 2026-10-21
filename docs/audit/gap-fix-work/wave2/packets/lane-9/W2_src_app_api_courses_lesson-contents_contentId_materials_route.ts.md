# Work packet (wave 2): edit src/app/api/courses/lesson-contents/[contentId]/materials/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/legacy-resource-viewer.md

## G2-17-008-038  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:51-56 — Uses numeric content ID/material index with positive validation.
- vNext now: src/app/api/courses/lesson-contents/[contentId]/materials/route.ts:9-25 — Uses UUID content ID/delivery selector.
- Fix: Map legacy array index to stable UUID ID at migration.

## G2-17-008-070  [P2] GAP  facet F20  effort S
- Legacy: docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/resource.js:64 — Legacy accepts id, lessonContentId and lesson_content_id aliases.
- vNext now: src/app/api/courses/lesson-contents/[contentId]/materials/route.ts:9-25 — UUID only contentId path.
- Fix: Map old ID aliases at import/boundary.
