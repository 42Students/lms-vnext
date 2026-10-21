# Work packet (wave 2): edit src/app/(authenticated)/teacher/calendar/page.tsx

18 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u011-teacher-calendar.md

## G2-5-011-001  [P2] GAP  facet F01  effort M
- Legacy: Teacher route is a one-component wrapper for the shared class calendar (`docs/legacy-source/frontend/src/pages/teacher/calendar.js:1-5`)
- vNext now: Own server page with an IST month and second detailed schedule (`src/app/(authenticated)/teacher/calendar/page.tsx:21-50`)
- Fix: Compare both role entry paths and consolidate visual structure without losing vNext authorization.

## G2-5-011-010  [P2] GAP  facet F03  effort M
- Legacy: Toolbar has arrow icon buttons on either side of date label (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:264-293`)
- vNext now: Top month navigator uses text links `Previous month`, `Current month`, `Next month` (`src/app/(authenticated)/teacher/calendar/page.tsx:55-69`)
- Fix: Use arrow icon controls and a Today button in legacy arrangement.

## G2-5-011-011  [P2] GAP  facet F03  effort M
- Legacy: Toolbar Month/Week/Day control is a compact Ant Select (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:311-321`)
- vNext now: Month grid always rendered plus view selector only within separate Detailed schedule (`src/app/(authenticated)/teacher/calendar/page.tsx:94-130`)
- Fix: Expose one top-level Month/Week/Day switch at legacy toolbar position.

## G2-5-011-013  [P2] GAP  facet F04  effort M
- Legacy: Event grid display title combines schedule title, course name and class name in parentheses (`docs/legacy-source/frontend/src/components/CalendarComp/CalendarEvents/CalendarEvents.js:120-129`)
- vNext now: vNext month event card displays only event.title (`src/app/(authenticated)/teacher/calendar/page.tsx:103-115`)
- Fix: Assemble course and class supplementary title exactly when distinct.

## G2-5-011-014  [P2] GAP  facet F04  effort M
- Legacy: Legacy event color is deterministic by course and CSS has left border 4px (`docs/legacy-source/frontend/src/components/CalendarComp/CalendarEvents/CalendarEvents.js:130-147`)
- vNext now: Month event cards use shared dayEvent class without matching course color mapping in page (`src/app/(authenticated)/teacher/calendar/page.tsx:102-115`)
- Fix: Restore per-course colors and event left-border in month grid.

## G2-5-011-019  [P2] GAP  facet F04  effort M
- Legacy: Upcoming item fallback is `Scheduled Class`, course name fallback `Class` (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:153-159`)
- vNext now: Month event title renders raw event.title without fallback (`src/app/(authenticated)/teacher/calendar/page.tsx:103-110`)
- Fix: Apply same empty title fallbacks when backend fields are blank.

## G2-5-011-021  [P2] GAP  facet F05  effort M
- Legacy: Course multi-select shows only when more than one course and supports allowClear, responsive tags (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:294-307`)
- vNext now: Top-level single Teaching Section select plus second-calendar per-course chips (`src/app/(authenticated)/teacher/calendar/page.tsx:70-83`)
- Fix: Restore multi-course selector behavior and course filtering within same calendar surface.

## G2-5-011-023  [P2] GAP  facet F05  effort M
- Legacy: Legacy grid uses one calendar with date navigator and month/week/day selection (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:264-324`)
- vNext now: Month grid plus second detailed week/day schedule can show conflicting view contexts (`src/app/(authenticated)/teacher/calendar/page.tsx:94-130`)
- Fix: Deduplicate calendar navigation state or make second view explicit optional mode.

## G2-5-011-024  [P2] GAP  facet F06  effort M
- Legacy: Only input is course multi-select with array IDs, default all, clearable (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:86-101`)
- vNext now: Top form requires Month via DateInput and a delivery UUID; requires Apply submit (`src/app/(authenticated)/teacher/calendar/page.tsx:70-88`)
- Fix: Replace mandatory form submit with immediate legacy filter; month navigation should not be a required field.

