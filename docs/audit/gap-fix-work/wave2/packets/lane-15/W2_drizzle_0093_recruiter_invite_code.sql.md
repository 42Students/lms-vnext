# Work packet (wave 2): edit drizzle/0093_recruiter_invite_code.sql

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/public-recruiter-invite-controller.md

## G2-3-026-079  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteCodeService.java:80-114`
- vNext now: `drizzle/0093_recruiter_invite_code.sql:1-25`
- Fix: Legacy `recruiter_invite_code` stores tokenHash,email,codeHash,wrongTries,expiresAt,usedAt while vNext scoped `recruiter_invite_code` adds lead/college UUID and deliveryState, failedAttempts/consumedAt indexes.
