# Work packet (wave 2): edit src/modules/placements/tpo-team-asks-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/tpo-team-thread-controller.md

## G2-3-022-010  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:147-157`
- vNext now: `src/app/(authenticated)/tpo/team/page.tsx:154-209`, `src/modules/placements/tpo-team-asks-service.ts:22-58`
- Fix: Legacy `/asks/mine`, `/mentions`, `/summary`, `/lookup` return cross-thread results; vNext team page filters local thread page, asks list by specific thread. Add global scoped endpoints.

## G2-3-022-024  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:135-145`
- vNext now: `src/modules/placements/tpo-team-asks-service.ts:135-199`
- Fix: Legacy askDone and askCancel POST endpoints on global askId; vNext changeTpoTeamAsk requires thread/ask scope and typed action. Map idempotency/status and exact navigation.

## G2-3-022-041  [P2] MISSING  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:147-157`
- vNext now: `src/modules/placements/tpo-team-asks-service.ts:22-58`
- Fix: Legacy cross-thread asks and mentions can be retrieved directly; vNext asks are stored and listed per thread (limit200) with no confirmed global query. Add indexed rollup.
