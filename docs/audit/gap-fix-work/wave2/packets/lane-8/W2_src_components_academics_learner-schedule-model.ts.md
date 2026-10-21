# Work packet (wave 2): edit src/components/academics/learner-schedule-model.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/learner-calendar.md

## G2-18-006-060  [P3] GAP  facet F19  effort S
- Legacy: Old BE sorts DESC by start then client sorts next ASC (`ClassScheduleServiceImpl.java:1041-1045`; `ClassScheduleContent.jsx:180-185`).
- vNext now: New DB query sorts ASC; UI next sorts ASC (`learner-schedule-service.ts:205`; `learner-schedule-model.ts:118-140`).
- Fix: Prove sorting for each surface, especially identical time ties.
