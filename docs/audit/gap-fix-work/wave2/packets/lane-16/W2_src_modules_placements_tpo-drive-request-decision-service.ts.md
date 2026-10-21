# Work packet (wave 2): edit src/modules/placements/tpo-drive-request-decision-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/tpo-drive-controller.md

## G2-3-023-017  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:136-158`
- vNext now: `src/modules/placements/tpo-drive-request-decision-service.ts:22-83`
- Fix: Legacy approve/send-back/reject recruiter request uses same job; VNext split request record and draft approval flow. Align confirmation.

## G2-3-023-025  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoDriveService.java:70-86`, `522-545`
- vNext now: `src/modules/placements/tpo-drive-request-decision-service.ts:21-80`
- Fix: Legacy REQUEST/SENT_BACK/REJECTED lifecycle in job vs VNext separate recruiter request statuses and job DRAFT. Map labels.
