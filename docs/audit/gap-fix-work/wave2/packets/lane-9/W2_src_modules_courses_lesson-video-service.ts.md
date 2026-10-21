# Work packet (wave 2): edit src/modules/courses/lesson-video-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/lesson-content.md, docs/audit/gap2/lane-3/lesson-content-controller.md

## G2-19-002-085  [P2] GAP  facet F19  effort M
- Legacy: Legacy direct video import UI fetches remote URL with validate step `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:467-528`
- vNext now: vNext uploader uses grants and object-storage validation (not exposed to Super Admin) `src/modules/courses/lesson-video-service.ts:197-288` `src/components/courses/super-admin-content-authoring.tsx:30-32`
- Fix: Benchmark import size and async feedback only after hardened workflow restored.

## G2-3-027-062  [P2] GAP  facet F14  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/LessonContentsService.java:43-54`
- vNext now: `src/modules/courses/lesson-video-service.ts:197-303`
- Fix: Legacy delete content best-effort file cleanup can be independently triggered; vNext storage deletion/replacement lifecycle through video asset service is different.

## G2-3-027-081  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonContentController.java:646-663`
- vNext now: `src/modules/courses/lesson-video-service.ts:197-303`
- Fix: Legacy public URL/R2 signed provider differs from vNext private storage grant/processing model. Audit storage adapter and retention before migration.
