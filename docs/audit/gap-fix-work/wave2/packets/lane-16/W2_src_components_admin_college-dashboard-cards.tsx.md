# Work packet (wave 2): edit src/components/admin/college-dashboard-cards.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l13-u031-dashboards-reports.md, docs/audit/gap2/lane-9/college-admin-dashboard.md

## G2-13-031-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy four compact At a glance cards, icon per stat. `docs/legacy-source/frontend/src/components/admin/dashboard/AtAGlance.js:55-88`
- vNext now: vNext StatTile four cards, linked and responsive. `src/components/admin/college-dashboard-cards.tsx:11-21`, `src/modules/admin-ui/college-dashboard-cards-model.ts:17-20`
- Fix: Restore card size and icons.

## G2-13-031-047  [P2] GAP  facet F13  effort M
- Legacy: Legacy null metrics distinguish unavailable from zero. `docs/legacy-source/frontend/src/components/admin/dashboard/AtAGlance.js:67-86`
- vNext now: vNext null to dash but no stale warning. `src/components/admin/college-dashboard-cards.tsx:15-21`
- Fix: Expose failed-refresh reason.

## G2-13-031-055  [P2] GAP  facet F16  effort M
- Legacy: Legacy responsive At a glance cards. `docs/legacy-source/frontend/src/components/admin/dashboard/AtAGlance.js:76-88`
- vNext now: vNext mobile1,md2,lg4 tiles. `src/components/admin/college-dashboard-cards.tsx:17-21`
- Fix: Check spacing/typographic scale.

## G2-9-005-007  [P2] GAP  facet F02  effort M
- Legacy: At a glance in four-card row after hello (`docs/legacy-source/frontend/src/components/admin/dashboard/AtAGlance.js:76-94`)
- vNext now: StatTile 1/2/4 column grid after college code/city/state/country panel (`src/components/admin/college-dashboard-cards.tsx:13-22`)
- Fix: Move cards directly after hello and restore dense desktop card grouping.

## G2-9-005-010  [P2] GAP  facet F03  effort M
- Legacy: Each metric Ant Card size small and Statistic with icon (`docs/legacy-source/frontend/src/components/admin/dashboard/AtAGlance.js:70-94`)
- vNext now: StatTile variant college no icon (`src/components/admin/college-dashboard-cards.tsx:11-22`)
- Fix: Restore icon prefix and exact card radius/shadow/border.

## G2-9-005-046  [P2] GAP  facet F13  effort M
- Legacy: Four skeleton cards during initial metric fetch (`docs/legacy-source/frontend/src/components/admin/dashboard/AtAGlance.js:75-88`)
- vNext now: Metrics only after await, no skeleton in this component (`src/components/admin/college-dashboard-cards.tsx:13-22`)
- Fix: Add shell route loading skeleton with 4 stats.

## G2-9-005-052  [P2] GAP  facet F16  effort M
- Legacy: 4 summary cards xs12 sm6 (`docs/legacy-source/frontend/src/components/admin/dashboard/AtAGlance.js:78-94`)
- vNext now: 1 mobile,2 md,4 lg columns (`src/components/admin/college-dashboard-cards.tsx:15-22`)
- Fix: Use two cards per phone row matching legacy.

## G2-13-031-007  [P3] GAP  facet F03  effort S
- Legacy: Legacy User/Team/Book/Solution icons. `docs/legacy-source/frontend/src/components/admin/dashboard/AtAGlance.js:55-58`
- vNext now: vNext StatTile wrapper supplies no matching icon. `src/components/admin/college-dashboard-cards.tsx:17-20`
- Fix: Add legacy icons.
