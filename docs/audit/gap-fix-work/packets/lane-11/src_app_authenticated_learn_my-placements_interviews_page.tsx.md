# Work packet: edit src/app/(authenticated)/learn/my-placements/interviews/page.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/learner-placements-interviews.md

## G2-17-005-001  [P1] GAP  facet F01  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/my-placements/interviews.js:4-7 intentionally redirects obsolete Interviews address to /learn/my-placements/schedule, no independent interviews view.
- vNext now: src/app/(authenticated)/learn/my-placements/interviews/page.tsx:11-60 renders independent 'Interviews' page instead of redirect.
- Fix: Redirect old /interviews bookmarks to /schedule, or explicitly approve resurrection as new entrypoint; preserve old route context.

## G2-17-005-010  [P1] GAP  facet F04  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:18-31 maps legacy interview table records and calendar extras into schedule list.
- vNext now: src/app/(authenticated)/learn/my-placements/interviews/page.tsx:21-22 reads own persisted placement rounds, not legacy interview rows/calendars.
- Fix: Ensure consolidated Schedule includes older scheduled interview records, tests, deadlines, blocked days as legacy does.

## G2-17-005-021  [P1] GAP  facet F10  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:73-99 fetches legacy interviews, job deadlines and monthly blocked calendar extras after redirect.
- vNext now: src/app/(authenticated)/learn/my-placements/interviews/page.tsx:21-22 loads getLearnerPlacementRequestWorkspace and getOwnInterviewWithdrawalTargets, no legacy interview/calendar fetch in this page.
- Fix: Route to schedule read closure so old interview and blocked-day integrations remain represented.

## G2-17-005-038  [P1] GAP  facet F19  effort M
- Legacy: docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:11-14 no network request apart from Next route transition.
- vNext now: src/app/(authenticated)/learn/my-placements/interviews/page.tsx:21-22 duplicates placement workspace read inside getOwnInterviewWithdrawalTargets src/modules/placements/learner-interview-withdrawal-service.ts:14.
- Fix: Avoid double getLearnerPlacementRequestWorkspace query on one route render; pass shared snapshot.

## G2-17-005-041  [P1] GAP  facet F21  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:11,73-99 integrates interviewService legacy records, jobs/all deadlines and TpoHubService calendar extras.
- vNext now: src/app/(authenticated)/learn/my-placements/interviews/page.tsx:21-22 uses vNext placement request/withdrawal services; legacy sources absent from this page.
- Fix: Canonicalize old URL to combined Schedule including all placements sources; document no-data migration policy.

## G2-17-005-044  [P1] GAP  facet F23  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/my-placements/interviews.js:4-7 guaranteed redirect to Schedule on every visit, never 'Interviews' standalone.
- vNext now: src/app/(authenticated)/learn/my-placements/interviews/page.tsx:33-60 dedicated Interviews workspace and no move.
- Fix: Restore URL alias behavior or sign off intentional divergence.

## G2-17-005-015  [P2] GAP  facet F07  effort 
- Legacy: docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:11-13 redirects on router.isReady, does not validate query.
- vNext now: src/app/(authenticated)/learn/my-placements/interviews/page.tsx:24-31 returns 404 for malformed view, search or deep-link query.
- Fix: Don't break old bookmarks with now-unsupported query, normalize and preserve compatible params.
