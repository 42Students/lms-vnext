# Work packet: edit src/components/courses/college-lesson-visibility-controls.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/college-admin-lessons.md, docs/audit/gap2/lane-18/u002-superadmin-lessons.md

## G2-17-007-021  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:511-517 — Preserves selected row keys while paginating, clears on course/search changes.
- vNext now: src/components/courses/college-lesson-visibility-controls.tsx:60-66 — Selected IDs exist only for currently returned page.
- Fix: Persist selection across pages within unchanged filter scope and clear intentionally.

## G2-18-002-023  [P1] GAP  facet F04  effort M
- Legacy: Legacy active+enabled Boolean controls student visibility. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:56-60`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:397-398`
- vNext now: vNext has status ACTIVE/ARCHIVED and `visibleToStudents` Boolean, plus path/offering/published content statuses. `src/db/schema/courses.ts:320-341`, `src/app/(authenticated)/admin/lessons/page.tsx:94-101`, `src/components/courses/college-lesson-visibility-controls.tsx:19-45`
- Fix: Define effective old active&&enabled to new lesson visible flag and archive semantics; avoid exposing unpublished lessons.

## G2-18-002-076  [P1] GAP  facet F12  effort L
- Legacy: Legacy visible iff active and enabled; bulk set both at once. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:56-60`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:346-367`
- vNext now: vNext visibleToStudents independent of status, path publish and item publish; bulk affects item flags only. `src/db/schema/courses.ts:332-334`, `src/components/courses/college-lesson-visibility-controls.tsx:19-45`, `src/modules/courses/super-admin-lesson-bulk-visibility.ts:32-64`
- Fix: Unify effective visibility calculation/UI and bulk semantics to avoid divergent selection outcomes.
