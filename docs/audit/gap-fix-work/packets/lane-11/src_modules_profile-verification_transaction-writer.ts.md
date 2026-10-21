# Work packet: edit src/modules/profile-verification/transaction-writer.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/profile-verification-controller.md

## G2-1-010-038  [P1] GAP  facet F10  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:380-405`: verify promotes submitted_snapshot to verified_snapshot, academic scores, recalculates eligibility, records event, enqueues PROFILE_VERIFIED.
- vNext now: `src/modules/profile-verification/transaction-writer.ts:168-200`,`src/modules/profile-verification/service.ts:114-170`: versioned writer handles verified state and publication.
- Fix: Verify eligibility recalculation parity after education approval and notification outbox event.

## G2-1-010-039  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:409-425`: sendBack stores trimmed reason, chooses SENT_BACK vs VERIFIED, event+PROFILE_SENT_BACK.
- vNext now: `src/modules/profile-verification/transaction-writer.ts:168-223`: locked transition plus event/audit processing.
- Fix: Check notification dispatch + retained prior verified snapshot on update send-back.

## G2-1-010-041  [P1] GAP  facet F10  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:481-521`: Education verification writes converted percentages, CGPA, passing year and earned marks.
- vNext now: `src/modules/profile-verification/transaction-writer.ts:178-200`,`src/db/schema/profile-verification.ts:146-175`: academic publication/schema integration.
- Fix: Crosswalk earned marks, conversion rule, PG year and candidate eligibility event.

## G2-1-010-049  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:417-418`: sent-back UPDATE_PENDING becomes VERIFIED, first SUBMITTED becomes SENT_BACK.
- vNext now: `src/modules/profile-verification/transaction-writer.ts:168-177`: persisted review outcomes from transition planner.
- Fix: Assert sent-back updated proof remains verified on prior snapshot and note is visible.

## G2-1-010-075  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:481-521`: verified qualification marks written learner_academic_record, earned marks store.
- vNext now: `src/db/schema/profile-verification.ts:146-175`,`src/modules/profile-verification/transaction-writer.ts:178-200`: normalized verification academic marks snapshots.
- Fix: Crosswalk gradingType/maxGrade/raw grade/PG passingYear exactly; validate decimal conversion.
