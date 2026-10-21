# Work packet: edit src/modules/placements/recruiter-message-email-dispatch-service.ts

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/tpo-scheduled-jobs.md, docs/audit/gap2/lane-18/tpo-mail-service.md, docs/audit/gap2/lane-20/recruiter-message-email-service.md

## G2-17-010-008  [P1] MISSING  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:57-58 — Recruiter invitation reminders daily 09:00 IST.
- vNext now: src/modules/placements/recruiter-message-email-dispatch-service.ts:18-25 — Unread recruiter-message mailer serves different purpose.
- Fix: Implement pending invite reminder worker (day-four rule).

## G2-17-010-031  [P1] MISSING  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:57-58 — Calls recruiterLeads.sendInviteReminders.
- vNext now: src/modules/placements/recruiter-message-email-dispatch-service.ts:18-25 — Unread recruiter digest unrelated to invites.
- Fix: Add invite mail reminder workflow.

## G2-18-010-039  [P1] GAP  facet F11  effort M
- Legacy: Legacy sender derives college using caller-provided int collegeId DB lookup (`TpoMailService.java:82-97,123-130`).
- vNext now: New generic provider has no tenant or permission context; send gated by policy service and per-workflow queries (`messaging/providers.ts:26-40`; `recruiter-message-email-dispatch-service.ts:45-65`).
- Fix: Require authorized college scope at enqueue, ensure tenant context cannot be spoofed in variables.

## G2-20-010-008  [P1] GAP  facet F03  effort S
- Legacy: Recruiter first_name used as email greeting `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:63-65,106-109`
- vNext now: recipientName set to recruiter's email address `src/modules/placements/recruiter-message-email-dispatch-service.ts:115-119`
- Fix: Select safely escaped recruiter first name; neutral fallback if absent

## G2-20-010-015  [P1] GAP  facet F05  effort M
- Legacy: Only new unread TPO MESSAGE rows after previous recruiter_emailed_at qualify `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:65-71`
- vNext now: All still-unread messages qualify; lastNotifiedMessageId unused in query `src/modules/placements/recruiter-message-email-dispatch-service.ts:45-50,121-125`
- Fix: Exclude already-emailed messages from due query using lastNotifiedMessageId or creation time

## G2-20-010-019  [P1] GAP  facet F07  effort M
- Legacy: Absent Zepto template skips emailUnread without exception `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:77-79`
- vNext now: Bridge disabled when flag/templates/secret/DB missing `src/modules/placements/recruiter-message-email-dispatch-service.ts:25-44`
- Fix: Make disabled state visible to operations and provision complete dependencies

## G2-20-010-034  [P1] GAP  facet F12  effort S
- Legacy: Only never-notified messages since last email are eligible `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:66-70`
- vNext now: All old unread messages re-enter policy after six-hour cooldown `src/modules/placements/recruiter-message-email-dispatch-service.ts:45-50,108-110`
- Fix: Scope unread window to newly unnotified messages

## G2-20-010-052  [P1] GAP  facet F21  effort L
- Legacy: Legacy mails if template configured and grants active `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:72-79`
- vNext now: New hard disabled unless feature flag, secrets, template and migrations exist `src/modules/placements/recruiter-message-email-dispatch-service.ts:25-44`
- Fix: Add deployment readiness check/alert and test delivery before release

## G2-20-010-055  [P1] GAP  facet F23  effort S
- Legacy: Original email after configured mail template is active; no separate bridge toggle `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:77-79`
- vNext now: New bridge false unless explicitly enabled `src/modules/placements/recruiter-message-email-dispatch-service.ts:25`
- Fix: Close operational dependency and document new opt-in

## G2-20-010-020  [P2] GAP  facet F07  effort S
- Legacy: Each conversation exception caught and other recipients continue `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:79-89`
- vNext now: Transaction errors may abort loop and API return 503 `src/modules/placements/recruiter-message-email-dispatch-service.ts:66-131`
- Fix: Isolate per-thread database exceptions and continue remaining candidates

## G2-20-010-021  [P2] GAP  facet F07  effort M
- Legacy: Legacy send failure still reserves six-hour slot except NOT_CONFIGURED resets `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:100-123`
- vNext now: New provider false leaves lastSentAt unchanged, immediate next scheduler retry `src/modules/placements/recruiter-message-email-dispatch-service.ts:115-126`
- Fix: Define retry/backoff and provider idempotency; cap repeated failure sends

## G2-20-010-024  [P2] GAP  facet F08  effort S
- Legacy: No email template produces a user-facing configuration banner `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:77-79`
- vNext now: No-op returns enabled:false without alert `src/modules/placements/recruiter-message-email-dispatch-service.ts:25-44`
- Fix: Expose safe operator alert on disabled bridge; do not claim delivery
