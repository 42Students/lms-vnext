# Work packet (wave 2): edit src/modules/placements/recruiter-profile-details-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/recruiter-profile.md, docs/audit/gap2/lane-10/recruiter-self-controller.md

## G2-1-035-075  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:123-129,227-255: legacy firstName/lastName, contactMobile, designation on Recruiter entity.
- vNext now: src/modules/placements/recruiter-profile-details-service.ts:28-72: users.displayName, placementRecruiterProfiles.title, placementRecruiterPublicContacts.phoneDigits.
- Fix: Document lossless name split policy and phone separate from auth identity.

## G2-10-025-024  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:123-129 — UpdateMe fields firstName,lastName,contactMail,designation,contactMobile optional.
- vNext now: src/modules/placements/recruiter-profile-details-service.ts:15-23; src/app/api/placements/recruiter/profile/details/route.ts:11-13 — New joined Name/Title/Phone patch, no contactMail edit.
- Fix: Map split input contract and explicitly display locked work email

## G2-10-025-025  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:233-237 — firstName cleans/trims/max100; lastName max100.
- vNext now: src/app/(authenticated)/hr/profile/page.tsx:35-38; src/modules/placements/recruiter-profile-details-service.ts:20-22 — Name join from new displayName model, max may differ.
- Fix: Align split name max100 and sanitize behavior

## G2-10-025-081  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:250-250 — Invalid mobile error exact 'Enter a valid 10-digit mobile number, or leave it blank'.
- vNext now: src/modules/placements/recruiter-profile-details-service.ts:22-26 — No same string.
- Fix: Show exact validation

## G2-10-025-089  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:269-273 — Sanitize/trim then truncate to max chars.
- vNext now: src/modules/placements/recruiter-profile-details-service.ts:20-22 — Name/title model validates, not silent truncate.
- Fix: Choose strict reject-v-truncate parity explicitly
