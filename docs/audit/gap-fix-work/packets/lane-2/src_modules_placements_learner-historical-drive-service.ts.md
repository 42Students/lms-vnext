# Work packet: edit src/modules/placements/learner-historical-drive-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u005-learner-placement-job-detail.md

## G2-15-005-075  [P1] GAP  facet F22  effort L
- Legacy: Legacy one application/receipt record carries resumeUrl and nextInterview, direct status transitions (JobDetailContent.jsx:320-387,448-481,572-593)
- vNext now: VNext placementApplications per roleOption, no resume snapshot/receipt, requests for withdrawal, rounds in separate tables (learner-placement-jobs.tsx:24-85,247-283; learner-historical-drive-service.ts:16-45)
- Fix: Document application-to-role ID, submission receipt, resume evidence and withdrawal history model, migrations if required
