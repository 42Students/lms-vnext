# Work packet (wave 2): edit src/modules/admin-ui/college-dashboard-cards-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l13-u031-dashboards-reports.md

## G2-13-031-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy four compact At a glance cards, icon per stat. `docs/legacy-source/frontend/src/components/admin/dashboard/AtAGlance.js:55-88`
- vNext now: vNext StatTile four cards, linked and responsive. `src/components/admin/college-dashboard-cards.tsx:11-21`, `src/modules/admin-ui/college-dashboard-cards-model.ts:17-20`
- Fix: Restore card size and icons.
