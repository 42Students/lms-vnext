# Work packet: edit src/modules/placements/candidate-preferences-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/job-preferences-repository.md, docs/audit/gap2/lane-6/job-preferences.md

## G2-4-015-033  [P1] GAP  facet F10  effort L
- Legacy: Legacy GET reads JobPreferencesRepository and serializes six DTO properties. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerProfileController.java:1177-1186`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:924-940`)
- vNext now: New read is separate profile JSON and placement candidate preferences, not six-field DTO. (`src/modules/people/profile-validation.ts:509-518`; `src/modules/placements/candidate-preferences-service.ts:42-66`)
- Fix: Provide complete six-field read model or migrate all readers.

## G2-6-019-028  [P1] GAP  facet F10  effort L
- Legacy: Legacy GET/PUT route, service upserts on first write with learner relation (LearnerProfileController.java:1177-1202; LearnerProfileServiceImpl.java:943-975).
- vNext now: vNext profile JSON Save, separate candidate-preference upsert with activity (profiles.ts:15-24; candidate-preferences-service.ts:68-117).
- Fix: Clearly separate profile and placement preference persistence; avoid two sources of truth for common fields.
