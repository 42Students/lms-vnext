# Work packet (wave 2): edit src/modules/people/learner-education-picker-model.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/qualification.md

## G2-3-017-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerProfileController.java:600-666`
- vNext now: `src/modules/people/learner-education-picker-model.ts:1-24`, `src/components/profile/learner-profile-workspace.tsx:71-83`
- Fix: Legacy exposes education/config, exam-configs, exam-config/{examCode}, grading-types and colleges-autocomplete endpoints; vNext education type/exam pickers use static lists and field controls. Restore dynamic source options with fallbacks.

## G2-3-017-013  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/profile/about/qualifications.js:122-204`
- vNext now: `src/components/profile/learner-profile-workspace.tsx:71-83`, `src/modules/people/learner-education-picker-model.ts:9-24`
- Fix: Legacy educationType drives program options and selecting program resets specialization; vNext generic fields and fixed type list with no dependent program picker. Restore reset behavior and available option filtering.

## G2-3-017-014  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/frontend/src/components/profile/about/qualifications.js:56-83`
- vNext now: `src/modules/people/learner-education-picker-model.ts:1-24`
- Fix: Legacy dropdowns fetched dynamically from EducationConfig, grading types and qualifying exam config; vNext hardcodes education type list 10th/12th/Diploma/UG/PG and suggestions. Reinstate configured options including PhD.

## G2-3-017-031  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Qualification.java:22-54`
- vNext now: `src/modules/people/learner-education-picker-model.ts:9-24`, `src/modules/people/profile-validation.ts:272-313`
- Fix: Legacy educational levels include PhD in reference comments/config, vNext `LEARNER_EDUCATION_TYPES` excludes PhD. Reinstate allowed PhD/other configured levels.

## G2-3-017-033  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/QualificationValidator.java:130-169`
- vNext now: `src/modules/people/learner-education-picker-model.ts:54-65`
- Fix: Legacy letter grades accepted verbatim, no numeric comparison; vNext schema Grade option bypasses numeric grade checks but maxGrade required. Make maxGrade optional for Grade if authorized.

## G2-3-017-034  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerProfileController.java:613-639`
- vNext now: `src/modules/people/learner-education-picker-model.ts:10-24`
- Fix: Legacy exam-config unknown code gives `Exam config not found for: {examCode}` 404; vNext static suggestions never request exam config so cannot show this error. Provide fallback and proper not-found UI.

## G2-3-017-042  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/QualificationValidator.java:59-98`
- vNext now: `src/modules/people/learner-education-picker-model.ts:35-53`
- Fix: Legacy error text refers `Exactly ONE qualification must have isRecentEducation = true` and pursuing may have future year; vNext `End year must be empty when currently pursuing` with no recent selector. Surface literal validation.

## G2-3-017-045  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/QualificationValidator.java:41-69`, `71-98`
- vNext now: `src/modules/people/profile-validation.ts:313-317`, `src/modules/people/learner-education-picker-model.ts:44-53`
- Fix: Legacy exactly-one primary is enforced on application qualification list; vNext 30-row schema lacks primary. Normalize legacy booleans before validation; prevent duplicate primaries across concurrent edits.

## G2-3-017-046  [P2] MISSING  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerProfileController.java:600-666`
- vNext now: `src/modules/people/learner-education-picker-model.ts:9-24`
- Fix: Legacy calls dynamic education/exam configs + colleges service, vNext hardcoded suggestions and no external config source consumption. Implement versioned server config read/caching.

## G2-3-017-050  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Qualification.java:35-39`
- vNext now: `src/db/schema/db04-profile-education-images.staged.ts:109-125`, `src/modules/people/learner-education-picker-model.ts:44-53`
- Fix: Legacy years stored strings and current/future pursuing endYear accepted, staged vNext integers range1900–2200 but live validator 1900–2100, endYear null pursuing. Align DB/API year bounds.
