# Work packet (wave 2): edit src/db/schema/tpo-internal.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/tpo-team-thread-controller.md

## G2-3-022-008  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:38-44`, `82-89`
- vNext now: `src/modules/placements/tpo-team-conversation-service.ts:19-96`, `src/db/schema/tpo-internal.ts:57-87`
- Fix: Legacy send supports rich Send payload mentions/asks/decision semantics; vNext reply and ask services are separate mutations. Build compatibility projection for request fields.

## G2-3-022-047  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:109-112`, `175-178`
- vNext now: `src/db/schema/tpo-internal.ts:23-57`
- Fix: Legacy isPrivate toggles sharing of whole prior history for topic; vNext private pair thread has no is_private, and everyone message table is different model. Add history-preserving privacy transitions.
