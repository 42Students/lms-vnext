# Work packet: edit src/modules/placements/learner-interview-deeplink-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/learner-placements-interviews.md

## G2-17-005-042  [P1] GAP  facet F22  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:24-30 maps legacy numeric IDs with prefix iv- and nonstandard assessment/test IDs.
- vNext now: src/modules/placements/learner-interview-deeplink-model.ts:4-9 requires UUID applicationId/roundId for deep-link focus.
- Fix: Translate or discard legacy iv-/test- bookmark references intentionally; do not expose 404 for previously valid old moved links.
