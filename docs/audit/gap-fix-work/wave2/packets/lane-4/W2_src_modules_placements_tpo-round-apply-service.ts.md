# Work packet (wave 2): edit src/modules/placements/tpo-round-apply-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l12-u022-tpo-results-controller.md

## G2-12-022-010  [P2] MISSING  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/RoundsTab.js:383-386 — preview displays original entered-by source and reason category
- vNext now: src/modules/placements/tpo-round-apply-service.ts:23-34,43-45 — preview fetches only result identity, learner, outcome, version/status
- Fix: Select source/reason/roll for parity and authorization-filter internal fields
