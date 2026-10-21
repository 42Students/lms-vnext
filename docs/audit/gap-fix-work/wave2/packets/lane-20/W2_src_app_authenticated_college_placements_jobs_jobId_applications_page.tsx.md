# Work packet (wave 2): edit src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx

21 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-job-controller.md, docs/audit/gap2/lane-9/college-admin-jobs-applications.md

## G2-2-016-059  [P2] GAP  facet F01  effort M
- Legacy: Old job Applications navigable from both Super Admin and College Admin with shortlistedMode status `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:58-63,110-116`
- vNext now: College applicants use dedicated job UUID route and stage query `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx:19-35`
- Fix: Map shortlisted deep link/status to stage and provide matching Super Admin route

## G2-2-016-061  [P2] GAP  facet F02  effort L
- Legacy: Old applications page has metrics, tab filters, detail modal and interview subviews together `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:58-125`
- vNext now: New application list puts advanced filters and tabs before pipeline controls with separate drawer `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx:47-125`
- Fix: Match old section order and navigation visibility while retaining normalized route model

## G2-2-016-071  [P2] GAP  facet F04  effort M
- Legacy: Applicant payload augments statusUpdatedByNames ID-to-display-name mapping `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:479-495`
- vNext now: List shows name/email/roll/role/applied/source but not updated-by display name column `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx:37-46`
- Fix: Expose updater display name in detail/history if legacy table requires it

## G2-2-016-131  [P2] GAP  facet F13  effort M
- Legacy: Applicant list tracks fetchErrorScopeKey and separate stale-scope state `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:70-96`
- vNext now: New page shows invalid filters and storage migration warning, SSR fetch handled separately `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx:19-35,117-125`
- Fix: Distinguish load/permission/offline errors and add retry without exposing stale rows

## G2-2-016-136  [P2] GAP  facet F14  effort M
- Legacy: Old applications UI exports CSV and interview calendar ICS `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:27-38`
- vNext now: New applicant page has CSV, no ICS on this list route `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx:112-115`
- Fix: Keep interview event ICS action within new interview detail/calendar

## G2-2-016-141  [P2] GAP  facet F16  effort M
- Legacy: Old applicant table has AntD table, status tabs and modal `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1-3,109-125`
- vNext now: New uses responsive grid filters, Tabs and DataTable `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx:51-125`
- Fix: Match tablet/phone tab overflow, table horizontal scroll, status-chip sizes

## G2-9-010-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/applications.js:35-51` — JobsErrorBoundary and ModuleGroupGuard placements wrap DriveSubNav then JobApplications
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx:47-50` — PageHeader Applications and Drive overview link, no level-2 DriveSubNav
- Fix: Restore Drives breadcrumb and Overview/Applications/Schedule/Settings level-2 tabs

## G2-9-010-002  [P2] MISSING  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/placements/DriveSubNav.jsx:6-11` — Drive subnav labels Overview, Applications, Schedule, Settings in this order
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx:48-50` — Only Drive overview back link in heading
- Fix: Render four exact tabs with Applications selected and mapped target URLs

## G2-9-010-003  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/placements/DriveSubNav.jsx:23-45` — ReturnTo query safety and optional unsaved-changes prompt before changing tabs
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx:48-50` — Drive overview link does not preserve validated returnTo or dirty guard
- Fix: Carry safe return path in all job-detail links and confirm discard if draft exists

## G2-9-010-006  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1615-1700` — Applications count and Export CSV then status tab chips then search/filter toolbar
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx:51-116` — Filter form first, Tabs then matching count and CSV link
- Fix: Restore list toolbar and section order/heading hierarchy

## G2-9-010-007  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1992-2040` — Table skeleton, Ant table then applicant detail/notes/offer/interview modals
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx:117-136` — DataTable/controls and pagination, details opened via client dialog
- Fix: Match table density, modal sequence and loading presentation

## G2-9-010-008  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1547-1580` — Status count tiles cover all applications, not just current page
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx:105-111` — Stage tabs show server stageCounts counts instead of top metrics tiles
- Fix: Add count tile row plus separate filter-tab counts

## G2-9-010-011  [P2] GAP  facet F03  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1617-1650` — DownloadOutlined icon Export CSV control with pending spinner and success toast
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx:112-116` — Plain underline Export CSV link with cap label
- Fix: Restore export label/icon/loading/success feedback

## G2-9-010-016  [P2] GAP  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1315-1315` — Applied time from formatPlacementDateShort local date helper
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx:36-45` — Intl en-IN dateStyle medium Asia/Kolkata, header Applied (IST)
- Fix: Compare exact date casing and day-month format; align display

## G2-9-010-019  [P2] GAP  facet F05  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:112-119` — ALL/APPLIED/SHORTLISTED/ASSESSMENT/INTERVIEW/WAITLISTED/REJECTED/OFFERED/HIRED/WITHDRAWN tabs and default ALL
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx:105-111` — Same stages but order Offered/Hired before Rejected and counts from college stage
- Fix: Restore stage tab ordering/labels and distinguish canonical snapshot

## G2-9-010-021  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:420-438` — 400ms debounced search, URL q synced to query
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx:51-59` — GET form submitted explicitly by Filter button
- Fix: Restore 400ms debounce and history/query sync without forced submit

## G2-9-010-022  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1698-1769` — Search by name or email; Source/Department/Program/Batch inline selects
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx:51-103` — Search Name email roll or role; additional Screening and Application filter in disclosure
- Fix: Retain legacy inline filter visibility and placeholder exactly

## G2-9-010-055  [P2] MISSING  facet F11  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/ModuleGroupGuard.jsx:46-50` — Off hint Modules are managed by your 42Students super admin
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx:23-35` — No dedicated module off recovery copy
- Fix: Add exact super-admin recovery guidance to disabled-state view

## G2-9-010-076  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1700-1703` — Search placeholder Search by name or email
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx:51-54` — Field label Name, email, roll or role and no placeholder
- Fix: Use exact legacy placeholder and help text

## G2-9-010-077  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1615-1619` — Heading Applications (N) and button Export CSV
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx:48-49` — PageHeader Applications · Drive plus matching count below filters
- Fix: Restore Applications (N) above tabs while preserving drive context

## G2-9-010-085  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/ModuleGroupGuard.jsx:53-74` — Legacy module flag lookup fail-open for transient errors, disabled module shows Result
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/applications/page.tsx:23-35` — No equivalent UI retry on flag lookup from this page
- Fix: Display module off state only on explicit disabled resolution, preserve fail-open lookup semantics
