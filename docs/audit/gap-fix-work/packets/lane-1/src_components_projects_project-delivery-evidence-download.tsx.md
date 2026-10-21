# Work packet: edit src/components/projects/project-delivery-evidence-download.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/project-delivery-model.md

## G2-4-018-055  [P1] GAP  facet F14  effort L
- Legacy: Legacy storage keys can be bare tenant key or R2 URL. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectDeliveryRepository.java:24-33`)
- vNext now: New download grant requires file ID and safe signed URL. (`src/components/projects/project-delivery-evidence-download.tsx:16-29`)
- Fix: Create safe migration from legacy key/URL to owned typed resource file.
