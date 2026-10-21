# Work packet (wave 2): edit src/app/(authenticated)/learn/my-placements/interviews/loading.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/learner-placements-interviews.md

## G2-17-005-027  [P2] GAP  facet F13  effort 
- Legacy: docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:14 active Ant Skeleton with exactly 3 paragraph rows.
- vNext now: src/app/(authenticated)/learn/my-placements/interviews/loading.tsx:3-4 generic GracefulPageLoading shape='directory'.
- Fix: Render legacy three-row skeleton for alias transition or eliminate intermediate content via server redirect.
