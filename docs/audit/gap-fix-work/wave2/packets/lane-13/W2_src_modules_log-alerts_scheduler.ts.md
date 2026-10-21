# Work packet (wave 2): edit src/modules/log-alerts/scheduler.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l15-u018-log-alert-signature.md, docs/audit/gap2/lane-14/u018-log-alert-state.md, docs/audit/gap2/lane-4/l12-u024-superadmin-logs-controller.md

## G2-15-018-024  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LogAlertSignature.java:68-70 — regressedAt indicates fixed recurrence.
- vNext now: src/modules/log-alerts/reporter.ts:13-14 and src/modules/log-alerts/scheduler.ts:112-129 — reopenRegressedSignature and delayed regression notification.
- Fix: Verify status transition/FIXED regression reconciliation with old poller.

## G2-14-018-013  [P2] GAP  facet F06  effort S
- Legacy: Legacy null cursor allowed initial bootstrap `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LogAlertState.java:26-27` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogAlertingService.java:94-105`
- vNext now: New poll cursor nullable and first-run 10-minute lookback `src/db/schema/db10-log-alerts.draft.ts:103-105` `src/modules/log-alerts/scheduler.ts:180-195`
- Fix: Align first-poll lookback; avoid alerting historical errors

## G2-14-018-021  [P2] GAP  facet F10  effort S
- Legacy: Legacy poll writes only pollCursorAt via column-specific UPDATE `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/LogAlertStateRepository.java:18-25`
- vNext now: New scheduler updates cursor and pagination fields in one DB query `src/modules/log-alerts/scheduler.ts:255-266`
- Fix: Keep admin viewed state untouched when advancing cursor

## G2-14-018-027  [P2] GAP  facet F12  effort S
- Legacy: Legacy first poll no cursor looks back bounded initial interval `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogAlertingService.java:41-57` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogAlertingService.java:94-105`
- vNext now: New defaults 10-minute bounded lookback `src/modules/log-alerts/scheduler.ts:180-195`
- Fix: Compare exact initial lookback minutes in legacy constants

## G2-14-018-032  [P2] GAP  facet F13  effort M
- Legacy: Legacy off-cluster fallback process start time for health `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogAlertAdminService.java:61-73`
- vNext now: New scheduler health state and leases differ `src/modules/log-alerts/scheduler.ts:23-46`
- Fix: Keep accurate deployment health context separate from alert state

## G2-14-018-047  [P2] GAP  facet F20  effort M
- Legacy: Legacy default environment PRODUCTION when alert env missing `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogAlertingService.java:78-82`
- vNext now: New scheduler state keyed PRODUCTION_ERROR_POLL regardless tenant `src/modules/log-alerts/scheduler.ts:203-213`
- Fix: Separate key by environment when multiple deployments share DB

## G2-12-024-039  [P2] GAP  facet F21  effort M
- Legacy: Legacy LogDigestService + Telegram alert pipeline `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:41-42`
- vNext now: New scheduled lease and manual Telegram `src/modules/log-alerts/scheduler.ts:49-69`; `src/modules/log-alerts/manual-ops.ts:37-51`
- Fix: Trace scheduled jobs to ensure equivalent digest dispatch.
