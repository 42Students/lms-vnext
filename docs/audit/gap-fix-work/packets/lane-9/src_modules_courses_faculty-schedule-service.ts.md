# Work packet: edit src/modules/courses/faculty-schedule-service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l18-u020-class-schedule.md, docs/audit/gap2/lane-5/u011-teacher-calendar.md, docs/audit/gap2/lane-2/class-schedule-controller.md

## G2-18-020-013  [P1] GAP  facet F05  effort M
- Legacy: ClassScheduleRepository.java:45-65 lists own faculty/class/multi-class between start/end
- vNext now: src/modules/academics/learner-schedule-service.ts:143-209 authorized roster and deliveries, faculty-schedule-service.ts:23-102 scoped deliveries
- Fix: Verify multiple elective sections included, no leakage of shared events, and start/end inclusive date semantics

## G2-18-020-030  [P1] GAP  facet F11  effort M
- Legacy: ClassScheduleRepository.java:88-107 distinguishes faculty own and admin all faculty reads
- vNext now: src/modules/academics/schedule-service.ts:255-258,333-336 academics.manage, and faculty-schedule-service.ts:23-100 authorized deliveries
- Fix: Verify faculty mutation path honors teach-this-class, not just college scope; admin reports remain all-faculty

## G2-5-011-018  [P1] GAP  facet F04  effort M
- Legacy: ClassScheduleResponse has facultyId/courseSlug/learnerCount/lectureHallId/className, unlike vNext projection (`docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/ClassScheduleResponse.java:9-22`)
- vNext now: Faculty read projects id/sectionName/description/location/displayName/deliveryId/courseCode (`src/modules/courses/faculty-schedule-service.ts:49-64`)
- Fix: Map legacy fields correctly and explicitly scope whether roster/count/hall data should be displayed.

## G2-5-011-037  [P1] GAP  facet F10  effort M
- Legacy: Upcoming uses second GET same endpoint for today through next 180 days (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:122-145`)
- vNext now: All matching persisted `SCHEDULED` rows loaded once server-side (`src/modules/courses/faculty-schedule-service.ts:85-100`)
- Fix: Preserve independent upcoming view and minimum future-window semantics.

## G2-5-011-061  [P1] GAP  facet F19  effort M
- Legacy: Legacy loads dates only for current view (week/day/overflow month) (`docs/legacy-source/frontend/src/components/CalendarComp/CalendarEvents/CalendarEvents.js:69-85`)
- vNext now: vNext reads all scheduled events in assigned Sections with no time range (`src/modules/courses/faculty-schedule-service.ts:49-98`)
- Fix: Add bounded date predicate and indexed range query to avoid table-growth slowdown.

## G2-2-032-045  [P3] GAP  facet F07  effort S
- Legacy: ClassScheduleController.java:617-620 no upcoming returns 404 `No upcoming class found`.
- vNext now: faculty-schedule-service.ts:43-100 returns empty arrays for no assignments.
- Fix: Show benign No upcoming class empty state instead of fatal 404.
