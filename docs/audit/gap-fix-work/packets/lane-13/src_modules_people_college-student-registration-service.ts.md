# Work packet: edit src/modules/people/college-student-registration-service.ts

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/superadmin-students.md, docs/audit/gap2/lane-5/u027-learner-controller.md

## G2-19-001-026  [P1] GAP  facet F06  effort M
- Legacy: Legacy register First/Last/Roll/Mobile/Program/Class all individually required `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1134-1170`,1191-1218
- vNext now: vNext required First/Last/Mobile/Program/Batch, Roll optional, Class optional `src/components/college/college-student-register-form.tsx:71-105`; `src/modules/people/college-student-registration-service.ts:14-25`
- Fix: Restore required Roll/Class parity or document the new batch-first enrollment policy as an intentional change.

## G2-19-001-047  [P1] GAP  facet F10  effort L
- Legacy: Legacy register POST `/api/v1/learner/register`, payload first_name,last_name,contact_mobile,contact_mail,roll_number,college_id,class_id,program_id,gender,dob,address `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:493-508`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:338-340`
- vNext now: vNext POST `/api/college/students/register` canonical membership + enrollment, uses displayName, phoneE164, programId, cohortId, optional sectionId `src/components/college/college-student-register-form.tsx:51-57`; `src/modules/people/college-student-registration-service.ts:38-93`
- Fix: Document field mapping and enrollment semantics; ensure required legacy class enrollment parity.

## G2-19-001-056  [P1] GAP  facet F12  effort M
- Legacy: Legacy registration and edit require Class, Program chosen from current college `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1191-1218`,1663-1690
- vNext now: vNext enrolls program/cohort with optional section; no first-class mandatory class `src/modules/people/college-student-registration-service.ts:14-25`,47-50,85-88
- Fix: Decide mandatory class parity; enforce on UI and server if required.

## G2-5-027-018  [P1] GAP  facet F04  effort M
- Legacy: Legacy register DTO stores first/last, roll, college, uniqueId, class, phone/mobile/mail, program, DOB and extensive profile fields. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LearnerDTO.java:14-40`
- vNext now: vNext initial registration uses displayName, phoneE164, email, program/cohort/section, roll, gender, DOB, address. `src/modules/people/college-student-registration-service.ts:14-25`
- Fix: Account for omitted legacy profile fields and preserve via profile editor or documented migration.

## G2-5-027-024  [P1] GAP  facet F06  effort M
- Legacy: Legacy learner form requires first_name only; DOB blank permitted, profile fields optional. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LearnerDTO.java:14-40`
- vNext now: vNext requires displayName>=2, E.164 phone, programId and cohortId with section optional. `src/modules/people/college-student-registration-service.ts:14-25`, `src/components/college/college-student-register-form.tsx:70-120`
- Fix: Document stricter onboarding prerequisites and support legitimate phone-missing learners if legacy accepted.

## G2-5-027-025  [P1] GAP  facet F06  effort M
- Legacy: Legacy single register validates selected class-program-college-organization match. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:338-391`
- vNext now: vNext requires acting college and later enrollment, optional class placement. `src/modules/people/college-student-registration-service.ts:29-49`
- Fix: Ensure program-cohort-section all resolve to active same-college objects before person creation.

## G2-5-027-029  [P1] GAP  facet F07  effort M
- Legacy: Legacy invalid class mismatch exact `Learner class must belong to the selected program`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:338-391`
- vNext now: vNext enrollment errors summarized `Program/batch enrollment failed...` after identity may already exist. `src/modules/people/college-student-registration-service.ts:45-52`
- Fix: Validate placement before provisioning and show exact offending selection.

## G2-5-027-042  [P1] GAP  facet F10  effort M
- Legacy: Legacy learnerService.register creates entity then audit LEARNER_CREATE. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:338-391`
- vNext now: vNext identity provision then enrollment/profile/section steps, partial failure can persist. `src/modules/people/college-student-registration-service.ts:38-93`
- Fix: Preflight all constraints before identity write; add idempotent repair on partial receipt.

## G2-5-027-081  [P1] GAP  facet F22  effort M
- Legacy: Legacy Learner entity centric integer ID and many profile fields. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LearnerDTO.java:14-40`
- vNext now: vNext UUID user/college membership + learnerProfiles JSON, academic enrollment separate. `src/db/schema/memberships.ts:17-65`, `src/modules/people/college-student-registration-service.ts:38-80`
- Fix: Write field-by-field migration map and preserve learner ID for bookmarks.

## G2-5-027-030  [P2] GAP  facet F07  effort M
- Legacy: Legacy first_name missing `first_name is required` and DOB example `2005-08-21`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LearnerDTO.java:14-32`
- vNext now: vNext uses `Name, phone, program and batch are required.` and Zod date string. `src/components/college/college-student-register-form.tsx:44-46`, `src/modules/people/college-student-registration-service.ts:14-24`
- Fix: Align field-specific and example DOB messages.

## G2-5-027-035  [P2] GAP  facet F08  effort M
- Legacy: Legacy single learner create returns `{status:OK,data:learner}`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:378-385`
- vNext now: vNext responds REGISTERED 201/PARTIAL 207 plus membership/enrollment IDs. `src/app/api/college/students/register/route.ts:13-15`, `src/modules/people/college-student-registration-service.ts:89-93`
- Fix: Preserve caller success semantics and partial-result acknowledgement.
