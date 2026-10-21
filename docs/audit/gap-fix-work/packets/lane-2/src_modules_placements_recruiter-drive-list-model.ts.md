# Work packet: edit src/modules/placements/recruiter-drive-list-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/recruiter-drives-index.md

## G2-11-003-002  [P1] GAP  facet F01  effort M
- Legacy: Default tab waiting when any, else live, else all `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:103`
- vNext now: vNext view defaults ALL regardless counts `src/modules/placements/recruiter-drive-list-model.ts:4`
- Fix: Set initial view by current counts, persist in URL
