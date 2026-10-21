# Work packet (wave 2): edit src/modules/courses/faculty-schedule-service.ts

22 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l18-u020-class-schedule.md, docs/audit/gap2/lane-2/class-schedule-controller.md, docs/audit/gap2/lane-5/u011-teacher-calendar.md

## G2-18-020-001  [P2] GAP  facet F01  effort M
- Legacy: ClassSchedule.java:10-35 persists legacy class_schedule; class timetable consumed by ClassScheduleController/FacultyClassScheduleController/AdminClassScheduleController
- vNext now: src/db/schema/academics.ts:450-506 persists section_schedule_events; teacher calendar at src/modules/courses/faculty-schedule-service.ts:23-102 and learner schedule at src/modules/academics/learner-schedule-service.ts:143-209
- Fix: Map legacy /scheduleClass and /admin timetable deep links to new schedule events and calendar entry points, retaining section context

## G2-18-020-002  [P2] GAP  facet F01  effort M
- Legacy: ClassScheduleRepository.java:45-80 faculty/class date window queries
- vNext now: src/modules/academics/learner-schedule-service.ts:143-209 and src/modules/courses/faculty-schedule-service.ts:23-102 read filtered schedule events
- Fix: Ensure old class+course and date-window bookmarks navigate to current filtered calendar

## G2-2-032-006  [P2] GAP  facet F01  effort M
- Legacy: ClassScheduleController.java:213-235 faculty single-date and range reads.
- vNext now: src/modules/courses/faculty-schedule-service.ts:23-100 reads assigned deliveries for current membership.
- Fix: Expose authorized faculty range/selected-day views, ensuring same session fields.

## G2-2-032-008  [P2] GAP  facet F01  effort M
- Legacy: ClassScheduleController.java:276-342 student and faculty date-range schedule variants.
- vNext now: src/modules/academics/learner-schedule-service.ts:54-209 and faculty-schedule-service.ts:23-100 use current role scoped calendar.
- Fix: Map legacy target-ID reads to current-actor safe calendar data.

## G2-2-032-012  [P2] GAP  facet F01  effort M
- Legacy: ClassScheduleController.java:554-600 schedule count and four faculty hours variants.
- vNext now: src/modules/courses/faculty-schedule-service.ts:23-100 returns events, not corresponding four hours endpoints.
- Fix: Implement grouped duration aggregates/derived selectors in reports if needed.

## G2-2-032-013  [P2] GAP  facet F01  effort S
- Legacy: ClassScheduleController.java:602-620 next upcoming class 404 when none.
- vNext now: src/modules/courses/faculty-schedule-service.ts:23-100 returns all upcoming/assigned events.
- Fix: Provide next-event derived card with explicit no-upcoming state.

## G2-2-032-018  [P2] GAP  facet F03  effort S
- Legacy: ClassScheduleController.java:213-235 date picker feeds faculty's session list.
- vNext now: src/modules/courses/faculty-schedule-service.ts:23-100 returns events without same explicit date query.
- Fix: Add visible date selector/filter and matching event count/empty-state.

## G2-2-032-020  [P2] MISSING  facet F03  effort M
- Legacy: ClassScheduleController.java:565-600 four teaching hours endpoints.
- vNext now: src/modules/courses/faculty-schedule-service.ts:100 returns sections,courses,events.
- Fix: Build count/hour KPI panels including course, section and combination filters.

## G2-2-032-026  [P2] GAP  facet F04  effort S
- Legacy: ClassScheduleController.java:565-600 GET hours returns bare double, not wrapped.
- vNext now: src/modules/courses/faculty-schedule-service.ts:23-100 returns object with `events`.
- Fix: Choose typed numeric total hours for aggregate cards; keep float precision semantics.

## G2-2-032-027  [P2] GAP  facet F04  effort S
- Legacy: ClassScheduleController.java:602-619 wraps next upcoming session or 404.
- vNext now: faculty-schedule-service.ts:100 returns arrays even without upcoming.
- Fix: Expose explicit absence of next session in page view-model.

## G2-2-032-028  [P2] GAP  facet F05  effort M
- Legacy: ClassScheduleController.java:213-235 two faculty reads by single date/range.
- vNext now: faculty-schedule-service.ts:23-100 fetches delivery-based events, client date filtering.
- Fix: Ensure date-range query supports pagination and no excluded sessions.

