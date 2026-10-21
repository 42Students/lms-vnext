# Work packet (wave 2): edit src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-overview.md

## G2-10-012-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:27-29,101-112 — Selected college from SuperAdminScopeContext; breadcrumb DriveSubNav 'Drives' with tabs Overview, Applications, Schedule, Settings.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:15-31; src/components/placements/placement-drive-workspace.tsx:269-280 — Persisted admin selected college; no matching four-tab DriveSubNav or breadcrumb; PageHeader + Actions.
- Fix: Render breadcrumb and all four precise tabs with active Overview.

## G2-10-012-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/placements/DriveSubNav.jsx:23-60 — ReturnTo passed to tab links, safe jobsRoot breadcrumb click.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:23-31; src/components/placements/placement-drive-workspace.tsx:278-280 — Applications URL hardcoded and no returnTo preservation.
- Fix: Propagate validated returnTo through Overview/Applications/Schedule/Settings and back to Drives.

## G2-10-012-005  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:109-114,139-181 — Tab strip followed by grouped Needs attention warning banner, then drive hero card and Pipeline card.
- vNext now: src/components/placements/placement-drive-workspace.tsx:269-410; src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:23-31 — PageHeader/status strip and pipeline appear before many form/action sections; no drive-specific needs-attention banner.
- Fix: Match legacy screen hierarchy and one canvas: tabs, attention, hero, pipeline.

## G2-10-012-023  [P2] MISSING  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:159-168 — Attention candidate link points to Applications?status=<APPLIED\|INTERVIEW\|OFFERED>.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:29-30; src/components/placements/placement-drive-workspace.tsx:278-280 — Header Applications link has no status filter.
- Fix: Make alert rows actionable using app-stage status deep link.

## G2-10-012-026  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:140-181 — Clicking attention row navigates; loading disables content during both job/attention fetch.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:23-31 — Server page renders after fetch; no alert action/disabled pending behavior.
- Fix: Build links and pending interaction state for attention drill-down.

## G2-10-012-035  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:110-114 — JobsErrorBoundary wraps view and Go Back targets /superadmin/jobs.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:10-31 — Page async error route; no page-local JobsErrorBoundary or equivalent back.
- Fix: Provide local retry/back on render/data failure.

## G2-10-012-050  [P2] MISSING  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:86-87 — Closing soon & low conversion appears with no candidate link/tab.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:23-31 — No closing-soon item on overview.
- Fix: Compute closing-soon boolean and render non-link helper row.

## G2-10-012-059  [P2] MISSING  facet F15  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:140-178 — Attention banner highlights follow-up obligations, no notification action triggered by click itself.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:23-31 — No same follow-up banner; notifications may exist in other workflows.
- Fix: Expose attention deep links without side-effectful notification.

## G2-10-012-069  [P2] MISSING  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/jobs/[jobId]/index.js:16-20,152-167 — Alert says 'Needs attention (N)', groups and labels with exact punctuation.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/page.tsx:23-31; src/components/placements/super-admin-drive-pipeline.tsx:5-29 — No same banner or strings.
- Fix: Copy all four categories and typography exactly.
