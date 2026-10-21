# Work packet: edit src/app/(authenticated)/admin/academics/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-index.md

## G2-10-010-004  [P1] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/dashboard.js:53-65` /superadmin/dashboard is Overview/Dashboard landing target with SuperAdminLayout
- vNext now: `src/app/(authenticated)/admin/academics/page.tsx:40-50` /admin/academics without college shows Select a college scope, not dashboard
- Fix: Make unscoped super admins land on global dashboard, not a blocked academic management view

## G2-10-010-008  [P1] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/dashboard.js:52-61` destination Dashboard shows PageShell Dashboard
- vNext now: `src/app/(authenticated)/admin/academics/page.tsx:40-68` destination Academic Setup header and academic workspace
- Fix: Align destination page structure with Dashboard landing
