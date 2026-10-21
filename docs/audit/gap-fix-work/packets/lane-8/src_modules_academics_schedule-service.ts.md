# Work packet: edit src/modules/academics/schedule-service.ts

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l18-u020-class-schedule.md, docs/audit/gap2/lane-2/class-schedule-controller.md

## G2-18-020-014  [P1] GAP  facet F05  effort M
- Legacy: ClassScheduleRepository.java:73-115 course-specific, faculty-specific and admin any-faculty variants
- vNext now: src/modules/academics/schedule-service.ts:160-240 query events with optional delivery links
- Fix: Retain admin any-faculty filter and faculty-specific read for substitutions, co-teaching and course scope

## G2-18-020-017  [P1] GAP  facet F06  effort M
- Legacy: ClassScheduleDTO.java:14-31 requires positive classId/facultyId; courseId or courseSlug; nonblank startTime/endTime; hallId/title optional
- vNext now: src/modules/academics/schedule-service.ts:243-287 validates Section, faculty, delivery and academic period; title required by DB
- Fix: Map requiredness and error copy to legacy; explain new period/delivery constraints, support section-only without course

## G2-18-020-019  [P1] GAP  facet F06  effort M
- Legacy: ClassScheduleDTO.java:29 hallId int accepted; legacy service checks clashes
- vNext now: src/modules/academics/schedule-service.ts:293-303 create writes NO lectureHallId even though schema has it
- Fix: Add lectureHallId into create schema and insert, validate same-college hall and conflicts

## G2-18-020-021  [P1] GAP  facet F07  effort L
- Legacy: ClassScheduleRepository.java:137-165 counts faculty, class and lecture hall overlaps on create/update
- vNext now: src/modules/academics/schedule-service.ts:243-316,319-453 only period/faculty/delivery and time order checks shown
- Fix: Implement transactionally verified faculty/section/hall overlap exclusion on create/update; exclude same event

## G2-18-020-027  [P1] GAP  facet F10  effort M
- Legacy: ClassScheduleRepository.java:51-52 detail lookup, :54-65 date read; ClassSchedule.java:16-35 single-table persistence
- vNext now: src/modules/academics/schedule-service.ts:290-315 transaction creates event and optional delivery link
- Fix: Ensure legacy course binding translates to delivery linkage and prevent unlinked event on partially invalid course

## G2-18-020-030  [P1] GAP  facet F11  effort M
- Legacy: ClassScheduleRepository.java:88-107 distinguishes faculty own and admin all faculty reads
- vNext now: src/modules/academics/schedule-service.ts:255-258,333-336 academics.manage, and faculty-schedule-service.ts:23-100 authorized deliveries
- Fix: Verify faculty mutation path honors teach-this-class, not just college scope; admin reports remain all-faculty

## G2-18-020-033  [P1] GAP  facet F12  effort L
- Legacy: ClassScheduleRepository.java:67-71 elective future-clash half-open overlap test
- vNext now: src/modules/academics/schedule-service.ts:243-453 shows period validation but not elective conflict query
- Fix: Provide future-overlap warning across learner elective sections using starts<otherEnds and otherStarts<ends

## G2-18-020-045  [P1] GAP  facet F20  effort L
- Legacy: ClassScheduleRepository.java:149-165 edit excludes self from conflict query
- vNext now: src/modules/academics/schedule-service.ts:385-421 update scoped by ID/status without clash query
- Fix: Check conflict against other rows, exclude self ID and serialize concurrent update/insert

## G2-2-032-011  [P1] GAP  facet F01  effort L
- Legacy: ClassScheduleController.java:472-519 own learner schedule+absent IDs and threshold.
- vNext now: src/modules/attendance/learner-service.ts learner-scoped attendance reports, schedule-service.ts:54-209 calendar.
- Fix: Combine exact threshold, missed sessions and course-specific schedule view where old client expects it.

