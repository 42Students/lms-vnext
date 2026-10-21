# Work packet (wave 2): edit src/modules/courses/college-lessons-export-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u002-superadmin-lessons.md

## G2-18-002-032  [P2] GAP  facet F05  effort M
- Legacy: Legacy CSV uses filteredData only, all currently loaded rows regardless of page, columns id,lessonName,courseId,sequence,active,enabled. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:434-441`
- vNext now: vNext Export endpoint downloads server-filtered lessons, different columns including path/status/etc. `src/app/(authenticated)/admin/lessons/page.tsx:58-63`, `src/modules/courses/college-lessons-export-model.ts:46-57`
- Fix: Match name and column order; preserve original values or publish versioned export column contract.

## G2-18-002-086  [P2] GAP  facet F14  effort M
- Legacy: Legacy CSV export filtered lesson rows includes id,lessonName,courseId,sequence,active,enabled. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:434-441`
- vNext now: vNext superadmin server CSV export, college filtered export with different columns and limit. `src/app/(authenticated)/admin/lessons/page.tsx:58-63`, `src/modules/courses/college-lessons-export-model.ts:4-57`
- Fix: Provide legacy format preset or versioned export with column names/order and BOM tests.
