# Work packet (wave 3): NEW / MISSING items from docs/audit/gap2/lane-17/tpo-scheduled-jobs.md

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-17/tpo-scheduled-jobs.md

## G2-17-010-032  [P1] MISSING  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:60-66 — Calls interviewReminders.remindTomorrow and remindToday.
- vNext now: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/InterviewReminderService.java:22-34 — Legacy purpose/messaging specified; vNext generic notice handler lacks dedicated mapping.
- Fix: Implement two interview-due services and their scheduled triggers.
