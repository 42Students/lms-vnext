# Work packet (wave 2): edit src/modules/projects/learner-project-tab-href-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/learner-project-detail.md

## G2-17-004-033  [P2] GAP  facet F17  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/projects/[projectId].js:10-14 modal state preserved on tab changes, supporting keyboard focus continuity.
- vNext now: src/modules/projects/learner-project-tab-href-model.ts:8-16 drops task dialog taskId on tab switch.
- Fix: Confirm focused task editor cannot disappear without feedback and focus restoration.
