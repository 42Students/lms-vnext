# Work packet (wave 3): NEW / MISSING items from docs/audit/gap2/lane-7/u017-college-admin-workspace-team.md

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u017-college-admin-workspace-team.md

## G2-7-017-046  [P1] MISSING  facet F10  effort L
- Legacy: LFE/components/admin/projects/workspaceRowMeta.jsx:147-175 reconcileProjectTeam POST Check roster, only for teamGroupId
- vNext now: V/components/projects/project-workspace.tsx:725-730 displays group note but no reconcile mutation
- Fix: Expose scoped group roster reconciliation endpoint and button
