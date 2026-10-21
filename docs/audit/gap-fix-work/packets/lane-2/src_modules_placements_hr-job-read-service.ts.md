# Work packet: edit src/modules/placements/hr-job-read-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/recruiter-drives-jobid.md, docs/audit/gap2/lane-2/l14-u025-recruiter-drive.md

## G2-11-002-087  [P1] GAP  facet F19  effort S
- Legacy: Partial data Promise.allSettled `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:109`
- vNext now: Multiple SQL promises `src/modules/placements/hr-job-read-service.ts:91`
- Fix: Isolate auxiliary failures

## G2-14-025-004  [P1] GAP  facet F01  effort L
- Legacy: RecruiterDriveController.java:117-180 drives/rounds/applicants/pipeline/ZIP/results/slots/selections
- vNext now: src/modules/placements/hr-job-read-service.ts:14-130 and src/modules/placements/hr-round-editor-service.ts:16-115
- Fix: Maintain explicit contract mapping for each named drive action.

## G2-14-025-012  [P1] GAP  facet F04  effort L
- Legacy: RecruiterDriveController.java:46 applicantIds,roleOption,ctcLpa,kind
- vNext now: src/modules/placements/hr-job-read-service.ts:86-130 stage+offer read models
- Fix: Preserve selection candidate IDs, role selection and decimal LPA.

## G2-14-025-060  [P1] GAP  facet F22  effort L
- Legacy: RecruiterDriveController.java:38-47 integer college/job IDs, applicant string IDs
- vNext now: src/modules/placements/hr-job-read-service.ts:14-34 UUID job/company relationships
- Fix: Provide durable legacy ID to scoped UUID migration map.