## G2-2-032-022  [P1] GAP  facet F04  effort L
- Legacy: ClassScheduleDTO.java:11-31 snake_case IDs and startTime/endTime strings.
- vNext now: src/modules/academics/schedule-service.ts:243-303 uses UUIDs and offset-aware startsAt/endsAt.
- Fix: Define ID/time conversion for every legacy session and API consumer.

## G2-2-032-090  [P1] GAP  facet F20  effort M
- Legacy: ClassScheduleController.java:102-118 date parsing bounds at 00:00:00 and 23:59:59.
- vNext now: schedule-service.ts:282-288 parses offset-aware Date and validates academic period.
- Fix: Test IST midnight/DST-independent instants, include last-second milliseconds.

## G2-2-032-097  [P1] GAP  facet F22  effort L
- Legacy: ClassScheduleDTO.java:11-31 legacy int classId/facultyId/courseId/hallId, times as strings.
- vNext now: schedule-service.ts:243-303 UUID sectionId/facultyMembershipId/deliveryId, timestamptz startsAt/endsAt and location.
- Fix: Migrate schedule IDs, staff mappings, course deliveries, lecture hall references and instants.

## G2-18-020-022  [P2] GAP  facet F07  effort M
- Legacy: ClassScheduleDTO.java:14-26 exact 'classId must be a positive number', 'facultyId must be a positive number', 'startTime is required', 'endTime is required'
- vNext now: src/modules/academics/schedule-service.ts:247-250 Zod schema and AcademicsServiceError codes
- Fix: Map field error strings to legacy wording/placeholder and show indexed row in bulk create

## G2-18-020-024  [P2] GAP  facet F08  effort S
- Legacy: ClassScheduleServiceImpl.java create/update/delete returns schedule entity DTO in legacy controller
- vNext now: src/modules/academics/schedule-service.ts:315-316 creates event, 450-451 updates, 493-500 cancels
- Fix: Align create/edited/cancelled success labels and refresh calendar after mutation

## G2-2-032-039  [P2] GAP  facet F07  effort S
- Legacy: ClassScheduleController.java:103-110 invalid date error `Invalid date 'startDate': X`.
- vNext now: schedule-service.ts:40-70 raises typed schedule/period errors; Zod validates ISO.
- Fix: Use precise date field error and user-friendly format expected in clone.

## G2-2-032-040  [P2] GAP  facet F07  effort S
- Legacy: ClassScheduleController.java:113-119 invalid range `startDate must be before or equal to endDate`.
- vNext now: schedule-service.ts:40-70 validates event within academic period, not report query range.
- Fix: Add report-range ordering errors distinct from event edit errors.

## G2-2-032-041  [P2] GAP  facet F07  effort S
- Legacy: ClassScheduleController.java:121-129 required/nonnumeric ID errors include invalid value.
- vNext now: src/modules/academics/schedule-service.ts:319-328 parses UUID eventId.
- Fix: Normalize UUID invalid/missing message without exposing internal IDs.

## G2-2-032-042  [P2] GAP  facet F07  effort S
- Legacy: ClassScheduleController.java:146 error `Either courseSlug or courseId required`.
- vNext now: schedule-service.ts:182-185 nullable course join.
- Fix: Require source where course filter is mandatory, preserve optional elsewhere.

## G2-2-032-043  [P2] GAP  facet F07  effort S
- Legacy: ClassScheduleController.java:165-167/184-186 `Class schedule not found`.
- vNext now: schedule-service.ts:338-342 / :470-473 throws SCHEDULE_EVENT_NOT_FOUND.
- Fix: Present same meaningful error; keep no cross-college entity enumeration.

## G2-2-032-047  [P3] GAP  facet F08  effort S
- Legacy: ClassScheduleController.java:189-190 delete message `Class schedule deleted successfully`.
- vNext now: schedule-service.ts:477-501 marks CANCELLED; section-operations.tsx:520 says `Schedule event cancelled`.
- Fix: Choose old delete wording or explicit canceled wording, preserve feedback placement.
