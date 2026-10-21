# Work packet: edit src/app/api/internal/placements/tpo/withdrawal-escalations/run/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/tpo-scheduled-jobs.md

## G2-17-010-023  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:33-35 — Missing optional schedulerLock bean means unguarded execution.
- vNext now: src/app/api/internal/placements/tpo/withdrawal-escalations/run/route.ts:8-13 — Missing secret results 403; no fail-open.
- Fix: Set required worker secret and actionable 403 deployment diagnostic.
