# Work packet: edit src/app/api/public/college-join/join/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/public-college-join-controller.md

## G2-8-026-025  [P1] GAP  facet F07  effort M
- Legacy: Legacy invalid token LINK_INVALID -> 404 {error:LINK_INVALID} (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicCollegeJoinController.java:67-71).
- vNext now: New send/join INVALID_LINK can map to generic COULD_NOT_SEND_CODE/COULD_NOT_JOIN 400 (src/app/api/public/college-join/send-code/route.ts:23-34; src/app/api/public/college-join/join/route.ts:20-29).
- Fix: Preserve quiet 404 invalid-token semantic without exposing existence through verification endpoint.
