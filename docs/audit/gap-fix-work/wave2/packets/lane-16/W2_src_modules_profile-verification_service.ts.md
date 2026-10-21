# Work packet (wave 2): edit src/modules/profile-verification/service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/profile-verification-controller.md

## G2-1-010-044  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:70-81`: superadmin selects college; admin own college; TPO allowed only when tpoCanVerify, else exact 403 reason.
- vNext now: `src/modules/placements/tpo-verification-queue-service.ts:24-38`,`src/modules/profile-verification/service.ts:136-158`: membership permissions, persisted TPO grant and setting.
- Fix: Document extra persisted grant policy and exact denial copy.

## G2-1-010-048  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:299-304`: verified update changed -> UPDATE_PENDING; unchanged update rejected.
- vNext now: `src/modules/profile-verification/service.ts:86-112`: verification plan transition with version token.
- Fix: Test update-pending lifecycle including unchanged attempted submission.
