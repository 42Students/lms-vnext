# Work packet (wave 2): edit src/app/(authenticated)/learn/projects/[projectId]/error.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/learner-project-detail.md

## G2-17-004-027  [P2] GAP  facet F13  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/projects/[projectId].js:5 child source missing; old request retry/offline states unknown.
- vNext now: src/app/(authenticated)/learn/projects/[projectId]/error.tsx:12-19 'We couldn't load this project's activity' with Retry and Back to Projects for all route errors.
- Fix: Use project-specific generic error for non-activity failures; reserve activity wording for activity tab.
