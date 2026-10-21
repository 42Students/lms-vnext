# Work packet: edit src/app/api/profile-verification/self/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/profile-verification-controller.md

## G2-1-010-029  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:290-304`: empty sections rejected `Before sending: ...`; unchanged verified rejected `Nothing has changed since it was verified`.
- vNext now: `src/app/api/profile-verification/self/route.ts:30-34`: returns INVALID_TRANSITION 409/422 with code.
- Fix: Translate exact legacy copy and provide actionable inline remediation.

## G2-1-010-032  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/ProfileVerificationService.java:303-312`: learner submit returns sectionState with SUBMITTED/UPDATE_PENDING.
- vNext now: `src/app/api/profile-verification/self/route.ts:27-28`: returns status/version JSON, no toast string.
- Fix: Use exact submitted/update-pending confirmation text and refresh badge.
