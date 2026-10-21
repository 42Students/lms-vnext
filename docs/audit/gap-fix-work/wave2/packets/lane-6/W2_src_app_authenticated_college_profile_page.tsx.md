# Work packet (wave 2): edit src/app/(authenticated)/college/profile/page.tsx

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/college-admin-profile.md

## G2-1-026-002  [P2] GAP  facet F01  effort S
- Legacy: docs/legacy-source/frontend/src/pages/college-admin/profile.js:30-39: redirect learner to /learn/profile and teacher to role profile.
- vNext now: src/app/(authenticated)/college/profile/page.tsx:20-22: nonadmin redirect /dashboard.
- Fix: Route stale admin URL to actor's actual personal profile.

## G2-1-026-004  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/college-admin/profile.js:137-156: nested learn-profile-page, module card, body and ListingPageHeader.
- vNext now: src/app/(authenticated)/college/profile/page.tsx:35-49: PageHeader, editor and related links no old nested wrappers.
- Fix: Match card/canvas spacing and old shell classes.

## G2-1-026-011  [P2] GAP  facet F03  effort S
- Legacy: docs/legacy-source/frontend/src/pages/college-admin/profile.js:142: RefreshStatus 'Refreshing profile…' with stale data still visible.
- vNext now: src/app/(authenticated)/college/profile/page.tsx:23-34: server load before page, no stale refreshing banner.
- Fix: Keep last-known-good view on refresh with status.

## G2-1-026-044  [P2] GAP  facet F11  effort S
- Legacy: docs/legacy-source/frontend/src/pages/college-admin/profile.js:30-39,91-104: redirects learner/faculty according to old role.
- vNext now: src/app/(authenticated)/college/profile/page.tsx:20-22: redirects every nonadmin dashboard.
- Fix: Preserve correct self-profile redirect and server scope.

## G2-1-026-066  [P2] GAP  facet F19  effort S
- Legacy: docs/legacy-source/frontend/src/pages/college-admin/profile.js:68-76: refetch profile whenever document becomes visible.
- vNext now: src/app/(authenticated)/college/profile/page.tsx:23-25: fetch on SSR navigation only, no visibilitychange refresh.
- Fix: Add visibility-triggered revalidation with stale safety.

## G2-1-026-072  [P2] GAP  facet F21  effort S
- Legacy: docs/legacy-source/frontend/src/pages/college-admin/profile.js:68-76: visibilitychange event drives periodic background refresh.
- vNext now: src/app/(authenticated)/college/profile/page.tsx:11-50: server page with no equivalent background listener.
- Fix: Implement safe on-visible refresh or clearly document reduced freshness.

## G2-1-026-049  [P3] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/college-admin/profile.js:91-118: skeleton while waiting / nonadmin redirect.
- vNext now: src/app/(authenticated)/college/profile/page.tsx:19-26: SSR data fetch, no equivalent skeleton.
- Fix: Use profile skeleton during navigation loading.

## G2-1-026-050  [P3] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/college-admin/profile.js:121-134: hard-error Retry button with reload icon.
- vNext now: src/app/(authenticated)/college/profile/page.tsx:27-32: Retry link without icon.
- Fix: Match ReloadOutlined, spacing and button style.

## G2-1-026-057  [P3] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/pages/college-admin/profile.js:127-130: 40px y padding for centered hard load error.
- vNext now: src/app/(authenticated)/college/profile/page.tsx:27-32: ErrorState with generic container spacing.
- Fix: Clone padding/Retry target metrics.

## G2-1-026-065  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/college-admin/profile.js:148-149: 'Couldn't refresh profile' / 'Showing the last profile we loaded.'
- vNext now: src/app/(authenticated)/college/profile/page.tsx:29: 'Couldn’t refresh profile. Your existing details have not been changed.'
- Fix: Match exact warning copy and apostrophe.
