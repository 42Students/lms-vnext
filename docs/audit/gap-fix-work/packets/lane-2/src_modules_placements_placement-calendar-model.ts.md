# Work packet: edit src/modules/placements/placement-calendar-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u012-tpo-calendar.md

## G2-5-012-027  [P1] GAP  facet F05  effort M
- Legacy: Agenda spans anchor day through anchor+30 days (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:54-58`)
- vNext now: vNext agenda uses selected whole month (`src/modules/placements/placement-calendar-model.ts:121-139`)
- Fix: Use rolling 30-day range anchored on selected date
