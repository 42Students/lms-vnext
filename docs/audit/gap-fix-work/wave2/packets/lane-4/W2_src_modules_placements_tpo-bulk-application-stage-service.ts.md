# Work packet (wave 2): edit src/modules/placements/tpo-bulk-application-stage-service.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-job-controller.md, docs/audit/gap2/lane-5/u013-admin-job-service.md, docs/audit/gap2/lane-8/admin-job-service.md, docs/audit/gap2/lane-8/l15-u026-placement-job-controller.md

## G2-2-016-001  [P2] GAP  facet F01  effort L
- Legacy: Legacy college admin Job service owns list/create/edit/delete and application status mutations (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:161-290,433-583,998-1079,1217-1452`)
- vNext now: VNext splits job lifecycle, TPO edit, application service, bulk actions into separate routes (`src/modules/placements/job-service.ts:86-766; src/modules/placements/tpo-drive-edit-service.ts:10-127; src/modules/placements/tpo-bulk-application-stage-service.ts:27-110`)
- Fix: Map navigation routes and matching action availability by College Admin/TPO roles

## G2-2-016-023  [P2] GAP  facet F09  effort L
- Legacy: Legacy updateApplicationStatus sends assessment invitation and change notices (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:1288-1330,1418-1445`)
- vNext now: New application stage actions and notices require explicit scopes/confirmation (`src/modules/placements/tpo-bulk-application-stage-service.ts:77-110`)
- Fix: Match notification confirmation/recipient effects when stage changes

## G2-2-016-033  [P2] GAP  facet F12  effort M
- Legacy: Legacy bulk status operations per item REQUIRES_NEW transactional handling (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:1223-1224,1550-1585`)
- vNext now: New services use SQL transactions and preflight snapshots (`src/modules/placements/tpo-bulk-application-stage-service.ts:77-110`)
- Fix: Preserve explicit partial-success atomicity per application or document all-or-nothing change

## G2-5-013-074  [P2] GAP  facet F18  effort S
- Legacy: Legacy validation message Maximum {N} applications per bulk update (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:1555-1560`)
- vNext now: vNext single row stage writer throws typed STAGE_STORAGE_PENDING/NOT_ALLOWED (`src/modules/placements/tpo-bulk-application-stage-service.ts:77-99`)
- Fix: Match bulk user-facing message and per-row failure wording

## G2-8-012-001  [P2] GAP  facet F01  effort L
- Legacy: Legacy college admin Job service owns list/create/edit/delete and application status mutations (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:161-290,433-583,998-1079,1217-1452`)
- vNext now: VNext splits job lifecycle, TPO edit, application service, bulk actions into separate routes (`src/modules/placements/job-service.ts:86-766; src/modules/placements/tpo-drive-edit-service.ts:10-127; src/modules/placements/tpo-bulk-application-stage-service.ts:27-110`)
- Fix: Map navigation routes and matching action availability by College Admin/TPO roles

## G2-8-012-023  [P2] GAP  facet F09  effort L
- Legacy: Legacy updateApplicationStatus sends assessment invitation and change notices (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:1288-1330,1418-1445`)
- vNext now: New application stage actions and notices require explicit scopes/confirmation (`src/modules/placements/tpo-bulk-application-stage-service.ts:77-110`)
- Fix: Match notification confirmation/recipient effects when stage changes

## G2-8-012-033  [P2] GAP  facet F12  effort M
- Legacy: Legacy bulk status operations per item REQUIRES_NEW transactional handling (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:1223-1224,1550-1585`)
- vNext now: New services use SQL transactions and preflight snapshots (`src/modules/placements/tpo-bulk-application-stage-service.ts:77-110`)
- Fix: Preserve explicit partial-success atomicity per application or document all-or-nothing change

## G2-15-026-039  [P2] GAP  facet F12  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:625-629 max100 bulk applications
- vNext now: src/modules/placements/tpo-bulk-application-stage-service.ts:27-35 accepts ids array, no global cap shown in this service
- Fix: Enforce 100 bulk limit at entry and meaningful error copy

## G2-15-026-054  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:650-651 bulk failure count text
- vNext now: src/modules/placements/tpo-bulk-application-stage-service.ts:75-135 single stage change return only
- Fix: Render exact bulk result success/partial-error wording
