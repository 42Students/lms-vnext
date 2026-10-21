# Work packet (wave 2): edit src/modules/courses/super-admin-learning-path-picker.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u002-superadmin-lessons.md

## G2-18-002-033  [P2] GAP  facet F06  effort M
- Legacy: Legacy create Course Select searchable with option labels courseName fallback short title/course ID. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:37-44`
- vNext now: vNext Course / Offering Select over eligible learning paths, label course·cohort·period. `src/components/courses/super-admin-lesson-create.tsx:43-50`, `src/modules/courses/super-admin-learning-path-picker.ts:9-23`
- Fix: Keep field label `Course` and searchable list, but resolve selected offering safely if course has multiple periods.

## G2-18-002-071  [P2] GAP  facet F11  effort M
- Legacy: Legacy UI allows selecting any college course and fetching lessons for that course. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:117-140`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:160-165`
- vNext now: vNext picker restricts to ACTIVE offering, ACTIVE course and existing learning path. `src/modules/courses/super-admin-learning-path-picker.ts:9-25`
- Fix: Show disabled ineligible options with reason, or link to create offering/path before lesson.
