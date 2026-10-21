# Work packet (wave 2): edit src/modules/placements/tpo-round-drive-day-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drive-day-roundid.md

## G2-11-008-067  [P2] MISSING  facet F14  effort S
- Legacy: Call via `tel:` for full operators. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:337`
- vNext now: No phone data projection. `src/modules/placements/tpo-round-drive-day-service.ts:58`
- Fix: Reintroduce phone call action only for privileged TPO.
