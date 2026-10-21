# Work packet: edit src/modules/placements/recruiter-invite-otp-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/public-recruiter-invite-controller.md

## G2-3-026-045  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:172-176`
- vNext now: `src/modules/placements/recruiter-invite-otp-service.ts:33-43`
- Fix: Legacy permits a missing stored email once typed and company-domain checked; vNext lead without email and company relationship is structurally rejected.
