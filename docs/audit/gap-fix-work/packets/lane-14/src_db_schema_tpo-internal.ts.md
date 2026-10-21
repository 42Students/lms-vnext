# Work packet: edit src/db/schema/tpo-internal.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/tpo-team-thread-controller.md

## G2-3-022-007  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:38-44`, `71-80`
- vNext now: `src/modules/placements/tpo-team-internal-create-service.ts:16-45`, `src/db/schema/tpo-internal.ts:23-57`
- Fix: Legacy Start body can create everyone/group/context topic and private/public group memberships; vNext creator accepts one recipientMembershipId, topic and firstMessage. Restore multi-member/topic semantics and safe scoping.

## G2-3-022-021  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:76-89`
- vNext now: `src/modules/placements/tpo-team-internal-create-service.ts:16-87`, `src/db/schema/tpo-internal.ts:23-87`
- Fix: Legacy single thread can contain multiple people; vNext insert model stores startedByMembershipId/invitedMembershipId, not generalized participant rows. Multi-user fanout and historical author visibility require schema change.

## G2-3-022-027  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:39-44`, `109-112`
- vNext now: `src/db/schema/tpo-internal.ts:23-57`, `src/modules/placements/tpo-team-internal-create-service.ts:16-87`
- Fix: Legacy thread types EVERYONE/TOPIC/DRIVE/COMPANY with isPrivate and member list; vNext pair threaded conversations and everyone channel separate. Add kind/context typed model and read scopes.

## G2-3-022-046  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:38-44`, `71-89`
- vNext now: `src/db/schema/tpo-internal.ts:23-195`
- Fix: Legacy threaded membership/topics and decisions/asks linked to potentially many people; vNext tpo_internal_thread rows are pair-based, asks and everyone separate. Normalized group participant table required for full parity.
