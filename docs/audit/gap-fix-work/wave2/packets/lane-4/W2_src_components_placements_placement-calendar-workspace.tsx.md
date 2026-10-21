# Work packet (wave 2): edit src/components/placements/placement-calendar-workspace.tsx

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u002-college-admin-calendar.md, docs/audit/gap2/lane-5/u007-superadmin-calendar.md, docs/audit/gap2/lane-5/u012-tpo-calendar.md

## G2-5-002-006  [P2] GAP  facet F02 Layout/section order  effort S
- Legacy: Metrics Scheduled / Today / Companies / Conflicts in one header row. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:771-775)
- vNext now: Directory SummaryStrip matches labels; graphical calendar displays College rounds and Matching events. (src/app/(authenticated)/college/placements/interviews/page.tsx:63; src/components/placements/placement-calendar-workspace.tsx:635-664)
- Fix: Show four legacy metrics on direct global Interviews landing.

## G2-5-002-031  [P2] GAP  facet F07 Validation/errors  effort S
- Legacy: Nonpositive/malformed jobId ignored; positive ID applied. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:190-199)
- vNext now: No jobId exact ID filter; job text instead. (src/app/(authenticated)/college/placements/interviews/page.tsx:24-30; src/components/placements/placement-calendar-workspace.tsx:173-181)
- Fix: Validate deep-linked IDs without turning malformed into fatal page.

## G2-5-002-053  [P2] GAP  facet F16 Responsive  effort L
- Legacy: Separate small-screen card layout and mobile filter bar. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:651-734; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:925-1021)
- vNext now: Calendar hides grid below 992 and uses agenda; directory generic DataTable. (src/components/placements/placement-calendar-workspace.tsx:961-966; src/components/placements/placement-calendar-workspace.tsx:1105-1136; src/app/(authenticated)/college/placements/interviews/page.tsx:43-55)
- Fix: Recreate card layout and action placement on mobile.

## G2-5-007-011  [P2] GAP  facet F03 Visible elements  effort L
- Legacy: Screening/Technical/HR/Managerial/Final colored subtype tags (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:51-58; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:501-509)
- vNext now: Round kind raw category in calendar label, no five appointment subtypes (src/modules/admin-ui/super-admin-placement-interviews-service.ts:14-17; src/components/placements/placement-calendar-workspace.tsx:310-325)
- Fix: Persist and render legacy interview type chips.

## G2-5-007-026  [P2] GAP  facet F06 Forms  effort M
- Legacy: Conditional Company filter and Job chip (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:830-844)
- vNext now: Company search always, Job text inside Filters (src/components/placements/placement-calendar-workspace.tsx:781-793; src/components/placements/placement-calendar-workspace.tsx:849-859)
- Fix: Match conditional company picker and jobId removable chip.

## G2-5-007-029  [P2] GAP  facet F07 Validation/errors  effort M
- Legacy: Malformed ?jobId ignored, positive numeric accepted (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:190-199)
- vNext now: Query uses free-text job and strict date (src/app/(authenticated)/admin/placements/calendar/page.tsx:8-14; src/components/placements/placement-calendar-workspace.tsx:160-181)
- Fix: Preserve valid numeric deep-linked jobId and safe malformed handling.

## G2-5-007-057  [P2] GAP  facet F17 Accessibility  effort M
- Legacy: Rows keyboard-operable and per-row .ics action non-bubbling (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:1023-1043)
- vNext now: Calendar event links keyboardable, no row ICS control (src/components/placements/placement-calendar-workspace.tsx:346-425; src/components/placements/placement-calendar-workspace.tsx:905-1136)
- Fix: Implement focusable interview row and independent download action.

