# Work packet (wave 2): edit src/app/api/placements/tpo/team/threads/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/tpo-team-thread-controller.md

## G2-3-022-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:29-36`, `59-80`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:31-86`, `src/app/api/placements/tpo/team/threads/route.ts:9-23`
- Fix: Legacy /api/v1/tpo/team/threads list/search/about/open/start has 1:1 and contextual topic semantics; vNext `/tpo/team` and POST `/api/placements/tpo/team/threads` mostly private pair conversations. Map all routes to explicit new equivalents.

## G2-3-022-011  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:41-44`, `76-83`
- vNext now: `src/app/api/placements/tpo/team/threads/route.ts:11-18`, `src/modules/placements/tpo-team-conversation-service.ts:14-24`
- Fix: Legacy Start and Send accept JSON body with optional contextual metadata, vNext create route accepts formData and strict recipientMembershipId/topic/firstMessage. Match input and validations.
