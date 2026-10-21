# Work packet (wave 3): edit src/modules/bug-tracker/report-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l19-u020-bug-tracker-access.md

## G2-19-020-044  [P1] MISSING  facet F23  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerService.java:43-48 — trusted existing active reporter selected before issue create.
- vNext now: src/modules/bug-tracker/report-service.ts:12-29 — intentionally creates inactive synthetic reporter row and no issued session.
- Fix: Recover safe reporter enrollment or document approved retirement.
