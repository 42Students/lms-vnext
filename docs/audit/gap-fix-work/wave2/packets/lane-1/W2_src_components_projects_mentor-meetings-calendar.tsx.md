# Work packet (wave 2): edit src/components/projects/mentor-meetings-calendar.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u004-mentor-calendar.md

## G2-5-004-006  [P2] GAP  facet F02 Layout/section order  effort S
- Legacy: CourseSectionHeader sits inside learned projects content (docs/legacy-source/frontend/src/pages/mentor/calendar.js:235-241)
- vNext now: PageHeader external, standalone calendar sections (src/app/(authenticated)/mentor/calendar/page.tsx:48-50; src/components/projects/mentor-meetings-calendar.tsx:87-118)
- Fix: Match section head padding and surrounding card.

## G2-5-004-012  [P2] GAP  facet F04 Data formatting  effort M
- Legacy: Date ddd, MMM D YYYY plus time hh:mm A and GMT offset (docs/legacy-source/frontend/src/pages/mentor/calendar.js:115-118)
- vNext now: Intl en-IN IST timeZoneName short with dot separators (src/components/projects/mentor-meetings-calendar.tsx:15-27; src/components/projects/mentor-meetings-calendar.tsx:47-50)
- Fix: Restore exact date/time format; retain IST policy deliberately.

## G2-5-004-013  [P2] GAP  facet F04 Data formatting  effort S
- Legacy: Invalid date Date TBD, time raw-clock or -- (docs/legacy-source/frontend/src/pages/mentor/calendar.js:14-37; docs/legacy-source/frontend/src/pages/mentor/calendar.js:79-81)
- vNext now: Date TBD and Time TBD possibly repeated twice (src/components/projects/mentor-meetings-calendar.tsx:15-27; src/components/projects/mentor-meetings-calendar.tsx:47-50)
- Fix: Match invalid-time fallback.

## G2-5-004-016  [P2] GAP  facet F04 Data formatting  effort M
- Legacy: Linked sprint label from legacy payload (docs/legacy-source/frontend/src/pages/mentor/calendar.js:118)
- vNext now: Label exists only on joined sprint (src/modules/projects/mentor-calendar-service.ts:46; src/components/projects/mentor-meetings-calendar.tsx:50)
- Fix: Preserve orphaned legacy sprintLabel after migration.

## G2-5-004-044  [P2] GAP  facet F13 States  effort M
- Legacy: Three shape-matched MeetingRowSkeleton loading cards (docs/legacy-source/frontend/src/pages/mentor/calendar.js:132-152; docs/legacy-source/frontend/src/pages/mentor/calendar.js:242-247)
- vNext now: SSR page no 3-card loading explicitly mounted (src/app/(authenticated)/mentor/calendar/page.tsx:19-39; src/components/projects/mentor-meetings-calendar.tsx:87-118)
- Fix: Add matching route loading skeleton three rows.

## G2-5-004-066  [P2] GAP  facet F22 Models/migrations  effort L
- Legacy: Legacy invalid/missing dates display Date TBD (docs/legacy-source/frontend/src/pages/mentor/calendar.js:14-37)
- vNext now: DB timestamps assumed valid, ISO strings (src/modules/projects/mentor-calendar-service.ts:42-45; src/components/projects/mentor-meetings-calendar.tsx:15-27)
- Fix: Decide migration of unscheduled/corrupt meetings; do not silently drop them.
