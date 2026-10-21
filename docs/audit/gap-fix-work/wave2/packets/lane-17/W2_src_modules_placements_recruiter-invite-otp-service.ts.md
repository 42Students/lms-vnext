# Work packet (wave 2): edit src/modules/placements/recruiter-invite-otp-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/public-recruiter-invite-controller.md

## G2-3-026-057  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteCodeService.java:80-96`
- vNext now: `src/modules/placements/recruiter-invite-otp-service.ts:68-80`
- Fix: Legacy OTP uses ZeptoMail configured template and recipient-specific merge data; vNext uses injectable public join code delivery adapter and readiness gating.

## G2-3-026-070  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteCodeService.java:57-77`
- vNext now: `src/modules/placements/recruiter-invite-otp-service.ts:44-58`
- Fix: Legacy shared-code limit is per-email for shared links; this dedicated invite vNext adds per-college shared 300/hour cap. Monitor false-throttle at scale.
