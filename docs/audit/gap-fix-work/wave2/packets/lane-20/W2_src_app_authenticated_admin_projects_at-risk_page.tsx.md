# Work packet (wave 2): edit src/app/(authenticated)/admin/projects/at-risk/page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u029-superadmin-at-risk.md

## G2-7-029-002  [P2] GAP  facet F01  effort S
- Legacy: superadmin/projects/at-risk/index.js:324-341 inside SuperAdminGroupShell Projects tab
- vNext now: admin/projects/at-risk/page.tsx:51-56 ProjectAdminAtRiskPage under /admin/projects
- Fix: Keep Projects tab active and support legacy menu route via redirect

## G2-7-029-005  [P2] GAP  facet F01  effort S
- Legacy: superadmin/projects/at-risk/index.js:300-322 no-college warning within shell and loading while scope not loaded
- vNext now: admin/projects/at-risk/page.tsx:31-49 empty state Select a college to continue
- Fix: Match scope-loading skeleton, warning and tab-preserving shell

## G2-7-029-061  [P2] GAP  facet F13  effort M
- Legacy: superadmin/projects/at-risk/index.js:309-318 skeleton while college scope loading
- vNext now: admin/projects/at-risk/page.tsx:34-47 immediate missing college state
- Fix: Add scope-loading placeholder if header selection hydration deferred

## G2-7-029-097  [P2] GAP  facet F23  effort M
- Legacy: superadmin/projects/at-risk/index.js:300-322 SuperAdminGroupShell with scope-loaded skeleton
- vNext now: admin/projects/at-risk/page.tsx:34-47 PageHeader plus EmptyState before selected scope
- Fix: Match loading/selection states and preserve tabs