## G2-5-012-005  [P2] GAP  facet F02  effort M
- Legacy: Header shows Calendar title, inline subtitle, segmented view switch on the right (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:223-235`)
- vNext now: vNext has separate Calendar controls section after summaries (`src/components/placements/placement-calendar-workspace.tsx:563-705`)
- Fix: Move view switch into PageHeader and match inline title/subtitle/actions

## G2-5-012-006  [P2] GAP  facet F02  effort L
- Legacy: Page order: summary warning, Today next-step strip, optional focused card, command bar, main calendar (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:237-333`)
- vNext now: vNext adds edit-gate banner, separate needs cards, four stat tiles, filters, Next scheduled panel (`src/components/placements/placement-calendar-workspace.tsx:592-943`)
- Fix: Match legacy order and continuous canvas; conceal extra panels behind optional action

## G2-5-012-008  [P2] GAP  facet F02  effort M
- Legacy: Legacy command bar is one Card with period navigator and legend filters (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:288-322`)
- vNext now: vNext spreads Calendar controls, GET form and type chips into separate sections (`src/components/placements/placement-calendar-workspace.tsx:666-903`)
- Fix: Consolidate into legacy single command bar surface

## G2-5-012-010  [P2] GAP  facet F03  effort M
- Legacy: Header top-right Segmented contains Week Month Agenda (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:227-234`)
- vNext now: vNext renders lower-page linked tabs (`src/components/placements/placement-calendar-workspace.tsx:677-705`)
- Fix: Use segmented-style control positioned at header top-right

## G2-5-012-012  [P2] GAP  facet F03  effort S
- Legacy: Range label gives n items in this week/month/period (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:295-298`)
- vNext now: vNext shows selected IST date range, summary counts elsewhere (`src/components/placements/placement-calendar-workspace.tsx:666-676`)
- Fix: Add inline period-specific count label

## G2-5-012-013  [P2] GAP  facet F03  effort S
- Legacy: Five type-chip tooltips vary between Show only, Hide and Show too (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:301-310`)
- vNext now: vNext labels only type and count, with selected aria-label (`src/components/placements/placement-calendar-workspace.tsx:882-902`)
- Fix: Match chip tooltips for all three toggle states

## G2-5-012-014  [P2] GAP  facet F03  effort M
- Legacy: Today row is clickable and past items show middot done; deadlines prefix Today (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:250-259`)
- vNext now: vNext Today entries are plain list text, only DONE state renders Done (`src/components/placements/placement-calendar-workspace.tsx:607-614`)
- Fix: Restore clickable today items and legacy done/time display

## G2-5-012-015  [P2] GAP  facet F03  effort S
- Legacy: Next-seven line names earliest upcoming title and day (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:261-269`)
- vNext now: vNext prints only Next 7 days count (`src/components/placements/placement-calendar-workspace.tsx:607-615`)
- Fix: Add first title and date to summary line

## G2-5-012-016  [P2] GAP  facet F03  effort S
- Legacy: Week hint explains empty-time click, drag follow-up, and rounds edited from drive (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:332-340`)
- vNext now: vNext renders Week Hour Calendar without equivalent hint immediately above (`src/components/placements/placement-calendar-workspace.tsx:944-960`)
- Fix: Reinstate exact instruction strip

## G2-5-012-017  [P2] GAP  facet F04  effort M
- Legacy: Legacy event popover title, start time, optional venue and note (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:174-187`)
- vNext now: vNext event card has timestamp, company and route link without same popover (`src/components/placements/placement-calendar-workspace.tsx:348-428`)
- Fix: Render optional venue and note in accessible event popover

## G2-5-012-024  [P2] GAP  facet F05  effort M
- Legacy: Company filter is clearable select of distinct current-range company names (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:124-124`)
- vNext now: vNext uses search Input + datalist 200 names and quick chips of 16 (`src/components/placements/placement-calendar-workspace.tsx:781-807`)
- Fix: Restore clearable select semantics and exact distinct list

## G2-5-012-028  [P2] GAP  facet F05  effort S
- Legacy: Month shows first 3 events/day then +N more (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:343-350`)
- vNext now: vNext month shows first 2 then +N more (`src/components/placements/placement-calendar-workspace.tsx:993-1061`)
- Fix: Render first three and exact overflow count

