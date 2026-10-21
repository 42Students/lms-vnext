# Work packet (wave 2): edit src/components/projects/mentor-calendar-load-failure.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u004-mentor-calendar.md

## G2-5-004-030  [P2] GAP  facet F07 Validation/errors  effort M
- Legacy: Error Alert uses backend err.message or We couldn't load your meetings.; Retry (docs/legacy-source/frontend/src/pages/mentor/calendar.js:169-176; docs/legacy-source/frontend/src/pages/mentor/calendar.js:248-255)
- vNext now: Generic Banner and router.refresh Retry (src/app/(authenticated)/mentor/calendar/page.tsx:35-39; src/components/projects/mentor-calendar-load-failure.tsx:8-13)
- Fix: Preserve safe server reason and legacy Alert geometry.
