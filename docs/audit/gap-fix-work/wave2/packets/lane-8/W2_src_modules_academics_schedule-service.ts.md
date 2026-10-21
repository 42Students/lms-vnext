# Work packet (wave 2): edit src/modules/academics/schedule-service.ts

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l18-u020-class-schedule.md, docs/audit/gap2/lane-2/class-schedule-controller.md

## G2-18-020-036  [P2] GAP  facet F13  effort M
- Legacy: ClassScheduleRepository.java:51-52 nonexistent detail returns null; schedule list can be empty
- vNext now: src/modules/academics/schedule-service.ts:338-342 SCHEDULE_EVENT_NOT_FOUND; calendar services can return []
- Fix: Map not found, empty month/section, unauthorized and closed period to exact legacy error/empty states

## G2-18-020-042  [P2] GAP  facet F18  effort S
- Legacy: ClassScheduleDTO.java:14-26 camel field messages despite snake_case JSON
- vNext now: src/modules/academics/schedule-service.ts:247-250 Zod errors and SCHEDULE_EVENT_NOT_FOUND codes
- Fix: Crosswalk exact required-field/collision/semester-closed/toast copy and title labels

## G2-2-032-003  [P2] GAP  facet F01  effort M
- Legacy: ClassScheduleController.java:158-176 PUT /update/{id} accepts destination classId.
- vNext now: src/modules/academics/schedule-service.ts:319-452 PATCH event fields, sectionId immutable.
- Fix: Decide controlled session section move vs immutable ownership; require both scopes if permitted.

## G2-2-032-007  [P2] GAP  facet F01  effort M
- Legacy: ClassScheduleController.java:237-274 section date-range with optional course filters.
- vNext now: src/modules/academics/schedule-service.ts:159-241 list events for section, not date-range/course query.
- Fix: Provide date/subject filters and equivalent section-level calendar query.

## G2-2-032-017  [P2] GAP  facet F03  effort M
- Legacy: ClassScheduleDTO.java:14-30 old create field order class,faculty,course,start/end,lecture hall,title.
- vNext now: src/modules/academics/schedule-service.ts:243-315 creates sectionId,facultyMembershipId,deliveryId,title/description,startsAt/endsAt/location.
- Fix: Map field labels, selection order, display defaults and hall lookup.

## G2-2-032-019  [P2] GAP  facet F03  effort M
- Legacy: ClassScheduleController.java:237-274 courseSlug or courseId on section schedule range filter.
- vNext now: src/modules/academics/schedule-service.ts:182-185 includes courseName/code in rows.
- Fix: Expose course selector and stable selected chip, exact old default All courses.

## G2-2-032-029  [P2] GAP  facet F05  effort M
- Legacy: ClassScheduleController.java:237-274 section-by-date-course filters.
- vNext now: schedule-service.ts:174-241 listSectionScheduleEvents orders startsAt ascending but does not filter date.
- Fix: Add SQL date/course filters and aligned timezone boundaries.

## G2-2-032-031  [P2] GAP  facet F05  effort M
- Legacy: ClassScheduleController.java:522-550 section date range with optional courseSlug/courseId.
- vNext now: schedule-service.ts:159-241 returns detailed joined event rows sorted startsAt.
- Fix: Map course slug to delivery/course ID for class report filters.

## G2-2-032-032  [P2] GAP  facet F05  effort S
- Legacy: ClassScheduleController.java:554-560 scalar schedule count by class.
- vNext now: schedule-service.ts:159-241 returns event array; query.count absent.
- Fix: Expose COUNT by scoped section for pagination/overview without fetching every row.

## G2-2-032-034  [P2] GAP  facet F06  effort M
- Legacy: ClassScheduleController.java:102-119 validates inclusive same-day date ranges; upper bound 23:59:59.
- vNext now: schedule-service.ts:40-70 checks period/event windows, timestamps with timezone.
- Fix: Implement end-exclusive next-day safe range or exact 23:59:59 parity and test midnight.

## G2-2-032-035  [P2] GAP  facet F06  effort M
- Legacy: ClassScheduleController.java:132-147 courseSlug preferred over courseId and `crs-` accepted in courseId string.
- vNext now: schedule-service.ts:182-185 stores UUID courseId/visible code, no legacy crs slug parse.
- Fix: Translate legacy slug syntax and precedence at migrated router.

## G2-2-032-053  [P2] GAP  facet F10  effort L
- Legacy: ClassScheduleController.java:149-176 create/update class session with scope.
- vNext now: schedule-service.ts:243-452 creates/updates sectionScheduleEvents in Drizzle.
- Fix: Map schedule event model changes and support old lectureHall ID via location/hall resource.

## G2-2-032-067  [P2] GAP  facet F12  effort M
- Legacy: ClassScheduleController.java:107-118 upper range end includes whole day at 23:59:59.
- vNext now: schedule-service.ts:40-70 represents timestamptz instants in academic period.
- Fix: Use Asia/Kolkata local day with next-day exclusive boundary to avoid missing milliseconds.

## G2-2-032-094  [P2] GAP  facet F21  effort L
- Legacy: ClassScheduleController.java:49-71 uses ClassScheduleService, LearnerService, DateUtils, CourseSlugResolver, AppSettingsService.
- vNext now: schedule-service.ts:159-501 and learner/faculty modules split responsibilities.
- Fix: Build full old-to-new endpoint dependency map for replacing callers.

## G2-2-032-085  [P3] GAP  facet F18  effort S
- Legacy: ClassScheduleController.java:118 `startDate must be before or equal to endDate`.
- vNext now: schedule-service.ts:40-70 uses separate event time validation, not query field copy.
- Fix: Clone date-range form validation text.
