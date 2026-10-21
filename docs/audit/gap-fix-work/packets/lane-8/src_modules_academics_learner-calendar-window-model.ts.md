# Work packet: edit src/modules/academics/learner-calendar-window-model.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/learner-calendar.md

## G2-18-006-017  [P1] GAP  facet F05  effort L
- Legacy: Old calendar fetch date range recomputed on day/week/month navigation (`CalendarEvents.js:69-100`).
- vNext now: New server query fixed to initial visible month; arrow changes local anchor only (`learner-calendar-window-model.ts:5-15`; `learner-class-schedule.tsx:389-392`).
- Fix: Refetch by visible period and synchronize URL on navigation.

## G2-18-006-069  [P1] MISSING  facet F23  effort M
- Legacy: Old upcoming 180-day data independent of grid (`ClassScheduleContent.jsx:122-228`).
- vNext now: New fixed month payload omits long-range behavior (`learner-calendar-window-model.ts:5-15`; `learner-class-schedule.tsx:372-382`).
- Fix: Restore independent long-range metric dataset.
