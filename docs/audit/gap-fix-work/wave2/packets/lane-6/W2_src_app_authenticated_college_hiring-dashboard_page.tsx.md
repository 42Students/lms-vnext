# Work packet (wave 2): edit src/app/(authenticated)/college/hiring-dashboard/page.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-hiring-dashboard.md

## G2-9-008-001  [P2] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/hiring-dashboard.js:18-21` — Admin job placement sidebar item jobs selected on mount
- vNext now: `src/app/(authenticated)/college/hiring-dashboard/page.tsx:41-48` — Analytics PageHeader and report navigation, no page-local setActiveMenuItem
- Fix: Verify shell active Placements highlight when deep-linked

## G2-9-008-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/hiring-dashboard.js:37-42` — AdminLayout with AdminGroupShell placements tab strip and placements-page class
- vNext now: `src/app/(authenticated)/college/hiring-dashboard/page.tsx:41-48` — PageHeader and CollegeReportNavigation; no legacy group shell
- Fix: Restore grouped Placements tab labels and active Analytics state

## G2-9-008-004  [P2] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:322-327` — PlacementsPageOverview title Placement Analytics and one-line description
- vNext now: `src/app/(authenticated)/college/hiring-dashboard/page.tsx:41-47` — Page title Analytics followed by separate Placement Analytics heading in funnel
- Fix: Use one Placement Analytics header and legacy description beside it

## G2-9-008-044  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:871-880` — Explicit positive collegeId, requirePerformAdminAction and module placements flag
- vNext now: `src/app/(authenticated)/college/hiring-dashboard/page.tsx:18-20` — Context membership COLLEGE_ADMIN only; server query derives own college
- Fix: Keep scoped college derivation and test placements disabled behavior

## G2-9-008-045  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/hiring-dashboard.js:37-42` — College admin dashboard shares company/funnel component with scoped superadmin
- vNext now: `src/app/(authenticated)/college/hiring-dashboard/page.tsx:18-21` — Only COLLEGE_ADMIN role can visit this route
- Fix: Confirm scoped superadmin uses separate /admin route with same visualization parity

## G2-9-008-061  [P2] GAP  facet F16  effort M
- Legacy: `docs/design/old-lms-pages.md:5-13` — One continuous white canvas, page head in one row, compact funnel strip
- vNext now: `src/app/(authenticated)/college/hiring-dashboard/page.tsx:41-55` — Sectioned metrics page with several nested bordered blocks and separate reporting details
- Fix: Recreate single canvas hierarchy and hairline separators

## G2-9-008-065  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:325-327` — Title Placement Analytics and exact long descriptive sentence
- vNext now: `src/app/(authenticated)/college/hiring-dashboard/page.tsx:42-47` — Top heading Analytics; duplicate Placement Analytics description lower down
- Fix: Use exactly one title/description in correct location
