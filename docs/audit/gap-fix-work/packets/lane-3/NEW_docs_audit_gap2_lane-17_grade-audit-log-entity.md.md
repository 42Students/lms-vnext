# Work packet: NEW / MISSING items from docs/audit/gap2/lane-17/grade-audit-log-entity.md

2 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-17/grade-audit-log-entity.md

## G2-17-019-013  [P1] GAP  facet F06  effort M
- Legacy: src/modules/courses/assignment-submission-service.ts:711-745 — Current grading uses validated points and feedback payload.
- vNext now: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:836-854 — Legacy grade update persists grades with audit side write.
- Fix: Require event fields derived from locked DB state, not client.

## G2-17-019-041  [P1] GAP  facet F23  effort M
- Legacy: docs/planning/database-parity-db06-history-contract.md:166-170 — Draft explicitly unregistered until readiness.
- vNext now: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/GradeAuditLogRepository.java:10-11 — Legacy history persisted now.
- Fix: No parity claim until migrations and live tests.
