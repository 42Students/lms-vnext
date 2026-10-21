# Work packet: edit src/modules/bug-tracker/independent-audit-findings-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u001-tracker-audit-findings.md

## G2-16-001-041  [P1] GAP  facet F12  effort S
- Legacy: `AuditFindingService.java:59-61`: Open excludes 4 closed statuses; Release excludes released/verified and only critical/high.
- vNext now: `independent-audit-findings-service.ts:35-40`; `independent-audit-findings-model.ts:35`: Release includes RELEASED_PROD.
- Fix: Exclude RELEASED_PROD from release blockers view; preserve open view's broader active set.
