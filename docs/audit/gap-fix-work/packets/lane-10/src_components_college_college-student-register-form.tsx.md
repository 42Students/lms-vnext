# Work packet: edit src/components/college/college-student-register-form.tsx

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/super-admin-students.md, docs/audit/gap2/lane-15/l18-u031-people-management.md, docs/audit/gap2/lane-19/superadmin-students.md, docs/audit/gap2/lane-5/u027-learner-controller.md

## G2-14-002-032  [P1] GAP  facet F06  effort S
- Legacy: Legacy Roll Number required; vNext Roll Number optional input — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1153-1160`
- vNext now: `src/components/college/college-student-register-form.tsx:85-86`
- Fix: Require roll with server validation and Enter the roll number

## G2-14-002-034  [P1] GAP  facet F06  effort M
- Legacy: Legacy Program & Class mandatory, no Batch field; vNext Batch required, Class optional — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1190-1223`
- vNext now: `src/components/college/college-student-register-form.tsx:88-107`
- Fix: Require class or explicitly document new batch placement policy

## G2-14-002-053  [P1] GAP  facet F10  effort M
- Legacy: Legacy learner register POST /api/v1/learner/register and LEARNER_CREATE audit; vNext POST /api/college/students/register — `docs/legacy-source/frontend/src/api/Services/AdminService.js:257-259`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:338-383`
- vNext now: `src/components/college/college-student-register-form.tsx:42-63`
- Fix: Preserve actor audit, identity/enrollment payload and selected-college security

## G2-18-031-025  [P1] GAP  facet F06  effort M
- Legacy: Legacy Student register requires First Name Last Name Roll Number Mobile (10-digit) Program and Class, optional Email/Gender/DOB/Address; Students.js:1134-1248
- vNext now: vNext CollegeStudentRegisterForm requires names, phone, Program+Batch; Roll max128 optional and Class optional, optional demographic details collapsed; college-student-register-form.tsx:42-46,71-123
- Fix: Decide required Roll/Class equivalence; for legacy route enforce required when academic policy demands, show inline field errors

## G2-18-031-041  [P1] GAP  facet F10  effort L
- Legacy: Legacy learner POST /register, /bulk-validate, /bulk-register, /bulk-imports and undo, PUT /update/{id}, DELETE /delete/{id}; LearnerController.java:338-465,1065-1141
- vNext now: vNext POST /api/people/onboard, /api/people/student-import PREVIEW/IMPORT, /api/people/{membershipId} profile/lifecycle PATCH; college-student-register-form.tsx:42-69;college-student-csv-import.tsx:42-58;api/people/[membershipId]/lifecycle/route.ts:15-49
- Fix: Write route/payload/status migration sheet and explicitly resolve old undo and hard-delete APIs, no unsafe replacement

## G2-19-001-026  [P1] GAP  facet F06  effort M
- Legacy: Legacy register First/Last/Roll/Mobile/Program/Class all individually required `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1134-1170`,1191-1218
- vNext now: vNext required First/Last/Mobile/Program/Batch, Roll optional, Class optional `src/components/college/college-student-register-form.tsx:71-105`; `src/modules/people/college-student-registration-service.ts:14-25`
- Fix: Restore required Roll/Class parity or document the new batch-first enrollment policy as an intentional change.

## G2-19-001-047  [P1] GAP  facet F10  effort L
- Legacy: Legacy register POST `/api/v1/learner/register`, payload first_name,last_name,contact_mobile,contact_mail,roll_number,college_id,class_id,program_id,gender,dob,address `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:493-508`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:338-340`
- vNext now: vNext POST `/api/college/students/register` canonical membership + enrollment, uses displayName, phoneE164, programId, cohortId, optional sectionId `src/components/college/college-student-register-form.tsx:51-57`; `src/modules/people/college-student-registration-service.ts:38-93`
- Fix: Document field mapping and enrollment semantics; ensure required legacy class enrollment parity.

## G2-5-027-024  [P1] GAP  facet F06  effort M
- Legacy: Legacy learner form requires first_name only; DOB blank permitted, profile fields optional. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LearnerDTO.java:14-40`
- vNext now: vNext requires displayName>=2, E.164 phone, programId and cohortId with section optional. `src/modules/people/college-student-registration-service.ts:14-25`, `src/components/college/college-student-register-form.tsx:70-120`
- Fix: Document stricter onboarding prerequisites and support legitimate phone-missing learners if legacy accepted.

## G2-14-002-039  [P2] GAP  facet F07  effort M
- Legacy: Legacy Form errors Enter the mobile number / Mobile number must be 10 digits / Choose a program/class; vNext native messages — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1163-1171,1190-1223`
- vNext now: `src/components/college/college-student-register-form.tsx:77-107`
- Fix: Restore exact field validations in UI and service

## G2-18-031-031  [P2] GAP  facet F07  effort S
- Legacy: Legacy student exact required messages Enter the first name/last name/roll number, Mobile number must be 10 digits, Choose a program/class; Students.js:1134-1221
- vNext now: vNext generic banner Name, phone, program and batch are required. plus mobile error, browser required attributes; college-student-register-form.tsx:42-46,71-100
- Fix: Show same field-level errors under each legacy required input instead of only banner

## G2-18-031-035  [P2] GAP  facet F08  effort S
- Legacy: Legacy student register/update/delete toasts Student registered successfully! They can now login with their mobile number./Student updated successfully!/Student deleted successfully!; Students.js:485-589
- vNext now: vNext registration returns registered/partial Alert, scoped lifecycle inline notices, no hard-delete toast; college-student-register-form.tsx:52-69,124-130;scoped-membership-lifecycle-actions.tsx:29-32
- Fix: Use exact legacy copy for equivalent successful actions; retain PARTIAL warning as new safety state

## G2-19-001-034  [P2] GAP  facet F07  effort M
- Legacy: Legacy per-field validation copy `Enter the first name`, `Enter the last name`, `Enter the roll number`, `Enter the mobile number` `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1134-1167`
- vNext now: vNext native required checks plus aggregate `Name, phone, program and batch are required.` `src/components/college/college-student-register-form.tsx:44-47`,71-97
- Fix: Add field-level legacy messages (and required indication) without losing strict API validation.

## G2-19-001-036  [P2] GAP  facet F07  effort S
- Legacy: Legacy registration failure toast prefixed `Failed to register student: ` plus backend reason `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:512-516`
- vNext now: vNext inline alert raw caught error or `Registration failed` `src/components/college/college-student-register-form.tsx:67`,128-130
- Fix: Display exact failure text in legacy-equivalent feedback location.

## G2-5-027-030  [P2] GAP  facet F07  effort M
- Legacy: Legacy first_name missing `first_name is required` and DOB example `2005-08-21`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LearnerDTO.java:14-32`
- vNext now: vNext uses `Name, phone, program and batch are required.` and Zod date string. `src/components/college/college-student-register-form.tsx:44-46`, `src/modules/people/college-student-registration-service.ts:14-24`
- Fix: Align field-specific and example DOB messages.

## G2-19-001-038  [P3] GAP  facet F08  effort S
- Legacy: Legacy single registration success toast `Student registered successfully! They can now login with their mobile number.` `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:508-511`
- vNext now: vNext displays identical success wording in inline Alert `src/components/college/college-student-register-form.tsx:58-66`,128
- Fix: Match toast placement/duration; copy already matches.
