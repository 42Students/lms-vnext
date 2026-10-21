# Work packet: edit src/app/(authenticated)/admin/batches/page.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-batches-component.md, docs/audit/gap2/lane-9/superadmin-batches.md, docs/audit/gap2/lane-6/batch-search-controller.md

## G2-9-029-012  [P1] MISSING  facet F03  effort M
- Legacy: Toolbar search, refresh, row count and batches.csv export `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:538-548`
- vNext now: Search/Filter/Refresh/Clear but no batches.csv in main view `src/app/(authenticated)/admin/batches/page.tsx:48-81`
- Fix: Restore CSV export filtered rows

## G2-9-029-015  [P1] GAP  facet F04  effort M
- Legacy: Class count classCount; currentStudents `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:475-477`
- vNext now: No classes column, activeEnrolledLearners count `src/app/(authenticated)/admin/batches/page.tsx:98-99`
- Fix: Show classes and verify legacy student membership semantics

## G2-9-029-055  [P1] MISSING  facet F14  effort M
- Legacy: batches.csv export filtered rows with key fields `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:538-548`
- vNext now: No export action on batches directory page `src/app/(authenticated)/admin/batches/page.tsx:48-81`
- Fix: Reinstate CSV export with legacy headers, code-injection safety

## G2-9-023-012  [P1] MISSING  facet F03  effort M
- Legacy: Toolbar search, refresh, row count and batches.csv export `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:538-548`
- vNext now: Search/Filter/Refresh/Clear but no batches.csv in main view `src/app/(authenticated)/admin/batches/page.tsx:48-81`
- Fix: Restore CSV export filtered rows

## G2-9-023-015  [P1] GAP  facet F04  effort M
- Legacy: Class count classCount; currentStudents `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:475-477`
- vNext now: No classes column, activeEnrolledLearners count `src/app/(authenticated)/admin/batches/page.tsx:98-99`
- Fix: Show classes and verify legacy student membership semantics

## G2-9-023-055  [P1] MISSING  facet F14  effort M
- Legacy: batches.csv export filtered rows with key fields `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:538-548`
- vNext now: No export action on batches directory page `src/app/(authenticated)/admin/batches/page.tsx:48-81`
- Fix: Reinstate CSV export with legacy headers, code-injection safety

## G2-6-014-012  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/batches/BatchSearchController.java:107-113`
- vNext now: `src/app/(authenticated)/admin/batches/page.tsx:106-107`
- Fix: Preserve response Batches retrieved in duration-ms on API compatibility
