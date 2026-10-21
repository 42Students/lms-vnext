# Work packet (wave 2): edit src/app/(authenticated)/mentor/page.tsx

22 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/mentor-course-redirect.md, docs/audit/gap2/lane-7/u025-mentor-landing.md, docs/audit/gap2/lane-8/mentor-courses-redirect.md

## G2-12-004-016  [P2] GAP  facet F12  effort S
- Legacy: No feature/module check before redirect, always same destination `docs/legacy-source/frontend/src/pages/mentor/courses/[courseId]/index.js:1-7`
- vNext now: Index redirects to mentor home; home branches on projects enabled and access errors `src/app/(authenticated)/mentor/page.tsx:14-38`
- Fix: Retain direct target, let projects page handle disabled access

## G2-12-004-024  [P2] GAP  facet F18  effort S
- Legacy: Legacy destination is Projects page route `docs/legacy-source/frontend/src/pages/mentor/courses/[courseId]/index.js:4`
- vNext now: Index destination mentor home that may render `Projects is currently unavailable` `src/app/(authenticated)/mentor/page.tsx:20-25`
- Fix: Use exact legacy destination wording/route

## G2-7-025-004  [P2] GAP  facet F02  effort M
- Legacy: mentor/index.js:18-20 AntD Result info during loading and eligible redirect
- vNext now: mentor/page.tsx:14-23 async feature query and server redirect without visible Opening state
- Fix: Show equivalent pending feedback in route loading boundary

## G2-7-025-005  [P2] GAP  facet F02  effort M
- Legacy: mentor/index.js:22-30 warning Result with title, subtitle, primary Retry
- vNext now: mentor/page.tsx:23-37 PageHeader then Alert and actions
- Fix: Match Result state layout and action hierarchy

## G2-7-025-006  [P2] GAP  facet F02  effort M
- Legacy: mentor/index.js:33-39 info Result centered with title/subtitle and View notifications
- vNext now: mentor/page.tsx:23-37 PageHeader, warning Alert and action row
- Fix: Use equivalent centered info state or match shared canvas measurement

## G2-7-025-007  [P2] GAP  facet F03  effort S
- Legacy: mentor/index.js:24-29 Retry access check primary AntD Button
- vNext now: mentor/page.tsx:35 Retry access check text Link underline
- Fix: Match primary button size and priority

## G2-7-025-013  [P2] GAP  facet F04  effort S
- Legacy: mentor/index.js:26-27 failed status distinct from disabled and exposes explanatory subtitle
- vNext now: mentor/page.tsx:24-25 failed text Projects could not be loaded, shorter text
- Fix: Show exact legacy failure heading and explanation

## G2-7-025-023  [P2] GAP  facet F10  effort L
- Legacy: useCollegeFeatureFlags.js:60 GET /api/v1/features/mine with JWT context
- vNext now: mentor/page.tsx:19 resolveOptionalModuleAccess server-side database policy
- Fix: Document policy equivalence and refresh semantics

## G2-7-025-032  [P2] GAP  facet F13  effort M
- Legacy: mentor/index.js:18-20 info Result while feature lookup loading
- vNext now: mentor/page.tsx:14-22 server work before render, no visible loading content in page
- Fix: Provide matching suspense/loading state

## G2-7-025-033  [P2] GAP  facet F13  effort S
- Legacy: mentor/index.js:22-30 warning with Reload retry after failed flags fetch
- vNext now: mentor/page.tsx:24-35 Error Alert and retry navigation
- Fix: Match retry behavior and copy

## G2-7-025-034  [P2] GAP  facet F13  effort S
- Legacy: mentor/index.js:33-39 disabled info status with accessible notification exit
- vNext now: mentor/page.tsx:24-34 disabled warning Alert and exit
- Fix: Render informational rather than warning tone when explicitly disabled

## G2-7-025-037  [P2] GAP  facet F16  effort M
- Legacy: mentor/index.js:18-40 AntD Result centered responsive layout, primary action within component
- vNext now: mentor/page.tsx:23-37 flex-col mobile full width and desktop row actions
- Fix: Match Result content geometry and action width at 375/768/1280

## G2-7-025-041  [P2] GAP  facet F18  effort S
- Legacy: mentor/index.js:19 Opening your mentor workspace
- vNext now: mentor/page.tsx:14-22 no equivalent literal copy
- Fix: Restore opening copy in loading state

## G2-7-025-042  [P2] GAP  facet F18  effort S
- Legacy: mentor/index.js:26 Could not verify Projects access
- vNext now: mentor/page.tsx:24 Projects could not be loaded
- Fix: Use exact failure heading

## G2-7-025-043  [P2] GAP  facet F18  effort S
- Legacy: mentor/index.js:27 The LMS could not check your college module settings. This does not mean Projects is disabled.
- vNext now: mentor/page.tsx:25 Check your connection and try again. This does not mean Projects is disabled.
- Fix: Restore complete exact failure explanation

## G2-7-025-046  [P2] GAP  facet F19  effort M
- Legacy: useCollegeFeatureFlags.js:11,46-76 cache TTL 60s and coalesced inflight fetch
- vNext now: mentor/page.tsx:9 force-dynamic, :19 resolver reads per navigation
- Fix: Compare DB read cost, caching freshness and revoke latency

## G2-7-025-047  [P2] GAP  facet F19  effort M
- Legacy: useCollegeFeatureFlags.js:114-120 refetch every 60s and on window focus
- vNext now: mentor/page.tsx:14-21 request-time access only, no focus refresh on landing
- Fix: Ensure module revocation reflected on next navigation and focus if retained on page

## G2-7-025-055  [P2] MISSING  facet F23  effort M
- Legacy: mentor/index.js:18-20 legacy visible Opening state on eligibility check
- vNext now: mentor/page.tsx:20-21 immediate redirect, no opening state
- Fix: Restore optional loading-state copy without delay

## G2-8-004-017  [P2] GAP  facet F13  effort S
- Legacy: Legacy mentor/index.js:22-28 says Could not verify Projects access, with Retry access check (docs/legacy-source/frontend/src/pages/mentor/index.js:9-28)
- vNext now: vNext mentor/page.tsx:24-35 says Projects could not be loaded, includes retry link (src/app/(authenticated)/mentor/page.tsx:19-22)
- Fix: Restore exact destination failure wording for full legacy copy fidelity

## G2-12-004-025  [P3] GAP  facet F19  effort S
- Legacy: Only SSR redirect, zero page data queries/API calls `docs/legacy-source/frontend/src/pages/mentor/courses/[courseId]/index.js:1-12`
- vNext now: Index redirect is zero-query; `/mentor` landing must query auth and module access `src/app/(authenticated)/mentor/page.tsx:15-21`
- Fix: Redirect straight to projects to avoid extra hop/query

## G2-7-025-009  [P3] GAP  facet F03  effort S
- Legacy: mentor/index.js:18-20 status info icon from AntD Result
- vNext now: mentor/page.tsx:20-21 redirects without visible icon
- Fix: Match opening state icon if loading state rendered

## G2-7-025-010  [P3] GAP  facet F03  effort M
- Legacy: mentor/index.js:22-39 AntD Result warning/info icons
- vNext now: mentor/page.tsx:24-29 PageHeader+Alert icon/tonality
- Fix: Compare icon family, size, spacing and aria label
