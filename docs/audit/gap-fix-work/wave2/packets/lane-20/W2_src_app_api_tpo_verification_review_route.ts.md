# Work packet (wave 2): edit src/app/api/tpo/verification/review/route.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/profile-verification-controller.md

## G2-1-010-004  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/ProfileVerificationController.java:70-81`: POST verify/send-back decision routes, path learnerId and section.
- vNext now: `src/app/api/tpo/verification/review/route.ts:13-26`,`src/app/api/college/verification/review/route.ts:12-25`: POST staff review routes by role.
- Fix: Map action payloads, reason and optimistic token without exposing numeric IDs.

## G2-1-010-055  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:385-391`: stale verify throws exact reload error.
- vNext now: `src/app/api/tpo/verification/review/route.ts:30-34`: returns structured conflict status codes.
- Fix: Use conflict banner with student changed since review text.

## G2-1-010-064  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:385-391`: `The student changed this after you opened it. Open it again to see what they sent.`
- vNext now: `src/app/api/tpo/verification/review/route.ts:30-34`: returns conflict code but no exact text in endpoint.
- Fix: Surface original reload instruction for stale review.

## G2-1-010-065  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:294-295`: `Before sending:` joined missing fields; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:412`: `Say what needs to change`.
- vNext now: `src/app/api/profile-verification/self/route.ts:30-34`,`src/app/api/tpo/verification/review/route.ts:30-34`: structured error codes.
- Fix: Provide exact field-level legacy copy via mapped error codes.
