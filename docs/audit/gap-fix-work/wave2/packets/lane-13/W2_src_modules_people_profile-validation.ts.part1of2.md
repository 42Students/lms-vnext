# Work packet (wave 2): edit src/modules/people/profile-validation.ts (part 1 of 2)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/job-preferences-dto.md, docs/audit/gap2/lane-1/l11-u031-cross-forms.md, docs/audit/gap2/lane-1/learner-profile-controller.md, docs/audit/gap2/lane-1/learner-profile.md, docs/audit/gap2/lane-3/qualification.md, docs/audit/gap2/lane-4/job-preferences-repository.md

## G2-1-011-006  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/profile/JobPreferencesDTO.java:10`: rolePreference nullable String.
- vNext now: `src/modules/people/profile-validation.ts:510-511`: rolePreferences array max20, each <=100 chars, default [].
- Fix: Support singular legacy migration into first array item without losing original.

## G2-1-011-007  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/profile/JobPreferencesDTO.java:11`: specificRolePreference String.
- vNext now: `src/modules/people/profile-validation.ts:512`: string trim max200 default blank.
- Fix: Preserve null versus explicit empty and legacy long values; disclose 200 cap.

## G2-1-011-008  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/profile/JobPreferencesDTO.java:12`: workShiftPreference unrestricted String.
- vNext now: `src/modules/people/profile-validation.ts:513`: enum blank/DAY/NIGHT/ROTATIONAL/FLEXIBLE.
- Fix: Map legacy `Day Shift`, `Night Shift`, `Remote` to valid enums; preserve unmapped value safely.

## G2-1-011-009  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/profile/JobPreferencesDTO.java:13`: preferredEmploymentCity String.
- vNext now: `src/modules/people/profile-validation.ts:514`: trimmed string max120.
- Fix: Map and validate old long/location values, including Remote.

## G2-1-011-010  [P2] MISSING  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/profile/JobPreferencesDTO.java:14`: examSlotPreference String with example Morning/Afternoon/Evening.
- vNext now: `src/modules/people/profile-validation.ts:510-517`: no examSlotPreference property.
- Fix: Persist exam slot enum and display learner-selected value.

## G2-1-011-012  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobPreferences.java:18-20`: one JobPreferences row per learner via unique learner_id.
- vNext now: `src/modules/people/profile-validation.ts:509-517`: one embedded jobPreferences JSON object per learner profile.
- Fix: Validate one learner-owned preference object and prevent cross-membership overwrite.

## G2-1-011-022  [P2] GAP  facet F10  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:924-940`: service reads soft-deleted-aware DB row, falls back to true notifications.
- vNext now: `src/modules/people/profile-validation.ts:510-517`: document validation defaults missing fields; no relational row.
- Fix: Create explicit migration/backfill for legacy job_preferences rows.

## G2-11-031-005  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about/personalDetails.js:101,111,124: placeholders Select Gender, Select date of birth, Select Blood Group.
- vNext now: src/modules/people/profile-validation.ts:156-187: enum/date typed schema; placeholder comes from caller.
- Fix: Restore legacy picker placeholders.

## G2-11-031-009  [P2] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about/contacts.js:59-67: primary mobile formatted +91-xxxxx-xxxxx.
- vNext now: src/modules/people/profile-validation.ts:51-61: phoneValue preserves typed number without display formatting.
- Fix: Format display in summary, avoid writing formatted string.

## G2-11-031-013  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/components/profile/about/personalDetails.js:13,108-115: DOB parses five formats but displays DD-MM-YYYY and stores YYYY-MM-DD.
- vNext now: src/modules/people/profile-validation.ts:75-95: accepts ISO YYYY-MM-DD only; date input default ISO.
- Fix: Render DD-MM-YYYY while storing ISO and preserving validation.

## G2-11-031-054  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/frontend/src/components/profile/about/contacts.js:31-42: separate primary mobile/contactPhone/contactMail legacy fields.
- vNext now: src/modules/people/profile-validation.ts:99-108: alternatePhone/contactEmail; primary stored identity users.phoneE164.
- Fix: Document old-to-new address/contacts crosswalk.

## G2-1-004-011  [P2] GAP  facet F04  effort S
- Legacy: `PersonalDetailsDTO.java:10-12` uses `dob` key.
- vNext now: `src/modules/people/profile-validation.ts:100-145` personal details in JSON document with different field structure.
- Fix: Map and validate `dob`→dateOfBirth with no silent loss.

## G2-1-004-018  [P2] GAP  facet F04  effort M
- Legacy: `LearnerProfileController.java:1081-1107` hobbies GET/PUT complete `List<HobbyDTO>`.
- vNext now: `profile-validation.ts:497-506` hobbies string array normalized case-insensitive unique.
- Fix: Migrate HobbyDTO records to strings without silent data loss.

