# Work packet (wave 2): edit src/app/api/placements/seasons/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/tpo-season-controller.md

## G2-8-022-003  [P2] GAP  facet F01  effort M
- Legacy: Old TPO season actions grouped at /api/v1/tpo/season and /{seasonId}/open-registration (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoSeasonController.java:50-60).
- vNext now: New settings entry redirects to a selected tab; API create under /api/placements/seasons (src/app/(authenticated)/tpo/settings/page.tsx:1-8; src/app/api/placements/seasons/route.ts:30-53).
- Fix: Map old season settings entry and actions to visible tab+form routes.
