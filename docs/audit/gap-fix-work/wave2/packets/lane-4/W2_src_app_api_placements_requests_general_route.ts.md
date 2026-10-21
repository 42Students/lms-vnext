# Work packet (wave 2): edit src/app/api/placements/requests/general/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/placement-cell.md

## G2-12-005-043  [P2] GAP  facet F10  effort S
- Legacy: StudentRequest POST `{type,jobId,applicationId,payload,reason}`, guards own targets `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRequestController.java:29-49`
- vNext now: Separate general request POST typed discriminated kind, domain service `src/app/api/placements/requests/general/route.ts:24-35`
- Fix: Ensure all legacy request kinds and targets are reachable in new UI
