# Work packet (wave 2): edit src/db/schema/tpo-collaboration.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/l19-u022-tpo-hub-controller.md

## G2-19-022-137  [P2] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoHubController.java:385-446 season, college settings, preferences, job types
- vNext now: src/db/schema/placements.ts:374-461 placementSeasons plus src/db/schema/tpo-collaboration.ts:235-429 college settings/user prefs/saved views
- Fix: Produce field-level migration matrix for legacy settings, blocked dates, notification defaults, job types
