# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/u013-college-admin-workspace-resources.md (part 2 of 2)

4 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u013-college-admin-workspace-resources.md

## G2-7-013-032  [P2] GAP  facet F07  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/resources.js:63-66: project-error modal fallback `Failed to update resources`
- vNext now: V/components/projects/project-resource-controls.tsx:252-257,291-299: inline `Could not add the resource.` or caught message
- Fix: Map failure and stale-save reasons to exact legacy copy

## G2-7-013-033  [P2] GAP  facet F07  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/resources.js:102-119: failed GET `Workspace could not be loaded`+Retry, 404 `Workspace not found`
- vNext now: V/components/projects/admin-project-section-page.tsx:38-47: server aggregate awaited no section alert
- Fix: Add scoped Retry/not found/denied states

## G2-7-013-034  [P2] GAP  facet F08  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/resources.js:46-47,59-60: info `No changes to save`, success `Resources updated`
- vNext now: V/components/projects/project-resource-controls.tsx:245-249,394-403: `Resource added.` and `Project resource updated`
- Fix: Align exact appropriate success/info wording

## G2-7-013-035  [P2] GAP  facet F08  effort M
- Legacy: LFE/components/admin/projects/RepeatingItemEditor.jsx:104-107: after removal `Item removed from this unsaved form. Undo remove`
- vNext now: V/components/projects/project-resource-controls.tsx:415-455: archive confirm and toast, no local undo
- Fix: Restore local undo prior to commit or explicitly document new archive model
