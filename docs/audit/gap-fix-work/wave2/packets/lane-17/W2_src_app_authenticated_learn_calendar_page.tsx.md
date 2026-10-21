# Work packet (wave 2): edit src/app/(authenticated)/learn/calendar/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/class-schedule-controller.md

## G2-2-032-015  [P2] GAP  facet F02  effort M
- Legacy: ClassScheduleController.java:213-235 date-range resources underpin old timetable list.
- vNext now: src/app/(authenticated)/learn/calendar/page.tsx:14-75 renders dedicated calendar view.
- Fix: Align week/day calendar density, action location and filter layout.

## G2-2-032-079  [P2] GAP  facet F16  effort M
- Legacy: Legacy Calendar/TakeAttendance accesses schedule through date picker and modal.
- vNext now: learn/calendar/page.tsx:14-75 dedicated calendar responsive page.
- Fix: Compare day/week selectors, mobile event cards and overflow controls in live UI.
