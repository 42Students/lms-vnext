# Work packet: edit src/app/api/courses/lessons/[lessonId]/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u002-superadmin-lessons.md

## G2-18-002-064  [P1] GAP  facet F10  effort L
- Legacy: Legacy update PUT `/api/v1/lesson/update/:id`, mutable course, name, active, enabled, sequence. `docs/legacy-source/frontend/src/api/Services/AdminService.js:576-578`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:303-315`
- vNext now: vNext PATCH `/api/courses/lessons/:id`, updates name/description/sequence but not parent offering. `src/app/api/courses/lessons/[lessonId]/route.ts:16-42`, `src/components/courses/admin-learning-structure-actions.tsx:538-556`
- Fix: Document immutable parent as deliberate change or implement audited move with transactional child data consistency.
