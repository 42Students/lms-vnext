# Work packet (wave 2): edit src/components/projects/project-delivery-reopen-control.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/project-delivery-model.md

## G2-4-018-035  [P2] GAP  facet F09  effort M
- Legacy: Legacy final delivery can be reviewed and reopened from workspace controller. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:369-415`)
- vNext now: New dedicated Reopen for revision dialog asks Review feedback. (`src/components/projects/project-delivery-reopen-control.tsx:38-58`)
- Fix: Match old modal header/buttons/feedback helper copy.

## G2-4-018-050  [P2] GAP  facet F13  effort M
- Legacy: Legacy failure due stale revision should preserve unsaved draft; UI not shown in entity. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectDelivery.java:123-129`)
- vNext now: New Reopen dialog has guarded discard and retry error. (`src/components/projects/project-delivery-reopen-control.tsx:21-35`; `src/components/projects/project-delivery-reopen-control.tsx:54-57`)
- Fix: Audit unsaved editor preservation and conflict recovery.

## G2-4-018-063  [P2] GAP  facet F18  effort S
- Legacy: Legacy labels snapshot, feedback, attachment and mixed status review wording. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectDeliveryDTO.java:11-26`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectDeliveryDTO.java:36-48`)
- vNext now: New UI says Submission, Review feedback, Reopen for revision. (`src/components/projects/project-delivery-reopen-control.tsx:38-50`)
- Fix: Match exact old labels where cloned or document intentional rename.
