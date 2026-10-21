# Work packet (wave 2): edit src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx

26 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-job-controller.md, docs/audit/gap2/lane-9/college-admin-jobs-overview.md

## G2-2-016-056  [P2] GAP  facet F01  effort L
- Legacy: Legacy admin drives GET and mutation API under /api/v1/admin/jobs with integer job IDs `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:39-44,110-113`
- vNext now: College UI uses UUID /college/placements/jobs/[jobId] with nested overview and actions `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:26-35`
- Fix: Add route/ID compatibility mapping for bookmarked jobs without exposing another college

## G2-2-016-057  [P2] GAP  facet F01  effort M
- Legacy: GET /{jobId}/context resolves collegeId for deep links and checks scoped principal `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:82-104`
- vNext now: New page expects UUID and derives current membership scope; no numeric context resolver in mapped overview `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:15-25`
- Fix: Support authorized old numeric job deep-links via stable ID translation or redirect

## G2-2-016-060  [P2] GAP  facet F02  effort L
- Legacy: List view combines toolbar and status actions, Create/Edit JobForm modal, bulk and delete workflows `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:1-23,45-80`
- vNext now: New split Overview uses PageHeader, metrics and More actions links to separate settings and applications `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:26-55`
- Fix: Align header/actions/filter/list hierarchy to old structure and document approved page split

## G2-2-016-062  [P2] GAP  facet F02  effort L
- Legacy: Hiring metrics, funnel and company report are separate backend reads in one dashboard `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:860-943`
- vNext now: Overview queries drive funnel and attention while separate college analytics page owns other reports `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:21-24,42-54`
- Fix: Restore cohesive metrics/funnel/company report tabs and cross-links where legacy expects them

## G2-2-016-064  [P2] GAP  facet F03  effort M
- Legacy: Old job list has create/edit modal, delete confirmation, status switch and bulk actions `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:1-18,61-79`
- vNext now: New job Overview offers Applications, All drives, Edit, Duplicate; no delete shortcut here `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:27-35`
- Fix: Expose destructive action with deletion impact preview and exact confirmation in proper action menu

## G2-2-016-072  [P2] GAP  facet F04  effort M
- Legacy: Recorded outside drive and countsAsPlaced booleans are explicit legacy job values `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:55-67`
- vNext now: Overview displays status, type, mode, openings, not those two legacy flags `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:37-40`
- Fix: Add explicit recorded-outside/placement-credit metadata where persisted

## G2-2-016-102  [P2] GAP  facet F09  effort M
- Legacy: Legacy Create/Edit uses JobForm modal, delete via Popconfirm `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:61-79`
- vNext now: New navigates to separate settings and exposes More actions Disclosure `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:29-35`
- Fix: Restore modal trigger/confirmation familiarity or document redirect and back-link

## G2-2-016-143  [P2] GAP  facet F17  effort M
- Legacy: Delete Popconfirm has Cancel/confirm with focus semantics `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:1-3,61-79`
- vNext now: New More actions Disclosure navigates to settings but no inline delete confirmation `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:29-35`
- Fix: Add accessible deletion impact confirmation with safe primary focus

