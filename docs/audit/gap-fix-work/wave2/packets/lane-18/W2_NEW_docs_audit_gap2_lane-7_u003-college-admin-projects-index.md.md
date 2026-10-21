# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-7/u003-college-admin-projects-index.md

11 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u003-college-admin-projects-index.md

## G2-7-003-001  [P2] GAP  facet F01  effort S
- Legacy: LFE/pages/college-admin/projects/index.js:20-23: `/college-admin/projects` client-replaces to `/college-admin/projects/workspaces` via groupDefaultPath.
- vNext now: V/app/(authenticated)/college/projects/page.tsx:24-34,88-95: `/college/projects` itself renders Workspaces list, no redirect.
- Fix: For exact routing use canonical redirect or preserve this direct-workspaces equivalence deliberately.

## G2-7-003-004  [P2] GAP  facet F02  effort S
- Legacy: LFE/pages/college-admin/projects/index.js:25-29: only one wrapper `ln-module admin-list-page` containing PageSkeleton before navigation.
- vNext now: V/app/(authenticated)/college/projects/page.tsx:36-159: complete heading/filter/list instead of redirect skeleton.
- Fix: If keeping client redirection implement skeleton before destination; if direct rendering, mark state as intentionally removed.

## G2-7-003-006  [P2] GAP  facet F03  effort S
- Legacy: LFE/pages/college-admin/projects/index.js:25-28: PageSkeleton with label `Opening projects`.
- vNext now: V/app/(authenticated)/college/projects/page.tsx:36-53,79-86: ErrorState on load failure/invalid filter, no identical redirect skeleton.
- Fix: Render matching skeleton during navigation or route-loading boundary.

## G2-7-003-008  [P2] GAP  facet F04  effort S
- Legacy: LFE/pages/college-admin/projects/index.js:25-28: transient only: `Opening projects`, no list text.
- vNext now: V/app/(authenticated)/college/projects/page.tsx:38-40: `Workspaces` and no-college state; :48 `Live projects...`.
- Fix: Restore exact opening state label where a redirect/loading placeholder exists.

## G2-7-003-027  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/index.js:27: loading label `Opening projects`.
- vNext now: V/app/(authenticated)/college/projects/page.tsx:38,48: `Workspaces`, not transient `Opening projects`.
- Fix: Match redirect loading label in compatibility route.

## G2-7-003-028  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/index.js:9-15: no heading/subtitle except skeleton, title derived from destination tab Workspaces.
- vNext now: V/app/(authenticated)/college/projects/page.tsx:38-40,48: `Workspaces` heading instead of destination legacy `Project workspaces` when loaded.
- Fix: Match destination h1 under U019 if exact content chrome parity.

## G2-7-003-003  [P3] GAP  facet F01  effort M
- Legacy: LFE/pages/college-admin/projects/index.js:9-15: legacy trimmed URL redirects to first tab; old dashboard intentionally removed.
- vNext now: V/app/(authenticated)/college/projects/page.tsx:24-34: direct Workspaces route is the landing URL with no `/workspaces`.
- Fix: Confirm old `/college-admin/projects` and `/college-admin/projects/workspaces` URLs redirect to `/college/projects` under compatibility routing.

## G2-7-003-012  [P3] GAP  facet F06  effort S
- Legacy: LFE/pages/college-admin/projects/index.js:20-23: only navigation side effect when router.isReady.
- vNext now: V/app/(authenticated)/college/projects/page.tsx:24-34: request starts data processing immediately.
- Fix: No data/filter input should appear during actual redirect/loading state.

## G2-7-003-020  [P3] GAP  facet F12  effort S
- Legacy: LFE/common/adminNavGroups.js:13-15,18-36: groupDefaultPath from nav first item, not hardcoded.
- vNext now: V/components/projects/project-admin-nav.tsx:4-11,25-28: local links hardcoded (Workspaces path suffix empty).
- Fix: Use single shared group metadata for landing and tabs to prevent drift.

## G2-7-003-025  [P3] GAP  facet F16  effort S
- Legacy: LFE/pages/college-admin/projects/index.js:25-29: simple responsive `ln-module admin-list-page` shell and PageSkeleton.
- vNext now: V/app/(authenticated)/college/projects/page.tsx:36-53,79-86: Tailwind min-w-0 space-y4/6 states, shared shell.
- Fix: Confirm page skeleton aligns old shell at mobile/tablet/desktop, if redirect compatibility added.

## G2-7-003-030  [P3] GAP  facet F20  effort S
- Legacy: LFE/pages/college-admin/projects/index.js:20-23: redirect target derived each mount from groupDefaultPath.
- vNext now: V/app/(authenticated)/college/projects/page.tsx:24-34: one server route, no client effect/route replacement.
- Fix: Align breadcrumb/history expectations after direct entry.
