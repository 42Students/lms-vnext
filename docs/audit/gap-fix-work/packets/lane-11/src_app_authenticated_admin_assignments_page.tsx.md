# Work packet: edit src/app/(authenticated)/admin/assignments/page.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/superadmin-assignments.md, docs/audit/gap2/lane-4/superadmin-sections-assignments.md

## G2-4-007-045  [P1] GAP  facet F14  effort M
- Legacy: Export filename assignments-college-ID-page-P.csv with 8 columns. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:329-341`)
- vNext now: New admin export path uses whole filtered records and different schema. (`src/app/(authenticated)/admin/assignments/page.tsx:58-61`)
- Fix: Match per-page CSV name, columns, timezone and disabled state.

## G2-4-010-124  [P1] GAP  facet F14  effort M
- Legacy: Old Export CSV (page) filename assignments-college-ID-page-P.csv, columns title/course/scope/points/deadline/submitted/total/graded. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:329-341`)
- vNext now: SA export downloads all filtered rows from separate route, not selected page. (`src/app/(authenticated)/admin/assignments/page.tsx:58-61`)
- Fix: Offer page-only filename/columns with separate full-filter export if useful.

## G2-4-007-026  [P2] GAP  facet F07  effort M
- Legacy: Course loading error Course list unavailable with Retry courses. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:391-395`)
- vNext now: Options unavailable warning no button to retry just choices. (`src/app/(authenticated)/admin/assignments/page.tsx:52-56`)
- Fix: Add per-options retry control.

## G2-4-007-027  [P2] GAP  facet F07  effort M
- Legacy: List error Assignments could not be loaded with Retry. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:421-425`)
- vNext now: ErrorState Assignments unavailable, retry hyperlink to list reset. (`src/app/(authenticated)/admin/assignments/page.tsx:42-48`)
- Fix: Preserve active filters on retry and exact wording.

## G2-4-010-115  [P2] GAP  facet F07  effort M
- Legacy: Legacy course list failure `Course list unavailable` and Retry courses, section failure `Section list unavailable` Retry sections. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:391-400`)
- vNext now: New SA failed authoring options shows only `Assignment creation options are temporarily unavailable` with no targeted retry. (`src/app/(authenticated)/admin/assignments/page.tsx:52-56`)
- Fix: Add specific independent course/section retry and error copy.

## G2-4-010-116  [P2] GAP  facet F07  effort M
- Legacy: Legacy list error `Assignments could not be loaded` plus retry while retaining current filters. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:263-287;docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:421-425`)
- vNext now: SA error `Assignments unavailable`, link points base `/admin/assignments`, drops q/status/page. (`src/app/(authenticated)/admin/assignments/page.tsx:42-48`)
- Fix: Preserve exact failure copy and current filter URL on retry.
