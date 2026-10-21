# Work packet: edit src/modules/placements/tpo-team-conversation-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/tpo-team-thread-controller.md

## G2-3-022-026  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:71-80`, `174-178`
- vNext now: `src/modules/placements/tpo-team-internal-create-service.ts:16-45`, `src/modules/placements/tpo-team-conversation-service.ts:19-54`
- Fix: Legacy service checks per-thread membership and distinguishes private conversation invitation needs; vNext authorizes pair membership, so legacy team-wide OPEN/topic reads cannot map one-for-one.
