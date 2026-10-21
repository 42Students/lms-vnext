# Work packet: edit src/components/projects/project-archive-control.tsx

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-projects-workspaces.md, docs/audit/gap2/lane-3/l11-u028-superadmin-deleted-workspaces.md, docs/audit/gap2/lane-5/l14-u028-superadmin-workspace-summary.md, docs/audit/gap2/lane-7/u019-college-admin-project-workspaces-list.md

## G2-10-028-034  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:188-200 and docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectController.java:555-570 — POST /api/v1/admin/projects/:id/archive with collegeId query.
- vNext now: src/components/projects/project-archive-control.tsx:29-47 — POST /api/projects/:id/archive with expectedUpdatedAt body.
- Fix: Compare side effects and preserve new CAS guard.

## G2-11-028-036  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectController.java:581-630`
- vNext now: `src/components/projects/project-archive-control.tsx:109-133`
- Fix: Legacy delete and archive are separate lifecycle endpoints; vNext UI exposes only Archive and Restore, no recoverable DELETE call.

## G2-11-028-042  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:117-122`
- vNext now: `src/components/projects/project-archive-control.tsx:90-101`
- Fix: Legacy restore rebuilds tasks/sprints/resources from template (specific edits unrecoverable), vNext archive preserves all edited content, meaning deleted and archived are not synonymous.

## G2-14-028-032  [P1] GAP  facet F09  effort M
- Legacy: Legacy Archive and soft Delete Popconfirm separately. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:422-448`
- vNext now: vNext archive and restore dialogs but no delete action. `src/components/projects/project-archive-control.tsx:81-96`
- Fix: Preserve soft-delete confirmation and restoration path.

## G2-14-028-036  [P1] GAP  facet F10  effort M
- Legacy: Legacy archiveProject/deleteProject two distinct actions. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:333-357`
- vNext now: vNext archive/restore endpoint; soft delete not exposed here. `src/components/projects/project-archive-control.tsx:29-75`
- Fix: Restore deleted workspace lifecycle and navigation.

## G2-14-028-066  [P1] GAP  facet F23  effort M
- Legacy: Legacy soft Delete allows restore from Deleted workspaces. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:422-448`
- vNext now: vNext Restore refers to ARCHIVED rather than deleted path. `src/components/projects/project-archive-control.tsx:81-96`
- Fix: Do not conflate archive/restore with delete/restore.

## G2-10-028-027  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:197-199 — Failed to archive workspace via error modal.
- vNext now: src/components/projects/project-archive-control.tsx:48-53 — Could not archive project, stale-update assumption.
- Fix: Differentiate network, forbidden, CAS failures.

## G2-10-028-030  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:304-319 — Archive this workspace? / remains accessible for review.
- vNext now: src/components/projects/project-archive-control.tsx:116-132 — Archive project? / execution mutations blocked.
- Fix: Match confirmation text.

## G2-11-028-024  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:86-89`
- vNext now: `src/components/projects/project-archive-control.tsx:72-76`
- Fix: Legacy restore error showProjectError with fallback Failed to restore workspace; vNext toast same fallback but has no dedicated deleted-directory context.

## G2-11-028-027  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:72-75`
- vNext now: `src/components/projects/project-archive-control.tsx:71-75`
- Fix: Legacy specific warning Workspace restored, but its mentor could not be recovered — assign one to reactivate it. missing in vNext because no mentor blocks restore.

## G2-14-028-030  [P2] GAP  facet F08  effort M
- Legacy: Legacy archive Workspace archived, delete says restore from Deleted workspaces. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:335-354`
- vNext now: vNext Project archived / Workspace restored; no delete receipt. `src/components/projects/project-archive-control.tsx:35-46,81-96`
- Fix: Match archive/delete success copy.

## G2-7-019-038  [P2] GAP  facet F07  effort S
- Legacy: workspaces/index.js:193 `showProjectError(... Failed to archive workspace)`
- vNext now: project-archive-control.tsx:48-53 fixed `Could not archive project`
- Fix: Preserve backend-safe cause and legacy fallback message.

## G2-7-019-040  [P2] GAP  facet F08  effort S
- Legacy: workspaces/index.js:187-189 success toast `Workspace archived`
- vNext now: project-archive-control.tsx:41-46 success `Project archived` with description
- Fix: Use exact toast title `Workspace archived` and align duration/position by shared toast policy.

## G2-7-019-041  [P2] GAP  facet F08  effort S
- Legacy: workspaces/index.js:293-297 Popconfirm `Archive this workspace?` with description
- vNext now: project-archive-control.tsx:119-131 `Archive project?` and longer text
- Fix: Align title, description, affirmative label and danger affordance.

## G2-10-028-029  [P3] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:192-196 — Workspace archived toast.
- vNext now: src/components/projects/project-archive-control.tsx:40-46 — Project archived plus description.
- Fix: Match success toast exact title.
