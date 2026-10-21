# Work packet (wave 2): edit src/modules/placements/tpo-team-preferences-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/tpo-team-thread-controller.md

## G2-3-022-022  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:91-106`
- vNext now: `src/modules/placements/tpo-team-preferences-service.ts:22-81`
- Fix: Legacy separate follow, mute and leave API mutate per-member flags; vNext preferences support follow/mute and read receipt, but leave cannot be modeled for a pair thread. Map lifecycle.

## G2-3-022-032  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoTeamThreadController.java:62-63`, `91-100`
- vNext now: `src/modules/placements/tpo-team-preferences-service.ts:22-81`
- Fix: Legacy unread respects following/muted decisions across team messages; vNext per-pair preferences/read receipt require parity for shell badge and notifications.
