# Work packet (wave 2): edit src/components/tpo/tpo-students-bulk-debar.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/tpo-students-hub-controller.md

## G2-4-022-032  [P2] GAP  facet F09  effort M
- Legacy: Legacy StudentActions opens actions and undo around selection, modals defined downstream. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:139-168`)
- vNext now: New bulk debar and override open ConfirmDialog with per-row result. (`src/components/tpo/tpo-students-bulk-debar.tsx:31-43`; `src/components/tpo/tpo-students-drive-visibility.tsx:123-130`)
- Fix: Match legacy modal labels, footer, warning and scope preview.

## G2-4-022-054  [P2] GAP  facet F16  effort M
- Legacy: Legacy bulk selection may target many learners, no explicit cap in controller. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:30-52`)
- vNext now: New capped bulk actions200, verification per20, preview. (`src/components/tpo/tpo-students-bulk-debar.tsx:35-43`; `src/components/tpo/tpo-roster-verification-bulk.tsx:66-75`)
- Fix: Show explicit cap and unselected count at mobile.
