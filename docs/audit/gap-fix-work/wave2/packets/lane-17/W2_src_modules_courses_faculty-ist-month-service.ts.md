# Work packet (wave 2): edit src/modules/courses/faculty-ist-month-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u011-teacher-calendar.md

## G2-5-011-036  [P2] GAP  facet F10  effort M
- Legacy: Grid uses GET `/api/v1/scheduleClass/getClassScheduleByFacultyIdByDateRange` with facultyId,startDate,endDate (`docs/legacy-source/frontend/src/api/serviceUrl.js:114-118`)
- vNext now: vNext invokes getFacultyIstMonth->getFacultyClassSchedule->Drizzle select, no browser GET calendar API (`src/modules/courses/faculty-ist-month-service.ts:13-24`)
- Fix: Specify route/data-contract mapping in eventual fix, including date range and authorization.
