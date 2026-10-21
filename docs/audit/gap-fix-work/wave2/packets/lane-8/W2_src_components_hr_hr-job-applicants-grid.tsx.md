# Work packet (wave 2): edit src/components/hr/hr-job-applicants-grid.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/recruiter-drives-jobid.md

## G2-11-002-025  [P2] GAP  facet F05  effort S
- Legacy: Columns start name/stage then nonempty shared fields `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:522`
- vNext now: Static vNext applicant columns `src/components/hr/hr-job-applicants-grid.tsx:31`
- Fix: Use shared projection column selection
