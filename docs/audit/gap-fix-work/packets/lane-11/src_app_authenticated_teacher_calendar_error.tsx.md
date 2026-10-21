# Work packet: edit src/app/(authenticated)/teacher/calendar/error.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u011-teacher-calendar.md

## G2-5-011-030  [P1] GAP  facet F08  effort M
- Legacy: Course-load warning headline `Failed to load course data` and description `Calendar events may be incomplete...` (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:387-397`)
- vNext now: No component-level course warning; server request falls to route-level error (`src/app/(authenticated)/teacher/calendar/error.tsx:12-21`)
- Fix: Support partial calendar rendering and exact dismissible warning.

## G2-5-011-047  [P1] GAP  facet F13  effort M
- Legacy: Legacy grid fetch failure is dismissible, inline, Retry reloads only schedule (`docs/legacy-source/frontend/src/components/CalendarComp/CalendarEvents/CalendarEvents.js:233-253`)
- vNext now: vNext error boundary gives full page Retry reset / Back to courses (`src/app/(authenticated)/teacher/calendar/error.tsx:12-21`)
- Fix: Provide inline schedule retry without hiding a previously loaded calendar.

## G2-5-011-029  [P2] GAP  facet F07  effort M
- Legacy: Legacy calendar fetch error copy is `Unable to load class schedule. Please try again.` (`docs/legacy-source/frontend/src/components/CalendarComp/CalendarEvents/CalendarEvents.js:152-155`)
- vNext now: vNext route error `Unable to load Class Schedule` / `This Faculty page could not load...` (`src/app/(authenticated)/teacher/calendar/error.tsx:12-21`)
- Fix: Align exact warning/retry copy and inline placement with recoverable partial data.
