# Work packet (wave 2): edit src/modules/placements/tpo-drive-lifecycle-model.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-job-controller.md, docs/audit/gap2/lane-3/tpo-drive-controller.md, docs/audit/gap2/lane-8/admin-job-service.md, docs/audit/gap2/lane-8/job-lifecycle-service.md

## G2-2-016-016  [P2] GAP  facet F06  effort M
- Legacy: Application deadline derived from importantDates label and rejects past (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:528-544,2145-2182`)
- vNext now: VNext explicit applicationDeadline schema and publish readiness checks (`src/modules/placements/validation.ts:313-388; src/modules/placements/tpo-drive-lifecycle-model.ts:50-58`)
- Fix: Map all important_dates labels and deadline precedence, preserve timezone IST and explicit errors

## G2-3-023-042  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:128-133`
- vNext now: `src/modules/placements/tpo-drive-lifecycle-service.ts:154-234`, `src/modules/placements/tpo-drive-lifecycle-model.ts:3-9`
- Fix: Legacy publish lacks expected-status precondition; VNext CAS should give clear stale-tab recovery and no duplicate notifications.

## G2-8-012-016  [P2] GAP  facet F06  effort M
- Legacy: Application deadline derived from importantDates label and rejects past (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:528-544,2145-2182`)
- vNext now: VNext explicit applicationDeadline schema and publish readiness checks (`src/modules/placements/validation.ts:313-388; src/modules/placements/tpo-drive-lifecycle-model.ts:50-58`)
- Fix: Map all important_dates labels and deadline precedence, preserve timezone IST and explicit errors

## G2-8-011-008  [P2] GAP  facet F04  effort M
- Legacy: isDraft true for REQUEST/SENT_BACK/REJECTED/DRAFT; inactive for CLOSED/CANCELLED (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobLifecycleStatus.java:18-22; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:52-54`)
- vNext now: vNext readiness uses strict status equality without isDraft/isActive (`src/modules/placements/tpo-drive-lifecycle-model.ts:42-46; src/modules/placements/tpo-drive-lifecycle-service.ts:178-196`)
- Fix: Maintain calculated visibility predicates for draft-like and inactive combinations

## G2-8-011-010  [P2] GAP  facet F05  effort M
- Legacy: Legacy state machine allowed mapping is a constant Map<String,Set<String>> (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:18-36`)
- vNext now: new permitted actions hard-coded by expectedStatus and readiness facts (`src/modules/placements/tpo-drive-lifecycle-model.ts:38-65`)
- Fix: Publish canonical allowed transition matrix shared across write endpoints

## G2-8-011-011  [P2] GAP  facet F06  effort M
- Legacy: Initial transition permits only DRAFT or REQUEST (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:40-46`)
- vNext now: new lifecycle action only PUBLISH/CLOSE/REOPEN; DRAFT created through separate create route (`src/modules/placements/tpo-drive-lifecycle-model.ts:3-9; src/modules/placements/tpo-drive-publish-entry-model.ts:3-9`)
- Fix: Map REQUEST creation path separately; enforce initial-state invariant in one place

## G2-8-011-035  [P2] GAP  facet F18  effort S
- Legacy: Legacy exact status uppercase strings REQUEST,SENT_BACK,REJECTED,DRAFT,PUBLISHED,CLOSED,CANCELLED (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobLifecycleStatus.java:9-16`)
- vNext now: vNext action enum uppercase and status expected DRAFT/PUBLISHED/CLOSED (`src/modules/placements/tpo-drive-lifecycle-model.ts:3-9`)
- Fix: Preserve distinct human-readable labels for request and cancellation states

## G2-8-011-036  [P3] GAP  facet F18  effort S
- Legacy: Legacy invalid-transition error text uses from -> to notation (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:47-49`)
- vNext now: vNext stale-status user-facing message requests refresh (`src/modules/placements/tpo-drive-lifecycle-model.ts:68-70`)
- Fix: Keep safe user-oriented copy while preserving diagnostic in audit
