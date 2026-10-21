# Work packet (wave 2): edit src/modules/bug-tracker/independent-audit-findings-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u001-tracker-audit-findings.md

## G2-16-001-040  [P2] GAP  facet F11  effort S
- Legacy: `SuperAdminAuditFindingsController.java:103-111`: every API enforces super admin, no-store.
- vNext now: `independent-audit-findings-service.ts:15-22`: super admin+unscoped permission; API sends no-store on write.
- Fix: Keep strict server enforcement; document additional platformStatus/adminScope constraints as intentional hardening.

## G2-16-001-060  [P2] GAP  facet F19  effort M
- Legacy: `AuditFindingService.java:62-68`: limit max 200; severity-first order and offset page; status count separately.
- vNext now: `independent-audit-findings-service.ts:50-64`: fixed 50, offset, three aggregate queries.
- Fix: Keep fixed 50 in UI but document API size cap and ensure stable severity/ID order at scale.
