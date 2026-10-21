# Work packet (wave 2): edit src/app/(authenticated)/learn/profile/verification/page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/profile-verification-controller.md

## G2-1-010-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/ProfileVerificationController.java:41-45`: learner GET /api/v1/profile/verification and POST /{section}/submit.
- vNext now: `src/app/(authenticated)/learn/profile/verification/page.tsx:18-20`,`src/app/api/profile-verification/self/route.ts:12-28`: server-view profile verification and POST /api/profile-verification/self.
- Fix: Document exact POST body/legacy path migration and self-view replacement.

## G2-1-010-009  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:237-261`: learner section state has section, state, missing/current/verified/submitted.
- vNext now: `src/app/(authenticated)/learn/profile/verification/page.tsx:40-79`: StatusBadge, missing checklist, timestamps, reason, edit/submit/withdraw.
- Fix: Surface approved snapshot/current-versus-verified comparison in a read-only detail drawer.

## G2-1-010-015  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:145-155`: identity snapshot masks Aadhaar/PAN, includes associated document paths.
- vNext now: `src/app/(authenticated)/learn/profile/verification/page.tsx:31-36`,`src/app/(authenticated)/learn/profile/verification/page.tsx:71-74`: counts and hints, no masked identity numbers on verification page.
- Fix: Render masked last-four identity values, never raw ID, with document readiness.

## G2-1-010-052  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:237-261`: absent row returns READY or INCOMPLETE based on current snapshot.
- vNext now: `src/app/(authenticated)/learn/profile/verification/page.tsx:21-24`,`src/app/(authenticated)/learn/profile/verification/page.tsx:44-45`: NOT_SUBMITTED label Incomplete or Ready to send.
- Fix: Verify empty ready-but-unsent state against legacy READY, not VERIFIED.