## G2-5-012-031  [P2] GAP  facet F06  effort M
- Legacy: Legacy filters are immediately applied on Select and chip click (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:301-320`)
- vNext now: vNext GET form requires Apply filters after date/company/kind entry (`src/components/placements/placement-calendar-workspace.tsx:751-869`)
- Fix: Use immediate filter without mandatory form submit

## G2-5-012-049  [P2] MISSING  facet F09  effort M
- Legacy: Legacy event Popover opens title,time,venue,note and Open/Move/Done actions (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:174-187`)
- vNext now: vNext always shows card links/forms rather than same popup (`src/components/placements/placement-calendar-workspace.tsx:348-428`)
- Fix: Implement keyboard-triggered event popover with exact content and actions

## G2-5-012-053  [P2] GAP  facet F10  effort L
- Legacy: Legacy GET /api/v1/tpo/calendar from/to calls insights calendar with includeFollowUps true (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoHubController.java:69-72`)
- vNext now: vNext direct SQL listPlacementCalendarEvents with tpoLegacyScope (`src/components/placements/placement-calendar-workspace.tsx:455-475`)
- Fix: Reconcile SQL union and response field contract for visible range

## G2-5-012-066  [P2] GAP  facet F12  effort S
- Legacy: Legacy grid timeline Week steps weeks, Agenda steps 30 days, Month steps months (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:214-215`)
- vNext now: vNext Week step weeks but Agenda uses month step (`src/components/placements/placement-calendar-workspace.tsx:535-551`)
- Fix: Correct rolling Agenda steps to 30 days

## G2-5-012-078  [P2] GAP  facet F16  effort M
- Legacy: Legacy week grid uses true horizontal day columns with all-day lane (`docs/legacy-source/frontend/src/components/tpo/WeekTimeGrid.jsx:31-50`)
- vNext now: vNext TpoWeekHourCalendar and separate blocked all-day section (`src/components/placements/placement-calendar-workspace.tsx:944-961`)
- Fix: Match deadline and blocked all-day lane placement at tablet/desktop

## G2-5-012-079  [P2] GAP  facet F16  effort S
- Legacy: Legacy Month shows calendar irrespective 992px threshold (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:343-350`)
- vNext now: vNext graphical calendar hidden under 992px and agenda shown elsewhere (`src/components/placements/placement-calendar-workspace.tsx:961-970`)
- Fix: Check 768-991 layout; restore compact month where legacy exposes it

## G2-5-012-080  [P2] GAP  facet F16  effort M
- Legacy: Legacy phone Agenda groups day titles and event pills (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:352-368`)
- vNext now: vNext always shows grouped agenda under calendars (`src/components/placements/placement-calendar-workspace.tsx:1082-1135`)
- Fix: Only show agenda on selected mobile mode, avoid duplicate monthly+agenda desktop

## G2-5-012-082  [P2] GAP  facet F17  effort M
- Legacy: Legacy event trigger role button, tabIndex0 and Enter/Space action (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:194-205`)
- vNext now: vNext event content uses ordinary href/forms without trigger popover (`src/components/placements/placement-calendar-workspace.tsx:348-428`)
- Fix: Restore single focusable event trigger with full accessible label

## G2-5-012-083  [P2] GAP  facet F17  effort S
- Legacy: Legacy Needs doing chips are aria-pressed buttons under a role group (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:270-277`)
- vNext now: vNext uses links without aria-pressed state (`src/components/placements/placement-calendar-workspace.tsx:616-634`)
- Fix: Recreate toggled chip semantics, focus and Close

## G2-5-012-087  [P2] GAP  facet F18  effort S
- Legacy: Legacy Today copy Today, {ddd D MMM} and Check today's schedule… (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:250-269`)
- vNext now: vNext uses h2 Today without weekday/date eyebrow (`src/components/placements/placement-calendar-workspace.tsx:607-615`)
- Fix: Restore dated eyebrow and loading copy

