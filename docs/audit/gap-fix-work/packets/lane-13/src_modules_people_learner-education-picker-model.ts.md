# Work packet: edit src/modules/people/learner-education-picker-model.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/qualification.md

## G2-3-017-018  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/QualificationValidator.java:71-98`
- vNext now: `src/modules/people/learner-education-picker-model.ts:44-53`, `src/db/schema/db04-profile-education-images.staged.ts:123-125`
- Fix: Legacy `currently pursuing=true` permits null, blank or current/future endYear; vNext requires endYear completely empty. Align or document deliberate tighter rule with inline explanation.

## G2-3-017-019  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/QualificationValidator.java:130-169`
- vNext now: `src/modules/people/learner-education-picker-model.ts:54-65`
- Fix: Legacy percentage strips '%' and enforces numeric 0-100; CGPA out-of-range warns but is accepted; vNext strictly rejects CGPA outside0-10, Percentage outside0-100, requires maxGrade. Map old grade values and legacy warnings.

## G2-3-017-020  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/QualificationDTO.java:16-32`
- vNext now: `src/modules/people/profile-validation.ts:272-313`, `src/modules/people/learner-education-picker-model.ts:33-40`
- Fix: Legacy EducationDTO minimal required educationType/institutionName with optional gradingType/grade/maxGrade; vNext requires all grading fields. Add draft/backward-compatible partial records or owner-approved strictness.
