# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-5/u005-recruiter-calendar.md

23 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-5/u005-recruiter-calendar.md

## G2-5-005-002  [P2] GAP  facet F01 Purpose/entry/navigation  effort S
- Legacy: Page title Calendar (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:76-78)
- vNext now: Page title Recruiter Calendar and Drives action (src/app/(authenticated)/hr/calendar/page.tsx:313-319)
- Fix: Use exact title Calendar in same header; additional link separate.

## G2-5-005-004  [P2] GAP  facet F02 Layout/section order  effort L
- Legacy: PageShell ListingPageHeader and week navigation, range, then error/loading/agenda (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:74-91)
- vNext now: PageHeader, no-college, tabs, category tabs, nav, Jump/date/Export, next event (src/app/(authenticated)/hr/calendar/page.tsx:312-430)
- Fix: Restore header→week nav→range→agenda order.

## G2-5-005-007  [P2] GAP  facet F03 Visible elements  effort S
- Legacy: Three header controls icon-only Previous week, Today, icon-only Next week (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:79-85)
- vNext now: Links ← Previous, Today, Next → in lower toolbar (src/app/(authenticated)/hr/calendar/page.tsx:364-379)
- Fix: Place compact icon-only arrows alongside title, preserve aria.

## G2-5-005-010  [P2] GAP  facet F03 Visible elements  effort S
- Legacy: PROPOSED SLOT shows Waiting for the placement cell Tag (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:116-118)
- vNext now: Shows Waiting for the cell StatusBadge (src/app/(authenticated)/hr/calendar/page.tsx:208-217)
- Fix: Use full exact wording and placement.

## G2-5-005-011  [P2] GAP  facet F03 Visible elements  effort M
- Legacy: Row displays start time, title, job title, where, folded slot count (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:101-117)
- vNext now: Separate company/college/title/time/venue/status/action blocks (src/app/(authenticated)/hr/calendar/page.tsx:164-226)
- Fix: Recreate single row and compact secondary line with slot count.

## G2-5-005-012  [P2] GAP  facet F03 Visible elements  effort S
- Legacy: Today day card gets recruiter-calendar__day--today highlight (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:98-100)
- vNext now: Grid data-today and Today suffix; mobile heading lacks today suffix (src/app/(authenticated)/hr/calendar/page.tsx:482-510)
- Fix: Show Today highlight/suffix on narrow day cards.

## G2-5-005-019  [P2] GAP  facet F05 Tables/lists  effort S
- Legacy: Filters out zero-event days; one single info alert if no events (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:96-123)
- vNext now: Desktop shows all seven cells incl empty dash, mobile excludes zero days (src/app/(authenticated)/hr/calendar/page.tsx:459-559)
- Fix: Hide empty days in default agenda, not placeholders.

## G2-5-005-021  [P2] GAP  facet F05 Tables/lists  effort M
- Legacy: AntD day Cards narrow and compact, no calendar cell scroll (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:97-122)
- vNext now: Grid day cells scroll-y max-h52 (src/app/(authenticated)/hr/calendar/page.tsx:512-559)
- Fix: Replace dense grid with day card for week default.

## G2-5-005-027  [P2] GAP  facet F07 Validation/errors  effort S
- Legacy: Recruiter account load failure shows Result warning and Reload button (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:69-70)
- vNext now: Redirect dashboard for invalid recruiter role (src/app/(authenticated)/hr/calendar/page.tsx:241-243)
- Fix: Differentiate transient failure from revoked role; Retry account where possible.

## G2-5-005-028  [P2] GAP  facet F07 Validation/errors  effort S
- Legacy: GET Retry same week without losing last result (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:88-89)
- vNext now: SSR fetch no inline retry button (src/app/(authenticated)/hr/calendar/page.tsx:276-284)
- Fix: Add visible refetch for failed current window.

## G2-5-005-033  [P2] GAP  facet F09 Modals/disclosures  effort S
- Legacy: Each row acts as clickable role button, not modal (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:104-111)
- vNext now: Explicit Open hiring drive link action, no modal (src/app/(authenticated)/hr/calendar/page.tsx:221-229)
- Fix: Enable full row activation keyboard equivalent with direct link.

