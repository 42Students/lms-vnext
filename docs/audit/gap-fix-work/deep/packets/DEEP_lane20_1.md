# Deep verification packet (rows that fast mode DEFERRED)

These rows were marked DEFERRED without being checked. Each row must now end as exactly one of:
- OK: vNext already matches the old LMS. Give EVIDENCE: the vNext file:line that implements it AND the legacy source file (docs/legacy-source/...) it matches.
- FIXED: you changed the code so it matches. Give the commit and file.

DEFERRED is NOT allowed. For each row: read its full text in the source packet named next to it, find the old behaviour in docs/legacy-source, find the vNext code, decide, and fix if needed.
Keep tests passing and TypeScript valid; never silence errors. Write one result line per row under Results, push, then tick this packet in your queue.

- [ ] G2-5-019-025  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_13.md)
- [ ] G2-11-020-054  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-5-019-040  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-5-019-045  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-5-019-064  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [x] G2-5-027-014  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [x] G2-5-027-018  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [ ] G2-5-027-019  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [x] G2-5-027-021  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)
- [x] G2-5-027-024  (source: docs/audit/gap-fix-work/verify2/packets/lane-13/W1_lane13_14.md)

## Results

- G2-5-027-021: FIXED `b86f68e` in `src/modules/people/college-role-directory-service.ts:686-702`: restored legacy page-size default 25, retaining authorized college-only search over names, email, phone, roll, registration, unique ID and class (`src/modules/people/college-role-directory-service.ts:193-230,310-319`). Legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:535-587` specifies default 25. Class-ID substring equivalence and unrestricted legacy unpaged lists are intentionally not asserted.

- G2-5-027-018: OK — registration profile-field crosswalk and explicit vNext onboarding differences in `src/modules/people/college-student-registration-service.ts:32-38`, with DOB and personal profile persistence at `src/modules/people/college-student-registration-service.ts:95-120`, against legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LearnerDTO.java:14-40`. The phone requirement remains a documented vNext policy difference, not claimed legacy parity.

- G2-5-027-014: OK — legacy learner hierarchy-enriched detail `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:589-609` has a documented membership, contact, roll/unique, DOB and scoped hierarchy field crosswalk at `src/modules/people/college-role-directory-service.ts:43-55`. This establishes the requested parity map, not proof that every UI renders the fields.

- G2-5-027-024: FIXED `63570e2d50a` in `src/components/college/college-student-register-form.tsx`: last name and roll number are now optional rather than erroneously rejected by client-side validation, matching nullable legacy `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LearnerDTO.java:14-40` and the already-optional server roll number in `src/modules/people/college-student-registration-service.ts:20-30`. vNext requires an OTP-capable phone and an active program/cohort; these stricter onboarding prerequisites are documented in `src/modules/people/college-student-registration-service.ts:32-42` and visible in the form. Missing-phone onboarding remains unsupported by the canonical identity service and is not claimed as legacy parity.
