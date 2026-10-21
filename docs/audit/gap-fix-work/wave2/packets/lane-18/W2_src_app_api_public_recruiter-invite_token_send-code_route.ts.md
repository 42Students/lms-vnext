# Work packet (wave 2): edit src/app/api/public/recruiter-invite/[token]/send-code/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/public-recruiter-invite-controller.md

## G2-3-026-076  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteCodeService.java:80-96`
- vNext now: `src/app/api/public/recruiter-invite/[token]/send-code/route.ts:15-20`
- Fix: Legacy ZeptoMail OTP errors distinguish provider failure; vNext adapter readiness flag and generic 404 obscure operational delivery outages.
