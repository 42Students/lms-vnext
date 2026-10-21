# Work packet (wave 2): edit src/modules/placements/tpo-team-conversation-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/tpo-team-thread-controller.md

## G2-3-022-008  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:38-44`, `82-89`
- vNext now: `src/modules/placements/tpo-team-conversation-service.ts:19-96`, `src/db/schema/tpo-internal.ts:57-87`
- Fix: Legacy send supports rich Send payload mentions/asks/decision semantics; vNext reply and ask services are separate mutations. Build compatibility projection for request fields.

## G2-3-022-011  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:41-44`, `76-83`
- vNext now: `src/app/api/placements/tpo/team/threads/route.ts:11-18`, `src/modules/placements/tpo-team-conversation-service.ts:14-24`
- Fix: Legacy Start and Send accept JSON body with optional contextual metadata, vNext create route accepts formData and strict recipientMembershipId/topic/firstMessage. Match input and validations.

## G2-3-022-029  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:59-80`
- vNext now: `src/modules/placements/tpo-team-internal-read-service.ts:13-98`, `src/modules/placements/tpo-team-conversation-service.ts:19-96`
- Fix: Legacy endpoint yields list/maps or thread payload under one controller; vNext reads return READY/FAILED/NOT_REGISTERED branches and page 404. Translate no-data/permission/server errors to same detail states.

## G2-3-022-033  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:71-83`
- vNext now: `src/modules/placements/tpo-team-internal-create-service.ts:16-87`, `src/modules/placements/tpo-team-conversation-service.ts:19-96`
- Fix: Legacy Send with mentions and asks can notify other placement team members; vNext pair reply and ask create services need equivalent recipient targeting and privacy guards.
