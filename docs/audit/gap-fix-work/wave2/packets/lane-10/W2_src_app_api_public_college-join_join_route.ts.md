# Work packet (wave 2): edit src/app/api/public/college-join/join/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/public-college-join-controller.md

## G2-8-026-003  [P2] GAP  facet F01  effort M
- Legacy: Old send code POST /{token}/send-code and join POST /{token}/join (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicCollegeJoinController.java:53-65).
- vNext now: New POST /api/public/college-join/send-code and /join, token in JSON body (src/app/api/public/college-join/send-code/route.ts:7-22; src/app/api/public/college-join/join/route.ts:6-18).
- Fix: Provide old route adapter or update all existing clients and invitations.
