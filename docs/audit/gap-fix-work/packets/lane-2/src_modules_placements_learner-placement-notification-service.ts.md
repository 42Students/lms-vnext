# Work packet: edit src/modules/placements/learner-placement-notification-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/job-preferences-repository.md

## G2-4-015-034  [P1] GAP  facet F10  effort L
- Legacy: Legacy PUT upserts one record, returns same six fields. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:944-975`)
- vNext now: New profile and notification updates write separate tables without all-or-nothing transaction. (`src/modules/people/learner-profile-document-edit-service.ts:26-45`; `src/modules/placements/learner-placement-notification-service.ts:71-96`)
- Fix: Guard cross-service partial success or separate clearly-scoped saves.
