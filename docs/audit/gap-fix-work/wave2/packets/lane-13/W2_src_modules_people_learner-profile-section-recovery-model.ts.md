# Work packet (wave 2): edit src/modules/people/learner-profile-section-recovery-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/qualification.md

## G2-3-017-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerProfileController.java:668-722`
- vNext now: `src/components/profile/learner-profile-workspace.tsx:452-527`, `src/modules/people/learner-profile-section-recovery-model.ts:2-23`
- Fix: Legacy `GET/POST /{learnerId}/education`, PUT/DELETE by positional index and profile About qualifications panel; vNext learner workspace handles owned `education` collection via section-save action and stable item ID. Preserve old deep links, display hierarchy and label.
