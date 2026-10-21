# Work packet (wave 2): edit src/modules/attendance/faculty-schedule-mutation-service.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u027-faculty-class-schedule-controller.md

## G2-16-027-004  [P2] GAP  facet F03  effort M
- Legacy: ClassScheduleDTO.java:13-31 classId,facultyId,courseId/slug,start/end,hallId,title.
- vNext now: faculty-schedule-mutation-service.ts:83-98 section+faculty,title,description,location,start/end.
- Fix: Expose/classify legacy hall and course/faculty context in UI.

## G2-16-027-008  [P2] GAP  facet F05  effort M
- Legacy: ClassScheduleServiceImpl.java:371-380 saves hall/course/faculty/class references.
- vNext now: faculty-schedule-mutation-service.ts:83-92 inserts section events and course link.
- Fix: Document normalized class/section/course and room mapping.

## G2-16-027-019  [P2] GAP  facet F10  effort L
- Legacy: FacultyClassScheduleController.java:73-78 delegates to same admin schedule service.
- vNext now: faculty-schedule-mutation-service.ts:19-121 independently writes section schedule event.
- Fix: Align shared constraints and attendance linkage across both routes.

## G2-16-027-023  [P2] GAP  facet F11  effort M
- Legacy: FacultyClassScheduleController.java:63-65 ADMIN facultyType may bypass self schedule ownership.
- vNext now: faculty-schedule-mutation-service.ts:25-30 faculty-only no admin bypass.
- Fix: Ensure admin schedule separately preserves permitted override.

## G2-16-027-035  [P2] GAP  facet F19  effort M
- Legacy: ClassScheduleServiceImpl.java:335-370 row locks and overlap queries.
- vNext now: faculty-schedule-mutation-service.ts:39-42 advisory section/faculty locks and overlap SQL.
- Fix: Index hall occupancy and large-schedule overlap queries.

## G2-16-027-037  [P2] GAP  facet F20  effort M
- Legacy: ClassScheduleServiceImpl.java:57-82 tenant-configurable grace.
- vNext now: faculty-schedule-mutation-service.ts:33-38 no grace applied.
- Fix: Test boundary minute with IST and clock skew.

## G2-16-027-039  [P2] GAP  facet F21  effort L
- Legacy: ClassScheduleServiceImpl.java:41-44 faculty/class/hall repos plus notification services.
- vNext now: faculty-schedule-mutation-service.ts:5-16 section schedule+attendance DB and activity.
- Fix: Wire hall scheduling integration and attendee notices.

## G2-16-027-040  [P2] GAP  facet F22  effort L
- Legacy: ClassScheduleDTO.java:13-31 numeric class/faculty/course/hall FKs and time strings.
- vNext now: faculty-schedule-mutation-service.ts:83-92 UUID section/membership/delivery records, hall absent.
- Fix: Map old fields and add hall resource association.

## G2-16-027-041  [P2] GAP  facet F22  effort L
- Legacy: ClassScheduleServiceImpl.java:371-380 ClassSchedule write with hallId.
- vNext now: faculty-schedule-mutation-service.ts:83-105 sectionScheduleEvents and links.
- Fix: Verify relevant FK/index/attendance history mapping.
