# Work packet (wave 3): NEW / MISSING items from docs/audit/gap2/lane-16/u011-notification-scheduler.md

1 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-16/u011-notification-scheduler.md

## G2-16-011-024  [P1] MISSING  facet F10  effort L
- Legacy: NotificationSchedulerService.java:396-402 and 470-476 dispatches INTERVIEW_REMINDER / COURSE_ASSIGNMENT_DUE.
- vNext now: src/modules/notifications/{exotel-sms,zeptomail-email}.ts are transport adapters, no scheduler dispatch.
- Fix: Call channel-aware notification dispatcher with templates, feature gates.
