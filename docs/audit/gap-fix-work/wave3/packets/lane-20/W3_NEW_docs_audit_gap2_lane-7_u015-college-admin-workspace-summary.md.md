# Work packet (wave 3): NEW / MISSING items from docs/audit/gap2/lane-7/u015-college-admin-workspace-summary.md

3 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u015-college-admin-workspace-summary.md

## G2-7-015-036  [P1] MISSING  facet F07  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:522-537 attach requires template `Template is required`, warning replacement behavior
- vNext now: V/components/projects/project-workspace.tsx:178-210,362-416 no template attachment modal
- Fix: Restore attach validation and destructive warning

## G2-7-015-041  [P1] MISSING  facet F09  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:502-537 `Change template` modal: published-only async search, warning, checkbox default checked, Attach
- vNext now: V/components/projects/project-workspace.tsx:178-210 no template dialog on Summary
- Fix: Rebuild filtered template attach dialog and deep link

## G2-7-015-047  [P1] MISSING  facet F10  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:371-390 attachProjectTemplate POST with templateId, collegeId, reapplyDefaults
- vNext now: V/components/projects/project-workspace.tsx:178-210 no equivalent control invoked from Summary
- Fix: Implement tenant-guarded attach and preview destructive impact
