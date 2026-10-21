# Work packet: edit src/modules/placements/tpo-drive-request-decision-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/tpo-drive-controller.md

## G2-3-023-047  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveService.java:595-714`
- vNext now: `src/modules/placements/job-service.ts:616-765`, `src/modules/placements/tpo-drive-request-decision-service.ts:22-83`
- Fix: Legacy lifecycle fanout across application status, interview, offer and outbox vs VNext split ledgers needs transaction mapping.
