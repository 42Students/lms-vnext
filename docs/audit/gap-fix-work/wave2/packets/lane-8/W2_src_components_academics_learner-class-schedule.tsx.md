# Work packet (wave 2): edit src/components/academics/learner-class-schedule.tsx

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/learner-calendar.md, docs/audit/gap2/lane-5/u011-teacher-calendar.md

## G2-18-006-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy calendar event click goes to `/learn/courses/{slug-or-id}/home` (`ClassScheduleContent.jsx:64-80`).
- vNext now: New EventCard links `/learn/courses/{deliveryUUID}/home` (`learner-class-schedule.tsx:266-274`).
- Fix: Preserve direct Home semantics, map slug to authorized delivery.

## G2-18-006-004  [P2] GAP  facet F02  effort M
- Legacy: Old PageShell and one nested calendar card (`PageShell.jsx:50-89`; `ClassScheduleContent.jsx:357-435`).
- vNext now: New standalone header, summary cards, disclosure and calendarCard (`page.tsx:45-71`; `learner-class-schedule.tsx:418-464`).
- Fix: Replicate continuous canvas hierarchy and margins.

## G2-18-006-005  [P2] GAP  facet F02  effort M
- Legacy: Old metric pills inline with heading and conditional on classes (`ClassScheduleContent.jsx:360-384`).
- vNext now: New standalone permanent StatTiles (`learner-class-schedule.tsx:419-443`).
- Fix: Restore header metric pills and hide on no events.

## G2-18-006-006  [P2] GAP  facet F02  effort S
- Legacy: Old next-up strip is always visible above calendar when populated (`ClassScheduleContent.jsx:408-435`).
- vNext now: New next-up Disclosure collapsible (`learner-class-schedule.tsx:444-459`).
- Fix: Keep legacy fixed strip without disclosure.

## G2-18-006-007  [P2] GAP  facet F03  effort S
- Legacy: Old period controls arrow-period-arrow with Ant icons (`ClassScheduleContent.jsx:264-293`).
- vNext now: New arrows are glyphs ← and → with Today between arrows (`learner-class-schedule.tsx:463-495`).
- Fix: Restore icon family, ordering and spacing.

## G2-18-006-008  [P2] GAP  facet F03  effort S
- Legacy: Old pills have CalendarOutlined and ScheduleOutlined icons, teal and green (`ClassScheduleContent.jsx:364-380`).
- vNext now: New StatTiles have Today/Next labels, no icons (`learner-class-schedule.tsx:420-441`).
- Fix: Use legacy icon metric pills.

## G2-18-006-010  [P2] GAP  facet F03  effort M
- Legacy: Old next rows show day, course, time/faculty in three slots (`ClassScheduleContent.jsx:415-427`).
- vNext now: New next rows show badge, time range, event title and expanded metadata (`learner-class-schedule.tsx:235-262,450-457`).
- Fix: Restore compact three-slot row anatomy.

## G2-18-006-011  [P2] GAP  facet F04  effort S
- Legacy: Old event label constructs `title · courseName (className)` and fallback `Scheduled Class` (`CalendarEvents.js:120-129`).
- vNext now: New shows raw title and metadata on separate lines (`learner-class-schedule.tsx:235-262`).
- Fix: Rebuild exact composite label/fallback.

## G2-18-006-013  [P2] GAP  facet F04  effort S
- Legacy: Old next-pill today `h:mm A`, tomorrow `Tomorrow h:mm A`, else `ddd h:mm A` (`ClassScheduleContent.jsx:209-227`).
- vNext now: New next tile uses weekday and ` · Next: course` (`learner-class-schedule.tsx:426-440`).
- Fix: Match date-sensitive pill formatting/truncation.

## G2-18-006-014  [P2] GAP  facet F04  effort M
- Legacy: Old Today popover lists course and start time (`ClassScheduleContent.jsx:230-247`).
- vNext now: New Today tooltip is multiline native title (`learner-class-schedule.tsx:293-303,420-425`).
- Fix: Render titled popup with course/time rows.

