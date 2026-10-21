# Work packet (wave 3): edit src/modules/courses/super-admin-content-directory-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/lesson-content.md

## G2-19-002-099  [P1] MISSING  facet F23  effort L
- Legacy: Legacy class-specific ordering across unrelated types enabled `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1084-1107`
- vNext now: vNext directory filters only kind and no class ordering `src/modules/courses/super-admin-content-directory-service.ts:79-92`
- Fix: Restore section syllabus order as separate full-class multi-type screen.
