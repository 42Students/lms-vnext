# Work packet (wave 3): edit src/modules/placements/placement-offer-expiry-sweep-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/tpo-scheduled-jobs.md

## G2-17-010-012  [P1] MISSING  facet F02  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:72-73 — Expire overdue offers every 15 min.
- vNext now: src/modules/placements/placement-offer-expiry-sweep-service.ts:11-17 — Service comment explicitly says scheduler invocation outstanding.
- Fix: Schedule 15-min expiry batches plus catch-up for overdue rows.
