# Work packet (wave 2): edit src/modules/bug-tracker/tracker-cloud-logs.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/bug-report-model.md

## G2-4-021-019  [P2] GAP  facet F05  effort M
- Legacy: Legacy count by environment and created date range supports log alert correlation. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BugReportRepository.java:15-16`)
- vNext now: New Cloud logs reader joins signature hashes with known alerts, no countByEnvironment primitive in shown service. (`src/modules/bug-tracker/tracker-cloud-logs.ts:45-76`)
- Fix: Preserve per-environment issue count for log alert correlation.

## G2-4-021-049  [P2] GAP  facet F15  effort M
- Legacy: Legacy bug report count by environment/time correlates with logs. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BugReportRepository.java:15-16`)
- vNext now: New cloud logging integration reads redacted errors, correlates Known Error signature, not issue count. (`src/modules/bug-tracker/tracker-cloud-logs.ts:45-76`)
- Fix: Add safe time-window issue count to log alert context.

## G2-4-021-056  [P2] GAP  facet F19  effort S
- Legacy: Legacy environment/time count used for alerts. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/BugReportRepository.java:15-16`)
- vNext now: New indexed environment+createdAt and correlation service exists, count query absent. (`src/db/schema/db10-bug-tracker.ts:95-95`; `src/modules/bug-tracker/tracker-cloud-logs.ts:45-76`)
- Fix: Use index to implement scoped efficient environment count.
