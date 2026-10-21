# Work packet: edit src/app/(authenticated)/tpo/calendar/error.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u012-tpo-calendar.md

## G2-5-012-044  [P2] GAP  facet F07  effort S
- Legacy: Legacy calendar fetch failure fallback Could not load the calendar (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:60-74`)
- vNext now: vNext full route ErrorState says Couldn't load the placement calendar (`src/app/(authenticated)/tpo/calendar/error.tsx:1-6`)
- Fix: Align exact copy and panel-level recovery
