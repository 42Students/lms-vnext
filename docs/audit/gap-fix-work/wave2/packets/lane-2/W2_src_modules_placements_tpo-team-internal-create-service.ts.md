# Work packet (wave 2): edit src/modules/placements/tpo-team-internal-create-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/tpo-team-thread-controller.md

## G2-3-022-033  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:71-83`
- vNext now: `src/modules/placements/tpo-team-internal-create-service.ts:16-87`, `src/modules/placements/tpo-team-conversation-service.ts:19-96`
- Fix: Legacy Send with mentions and asks can notify other placement team members; vNext pair reply and ask create services need equivalent recipient targeting and privacy guards.
