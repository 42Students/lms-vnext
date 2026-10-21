# Work packet (wave 2): edit src/lib/background-job.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u032-cross05-scheduled-jobs.md

## G2-5-032-010  [P2] GAP  facet F04  effort M
- Legacy: Legacy poll limits max5 alerts, max4 pages per tick. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogAlertingService.java:45-56`
- vNext now: vNext background job generic retry wrapper has no alert count snapshot. `src/lib/background-job.ts:15-35`
- Fix: Port source-specific rate/batch settings.

## G2-5-032-056  [P2] GAP  facet F19  effort M
- Legacy: Legacy error poll max5 alert, 4 pages per2min. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LogAlertingService.java:45-56`
- vNext now: vNext generic wrapper retries callback only, no paged polling. `src/lib/background-job.ts:15-35`
- Fix: Port per-poll caps and dedupe.
