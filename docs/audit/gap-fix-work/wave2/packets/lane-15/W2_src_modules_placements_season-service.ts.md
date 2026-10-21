# Work packet (wave 2): edit src/modules/placements/season-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/tpo-season-controller.md

## G2-8-022-049  [P2] GAP  facet F18  effort M
- Legacy: Legacy default season name exact Current season (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoSeasonService.java:27-29).
- vNext now: New requires user-entered name min two chars, no default in service (src/modules/placements/validation.ts:219-223; src/modules/placements/season-service.ts:134-145).
- Fix: Decide display of Current season alias/default text in empty-state flow.
