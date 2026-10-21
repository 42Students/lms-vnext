# Work packet: edit src/app/(authenticated)/college/placements/interviews/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u002-college-admin-calendar.md

## G2-5-002-004  [P1] GAP  facet F02 Layout/section order  effort L
- Legacy: One Interviews page with header, Refresh, four metrics, toolbar, desktop table/mobile cards. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:750-777; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:779-1049)
- vNext now: Graphical date calendar and separate appointment directory; layout and information split. (src/components/placements/placement-calendar-workspace.tsx:563-590; src/components/placements/placement-calendar-workspace.tsx:635-664; src/app/(authenticated)/college/placements/interviews/page.tsx:57-119)
- Fix: Unify legacy list elements on obvious Interviews route, preserve optional new calendar tab.

## G2-5-002-015  [P1] MISSING  facet F04 Data formatting  effort M
- Legacy: Interviewer name and mode/location in table and mobile. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:564-605; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:705-719)
- vNext now: No interviewer column or selected field in directory. (src/modules/placements/college-interview-directory-service.ts:42-61; src/app/(authenticated)/college/placements/interviews/page.tsx:43-55)
- Fix: Expose interviewer name/empty fallback in projection and UI.

## G2-5-002-016  [P1] GAP  facet F04 Data formatting  effort L
- Legacy: Conflict kinds candidate/interviewer/both over whole unfiltered org. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:224-230; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:545-556)
- vNext now: Only same-student conflict among already-filtered slots; generic warning. (src/modules/placements/college-interview-directory-service.ts:79-96; src/app/(authenticated)/college/placements/interviews/page.tsx:50)
- Fix: Check candidate and interviewer across all active bookings before filtering.