## G2-18-006-015  [P2] GAP  facet F04  effort S
- Legacy: Old Next popover fields Course, Time, Date, optional Faculty/Room (`ClassScheduleContent.jsx:249-262`).
- vNext now: New title includes Course/Class/Location/Time with location `Not specified` (`learner-class-schedule.tsx:153-160`).
- Fix: Match exact labels/order and hide absent fields.

## G2-18-006-018  [P2] GAP  facet F05  effort M
- Legacy: Old course filter Ant multiple Select, responsive tags, clear and placeholder `All courses` (`ClassScheduleContent.jsx:294-306`).
- vNext now: New per-course FilterChips and All courses button (`learner-class-schedule.tsx:572-607`).
- Fix: Restore multiselect control and clear semantics.

## G2-18-006-024  [P2] GAP  facet F06  effort S
- Legacy: Old multiselect clearing can leave no courses selected (`ClassScheduleContent.jsx:94-101,295-306`).
- vNext now: New reset action selects all, FilterChips toggle individual (`learner-class-schedule.tsx:396-404,546-551`).
- Fix: Implement empty selection and clear parity.

## G2-18-006-031  [P2] MISSING  facet F09  effort M
- Legacy: Old MetricPill click popovers with titled dialogs, Escape focus return (`MetricPill.jsx:29-91`).
- vNext now: New stat-tile title attribute only (`learner-class-schedule.tsx:293-303`).
- Fix: Restore clickable accessible Today/Next popovers.

## G2-18-006-044  [P2] GAP  facet F13  effort M
- Legacy: Old missing classId retries class-scope lookup before unassigned warning (`CalendarEvents.js:199-220`).
- vNext now: New returns `You are not assigned to a class yet` when no active enrollment/delivery (`learner-schedule-service.ts:154-155`; `learner-class-schedule.tsx:406-415`).
- Fix: Differentiate failed lookup from truly unassigned.

## G2-18-006-050  [P2] GAP  facet F16  effort L
- Legacy: Old mobile ≤767px switches month and displays MiniCalendar + agenda list (`CalendarMobileList.js:8-31,164-269`).
- vNext now: New ≤767 sets month but renders fixed 42-day grid + selected agenda (`learner-class-schedule.tsx:329-337,619-668`).
- Fix: Clone mini-calendar and mobile agenda arrangement.

## G2-18-006-052  [P2] GAP  facet F16  effort S
- Legacy: Old hour gutters 90px desktop, 70px at ≤768, 55px at ≤480 (`StandardCalendar.js:191-222`).
- vNext now: New hour grid fixed 5rem first column (`learner-class-schedule.tsx:185-213`).
- Fix: Apply exact gutter width per breakpoint.

## G2-18-006-054  [P2] MISSING  facet F17  effort M
- Legacy: Old popover button aria-expanded, dialog role and Escape focus restore (`MetricPill.jsx:53-87`).
- vNext now: New title-only StatTile (`learner-class-schedule.tsx:293-303`).
- Fix: Restore keyboard-accessible popovers and focus.

## G2-18-006-055  [P2] GAP  facet F17  effort S
- Legacy: Old mobile days include aria-current=date, aria-pressed, aria-disabled (`MiniCalendar.js:99-112`).
- vNext now: New month buttons include aria-pressed/count but no aria-current (`learner-class-schedule.tsx:633-648`).
- Fix: Add today current semantics and outside-month disabled policy.

## G2-5-011-003  [P2] GAP  facet F01  effort M
- Legacy: Legacy week/month day drill-down changes active view to day (`docs/legacy-source/frontend/src/components/CalendarComp/CalendarEvents/CalendarEvents.js:179-185`)
- vNext now: vNext month pane selects day agenda; detailed week/day schedule has separate internal view (`src/components/academics/learner-class-schedule.tsx:619-667`)
- Fix: Make month day drill-down expose equivalent calendar day navigation and back path.

