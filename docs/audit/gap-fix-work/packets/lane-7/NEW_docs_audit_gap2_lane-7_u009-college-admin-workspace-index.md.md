# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/u009-college-admin-workspace-index.md

6 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u009-college-admin-workspace-index.md

## G2-7-009-001  [P1] GAP  facet F01  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/index.js:18-26: client router.replace to `.../:workspaceId/summary` preserving ALL non-id query keys.
- vNext now: V/app/(authenticated)/college/projects/[projectId]/page.tsx:3-14: server redirect to `/college/projects/:projectId/summary` dropping ALL original query params.
- Fix: Forward validated query string, especially openTemplate/from/reason, into summary redirect; test deep links.

## G2-7-009-006  [P1] GAP  facet F04  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/index.js:11-13: `openTemplate=1` and `reason=` are expressly retained for Summary.
- vNext now: V/app/(authenticated)/college/projects/[projectId]/page.tsx:8-13: neither query retained.
- Fix: Keep openTemplate and reason parsed and encoded in redirect URL.

## G2-7-009-015  [P1] GAP  facet F12  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/index.js:11-14: Summary consumes from/reason/openTemplate context from all deep links.
- vNext now: V/app/(authenticated)/college/projects/[projectId]/page.tsx:9-13: redirect loses context before destination can consume.
- Fix: Ensure downstream summary action/At-risk context restored from query.

## G2-7-009-024  [P1] GAP  facet F20  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/index.js:20-25: exact `...rest` query object propagated (all unknown non-workspaceId keys).
- vNext now: V/app/(authenticated)/college/projects/[projectId]/page.tsx:8-13: no searchParams prop or query forwarding.
- Fix: Accept searchParams promise, whitelist and encode all supported parameters; preserve page context.

## G2-7-009-028  [P1] GAP  facet F23  effort S
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/index.js:11-13: from= at-risk/submissions, openTemplate=1 state intentionally intact.
- vNext now: V/app/(authenticated)/college/projects/[projectId]/page.tsx:9-13: dropped entirely.
- Fix: Critical: preserve context query to prevent broken attach-template and review-return paths.

## G2-7-009-010  [P2] GAP  facet F07  effort M
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/index.js:19-21: if router isn't ready or workspaceId absent, leaves skeleton.
- vNext now: V/app/(authenticated)/college/projects/[projectId]/page.tsx:8-13: missing/invalid projectId not validated in redirect, sent to summary.
- Fix: Validate required UUID and show scoped 404/error instead of nonsensical route; preserve compatibility slugs.
