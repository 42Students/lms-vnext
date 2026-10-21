# Work packet (wave 2): edit src/modules/verification/document-manifest.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/student-image-controller.md, docs/audit/gap2/lane-20/student-image.md

## G2-20-024-024  [P2] GAP  facet F21  effort M
- Legacy: ContentUrlValidator checks approved R2 storage URL `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentImageController.java:33-34,71-78`
- vNext now: New private image receipt / verification model `src/modules/verification/document-manifest.ts:6-14`
- Fix: Wire storage object authority

## G2-20-015-033  [P2] GAP  facet F21  effort S
- Legacy: Optional ContentUrlValidator checks allowlisted R2 host `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentImageController.java:33-35,71-88`
- vNext now: New private receipt IDs and signed URL exchange `src/modules/verification/document-manifest.ts:6-14`
- Fix: Provision private image upload/read grant and scanner/preview thumbnail contract
