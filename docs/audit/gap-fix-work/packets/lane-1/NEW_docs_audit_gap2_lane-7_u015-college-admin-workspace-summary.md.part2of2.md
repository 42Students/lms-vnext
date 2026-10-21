# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/u015-college-admin-workspace-summary.md (part 2 of 2)

11 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u015-college-admin-workspace-summary.md

## G2-7-015-072  [P1] MISSING  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:518-537 detailed destructive template warning and checkbox label
- vNext now: V/components/projects/project-workspace.tsx:178-210 none
- Fix: Reproduce exact replacement warning and default reapply behavior

## G2-7-015-077  [P1] GAP  facet F20  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:285-306 rechecks template before auto-opening destructive dialog
- vNext now: V/components/projects/admin-project-section-page.tsx:49-73 lacks openTemplate handling
- Fix: Prevent destructive replacement on stale deep link

## G2-7-015-080  [P1] GAP  facet F22  effort L
- Legacy: LFE/model/ProjectWorkspace.java:19-125 `project_workspace` INT PK, global slug, status VARCHAR40, progress INT, classId, version, fields
- vNext now: V/db/schema/projects.ts:172-264 project_instances UUID, scoped slug, progressPercent, sectionId and updatedAt
- Fix: Field-by-field legacy-to-vNext migration and status mapping required

## G2-7-015-081  [P1] GAP  facet F22  effort L
- Legacy: LFE/dto/projects/ProjectWorkspaceUpdateDTO.java:9-49 scalar fields+detailsToken+classId
- vNext now: V/modules/projects/college-project-summary-model.ts:4-26 all required fields+expectedTitle/summary/status/updatedAt
- Fix: Map optional/touched-update contract and null-clearing semantics

## G2-7-015-083  [P1] GAP  facet F23  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:66-85 status options include READY/BLOCKED/IN_PROGRESS
- vNext now: V/modules/projects/college-project-summary-model.ts:7,27-35 only PLANNED/ACTIVE/COMPLETED
- Fix: Document intentional lifecycle rename? None evidenced; require owner decision before dropping states

## G2-7-015-033  [P2] GAP  facet F07  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:575-579 exact required error `Title is required`
- vNext now: V/components/projects/college-project-summary-editor-full.tsx:40-43 no field-level required error, disables Save
- Fix: Show required error adjacent to title

## G2-7-015-034  [P2] GAP  facet F07  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:665-677 error `End date must be on or after the start date`
- vNext now: V/components/projects/college-project-summary-editor-full.tsx:42-43 `End date must be after start date.`
- Fix: Use legacy inclusive comparison copy

## G2-7-015-037  [P2] GAP  facet F07  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:537-542 error Alert+Retry, not-found
- vNext now: V/components/projects/admin-project-section-page.tsx:38-47 workspace fetch before UI, no scoped retry
- Fix: Restore status-specific error recovery

## G2-7-015-038  [P2] GAP  facet F08  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:354-364 success `Workspace updated`, failure fallback `Failed to update workspace`
- vNext now: V/components/projects/college-project-summary-editor-full.tsx:59-62 closes on save without toast; Banner shows API error
- Fix: Restore exact success toast and failure copy

## G2-7-015-039  [P2] MISSING  facet F08  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:380-389 template success `Template attached`, failure `Failed to attach template`
- vNext now: V/components/projects/project-workspace.tsx:178-210 no attach action
- Fix: Restore action/result toasts

## G2-7-015-040  [P2] GAP  facet F08  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:394-420 `Workspace archived` and `Workspace deleted — it can be restored from Deleted workspaces.`
- vNext now: V/components/projects/project-archive-control.tsx:41-54 toast `Project archived`; no delete result
- Fix: Match archive/delete toast copy