## G2-2-032-058  [P2] MISSING  facet F10  effort M
- Legacy: ClassScheduleController.java:565-600 four total-hours KPI reads.
- vNext now: faculty-schedule-service.ts:23-100 event list only.
- Fix: Implement SQL aggregates for hours by faculty/course/section.

## G2-2-032-059  [P2] GAP  facet F10  effort S
- Legacy: ClassScheduleController.java:602-619 nearest upcoming faculty class.
- vNext now: faculty-schedule-service.ts:23-100 list to derive next class.
- Fix: Select first future SCHEDULED class with timezone aware now.

## G2-2-032-071  [P2] GAP  facet F12  effort S
- Legacy: ClassScheduleController.java:602-619 returns upcoming based on current instant.
- vNext now: faculty-schedule-service.ts:23-100 raw events require accurate timezone and cancellations.
- Fix: Sort future live sessions only, not stale canceled classes.

## G2-2-032-087  [P2] GAP  facet F19  effort M
- Legacy: ClassScheduleController.java:213-235 unpaged faculty schedule date range list.
- vNext now: faculty-schedule-service.ts:23-100 fetches all events for assigned deliveries.
- Fix: Use SQL start/end filters and bounded page/virtualization for long histories.

## G2-2-032-099  [P2] GAP  facet F22  effort M
- Legacy: ClassScheduleController.java:565-600 total teaching-hour report computed from legacy class_schedule.
- vNext now: faculty-schedule-service.ts:23-100 event table data with timestamps.
- Fix: Recompute taught hours from completed actual sessions (exclude canceled/future), matching legacy interpretation.

## G2-5-011-020  [P2] GAP  facet F05  effort M
- Legacy: Grid query follows the current day/week/month visible date range (`docs/legacy-source/frontend/src/components/CalendarComp/CalendarEvents/CalendarEvents.js:69-100`)
- vNext now: vNext reads all persisted faculty sessions before month filtering (`src/modules/courses/faculty-schedule-service.ts:49-99`)
- Fix: Plan range-bounded loading and avoid global read for every month.

## G2-5-011-042  [P2] GAP  facet F11  effort M
- Legacy: Legacy faculty filter deduplicates course IDs from active teaching assignments (`docs/legacy-source/frontend/src/hooks/useCourses.js:46-71`)
- vNext now: New filter works per delivery ID, which can duplicate course title across sections (`src/modules/courses/faculty-schedule-service.ts:23-40`)
- Fix: Show stable course+section options or collapse by course to match legacy.

## G2-5-011-067  [P2] GAP  facet F21  effort M
- Legacy: Legacy two fetches use first-party calendar REST service and assigned-course REST service (`docs/legacy-source/frontend/src/api/Services/calenderServices.js:3-17`)
- vNext now: vNext uses internal SQL projection and no third-party fetch in faculty calendar (`src/modules/courses/faculty-schedule-service.ts:23-100`)
- Fix: Preserve service failure domains or explain merged fetch approach.

## G2-5-011-070  [P2] GAP  facet F22  effort M
- Legacy: Legacy response includes className, courseSlug, learnerCount, lectureHallId, learnerList (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/ClassScheduleResponse.java:9-22`)
- vNext now: vNext service returns section/course/faculty projection but no class roster/count or hall ID (`src/modules/courses/faculty-schedule-service.ts:49-64`)
- Fix: Add appropriate display projection where needed; avoid exposing learner roster to unauthorized faculty.

## G2-2-032-072  [P3] GAP  facet F13  effort S
- Legacy: ClassScheduleController.java:612-620 no upcoming returns 404 with human text.
- vNext now: faculty-schedule-service.ts:43-100 returns empty sections,courses,events.
- Fix: Show nonerror empty state and old human copy.

## G2-2-032-100  [P3] GAP  facet F22  effort S
- Legacy: ClassScheduleController.java:602-619 next class returns ClassSchedule DTO.
- vNext now: faculty-schedule-service.ts:100 returns schedule arrays.
- Fix: Map entity fields/timezones and card formatter.
