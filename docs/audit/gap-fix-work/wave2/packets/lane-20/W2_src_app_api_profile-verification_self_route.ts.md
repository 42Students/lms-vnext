# Work packet (wave 2): edit src/app/api/profile-verification/self/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/profile-verification-controller.md

## G2-1-010-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/ProfileVerificationController.java:41-45`: learner GET /api/v1/profile/verification and POST /{section}/submit.
- vNext now: `src/app/(authenticated)/learn/profile/verification/page.tsx:18-20`,`src/app/api/profile-verification/self/route.ts:12-28`: server-view profile verification and POST /api/profile-verification/self.
- Fix: Document exact POST body/legacy path migration and self-view replacement.

## G2-1-010-023  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/ProfileVerificationController.java:44-45`: submit section path accepted without JSON body/version.
- vNext now: `src/app/api/profile-verification/self/route.ts:12-28`: strict request schema, expectedVersion optimistic token.
- Fix: Migrate section/expectedVersion, show reload on stale state.

## G2-1-010-065  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:294-295`: `Before sending:` joined missing fields; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:412`: `Say what needs to change`.
- vNext now: `src/app/api/profile-verification/self/route.ts:30-34`,`src/app/api/tpo/verification/review/route.ts:30-34`: structured error codes.
- Fix: Provide exact field-level legacy copy via mapped error codes.
