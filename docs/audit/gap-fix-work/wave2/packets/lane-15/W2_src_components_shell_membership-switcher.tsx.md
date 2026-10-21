# Work packet (wave 2): edit src/components/shell/membership-switcher.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/college-org-domain-workspace-scope.md

## G2-3-032-020  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/contexts/SuperAdminScopeContext.js:137-193`
- vNext now: `src/components/shell/membership-switcher.tsx:18-31`
- Fix: Legacy stored last selected college in localStorage only; vNext membership workspaceChoices one item per membership/role.
