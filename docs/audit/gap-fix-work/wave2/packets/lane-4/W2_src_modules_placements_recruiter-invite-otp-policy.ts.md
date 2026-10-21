# Work packet (wave 2): edit src/modules/placements/recruiter-invite-otp-policy.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/public-recruiter-invite-controller.md

## G2-3-026-050  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteCodeService.java:27-29`
- vNext now: `src/modules/placements/recruiter-invite-otp-policy.ts:4-19`
- Fix: Legacy 5 sends per link/hour; vNext also caps across entire college 300/hour, altering otherwise valid requests.
