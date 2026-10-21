# Work packet: edit src/modules/courses/super-admin-course-bulk-visibility.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u003-superadmin-courses.md

## G2-18-003-063  [P1] GAP  facet F10  effort L
- Legacy: Legacy bulk POST `/api/v1/admin/courses/bulk-status` toggles course active/enabled. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:414-455`, `docs/legacy-source/frontend/src/api/Services/AdminService.js:527-534`
- vNext now: vNext POST `/api/admin/courses/bulk-status` toggles published descendant content flags only. `src/components/courses/super-admin-course-bulk-visibility.tsx:23-36`, `src/modules/courses/super-admin-course-bulk-visibility.ts:1-80`
- Fix: Rename to `bulk published content visibility` or implement actual course status bulk toggles.
