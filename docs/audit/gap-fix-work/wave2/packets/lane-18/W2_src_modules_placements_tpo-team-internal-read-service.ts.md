# Work packet (wave 2): edit src/modules/placements/tpo-team-internal-read-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/tpo-team-thread-controller.md

## G2-3-022-009  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:59-69`
- vNext now: `src/modules/placements/tpo-team-internal-read-service.ts:13-98`, `src/app/(authenticated)/tpo/team/page.tsx:72-79`
- Fix: Legacy threads/search and unread are individual endpoints with real counts, vNext filters paged list and shell counters via separate read. Preserve independently correct unread badge.

## G2-3-022-029  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:59-80`
- vNext now: `src/modules/placements/tpo-team-internal-read-service.ts:13-98`, `src/modules/placements/tpo-team-conversation-service.ts:19-96`
- Fix: Legacy endpoint yields list/maps or thread payload under one controller; vNext reads return READY/FAILED/NOT_REGISTERED branches and page 404. Translate no-data/permission/server errors to same detail states.

## G2-3-022-040  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:59-66`
- vNext now: `src/modules/placements/tpo-team-internal-read-service.ts:13-98`, `src/app/(authenticated)/tpo/team/page.tsx:74-79`
- Fix: Legacy full thread list and separate search result, vNext `listMyTpoInternalThreads` pages100 and applies filters to fetched page; global filter counts/mentions may be incomplete. Move filters into SQL before pagination.

## G2-3-022-044  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:62-63`, `153-157`
- vNext now: `src/modules/placements/tpo-team-internal-read-service.ts:13-98`, `src/app/(authenticated)/tpo/team/page.tsx:154-209`
- Fix: Legacy unread/summary/lookup endpoints feed shell indicators and cross-workspace navigation; vNext list/shell counters and team page derived separately. Confirm source wiring and correctness after writes.
