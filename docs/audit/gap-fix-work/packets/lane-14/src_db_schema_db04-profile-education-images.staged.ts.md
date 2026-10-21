# Work packet: edit src/db/schema/db04-profile-education-images.staged.ts

19 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u019-image-entry.md, docs/audit/gap2/lane-3/qualification.md, docs/audit/gap2/lane-20/student-image-controller.md, docs/audit/gap2/lane-20/student-image.md

## G2-16-019-020  [P1] GAP  facet F14  effort L
- Legacy: StudentImageServiceImpl.java:66-90 stores URL refs no image binary.
- vNext now: db04-profile-education-images.staged.ts:188-191 receiptId.
- Fix: Connect private upload completion and read signed URLs.

## G2-16-019-028  [P1] GAP  facet F21  effort L
- Legacy: StudentImageController.java:33-35,71-89 ContentUrlValidator allowlisted R2.
- vNext now: db04-profile-education-images.staged.ts:188-212 receipt-owned private storage.
- Fix: Wire signed storage+receipt verification and scanning.

## G2-3-017-009  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Qualification.java:56-70`
- vNext now: `src/db/schema/db04-profile-education-images.staged.ts:54-60`, `src/modules/people/profile-validation.ts:272-313`
- Fix: Legacy degree/field/score/description/certificateUpload preserved for backward compatibility; staged schema has legacy fields, but live vNext strict document education schema omits them. Map historic read-only fields and upload references without discarding.

## G2-3-017-017  [P1] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/QualificationValidator.java:27-69`
- vNext now: `src/modules/people/profile-validation.ts:313-317`, `src/db/schema/db04-profile-education-images.staged.ts:74-78`
- Fix: Legacy validates exactly one recent=true for application qualification set and gives explicit missing/multiple error; staged DB only at-most-one via partial unique index and live schema none. Enforce exactly-one on relevant writes without rejecting empty optional profile incorrectly.

## G2-3-017-030  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerProfileServiceImpl.java:147-149`
- vNext now: `src/db/schema/db04-profile-education-images.staged.ts:134-176`
- Fix: Legacy marksheet certificateUpload requires learner-owned reference before persistence; staged vNext education document FK to receipt is not registered. Prevent unverified certificate URLs in active document schema.

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

## G2-16-019-010  [P2] MISSING  facet F07  effort S
- Legacy: StudentImageServiceImpl.java:70-80 errors `Image URL cannot be empty`, `must be valid https URL`.
- vNext now: db04-profile-education-images.staged.ts:1-8 no runtime validator.
- Fix: Return stable field errors for malformed refs.

## G2-16-019-011  [P2] GAP  facet F07  effort S
- Legacy: StudentImageController.java:71-89 allowed storage/learner folder error copy.
- vNext now: db04-profile-education-images.staged.ts:200-212 owner FK proposed.
- Fix: Map illegal image owner errors before FK.

## G2-20-024-008  [P2] MISSING  facet F07  effort S
- Legacy: Exact 'imageUrls cannot contain empty values' `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentImageController.java:64-67`
- vNext now: No runtime validator in staged schema `src/db/schema/db04-profile-education-images.staged.ts:1-8`
- Fix: Restore exact field error

## G2-20-024-009  [P2] MISSING  facet F07  effort S
- Legacy: Exact invalid storage URL/reference/folder messages `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentImageController.java:71-89`
- vNext now: No runtime API responses `src/db/schema/db04-profile-education-images.staged.ts:1-8`
- Fix: Map distinct error codes

## G2-20-024-010  [P2] MISSING  facet F08  effort S
- Legacy: Create returns DTO, deactivate exact 'Image deactivated successfully.' `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentImageController.java:109-110,150-155`
- vNext now: No matching successful image endpoint `src/db/schema/db04-profile-education-images.staged.ts:1-8`
- Fix: Restore action success notice

## G2-20-015-013  [P2] MISSING  facet F07  effort S
- Legacy: Exact invalid error 'Image URL is not from allowed storage' `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentImageController.java:71-79`
- vNext now: No runtime image-validation copy; staged receipt FK would reject mismatched owner `src/db/schema/db04-profile-education-images.staged.ts:200-212`
- Fix: Map typed 400 error for untrusted storage refs before database FK error

## G2-20-015-014  [P2] GAP  facet F07  effort S
- Legacy: Exact error 'Image must be uploaded under your profile-images folder' `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentImageController.java:86-89`
- vNext now: New receipt owner composite FK, no corresponding validation copy `src/db/schema/db04-profile-education-images.staged.ts:200-212`
- Fix: Return field-specific ownership error instead of DB exception

## G2-20-015-015  [P2] MISSING  facet F08  effort S
- Legacy: On creation returns StudentImageResponseDTO direct (not general Response) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentImageController.java:109-110`
- vNext now: No deployed endpoint; response shape unimplemented `src/db/schema/db04-profile-education-images.staged.ts:1-8`
- Fix: Return stable {learnerId,images[]} and UI success feedback

## G2-3-017-018  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/QualificationValidator.java:71-98`
- vNext now: `src/modules/people/learner-education-picker-model.ts:44-53`, `src/db/schema/db04-profile-education-images.staged.ts:123-125`
- Fix: Legacy `currently pursuing=true` permits null, blank or current/future endYear; vNext requires endYear completely empty. Align or document deliberate tighter rule with inline explanation.

## G2-16-019-012  [P3] MISSING  facet F08  effort S
- Legacy: StudentImageController.java:150-154 `Image deactivated successfully.`.
- vNext now: db04-profile-education-images.staged.ts:192-198 deactivatedAt only.
- Fix: Emit equivalent API result and UI success message.
