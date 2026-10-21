# Work packet: edit src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-signin-methods.md, docs/audit/gap2/lane-5/u030-manage-college-drawer.md

## G2-4-031-076  [P1] GAP  facet F23  effort S
- Legacy: Sign-in tab protects parent Manage College drawer dirty state (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:78-89`)
- vNext now: Separate route and no parent callbacks (`src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx:22-35`)
- Fix: Provide leave guard and maintain tab identity.

## G2-5-030-013  [P1] GAP  facet F04  effort M
- Legacy: Legacy Sign-in editor tracks dirty and busy and stores loginMethods. `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:78-88,109-148`
- vNext now: vNext Sign-in Methods policy versioned and ready flag; global drawer dirty state absent. `src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx:21-32`
- Fix: Persist effective method and cross-tab dirty reporting.

## G2-5-030-018  [P1] GAP  facet F06  effort M
- Legacy: Legacy children expose onDirtyChange/onBusyChange for domains, sign-in, branding, admins. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:13-33`
- vNext now: vNext each page owns form state; no shared cross-section dirty registry. `src/app/(authenticated)/admin/colleges/[collegeId]/subdomain/page.tsx:14-39`, `src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx:12-34`, `src/app/(authenticated)/admin/colleges/[collegeId]/branding/page.tsx:35-61`, `src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx:14-44`
- Fix: Use shared setup controller or route blockers that track dirty/busy per section.

## G2-5-030-032  [P1] GAP  facet F10  effort M
- Legacy: Legacy Sign-in child mutation changes loginMethods and reports dirty/busy. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:137-143`, `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:78-88`
- vNext now: vNext sign-in form versioned policy, can be migration pending. `src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx:18-32`
- Fix: Reconcile effective login policy and prevent false applied status.

## G2-5-030-061  [P1] GAP  facet F21  effort M
- Legacy: Legacy Sign-in writes branding loginMethods for actual college login. `docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:109-148`
- vNext now: vNext sign-in policy may be migration pending and carries version. `src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx:18-32`
- Fix: Confirm selected method consumed by auth before claiming live.

## G2-4-031-026  [P2] GAP  facet F07  effort S
- Legacy: GET failure inline Alert Sign-in settings could not be loaded and Save disabled (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:101-106`)
- vNext now: Read throws except notFound, no inline load retry state (`src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx:18-20`)
- Fix: Show standalone error alert with Reload after backend failure.

## G2-4-031-030  [P2] GAP  facet F07  effort S
- Legacy: Loading spinner on Card while fetching (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:90-107`)
- vNext now: SSR awaits policy before rendering without Card spinner (`src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx:18-22`)
- Fix: Add route loading skeleton matching AntD Card.

## G2-4-031-033  [P2] GAP  facet F08  effort S
- Legacy: Load error fallback Couldn't load this college's sign-in settings. (`docs/legacy-source/frontend/src/pages/superadmin/sections/CollegeSignIn.js:103`)
- vNext now: Throws read error through boundary (`src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx:18-20`)
- Fix: Display exact load fallback text.

## G2-5-030-026  [P2] GAP  facet F08  effort M
- Legacy: Legacy busy close info message, no auto-discard. `docs/legacy-source/frontend/src/pages/superadmin/sections/ManageCollegeDrawer.js:58-61`
- vNext now: vNext sign-in page warns sessions unaffected but not about navigation while saving. `src/app/(authenticated)/admin/colleges/[collegeId]/signin/page.tsx:21-32`
- Fix: Show exact busy toast before hiding/route transition.
