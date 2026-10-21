# Work packet (wave 2): edit src/app/(authenticated)/admin/academics/page.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-index.md, docs/audit/gap2/lane-9/superadmin-batch-promotion-component.md, docs/audit/gap2/lane-9/superadmin-batch-promotion.md

## G2-10-010-011  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/dashboard.js:53-60` landing PageShell title Dashboard
- vNext now: `src/app/(authenticated)/admin/academics/page.tsx:43-45` unscoped Academic Setup and college selector action
- Fix: Use Dashboard title on destination instead of Academic Setup

## G2-10-010-015  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/dashboard.js:10-40` landing Dashboard routes quick-action keys to module pages
- vNext now: `src/app/(authenticated)/admin/academics/page.tsx:12-31` academic landing only links programs and electives/batch actions
- Fix: Restore global Dashboard quick-action discoverability through corrected redirect

## G2-10-010-022  [P2] GAP  facet F09  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/dashboard.js:55-60` destination Dashboard renders embedded module panels
- vNext now: `src/app/(authenticated)/admin/academics/page.tsx:43-68` destination Academic Setup renders action dropdown
- Fix: Correct target to Dashboard; no extra modal on root

## G2-10-010-040  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/dashboard.js:54` page shell title Dashboard
- vNext now: `src/app/(authenticated)/admin/academics/page.tsx:43`,59 shows Academic Setup
- Fix: Restore Dashboard/Overview title on legacy redirect target

## G2-10-010-048  [P2] GAP  facet F22  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/dashboard.js:43-59` destination Dashboard reads selected college via context
- vNext now: `src/app/(authenticated)/dashboard/page.tsx:83-111` dashboard reads organisations/colleges; `src/app/(authenticated)/admin/academics/page.tsx:35-53` no-college empty
- Fix: Correct target so intended dashboard data model is reachable from old root

## G2-9-028-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy /superadmin/batch-promotion wrapper uses SuperAdminGroupShell academic `docs/legacy-source/frontend/src/pages/superadmin/batch-promotion.js:7-8,23-33`
- vNext now: New /admin/batch-promotion has independent header; linked via Academics More dropdown `src/app/(authenticated)/admin/batch-promotion/page.tsx:19-34` `src/app/(authenticated)/admin/academics/page.tsx:20-29`
- Fix: Restore visible academic group tabs/active tab

## G2-9-022-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy /superadmin/batch-promotion wrapper uses SuperAdminGroupShell academic `docs/legacy-source/frontend/src/pages/superadmin/batch-promotion.js:7-8,23-33`
- vNext now: New /admin/batch-promotion has independent header; linked via Academics More dropdown `src/app/(authenticated)/admin/batch-promotion/page.tsx:19-34` `src/app/(authenticated)/admin/academics/page.tsx:20-29`
- Fix: Restore visible academic group tabs/active tab
