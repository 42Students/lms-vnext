# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-17/grade-audit-log-entity.md

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-17/grade-audit-log-entity.md

## G2-17-019-025  [P2] GAP  facet F12  effort M
- Legacy: docs/planning/database-parity-db06-history-contract.md:59-75 — Source action maps GRADE/REGRADE/PUBLISH_GRADE with actor distinct.
- vNext now: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AssignmentServiceImpl.java:1093-1105 — Legacy UPDATE_POINTS and PUBLISH_GRADE, row actor via gradedBy.
- Fix: Store sourceAction provenance during migration.
