# Work packet: edit src/modules/placements/learner-drive-apply-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u005-learner-placement-job-detail.md

## G2-15-005-049  [P1] GAP  facet F12  effort M
- Legacy: Legacy withdrawn may be eligible for early reapply and displayed notice (JobDetailContent.jsx:1060-1063)
- vNext now: VNext withdrawn record always blocks reapply status badge (learner-placement-jobs.tsx:352-358; learner-drive-apply-model.ts:11)
- Fix: Document early-stage reapply policy and show applicable action or official team appeal
