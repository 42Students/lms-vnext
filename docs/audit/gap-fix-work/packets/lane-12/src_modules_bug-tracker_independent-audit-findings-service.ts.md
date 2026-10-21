# Work packet: edit src/modules/bug-tracker/independent-audit-findings-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u001-tracker-audit-findings.md

## G2-16-001-016  [P1] GAP  facet F05  effort S
- Legacy: `AuditFindingService.java:65-68`: severity priority CRITICAL > HIGH > MEDIUM > LOW, then newest foundAt, ID.
- vNext now: `independent-audit-findings-service.ts:52-54`: newest foundAt, importedAt, ID, severity ignored.
- Fix: Order by CASE severity priority ascending, foundAt descending, externalId ascending.

## G2-16-001-018  [P1] GAP  facet F05  effort M
- Legacy: `AuditFindingService.java:51-54`: exact multi-valued `IN` area, status, severity, kind.
- vNext now: `independent-audit-findings-service.ts:33-38`: `area` is a fuzzy substring and only single free text.
- Fix: Use 23 allowlisted areas, multiselect and SQL `IN` exact matching; preserve multiple area filters in query model.

## G2-16-001-019  [P1] GAP  facet F05  effort M
- Legacy: `AuditFindingService.java:79-91`: counts across all findings (global byStatus and openBySeverity).
- vNext now: `independent-audit-findings-service.ts:41-63`: facet counts restricted to current search/area/kind/view.
- Fix: Match global summary counts independent of current filter, and preserve intended chip click semantics.

## G2-16-001-041  [P1] GAP  facet F12  effort S
- Legacy: `AuditFindingService.java:59-61`: Open excludes 4 closed statuses; Release excludes released/verified and only critical/high.
- vNext now: `independent-audit-findings-service.ts:35-40`; `independent-audit-findings-model.ts:35`: Release includes RELEASED_PROD.
- Fix: Exclude RELEASED_PROD from release blockers view; preserve open view's broader active set.

## G2-16-001-051  [P1] GAP  facet F15  effort L
- Legacy: `AuditFindingSyncService.java:211-238,253-258`: import and agent changes append event rows; no mail send in reviewed closure.
- vNext now: `independent-audit-findings-service.ts:75-120`: person mutations append events; importer events absent.
- Fix: Write imported/agent/tampered/deleted events on every relevant sync; no email unless additional legacy source proves it.
