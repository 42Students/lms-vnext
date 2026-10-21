# Work packet (wave 2): edit src/modules/placements/tpo-team-message-change-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/tpo-team-thread-controller.md

## G2-3-022-028  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:41-44`, `115-125`
- vNext now: `src/modules/placements/tpo-team-message-change-service.ts:21-29`
- Fix: Legacy edit body optionally addPeople; vNext EDIT/DELETE actions with body hashes and strict length but no mention-based addPeople. Add safe invite-and-retry workflow.
