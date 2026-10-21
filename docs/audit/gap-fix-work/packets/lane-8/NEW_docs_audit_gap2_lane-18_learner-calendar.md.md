# Work packet: NEW / MISSING items from docs/audit/gap2/lane-18/learner-calendar.md

2 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-18/learner-calendar.md

## G2-18-006-028  [P1] GAP  facet F07  effort M
- Legacy: Old independent course fetch error `Failed to load course data` + `Calendar events may be incomplete. Please try refreshing the page.` (`ClassScheduleContent.jsx:387-397`).
- vNext now: New server exception replaces whole page (`page.tsx:20-25`; `error.tsx:14-21`).
- Fix: Keep grid with partial course-warning fallback.

## G2-18-006-027  [P2] GAP  facet F07  effort M
- Legacy: Old inline warning `Unable to load class schedule. Please try again.` closable with Retry (`CalendarEvents.js:152-155,233-250`).
- vNext now: New route error page Alert and Retry, not closable (`error.tsx:14-21`).
- Fix: Restore nonfatal inline closable error for failed reloads.
