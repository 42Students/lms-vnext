# Work packet: edit src/modules/log-alerts/scheduler.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/u018-log-alert-state.md

## G2-14-018-028  [P1] GAP  facet F12  effort M
- Legacy: Legacy max 5 individual alerts and four pages per poll `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogAlertingService.java:43-56` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogAlertingService.java:132-171`
- vNext now: New burst cap five per minute and one page of 12 per tick `src/modules/log-alerts/scheduler.ts:200-266`
- Fix: Compare backlog draining and spike summary capacity under bursts

## G2-14-018-041  [P1] GAP  facet F19  effort M
- Legacy: Legacy 2-minute fixedDelay poll initial delay1min and distributed lock5min `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogAlertingService.java:85-93`
- vNext now: New scheduled job tick via lease and provider gate `src/modules/log-alerts/scheduler.ts:203-213` `src/modules/log-alerts/scheduler.ts:288-305`
- Fix: Specify timer cadence and failover bound with deployed cron

## G2-14-018-042  [P1] GAP  facet F19  effort M
- Legacy: Legacy max four pages fifty entries each per poll `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogAlertingService.java:49-56` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogAlertingService.java:195-239`
- vNext now: New limits 12 events one page per tick `src/modules/log-alerts/scheduler.ts:217-224`
- Fix: Define expected backlog throughput and truncation policy

## G2-14-018-046  [P1] GAP  facet F20  effort M
- Legacy: Legacy cursor advancement oldest processed when pagination cap reached `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogAlertingService.java:169-173`
- vNext now: New stores pageToken/window then commits cursor only at end `src/modules/log-alerts/scheduler.ts:229-266`
- Fix: Verify no skipped equal-timestamp entries with >12 and token expiry
