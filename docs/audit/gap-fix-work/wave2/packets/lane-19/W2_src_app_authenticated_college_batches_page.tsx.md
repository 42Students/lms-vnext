# Work packet (wave 2): edit src/app/(authenticated)/college/batches/page.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u021-batch.md, docs/audit/gap2/lane-6/batch-search-controller.md, docs/audit/gap2/lane-9/college-admin-batches.md

## G2-5-021-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy batch tied to program via batch controller/service `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Batch.java:11-29`
- vNext now: VNext cohorts in college batches directory route `src/app/(authenticated)/college/batches/page.tsx:17-48`
- Fix: Map old `/batch` navigation and deep links to college cohort paths.

## G2-6-014-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/batches/BatchSearchController.java:21-26`
- vNext now: `src/app/(authenticated)/college/batches/page.tsx:17-25`
- Fix: Add v2 search endpoint alias or document retirement

## G2-6-014-019  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/batches/BatchSearchCache.java:56-69`
- vNext now: `src/app/(authenticated)/college/batches/page.tsx:25-32`
- Fix: Preserve no-data versus cache-load failure distinction

## G2-9-003-002  [P2] GAP  facet F01  effort M
- Legacy: AdminGroupShell academic tabs wrap Batches (`docs/legacy-source/frontend/src/pages/college-admin/batches.js:30-39`)
- vNext now: CollegeAcademicDirectory plus create form without group shell (`src/app/(authenticated)/college/batches/page.tsx:37-49`)
- Fix: Restore Academic Setup tab strip and active tab styling.

## G2-9-003-058  [P2] GAP  facet F13  effort M
- Legacy: Eight-row batch TableSkeleton initial load, refresh retains previous rows (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:569-583`)
- vNext now: SSR request no explicit skeleton in page (`src/app/(authenticated)/college/batches/page.tsx:20-45`)
- Fix: Add equivalent skeleton via route loading UI.

## G2-9-003-059  [P2] GAP  facet F13  effort M
- Legacy: Couldn't refresh batches warning, previous rows retained, Retry (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:549-556`)
- vNext now: Invalid filters ErrorState only; other exceptions propagate (`src/app/(authenticated)/college/batches/page.tsx:20-35`)
- Fix: Add local refresh retry with preserved old rows.

## G2-9-003-063  [P2] GAP  facet F14  effort M
- Legacy: AdminTableToolbar exports filtered loaded rows to batches.csv (`docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:539-548`)
- vNext now: Export CSV link with filtered server cap 1000 (`src/app/(authenticated)/college/batches/page.tsx:38-45`)
- Fix: Match filename and column/header ordering or document full-scope export distinction.