## G2-5-011-006  [P2] GAP  facet F02  effort M
- Legacy: Next 3 upcoming list appears above calendar toolbar (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:408-432`)
- vNext now: Next classes is a collapsible Disclosure inside second schedule after full month grid (`src/components/academics/learner-class-schedule.tsx:444-462`)
- Fix: Place the next-three strip at legacy hierarchy and avoid duplicate page-level calendars.

## G2-5-011-008  [P2] GAP  facet F03  effort M
- Legacy: Header first teal MetricPill has CalendarOutlined icon, text `{count} today` (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:365-372`)
- vNext now: Second schedule displays generic Today stat tile below month view (`src/components/academics/learner-class-schedule.tsx:419-425`)
- Fix: Restore header metric positioning/icon and metric pill interactions.

## G2-5-011-009  [P2] GAP  facet F03  effort M
- Legacy: Header second green MetricPill uses ScheduleOutlined and `Next: {time}` (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:373-380`)
- vNext now: Second schedule stat displays full weekday/time/course text (`src/components/academics/learner-class-schedule.tsx:426-441`)
- Fix: Restore compact next-time pill and 18-character course-name popover treatment.

## G2-5-011-012  [P2] GAP  facet F03  effort M
- Legacy: Next classes rows are button elements with day, name, time and faculty (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:408-428`)
- vNext now: Next classes are EventCard links in collapsed Disclosure (`src/components/academics/learner-class-schedule.tsx:444-459`)
- Fix: Keep always-visible three-row button/stack and legacy click destination.

## G2-5-011-015  [P2] GAP  facet F04  effort M
- Legacy: Legacy upcoming `Next` shows Today h:mm A, Tomorrow h:mm A or ddd h:mm A (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:209-227`)
- vNext now: vNext next stat uses weekday+time+course and explicit IST (`src/components/academics/learner-class-schedule.tsx:426-440`)
- Fix: Match relative-day text and truncate course label at 18 characters.

## G2-5-011-016  [P2] GAP  facet F04  effort M
- Legacy: Today's classes popover lists course name and local `h:mm A` (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:230-247`)
- vNext now: Faculty's generic StatTile tooltip deliberately omitted (`courseBasePath` conditional) (`src/components/academics/learner-class-schedule.tsx:419-425`)
- Fix: Expose today's list as a keyboard-accessible popover under header metric.

