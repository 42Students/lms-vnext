# Work packet: edit src/db/schema/profile-verification.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/profile-verification-controller.md, docs/audit/gap2/lane-3/l11-u025-tpo-verification.md, docs/audit/gap2/lane-9/college-admin-verification.md

## G2-1-010-041  [P1] GAP  facet F10  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:481-521`: Education verification writes converted percentages, CGPA, passing year and earned marks.
- vNext now: `src/modules/profile-verification/transaction-writer.ts:178-200`,`src/db/schema/profile-verification.ts:146-175`: academic publication/schema integration.
- Fix: Crosswalk earned marks, conversion rule, PG year and candidate eligibility event.

## G2-1-010-075  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:481-521`: verified qualification marks written learner_academic_record, earned marks store.
- vNext now: `src/db/schema/profile-verification.ts:146-175`,`src/modules/profile-verification/transaction-writer.ts:178-200`: normalized verification academic marks snapshots.
- Fix: Crosswalk gradingType/maxGrade/raw grade/PG passingYear exactly; validate decimal conversion.

## G2-11-025-083  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:69-95`
- vNext now: `src/db/schema/profile-verification.ts:1-160`
- Fix: Legacy studentId numeric and mixed Education rows/Identity nested fields; vNext UUID learnerMembershipId + profile_verifications snapshots/section/status + document manifest. Plan field/state crosswalk.

## G2-9-020-066  [P1] GAP  facet F22  effort L
- Legacy: Legacy entity access via /api/v1/profile-verification and evidence links `docs/legacy-source/frontend/src/api/Services/VerificationService.js:1-26`
- vNext now: New profile_verifications per learnerMembershipId + section, rowVersion and snapshots `src/db/schema/profile-verification.ts:9-41`
- Fix: Document legacy ID -> membership mapping and compare section status transitions.

## G2-9-020-067  [P1] GAP  facet F22  effort L
- Legacy: Legacy audit timeline action name, note and timestamps `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:450-455`
- vNext now: New profile_verification_events action/actor/priorVersion/nextVersion `src/db/schema/profile-verification.ts:92-117`
- Fix: Check migration/history mapping preserves all actions and display.
