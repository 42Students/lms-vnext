# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-7/u009-college-admin-workspace-index.md

3 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u009-college-admin-workspace-index.md

## G2-7-009-003  [P3] GAP  facet F02  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/index.js:28-31: temporary `<div class=ln-module admin-list-page>` with active Skeleton.
- vNext now: V/app/(authenticated)/college/projects/[projectId]/page.tsx:9-13: server redirect without intermediate client screen.
- Fix: If strict visual match desired, use consistent route-loading boundary; prefer fast server redirect where safe.

## G2-7-009-005  [P3] GAP  facet F03  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/index.js:3,30: Ant Skeleton active pulse, 6 paragraph rows.
- vNext now: V/app/(authenticated)/college/projects/[projectId]/page.tsx:9-13: no local Skeleton/icon.
- Fix: Provide six-row skeleton only if route experiences visible transition.

## G2-7-009-016  [P3] GAP  facet F13  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/index.js:28-31: six-line busy Skeleton while client routing.
- vNext now: V/app/(authenticated)/college/projects/[projectId]/page.tsx:8-13: immediate server redirect, no explicit loading UI.
- Fix: Verify slow navigation loading boundary; add if visible latency.