## G2-5-011-017  [P2] GAP  facet F04  effort M
- Legacy: Next class popover lists Course, Time, Date and optionally Faculty/Room (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:249-262`)
- vNext now: Faculty StatTile tooltip omitted (`src/components/academics/learner-class-schedule.tsx:426-441`)
- Fix: Restore the full next-class popover with exact field labels.

## G2-5-011-033  [P2] MISSING  facet F09  effort M
- Legacy: Today metric popover `Today's Classes` with list of classes and times (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:230-247`)
- vNext now: Faculty StatTile has no tooltip/popover (`src/components/academics/learner-class-schedule.tsx:420-425`)
- Fix: Render interactive metric popover with screen-reader label and list.

## G2-5-011-034  [P2] MISSING  facet F09  effort M
- Legacy: Next metric popover title is truncated name and body has Course/Time/Date/Faculty/Room (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:249-262`)
- vNext now: Faculty StatTile has no tooltip/popover (`src/components/academics/learner-class-schedule.tsx:426-441`)
- Fix: Restore details popover keyed from next event.

## G2-5-011-045  [P2] GAP  facet F12  effort M
- Legacy: Legacy course color determined by course ID/name (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:48-55`)
- vNext now: vNext color uses deliveryId/courseId/sectionId hash when rendering some views (`src/components/academics/learner-class-schedule.tsx:147-154`)
- Fix: Match palette and color-key used in legacy rather than alternate hash.

## G2-5-011-049  [P2] GAP  facet F13  effort M
- Legacy: Legacy mobile empty `No scheduled classes this week/day/month.` (`docs/legacy-source/frontend/src/components/CalendarComp/CalendarEvents/CalendarEvents.js:282-298`)
- vNext now: Detailed view says `No scheduled classes this week.` or `No scheduled classes in this view` (`src/components/academics/learner-class-schedule.tsx:610-615`)
- Fix: Align view-aware empty text and account for calendar vs selected filter empty.

## G2-5-011-054  [P2] GAP  facet F16  effort M
- Legacy: Legacy dedicated mobile list has per-view contextual empty message (`docs/legacy-source/frontend/src/components/CalendarComp/CalendarEvents/CalendarEvents.js:282-298`)
- vNext now: vNext detailed mobile agenda exists only in second lower section (`src/components/academics/learner-class-schedule.tsx:769-807`)
- Fix: Bring responsive compact list to primary calendar region.

## G2-5-011-059  [P2] GAP  facet F18  effort M
- Legacy: Legacy next-strip text `Next classes` and `Next 3 upcoming` (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:409-413`)
- vNext now: vNext disclosure displays `Next {upcoming.length}` (`src/components/academics/learner-class-schedule.tsx:444-447`)
- Fix: Use legacy exact static next-three subheading.

## G2-18-006-009  [P3] GAP  facet F03  effort S
- Legacy: Old next list header `Next classes` / `Next 3 upcoming` (`ClassScheduleContent.jsx:408-414`).
- vNext now: New header `Next classes` / `Next {upcoming.length}` (`learner-class-schedule.tsx:444-448`).
- Fix: Use exact `Next 3 upcoming` copy.

## G2-18-006-016  [P3] GAP  facet F04  effort S
- Legacy: Old next rows use `ddd, MMM D` and `h:mm A` (`ClassScheduleContent.jsx:421-425`).
- vNext now: New cards show start–end Intl `en-IN` (`learner-class-schedule.tsx:110-125,246-262`).
- Fix: Match legacy date/time output per surface.

## G2-18-006-025  [P3] GAP  facet F06  effort S
- Legacy: Old view Select has aria-label `Calendar view` without visible label (`ClassScheduleContent.jsx:311-321`).
- vNext now: New displays extra visible `View` label (`learner-class-schedule.tsx:498-518`).
- Fix: Preserve accessible name without added caption.

## G2-18-006-045  [P3] GAP  facet F13  effort S
- Legacy: Old mobile empty copy `No scheduled classes this {view}.` (`CalendarEvents.js:282-299`).
- vNext now: New weekly empty `No scheduled classes this week.`; day generic; month day empty (`learner-class-schedule.tsx:610-615,664-666`).
- Fix: Match exact view-specific empty messages.

## G2-18-006-051  [P3] GAP  facet F16  effort S
- Legacy: Old clicking mini-calendar date scrolls to day block (`CalendarMobileList.js:138-160`).
- vNext now: New swaps selected agenda without matching scroll (`learner-class-schedule.tsx:633-667`).
- Fix: Restore focus/scroll behavior.

## G2-18-006-057  [P3] GAP  facet F18  effort S
- Legacy: Old `Next 3 upcoming` (`ClassScheduleContent.jsx:409-413`).
- vNext now: New `Next {upcoming.length}` (`learner-class-schedule.tsx:444-448`).
- Fix: Use legacy literal wording.

## G2-18-006-064  [P3] GAP  facet F21  effort S
- Legacy: Old Axios REST + react-big-calendar and AntD integrations (`calenderServices.js:3-16`; `StandardCalendar.js:1-8`).
- vNext now: New Drizzle + in-app React calendar (`learner-schedule-service.ts:1-35`; `learner-class-schedule.tsx:1-44`).
- Fix: Document renderer/API replacement, check no external job dependency.
