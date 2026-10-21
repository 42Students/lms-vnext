# Work packet: edit src/modules/placements/learner-interview-view-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/learner-placements-interviews.md

## G2-17-005-014  [P1] GAP  facet F06  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:16,67-68 view choices ahead/past/month, initial ahead, shallow router.replace query.
- vNext now: src/modules/placements/learner-interview-view-model.ts:3 and src/components/placements/learner-career-rounds-workspace.tsx:94-96 default view all, values all/upcoming/past/unscheduled.
- Fix: Map old view=ahead\|past\|month links to new view or redirect to Schedule preserving old filter.
