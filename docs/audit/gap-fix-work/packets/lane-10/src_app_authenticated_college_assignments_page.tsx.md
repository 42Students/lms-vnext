# Work packet: edit src/app/(authenticated)/college/assignments/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-admin-assignments.md, docs/audit/gap2/lane-4/superadmin-sections-assignments.md

## G2-4-004-068  [P1] GAP  facet F13  effort M
- Legacy: List load error `Assignments could not be loaded` + Retry; stale fetch response guarded by token. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:263-287; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:421-425`)
- vNext now: Server-fetched page handles invalid filters; `listCollegeAssessmentAggregate` throws on DB error, no local Retry list control. (`src/app/(authenticated)/college/assignments/page.tsx:24-44`)
- Fix: Add dedicated list fetch error boundary with retry and empty old rows instead of generic error.

## G2-4-010-068  [P1] GAP  facet F13  effort M
- Legacy: List load error `Assignments could not be loaded` + Retry; stale fetch response guarded by token. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:263-287; docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:421-425`)
- vNext now: Server-fetched page handles invalid filters; `listCollegeAssessmentAggregate` throws on DB error, no local Retry list control. (`src/app/(authenticated)/college/assignments/page.tsx:24-44`)
- Fix: Add dedicated list fetch error boundary with retry and empty old rows instead of generic error.
