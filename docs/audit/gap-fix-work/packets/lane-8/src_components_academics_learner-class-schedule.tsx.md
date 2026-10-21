# Work packet: edit src/components/academics/learner-class-schedule.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/learner-calendar.md

## G2-18-006-017  [P1] GAP  facet F05  effort L
- Legacy: Old calendar fetch date range recomputed on day/week/month navigation (`CalendarEvents.js:69-100`).
- vNext now: New server query fixed to initial visible month; arrow changes local anchor only (`learner-calendar-window-model.ts:5-15`; `learner-class-schedule.tsx:389-392`).
- Fix: Refetch by visible period and synchronize URL on navigation.

## G2-18-006-020  [P1] MISSING  facet F05  effort M
- Legacy: Old reactive BigCalendar default `+N more` popup (`StandardCalendar.js:48-49,224-253`).
- vNext now: New grid shows `+N more` as static text (`learner-class-schedule.tsx:735-751`).
- Fix: Make overflow indicator open all hidden sessions.

## G2-18-006-021  [P1] GAP  facet F05  effort L
- Legacy: Old week/day event calendar supports duration blocks (`StandardCalendar.js:224-253`).
- vNext now: New hourly grid groups events only by start hour (`learner-class-schedule.tsx:177-213`).
- Fix: Span blocks across end times and handle overlaps.

## G2-18-006-032  [P1] MISSING  facet F09  effort M
- Legacy: Old react-big-calendar default overflow popup (`StandardCalendar.js:48-49,224-253`).
- vNext now: New has inert text `+N more` (`learner-class-schedule.tsx:735-751`).
- Fix: Implement overflow dialog with all hidden sessions.

## G2-18-006-036  [P1] GAP  facet F10  effort M
- Legacy: Old independent GET upcoming today to +180 days (`ClassScheduleContent.jsx:122-196`).
- vNext now: New upcoming derives from visible-window events (`learner-class-schedule.tsx:372-382`).
- Fix: Restore separate stable upcoming source.

## G2-18-006-041  [P1] GAP  facet F12  effort M
- Legacy: Old metrics remain anchored to today independent of navigated grid (`ClassScheduleContent.jsx:122-228`).
- vNext now: New metrics use filtered events from initially fetched window (`learner-class-schedule.tsx:354-382`).
- Fix: Keep today/upcoming metrics independent of grid filters/anchor.

## G2-18-006-046  [P1] GAP  facet F13  effort M
- Legacy: Old noninitial fetch preserves prior events with small spinner (`CalendarEvents.js:256-262`).
- vNext now: New local period navigation with no fetch/loading state (`learner-class-schedule.tsx:389-392`).
- Fix: Add refetch spinner and stale-response handling.

## G2-18-006-059  [P1] GAP  facet F19  effort L
- Legacy: Old fetch scopes to visible range, aborts previous, sequencing prevents stale results (`CalendarEvents.js:69-103,152-173`).
- vNext now: New fixed server month window, no local requests on nav (`page.tsx:20-25`; `learner-class-schedule.tsx:389-392`).
- Fix: Add bounded refetch with abort/sequence checks.

## G2-18-006-061  [P1] GAP  facet F20  effort M
- Legacy: Old `AbortController`, fetchSeq protect rapid nav (`CalendarEvents.js:94-103,152-173`).
- vNext now: New nav only updates local month, data remains server initial (`learner-class-schedule.tsx:389-392`).
- Fix: Prevent stale period/data mismatch, include latest wins.

## G2-18-006-069  [P1] MISSING  facet F23  effort M
- Legacy: Old upcoming 180-day data independent of grid (`ClassScheduleContent.jsx:122-228`).
- vNext now: New fixed month payload omits long-range behavior (`learner-calendar-window-model.ts:5-15`; `learner-class-schedule.tsx:372-382`).
- Fix: Restore independent long-range metric dataset.

## G2-18-006-029  [P2] MISSING  facet F08  effort M
- Legacy: Old upcoming error banner `Couldn't load your next classes` and exact refresh instructions (`ClassScheduleContent.jsx:398-406`).
- vNext now: New has no separate upcoming fetch or error (`learner-class-schedule.tsx:372-382`).
- Fix: Restore isolated upcoming warning on fetch failure.
