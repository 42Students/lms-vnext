# Work packet (wave 2): edit src/app/(authenticated)/college/page.tsx

30 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-dashboard.md, docs/audit/gap2/lane-9/college-admin-index.md

## G2-9-005-001  [P2] GAP  facet F01  effort M
- Legacy: College Admin dashboard under /college-admin/dashboard with AdminLayout (`docs/legacy-source/frontend/src/pages/college-admin/dashboard.js:1-9`)
- vNext now: College landing /college is dashboard (`src/app/(authenticated)/college/page.tsx:1-25`)
- Fix: Ensure legacy Dashboard sidebar item and deep link redirect to new landing.

## G2-9-005-005  [P2] GAP  facet F02  effort M
- Legacy: Hello strip, At a glance, Today attention, Quick Actions, collapsed Setup Guide (`docs/legacy-source/frontend/src/components/admin/dashboard/AdminDashboardView.js:47-76`)
- vNext now: PageHeader, Other college actions, college metadata, stats, closing quiz then Today/risk etc (`src/app/(authenticated)/college/page.tsx:72-295`)
- Fix: Restore section order and visual group hierarchy.

## G2-9-005-006  [P2] GAP  facet F02  effort M
- Legacy: College name and day displayed in standalone hello banner (`docs/legacy-source/frontend/src/components/admin/dashboard/AdminDashboardView.js:47-55`)
- vNext now: College name and date inside PageHeader description (`src/app/(authenticated)/college/page.tsx:72-80`)
- Fix: Recreate hello banner typography and spacing.

## G2-9-005-008  [P2] GAP  facet F02  effort M
- Legacy: Today summary then attention cards in 3-col xl layout (`docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:139-160`)
- vNext now: Separate Today, attendance risks, grading, staffing, setup, quiz sections (`src/app/(authenticated)/college/page.tsx:137-295`)
- Fix: Arrange as legacy six-card attention board and summary stripe.

## G2-9-005-011  [P2] GAP  facet F03  effort M
- Legacy: AttentionCard colored warn/danger/info plus icon and count in header (`docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:24-57`)
- vNext now: Independent card/section rows with no consistent attention tone (`src/app/(authenticated)/college/page.tsx:150-295`)
- Fix: Use danger/info/clear tone and count header.

## G2-9-005-014  [P2] GAP  facet F04  effort M
- Legacy: Display full weekday, day, month, year (`docs/legacy-source/frontend/src/components/admin/dashboard/AdminDashboardView.js:48-54`)
- vNext now: Uses formatCollegeHeaderDate for header inline (`src/app/(authenticated)/college/page.tsx:75-78`)
- Fix: Match e.g., Wednesday, 21 October 2026.

## G2-9-005-016  [P2] GAP  facet F04  effort M
- Legacy: Three Today values classes scheduled, held so far, attendance taken (`docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:141-159`)
- vNext now: Today values on separate cards (`src/app/(authenticated)/college/page.tsx:143-159`)
- Fix: Use original inline strong-number stripe.

## G2-9-005-017  [P2] GAP  facet F04  effort M
- Legacy: Six attention categories with text rows and and N more (`docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:162-245`)
- vNext now: Separate complex sections and row tables (`src/app/(authenticated)/college/page.tsx:155-295`)
- Fix: Keep count, truncated items with 'and N more'.

## G2-9-005-019  [P2] GAP  facet F05  effort M
- Legacy: Attention row lists first few records and extra count (`docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:36-65`)
- vNext now: Different tables and item limits (`src/app/(authenticated)/college/page.tsx:155-295`)
- Fix: Restore count-vs-list cutoff and legacy item ordering.

## G2-9-005-020  [P2] GAP  facet F05  effort M
- Legacy: Needs attention tiles compact, with footer links (`docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:27-58`)
- vNext now: Cards/sections with expanded rows (`src/app/(authenticated)/college/page.tsx:160-295`)
- Fix: Match legacy compact tile content and footer.

## G2-9-005-045  [P2] GAP  facet F12  effort M
- Legacy: Setup gaps sums 4 categories, distinguishes zero vs failed (`docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:215-242`)
- vNext now: Separate setup gaps service fallback (`src/app/(authenticated)/college/page.tsx:199-285`)
- Fix: Preserve four-part gap total and all-clear condition.

## G2-9-005-047  [P2] GAP  facet F13  effort M
- Legacy: Attention cards individual Skeleton paragraph3 while loading (`docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:39-59`)
- vNext now: Renders only after async service results (`src/app/(authenticated)/college/page.tsx:155-295`)
- Fix: Add per-tile skeletons.

## G2-9-005-048  [P2] GAP  facet F13  effort M
- Legacy: Zero-state tailored per card with check icon (`docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:42-57`)
- vNext now: Different section-specific empty messages (`src/app/(authenticated)/college/page.tsx:156-290`)
- Fix: Port exact card empty copy and green check.

## G2-9-005-053  [P2] GAP  facet F16  effort M
- Legacy: Attention cards 1 mobile,2 lg,3 xl (`docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:157-164`)
- vNext now: Separate sections/tables (`src/app/(authenticated)/college/page.tsx:155-295`)
- Fix: Restore 1/2/3 grid breakpoints.

