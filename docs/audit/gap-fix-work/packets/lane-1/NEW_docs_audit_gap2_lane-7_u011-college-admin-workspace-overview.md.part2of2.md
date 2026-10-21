# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/u011-college-admin-workspace-overview.md (part 2 of 2)

3 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u011-college-admin-workspace-overview.md

## G2-7-011-035  [P2] MISSING  facet F08  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:108-109: success toast exactly `Overview updated`.
- vNext now: V/components/projects/workspace-brief-editor.tsx:28-32: silent close and router.refresh, no success toast.
- Fix: Show `Overview updated` after successful PATCH.

## G2-7-011-036  [P2] GAP  facet F08  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:110-114: failure shown via project error modal.
- vNext now: V/components/projects/workspace-brief-editor.tsx:59-60: inline error and confirm dialog component.
- Fix: Keep precise inline field errors but restore actionable conflict/modal feedback.

## G2-7-011-034  [P3] MISSING  facet F08  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/overview.js:86-88: untouched submit `No changes to save` info toast.
- vNext now: V/components/projects/workspace-brief-editor.tsx:20-34: no untouched toast.
- Fix: Add identical untouched-save info toast.
