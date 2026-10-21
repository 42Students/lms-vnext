# Work packet: edit src/components/placements/college-hiring-funnel.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-hiring-dashboard.md

## G2-9-008-006  [P1] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:437-499` — Nine immediately visible Ant Statistic cards plus optional average card
- vNext now: `src/components/placements/college-hiring-funnel.tsx:73-82` — Stage metrics hidden inside closed details and separate 4 KPI SummaryStrip
- Fix: Expose legacy metric strip without extra click and match initial card layout

## G2-9-008-011  [P1] MISSING  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:501-525` — Funnel stage header bold label, right aligned count, blue conversion tag
- vNext now: `src/components/placements/college-hiring-funnel.tsx:90-95` — Bar labels and values without stage-to-stage conversion tags
- Fix: Add previous-stage conversion percentages and exact tag wording

## G2-9-008-020  [P1] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:352-366` — Changing Department clears Program immediately
- vNext now: `src/components/placements/college-hiring-funnel.tsx:41-56` — Independent GET selectors; department change does not clear current program
- Fix: Reset Program when Department changes and validate dependent selection

## G2-9-008-022  [P1] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:225-231` — Clear all resets date, job, department, program, batch simultaneously
- vNext now: `src/components/placements/college-hiring-funnel.tsx:65-68` — Clear all retains selected season and job
- Fix: Reset job along with other filters when explicitly clearing all

## G2-9-008-033  [P1] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:553-555` — Company report failure shows dedicated inline error Alert
- vNext now: `src/components/placements/college-hiring-funnel.tsx:99-115` — Company rows and funnel computed together; failure shares route error
- Fix: Handle company report failure separately

## G2-9-008-036  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:428-435` — Initial empty metrics fallback No data for the selected filters
- vNext now: `src/components/placements/college-hiring-funnel.tsx:83-88` — Zero total gives empty funnel message and Clear filters
- Fix: Reconcile empty metrics/funnel wording and placement

## G2-9-008-037  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/HiringDashboard.js:590-599` — Empty company filtered message No companies match these filters — try widening the date range or clearing filters
- vNext now: `src/components/placements/college-hiring-funnel.tsx:101-115` — Generic No data for the selected filters
- Fix: Restore company-specific empty copy and Clear filters button
