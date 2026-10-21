# Work packet: NEW / MISSING items from docs/audit/gap2/lane-5/u005-recruiter-calendar.md

4 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-5/u005-recruiter-calendar.md

## G2-5-005-026  [P1] GAP  facet F07 Validation/errors  effort M
- Legacy: On GET failure surface backend message/error or Could not load the calendar (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:18; docs/legacy-source/frontend/src/pages/recruiter/calendar.js:61)
- vNext now: Direct awaited service, no page-level Retry or error Catch (src/app/(authenticated)/hr/calendar/page.tsx:276-284)
- Fix: Catch read exceptions; render old alert + Retry and same scope.

## G2-5-005-038  [P1] GAP  facet F11 Permissions  effort M
- Legacy: NoCollegeSession when no selected college (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:69-70)
- vNext now: No grants explanation but no selection among multiple grants (src/app/(authenticated)/hr/calendar/page.tsx:285-340)
- Fix: Offer scoped college selection/multi-grant context matching recruiter identity flow.

## G2-5-005-042  [P1] GAP  facet F12 Business rules  effort L
- Legacy: Only nonempty days show, slots folded into round (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:96-123)
- vNext now: Desktop 7-column board and independent slots (src/app/(authenticated)/hr/calendar/page.tsx:430-560)
- Fix: Use day agenda with folded slots for default week.

## G2-5-005-071  [P1] GAP  facet F23 Extra/dropped  effort S
- Legacy: Legacy day cards only for events (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:74-124)
- vNext now: Large 7-col grid exposed as default desktop (src/app/(authenticated)/hr/calendar/page.tsx:459-559)
- Fix: Switch default wide layout back to legacy agenda or place as separate opt-in.