## G2-5-012-088  [P2] GAP  facet F18  effort S
- Legacy: Legacy Show everything clears types/company without resetting view/anchor (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:301-320`)
- vNext now: vNext clear link href basePath resets all query params (`src/components/placements/placement-calendar-workspace.tsx:877-879`)
- Fix: Preserve calendar view/date while clearing filters

## G2-5-012-093  [P2] GAP  facet F19  effort M
- Legacy: Legacy company filter options are unpaginated distinct current-range list (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:124-124`)
- vNext now: vNext caps datalist to 200 and quick chip list to 16 (`src/components/placements/placement-calendar-workspace.tsx:794-807`)
- Fix: Support full company search at large data volume without truncating choices silently

## G2-5-012-094  [P2] GAP  facet F20  effort M
- Legacy: Legacy dates use dj dayjs local zone, startOf week and local midnight (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:54-58`)
- vNext now: vNext uses UTC parsing/Asia Kolkata display (`src/components/placements/placement-calendar-workspace.tsx:260-311`)
- Fix: Verify DST/travel browser behavior versus IST policy and calendar midnight

## G2-5-002-013  [P3] GAP  facet F04 Data formatting  effort S
- Legacy: Date format DD MMM YYYY, hh:mm A; null dash. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:105-108)
- vNext now: Intl en-IN medium short with IST suffix. (src/app/(authenticated)/college/placements/interviews/page.tsx:42-49; src/components/placements/placement-calendar-workspace.tsx:292-309)
- Fix: Match fixed 12-hour format, validate zone.

## G2-5-007-016  [P3] GAP  facet F04 Data formatting  effort S
- Legacy: DD MMM YYYY hh:mm A date/time (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:105-108)
- vNext now: Intl medium/short IST dates, format varies (src/modules/admin-ui/super-admin-placement-interviews-service.ts:34-38; src/components/placements/placement-calendar-workspace.tsx:292-306)
- Fix: Use legacy format for appointment rows.

## G2-5-012-011  [P3] GAP  facet F03  effort S
- Legacy: Navigation buttons show visible Previous, Today, Next (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:289-294`)
- vNext now: vNext renders left and right arrows around Today (`src/components/placements/placement-calendar-workspace.tsx:708-743`)
- Fix: Restore literal Previous and Next labels

## G2-5-012-021  [P3] GAP  facet F04  effort S
- Legacy: Time printed h:mm A except BLOCKED/DEADLINE (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:207-209`)
- vNext now: vNext agenda event time explicitly labels IST (`src/components/placements/placement-calendar-workspace.tsx:361-375`)
- Fix: Match time stamp display with agreed IST note outside item

## G2-5-012-029  [P3] GAP  facet F05  effort S
- Legacy: Agenda groups events by day; list header weekday and D MMMM (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:352-367`)
- vNext now: vNext agenda groups and labels dateLabel with short weekday/month (`src/components/placements/placement-calendar-workspace.tsx:1082-1135`)
- Fix: Match long month and date row header typography

## G2-5-012-032  [P3] GAP  facet F06  effort S
- Legacy: Legacy company placeholder All companies (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:312-319`)
- vNext now: vNext company search placeholder Search company name (`src/components/placements/placement-calendar-workspace.tsx:781-791`)
- Fix: Use exact placeholder

## G2-5-012-089  [P3] GAP  facet F18  effort S
- Legacy: Legacy work chip text Follow-ups overdue; Rounds on a blocked date; Busy days (3 or more) (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:115-119`)
- vNext now: vNext adds last 90 days suffix to overdue label (`src/components/placements/placement-calendar-workspace.tsx:619-629`)
- Fix: Restore exact chip text and put lookback in tooltip

## G2-5-012-090  [P3] GAP  facet F18  effort S
- Legacy: Legacy Retry summary button names target (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:237-248`)
- vNext now: vNext warning retry link says Retry (`src/components/placements/placement-calendar-workspace.tsx:592-594`)
- Fix: Rename to Retry summary and preserve other data on retry
