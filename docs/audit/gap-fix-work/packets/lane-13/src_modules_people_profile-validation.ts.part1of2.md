# Work packet: edit src/modules/people/profile-validation.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/job-preferences-dto.md, docs/audit/gap2/lane-1/l11-u031-cross-forms.md, docs/audit/gap2/lane-3/qualification.md, docs/audit/gap2/lane-4/job-preferences-repository.md

## G2-1-011-015  [P1] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:955-971`: only non-null properties overwritten, Strings trimmed.
- vNext now: `src/modules/people/profile-validation.ts:510-517`: missing props default to empty/[], strict object.
- Fix: Avoid accidental clearing of omitted fields when migrating partial updates.

## G2-1-011-018  [P1] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:925-938`: missing preferences returns mostly null with notification true.
- vNext now: `src/modules/people/profile-validation.ts:515-517`: empty default for four fields, not notification bool.
- Fix: Honor true opt-out default for existing/new learners.

## G2-1-011-037  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:955-971`: null means no change, empty string writes blank after trim.
- vNext now: `src/modules/people/profile-validation.ts:510-517`: omitted fields default to blank, role array default empty.
- Fix: Test nullable legacy patch fields and empty-vs-missing round trip.

## G2-1-011-038  [P1] MISSING  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobPreferences.java:44-45`: Boolean default true even if absent in stored legacy row.
- vNext now: `src/modules/people/profile-validation.ts:510-517`: no boolean in current typed object.
- Fix: Prevent notification opt-out silently resetting when migrating profile.

## G2-1-011-040  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobPreferences.java:12-45`: job_preferences relational table unique learner_id; six DTO fields plus papInterest in entity.
- vNext now: `src/modules/people/profile-validation.ts:510-517`: profile JSON stores four keys, no exam slot/job notifications; papInterest also absent.
- Fix: Migrate all retained fields; explicitly decide papInterest ownership vs deliberate retirement.

## G2-1-011-044  [P1] GAP  facet F23  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/profile/JobPreferencesDTO.java:14-15`: exam slot and notification opt-out present in old DTO.
- vNext now: `src/modules/people/profile-validation.ts:510-517`: intentionally incomplete mapped schema has only four fields.
- Fix: Close two omitted fields and provider behavior before parity sign-off.

## G2-11-031-014  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/components/profile/about/contacts.js:70-85: primary required exactly 10 numeric digits, alternate 10-15.
- vNext now: src/modules/people/profile-validation.ts:51-61: optional phone accepts + plus 8-21 characters.
- Fix: Implement field-specific mobile/alternate validator.

## G2-11-031-015  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/components/profile/about/contacts.js:171-190: alternate phone cannot equal primary mobile.
- vNext now: src/modules/people/profile-validation.ts:99-108: contactsSchema only alternatePhone/contactEmail, no primary comparison.
- Fix: Validate against verified primary on server and client.

## G2-11-031-034  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/components/profile/about/contacts.js:59-85: 10-digit phone and 10-15 alternate.
- vNext now: src/modules/people/profile-validation.ts:51-61: general phone regex optional.
- Fix: Enforce role/field-specific phone limit.

## G2-11-031-051  [P1] GAP  facet F20  effort M
- Legacy: docs/legacy-source/frontend/src/components/profile/about/contacts.js:176-188: alternate cannot equal primary.
- vNext now: src/modules/people/profile-validation.ts:99-108: primary unavailable in schema.
- Fix: Validate cross-field equality.

## G2-3-017-009  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Qualification.java:56-70`
- vNext now: `src/db/schema/db04-profile-education-images.staged.ts:54-60`, `src/modules/people/profile-validation.ts:272-313`
- Fix: Legacy degree/field/score/description/certificateUpload preserved for backward compatibility; staged schema has legacy fields, but live vNext strict document education schema omits them. Map historic read-only fields and upload references without discarding.

