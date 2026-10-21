# Work packet: edit src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-interviews.md

## G2-10-013-010  [P1] MISSING  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:536-564 — Conflict WarningOutlined red tag accompanies time if collision identified.
- vNext now: src/components/placements/college-interview-appointments.tsx:104-117; src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:47-54 — No clash warning pill on appointment row.
- Fix: Project collision types and red badges for conflicting schedule.

## G2-10-013-014  [P1] GAP  facet F04  effort L
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:406-649 — Table rows are individual interviews: job/company, candidate, department, type, status, scheduled date, mode, actions.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:46-54 — Round list rows represent persisted interview/GD rounds, not candidates; candidate appointments appear separately.
- Fix: Make candidate interviews primary dataset; rounds should be secondary.

## G2-10-013-030  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:148-184 — GET failures show 'Unable to load interviews. Please try again.' and recover with Refresh.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:42-45; src/components/placements/college-interview-appointments.tsx:52-63 — Server Promise.all may throw and replace entire schedule route; no interview-list retry.
- Fix: Catch candidate/round read failures per panel with explicit Refresh.

## G2-10-013-053  [P1] MISSING  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:781-794 — Fetch error message presented alongside previous data and recovery.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:42-45 — Promise rejection bubbles page-wide, no stale data recovery.
- Fix: Keep last-known-good appointment rows and warning, Retry.

## G2-10-013-081  [P1] GAP  facet F23  effort L
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:406-649,781-1010 — Legacy UI filters and lists candidate interviews, not drive rounds.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:46-54,78-84 — Modern table prioritizes round schedule; candidate appointment list secondary.
- Fix: Treat this as structural parity issue and redesign primary list.

## G2-10-013-083  [P1] GAP  facet F23  effort M
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:148-184 — Legacy failed fetch doesn't convert error to misleading empty list.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:42-45 — No inline query error separation, whole page can throw.
- Fix: Add data/error/empty distinct states with Retry.

## G2-10-013-034  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:152-184 — On refetch errors, alert displays returned message or fallback 'Unable to load interviews. Please try again.'.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:35-41 — Only invalid filter ErrorState has explicit message; request exception route-boundary.
- Fix: Expose fetch failure and Retry in schedule.

## G2-10-013-035  [P2] MISSING  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:761-769 — Refresh button busy spinner while interviews update.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:55-93 — No explicit refresh control; form submission rerenders page.
- Fix: Add icon/button Refresh and busy indication.

## G2-10-013-036  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:906-918 — Filter reset immediately applies and refreshes list, no submit required.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx:60-74 — Filter requires click; clearing fields is manual.
- Fix: Provide Clear filters action restoring defaults.
