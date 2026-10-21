# Work packet (wave 2): edit src/modules/placements/placement-calendar-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u012-tpo-calendar.md

## G2-5-012-026  [P2] GAP  facet F05  effort M
- Legacy: Week from Sunday startOf(week) through Saturday (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:54-58`)
- vNext now: vNext week window follows Monday-first model (`src/modules/placements/placement-calendar-model.ts:121-166`)
- Fix: Align start-of-week to legacy Sunday and navigation label
