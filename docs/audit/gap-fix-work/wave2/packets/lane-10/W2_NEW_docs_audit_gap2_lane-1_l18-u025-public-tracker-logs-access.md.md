# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-1/l18-u025-public-tracker-logs-access.md

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-1/l18-u025-public-tracker-logs-access.md

## G2-18-025-026  [P2] GAP  facet F13  effort M
- Legacy: src/app/api/tracker/issues/route.ts:12-17,30-36 — vNext runtime DB10 readiness gate on issues
- vNext now: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicTrackerLogsAccessController.java:64-85 — old route independent from bug tracker DB
- Fix: Clarify log-alert datastore vs issue readiness independently
