# Work packet (wave 2): edit src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-interviews.md

## G2-9-012-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/interviews.js:34-48` — Drive-scoped Schedule lives inside JobsErrorBoundary, placements ModuleGroupGuard and DriveSubNav active interviews
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx:40-43` — Direct Interviews · job title page and Drive overview back link, no four-tab level-2 nav
- Fix: Restore Overview/Applications/Schedule/Settings tabs with Schedule active

## G2-9-012-002  [P2] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/placements/DriveSubNav.jsx:6-11` — Level-two label Schedule, not Interviews, to avoid global interviews ambiguity
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx:41-43` — Page title Interviews · drive title, no Schedule tab
- Fix: Use Schedule as drive-scoped section label; preserve Interviews in context subtitle

## G2-9-012-012  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:48-68` — Type-colored Screening/Technical/HR/Managerial/Final chips and deterministic company colors
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx:30-38` — Rounds show kind/sequence text, StatusBadge, no interview type color/brand tag
- Fix: Restore type tags and deterministic company indicator

## G2-9-012-016  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:71-87` — Legacy statuses Active/Completed/Cancelled and mode Online/In-person
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx:45-53` — Round statuses PENDING/SCHEDULED/COMPLETED/CANCELLED, mode separately from appointment
- Fix: Separate appointment and round statuses, preserve readable status/mode labels

## G2-9-012-021  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:200-219` — On org/college change resets filters, page, focus re-fetches
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx:20-29` — Server query scope by membership on navigation, no local filter reset
- Fix: Drop incompatible selected filters on college switch; provide refresh control

## G2-9-012-033  [P2] MISSING  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:412-418` — Desktop column-header input Search... plus sort selects pop over
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx:44-58` — Search absent, native selectors in form
- Fix: Add legacy search popover/filter controls

## G2-9-012-034  [P2] GAP  facet F09  effort M
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:925-1005` — Phone filter panel uses searchable type/status/mode/department/company selectors
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx:44-58` — Single responsive server form only kind/status
- Fix: Rebuild mobile filter sheet and breakpoint layout

## G2-9-012-046  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:791-815` — Initial spinner vs no-interviews vs filtered-no-results copy
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx:62-65` — Round empty state generic; candidate section uses separate No candidate interviews
- Fix: Distinguish empty candidates from empty round registry with exact old wording

## G2-9-012-053  [P2] GAP  facet F16  effort S
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:937-1004` — Mobile select dropdown width 160/200 and maxWidth90vw
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx:44-58` — Native select fills grid on mobile; no popup geometry
- Fix: Check select sheet widths and constrained phone popovers

## G2-9-012-055  [P2] MISSING  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:864-870` — Sort interviews aria-label, select supports keyboard options
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx:44-58` — Sort select absent, so no keyboard sort affordance
- Fix: Restore keyboard-labeled sort control

## G2-9-012-056  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:755-760` — Title Interviews, subtitle Review the interview schedule, conflicts and candidate context without leaving the placements workspace.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx:41-43` — Title Interviews · drive, subtitle Schedule candidate interviews, track completed and no-show outcomes, and review interview rounds.
- Fix: Restore exact title and descriptive copy, place This drive only scope text

## G2-9-012-057  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:873-895` — Toolbar label Export CSV and count N interviews
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx:62-65` — Only N matching interview/GD rounds, no CSV
- Fix: Restore exact schedule toolbar count and export label

## G2-9-012-058  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:71-87` — Status choices All statuses/Active/Completed/Cancelled, Mode Online/In-person
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx:45-53` — Kind Interview and GD; raw PENDING/SCHEDULED/COMPLETED/CANCELLED
- Fix: Use old labels for candidate list; keep round kind filter separate

## G2-9-012-061  [P2] GAP  facet F20  effort S
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:201-221` — Org scope change resets filters; browser focus triggers refetch
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx:20-29` — Server request on navigation; no focus re-fetch
- Fix: Refresh stale schedule after tab regain and preserve only valid scoped filters
