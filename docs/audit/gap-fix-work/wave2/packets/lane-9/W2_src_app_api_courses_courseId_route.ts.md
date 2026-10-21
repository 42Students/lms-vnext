# Work packet (wave 2): edit src/app/api/courses/[courseId]/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u003-superadmin-courses.md

## G2-18-003-062  [P2] GAP  facet F10  effort M
- Legacy: Legacy DELETE course blocked on lessons; backend performs final check. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:487-513`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:387-402`
- vNext now: vNext DELETE `/api/courses/:id` archives and requires no active offerings. `src/app/api/courses/[courseId]/route.ts:43-65`, `src/modules/courses/course-service.ts:320-435`
- Fix: Surface both blocker semantics and history preservation in confirmation; maintain transactional validation.
