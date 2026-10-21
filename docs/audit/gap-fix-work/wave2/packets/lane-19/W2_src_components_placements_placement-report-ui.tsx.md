# Work packet (wave 2): edit src/components/placements/placement-report-ui.tsx

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l11-u022-tpo-reports-index.md, docs/audit/gap2/lane-5/l13-u031-dashboards-reports.md, docs/audit/gap2/lane-8/l11-u021-tpo-report-detail.md, docs/audit/gap2/lane-9/college-admin-hiring-dashboard.md

## G2-11-022-030  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:46-51`
- vNext now: `src/components/placements/placement-report-ui.tsx:50-132`
- Fix: Legacy snapshot always uses default report scope with no season/job selection; vNext defaults active or latest season, supports season/job filtering. Explain denominator differences.

## G2-11-022-042  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:69-73`
- vNext now: `src/components/placements/placement-report-ui.tsx:32-48`
- Fix: Legacy journey routes are bare relative report URLs; vNext reportHref propagates seasonId/jobId query. Preserve scoped filters while maintaining clicked metric semantics.

## G2-11-022-045  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:69-73`
- vNext now: `src/components/placements/placement-report-ui.tsx:32-48`
- Fix: Legacy snapshot default college from session; vNext selected season/job is URL-controlled but validates job and college, ensure deep-link never broadens tenant scope.

## G2-11-022-048  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:70-72`
- vNext now: `src/components/placements/placement-report-ui.tsx:159-183`
- Fix: Legacy offers made from snapshot.offers in JourneyStrip caption; vNext metrics SummaryStrip contains Offers, and the methodology text is collapsed.

## G2-13-031-101  [P2] GAP  facet F18  effort M
- Legacy: Legacy rate-empty copy: `no placement rate yet (nobody has registered)`. `docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:173-175`
- vNext now: vNext percent formatter uses dash. `src/components/placements/placement-report-ui.tsx:20-28`
- Fix: Render explanatory zero-denominator phrase.

## G2-13-031-105  [P2] MISSING  facet F23  effort M
- Legacy: Legacy report detail supports browser fullscreen presentation and Escape exit. `docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:71-84`
- vNext now: vNext report filter doesn't expose presentation action. `src/components/placements/placement-report-ui.tsx:50-128`
- Fix: Add fullscreen mode or record owner-approved retirement.

## G2-11-021-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:183-219 puts filters in compact Card and chart in a separate Card
- vNext now: src/components/placements/placement-report-ui.tsx:60-125 uses border-separated filter section and src/app/(authenticated)/tpo/reports/unplaced/page.tsx:130-153 uncarded report table
- Fix: Restore old bordered card geometry and spacing

## G2-11-021-005  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:161-169 has Presentation view, All reports, conditional NAAC export and Students action
- vNext now: src/app/(authenticated)/tpo/reports/unplaced/page.tsx:95-100 has Download filtered CSV and src/components/placements/placement-report-ui.tsx:1-3 has separate presentation implementation
- Fix: Restore header actions and full-screen toggle for each applicable report

## G2-11-021-009  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/components/tpo/reportViews.js:13-15 formats LPA and percentages with explicit suffix
- vNext now: src/components/placements/placement-report-ui.tsx:20-29 formats rupee currency and percentage in shared UI
- Fix: Show annual LPA and pct formatting on report columns

## G2-11-021-015  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:185-202 Saved filters supports named presets, inline Save and Delete
- vNext now: src/components/placements/placement-report-ui.tsx:125 includes TpoReportSavedFilters component with different presentation
- Fix: Preserve saved-preset control order, naming and deletion

## G2-9-008-009  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:328-401` — Date range/job/department/program/batch, Refresh and Export report in one wrapping toolbar
- vNext now: `src/components/placements/placement-report-ui.tsx:50-131` — Two separate season and drive apply forms plus saved presets; remaining filters hidden in collapsible section
- Fix: Restore single-row aligned filters, icon buttons and ordering

## G2-9-008-019  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:339-351` — Job select allowClear, label first30 chars jobTitle - companyName, All jobs default
- vNext now: `src/components/placements/placement-report-ui.tsx:101-115` — Drive selector label company · title, default All drives in selected season
- Fix: Restore Job dropdown wording, truncation and default semantics

## G2-9-008-051  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:190-204` — Partial filter lookup warning with named errors and retry by request/focus
- vNext now: `src/components/placements/placement-report-ui.tsx:50-131` — No individually recoverable filter fetch states
- Fix: Render dropdown errors and retry without erasing other options
