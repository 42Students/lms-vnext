# Work packet (wave 2): edit src/app/(authenticated)/hr/calendar/page.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u005-recruiter-calendar.md

## G2-5-005-001  [P2] GAP  facet F01 Purpose/entry/navigation  effort M
- Legacy: Legacy sets active sidebar item calendar, route recruiter/calendar (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:51; docs/legacy-source/frontend/src/pages/recruiter/calendar.js:74-86)
- vNext now: vNext alias recruiter/calendar to hr/calendar, links internal /hr/calendar (src/app/(authenticated)/recruiter/calendar/page.tsx:1; src/app/(authenticated)/hr/calendar/page.tsx:233-243)
- Fix: Keep recruiter-facing route canonical and sidebar active highlighting.

## G2-5-005-003  [P2] GAP  facet F01 Purpose/entry/navigation  effort M
- Legacy: No-college uses NoCollegeSession; account failure warning with Retry (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:69-70)
- vNext now: Inactive recruiter redirects, zero grants shows standalone explanation and Return to Today (src/app/(authenticated)/hr/calendar/page.tsx:241-243; src/app/(authenticated)/hr/calendar/page.tsx:321-340)
- Fix: Match missing college/error/retry treatment, preserve new grant guidance.

## G2-5-005-006  [P2] GAP  facet F02 Layout/section order  effort S
- Legacy: Day header bold dddd D MMM and Today suffix (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:97-123)
- vNext now: Mobile dateLabel format day month year, desktop Mon weekday rows (src/app/(authenticated)/hr/calendar/page.tsx:435-445; src/app/(authenticated)/hr/calendar/page.tsx:589-595)
- Fix: Use legacy full weekday/date in day-card headers.

## G2-5-005-013  [P2] GAP  facet F04 Data shown/formatting  effort S
- Legacy: h:mm A start, end only if event.end and not folded slots (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:112-115)
- vNext now: en-IN time and date full, always to end when end exists (src/app/(authenticated)/hr/calendar/page.tsx:125-139; src/app/(authenticated)/hr/calendar/page.tsx:184-187)
- Fix: Match compact time placement and hide end for folded slots.

## G2-5-005-015  [P2] GAP  facet F04 Data shown/formatting  effort M
- Legacy: Day/week labels use viewer local Moment dates (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:87; docs/legacy-source/frontend/src/pages/recruiter/calendar.js:99)
- vNext now: vNext anchors events in IST and formats ISO day strings (src/app/(authenticated)/hr/calendar/page.tsx:100-139; src/app/(authenticated)/hr/calendar/page.tsx:245-247)
- Fix: Confirm deliberate IST policy; for pixel parity emulate legacy labels for Indian browser, test abroad.

## G2-5-005-035  [P2] GAP  facet F10 Actions/side effects  effort M
- Legacy: Whole event row click navigates via driveHref (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:102-111)
- vNext now: Explicit link on mobile and on desktop grid event (src/app/(authenticated)/hr/calendar/page.tsx:221-229; src/app/(authenticated)/hr/calendar/page.tsx:521-537)
- Fix: Preserve clickable row event cards at every breakpoint.

## G2-5-005-044  [P2] GAP  facet F12 Business rules  effort M
- Legacy: RESULTS_DUE is named event type (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:20-25)
- vNext now: Results due shown as distinct secondary section and links (src/modules/placements/recruiter-calendar-model.ts:156-177; src/app/(authenticated)/hr/calendar/page.tsx:616-647)
- Fix: Integrate results-due event into chronological day agenda rather than separate block.

## G2-5-005-045  [P2] GAP  facet F13 States  effort M
- Legacy: Loading ListSkeleton seven rows, label Loading recruiter calendar (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:89)
- vNext now: Server waits for data, no seven-row list skeleton shown (src/app/(authenticated)/hr/calendar/page.tsx:276-284; src/app/(authenticated)/hr/calendar/page.tsx:343-430)
- Fix: Create loading.tsx with seven row shapes.

## G2-5-005-051  [P2] GAP  facet F16 Responsive  effort L
- Legacy: Single-column agenda on phones and desktop after redesign (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:93-123)
- vNext now: Mobile list only under1100px, wide desktop grid (src/app/(authenticated)/hr/calendar/page.tsx:435-459; src/app/(authenticated)/hr/calendar/page.tsx:459-559)
- Fix: Render compact day agenda also on wide screens default.

## G2-5-005-054  [P2] GAP  facet F17 Accessibility  effort S
- Legacy: Row role=button with tabindex0 Enter/Space (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:104-111)
- vNext now: Semantic Link focus instead of whole card activation (src/app/(authenticated)/hr/calendar/page.tsx:221-229; src/app/(authenticated)/hr/calendar/page.tsx:521-537)
- Fix: Make entire event row an accessible link where applicable.