## G2-9-005-058  [P2] GAP  facet F18  effort M
- Legacy: Missing college exact warning copy (`docs/legacy-source/frontend/src/pages/college-admin/dashboard.js:54-63`)
- vNext now: Alternate empty description (`src/app/(authenticated)/college/page.tsx:25-35`)
- Fix: Restore 'Some features are limited...' word-for-word.

## G2-9-005-060  [P2] GAP  facet F18  effort M
- Legacy: Attendance not taken, Under 75% attendance, Waiting to be graded etc (`docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:180-208`)
- vNext now: Similar but renamed/expanded sections (`src/app/(authenticated)/college/page.tsx:155-290`)
- Fix: Restore exact six card titles.

## G2-9-005-062  [P2] GAP  facet F19  effort M
- Legacy: Attention list only first server-provided rows, 'and N more' marker (`docs/legacy-source/frontend/src/components/admin/dashboard/AttentionBoard.js:62-68`)
- vNext now: VNext renders service lists with different limits (`src/app/(authenticated)/college/page.tsx:155-295`)
- Fix: Preserve visible item count and explicit remaining text.

## G2-9-009-003  [P2] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/index.js:8-10` — No displayed section or page header; empty React fragment
- vNext now: `src/app/(authenticated)/college/page.tsx:67-97` — Renders PageHeader, Edit college and Other college actions
- Fix: Move overview UI to canonical destination and make alias redirect-only

## G2-9-009-004  [P2] GAP  facet F02  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/index.js:1-5` — Immediate redirect before component render
- vNext now: `src/app/(authenticated)/college/page.tsx:98-132` — Executes data-backed code/city/state/country and cards UI on root
- Fix: Keep redirect route without preloading overview sections

## G2-9-009-008  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/index.js:1-5` — Response Location is the only output field
- vNext now: `src/app/(authenticated)/college/page.tsx:69-73` — Title, college name and date displayed from data
- Fix: Preserve HTTP Location contract; do not replace with content

## G2-9-009-015  [P2] GAP  facet F10  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/index.js:1-5` — No request to business API and no DB write
- vNext now: `src/app/(authenticated)/college/page.tsx:32-45` — Reads college records by membership to render root
- Fix: Remove unnecessary DB load from alias and preserve destination load

## G2-9-009-016  [P2] GAP  facet F11  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/index.js:1-5` — No permission check before redirect; permissions are delegated to dashboard destination
- vNext now: `src/app/(authenticated)/college/page.tsx:24-45` — Root resolves active membership and tenant college before display
- Fix: Apply authorization on target dashboard without leaking tenant details during redirect

## G2-9-009-017  [P2] GAP  facet F12  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/index.js:1-5` — Redirect is unconditional, including no query/body logic
- vNext now: `src/app/(authenticated)/college/page.tsx:23-45` — Tenant-specific dashboard controls render depending on membership data
- Fix: Maintain unconditional alias behavior; inspect query forwarding separately

## G2-9-009-018  [P2] GAP  facet F13  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/index.js:1-5` — No loading, offline, missing-college or error UI before redirect
- vNext now: `src/app/(authenticated)/college/page.tsx:27-45` — Shows Admin not assigned to a college and context-specific descriptions
- Fix: Let destination render empty/error states after redirect

## G2-9-009-023  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/index.js:2-4` — Only literal page-facing target path is /college-admin/dashboard
- vNext now: `src/app/(authenticated)/college/page.tsx:69-75` — Title and Other college actions appear instead of direct path transition
- Fix: Preserve route-only entry copy; align destination title with legacy dashboard

## G2-9-009-024  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/index.js:1-5` — Constant-time redirect without data fetch/list/caching
- vNext now: `src/app/(authenticated)/college/page.tsx:49-58` — Promise.allSettled runs seven dashboard service requests for root entry
- Fix: Keep alias lightweight, read data on target page

## G2-9-009-026  [P2] GAP  facet F21  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/index.js:1-5` — No integrations, webhooks, queues, jobs or external calls
- vNext now: `src/app/(authenticated)/college/page.tsx:9-15` — Dashboard is coupled to seven academic/report service modules
- Fix: Decouple alias from report and academic service reads

## G2-9-009-021  [P3] GAP  facet F16  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/index.js:8-10` — Redirect produces no DOM at 1280/768/375
- vNext now: `src/app/(authenticated)/college/page.tsx:67-98` — Root page uses responsive spacing and action nav
- Fix: Make alias visual-independent; assess dashboard responsive styling under U005

## G2-9-009-022  [P3] GAP  facet F17  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/index.js:8-10` — Empty fragment has no keyboard/focus targets
- vNext now: `src/app/(authenticated)/college/page.tsx:69-97` — Edit/dialog and tool links add keyboard targets to root
- Fix: On redirect preserve browser focus and place accessible heading on destination

## G2-9-009-027  [P3] GAP  facet F22  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/index.js:1-5` — No entity, schema, migration or table used by alias
- vNext now: `src/app/(authenticated)/college/page.tsx:32-45` — Root reads listColleges and membership-backed tenant model
- Fix: Avoid DB dependency in alias; document DB parity under dashboard unit
