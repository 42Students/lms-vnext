# Work packet: edit src/modules/projects/admin-insights-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l11-u028-superadmin-deleted-workspaces.md, docs/audit/gap2/lane-7/u029-superadmin-at-risk.md

## G2-11-028-012  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:94-102`
- vNext now: `src/modules/projects/admin-insights-service.ts:141-163`
- Fix: Legacy query returns soft-deleted rows separately, with id/slug/numericId fallback; vNext listing targets projectInstances.status='ARCHIVED' UUID rows, not legacy isDeleted.

## G2-7-029-092  [P1] GAP  facet F22  effort L
- Legacy: adminProjectUtils.js:208-260 project.lastActivityAt and status+blocker+review DTO fields
- vNext now: admin-insights-service.ts:520-558 correlated task/submission/meeting/activity SQL + project_instances.blocker
- Fix: Crosswalk legacy risk reasons/thresholds and newly persisted status fields to schema

## G2-7-029-094  [P1] GAP  facet F22  effort M
- Legacy: superadmin/projects/at-risk/index.js:253-259 severity based on number of risk reasons
- vNext now: admin-insights-service.ts:650-710 projects riskReasons from SQL; risk page displays two-level Risk/Watch
- Fix: Ensure stored/derived severity parity and no risk reason loss
