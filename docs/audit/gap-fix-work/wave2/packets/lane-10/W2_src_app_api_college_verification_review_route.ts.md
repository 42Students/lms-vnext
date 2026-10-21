# Work packet (wave 2): edit src/app/api/college/verification/review/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/profile-verification-controller.md

## G2-1-010-004  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/ProfileVerificationController.java:70-81`: POST verify/send-back decision routes, path learnerId and section.
- vNext now: `src/app/api/tpo/verification/review/route.ts:13-26`,`src/app/api/college/verification/review/route.ts:12-25`: POST staff review routes by role.
- Fix: Map action payloads, reason and optimistic token without exposing numeric IDs.
