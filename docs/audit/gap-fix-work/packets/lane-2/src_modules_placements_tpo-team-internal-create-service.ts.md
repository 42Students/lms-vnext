# Work packet: edit src/modules/placements/tpo-team-internal-create-service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l19-u031-cross-messaging.md, docs/audit/gap2/lane-3/tpo-team-thread-controller.md

## G2-19-031-073  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoTeamThreadService.java:50-59` — TPO and college admin team users can converse.
- vNext now: `src/modules/placements/tpo-team-internal-create-service.ts:16-35` — New pair creation limits recipient to TPO membership.
- Fix: Authorize true college-admin Team members without recruiter access.

## G2-19-031-132  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:59-176` — Legacy Team threads members/context/mentions/asks/decisions.
- vNext now: `src/modules/placements/tpo-team-internal-create-service.ts:58-64` — New private thread has exactly two membership IDs.
- Fix: Generic multi-member team schema and object link tables.

## G2-3-022-007  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:38-44`, `71-80`
- vNext now: `src/modules/placements/tpo-team-internal-create-service.ts:16-45`, `src/db/schema/tpo-internal.ts:23-57`
- Fix: Legacy Start body can create everyone/group/context topic and private/public group memberships; vNext creator accepts one recipientMembershipId, topic and firstMessage. Restore multi-member/topic semantics and safe scoping.

## G2-3-022-021  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:76-89`
- vNext now: `src/modules/placements/tpo-team-internal-create-service.ts:16-87`, `src/db/schema/tpo-internal.ts:23-87`
- Fix: Legacy single thread can contain multiple people; vNext insert model stores startedByMembershipId/invitedMembershipId, not generalized participant rows. Multi-user fanout and historical author visibility require schema change.

## G2-3-022-026  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:71-80`, `174-178`
- vNext now: `src/modules/placements/tpo-team-internal-create-service.ts:16-45`, `src/modules/placements/tpo-team-conversation-service.ts:19-54`
- Fix: Legacy service checks per-thread membership and distinguishes private conversation invitation needs; vNext authorizes pair membership, so legacy team-wide OPEN/topic reads cannot map one-for-one.

## G2-3-022-027  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:39-44`, `109-112`
- vNext now: `src/db/schema/tpo-internal.ts:23-57`, `src/modules/placements/tpo-team-internal-create-service.ts:16-87`
- Fix: Legacy thread types EVERYONE/TOPIC/DRIVE/COMPANY with isPrivate and member list; vNext pair threaded conversations and everyone channel separate. Add kind/context typed model and read scopes.

## G2-3-022-015  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:85-89`
- vNext now: `src/modules/placements/tpo-team-internal-create-service.ts:16-35`
- Fix: Legacy addPeople endpoint returns `{status:ADDED}` and validates invitation/team membership in service; vNext private pair creator permits only one recipient, no add-people mutation. Map exact errors.
