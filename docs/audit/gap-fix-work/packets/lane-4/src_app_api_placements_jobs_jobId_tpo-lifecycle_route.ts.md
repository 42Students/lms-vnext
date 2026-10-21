# Work packet: edit src/app/api/placements/jobs/[jobId]/tpo-lifecycle/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/tpo-drive-controller.md

## G2-3-023-013  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:185-193`
- vNext now: `src/app/api/placements/jobs/[jobId]/tpo-lifecycle/route.ts:20-25`
- Fix: Legacy illegal arguments return 404, invalid lifecycle 409; VNext typed errors and email 422. Align recovery messages.
