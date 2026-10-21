# Work packet: edit src/components/projects/project-workspace.tsx (part 3 of 3)

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/superadmin-project-workspace-audit.md, docs/audit/gap2/lane-5/l14-u028-superadmin-workspace-summary.md, docs/audit/gap2/lane-7/u012-college-admin-workspace-readiness.md, docs/audit/gap2/lane-8/l12-u028-superadmin-project-team.md, docs/audit/gap2/lane-3/superadmin-workspace-delivery.md

## G2-4-029-026  [P2] GAP  facet F07  effort S
- Legacy: Workspace summary error warning title `Workspace summary could not be loaded` + Retry workspace (`docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/audit.js:87-95`)
- vNext now: Shared shell does not expose this warning in audit section (`src/components/projects/project-workspace.tsx:316-335`)
- Fix: Keep audit accessible independently when summary lookup fails.

## G2-4-029-029  [P2] GAP  facet F08  effort S
- Legacy: No college selected warning text Pick a college in the header to work with its project workspaces. (`docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/audit.js:53-63`)
- vNext now: Generic admin shell assumes scope before load (`src/components/projects/project-workspace.tsx:316-335`)
- Fix: Display exact warning when no selected college.

## G2-14-028-029  [P2] MISSING  facet F08  effort M
- Legacy: Legacy template attach toast Template attached. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:317-325`
- vNext now: vNext no comparable summary template action. `src/components/projects/project-workspace.tsx:193-207`
- Fix: Show matching attach receipt if control added.

## G2-7-012-026  [P2] GAP  facet F08  effort S
- Legacy: WorkspaceReadinessOverview.jsx:76-105 persistent override alert and empty note
- vNext now: project-workspace.tsx:341-416 no status alert
- Fix: Restore persistent override alert

## G2-12-028-024  [P2] MISSING  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/workspaceRowMeta.jsx:153-162 reconciliation toasts 'Fixed N member rows...' or 'The roster already matches the team.'
- vNext now: src/components/projects/project-workspace.tsx:725-730 no Check roster operation/toasts
- Fix: Add repair success/error toast copy and refresh

## G2-3-029-026  [P3] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceDeliveryOverview.jsx:20-33`
- vNext now: `src/components/projects/project-workspace.tsx:1232-1235`
- Fix: Exact empty guidance Task-level submissions can still be reviewed from the Tasks tab. omitted.

## G2-3-029-027  [P3] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceDeliveryOverview.jsx:134-135`
- vNext now: `src/components/projects/project-workspace.tsx:1345-1356`
- Fix: Legacy absent review prints No mentor feedback has been recorded yet. VNext omits review block entirely.
