# Work packet (wave 3): edit src/modules/announcements/tpo-notice-delivery-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/tpo-scheduled-jobs.md

## G2-17-010-003  [P1] MISSING  facet F02  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:38-43 — India-time 08:00 daily deadline today.
- vNext now: src/modules/announcements/tpo-notice-delivery-service.ts:15-37 — Generic scheduled notice release, not a deadline-today generator.
- Fix: Implement distinct deadlineToday generation at 08:00 IST.

## G2-17-010-009  [P1] MISSING  facet F02  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:60-62 — Interview eve reminders at 19:00 IST in-app and email.
- vNext now: src/modules/announcements/tpo-notice-delivery-service.ts:15-37 — TPO notice delivery is generic in-app, no interview e-mail worker.
- Fix: Build prior-evening interview reminder with exact recipient/channel.
