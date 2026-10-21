# Work packet (wave 2): edit src/modules/placements/candidate-preferences-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/job-preferences-repository.md, docs/audit/gap2/lane-6/job-preferences.md

## G2-4-015-022  [P2] GAP  facet F06  effort M
- Legacy: Legacy GET no record returns null text preferences but notifications true. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:924-940`)
- vNext now: New default is empty strings/arrays and two true flags. (`src/modules/people/profile-validation.ts:515-518`; `src/modules/placements/candidate-preferences-service.ts:58-65`)
- Fix: Preserve null-versus-empty semantics for compatibility.

## G2-6-019-035  [P2] GAP  facet F13  effort S
- Legacy: Legacy when no row returns six-field DTO mostly null plus notifications true (LearnerProfileServiceImpl.java:924-940).
- vNext now: vNext defaults four profile fields to empty strings/array, placement preferences to NO_PREFERENCE/true (profile-validation.ts:510-518; candidate-preferences-service.ts:17-27).
- Fix: Display same empty placeholder; do not conflate missing DB row with explicit preference.
