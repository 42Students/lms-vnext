# Work packet (wave 2): edit src/modules/storage/file-access.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/file-upload-controller.md

## G2-10-027-019  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FileUploadController.java:2175-2290 — Generic file lookup by passed filename/fileName query.
- vNext now: src/modules/storage/file-access.ts:8-26 — Access denial normalized STORAGE_NOT_FOUND, no generic search/list.
- Fix: Expose authenticated selected file details via feature context
