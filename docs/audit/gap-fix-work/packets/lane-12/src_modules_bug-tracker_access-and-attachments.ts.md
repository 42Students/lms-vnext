# Work packet: edit src/modules/bug-tracker/access-and-attachments.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/bug-report-attachment.md

## G2-20-020-007  [P3] GAP  facet F07  effort S
- Legacy: Exact max screenshots and 8MB strings `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerAttachmentService.java:43-53`
- vNext now: Typed errors only `src/modules/bug-tracker/access-and-attachments.ts:85-101`
- Fix: Map exact error strings
