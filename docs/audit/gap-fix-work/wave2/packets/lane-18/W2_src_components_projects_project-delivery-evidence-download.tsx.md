# Work packet (wave 2): edit src/components/projects/project-delivery-evidence-download.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/superadmin-workspace-delivery.md, docs/audit/gap2/lane-4/project-delivery-model.md

## G2-3-029-054  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/projects/WorkspaceDeliveryOverview.jsx:73-81`
- vNext now: `src/components/projects/project-delivery-evidence-download.tsx:1-65`
- Fix: Legacy public download URL is direct, vNext grants temporary access; verify storage expiry/retry experience rather than mimic insecure link.

## G2-4-018-037  [P2] GAP  facet F09  effort M
- Legacy: Legacy attachments may include URLs and file references. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:37-61`)
- vNext now: New dedicated Open attachment button issues signed download grant. (`src/components/projects/project-delivery-evidence-download.tsx:12-36`)
- Fix: Keep explicit open/download affordance for imported URLs and files.

## G2-4-018-052  [P2] GAP  facet F13  effort S
- Legacy: Legacy file access denial delegated to upload controller and repository. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectDeliveryRepository.java:24-35`)
- vNext now: New grant failure shown inline Could not open this attachment. Please retry. (`src/components/projects/project-delivery-evidence-download.tsx:22-37`)
- Fix: Align 403/404 versus expired grant copy and fallback.

## G2-4-018-070  [P2] GAP  facet F21  effort L
- Legacy: Legacy R2/file-upload controller uses storageKey and suffix authorization. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectDeliveryRepository.java:24-35`)
- vNext now: New signed grant flow uses first-party storage API and fileId. (`src/components/projects/project-delivery-file-uploader.tsx:27-47`; `src/components/projects/project-delivery-evidence-download.tsx:16-29`)
- Fix: Document provider key conversion and expiry/security rules.

## G2-4-018-060  [P3] GAP  facet F16  effort S
- Legacy: Legacy direct URL could have very long attachment name. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:40-41`)
- vNext now: New display button renders name in label. (`src/components/projects/project-delivery-evidence-download.tsx:34-37`)
- Fix: Ensure filename wrapping and tooltip for long or Unicode text.
