# Work packet: edit src/modules/placements/tpo-calendar-url-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u012-tpo-calendar.md

## G2-5-012-077  [P1] GAP  facet F16  effort M
- Legacy: Legacy <768px viewport switches default view from Week to Agenda (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:51-52`)
- vNext now: vNext uses user-agent pattern to choose default view (`src/modules/placements/tpo-calendar-url-model.ts:14-16`)
- Fix: Switch by actual client viewport including narrow desktop; preserve URL override
