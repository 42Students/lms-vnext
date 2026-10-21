# Work packet (wave 2): edit src/components/tracker/independent-finding-actions.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u001-tracker-audit-findings.md

## G2-16-001-034  [P2] GAP  facet F09  effort M
- Legacy: `AuditFindingDrawer.jsx:157-240`: all status, severity, assignee, commit and comment controls simultaneously visible.
- vNext now: `independent-finding-actions.tsx:56-105`: single Action selector with conditional controls and new confirm modal.
- Fix: Use side-by-side live controls and legacy action labels, disable while busy.
