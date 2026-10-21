# Work packet (wave 2): edit src/modules/placements/tpo-drive-lifecycle-service.ts

21 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u015-job-lifecycle-status.md, docs/audit/gap2/lane-2/admin-job-controller.md, docs/audit/gap2/lane-3/tpo-drive-controller.md, docs/audit/gap2/lane-8/admin-job-service.md, docs/audit/gap2/lane-8/job-lifecycle-service.md

## G2-14-015-031  [P2] GAP  facet F12  effort M
- Legacy: Legacy same-status transition allowed without side-effect restriction `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:47-55`
- vNext now: New expectedStatus and state blocker can reject same action `src/modules/placements/tpo-drive-lifecycle-service.ts:172-197`
- Fix: Specify idempotent behavior for duplicate lifecycle commands

## G2-14-015-032  [P2] GAP  facet F13  effort S
- Legacy: Legacy invalid state throws IllegalStateException `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:39-50`
- vNext now: New backend throws PlacementsServiceError READ_ONLY on stale/blocked `src/modules/placements/tpo-drive-lifecycle-service.ts:178-185`
- Fix: Provide well-defined conflict/retry screen and message

## G2-14-015-044  [P2] GAP  facet F20  effort M
- Legacy: Legacy same-status transition resets flags from status `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:47-55`
- vNext now: New CAS expectedStatus and updatedAt timestamp `src/modules/placements/tpo-drive-lifecycle-service.ts:172-197`
- Fix: Document repair/replay semantics for repeated state call

## G2-2-016-005  [P2] GAP  facet F03  effort M
- Legacy: Bulk job status API provides updated/skipped counts (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:253-290`)
- vNext now: VNext separate visibility and drive lifecycle controls (`src/modules/placements/tpo-drive-lifecycle-service.ts:122-148; src/modules/placements/job-service.ts:616-735`)
- Fix: Display bulk count and skipped IDs with exact per-row outcomes

## G2-2-016-009  [P2] GAP  facet F04  effort M
- Legacy: Status list draft active closed from isDraft and isActive booleans (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:202-207`)
- vNext now: VNext primary status DRAFT/PUBLISHED/CLOSED/CANCELLED (`src/modules/placements/tpo-drive-lifecycle-service.ts:178-197`)
- Fix: Map old boolean statuses including REQUEST and soft delete, preserve chip semantics

## G2-3-023-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:93-182`
- vNext now: `src/modules/placements/job-service.ts:150-272`, `src/modules/placements/tpo-drive-lifecycle-service.ts:154-234`
- Fix: Legacy twelve CRUD/lifecycle actions under one controller now split across job, request, lifecycle and deadline routes. Add routing parity matrix.

## G2-3-023-010  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:122-125`
- vNext now: `src/modules/placements/tpo-drive-lifecycle-service.ts:60-119`
- Fix: Legacy rounds endpoint returns full JobRound list, while vNext publish readiness counts rounds; keep ordered round detail accessible.

## G2-3-023-027  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:169-182`
- vNext now: `src/modules/placements/tpo-drive-lifecycle-service.ts:38-49`, `src/modules/placements/tpo-drive-deadline-service.ts:38-55`
- Fix: VNext close after season end allowed, extension requires active season; document legacy-to-new state constraints.

## G2-3-023-042  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:128-133`
- vNext now: `src/modules/placements/tpo-drive-lifecycle-service.ts:154-234`, `src/modules/placements/tpo-drive-lifecycle-model.ts:3-9`
- Fix: Legacy publish lacks expected-status precondition; VNext CAS should give clear stale-tab recovery and no duplicate notifications.

## G2-3-023-044  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:93-182`
- vNext now: `src/modules/placements/job-service.ts:150-765`, `src/modules/placements/tpo-drive-lifecycle-service.ts:154-234`
- Fix: Ensure activity/outbox events from each VNext lifecycle action cover legacy audit/notification event set.

## G2-8-012-005  [P2] GAP  facet F03  effort M
- Legacy: Bulk job status API provides updated/skipped counts (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:253-290`)
- vNext now: VNext separate visibility and drive lifecycle controls (`src/modules/placements/tpo-drive-lifecycle-service.ts:122-148; src/modules/placements/job-service.ts:616-735`)
- Fix: Display bulk count and skipped IDs with exact per-row outcomes

## G2-8-012-009  [P2] GAP  facet F04  effort M
- Legacy: Status list draft active closed from isDraft and isActive booleans (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:202-207`)
- vNext now: VNext primary status DRAFT/PUBLISHED/CLOSED/CANCELLED (`src/modules/placements/tpo-drive-lifecycle-service.ts:178-197`)
- Fix: Map old boolean statuses including REQUEST and soft delete, preserve chip semantics

