# Work packet (wave 2): edit src/modules/placements/tpo-drive-cancel-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-job-controller.md, docs/audit/gap2/lane-8/admin-job-service.md, docs/audit/gap2/lane-8/job-lifecycle-service.md

## G2-2-016-006  [P2] GAP  facet F03  effort M
- Legacy: Job deletion impact preview includes linked applications (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:963-997`)
- vNext now: VNext archive flow and separate cancellation impact (`src/modules/placements/job-service.ts:735-766; src/modules/placements/tpo-drive-cancel-service.ts:38-79`)
- Fix: Match impact preview and distinguish cancel vs archive before action

## G2-8-012-006  [P2] GAP  facet F03  effort M
- Legacy: Job deletion impact preview includes linked applications (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:963-997`)
- vNext now: VNext archive flow and separate cancellation impact (`src/modules/placements/job-service.ts:735-766; src/modules/placements/tpo-drive-cancel-service.ts:38-79`)
- Fix: Match impact preview and distinguish cancel vs archive before action

## G2-8-011-020  [P2] GAP  facet F10  effort M
- Legacy: Job.lifecycleStatus sole authorized writer as documented (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:10-14`)
- vNext now: vNext lifecycle service writes published/closed; separate cancel service also writes CANCELLED (`src/modules/placements/tpo-drive-lifecycle-service.ts:186-196; src/modules/placements/tpo-drive-cancel-service.ts:82-100`)
- Fix: Centralize cross-service transition invariant or share narrow mutation policy
