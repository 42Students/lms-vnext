# Work packet: edit src/modules/placements/learner-interview-withdrawal-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/learner-placements-interviews.md

## G2-17-005-038  [P1] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:11-14 no network request apart from Next route transition.
- vNext now: src/app/(authenticated)/learn/my-placements/interviews/page.tsx:21-22 duplicates placement workspace read inside getOwnInterviewWithdrawalTargets src/modules/placements/learner-interview-withdrawal-service.ts:14.
- Fix: Avoid double getLearnerPlacementRequestWorkspace query on one route render; pass shared snapshot.
