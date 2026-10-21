# Work packet (wave 2): edit src/components/projects/project-delivery-file-uploader.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/project-delivery-model.md

## G2-4-018-054  [P2] GAP  facet F14  effort L
- Legacy: Legacy JSON attachments may contain many links/files with attribution. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:55-61`)
- vNext now: New submission JSONB attachments and signed fileID grant. (`src/db/schema/projects.ts:852-855`; `src/components/projects/project-delivery-file-uploader.tsx:27-47`)
- Fix: Preserve URL/label/addedBy/addedAt on legacy import.

## G2-4-018-070  [P2] GAP  facet F21  effort L
- Legacy: Legacy R2/file-upload controller uses storageKey and suffix authorization. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectDeliveryRepository.java:24-35`)
- vNext now: New signed grant flow uses first-party storage API and fileId. (`src/components/projects/project-delivery-file-uploader.tsx:27-47`; `src/components/projects/project-delivery-evidence-download.tsx:16-29`)
- Fix: Document provider key conversion and expiry/security rules.
