# Work packet: edit src/modules/placements/learner-waiting-on-you-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u005-learner-placements-home.md

## G2-18-005-026  [P1] GAP  facet F05  effort M
- Legacy: Legacy toConfirm only booked, not confirmed, not TALK, no pending move request. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:65-66`
- vNext now: vNext waiting list built from upcoming assessment/interview plus offer and nextAction. `src/components/placements/learner-placements-dashboard.tsx:63-70`, `src/modules/placements/learner-waiting-on-you-model.ts:1-100`
- Fix: Add booked-but-unconfirmed sessions and suppress pending change requests.

## G2-18-005-054  [P1] GAP  facet F12  effort M
- Legacy: Legacy pending move request suppresses confirm todo. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:65-76`
- vNext now: vNext attention event list doesn't encode move-request pending in dashboard model. `src/modules/placements/learner-dashboard-model.ts:66-106`, `src/modules/placements/learner-waiting-on-you-model.ts:1-100`
- Fix: Feed pending move requests to waiting model to avoid invalid Confirm action.
