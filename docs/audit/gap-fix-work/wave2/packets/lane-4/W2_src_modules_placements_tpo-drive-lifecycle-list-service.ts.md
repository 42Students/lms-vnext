# Work packet (wave 2): edit src/modules/placements/tpo-drive-lifecycle-list-service.ts

18 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drives-index.md, docs/audit/gap2/lane-16/u031-placements-end-to-end.md, docs/audit/gap2/lane-19/job-auto-expiry-service.md, docs/audit/gap2/lane-3/tpo-drive-controller.md

## G2-11-012-023  [P2] GAP  facet F04  effort M
- Legacy: Summary counts filtered to active season selected in Redux. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:161`
- vNext now: vNext defaults all seasons, explicit season filter only. `src/modules/placements/tpo-drive-lifecycle-list-service.ts:32`
- Fix: Retain selected-season default only if legacy had explicit current context; owner decide all-season change.

## G2-11-012-026  [P2] GAP  facet F04  effort S
- Legacy: No-deadline count excludes recordedOutside. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:174`
- vNext now: New SQL noDeadline counts any PUBLISHED applicationDeadline NULL. `src/modules/placements/tpo-drive-lifecycle-list-service.ts:59`
- Fix: Exclude recordedOutside from no-deadline work shortcut.

## G2-11-012-055  [P2] GAP  facet F10  effort M
- Legacy: GET listDrives and getDriveCounts parallel; errors independent. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:144`
- vNext now: vNext service loads list plus counts/filters in server transactions. `src/modules/placements/tpo-drive-lifecycle-list-service.ts:183`
- Fix: Preserve partial results if aggregate fails.

## G2-11-012-056  [P2] GAP  facet F10  effort M
- Legacy: getTeam fetched for owner names. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:197`
- vNext now: vNext users.createdBy select, not TPO owner faculty relation. `src/modules/placements/tpo-drive-lifecycle-list-service.ts:36`
- Fix: Preserve ownership semantic and staff names.

## G2-11-012-062  [P2] GAP  facet F11  effort M
- Legacy: All college drives with lifecycle-based tabs. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:63`
- vNext now: New list scopes college and non-archived placement jobs. `src/modules/placements/tpo-drive-lifecycle-list-service.ts:197`
- Fix: Check migrated archived/REJECTED history inclusion.

## G2-11-012-089  [P2] GAP  facet F19  effort M
- Legacy: Legacy loads full drives array then filters locally; no server pagination. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:144`
- vNext now: vNext paginates requests and job rows server side. `src/modules/placements/tpo-drive-lifecycle-list-service.ts:114`
- Fix: Keep page totals and selection semantics across pagination.

## G2-11-012-090  [P2] GAP  facet F19  effort M
- Legacy: CountsComplete requires counts for every drive before exposing count-dependent filters. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:219`
- vNext now: New SQL aggregates from DB, no client completeness flag. `src/modules/placements/tpo-drive-lifecycle-list-service.ts:55`
- Fix: Mark counts unknown if any aggregate query failed.

## G2-11-012-096  [P2] GAP  facet F21  effort M
- Legacy: Legacy reads four services, all independent UI state. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:20`
- vNext now: vNext sequential seasons/owners/batches/companies then aggregates. `src/modules/placements/tpo-drive-lifecycle-list-service.ts:28`
- Fix: Batch independent metadata queries, isolate partial errors.

## G2-11-012-101  [P2] GAP  facet F22  effort M
- Legacy: Legacy ownerFacultyId distinct from createdBy. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:110`
- vNext now: New createdByUserId drives Owner/Created by. `src/modules/placements/tpo-drive-lifecycle-list-service.ts:36`
- Fix: Persist or project true drive owner for filter.

## G2-16-031-083  [P2] GAP  facet F19  effort M
- Legacy: tpo/drives/index.js:61-74 stages require separately verified counts rather than infer from stale data.
- vNext now: tpo-drive-lifecycle-list-service.ts:55-85 SQL aggregates per scope then pagination; no client snapshot retention.
- Fix: Add partial data source freshness marker for workload counts to keep unknown from looking like zero.

## G2-19-011-041  [P2] GAP  facet F15  effort M
- Legacy: Legacy jobAutoExpiry separate from TPO deadlineToday reminders `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:33-41` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:38-43`
- vNext now: vNext overdue attention counts separate from applicant notifications `src/modules/placements/tpo-drive-lifecycle-list-service.ts:54-68`
- Fix: Audit reminders separately; no duplicate notifications from expiry.

## G2-19-011-042  [P2] GAP  facet F16  effort M
- Legacy: Legacy back-end scheduler has no responsive layout; active job simply disappears from active list `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:61-63` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:41-61`
- vNext now: vNext overdue PUBLISHED drives still labeled Live on TPO list `src/modules/placements/tpo-drive-lifecycle-list-service.ts:64-65` `src/modules/placements/tpo-drive-lifecycle-list-model.ts:98-108`
- Fix: Add responsive Applications closed badge, not misleading Live status.

## G2-19-011-045  [P2] GAP  facet F17  effort S
- Legacy: Legacy deactivation makes inactive listing disappear, no confusing label `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:59-63` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:41-61`
- vNext now: vNext `Live` label for status PUBLISHED when application deadline overdue `src/modules/placements/tpo-drive-lifecycle-list-model.ts:98-108` `src/modules/placements/tpo-drive-lifecycle-list-service.ts:64-65`
- Fix: Use descriptive Applications closed text on all screens.

## G2-19-011-048  [P2] GAP  facet F19  effort L
- Legacy: Legacy unbounded `findActiveJobsPastApplicationDeadline` loads all matching rows `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:185-188` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:53-59`
- vNext now: vNext TPO listing paginated by pageSize/offset, no sweep in mapped code `src/modules/placements/tpo-drive-lifecycle-list-service.ts:267-301`
- Fix: Use bounded cursor/scheduled batches, not user pageSize.

## G2-3-023-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:25-74`
- vNext now: `src/modules/placements/tpo-drive-lifecycle-list-service.ts:15-101`, `src/app/(authenticated)/tpo/placements/jobs/[jobId]/page.tsx:17-45`
- Fix: Legacy route /api/v1/tpo/drives list and detail vs vNext paged TPO placement lifecycle view. Preserve equivalents and actor scope.

## G2-3-023-009  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:64-69`
- vNext now: `src/modules/placements/tpo-drive-lifecycle-list-service.ts:15-101`
- Fix: Legacy all nondeleted college jobs vs VNext status/season/paged list. Preserve All list semantics and total.

## G2-3-023-028  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoDriveController.java:65-69`
- vNext now: `src/modules/placements/tpo-drive-lifecycle-list-service.ts:15-101`
- Fix: Legacy missing college returns empty list; VNext missing membership produces redirect or permission error. Align safe empty/retry.

## G2-19-011-038  [P3] GAP  facet F14  effort S
- Legacy: Legacy expiry logs summary count but provides no downloadable history `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:64-70`
- vNext now: vNext TPO overdue counts but not specific scheduler history in mapped service `src/modules/placements/tpo-drive-lifecycle-list-service.ts:54-68`
- Fix: Internal run history with count and errors; not a user file requirement.
