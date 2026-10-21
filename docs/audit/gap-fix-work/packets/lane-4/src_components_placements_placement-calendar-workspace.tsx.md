# Work packet: edit src/components/placements/placement-calendar-workspace.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u012-tpo-calendar.md, docs/audit/gap2/lane-5/u002-college-admin-calendar.md, docs/audit/gap2/lane-5/u007-superadmin-calendar.md

## G2-5-012-063  [P0] GAP  facet F11  effort L
- Legacy: Legacy page shows followup edit controls without separate deployment flag (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:151-171`)
- vNext now: vNext hides edits unless DB09_TPO_API_READY=DB09_VERIFIED (`src/components/placements/placement-calendar-workspace.tsx:559-605`)
- Fix: Unblock edits only when migration is truly live; warn and surface remediation on gate fail

## G2-5-002-002  [P1] GAP  facet F01 Purpose/entry/navigation  effort M
- Legacy: View applications uses job ID plus college context and specific interview application ID callback. (docs/legacy-source/frontend/src/pages/college-admin/calendar.js:22-28; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:624-632)
- vNext now: Link targets job applications/round without applicant ID anchoring. (src/app/(authenticated)/college/placements/interviews/page.tsx:51-55; src/components/placements/placement-calendar-workspace.tsx:228-244)
- Fix: Propagate applicationId to applicants route, scroll/focus matching student.

## G2-5-002-004  [P1] GAP  facet F02 Layout/section order  effort L
- Legacy: One Interviews page with header, Refresh, four metrics, toolbar, desktop table/mobile cards. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:750-777; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:779-1049)
- vNext now: Graphical date calendar and separate appointment directory; layout and information split. (src/components/placements/placement-calendar-workspace.tsx:563-590; src/components/placements/placement-calendar-workspace.tsx:635-664; src/app/(authenticated)/college/placements/interviews/page.tsx:57-119)
- Fix: Unify legacy list elements on obvious Interviews route, preserve optional new calendar tab.

## G2-5-002-028  [P1] GAP  facet F07 Validation/errors  effort L
- Legacy: Errors show closable warning, stale results retained with Data below may be outdated. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:148-180; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:779-789)
- vNext now: SSR fetch awaited; no same-scope stale data + close/retry mechanism. (src/app/(authenticated)/college/placements/interviews/page.tsx:31; src/components/placements/placement-calendar-workspace.tsx:592-594)
- Fix: Catch load failure, show inline Retry and stale data warning.

## G2-5-002-064  [P1] GAP  facet F20 Edge/concurrency  effort M
- Legacy: Global ?jobId displays removable Job chip and clear resets job. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:190-199; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:356-393)
- vNext now: No job-ID filter; calendar job query is free text. (src/app/(authenticated)/college/placements/interviews/page.tsx:19-28; src/components/placements/placement-calendar-workspace.tsx:173-181)
- Fix: Restore deep link and visible removable chip.

## G2-5-007-005  [P1] GAP  facet F02 Layout/section order  effort L
- Legacy: Legacy one Interviews header, summary, filter toolbar and appointment table (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:750-777; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:779-1049)
- vNext now: Calendar grid with summary/control/next event, no list/table as landing (src/components/placements/placement-calendar-workspace.tsx:563-664; src/components/placements/placement-calendar-workspace.tsx:666-903)
- Fix: Use global Interviews list as default, grid as optional new mode.

## G2-5-007-036  [P1] GAP  facet F10 Actions/side effects  effort M
- Legacy: View applicant passes application ID context to wrapper callback (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:624-632)
- vNext now: Wrapper discards applicationId, vNext links round instead (docs/legacy-source/frontend/src/pages/superadmin/calendar.js:12-18; src/components/placements/placement-calendar-workspace.tsx:227-245)
- Fix: Route to exact jobApplication candidate, not round.

## G2-5-012-003  [P1] GAP  facet F01  effort M
- Legacy: Open Round/Talk navigates /tpo/drives/{jobId}?tab=rounds (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:146-149`)
- vNext now: vNext links to /tpo/placements/jobs/{jobId}#round-{roundId} (`src/components/placements/placement-calendar-workspace.tsx:231-245`)
- Fix: Ensure deep link opens rounds tab and focuses exact round; preserve legacy URL redirect

## G2-5-012-007  [P1] GAP  facet F02  effort M
- Legacy: Needs doing chip opens a conditional focus card listing its events and Close action (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:270-285`)
- vNext now: vNext needs doing permanently shows three statistic links without focused panel (`src/components/placements/placement-calendar-workspace.tsx:616-634`)
- Fix: Build focused list with toggle-on/off and contextual Open/Move/Done actions

## G2-5-012-071  [P1] GAP  facet F13  effort M
- Legacy: Legacy failed soon/past summaries retain previous values and mark them unknown (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:84-103`)
- vNext now: vNext independently emits unavailable counts but lacks cross-request stale retention (`src/components/placements/placement-calendar-workspace.tsx:503-518`)
- Fix: Keep last-known summary rows and stale marker across refresh

## G2-5-012-047  [P2] GAP  facet F08  effort S
- Legacy: Legacy partial warning names failed soon or past source and Retry summary (`docs/legacy-source/frontend/src/pages/tpo/calendar.js:237-248`)
- vNext now: vNext warning generic partial summary message and Retry (`src/components/placements/placement-calendar-workspace.tsx:592-594`)
- Fix: Show today/next7 vs overdue failure and action Retry summary
