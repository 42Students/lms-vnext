# Work packet: edit src/modules/profile-verification/service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/profile-verification-controller.md

## G2-1-010-027  [P1] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:169-185`: identity must have Aadhaar or PAN number+document; education needs 10th, 12th/diploma, degree, resume.
- vNext now: `src/app/(authenticated)/learn/profile/verification/page.tsx:64-74`,`src/modules/profile-verification/service.ts:86-106`: missing checklist, server snapshot submission plan.
- Fix: Compare each field-level requirement against private-object scan readiness and exact messages.

## G2-1-010-038  [P1] GAP  facet F10  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:380-405`: verify promotes submitted_snapshot to verified_snapshot, academic scores, recalculates eligibility, records event, enqueues PROFILE_VERIFIED.
- vNext now: `src/modules/profile-verification/transaction-writer.ts:168-200`,`src/modules/profile-verification/service.ts:114-170`: versioned writer handles verified state and publication.
- Fix: Verify eligibility recalculation parity after education approval and notification outbox event.