## G2-3-017-016  [P1] MISSING  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Qualification.java:53-54`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/QualificationValidator.java:41-69`
- vNext now: `src/modules/people/profile-validation.ts:272-313`, `src/components/profile/learner-profile-workspace.tsx:478-511`
- Fix: Legacy stores isRecentEducation and QualificationValidator requires exactly one primary in relevant application qualification lists; live vNext educationSchema lacks isRecentEducation and no selection/uniqueness. Add primary/recent selector and invariant where applicable.

## G2-3-017-017  [P1] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/QualificationValidator.java:27-69`
- vNext now: `src/modules/people/profile-validation.ts:313-317`, `src/db/schema/db04-profile-education-images.staged.ts:74-78`
- Fix: Legacy validates exactly one recent=true for application qualification set and gives explicit missing/multiple error; staged DB only at-most-one via partial unique index and live schema none. Enforce exactly-one on relevant writes without rejecting empty optional profile incorrectly.

## G2-3-017-027  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:124-149`
- vNext now: `src/modules/people/profile-validation.ts:272-313`
- Fix: Legacy converts EducationDTO into qualification entity and preserves legacy fields+certificateUpload, also enforces own marksheet reference. VNext education JSON strict schema rejects these fields and no matching owned certificate reference. Add secured document field migration.

## G2-3-017-036  [P1] MISSING  facet F14  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Qualification.java:69-70`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:147-149`
- vNext now: `src/db/schema/db04-profile-education-images.staged.ts:134-176`, `src/modules/people/profile-validation.ts:272-313`
- Fix: Legacy qualification contains certificateUpload owned storage key; vNext staged learnerProfileEducationDocuments supports receipt FK but is not active and live education lacks certificate field. Implement signed grant/upload with ownership and verified receipts.

## G2-3-017-048  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Qualification.java:16-83`, `docs/legacy-source/backend/src/main/resources/db/migration/V26__add_max_grade_to_qualification.sql:1-6`
- vNext now: `src/db/schema/db04-profile-education-images.staged.ts:28-130`, `src/modules/people/profile-validation.ts:272-313`
- Fix: Legacy normalized `qualification` table includes varchar max_grade, legacy fields and JSON examDetails, learner FK and isDeleted; vNext normalized DB04 education schema is staged-only while active profile uses JSON collection. Register schema or document durable JSON model and non-lossy migration.

## G2-3-017-049  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Qualification.java:53-54`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/QualificationValidator.java:41-69`
- vNext now: `src/db/schema/db04-profile-education-images.staged.ts:74-78`, `src/modules/people/profile-validation.ts:272-313`
- Fix: Legacy application qualification exactly-one recent; staged vNext partial unique only at most one recent, active profile schema has no flag. Add primary flag representation plus conditional constraint.

## G2-3-017-051  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:89-149`
- vNext now: `src/modules/people/profile-validation.ts:272-313`, `src/db/schema/db04-profile-education-images.staged.ts:2-6`
- Fix: Historical degree/field/score/description/certificateUpload and examRank may vanish when education is edited because active strict schema omits them; deliberate exclusion not documented. Build read/write compatibility view before activating schema.

## G2-4-015-033  [P1] GAP  facet F10  effort L
- Legacy: Legacy GET reads JobPreferencesRepository and serializes six DTO properties. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerProfileController.java:1177-1186`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:924-940`)
- vNext now: New read is separate profile JSON and placement candidate preferences, not six-field DTO. (`src/modules/people/profile-validation.ts:509-518`; `src/modules/placements/candidate-preferences-service.ts:42-66`)
- Fix: Provide complete six-field read model or migrate all readers.

## G2-4-015-062  [P1] GAP  facet F22  effort L
- Legacy: Legacy single job_preferences table unique learner ID nullable strings and boolean true. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobPreferences.java:10-45`)
- vNext now: New profileDocument JSON plus placement_candidate_preferences keyed by UUID. (`src/modules/people/profile-validation.ts:509-518`; `src/db/schema/placements.ts:295-341`)
- Fix: Document full migration, uniqueness and data ownership map.
