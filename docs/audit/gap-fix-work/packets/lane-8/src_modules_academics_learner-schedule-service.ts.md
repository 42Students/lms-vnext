# Work packet: edit src/modules/academics/learner-schedule-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l18-u020-class-schedule.md, docs/audit/gap2/lane-18/learner-calendar.md

## G2-18-020-013  [P1] GAP  facet F05  effort M
- Legacy: ClassScheduleRepository.java:45-65 lists own faculty/class/multi-class between start/end
- vNext now: src/modules/academics/learner-schedule-service.ts:143-209 authorized roster and deliveries, faculty-schedule-service.ts:23-102 scoped deliveries
- Fix: Verify multiple elective sections included, no leakage of shared events, and start/end inclusive date semantics

## G2-18-006-019  [P1] GAP  facet F05  effort M
- Legacy: Old course options come from program structure (`useCourses.js:90-111`).
- vNext now: New only includes active authorized deliveries, sorted by course name (`learner-schedule-service.ts:143-153`).
- Fix: Decide intentional roster restriction and match visible sort/order.

## G2-18-006-040  [P1] GAP  facet F12  effort M
- Legacy: Old includes class schedule by class ID in date range (`ClassScheduleServiceImpl.java:1041-1069`).
- vNext now: New only includes active enrollments/sections and PLANNED/ACTIVE periods (`learner-schedule-service.ts:120-136`).
- Fix: Confirm historical/closed period view rules and restore history when required.

## G2-18-006-067  [P1] GAP  facet F22  effort L
- Legacy: Old start/end stored strings, query backend range (`ClassSchedule.java:24-27`; `ClassScheduleController.java:522-530`).
- vNext now: New typed timestamptz overlap where endsAt >= from, startsAt < to (`academics.ts:467-472`; `learner-schedule-service.ts:189-205`).
- Fix: Compare inclusive boundaries and define source-zone migration.
