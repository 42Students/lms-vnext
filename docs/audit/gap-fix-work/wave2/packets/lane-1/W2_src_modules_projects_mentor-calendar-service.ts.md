# Work packet (wave 2): edit src/modules/projects/mentor-calendar-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u004-mentor-calendar.md

## G2-5-004-061  [P2] GAP  facet F20 Concurrency/time  effort M
- Legacy: Organizer zone converted to browser-local timezone (docs/legacy-source/frontend/src/pages/mentor/calendar.js:14-37; docs/legacy-source/frontend/src/pages/mentor/calendar.js:46-53)
- vNext now: Always IST timezone display (src/components/projects/mentor-meetings-calendar.tsx:15-27; src/modules/projects/mentor-calendar-service.ts:42-45)
- Fix: Validate intentional IST policy and cross-zone conversion.
