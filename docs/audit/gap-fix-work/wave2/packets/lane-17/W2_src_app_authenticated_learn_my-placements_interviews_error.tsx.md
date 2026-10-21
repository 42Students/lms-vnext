# Work packet (wave 2): edit src/app/(authenticated)/learn/my-placements/interviews/error.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/learner-placements-interviews.md

## G2-17-005-028  [P2] GAP  facet F13  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:117-119 no learner returns null, data failed warning and 8-row loaded skeleton.
- vNext now: src/app/(authenticated)/learn/my-placements/interviews/page.tsx:19-22 awaits data then src/app/(authenticated)/learn/my-placements/interviews/error.tsx:12-22 separate error boundary.
- Fix: Distinguish auth failure, data failure and loading states with Schedule-equivalent labels.
