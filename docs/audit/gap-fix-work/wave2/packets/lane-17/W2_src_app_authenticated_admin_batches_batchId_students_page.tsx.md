# Work packet (wave 2): edit src/app/(authenticated)/admin/batches/[batchId]/students/page.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-batches-component.md, docs/audit/gap2/lane-9/superadmin-batches.md

## G2-9-029-022  [P2] GAP  facet F05  effort L
- Legacy: Students modal lists each class roster, 20 rows/page, in-place filtering `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:601-654`
- vNext now: Separate Manage students page with full roster `src/app/(authenticated)/admin/batches/[batchId]/students/page.tsx:17-45`
- Fix: Recreate modal entry and matching roster controls

## G2-9-029-041  [P2] GAP  facet F09  effort L
- Legacy: Students NAME Modal width720 and class picker `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:601-654`
- vNext now: Dedicated route with breadcrumbs/PageHeader `src/app/(authenticated)/admin/batches/[batchId]/students/page.tsx:17-45`
- Fix: Restore single-overlay roster access for parity, keep route deeplink

## G2-9-029-065  [P2] GAP  facet F21  effort M
- Legacy: Class and roster integrations plus capacity recheck via AdminService `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:225-260,327-363`
- vNext now: Roster uses batch overview service and separate manager `src/app/(authenticated)/admin/batches/[batchId]/students/page.tsx:17-33`
- Fix: Document new service source and side-effects for move

## G2-9-023-022  [P2] GAP  facet F05  effort L
- Legacy: Students modal lists each class roster, 20 rows/page, in-place filtering `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:601-654`
- vNext now: Separate Manage students page with full roster `src/app/(authenticated)/admin/batches/[batchId]/students/page.tsx:17-45`
- Fix: Recreate modal entry and matching roster controls

## G2-9-023-041  [P2] GAP  facet F09  effort L
- Legacy: Students NAME Modal width720 and class picker `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:601-654`
- vNext now: Dedicated route with breadcrumbs/PageHeader `src/app/(authenticated)/admin/batches/[batchId]/students/page.tsx:17-45`
- Fix: Restore single-overlay roster access for parity, keep route deeplink

## G2-9-023-065  [P2] GAP  facet F21  effort M
- Legacy: Class and roster integrations plus capacity recheck via AdminService `docs/legacy-source/frontend/src/pages/superadmin/sections/Batches.js:225-260,327-363`
- vNext now: Roster uses batch overview service and separate manager `src/app/(authenticated)/admin/batches/[batchId]/students/page.tsx:17-33`
- Fix: Document new service source and side-effects for move
