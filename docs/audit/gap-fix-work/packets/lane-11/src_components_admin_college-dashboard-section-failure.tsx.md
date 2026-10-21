# Work packet: edit src/components/admin/college-dashboard-section-failure.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-dashboard.md

## G2-9-005-028  [P2] GAP  facet F07  effort M
- Legacy: Error whole Today overview shows Couldn't load today's overview + Retry (`docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:101-112`)
- vNext now: Per-section failure tiles instead (`src/components/admin/college-dashboard-section-failure.tsx:1-30`)
- Fix: Restore explicit today overview failure and Retry.
