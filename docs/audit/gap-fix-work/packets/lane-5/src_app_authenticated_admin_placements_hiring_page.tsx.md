# Work packet: edit src/app/(authenticated)/admin/placements/hiring/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-hiring-dashboard.md

## G2-10-008-001  [P1] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/hiring-dashboard.js:11-37` /superadmin/hiring-dashboard under SuperAdminLayout, college-scoped
- vNext now: `src/app/(authenticated)/admin/placements/hiring/page.tsx:5-9` /admin/placements/hiring renders job count directory; `src/app/(authenticated)/admin/placements/analytics/page.tsx:19-44` /admin/placements/analytics implements dashboard features
- Fix: Make the Analytics page the primary hiring-dashboard equivalent and preserve legacy deep link/active tab to it

## G2-10-008-063  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:911-937` GET metrics/funnel/company-report via three endpoints and different parameters
- vNext now: `src/modules/admin-ui/super-admin-hiring-report-service.ts:14-92` unified Drizzle report service and `src/app/(authenticated)/admin/placements/hiring/page.tsx:5-9` separate job directory read
- Fix: Keep endpoint-equivalent response sections for report accuracy even if served by one query
