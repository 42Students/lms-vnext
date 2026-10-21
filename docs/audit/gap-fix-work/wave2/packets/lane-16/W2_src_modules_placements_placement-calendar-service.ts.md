# Work packet (wave 2): edit src/modules/placements/placement-calendar-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u012-tpo-calendar.md

## G2-5-012-018  [P2] GAP  facet F04  effort M
- Legacy: Legacy backend ROUND/TALK row carries mode, venue, ownerId, company and jobTitle (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:457-466`)
- vNext now: vNext round result selects type/status/time/company and projects normalized title (`src/modules/placements/placement-calendar-service.ts:241-340`)
- Fix: Carry venue/mode/owner fields into calendar projection and render as in old popover
