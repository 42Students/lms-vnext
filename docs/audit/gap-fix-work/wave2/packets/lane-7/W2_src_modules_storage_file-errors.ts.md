# Work packet (wave 2): edit src/modules/storage/file-errors.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/r2-storage-utils.md

## G2-20-009-047  [P3] GAP  facet F18  effort S
- Legacy: No user-visible text in utility itself; exception types propagated; `docs/legacy-source/backend/src/main/java/com/_42students/lms/utils/R2StorageUtils.java:52-62,145-155`
- vNext now: Public API error codes structured in file-errors; `src/modules/storage/file-errors.ts:5-26`
- Fix: Map code to exact UI labels in upload consumers; don't display raw S3 code.
