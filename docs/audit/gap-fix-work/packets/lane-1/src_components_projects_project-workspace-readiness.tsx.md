# Work packet: edit src/components/projects/project-workspace-readiness.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u004-college-admin-projects-readiness.md, docs/audit/gap2/lane-7/u012-college-admin-workspace-readiness.md, docs/audit/gap2/lane-7/u032-superadmin-readiness.md

## G2-7-004-008  [P1] GAP  facet F02  effort L
- Legacy: LFE/pages/college-admin/projects/readiness/index.js:512-721: selected workspace expands Current readiness, Releases, Manual override stacked cards.
- vNext now: V/components/projects/project-admin-readiness-page.tsx:123-146: only Releases inside selector; readiness/form live at `project-workspace-readiness.tsx:43-90`.
- Fix: Integrate detail panel in group page and preserve selected workspace context.

## G2-7-012-064  [P1] GAP  facet F23  effort L
- Legacy: WorkspaceReadinessOverview.jsx:45-105 hero and override facts visible
- vNext now: project-workspace.tsx:341-416 dropped, standalone project-workspace-readiness.tsx:59-89 differs
- Fix: Unify canonical renderer and restore missing facts

## G2-7-032-038  [P2] GAP  facet F08  effort S
- Legacy: readiness/index.js:513 Readiness could not be loaded error Banner
- vNext now: project-workspace-readiness.tsx:21-37 Workspace readiness unavailable ErrorState
- Fix: Match title/placement while retaining safe retry
