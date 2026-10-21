# Work packet (wave 2): edit src/app/(authenticated)/mentor/not-found.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/mentor-course-redirect.md

## G2-12-004-003  [P2] GAP  facet F02  effort S
- Legacy: Legacy exports null page component, no wrapper and no layout content `docs/legacy-source/frontend/src/pages/mentor/courses/[courseId]/index.js:10-12`
- vNext now: Unmatched dynamic path renders themed Page not found instead of null redirect `src/app/(authenticated)/mentor/not-found.tsx:4-10`
- Fix: Make missing path redirect before any page UI renders

## G2-12-004-005  [P2] GAP  facet F03  effort S
- Legacy: No visual controls, links, icons, tooltips or cards `docs/legacy-source/frontend/src/pages/mentor/courses/[courseId]/index.js:10-12`
- vNext now: 404 contains Page not found heading, text and Go to home link `src/app/(authenticated)/mentor/not-found.tsx:6-10`
- Fix: Redirect on dynamic path rather than expose unrelated error controls

## G2-12-004-017  [P2] GAP  facet F13  effort S
- Legacy: No page-specific loading/empty/error or session-expired states `docs/legacy-source/frontend/src/pages/mentor/courses/[courseId]/index.js:1-12`
- vNext now: Unmatched path yields 404; index redirect no loading state `src/app/(authenticated)/mentor/not-found.tsx:5-10`
- Fix: Avoid false not-found for legacy deep link

## G2-12-004-018  [P2] GAP  facet F13  effort S
- Legacy: Invalid historical course ID still redirects to projects `docs/legacy-source/frontend/src/pages/mentor/courses/[courseId]/index.js:1-7`
- vNext now: Unmatched dynamic path not found `src/app/(authenticated)/mentor/not-found.tsx:7-9`
- Fix: Accept any dynamic segment

## G2-12-004-023  [P2] GAP  facet F18  effort S
- Legacy: No wording except path destination, no visible labels `docs/legacy-source/frontend/src/pages/mentor/courses/[courseId]/index.js:1-12`
- vNext now: Visible `Page not found`, explanatory error, `Go to home` `src/app/(authenticated)/mentor/not-found.tsx:7-9`
- Fix: Remove ungrounded 404 wording on known legacy link

## G2-12-004-026  [P2] GAP  facet F20  effort S
- Legacy: Any courseId string routed uniformly, including stale/deleted IDs `docs/legacy-source/frontend/src/pages/mentor/courses/[courseId]/index.js:1-7`
- vNext now: No dynamic route; 404 fallback `src/app/(authenticated)/mentor/not-found.tsx:5-10`
- Fix: Support URL-encoded old IDs and stale bookmarks

## G2-12-004-021  [P3] GAP  facet F16  effort S
- Legacy: Server redirect independent of viewport; no rendered CSS `docs/legacy-source/frontend/src/pages/mentor/courses/[courseId]/index.js:1-12`
- vNext now: Unmatched route renders responsive error layout with 44px mobile button `src/app/(authenticated)/mentor/not-found.tsx:6-10`
- Fix: Preserve zero-intermediate-page responsive behavior via redirect

## G2-12-004-022  [P3] GAP  facet F17  effort S
- Legacy: No keyboard/focus controls, browser navigates directly `docs/legacy-source/frontend/src/pages/mentor/courses/[courseId]/index.js:1-12`
- vNext now: 404 introduces `Go to home` focus target and heading `src/app/(authenticated)/mentor/not-found.tsx:7-9`
- Fix: Redirect for equivalent keyboard navigation outcome