## G2-1-004-044  [P2] MISSING  facet F12  effort M
- Legacy: `LearnerProfileServiceImpl.java:880-900` once-only videoIntro URL immutable.
- vNext now: `profile-validation.ts:454-521` has no self-edit videoIntro field.
- Fix: Either enforce one-time video flow or record deliberate retirement.

## G2-1-031-061  [P2] GAP  facet F22  effort L
- Legacy: docs/legacy-source/frontend/src/components/profile/about.js:143-160: old independent profile tables, many endpoints and attachments.
- vNext now: src/modules/people/profile-validation.ts:99-220 and learnerProfiles.profileDocument JSON schema: normalized structured section data.
- Fix: Produce section/field/file receipt crosswalk; no unapproved migration omissions.

## G2-3-017-007  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Qualification.java:18-33`
- vNext now: `src/db/schema/db04-profile-education-images.staged.ts:28-38`, `src/modules/people/profile-validation.ts:272-279`
- Fix: Legacy learnerId required numeric FK and educationType/institutionName required nullable other text; staged vNext UUID membership FK, educationType max120 and institutionName max300; live JSON document `institution` field. Define migration projection.

## G2-3-017-008  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Qualification.java:35-54`
- vNext now: `src/db/schema/db04-profile-education-images.staged.ts:39-49`, `src/modules/people/profile-validation.ts:279-300`
- Fix: Legacy years are optional strings, pursuing/recent nullable Booleans default false, grade/maxGrade optional; staged vNext int year and required grade/max and pursuing nonnull. Handle legacy partial qualifications without loss.

## G2-3-017-010  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Qualification.java:72-82`
- vNext now: `src/db/schema/db04-profile-education-images.staged.ts:50-52`, `src/modules/people/profile-validation.ts:300-313`
- Fix: Legacy qualifyingExam, examRank and arbitrary JSON examDetails; staged vNext has them but live schema only qualifyingExam+examDetails and not examRank. Preserve ranked legacy values and dynamic fields.

## G2-3-017-012  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/QualificationValidator.java:24-39`
- vNext now: `src/modules/people/profile-validation.ts:313-317`
- Fix: Legacy QualificationValidator maximum 20 per application; vNext learnerProfileEducationWriteSchema max30. Align intended cap per surface or document approved expansion.

## G2-3-017-028  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:115-149`
- vNext now: `src/modules/people/profile-validation.ts:272-313`
- Fix: Legacy cleanPlain strips HTML for structured text, cleanRich sanitizes description; vNext generic textValue Zod trims but does not provide exact legacy field sanitization. Preserve sanitization and escape before render.

## G2-3-017-031  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Qualification.java:22-54`
- vNext now: `src/modules/people/learner-education-picker-model.ts:9-24`, `src/modules/people/profile-validation.ts:272-313`
- Fix: Legacy educational levels include PhD in reference comments/config, vNext `LEARNER_EDUCATION_TYPES` excludes PhD. Reinstate allowed PhD/other configured levels.

## G2-3-017-032  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/QualificationValidator.java:24-69`
- vNext now: `src/modules/people/profile-validation.ts:313-317`
- Fix: Legacy primary true needs exactly one and accepts boolean or string true; vNext JSON schema no primary flag. Restore canonical boolean and exactly-one rules on relevant lists.

## G2-3-017-045  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/QualificationValidator.java:41-69`, `71-98`
- vNext now: `src/modules/people/profile-validation.ts:313-317`, `src/modules/people/learner-education-picker-model.ts:44-53`
- Fix: Legacy exactly-one primary is enforced on application qualification list; vNext 30-row schema lacks primary. Normalize legacy booleans before validation; prevent duplicate primaries across concurrent edits.

## G2-4-015-010  [P2] GAP  facet F04  effort M
- Legacy: Legacy rolePreference is singular nullable String. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobPreferences.java:22-23`)
- vNext now: New rolePreferences is array of max20 titles, 100 chars each. (`src/modules/people/profile-validation.ts:510-512`)
- Fix: Migrate singular legacy title into one array value without delimiter loss.

## G2-4-015-011  [P2] GAP  facet F04  effort M
- Legacy: Legacy specificRolePreference nullable unrestricted TEXT. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobPreferences.java:25-26`)
- vNext now: New trimmed string capped at 200 characters and default empty. (`src/modules/people/profile-validation.ts:512-517`)
- Fix: Preserve long/null historical values or document conversion failure.

