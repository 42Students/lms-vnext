# Work packet: edit src/modules/placements/drive-day-coordinator-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drive-day-index.md

## G2-11-009-046  [P1] GAP  facet F11  effort M
- Legacy: Legacy TPO portal lists college rounds regardless of individual assignment. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:14`
- vNext now: Learner branch checks coordinator assignment membership and dutyDate. `src/modules/placements/drive-day-coordinator-service.ts:448`
- Fix: Never substitute coordinator list for active TPO portal.
