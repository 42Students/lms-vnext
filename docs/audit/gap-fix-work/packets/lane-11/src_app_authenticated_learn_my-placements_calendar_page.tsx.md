# Work packet: edit src/app/(authenticated)/learn/my-placements/calendar/page.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/learner-calendar-redirect.md

## G2-19-005-001  [P1] GAP  facet F01  effort M
- Legacy: Calendar path is redirect-only to `/learn/my-placements/schedule?view=month` `docs/legacy-source/frontend/src/pages/learn/my-placements/calendar.js:4-7`
- vNext now: Same path renders separate `Career Calendar` page and round calendar `src/app/(authenticated)/learn/my-placements/calendar/page.tsx:10-24`
- Fix: Redirect old calendar entry to Schedule month view or provide explicit owner-approved separate new route.

## G2-19-005-003  [P1] GAP  facet F01  effort M
- Legacy: Moved address retained for old notices/emails/bookmarks rather than 404 `docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:5-8`
- vNext now: vNext keeps path but loads different destination `src/app/(authenticated)/learn/my-placements/calendar/page.tsx:10-24`
- Fix: Maintain destination semantics for copied deep links, not just route existence.

## G2-19-005-029  [P1] GAP  facet F10  effort M
- Legacy: Old path redirects client using `router.replace('/schedule?view=month')` `docs/legacy-source/frontend/src/pages/learn/my-placements/calendar.js:4-6` `docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:10-14`
- vNext now: vNext route performs server `getLearnerPlacementRequestWorkspace` read and renders calendar `src/app/(authenticated)/learn/my-placements/calendar/page.tsx:10-24`
- Fix: Preserve redirect before data retrieval to prevent duplicate calendar reads.

## G2-19-005-030  [P1] GAP  facet F10  effort L
- Legacy: Old destination reads journey + old interviews, jobs and blocked extras `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:70-101`
- vNext now: vNext calendar reads one placement workspace round set `src/app/(authenticated)/learn/my-placements/calendar/page.tsx:11-35`
- Fix: Add legacy event-source adapters and bounded lookups for month.

## G2-19-005-031  [P1] MISSING  facet F10  effort M
- Legacy: Old Schedule month blocked-day GET uses visible start/end `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:91-101`
- vNext now: vNext no blocked-date API call in calendar route `src/app/(authenticated)/learn/my-placements/calendar/page.tsx:10-35`
- Fix: Wire selected-month college BLOCKED events API with cache/auth.

## G2-19-005-034  [P1] GAP  facet F11  effort M
- Legacy: Old deep links survive as redirect paths (including old notices) `docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:5-8`
- vNext now: vNext old path directly renders a different destination `src/app/(authenticated)/learn/my-placements/calendar/page.tsx:10-24`
- Fix: Ensure deep links never bypass appropriate Schedule state and learner role checks.

## G2-19-005-044  [P1] GAP  facet F15  effort M
- Legacy: Old URL retained as email/notification link target intentionally `docs/legacy-source/frontend/src/components/Placements/student/MovedPage.jsx:5-8`
- vNext now: vNext keeps route but no redirect, so old notification lands on new agenda view `src/app/(authenticated)/learn/my-placements/calendar/page.tsx:10-24` `src/modules/placements/learner-career-calendar-url-model.ts:9-15`
- Fix: Preserve incoming notification/bookmark destination and expected month display.

## G2-19-005-063  [P1] GAP  facet F21  effort L
- Legacy: Old destination integrates TPO calendar blocked dates and job deadlines `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:81-101`
- vNext now: vNext calendar source is workspace.rounds only `src/app/(authenticated)/learn/my-placements/calendar/page.tsx:11-36`
- Fix: Integrate authorized blocked-date and deadline providers.
