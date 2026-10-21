# Work packet: edit src/lib/tpo-recruiter-invite-api-error.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/public-recruiter-invite-controller.md

## G2-3-026-027  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicRecruiterInviteController.java:67-75`
- vNext now: `src/lib/tpo-recruiter-invite-api-error.ts:5-14`
- Fix: Legacy InviteRejected uses 400 with exact code/message; vNext maps service errors to 404 or 409, drops descriptive message; implement friendly field error mapping.
