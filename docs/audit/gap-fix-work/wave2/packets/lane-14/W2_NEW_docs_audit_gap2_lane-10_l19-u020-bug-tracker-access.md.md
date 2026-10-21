# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-10/l19-u020-bug-tracker-access.md

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-10/l19-u020-bug-tracker-access.md

## G2-19-020-036  [P2] GAP  facet F19  effort M
- Legacy: src/modules/bug-tracker/report-service.ts:23-29 — inserts one access row per new issue even same reporter.
- vNext now: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerService.java:43-52 — reuses existing active reporter identity.
- Fix: Reduce identity churn by reusing authenticated reporter subject.
