# Work packet (wave 3): edit src/modules/projects/mentor-resource-audit-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/l15-u017-project-resource-audit.md

## G2-15-017-010  [P1] MISSING  facet F04  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectResourceAudit.java:42-53 beforeJson/afterJson/changedFields
- vNext now: src/modules/projects/mentor-resource-audit-model.ts:13-20 before/after/delta omitted
- Fix: Store redacted before/after and changed-field delta in audit row

## G2-15-017-049  [P1] MISSING  facet F23  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectResourceAudit.java:42-53 detailed before/after resource history
- vNext now: src/modules/projects/mentor-resource-audit-model.ts:17-20 only projectId and resourceId metadata
- Fix: Add detailed resource snapshots and redact private URLs
