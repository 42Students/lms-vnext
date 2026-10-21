# Work packet (wave 2): edit src/app/(authenticated)/learn/projects/[projectId]/page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/learner-project-detail.md

## G2-17-004-005  [P2] GAP  facet F02  effort 
- Legacy: docs/legacy-source/frontend/src/components/Projects/ProjectsShell.jsx:44-51 PageShell integrates title/subtitle, actions and tab navigation in one region.
- vNext now: src/app/(authenticated)/learn/projects/[projectId]/page.tsx:138-145 renders page header only for audit, tabs at :139, final-delivery button separately.
- Fix: Match legacy PageShell heading/subheading/action alignment on all detail tabs.

## G2-17-004-023  [P2] GAP  facet F11  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/projects/[projectId].js:9-14 reads loginUser and produces 'anonymous' account key when missing via docs/legacy-source/frontend/src/utils/accountScopeKey.js:6-8.
- vNext now: src/app/(authenticated)/learn/projects/[projectId]/page.tsx:38-68 uses server request context and redirects non-learner to /learn/projects.
- Fix: Verify anonymous/session-expired access state is intentional and avoids blank/flickering detail.

## G2-17-004-031  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/components/Projects/ProjectsShell.jsx:43-53 wraps PageShell in scroll-container learn-projects, old styles in legacy frontend Project scss.
- vNext now: src/app/(authenticated)/learn/projects/[projectId]/page.tsx:136-203 uses Tailwind min-w-0 space-y-6 and per-tab card layout.
- Fix: Match legacy container width/gutters, tab wrapping and sticky controls by breakpoints.

## G2-17-004-036  [P2] GAP  facet F19  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/projects/[projectId].js:10-14 client detail stays mounted across tab changes, potentially reuses same fetched workspace.
- vNext now: src/modules/projects/workspace-view-service.ts:33-67 invokes eight server reads per page; src/app/(authenticated)/learn/projects/[projectId]/page.tsx:105-114 adds tab-specific reads.
- Fix: Instrument tab-switch request count and avoid redundant full workspace aggregation when changing filter/query.
