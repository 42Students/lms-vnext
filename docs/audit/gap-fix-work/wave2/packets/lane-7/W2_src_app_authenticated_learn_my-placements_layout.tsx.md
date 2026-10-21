# Work packet (wave 2): edit src/app/(authenticated)/learn/my-placements/layout.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/placement-applications.md, docs/audit/gap2/lane-12/placement-cell.md, docs/audit/gap2/lane-19/learner-calendar-redirect.md

## G2-12-006-001  [P2] GAP  facet F01  effort S
- Legacy: Applications shared placement tab route and unauthenticated redirect home `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:31-46`
- vNext now: Same tab path but unauthorized learner/module gets private notFound `src/app/(authenticated)/learn/my-placements/layout.tsx:21-27`
- Fix: Decide intended redirect and module access response

## G2-12-006-035  [P2] GAP  facet F11  effort S
- Legacy: Redux learner ID gate, own data via backend authenticated endpoint `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:33-46`
- vNext now: Learner+module permission, unauthorized hidden via notFound `src/app/(authenticated)/learn/my-placements/layout.tsx:21-27`
- Fix: Keep privacy, align logged-out routing

## G2-12-005-002  [P2] GAP  facet F01  effort S
- Legacy: Legacy missing Redux loginUser.id redirects to `/` before component renders `docs/legacy-source/frontend/src/pages/learn/my-placements/placement.js:9-13`
- vNext now: VNext requires learner+module access and returns notFound on denied access `src/app/(authenticated)/learn/my-placements/layout.tsx:21-27`
- Fix: Agree redirect vs private 404 user-experience with authorization policy

## G2-12-005-046  [P2] GAP  facet F11  effort S
- Legacy: Legacy checks loginUser id in Redux, then body; backend checks learner/job scope `docs/legacy-source/frontend/src/pages/learn/my-placements/placement.js:9-14`
- vNext now: VNext placement module and active learner access guard, unauthorized 404 `src/app/(authenticated)/learn/my-placements/layout.tsx:21-27`
- Fix: Keep equivalent confidentiality while documenting stricter module gate

## G2-12-005-063  [P2] GAP  facet F16  effort S
- Legacy: PageShell shared title My Placements and tab rail `docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:93-101`
- vNext now: VNext tabs in nested layout but no PageShell explicit title on placement page `src/app/(authenticated)/learn/my-placements/layout.tsx:28-35`
- Fix: Match shell heading and spacing

## G2-12-005-075  [P2] GAP  facet F19  effort S
- Legacy: Unread announcements GET fetch in shell and refresh on browser custom event `docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:71-80`
- vNext now: Unread personal alerts server read on each layout request `src/app/(authenticated)/learn/my-placements/layout.tsx:28-33`
- Fix: Prevent badge stale after reading announcements and distinguish personal

## G2-19-005-002  [P2] GAP  facet F01  effort S
- Legacy: Uses `PlacementsTabsLayout` around redirect skeleton `docs/legacy-source/frontend/src/pages/learn/my-placements/calendar.js:9`
- vNext now: vNext `LearnerPlacementsLayout` includes tabs and standalone Career Calendar header `src/app/(authenticated)/learn/my-placements/layout.tsx:28-35` `src/app/(authenticated)/learn/my-placements/calendar/page.tsx:21`
- Fix: Match tab selection and route transition to Schedule.

## G2-19-005-032  [P2] GAP  facet F11  effort S
- Legacy: Old redirected destination checks learnerId and redirects to `/` otherwise `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:58-70`
- vNext now: vNext parent requires learner participation and returns 404 on denial `src/app/(authenticated)/learn/my-placements/layout.tsx:21-27`
- Fix: Document expected denied navigation and maintain non-disclosure policy.
