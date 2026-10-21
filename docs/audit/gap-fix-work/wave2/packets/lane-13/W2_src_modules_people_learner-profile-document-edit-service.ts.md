# Work packet (wave 2): edit src/modules/people/learner-profile-document-edit-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/learner-profile-controller.md, docs/audit/gap2/lane-4/job-preferences-repository.md

## G2-1-004-038  [P2] GAP  facet F10  effort M
- Legacy: `LearnerProfileController.java:157-176` best-effort profile audit for sensitive changes.
- vNext now: `learner-profile-section-service.ts:61-69` activity event and `learner-profile-document-edit-service.ts:39-44` emits event.
- Fix: Map legacy actions and actor/subject metadata to activity taxonomy.

## G2-4-015-052  [P2] GAP  facet F17  effort M
- Legacy: Legacy PUT trims present values, untouched absent fields. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:954-974`)
- vNext now: New dialog saves entire document with CAS. (`src/components/profile/learner-profile-workspace.tsx:992-1006`; `src/modules/people/learner-profile-document-edit-service.ts:29-38`)
- Fix: Keyboard Cancel must not mutate other profile sections.
