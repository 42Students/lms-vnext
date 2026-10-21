# Work packet (wave 2): edit src/modules/academics/learner-schedule-service.ts

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l18-u020-class-schedule.md, docs/audit/gap2/lane-18/learner-calendar.md, docs/audit/gap2/lane-2/class-schedule-controller.md

## G2-18-020-001  [P2] GAP  facet F01  effort M
- Legacy: ClassSchedule.java:10-35 persists legacy class_schedule; class timetable consumed by ClassScheduleController/FacultyClassScheduleController/AdminClassScheduleController
- vNext now: src/db/schema/academics.ts:450-506 persists section_schedule_events; teacher calendar at src/modules/courses/faculty-schedule-service.ts:23-102 and learner schedule at src/modules/academics/learner-schedule-service.ts:143-209
- Fix: Map legacy /scheduleClass and /admin timetable deep links to new schedule events and calendar entry points, retaining section context

## G2-18-020-002  [P2] GAP  facet F01  effort M
- Legacy: ClassScheduleRepository.java:45-80 faculty/class date window queries
- vNext now: src/modules/academics/learner-schedule-service.ts:143-209 and src/modules/courses/faculty-schedule-service.ts:23-102 read filtered schedule events
- Fix: Ensure old class+course and date-window bookmarks navigate to current filtered calendar

## G2-18-006-034  [P2] GAP  facet F10  effort M
- Legacy: Old GET course program plus GET visible timetable (`useCourses.js:90-123`; `calenderServices.js:9-16`; `serviceUrl.js:114-118`).
- vNext now: New server Drizzle queries enrollment, deliveries and schedule (`learner-schedule-service.ts:90-207`).
- Fix: Write endpoint-to-service mapping and equivalent failure paths.

## G2-18-006-044  [P2] GAP  facet F13  effort M
- Legacy: Old missing classId retries class-scope lookup before unassigned warning (`CalendarEvents.js:199-220`).
- vNext now: New returns `You are not assigned to a class yet` when no active enrollment/delivery (`learner-schedule-service.ts:154-155`; `learner-class-schedule.tsx:406-415`).
- Fix: Differentiate failed lookup from truly unassigned.

## G2-18-006-066  [P2] GAP  facet F22  effort M
- Legacy: Old DTO includes courseSlug and className resolved per schedule (`ClassScheduleServiceImpl.java:1046-1066`).
- vNext now: New read joins sectionName, deliveryId and courseCode, not slug (`learner-schedule-service.ts:162-188`).
- Fix: Support exact display fields and legacy deep-link slug mapping.

## G2-2-032-008  [P2] GAP  facet F01  effort M
- Legacy: ClassScheduleController.java:276-342 student and faculty date-range schedule variants.
- vNext now: src/modules/academics/learner-schedule-service.ts:54-209 and faculty-schedule-service.ts:23-100 use current role scoped calendar.
- Fix: Map legacy target-ID reads to current-actor safe calendar data.

## G2-2-032-030  [P2] GAP  facet F05  effort M
- Legacy: ClassScheduleController.java:276-315 learner schedule for day or range.
- vNext now: learner-schedule-service.ts:54-209 returns all reachable section events.
- Fix: Offer Day/Week/Range filtering and stable sorting.

## G2-2-032-066  [P2] GAP  facet F11  effort M
- Legacy: ClassScheduleController.java:477-497 requires own learner or authorized faculty with assigned section.
- vNext now: learner-schedule-service.ts:37-65 requires learner membership.
- Fix: Provide separate authorized faculty/admin attendance detail workflow for supervised learners.

## G2-2-032-073  [P2] GAP  facet F13  effort S
- Legacy: ClassScheduleController.java:279-315 missing student after access check is 404.
- vNext now: learner-schedule-service.ts:54-65 derives membership; missing enrollment returns [] at :146-155.
- Fix: Differentiate inaccessible account from legitimate empty timetable.

## G2-2-032-096  [P2] GAP  facet F21  effort M
- Legacy: ClassScheduleController.java:507-514 fetches tenant attendance setting via AppSettingsService.
- vNext now: learner-schedule-service.ts:54-209 loads schedule independently of settings.
- Fix: Integrate threshold in attendance read model rather than calendar where privacy requires.

## G2-18-006-060  [P3] GAP  facet F19  effort S
- Legacy: Old BE sorts DESC by start then client sorts next ASC (`ClassScheduleServiceImpl.java:1041-1045`; `ClassScheduleContent.jsx:180-185`).
- vNext now: New DB query sorts ASC; UI next sorts ASC (`learner-schedule-service.ts:205`; `learner-schedule-model.ts:118-140`).
- Fix: Prove sorting for each surface, especially identical time ties.

## G2-18-006-064  [P3] GAP  facet F21  effort S
- Legacy: Old Axios REST + react-big-calendar and AntD integrations (`calenderServices.js:3-16`; `StandardCalendar.js:1-8`).
- vNext now: New Drizzle + in-app React calendar (`learner-schedule-service.ts:1-35`; `learner-class-schedule.tsx:1-44`).
- Fix: Document renderer/API replacement, check no external job dependency.
