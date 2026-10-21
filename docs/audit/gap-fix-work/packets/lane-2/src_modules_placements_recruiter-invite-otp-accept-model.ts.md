# Work packet: edit src/modules/placements/recruiter-invite-otp-accept-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/public-recruiter-invite-controller.md

## G2-3-026-019  [P1] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:83-92`
- vNext now: `src/modules/placements/recruiter-invite-otp-accept-model.ts:4-14`
- Fix: Legacy payload accepts separate firstName,lastName,phone,email,code; vNext strict schema uses name,mobile,designation,code only. Establish explicit migration/compatibility mapping.
