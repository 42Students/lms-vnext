# Work packet (wave 2): edit src/db/schema/db06-history-staged.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/grade-audit-log-entity.md

## G2-17-019-005  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/GradeAuditLog.java:18-44 — Attributes gradedBy, previous/new points, statuses, action, createdAt.
- vNext now: src/db/schema/db06-history-staged.ts:40-85 — Staged table adds actor membership/role and publication state.
- Fix: Show actor, exact before/after values and action in audit UI.

## G2-17-019-007  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/GradeAuditLog.java:14-44 — BIGINT id, int assignment+actor, BIGINT points, varchar statuses, action and naive timestamp.
- vNext now: src/db/schema/db06-history-staged.ts:40-85 — UUID/normalized user membership, integer points, timezone-aware time.
- Fix: Backfill identifiers and timestamps without losing precision.

## G2-17-019-009  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:836-854 — Manual grade action UPDATE_POINTS.
- vNext now: src/db/schema/db06-history-staged.ts:130-131 — Staged action REGRADE or GRADE, not UPDATE_POINTS.
- Fix: Map legacy action names to normalized provenance.

## G2-17-019-011  [P2] MISSING  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/GradeAuditLog.java:18-44 — Rows key on studentAssignmentId; no paging in entity.
- vNext now: src/db/schema/db06-history-staged.ts:40-85 — No active grade history list until promoted.
- Fix: Offer bounded paginated audit history per submission.

## G2-17-019-012  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/GradeAuditLog.java:42-45 — PrePersist assigns current server-local time.
- vNext now: src/db/schema/db06-history-staged.ts:40-85 — occurredAt DB timestamp with timezone.
- Fix: Normalize IST/server-local timestamp to UTC for migrations.

## G2-17-019-026  [P2] MISSING  facet F13  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/GradeAuditLogRepository.java:11 — No audit entries returns empty list.
- vNext now: src/db/schema/db06-history-staged.ts:4-10 — Active history table intentionally unavailable.
- Fix: Differentiate never-graded empty history from disabled audit.

## G2-17-019-032  [P2] GAP  facet F18  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:1093-1105 — Action strings UPDATE_POINTS, PUBLISH_GRADE.
- vNext now: src/db/schema/db06-history-staged.ts:130-131 — New source action labels GRADE, REGRADE, PUBLISH_GRADE.
- Fix: Translate action labels in history table and audit UI.

## G2-17-019-034  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/GradeAuditLogRepository.java:11 — Single assignment lookup sorted newest-first.
- vNext now: src/db/schema/db06-history-staged.ts:109-118 — Future indexed submission/time and actor/time lookups.
- Fix: Register indexes and paginate large audit streams.
