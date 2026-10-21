# Work packet: edit src/modules/bug-tracker/readiness.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l19-u020-bug-tracker-access.md, docs/audit/gap2/lane-4/bug-report-model.md

## G2-19-020-027  [P1] GAP  facet F13  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugTrackerAccess.java:27-28 — legacy seeded active accounts accessible to reporting.
- vNext now: src/modules/bug-tracker/readiness.ts:1-8 — vNext routes gated until DB10_TRACKER_READY verified.
- Fix: Ensure migration applied and acceptance tested.

## G2-4-021-001  [P1] GAP  facet F01  effort M
- Legacy: Legacy BugReport JPA entity backs bug tracker report intake and Super Admin issue views. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:10-23`)
- vNext now: New db10BugReports plus report/admin services, guarded by DB10_TRACKER_READY runtime flag. (`src/db/schema/db10-bug-tracker.ts:52-89`; `src/modules/bug-tracker/report-service.ts:18-31`; `src/modules/bug-tracker/readiness.ts:1-13`)
- Fix: Verify migration applied and runtime flag active before claiming equivalent read/write.
