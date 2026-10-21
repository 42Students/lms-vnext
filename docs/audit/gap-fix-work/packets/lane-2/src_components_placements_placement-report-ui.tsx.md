# Work packet: edit src/components/placements/placement-report-ui.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l13-u031-dashboards-reports.md, docs/audit/gap2/lane-9/college-admin-hiring-dashboard.md

## G2-13-031-094  [P1] GAP  facet F06  effort M
- Legacy: Legacy details include batch/branch/company/mode/category with report-specific filter hiding. `docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:203-217`
- vNext now: vNext primary filter is season/drive. `src/components/placements/placement-report-ui.tsx:50-128`
- Fix: Support Academic Setup batch and other report dimensions.

## G2-9-008-016  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:438-485` — Total Applications, Applied, Shortlisted, Interview, Offered, Hired, Rejected, Withdrawn, Waitlisted shown immediately
- vNext now: `src/components/placements/placement-report-ui.tsx:159-184` — Top metrics Placement rate, Students placed, Offers, Students accepted
- Fix: Render stage counts as primary metrics and move supplemental placement metrics elsewhere
