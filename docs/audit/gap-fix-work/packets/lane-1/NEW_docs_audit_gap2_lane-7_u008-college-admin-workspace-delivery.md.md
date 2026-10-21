# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/u008-college-admin-workspace-delivery.md

7 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u008-college-admin-workspace-delivery.md

## G2-7-008-005  [P1] GAP  facet F02  effort M
- Legacy: LFE/components/admin/projects/WorkspaceDeliveryOverview.jsx:49-86: hero Card with topline, status tag, four facts, Primary submission area.
- vNext now: V/components/projects/project-workspace.tsx:1238-1345: per-version border-bottom articles with StatusBadge, facts and links.
- Fix: Use one latest-delivery hero card with four facts and primary evidence actions, keeping version history secondary.

## G2-7-008-014  [P1] GAP  facet F04  effort M
- Legacy: LFE/components/admin/projects/WorkspaceDeliveryOverview.jsx:118-135: Reviewed by, Reviewed at, Mentor feedback; missing feedback sentence.
- vNext now: V/components/projects/project-workspace.tsx:1345-1354: feedback and status only; reviewer and reviewed time absent.
- Fix: Join reviewer profile/time and use exact feedback fallback copy.

## G2-7-008-022  [P1] GAP  facet F07  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/delivery.js:50-59: error `Workspace could not be loaded`, Retry; if empty without loading: `Workspace not found`.
- vNext now: V/components/projects/admin-project-section-page.tsx:19-40: service read awaited without page-specific catch; `notFound` only for unsupported section.
- Fix: Map missing project to exact warning, add retriable scoped error state.

## G2-7-008-033  [P1] GAP  facet F12  effort M
- Legacy: LFE/components/admin/projects/WorkspaceDeliveryOverview.jsx:42-45: Revisions value is persisted delivery.revisionCount, em dash if unavailable.
- vNext now: V/components/projects/project-workspace.tsx:1291-1293: revision inferred version-1.
- Fix: Use actual revisionCount not number of submitted versions; independent edits can occur within one version.

## G2-7-008-034  [P1] GAP  facet F12  effort M
- Legacy: LFE/components/admin/projects/WorkspaceDeliveryOverview.jsx:56-58: review state based on delivery.reviewStatus (submitted/under review/accepted/changes requested/locked).
- vNext now: V/components/projects/project-workspace.tsx:1270-1278: submission.status DRAFT/SUBMITTED/CHANGES_REQUESTED/APPROVED.
- Fix: Map legacy review statuses separately from submission lifecycle and preserve color/meaning.

## G2-7-008-023  [P2] GAP  facet F07  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/delivery.js:25-39: no college warning `Admin not assigned to a college` with exact description.
- vNext now: V/components/projects/admin-project-section-page.tsx:24-40: requirement error via requireProjectManageAccess, not same warning.
- Fix: Show no-college warning within workspace tab shell.

## G2-7-008-025  [P3] GAP  facet F08  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/delivery.js:50-59: failed load inline Ant Alert with Retry; no success toast on view.
- vNext now: V/components/projects/admin-project-section-page.tsx:23-40: no inline route-local error alert or toast.
- Fix: Match recoverable inline error rather than generic shared boundary.
