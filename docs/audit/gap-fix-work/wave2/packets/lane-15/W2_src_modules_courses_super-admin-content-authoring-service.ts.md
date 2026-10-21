# Work packet (wave 2): edit src/modules/courses/super-admin-content-authoring-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/lesson-content.md

## G2-19-002-033  [P2] GAP  facet F06  effort M
- Legacy: Legacy sequence default 1 (UI) and points hidden 0 `docs/legacy-source/frontend/src/pages/superadmin/sections/LessonContent.js:1545-1555`
- vNext now: vNext authoring selected lesson next sequence from max+1, course DB points default 1 `src/modules/courses/super-admin-content-authoring-service.ts:18` `src/db/schema/courses.ts:390-400`
- Fix: Map legacy sequence/point defaults; keep valid zero-based storage and intended scoring.
