# Work packet (wave 2): edit src/modules/placements/learner-historical-drive-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u005-learner-placement-job-detail.md

## G2-15-005-003  [P2] GAP  facet F01  effort M
- Legacy: Legacy invalid numeric jobId displays `This job link isn't valid` and Browse drives (JobDetailContent.jsx:823-841; learnerValidation.js:12-18)
- vNext now: UUID jobId passed into getOwnLearnerDriveJourney/filtered list; notFound when no match (learn/my-placements/jobs/[jobId]/page.tsx:66-74; learner-historical-drive-service.ts:13-15)
- Fix: Accept/redirect validated legacy IDs or render explicit invalid-id help instead of bare 404
