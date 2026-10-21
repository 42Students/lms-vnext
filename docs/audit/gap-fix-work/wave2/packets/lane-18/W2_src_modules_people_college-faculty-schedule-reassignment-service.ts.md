# Work packet (wave 2): edit src/modules/people/college-faculty-schedule-reassignment-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/class-schedule-controller.md

## G2-2-032-051  [P2] GAP  facet F09  effort M
- Legacy: ClassScheduleController.java:197-210 reassign provides report of success/conflicts in one action.
- vNext now: college-faculty-schedule-reassignment-service.ts:109-130 returns row statuses; UI route /college/faculty/...
- Fix: Show per-row report modal and retry-failed action.

## G2-2-032-062  [P2] GAP  facet F11  effort M
- Legacy: ClassScheduleController.java:205-208 requires rights to old AND new faculty for bulk action.
- vNext now: college-faculty-schedule-reassignment-service.ts:15-20 requires academics.manage acting college.
- Fix: Ensure both teachers belong to same college and active assigned schedule access.

## G2-2-032-084  [P3] GAP  facet F18  effort S
- Legacy: ClassScheduleController.java:210 says `Reassigned N of M upcoming session(s)`.
- vNext now: college-faculty-schedule-reassignment-service.ts:130 returns counts, no human copy.
- Fix: Render numeric outcomes and failed reasons.
