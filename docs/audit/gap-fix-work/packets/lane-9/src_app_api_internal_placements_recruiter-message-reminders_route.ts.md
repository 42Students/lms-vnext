# Work packet: edit src/app/api/internal/placements/recruiter-message-reminders/route.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/tpo-scheduled-jobs.md, docs/audit/gap2/lane-18/tpo-mail-service.md, docs/audit/gap2/lane-20/recruiter-message-email-service.md

## G2-17-010-011  [P1] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:68-70 — Recruiter unread email every 5 min, initial 90-second delay.
- vNext now: src/app/api/internal/placements/recruiter-message-reminders/route.ts:18-27 — Manual/externally invoked POST call dispatches digest; schedule unspecified.
- Fix: Run authenticated endpoint every five minutes; check initial delay.

## G2-17-010-057  [P1] GAP  facet F21  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:38-73 — Relies on Spring scheduler and TpoMail/notification services.
- vNext now: src/app/api/internal/placements/recruiter-message-reminders/route.ts:18-26 — New deployment invokes signed endpoint, mail via configured provider.
- Fix: Create explicit scheduler-to-worker integration contracts.

## G2-18-010-038  [P1] GAP  facet F10  effort M
- Legacy: Legacy Recruiter unread scheduling via `RecruiterMessageEmailService` periodic due query (`RecruiterMessageEmailService.java:61-89`).
- vNext now: New authenticated POST worker route, scheduler must invoke separately (`recruiter-message-reminders/route.ts:6-26`).
- Fix: Configure and verify recurring worker with secret; no side effects in GET.

## G2-20-010-001  [P1] GAP  facet F01  effort M
- Legacy: Background emailUnread() sends TPO unread recruiter messages after delay `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterMessageEmailService.java:61-89`
- vNext now: Internal authenticated POST only; separately scheduled job required `src/app/api/internal/placements/recruiter-message-reminders/route.ts:18-26`
- Fix: Configure recurring worker invocation with origin/bearer secret; prove scheduler enabled
