# Work packet: edit src/db/schema/db06-history-staged.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/grade-audit-log-entity.md, docs/audit/gap2/lane-5/l17-u019-grade-audit-log.md

## G2-17-019-038  [P1] MISSING  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/GradeAuditLog.java:9-46 — grade_audit_log persisted JPA identity + before/after values.
- vNext now: src/db/schema/db06-history-staged.ts:40-150 — Staged grade events richer schema not registered.
- Fix: Promote event table with FK, indexes, CHECK and append-only triggers.

## G2-17-019-043  [P1] MISSING  facet F21  effort M
- Legacy: Legacy JPA GradeAuditLogRepository save. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:1093-1104`
- vNext now: vNext schema source-only, not registered; service uses activityEvents instead. `src/db/schema/db06-history-staged.ts:40-151`
- Fix: Wire Drizzle event table export and numbered migration.

## G2-17-019-044  [P1] GAP  facet F22  effort M
- Legacy: Legacy grade audit numeric IDs, previous/new long/status/action and local time. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/GradeAuditLog.java:14-45`
- vNext now: vNext proposed UUID identity, scores int, full snapshots and occurredAt. `src/db/schema/db06-history-staged.ts:40-85`
- Fix: Migration map and overflow/time precision checks.
