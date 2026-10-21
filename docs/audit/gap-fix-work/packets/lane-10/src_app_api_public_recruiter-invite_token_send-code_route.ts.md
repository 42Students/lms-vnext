# Work packet: edit src/app/api/public/recruiter-invite/[token]/send-code/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/public-recruiter-invite-controller.md

## G2-3-026-031  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:105-113`
- vNext now: `src/app/api/public/recruiter-invite/[token]/send-code/route.ts:15-20`
- Fix: Legacy differentiates EMAIL_REQUIRED, COMPANY_EMAIL_REQUIRED, TOO_MANY_CODES and CODE_NOT_SENT; vNext exposes generic invalid-link 404 for send failures.

## G2-3-026-032  [P2] GAP  facet F08  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterInviteService.java:105-118`
- vNext now: `src/app/api/public/recruiter-invite/[token]/send-code/route.ts:15-17`
- Fix: Legacy code-sent response {status:CODE_SENT,email}; vNext {sent:true} and no email confirmation. Return safe confirmed mailbox display.
