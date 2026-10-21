# Work packet: edit src/app/(authenticated)/teacher/calendar/loading.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u011-teacher-calendar.md

## G2-5-011-046  [P1] GAP  facet F13  effort M
- Legacy: Legacy skeleton 7 headings and 21 schedule cells with aria-busy (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:326-354`)
- vNext now: vNext suspense loading shows GracefulPageLoading `Loading faculty calendar…`, shape directory (`src/app/(authenticated)/teacher/calendar/loading.tsx:1-5`)
- Fix: Implement calendar-grid skeleton with equivalent ARIA status and structure.
