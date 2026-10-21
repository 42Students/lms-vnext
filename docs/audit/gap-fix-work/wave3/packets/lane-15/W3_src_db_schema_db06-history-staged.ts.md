# Work packet (wave 3): edit src/db/schema/db06-history-staged.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/grade-audit-log-entity.md

## G2-17-019-001  [P1] MISSING  facet F01  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/GradeAuditLog.java:9-19 — Audit log entity captures assignment grading changes.
- vNext now: src/db/schema/db06-history-staged.ts:4-10 — Planned immutable assignment grade events table staged only.
- Fix: Register grade events schema and atomic mutation integration.