## G2-5-005-039  [P2] GAP  facet F11 Permissions  effort S
- Legacy: Account error Retry reload while retaining current role shell (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:68-70)
- vNext now: redirect() on inactive recruiter (src/app/(authenticated)/hr/calendar/page.tsx:241-243)
- Fix: Handle temporary identity lookup failures separately from forbidden access.

## G2-5-005-041  [P2] GAP  facet F12 Business rules  effort M
- Legacy: Total based only events returned for week (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:65-72)
- vNext now: Count regular events + resultsDue (separate set) (src/app/(authenticated)/hr/calendar/page.tsx:300-304)
- Fix: Reconcile resultsDue possible double count and ensure exactly one per legacy result.

## G2-5-005-043  [P2] GAP  facet F12 Business rules  effort S
- Legacy: PROPOSED slot status Waiting for the placement cell (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:117)
- vNext now: Waiting for the cell (src/app/(authenticated)/hr/calendar/page.tsx:215-217)
- Fix: Exact status phrase and transition.

## G2-5-005-046  [P2] GAP  facet F13 States  effort S
- Legacy: Error Alert warning Retry, empty Alert info exact copy (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:88-91)
- vNext now: EmptyState title exact week text, but description differs slightly and action Today (src/app/(authenticated)/hr/calendar/page.tsx:423-427)
- Fix: Restore warning/empty AntD icon and exact text punctuation.

## G2-5-005-052  [P2] GAP  facet F16 Responsive  effort S
- Legacy: Event rows wrap within small Card, no overflow-y scroll cell (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:98-118)
- vNext now: Day cell max-h52 scroll at >=1100 (src/app/(authenticated)/hr/calendar/page.tsx:512-555)
- Fix: Remove nested day-cell scroll from legacy view.

## G2-5-005-061  [P2] GAP  facet F19 Performance  effort M
- Legacy: foldWeek reduces many slots to one summary row (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:96-123; docs/legacy-source/frontend/src/components/recruiter/RecruiterToday.jsx:24-30)
- vNext now: No fold of projected slots, extra boxes (src/modules/placements/recruiter-calendar-model.ts:141-153)
- Fix: Aggregate by round and date for render performance.

## G2-5-005-008  [P3] GAP  facet F03 Visible elements  effort S
- Legacy: Week range D MMM to D MMM YYYY (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:87)
- vNext now: Range d MMM YYYY – d MMM YYYY (src/app/(authenticated)/hr/calendar/page.tsx:306-309)
- Fix: Use exact asymmetric range format and word to.

## G2-5-005-055  [P3] GAP  facet F17 Accessibility  effort S
- Legacy: Range and empty state data-testid recruiter.calendar.range/.empty (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:87; docs/legacy-source/frontend/src/pages/recruiter/calendar.js:91)
- vNext now: No corresponding testIDs visible (src/app/(authenticated)/hr/calendar/page.tsx:343-430)
- Fix: Restore stable data-testid markers for regression screenshots.

## G2-5-005-056  [P3] GAP  facet F18 Wording  effort S
- Legacy: Title Calendar (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:76-78)
- vNext now: Title Recruiter Calendar (src/app/(authenticated)/hr/calendar/page.tsx:313-316)
- Fix: Use exact title and header.

## G2-5-005-057  [P3] GAP  facet F18 Wording  effort S
- Legacy: Previous/Next icon-only, Today literal (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:81-84)
- vNext now: ← Previous, Today, Next → (src/app/(authenticated)/hr/calendar/page.tsx:365-379)
- Fix: Use icon-only arrows with aria labels.

## G2-5-005-058  [P3] GAP  facet F18 Wording  effort S
- Legacy: Nothing scheduled this week, Rounds, slots and deadlines appear here as soon as they are dated. (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:91)
- vNext now: Title same, description same, extra Today action (src/app/(authenticated)/hr/calendar/page.tsx:423-427)
- Fix: Match empty state without Today action unless new UX approved.

## G2-5-005-059  [P3] GAP  facet F18 Wording  effort S
- Legacy: Waiting for the placement cell (docs/legacy-source/frontend/src/pages/recruiter/calendar.js:117)
- vNext now: Waiting for the cell (src/app/(authenticated)/hr/calendar/page.tsx:215-217)
- Fix: Use full copy.