## G2-5-011-026  [P2] GAP  facet F06  effort M
- Legacy: Legacy calendar filter is disabled/hidden entirely if <=1 course (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:294-307`)
- vNext now: Teaching Section select always shown even with zero/one assignment (`src/app/(authenticated)/teacher/calendar/page.tsx:77-84`)
- Fix: Hide redundant selector under legacy count conditions, or document deliberate override.

## G2-5-011-035  [P2] GAP  facet F09  effort M
- Legacy: Legacy Month/Week/Day and course controls are Ant Select popovers (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:294-322`)
- vNext now: vNext uses native `Select` and a server GET filter form (`src/app/(authenticated)/teacher/calendar/page.tsx:70-87`)
- Fix: Compare keyboard popup and tag-clear behaviors, preserve expected UX.

## G2-5-011-043  [P2] GAP  facet F12  effort M
- Legacy: Legacy initial view week and current date per Context (`docs/legacy-source/frontend/src/contexts/calendar-context.js:3-5`)
- vNext now: Month always rendered at top regardless of detailed initialView week (`src/app/(authenticated)/teacher/calendar/page.tsx:94-130`)
- Fix: Restore initial week as primary view; use month only when selected.

## G2-5-011-048  [P2] GAP  facet F13  effort M
- Legacy: Legacy no faculty id shows `Your faculty ID is not set. Contact your administrator.` (`docs/legacy-source/frontend/src/components/CalendarComp/CalendarEvents/CalendarEvents.js:199-220`)
- vNext now: vNext empty state says no current teaching assignments (`src/app/(authenticated)/teacher/calendar/page.tsx:89-93`)
- Fix: Distinguish missing account identity vs no assigned Sections.

## G2-5-011-053  [P2] GAP  facet F16  effort M
- Legacy: Legacy renders StandardCalendar desktop and CalendarMobileList on mobile (`docs/legacy-source/frontend/src/components/CalendarComp/CalendarEvents/CalendarEvents.js:263-299`)
- vNext now: Top vNext 42-day grid forces min width 770px and horizontal scrolling at <=767 (`src/app/(authenticated)/teacher/calendar/page.tsx:94-119`)
- Fix: Use compact mobile agenda/list instead of horizontal desktop grid as primary phone UI.

## G2-5-011-055  [P2] GAP  facet F17  effort M
- Legacy: Legacy toolbar arrows are semantic buttons with aria-label and Enter/Space handler (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:114-120`)
- vNext now: vNext period navigation uses links with visible text; keyboard semantics differ (`src/app/(authenticated)/teacher/calendar/page.tsx:61-68`)
- Fix: Check focus order and accessible labels/activation against legacy keyboard model.

## G2-5-011-057  [P2] GAP  facet F17  effort M
- Legacy: Legacy course filter has `Filter calendar by course` aria label (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:295-305`)
- vNext now: Top vNext filter uses visible `Teaching Section` label rather than course-label semantics (`src/app/(authenticated)/teacher/calendar/page.tsx:77-83`)
- Fix: Preserve explicit accessible course filtering and multi-select state.

## G2-5-011-058  [P2] GAP  facet F18  effort M
- Legacy: Legacy header `Class Schedule`, Week/Month/Day and `Today` labels (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:308-321`)
- vNext now: vNext title matches but adds `Month (IST)`, `Teaching Section`, `Apply` and `Detailed day/week schedule` (`src/app/(authenticated)/teacher/calendar/page.tsx:50-88`)
- Fix: Compare to legacy-copy-A and hide nonlegacy duplicated labels in strict visual clone.

## G2-5-011-060  [P2] GAP  facet F18  effort M
- Legacy: Legacy header uses `Calendar view` aria-label and `Filter calendar by course` (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:295-321`)
- vNext now: vNext month form has `Month (IST)` and `Teaching Section` (`src/app/(authenticated)/teacher/calendar/page.tsx:70-83`)
- Fix: Align control naming and exact placeholders/aria-labels.
