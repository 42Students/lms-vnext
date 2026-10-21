# Verification packet (P1 sample): 6 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-11-021-013 [P1] GAP facet F06
- Files: src/modules/placements/report-service.ts
- Legacy: docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:36 defaults batch null, branch/company empty, mode/category null
- Expected fix: Implement all old report filters without silently dropping them

## G2-9-003-003 [P1] GAP facet F01
- Files: src/app/(authenticated)/college/batches/page.tsx
- Legacy: No college warning with Contact administrator (`docs/legacy-source/frontend/src/pages/college-admin/batches.js:20-31`)
- Expected fix: Render legacy warning rather than silent redirect.

## G2-9-004-033 [P1] MISSING facet F07
- Files: src/components/placements/college-company-create.tsx
- Legacy: Internal notes rows2 max2000, placement-team-only tooltip (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:509-519`)
- Expected fix: Provide private relationship-scoped notes with proper access restrictions.

## G2-9-004-043 [P1] GAP facet F09
- Files: src/components/placements/placement-employer-relationships.tsx
- Legacy: Delete Popconfirm blocked if driveCount >0 (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:316-338`)
- Expected fix: Reconcile link dependency guard with relationship archival semantics.

## G2-9-015-103 [P1] GAP facet F22
- Files: src/modules/placements/college-drive-read-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:110-165` — Admin job search status all/active/draft/closed accepts page and size.
- Expected fix: Restore all statuses as default and handle archived separately.

## G2-9-019-003 [P1] GAP facet F01
- Files: src/app/(authenticated)/college/semesters/page.tsx
- Legacy: No assigned college shows warning with exact instruction `docs/legacy-source/frontend/src/pages/college-admin/semesters.js:18-29`
- Expected fix: Display actionable warning, not redirect.
