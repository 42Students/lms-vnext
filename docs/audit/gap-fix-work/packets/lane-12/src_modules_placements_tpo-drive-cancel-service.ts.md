# Work packet: edit src/modules/placements/tpo-drive-cancel-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/job-lifecycle-service.md

## G2-8-011-001  [P1] GAP  facet F01  effort L
- Legacy: Legacy lifecycle statuses REQUEST/SENT_BACK/REJECTED/DRAFT/PUBLISHED/CLOSED/CANCELLED (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobLifecycleStatus.java:9-22`)
- vNext now: vNext primary drive lifecycle only DRAFT/PUBLISHED/CLOSED; cancel separate, request in recruiter workflow (`src/modules/placements/tpo-drive-lifecycle-model.ts:3-9,38-45; src/modules/placements/tpo-drive-cancel-service.ts:82-100`)
- Fix: Map requests, sent-back, rejected and cancelled into canonical states with explicit route/action labels
