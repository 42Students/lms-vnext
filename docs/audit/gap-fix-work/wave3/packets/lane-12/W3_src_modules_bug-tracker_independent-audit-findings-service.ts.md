# Work packet (wave 3): edit src/modules/bug-tracker/independent-audit-findings-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u001-tracker-audit-findings.md

## G2-16-001-070  [P0] MISSING  facet F22  effort L
- Legacy: `AuditFindingSyncService.java:31-38`: live tables used by importer and list.
- vNext now: `docs/proposed-migrations/registered-0133/tracker-independent-audit-findings.sql:1-4`; `independent-audit-findings-service.ts:12-13`: proposal unregistered and runtime flag required.
- Fix: Register/test numbered migration and verified activation without touching active DB prematurely; board remains unavailable before that.

## G2-16-001-014  [P1] MISSING  facet F04  effort L
- Legacy: `AuditFindingService.java:65-75`: items include reportedSeverity, roles, environment and duplicateOf; original severity retained.
- vNext now: `independent-audit-findings-service.ts:50-64`; `db10-audit-findings.draft.ts:9-35`: environment, roles and reportedSeverity absent from new record.
- Fix: Add fields to registered migration, Drizzle schema and import mapper; present in table/detail.

## G2-16-001-035  [P1] MISSING  facet F10  effort L
- Legacy: `AuditFindingsService.js:7-24`; `SuperAdminAuditFindingsController.java:43-70`: GET list, GET sync, POST sync.
- vNext now: `page.tsx:44`; `independent-audit-findings-service.ts:20-65`: DB SELECT; sync read only; no POST sync API.
- Fix: Build independent sync endpoint/service with credentials verification, importer and post-sync board reload.

## G2-16-001-037  [P1] MISSING  facet F10  effort L
- Legacy: `AuditFindingSyncService.java:64-75`: scheduled sync five minutes, 60-second initial delay, distributed lock.
- vNext now: `independent-audit-findings-service.ts:12-13,20-22`: DB flag only; no importer invocation/job.
- Fix: Port background sync with lease, head commit/ref and immutable-file ledger, credentials gate.

## G2-16-001-065  [P1] MISSING  facet F21  effort L
- Legacy: `AuditFindingSyncService.java:64-71`; `GitHubFindingsClient` referenced `:48`: GitHub repo poll via scheduled lock.
- vNext now: `independent-audit-findings-service.ts:12-13`: no GitHub client/background sync call.
- Fix: Implement and credential-gate GitHub findings read and five-minute background job.