## G2-9-011-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:111-116` — Job Overview route wrapped in JobsErrorBoundary, placements ModuleGroupGuard and DriveSubNav Overview active
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:26-36` — Standalone PageHeader with Applications CTA/More actions dropdown and no DriveSubNav
- Fix: Restore 4-tab drive subnavigation and the breadcrumb to Drives

## G2-9-011-003  [P2] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:112-113` — Back on errors routes to /college-admin/jobs
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:29-33` — All drives link nested in More actions goes to /college/placements/drives
- Fix: Expose persistent Drives back link and preserve returnTo

## G2-9-011-005  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:118-140` — Skeleton breadcrumb, company header/avatar/edit/actions and six Pipeline skeleton stats during loading
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:21-26` — Promise.all three data sources before render; no explicit overview skeleton
- Fix: Render equivalent loading skeleton and preserve header while refreshing

## G2-9-011-007  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:185-227` — Company card with left colored status border, avatar, title, company, status/job type, two actions, description
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:27-41` — Separate page head, status text row, description section; no company logo or bordered card
- Fix: Restore compact company identity card and 3px status accent

## G2-9-011-008  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:229-262` — Pipeline card contains one six-metric Row with optional degraded-error banner
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:42-54` — Five metric tiles then another nine-stage Application pipeline grid, no card
- Fix: Use one legacy Pipeline section with six stats and a scoped error panel

## G2-9-011-009  [P2] MISSING  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:192-196` — Company logo rendered 56px avatar with companyName fallback
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:27-40` — Company name plain text, logo absent
- Fix: Render PlacementsCompanyAvatar 56px with fallback initials

## G2-9-011-010  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:211-217` — Edit drive outlined icon button followed by primary View applications icon button
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:29-35` — Primary Applications CTA then collapsed More actions has Edit
- Fix: Restore visible Edit drive and View applications buttons with icons

## G2-9-011-012  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:219-224` — Description truncated to 3 lines, expandable Show more
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:41-41` — Entire whitespace-pre-wrap description shown without collapse
- Fix: Add 3-line clamp and Show more expansion control

## G2-9-011-013  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:245-258` — Applied accent #0a7c88 and Hired accent #3f8600 on Ant Statistic values
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:42-49` — Generic StatTile styling, no stage-specific value accents
- Fix: Match two exact accent values and numeric typography

## G2-9-011-014  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:198-206` — Status Fact and Job type Tag, with label Open · Expired when deadline passed
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:37-39` — Status badge literal PUBLISHED/DRAFT/CANCELLED, Type employmentType and Mode
- Fix: Map PUBLISHED to Open and deadline-based Expired label; Title Case job type

## G2-9-011-016  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:244-259` — Pipeline fields Applied, Shortlisted, Assessment, Interview, Offered, Hired
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:42-49` — Top counters Applications, Shortlisted, Selected, Offered, Hired; stage details below
- Fix: Restore six exact stage fields/order and separate new actual-offer counts

## G2-9-011-024  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:219-224` — Description can expand via Show more, no save fields
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:41-41` — Full readonly description without expansion affordance
- Fix: Implement expand/collapse, not inline edit

## G2-9-011-032  [P2] GAP  facet F09  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:219-224` — Description expands inline Show more
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:41-41` — No description popover/expanded state
- Fix: Add 3-line inline expandable text

## G2-9-011-038  [P2] GAP  facet F11  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:112-115` — All content surrounded by JobsErrorBoundary with back to /college-admin/jobs
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:15-26` — Route no explicit in-page error boundary/back recovery
- Fix: Add scoped recoverable page state for missing drive and server failures

## G2-9-011-049  [P2] GAP  facet F16  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:120-139` — Ant Row gutter16, Col six stats xs12 sm8 md4
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:42-50` — Tailwind grid2 at phone, grid3 tablet, grid5 at 992px
- Fix: Match six equal columns at 1280 and responsive 2/3 breakpoints

## G2-9-011-050  [P2] GAP  facet F16  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:191-218` — Header Space wraps with logo and two actions
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:27-36` — PageHeader action flex column then row; duplicate dropdown
- Fix: Restore avatar/alignment and primary/secondary button order at narrow widths

## G2-9-011-053  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:211-215` — Buttons Edit drive and View applications
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:29-35` — Actions labels Applications, All drives, Edit, Duplicate as new drive
- Fix: Restore exact action copy and icon order; extra duplicate separate

## G2-9-011-061  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:12-13` — Uses module guards, AdminService metrics and needs-attention GET
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx:7-12` — Uses direct PG services getDriveOverview, getHiringFunnel, getDriveAttention
- Fix: Document service endpoint mapping and present errors consistently
