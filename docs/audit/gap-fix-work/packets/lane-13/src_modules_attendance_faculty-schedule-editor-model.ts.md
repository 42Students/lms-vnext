# Work packet: edit src/modules/attendance/faculty-schedule-editor-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u027-faculty-class-schedule-controller.md

## G2-16-027-046  [P1] GAP  facet F12  effort S
- Legacy: ClassScheduleServiceImpl.java:149-157,305-318 enforces a 12-hour maximum in transactional create service.
- vNext now: faculty-schedule-mutation-model.ts:1-22 validates only end-after-start; faculty-schedule-editor-model.ts:19-22 caps 12 hours in browser.
- Fix: Revalidate <=12h in server command/schema so direct POST cannot bypass browser guard.

## G2-16-027-015  [P2] GAP  facet F07  effort M
- Legacy: ClassScheduleServiceImpl.java:305-318 start before end, no past booking, precise date format errors.
- vNext now: faculty-schedule-editor-model.ts:17-22 uses different IST wording; no past date check.
- Fix: Align start/end/past and time format error copy.
