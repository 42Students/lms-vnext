# Work packet (wave 3): edit src/modules/placements/public-recruiter-invite-accept-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/l13-u025-recruiter-pending-invite-controller.md

## G2-13-025-001  [P1] MISSING  facet F01  effort L
- Legacy: Recruiter-fenced GET and POST accept/decline under /api/v1/recruiter/pending-invites `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPendingInviteController.java:14-29`
- vNext now: Public token/OTP acceptance only `src/modules/placements/public-recruiter-invite-accept-service.ts:65-119`; NONE: no authenticated recruiter/pending-invites API (schema `src/db/schema/placements.ts:206-294`)
- Fix: Add authenticated recruiter GET list, POST accept/decline endpoints, own-user scoped.
