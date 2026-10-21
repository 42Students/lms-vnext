# Work packet (wave 2): edit src/modules/courses/learner-assignment-due-notice-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/cross-notifications.md

## G2-4-032-013  [P2] GAP  facet F04  effort M
- Legacy: Legacy interview/classroom titles `Interview reminder` and assignment/grade (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/NotificationEventRegistry.java:104-124`)
- vNext now: Learner due projection copy `Assignment due soon` and `Due ...` (`src/modules/courses/learner-assignment-due-notice-model.ts:15-19`)
- Fix: Restore course due text or approve intentionally changed copy.

## G2-4-032-044  [P2] GAP  facet F12  effort S
- Legacy: Due reminder only eligible unsubmitted active course work (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:296-325`)
- vNext now: Filters already-submitted and missing deadline but does not check active course work here (`src/modules/courses/learner-assignment-due-notice-model.ts:11-21`)
- Fix: Ensure active enrollment/course flag on due-notice read.

## G2-4-032-068  [P2] GAP  facet F20  effort M
- Legacy: IST evening interview reminders guard cancelled/completed (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:182-206`)
- vNext now: IST formatted course deadline, UTC stored (`src/modules/courses/learner-assignment-due-notice-model.ts:16-21`)
- Fix: Use consistent timezone mapping in reminder scheduling.
