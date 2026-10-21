# Work packet (wave 3): edit src/modules/people/profile-validation.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/job-preferences-dto.md, docs/audit/gap2/lane-5/u019-learner.md

## G2-1-011-011  [P1] MISSING  facet F04  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/profile/JobPreferencesDTO.java:15`: jobNotificationsEnabled nullable Boolean in DTO.
- vNext now: `src/modules/people/profile-validation.ts:510-517`: missing boolean preference and default.
- Fix: Persist enabled bool with default true and wire to outbound notification eligibility.

## G2-1-011-025  [P1] MISSING  facet F12  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobPreferences.java:41-45`,`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:937-939`: notification preference default enabled=true.
- vNext now: `src/modules/people/profile-validation.ts:510-517`: notification preference absent entirely.
- Fix: Reinstate default-true notification opt-out applied to placement status events.

## G2-1-011-031  [P1] MISSING  facet F15  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobPreferences.java:41-45`: opt-out controls job/interview status email/SMS.
- vNext now: `src/modules/people/profile-validation.ts:510-517`: no notification bool; preference not passed to provider here.
- Fix: Enforce opt-out in job notification helper/dispatcher, not just UI checkbox.

## G2-5-019-028  [P1] MISSING  facet F04  effort L
- Legacy: Legacy hobbies and organizations arrays `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:208-216`
- vNext now: VNext profile strict schema excludes comparable arrays `src/modules/people/profile-validation.ts:443-465`
- Fix: Keep as archive/export or add editable sections.

## G2-5-019-071  [P1] MISSING  facet F23  effort L
- Legacy: Legacy hobbies/organizations/codingProfiles/permanent locality present `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:133-161,208-216`
- vNext now: VNext strict profileDocument omits direct equivalents `src/modules/people/profile-validation.ts:443-465`
- Fix: Document intentional retirement or add compatible data storage/export.
