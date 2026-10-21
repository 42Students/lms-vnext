# Work packet: edit src/modules/placements/application-deadline-policy.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/job-auto-expiry-service.md

## G2-19-011-001  [P1] GAP  facet F01  effort L
- Legacy: Legacy cron at 01:00 server-time deactivates expired job rows, no UI route `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:14-17` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/JobAutoExpiryService.java:33-41`
- vNext now: vNext learner view computes deadlinePassed per request rather than invoking this worker `src/modules/placements/learner-job-service.ts:257-287` `src/modules/placements/application-deadline-policy.ts:10-14`
- Fix: Record lifecycle choice: persist auto expiry or consistently derive application closure.
