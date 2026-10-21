# Work packet (wave 2): edit src/modules/permissions/persisted-actor.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/cross-02-authorization-roles.md

## G2-2-036-042  [P2] GAP  facet F15  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/access/AccessControlService.java:368-450 auditLogger logs allow/deny require*
- vNext now: src/modules/permissions/persisted-actor.ts:42-151 rechecks persisted actors without obvious denial audit emission
- Fix: Emit privacy-safe denial audit events without logging credentials.

## G2-2-036-051  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/access/AccessControlService.java:186-200 per-resource access to learner resolved via repository
- vNext now: src/modules/permissions/persisted-actor.ts:69-126 persisted roles read transactionally
- Fix: Batch permission checks in bulk rosters, avoid N+1.
