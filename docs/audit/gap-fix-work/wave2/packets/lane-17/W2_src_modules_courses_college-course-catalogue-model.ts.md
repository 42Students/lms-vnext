# Work packet (wave 2): edit src/modules/courses/college-course-catalogue-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/courses.md, docs/audit/gap2/lane-3/college-admin-courses.md

## G2-12-003-017  [P2] GAP  facet F05  effort S
- Legacy: Search matches name, shortTitle, meta course_code; case insensitive, trimmed `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:408-412`
- vNext now: Search matches name, code and department, not shortTitle `src/modules/courses/college-course-catalogue-model.ts:21-31`
- Fix: Include shortTitle in search scope

## G2-12-003-018  [P2] GAP  facet F05  effort S
- Legacy: AntD local table paging 10/25/50/100, page size remembered in localStorage `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:450-451,614-627`
- vNext now: Server URL pageSize 25/50/100, no 10 or persistent preference `src/modules/courses/college-course-catalogue-model.ts:3-10,21-36`
- Fix: Support page-size 10, persistence if parity required

## G2-3-008-020  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:614-630`
- vNext now: `src/components/courses/admin-course-overview.tsx:528-538`; `src/modules/courses/college-course-catalogue-model.ts:3-10`
- Fix: Legacy pagination 10/25/50/100 persisted in localStorage, new college fixed 25/page despite catalogue schema allowing pageSize; restore page-size chooser + 10 option.

## G2-12-003-078  [P3] GAP  facet F20  effort S
- Legacy: Page size persisted browser localStorage `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:18-19,624-626`
- vNext now: URL pageSize, no local persistence `src/modules/courses/college-course-catalogue-model.ts:3-18`
- Fix: Consider preference sync across visits
