# Work packet (wave 2): edit src/modules/bug-tracker/access-and-attachments.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/bug-report-model.md, docs/audit/gap2/lane-20/bug-report-attachment.md

## G2-4-021-032  [P2] GAP  facet F09  effort M
- Legacy: Legacy report intake may attach screenshots, separate BugReportAttachment relation. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:52-65`)
- vNext now: New staged attachment table, screenshot policy PNG/JPEG/WebP <=8MB max3. (`src/db/schema/db10-bug-tracker.ts:138-154`; `src/modules/bug-tracker/access-and-attachments.ts:42-49`)
- Fix: Verify upload UI, provisional grants and screenshot display in report form.

## G2-20-020-018  [P3] GAP  facet F18  effort S
- Legacy: Old upload not found/type/size wording `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerAttachmentService.java:103-127`
- vNext now: Generic INVALID_FILE `src/modules/bug-tracker/access-and-attachments.ts:51-55`
- Fix: Map error copy