## G2-4-015-012  [P2] GAP  facet F04  effort M
- Legacy: Legacy workShiftPreference arbitrary string including Remote. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobPreferences.java:28-29`)
- vNext now: New enum permits blank DAY NIGHT ROTATIONAL FLEXIBLE but not Remote. (`src/modules/people/profile-validation.ts:513-513`)
- Fix: Map old shift labels without losing Remote values.

## G2-4-015-013  [P2] GAP  facet F04  effort S
- Legacy: Legacy preferredEmploymentCity nullable String including Remote. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobPreferences.java:31-32`)
- vNext now: New max120 trimmed string default blank. (`src/modules/people/profile-validation.ts:514-517`)
- Fix: Handle overlong values and null versus empty display.

## G2-4-015-014  [P2] MISSING  facet F04  effort M
- Legacy: Legacy examSlotPreference Morning/Afternoon/Evening. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobPreferences.java:34-36`)
- vNext now: New strict jobPreferences schema excludes examSlotPreference. (`src/modules/people/profile-validation.ts:509-518`)
- Fix: Add field and migration with exact choices.

## G2-4-015-022  [P2] GAP  facet F06  effort M
- Legacy: Legacy GET no record returns null text preferences but notifications true. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:924-940`)
- vNext now: New default is empty strings/arrays and two true flags. (`src/modules/people/profile-validation.ts:515-518`; `src/modules/placements/candidate-preferences-service.ts:58-65`)
- Fix: Preserve null-versus-empty semantics for compatibility.

## G2-4-015-063  [P2] MISSING  facet F22  effort M
- Legacy: Legacy exam slot and PAP values persisted in table. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobPreferences.java:34-39`)
- vNext now: New typed schema excludes them and migration marks unmapped. (`src/modules/people/profile-validation.ts:509-518`; `scripts/migrate/nsrit/plan-placements.ts:1960-1960`)
- Fix: Preserve both in durable metadata and expose exam field in UI.

## G2-5-019-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy profile JSON arrays coexist with main learner fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:163-216`
- vNext now: VNext profileDocument JSONB validated sections `src/modules/people/profile-validation.ts:443-465`
- Fix: Map exact section order, visible cards and available arrays.

## G2-5-019-015  [P2] GAP  facet F04  effort M
- Legacy: Legacy description TEXT `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:79-81`
- vNext now: VNext bio max3000, headline max240 `src/modules/people/profile-validation.ts:443-447`
- Fix: Avoid truncating long biographies.

## G2-5-019-016  [P2] GAP  facet F04  effort M
- Legacy: Legacy gender,dob,bloodGroup free strings `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:83-91`
- vNext now: VNext strict gender/blood enums and ISO date `src/modules/people/profile-validation.ts:156-186`
- Fix: Normalize existing personal values and dates, report unmappable.

## G2-5-019-019  [P2] MISSING  facet F04  effort M
- Legacy: Legacy website denotes profile image `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:142-144`
- vNext now: VNext social schema no website/profile image `src/modules/people/profile-validation.ts:110-127`
- Fix: Add profile image receipt and correct old URL semantics.

## G2-5-019-020  [P2] GAP  facet F04  effort M
- Legacy: Legacy linkedIn/github/portfolio/twitter `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:146-156`
- vNext now: VNext validated URL socialProfiles JSON `src/modules/people/profile-validation.ts:110-127`
- Fix: Normalize legacy handles, preserve valid URLs.

## G2-5-019-021  [P2] MISSING  facet F04  effort M
- Legacy: Legacy codingProfiles map JSON `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:158-161`
- vNext now: VNext typed profile excludes coding platform map `src/modules/people/profile-validation.ts:443-465`
- Fix: Retain coding profiles with validated per-platform keys.

## G2-5-019-023  [P2] GAP  facet F04  effort M
- Legacy: Legacy language list JSON `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:168-171`
- vNext now: VNext language entries with UUID and proficiency enum `src/modules/people/profile-validation.ts:385-398`
- Fix: Migrate proficiency mappings preserving list and order.

## G2-5-019-024  [P2] GAP  facet F04  effort M
- Legacy: Legacy skills with proficiency `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:173-176`
- vNext now: VNext strict skill{name,proficiency}, max100 `src/modules/people/profile-validation.ts:320-334,460-463`
- Fix: Map skill identifiers/aliases/proficiency safely.

## G2-5-019-026  [P2] GAP  facet F04  effort M
- Legacy: Legacy certifications and achievements JSON `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:183-191`
- vNext now: VNext strict lists with date/year validation and caps `src/modules/people/profile-validation.ts:350-383`
- Fix: Map all keys and longer legacy values.

## G2-5-019-027  [P2] GAP  facet F04  effort L
- Legacy: Legacy experiences/projects/extracurricular JSON `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Learner.java:193-206`
- vNext now: VNext typed experience/project/activity models `src/modules/people/profile-validation.ts:221-270,336-348,400-411`
- Fix: Map all legacy structures before import.
