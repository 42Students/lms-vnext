# Work packet: edit src/app/(authenticated)/learn/profile/verification/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/profile-verification-controller.md

## G2-1-010-014  [P1] GAP  facet F04  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:120-141`: education snapshot qualification id/type/program/specialization/institution/year/grading/maxGrade/marksheet, plus resumeUrl.
- vNext now: `src/app/(authenticated)/learn/profile/verification/page.tsx:64-74`: user-facing missing checklist and upload metadata, no full submitted qualification snapshot.
- Fix: Add reviewable submitted-versus-current education evidence fields with signed access.

## G2-1-010-016  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:248-257`: note, submittedAt, verifiedAt, verifiedByName, decidedAt/ByName, submitted and verified snapshots, changedSinceVerification.
- vNext now: `src/app/(authenticated)/learn/profile/verification/page.tsx:46-63`: reason, decidedByName, verifiedAt, submittedAt, decidedAt, no full snapshots.
- Fix: Restore approved snapshot comparison and changed-since-verification notice.

## G2-1-010-027  [P1] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:169-185`: identity must have Aadhaar or PAN number+document; education needs 10th, 12th/diploma, degree, resume.
- vNext now: `src/app/(authenticated)/learn/profile/verification/page.tsx:64-74`,`src/modules/profile-verification/service.ts:86-106`: missing checklist, server snapshot submission plan.
- Fix: Compare each field-level requirement against private-object scan readiness and exact messages.
