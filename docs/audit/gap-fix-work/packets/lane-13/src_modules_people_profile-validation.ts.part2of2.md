# Work packet: edit src/modules/people/profile-validation.ts (part 2 of 2)

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u019-learner.md, docs/audit/gap2/lane-6/job-preferences.md, docs/audit/gap2/lane-1/job-preferences-dto.md, docs/audit/gap2/lane-1/l11-u031-cross-forms.md, docs/audit/gap2/lane-3/qualification.md, docs/audit/gap2/lane-4/job-preferences-repository.md

## G2-5-019-017  [P1] GAP  facet F04  effort L
- Legacy: Legacy contactPhone/contactMobile/contactMail on learner `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:93-101`
- vNext now: VNext canonical phoneE164/email plus profile alternatePhone/contactEmail `src/db/schema/users.ts:16-21` `src/modules/people/profile-validation.ts:99-108`
- Fix: Preserve distinction primary/alternate and verify consent masking.

## G2-5-019-018  [P1] MISSING  facet F04  effort M
- Legacy: Legacy address/city/state/pincode and current+permanent variants `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:103-140`
- vNext now: VNext address schema lacks permanent city/state/postal `src/modules/people/profile-validation.ts:129-154`
- Fix: Add permanent location and shared-field migration.

## G2-5-019-022  [P1] GAP  facet F04  effort L
- Legacy: Legacy identity JSON stored in learner `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:163-166`
- vNext now: VNext schema PAN/Aadhaar typed but identity save blocked `src/modules/people/profile-validation.ts:189-219` `src/modules/people/learner-profile-document-edit-service.ts:13-17`
- Fix: Provide encrypted/receipt-backed identity storage, not raw profile JSON.

## G2-5-019-025  [P1] GAP  facet F04  effort L
- Legacy: Legacy Qualification separate orphan-removing relation `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:178-181`
- vNext now: VNext education embedded JSON array max30 `src/modules/people/profile-validation.ts:272-318`
- Fix: Migrate qualifications with stable IDs and lifecycle fidelity.

## G2-6-019-048  [P1] GAP  facet F22  effort L
- Legacy: Legacy table job_preferences extends BaseModel int PK, learner_id unique, role/specific/shift/city/exam/PAP/notification fields (JobPreferences.java:10-45; BaseModel.java:22-37).
- vNext now: VNext stores role/specific/shift/city in learner_profiles.profile_document JSON and placement choices separately, no direct job_preferences table (profiles.ts:15-31; placements.ts:295-370; profile-validation.ts:510-518).
- Fix: Create complete 1:1 field ownership map with PAP/exam/notification retention; add migration transform only if data import requested.

## G2-1-011-017  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/profile/JobPreferencesDTO.java:7-15`: no @NotBlank, @Size or allowed-value validators on six fields.
- vNext now: `src/modules/people/profile-validation.ts:510-514`: roles max20 each max100, detail max200, city max120, work shift enum.
- Fix: Implement exact inline length and option feedback, with migration rules.

## G2-11-031-021  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about/contacts.js:72-85: client error Primary mobile number is required or Phone number must be 10-15 digits.
- vNext now: src/modules/people/profile-validation.ts:59: generic 'Use a valid phone number'.
- Fix: Render field-specific copy.

## G2-3-017-020  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/QualificationDTO.java:16-32`
- vNext now: `src/modules/people/profile-validation.ts:272-313`, `src/modules/people/learner-education-picker-model.ts:33-40`
- Fix: Legacy EducationDTO minimal required educationType/institutionName with optional gradingType/grade/maxGrade; vNext requires all grading fields. Add draft/backward-compatible partial records or owner-approved strictness.

## G2-4-015-024  [P2] GAP  facet F07  effort M
- Legacy: Legacy DTO has no field size, regex or shift enum constraints. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/profile/JobPreferencesDTO.java:7-16`)
- vNext now: New Zod trims/caps strings and restricts shift to enum values. (`src/modules/people/profile-validation.ts:510-518`)
- Fix: Map old inputs to new validation without silent rejection.

## G2-11-031-022  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about/contacts.js:91-96: 'Enter a valid email address'.
- vNext now: src/modules/people/profile-validation.ts:71: 'Use a valid email'.
- Fix: Mirror literal error wording.
