# Work packet: edit src/app/(authenticated)/admin/placements/analytics/error.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-hiring-dashboard.md

## G2-10-008-080  [P1] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:413-425` partial filter/metric/funnel/report alerts alongside last-good data
- vNext now: `src/app/(authenticated)/admin/placements/analytics/error.tsx:6-10` full-page error
- Fix: Render per-section failures and retain same-scope previous data

## G2-10-008-051  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:194-204` lists exact failing filter names in persistent warning
- vNext now: `src/modules/admin-ui/super-admin-hiring-report-filters-service.ts:17-30` Promise.all filter reads fail page as a whole; `src/app/(authenticated)/admin/placements/analytics/error.tsx:6-10` generic error boundary
- Fix: Keep available filters and show targeted failure list for jobs/departments/programs/batches

## G2-10-008-053  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:417-425` refresh error says Couldn't refresh hiring metrics; shows last data
- vNext now: `src/app/(authenticated)/admin/placements/analytics/error.tsx:6-10` resets route, no last-good data fallback
- Fix: Show old scoped data with warning only when exact filters unchanged

## G2-10-008-054  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:155-167` catch Failed to load hiring data
- vNext now: `src/app/(authenticated)/admin/placements/analytics/error.tsx:6-10` renders generic boundary
- Fix: Surface failed resource and Retry with current query

## G2-10-008-058  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:417-425` hasCurrentScope failure banner Couldn't refresh hiring metrics
- vNext now: `src/app/(authenticated)/admin/placements/analytics/error.tsx:6-10` generic error reset
- Fix: Reuse exact refresh-failure headline and last-good explanation
