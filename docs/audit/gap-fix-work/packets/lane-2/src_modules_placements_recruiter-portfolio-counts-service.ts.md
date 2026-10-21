# Work packet: edit src/modules/placements/recruiter-portfolio-counts-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/recruiter-drives-index.md, docs/audit/gap2/lane-13/recruiter-home.md

## G2-11-003-057  [P1] GAP  facet F10  effort S
- Legacy: Legacy offer count released/accepted `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterDriveWorkService.java:66`
- vNext now: VNext counts distinct offers per shared application with different statuses `src/modules/placements/recruiter-portfolio-counts-service.ts:76`
- Fix: Match visible released/accepted ledger

## G2-11-003-060  [P1] GAP  facet F11  effort S
- Legacy: Legacy direct-access mode or live TPO share influences counts `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterDriveWorkService.java:65`
- vNext now: VNext only SHORTLISTED active submitted applications counted `src/modules/placements/recruiter-portfolio-counts-service.ts:38`
- Fix: Align opt-in direct mode/shares and count semantics

## G2-11-003-101  [P1] GAP  facet F22  effort S
- Legacy: Legacy job_offer statuses RELEASED/ACCEPTED `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterDriveWorkService.java:66`
- vNext now: VNext placementOffers distinct application id across statuses `src/modules/placements/recruiter-portfolio-counts-service.ts:76`
- Fix: Map offer release counts

## G2-13-002-020  [P1] GAP  facet F04  effort M
- Legacy: Old live count includes all non-withdrawn applications (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:195-209`)
- vNext now: New counts submitted, shortlisted and employer-visible only (`src/modules/placements/recruiter-portfolio-counts-service.ts:10-39`)
- Fix: Label changed metric as shared applicant count; decide approved privacy divergence.

## G2-13-002-079  [P1] GAP  facet F22  effort L
- Legacy: Old live job count on job_application excludes WITHDRAWN (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:194-209`)
- vNext now: New placement_applications counts SUBMITTED plus SHORTLISTED screen (`src/modules/placements/recruiter-portfolio-counts-service.ts:27-39`)
- Fix: Document changed cohort and reconcile migrations/tests.
