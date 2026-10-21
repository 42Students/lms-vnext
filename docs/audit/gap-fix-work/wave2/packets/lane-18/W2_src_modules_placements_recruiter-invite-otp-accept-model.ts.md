# Work packet (wave 2): edit src/modules/placements/recruiter-invite-otp-accept-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/public-recruiter-invite-controller.md

## G2-3-026-022  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:208-209`
- vNext now: `src/modules/placements/recruiter-invite-otp-accept-model.ts:7-7`
- Fix: Legacy backend truncates designation to150; vNext only permits100 characters. Align cap explicitly.
