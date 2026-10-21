# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-5/u004-mentor-calendar.md

12 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-5/u004-mentor-calendar.md

## G2-5-004-003  [P2] GAP  facet F01 Purpose/entry/navigation  effort M
- Legacy: Legacy ln-module-card shell (docs/legacy-source/frontend/src/pages/mentor/calendar.js:233-241)
- vNext now: PageHeader and grid wrappers (src/app/(authenticated)/mentor/calendar/page.tsx:48-51)
- Fix: Restore card wrapper geometry.

## G2-5-004-004  [P2] GAP  facet F02 Layout/section order  effort M
- Legacy: Immediately Upcoming then Past sections after header (docs/legacy-source/frontend/src/pages/mentor/calendar.js:233-304)
- vNext now: Large FilterBar, export and result count before list (src/app/(authenticated)/mentor/calendar/page.tsx:51-144)
- Fix: Place list directly after header and utilities in secondary space.

## G2-5-004-009  [P2] GAP  facet F03 Visible elements  effort M
- Legacy: Bold title, muted project title, status AntD Tag (docs/legacy-source/frontend/src/pages/mentor/calendar.js:88-113)
- vNext now: h3 title, project subtitle, StatusBadge (src/components/projects/mentor-meetings-calendar.tsx:35-45)
- Fix: Match type scale, color and tag dimensions.

## G2-5-004-014  [P2] GAP  facet F04 Data formatting  effort S
- Legacy: Separate date, time and Sprint spans gap16 (docs/legacy-source/frontend/src/pages/mentor/calendar.js:115-119)
- vNext now: One paragraph with dot separators (src/components/projects/mentor-meetings-calendar.tsx:47-51)
- Fix: Use legacy grouped spans.

## G2-5-004-051  [P2] GAP  facet F16 Responsive  effort M
- Legacy: Card flex-wrap and 16px padding with mobile wrap (docs/legacy-source/frontend/src/pages/mentor/calendar.js:88-129)
- vNext now: CSS module article with different responsive rules (src/components/projects/mentor-meetings-calendar.tsx:35-63)
- Fix: Match padding, 12px gutters and long text wrap.

## G2-5-004-007  [P3] GAP  facet F03 Visible elements  effort S
- Legacy: CalendarOutlined icon preceding Upcoming label (docs/legacy-source/frontend/src/pages/mentor/calendar.js:258-261)
- vNext now: Upcoming heading no icon (src/components/projects/mentor-meetings-calendar.tsx:88-91)
- Fix: Add small inline calendar icon.

## G2-5-004-008  [P3] GAP  facet F03 Visible elements  effort S
- Legacy: LinkOutlined icon preceding Join link (docs/legacy-source/frontend/src/pages/mentor/calendar.js:120-124)
- vNext now: Join link has text only (src/components/projects/mentor-meetings-calendar.tsx:55-57)
- Fix: Add external link icon.

## G2-5-004-011  [P3] GAP  facet F03 Visible elements  effort S
- Legacy: Show all/fewer renders text-link anchor with role=button (docs/legacy-source/frontend/src/pages/mentor/calendar.js:281-295)
- vNext now: Secondary styled Button (src/components/projects/mentor-meetings-calendar.tsx:110-115)
- Fix: Match link appearance without removing native semantics.

## G2-5-004-045  [P3] GAP  facet F13 States  effort S
- Legacy: No upcoming meetings./No past meetings yet. via AntD Empty icon (docs/legacy-source/frontend/src/pages/mentor/calendar.js:262-276)
- vNext now: Exact strings in unadorned paragraphs (src/components/projects/mentor-meetings-calendar.tsx:93-109)
- Fix: Restore empty icon/spacing.

## G2-5-004-046  [P3] GAP  facet F13 States  effort S
- Legacy: AntD error Alert + Retry (docs/legacy-source/frontend/src/pages/mentor/calendar.js:248-255)
- vNext now: Error Banner + Retry button (src/components/projects/mentor-calendar-load-failure.tsx:8-13)
- Fix: Match warning geometry.

## G2-5-004-056  [P3] GAP  facet F18 Wording  effort S
- Legacy: Upcoming (N), Past & Cancelled (N), Show all N past meetings, Show fewer (docs/legacy-source/frontend/src/pages/mentor/calendar.js:258-261; docs/legacy-source/frontend/src/pages/mentor/calendar.js:273-295)
- vNext now: Same wording but Upcoming icon absent (src/components/projects/mentor-meetings-calendar.tsx:88-115)
- Fix: Restore icon only, preserve wording.

## G2-5-004-057  [P3] GAP  facet F18 Wording  effort S
- Legacy: Join link and Open project texts (docs/legacy-source/frontend/src/pages/mentor/calendar.js:120-127)
- vNext now: Exact texts; missing LinkOutlined (src/components/projects/mentor-meetings-calendar.tsx:55-61)
- Fix: Add icon adjacent Join.
