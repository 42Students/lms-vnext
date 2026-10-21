# Work packet (wave 2): edit src/app/api/tracker/audit-findings/[publicId]/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u001-tracker-audit-findings.md

## G2-16-001-036  [P2] GAP  facet F10  effort M
- Legacy: `AuditFindingsService.js:12-36`; `SuperAdminAuditFindingsController.java:72-101`: GET detail; POST status/severity/assignee/comment/commit.
- vNext now: `src/app/api/tracker/audit-findings/[publicId]/route.ts:1-21`: single PATCH with discriminated actions.
- Fix: Maintain equivalent actions, payload semantics, no-store response and full event audit; REST route can differ internally.
