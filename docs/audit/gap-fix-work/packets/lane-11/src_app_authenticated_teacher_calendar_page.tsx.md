# Work packet: edit src/app/(authenticated)/teacher/calendar/page.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u011-teacher-calendar.md

## G2-5-011-002  [P1] GAP  facet F01  effort M
- Legacy: Calendar event click uses courseSlug or numeric course ID, `/teacher/courses/{identifier}/home`, and `?ref=course` for numeric IDs (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:64-80`)
- vNext now: Course-linked day event goes to `/teacher/courses/{deliveryId}/home` (`src/app/(authenticated)/teacher/calendar/page.tsx:111-114`)
- Fix: Add resolver/deep-link compatibility for legacy numeric/slug links and verify landing course.

## G2-5-011-005  [P1] GAP  facet F02  effort M
- Legacy: One Class Schedule header and metrics, then next classes, then a single calendar grid (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:357-436`)
- vNext now: Header, filterable 42-day IST month grid, explanation and separate Detailed day/week schedule below (`src/app/(authenticated)/teacher/calendar/page.tsx:50-130`)
- Fix: Match one legacy calendar hierarchy; retain extra content only behind a deliberate mode.

## G2-5-011-038  [P1] GAP  facet F10  effort M
- Legacy: Clicking calendar event client-pushes course path with encoded slug/ref (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:64-80`)
- vNext now: Month cards only link if deliveryId present; section-wide rendered as text (`src/app/(authenticated)/teacher/calendar/page.tsx:111-114`)
- Fix: Preserve correct user navigation for course-level sessions and handle general sessions explicitly.

## G2-5-011-027  [P2] GAP  facet F07  effort M
- Legacy: Legacy query date errors emitted as `Invalid date 'startDate': {value}` or `startDate must be before or equal to endDate` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassScheduleController.java:107-118`)
- vNext now: vNext rejects invalid month/unknown params using `Invalid month or Section filter` heading (`src/app/(authenticated)/teacher/calendar/page.tsx:24-36`)
- Fix: Preserve clear per-input validation and same user-facing error granularity.

## G2-5-011-031  [P2] GAP  facet F08  effort M
- Legacy: Upcoming fetch warning `Couldn't load your next classes`, with refresh description (`docs/legacy-source/frontend/src/components/CalendarComp/ClassScheduleContent.jsx:398-406`)
- vNext now: No separate upcoming fetch or upcoming warning on vNext server calendar (`src/app/(authenticated)/teacher/calendar/page.tsx:37-46`)
- Fix: Represent independent upcoming-data failures without implying no upcoming classes.
