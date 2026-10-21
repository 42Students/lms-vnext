# Work packet (wave 2): edit src/modules/placements/hr-job-read-service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/recruiter-drives-jobid.md, docs/audit/gap2/lane-2/l14-u025-recruiter-drive.md

## G2-11-002-086  [P2] GAP  facet F19  effort S
- Legacy: Offers fetch only when tab mounted `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:486`
- vNext now: Offers fetched in shared server read `src/modules/placements/hr-job-read-service.ts:91`
- Fix: Check freshness/error

## G2-11-002-093  [P2] GAP  facet F22  effort S
- Legacy: Backend endpoint GET offers and separate rounds/slots `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterDriveController.java:75`
- vNext now: JobRead aggregates offer/round data `src/modules/placements/hr-job-read-service.ts:14`
- Fix: Map API parity

## G2-14-025-003  [P2] GAP  facet F01  effort M
- Legacy: RecruiterDriveController.java:74-115 offers/notes/company/team/reports
- vNext now: src/modules/placements/hr-job-read-service.ts:14-130 and src/app/api/placements/recruiter/team/route.ts:1-30
- Fix: Map every offers,notes,company,team,reports endpoint and output envelope.

## G2-14-025-007  [P2] GAP  facet F02  effort M
- Legacy: RecruiterDriveController.java:74-93 offers/notes part of own drive
- vNext now: src/modules/placements/hr-job-read-service.ts:14-130 separate applicant/offer readers
- Fix: Keep Notes,Offers and selection actions reachable within drive detail.

## G2-14-025-030  [P2] GAP  facet F10  effort M
- Legacy: RecruiterDriveController.java:117-128 drive reads and pipeline
- vNext now: src/modules/placements/hr-job-read-service.ts:14-130 SQL scoped stage counts
- Fix: Publish exact read payload mapping.

## G2-14-025-045  [P2] GAP  facet F14  effort M
- Legacy: RecruiterDriveController.java:133-136 only own shared applicant columns in ZIP
- vNext now: src/modules/placements/hr-job-read-service.ts:27-50 company share settings
- Fix: Apply same visibility rules to all exported resumes.

## G2-14-025-058  [P2] GAP  facet F21  effort L
- Legacy: RecruiterDriveController.java:28-34 Access,Work,Messages,Share,Today,Workspace services
- vNext now: src/modules/placements/hr-job-read-service.ts:1-14 specialized read and own grant
- Fix: Document old/new service split for all endpoints.
