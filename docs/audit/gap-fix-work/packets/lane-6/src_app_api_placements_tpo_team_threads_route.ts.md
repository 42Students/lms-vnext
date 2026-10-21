# Work packet: edit src/app/api/placements/tpo/team/threads/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/tpo-team-thread-controller.md

## G2-3-022-014  [P1] MISSING  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:174-178`
- vNext now: `src/app/api/placements/tpo/team/threads/route.ts:24-32`, `src/modules/placements/tpo-team-asks-service.ts:62-80`
- Fix: Legacy `ADD_PEOPLE` 409 names the people missing from a private conversation, with explicit add-and-retry UX; vNext does not expose that conflict shape in cited routes. Add safe action-needed 409 with existing membership IDs, not a silent send failure.

## G2-3-022-016  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:46-56`, `175-178`
- vNext now: `src/app/api/placements/tpo/team/threads/route.ts:24-32`
- Fix: Legacy has controller exception mapper only for needs-adding; vNext strict errors INVALID_BODY, FORBIDDEN, RECIPIENT_NOT_FOUND, STALE_MESSAGE and pending table. Provide user-facing parity wording.
