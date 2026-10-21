# Work packet: edit src/components/hr/hr-recruiter-bell.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/l12-u011-recruiter-notification-service.md

## G2-12-011-045  [P1] GAP  facet F23  effort M
- Legacy: Badge separate unreadTotal and shown unread; read all hidden only explicit (RecruiterNotificationService.java:139-153).
- vNext now: Single unread count from filtered persisted records, 10 shown, Mark all read available (bell-service.ts:10-19; hr-recruiter-bell.tsx:90-95).
- Fix: Restore hidden-unread accounting and conditional auto mark.
