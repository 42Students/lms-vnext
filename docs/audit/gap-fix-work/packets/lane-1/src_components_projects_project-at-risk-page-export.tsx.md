# Work packet: edit src/components/projects/project-at-risk-page-export.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u036-cross-exports-imports.md

## G2-7-036-013  [P1] GAP  facet F04  effort M
- Legacy: superadmin/projects/at-risk/index.js:410-432 five cols Workspace, Mentor, Status, Severity, Risk reasons
- vNext now: project-at-risk-page-export.tsx:12-17 eight cols including ID/Inactive/Blocker/Last activity
- Fix: Restore status and original CSV headers/order
