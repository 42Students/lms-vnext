# Work packet: edit src/db/schema/index.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/project-meeting-history-entity.md, docs/audit/gap2/lane-3/bug-report-activity.md

## G2-19-017-048  [P1] GAP  facet F21  effort L
- Legacy: Legacy Hibernate JSON mapping and Spring Data repository `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeetingHistory.java:38-48` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectMeetingHistoryRepository.java:13-24`
- vNext now: vNext staged Drizzle JSONB schema is not in active barrel export `src/db/schema/project-audit-staged.ts:19-40` `src/db/schema/index.ts:18-19`
- Fix: Promote typed table and service+DAL handlers under DB07 migration.

## G2-3-021-041  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReportActivity.java:11-37`, `docs/legacy-source/backend/src/main/resources/db/migration/V153__bug_tracker_workflow.sql:13-27`
- vNext now: `src/db/schema/db10-bug-tracker.ts:117-136`, `src/db/schema/index.ts:75-75`
- Fix: Legacy singular bug_report_activity with FK CASCADE vs vNext plural bug_report_activities FK RESTRICT, UUID ids and actor provenance check; migration needs explicit remap and retention policy.
