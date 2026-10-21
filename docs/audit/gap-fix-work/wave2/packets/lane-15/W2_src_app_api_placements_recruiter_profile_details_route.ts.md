# Work packet (wave 2): edit src/app/api/placements/recruiter/profile/details/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/recruiter-self-controller.md

## G2-10-025-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:31-39 — Authenticated recruiter self API rooted /api/v1/recruiter; college-selected session.
- vNext now: src/app/api/placements/recruiter/profile/route.ts:8-17; src/app/api/placements/recruiter/profile/details/route.ts:8-18; src/app/api/placements/recruiter/bell/route.ts:7-20 — Functions split /api/placements/recruiter/* routes.
- Fix: Preserve matching public API contracts or add documented adapter

## G2-10-025-024  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:123-129 — UpdateMe fields firstName,lastName,contactMail,designation,contactMobile optional.
- vNext now: src/modules/placements/recruiter-profile-details-service.ts:15-23; src/app/api/placements/recruiter/profile/details/route.ts:11-13 — New joined Name/Title/Phone patch, no contactMail edit.
- Fix: Map split input contract and explicitly display locked work email
