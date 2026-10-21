# Work packet (wave 2): edit src/modules/people/profile-validation.ts (part 2 of 2)

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u019-learner.md, docs/audit/gap2/lane-1/job-preferences-dto.md

## G2-5-019-030  [P2] GAP  facet F04  effort M
- Legacy: Legacy metadata JSON arbitrary `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:225-228`
- vNext now: VNext structured strict profile document `src/modules/people/profile-validation.ts:443-465`
- Fix: Retain unmatched metadata as archive with audit.

## G2-5-019-036  [P2] GAP  facet F06  effort M
- Legacy: Legacy permanent city/state/postal separate `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:133-140`
- vNext now: VNext address schema has only shared city/state/postal `src/modules/people/profile-validation.ts:129-154`
- Fix: Reintroduce missing permanent location inputs.

## G2-5-019-037  [P2] GAP  facet F06  effort M
- Legacy: Legacy qualification JPA list no max30 annotation `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:178-181`
- vNext now: VNext max30 and strict year/grade education `src/modules/people/profile-validation.ts:272-318`
- Fix: Define overflow handling before user saves.

## G2-5-019-060  [P2] GAP  facet F18  effort S
- Legacy: Legacy About Me description and department `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:76-81`
- vNext now: VNext bio/headline and academic program `src/modules/people/profile-validation.ts:443-450`
- Fix: Preserve legacy copy and actual semantics where required.

## G2-1-011-041  [P3] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:925-939`: read excludes soft-deleted JobPreferences rows.
- vNext now: `src/modules/people/profile-validation.ts:510-517`: embedded document defaults, no soft-delete row status.
- Fix: Document soft-delete/backfill semantics; avoid reviving deleted prefs.

## G2-5-019-053  [P3] GAP  facet F13  effort S
- Legacy: Legacy nullable JSON/text values `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:79-101`
- vNext now: New strict schema defaults empty strings and arrays `src/modules/people/profile-validation.ts:24-25,443-465`
- Fix: Use consistent missing-value placeholders without losing null meaning.
