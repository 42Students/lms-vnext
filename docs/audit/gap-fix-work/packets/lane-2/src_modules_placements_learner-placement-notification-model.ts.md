# Work packet: edit src/modules/placements/learner-placement-notification-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/job-preferences-repository.md

## G2-4-015-020  [P1] GAP  facet F06  effort L
- Legacy: Legacy DTO accepts nullable fields and PUT updates only provided non-null properties. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:944-975`)
- vNext now: New profile write replaces whole document after CAS, notification write requires both booleans and baseline. (`src/modules/people/learner-profile-document-edit-service.ts:29-38`; `src/modules/placements/learner-placement-notification-model.ts:5-13`)
- Fix: Provide safe partial field updates without clobbering unrelated values.

## G2-4-015-025  [P1] GAP  facet F07  effort M
- Legacy: Legacy null Job Notifications Enabled PUT means do not change current value. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:970-972`)
- vNext now: New PUT requires explicit booleans and confirmed flag. (`src/modules/placements/learner-placement-notification-model.ts:5-13`)
- Fix: Implement safe nullable master-toggle adapter.
