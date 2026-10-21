# Work packet: NEW / MISSING items from docs/audit/gap2/lane-5/u004-mentor-calendar.md

3 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-5/u004-mentor-calendar.md

## G2-5-004-041  [P1] GAP  facet F12 Business rules  effort S
- Legacy: Missing end-time falls back to start-time to derive MISSED (docs/legacy-source/frontend/src/pages/mentor/calendar.js:55-63)
- vNext now: MISSED only derives with valid endsAt (src/modules/projects/mentor-calendar-view.ts:45-57)
- Fix: Use startsAt fallback if historical end missing.

## G2-5-004-065  [P1] GAP  facet F22 Models/migrations  effort L
- Legacy: Legacy meetingKey/date/start/end/timezone/sprintLabel embedded in project DTO (docs/legacy-source/frontend/src/api/Services/projectService.js:493-523; docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ProjectWorkspaceService.java:82-84)
- vNext now: New normalized UUID projectMeetings, startsAt/endsAt timestamps and sprint join (src/modules/projects/mentor-calendar-service.ts:34-86)
- Fix: Map legacy meeting identifiers and orphaned sprint labels in migration.

## G2-5-004-069  [P1] GAP  facet F23 Extra/dropped  effort M
- Legacy: Join shows on safe URL except CANCELLED (docs/legacy-source/frontend/src/pages/mentor/calendar.js:85-86; docs/legacy-source/frontend/src/pages/mentor/calendar.js:120-125)
- vNext now: Join only on SCHEDULED/RESCHEDULED before end instant (src/modules/projects/mentor-calendar-view.ts:59-69)
- Fix: Explicit owner decision on REQUESTED/COMPLETED valid Join links.
