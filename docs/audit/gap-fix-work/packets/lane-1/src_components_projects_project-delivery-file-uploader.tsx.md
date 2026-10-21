# Work packet: edit src/components/projects/project-delivery-file-uploader.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/project-delivery-model.md

## G2-4-018-010  [P1] GAP  facet F03  effort L
- Legacy: Legacy file_name255, file_size Long, mime_type160, storage_key string on delivery. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:40-50`)
- vNext now: New attachments JSON plus projectResourceFiles references and signed-grant UI. (`src/db/schema/projects.ts:852-855`; `src/components/projects/project-delivery-file-uploader.tsx:27-47`)
- Fix: Migrate file metadata to verified project resource file records.
