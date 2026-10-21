# Work packet: edit src/app/api/admin/lessons/bulk-status/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u002-superadmin-lessons.md

## G2-18-002-067  [P1] GAP  facet F10  effort L
- Legacy: Legacy bulk POST `/api/v1/admin/lessons/bulk-status` sets lesson active/enabled Booleans. `docs/legacy-source/frontend/src/api/Services/AdminService.js:530-537`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:346-367`
- vNext now: vNext POST `/api/admin/lessons/bulk-status` toggles published content visibility only, not lesson rows. `src/app/api/admin/lessons/bulk-status/route.ts:6-10`, `src/modules/courses/super-admin-lesson-bulk-visibility.ts:11-70`
- Fix: Resolve semantic mismatch: bulk lesson visibility must change effective lesson-level visibility as single toggle does, or label it bulk content visibility.