## G2-8-011-006  [P2] GAP  facet F03  effort M
- Legacy: Legacy inactive/draft flags used as downstream visibility chips (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobLifecycleStatus.java:18-22; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:52-55`)
- vNext now: new primary job status used directly for chips, not coupled booleans (`src/modules/placements/tpo-drive-lifecycle-service.ts:186-197`)
- Fix: Use canonical status for all visibility/read-model derivations and review old legacy query compatibility

## G2-8-011-007  [P2] GAP  facet F04  effort M
- Legacy: Legacy persisted lifecycleStatus string, isDraft boolean, isActive boolean (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:52-55; docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:119-125,286-291`)
- vNext now: vNext persists one status plus publishedAt and closedAt (`src/modules/placements/tpo-drive-lifecycle-service.ts:186-196`)
- Fix: Document mapping for all old status-flag combinations, avoid ambiguous CLOSED/CANCELLED read state

## G2-8-011-008  [P2] GAP  facet F04  effort M
- Legacy: isDraft true for REQUEST/SENT_BACK/REJECTED/DRAFT; inactive for CLOSED/CANCELLED (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/tpo/JobLifecycleStatus.java:18-22; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:52-54`)
- vNext now: vNext readiness uses strict status equality without isDraft/isActive (`src/modules/placements/tpo-drive-lifecycle-model.ts:42-46; src/modules/placements/tpo-drive-lifecycle-service.ts:178-196`)
- Fix: Maintain calculated visibility predicates for draft-like and inactive combinations

## G2-8-011-013  [P2] GAP  facet F06  effort M
- Legacy: Same-state transition allowed (current.equals(newStatus) bypasses ALLOWED) (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:47-49`)
- vNext now: vNext actions require expected state and produce action-specific next state; repeated action rejected (`src/modules/placements/tpo-drive-lifecycle-service.ts:178-197`)
- Fix: Decide idempotent same-state request behavior and retries; prevent double notifications

## G2-8-011-020  [P2] GAP  facet F10  effort M
- Legacy: Job.lifecycleStatus sole authorized writer as documented (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:10-14`)
- vNext now: vNext lifecycle service writes published/closed; separate cancel service also writes CANCELLED (`src/modules/placements/tpo-drive-lifecycle-service.ts:186-196; src/modules/placements/tpo-drive-cancel-service.ts:82-100`)
- Fix: Centralize cross-service transition invariant or share narrow mutation policy

## G2-8-011-030  [P2] GAP  facet F13  effort M
- Legacy: Legacy new unsaved job treated current null if job.getId()==0 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:40-46`)
- vNext now: vNext create request separate, persisted UUID expected when mutation occurs (`src/modules/placements/tpo-drive-lifecycle-service.ts:164-177`)
- Fix: Test initial create and null ID behavior separately rather than faking PUBLISHED default

## G2-8-011-039  [P2] GAP  facet F20  effort S
- Legacy: Legacy same-state calls can reassign flags even without lifecycle change (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:47-55`)
- vNext now: new update conditional on expected status, repeat published action cannot pass fromStatus draft (`src/modules/placements/tpo-drive-lifecycle-service.ts:178-197`)
- Fix: Document idempotence and retry contract for network timeouts

## G2-8-011-041  [P2] GAP  facet F22  effort M
- Legacy: Legacy Job has lifecycleStatus plus isDraft/isActive mirrored fields (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:119-125,286-291; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobLifecycleService.java:52-55`)
- vNext now: vNext placementJobs stores status/publishedAt/closedAt; no isDraft mirror (`src/modules/placements/tpo-drive-lifecycle-service.ts:186-196`)
- Fix: Map old triples to one state preserving request/closed/cancelled outcome

## G2-8-011-042  [P2] GAP  facet F22  effort M
- Legacy: Legacy @PrePersist/@PreUpdate reconciles flags if legacy mutation bypasses lifecycle (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:382-410`)
- vNext now: new DB update scoped to explicit status+timestamps with atomic check (`src/modules/placements/tpo-drive-lifecycle-service.ts:174-196`)
- Fix: Audit every status writer and prevent direct unsafe updates
