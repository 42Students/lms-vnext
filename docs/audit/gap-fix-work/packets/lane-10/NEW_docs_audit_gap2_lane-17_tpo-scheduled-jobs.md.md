# Work packet: NEW / MISSING items from docs/audit/gap2/lane-17/tpo-scheduled-jobs.md

1 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-17/tpo-scheduled-jobs.md

## G2-17-010-028  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:42-49 — Calls announcements.deadlineToday and shortlistDueTomorrow.
- vNext now: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoAnnouncementService.java:76-128 — Legacy service contains dedicated reminder methods; new notice deliver service only sends existing announcements.
- Fix: Implement source event generation for both reminders.
