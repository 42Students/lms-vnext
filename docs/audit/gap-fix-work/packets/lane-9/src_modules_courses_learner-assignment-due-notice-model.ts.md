# Work packet: edit src/modules/courses/learner-assignment-due-notice-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/cross-notifications.md

## G2-4-032-033  [P1] MISSING  facet F10  effort M
- Legacy: Interview reminders every day 7pm Asia/Kolkata (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:182-220`)
- vNext now: Learner assignment projection is on-request, not reminder job (`src/modules/courses/learner-assignment-due-notice-model.ts:5-27`)
- Fix: Build scheduled interview reminders with cancel/complete exclusion and timezone.

## G2-4-032-034  [P1] GAP  facet F10  effort M
- Legacy: Assignment and quiz reminders daily 9am, skip submitted (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:282-335`)
- vNext now: 48-hour due-soon read projection, excludes submitted but no delivery (`src/modules/courses/learner-assignment-due-notice-model.ts:5-27`)
- Fix: Implement 24-hour dispatch and keep read-only due widget as extra.

## G2-4-032-043  [P1] GAP  facet F12  effort M
- Legacy: Interview reminders only tomorrow 19:00 IST and not cancelled/completed (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:182-220`)
- vNext now: Course notices use 48-hour time window on-demand (`src/modules/courses/learner-assignment-due-notice-model.ts:5-27`)
- Fix: Implement correct independent interview UTC boundaries.
