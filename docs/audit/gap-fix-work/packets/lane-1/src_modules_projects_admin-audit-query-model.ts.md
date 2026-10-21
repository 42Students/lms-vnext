# Work packet: edit src/modules/projects/admin-audit-query-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u030-superadmin-project-audit.md

## G2-7-030-002  [P1] GAP  facet F01  effort L
- Legacy: audit/index.js:156-198 URL state status, range, entityId, zero-based page
- vNext now: admin-audit-query-model.ts:31-99 accepts status alias but not range/entityId/page
- Fix: Translate old status enum, range, entityId and page deep links before new query
