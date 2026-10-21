# Work packet (wave 2): edit src/components/tpo/tpo-students-drive-visibility.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/tpo-students-hub-controller.md

## G2-4-022-014  [P2] GAP  facet F04  effort M
- Legacy: Legacy driver overrides type INCLUDE/EXCLUDE,reason, jobId and before state for undo. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:139-149`)
- vNext now: New drive visibility chooses INCLUDE/EXCLUDE/CLEAR, stores versioned expectedOverrideId. (`src/components/tpo/tpo-students-drive-visibility.tsx:22-30`; `src/components/tpo/tpo-students-drive-visibility.tsx:38-68`)
- Fix: Preserve legacy before-state undo semantics without reverting concurrent changes.

## G2-4-022-032  [P2] GAP  facet F09  effort M
- Legacy: Legacy StudentActions opens actions and undo around selection, modals defined downstream. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:139-168`)
- vNext now: New bulk debar and override open ConfirmDialog with per-row result. (`src/components/tpo/tpo-students-bulk-debar.tsx:31-43`; `src/components/tpo/tpo-students-drive-visibility.tsx:123-130`)
- Fix: Match legacy modal labels, footer, warning and scope preview.

## G2-4-022-056  [P2] GAP  facet F18  effort S
- Legacy: Legacy errors include Pick at least one student, Choose the drive, Nothing to undo. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:48-52`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoStudentsHubController.java:142-156`)
- vNext now: New picker and retry copy differ for undo/stale. (`src/components/tpo/tpo-students-drive-visibility.tsx:94-121`; `src/components/tpo/tpo-students-drive-visibility.tsx:68-90`)
- Fix: Preserve exact primary feedback where semantics match.
