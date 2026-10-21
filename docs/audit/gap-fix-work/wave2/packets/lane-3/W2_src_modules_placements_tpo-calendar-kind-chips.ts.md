# Work packet (wave 2): edit src/modules/placements/tpo-calendar-kind-chips.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u012-tpo-calendar.md

## G2-5-012-009  [P2] GAP  facet F03  effort S
- Legacy: Legend displays singular Round, Talk, Deadline, Follow-up, Blocked with exact fixed colors (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:18-18`)
- vNext now: vNext displays Rounds, Talks, Deadlines, Follow-ups, Blocked (exam) dates (`src/modules/placements/tpo-calendar-kind-chips.ts:3-9`)
- Fix: Restore singular labels and color swatches #0958d9 #6b2fd1 #b34700 #0a7c88 #5b6b82

## G2-5-012-025  [P2] GAP  facet F05  effort M
- Legacy: Type chip first click isolates type, last selected toggled reselects all (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:216-218`)
- vNext now: vNext URL toggle permits empty selection and explicit All events (`src/modules/placements/tpo-calendar-kind-chips.ts:12-25`)
- Fix: Preserve pressed/reset semantics for single/combination filters
