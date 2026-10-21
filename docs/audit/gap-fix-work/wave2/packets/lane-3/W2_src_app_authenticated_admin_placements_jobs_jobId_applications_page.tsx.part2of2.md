# Work packet (wave 2): edit src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx (part 2 of 2)

22 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/l11-u030-superadmin-job-applications.md, docs/audit/gap2/lane-8/l15-u026-placement-job-controller.md, docs/audit/gap2/lane-10/superadmin-jobs-jobid-applications.md, docs/audit/gap2/lane-10/superadmin-jobs-jobid-shortlisted.md

## G2-11-030-007  [P2] GAP  facet F03  effort S
- Legacy: 1690-1774 filters search/source/dept/program/batch visible
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:61-109 search/status visible, advanced fields collapsed in details
- Fix: Expose legacy filters directly on desktop.

## G2-11-030-008  [P2] GAP  facet F04  effort M
- Legacy: 1547-1575 status tiles reflect whole job via getAdminHiringMetrics
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:112-115 stageCounts computed from pipeline read
- Fix: Show all legacy status counts, not only current pipeline stages.

## G2-11-030-013  [P2] GAP  facet F05  effort M
- Legacy: 138-159 search persists q and filter state in URL
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:60-109 GET forms preserve q/status/source/dept/program/cohort; exact mapping differs
- Fix: Preserve old q/source/dept/program/batch query aliases.

## G2-11-030-014  [P2] GAP  facet F06  effort S
- Legacy: 130-135 department change clears program and batch, program change clears batch
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:86-108 independent Select fields all preserve selected query values
- Fix: Cascade-reset invalid dependent filters on parent selection.

## G2-11-030-015  [P2] GAP  facet F06  effort M
- Legacy: 417-439 search debounced 400ms, page resets to1
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:60-80 GET form submit button, no debounce
- Fix: Restore 400ms search auto-apply and selection reset.

## G2-11-030-022  [P2] GAP  facet F09  effort L
- Legacy: 2040-2044 Application Details modal, data/body status history
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:118-132 row navigation/pipeline controls; no same-page modal
- Fix: Restore wide detail modal or approved same-page drawer with status history.

## G2-11-030-028  [P2] GAP  facet F10  effort M
- Legacy: 777-825 lazy application history/screening fetch
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:118-132 data fetches pipeline; per-row lazy detail not visible
- Fix: Load history/screening on demand, preserve separate error/retry.

## G2-11-030-034  [P2] GAP  facet F13  effort M
- Legacy: 1451-1539 DashboardSkeleton, TableSkeleton, RefreshStatus, stale Alert
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:38-48 filters error page; data load via server
- Fix: Create matching initial/refresh/stale/error states.

## G2-11-030-035  [P2] GAP  facet F13  effort S
- Legacy: 2025-2033 no applications match these filters vs no applications yet
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:122-130 generic No matching applications for both
- Fix: Differentiate no data versus no filtered matches.

## G2-11-030-040  [P2] GAP  facet F16  effort M
- Legacy: 1992-2033 desktop table + responsive grid, 10-row skeleton
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:118-132 responsive DataTable/pipeline with cards
- Fix: Compare 375/768/1280 row card and action placement.

## G2-11-030-043  [P2] GAP  facet F18  effort S
- Legacy: 1615 title Applications (count), tiles APPLIED SHORTLISTED
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:52-57 Applications · {drive}, count in tabs
- Fix: Restore exact heading/count text.

## G2-11-030-044  [P2] GAP  facet F18  effort S
- Legacy: 1772-1778 Clear filters, status tooltip/action text
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:106-109 Clear filters under details and page error action
- Fix: Match clear location and labels.

## G2-11-030-048  [P2] GAP  facet F21  effort M
- Legacy: 7-12 interview APIs integrate scheduling; legacy controller separate
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:118-132 focuses pipeline, no calendar/ICS integrated page
- Fix: Link Interview workspace with per-app calendar actions.

## G2-11-030-051  [P2] GAP  facet F23  effort M
- Legacy: 58-63 one component shared superadmin/college admin with shortlistedMode
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:18-22 superadmin-only route, college admin separate pages
- Fix: Provide parity of shortlisted default and row actions on both entry points.

## G2-11-030-052  [P2] GAP  facet F23  effort M
- Legacy: 3 imports Download/ICS/History and modal edit icons
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:1-17 only search/filter/table/pagination controls, extras on detail routes
- Fix: Preserve reachable legacy buttons inside candidate detail flow.

## G2-15-026-007  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:800-842 history and resume preview actions
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:118-134 per-application list link without legacy inline controls
- Fix: Surface History and Resume preview row controls from application detail

## G2-15-026-013  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:446-489 applications page default zero-based 0, size20, max100
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:129-134 one-based pagination, size per app directory
- Fix: Preserve 20/page default and adapt zero-based URLs to vNext one-based query

## G2-15-026-044  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:493-501 error 'Failed to fetch applications:...'
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:35-41 invalid-filter error state with Clear filters
- Fix: Add transient fetch error Retry distinct from invalid filters

## G2-15-026-047  [P2] GAP  facet F14  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:760-761 jobId filters CSV same as on-screen grid
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:113-114 export filter params and cap displayed
- Fix: Ensure exported filters match every on-screen score/date/skills filter; deterministic CSV columns

## G2-15-026-056  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:757-781 org-wide CSV report
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:113-114 displays export cap, per-drive only
- Fix: Provide chunked backend export with explicit cap/partial warning

## G2-10-011-069  [P3] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1498-1526 — Back/toolbar buttons wrap under constrained widths.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:51-104; src/components/placements/college-application-pipeline-controls.tsx:116-139 — New responsive grid and full-width mobile toolbar distinct from Ant wraps.
- Fix: Match legacy toolbar ordering/spacing at 320, 375, 768 and desktop widths.

## G2-10-015-067  [P3] GAP  facet F17  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1700-1784 — Search/input controls have accessible labels, filter resets/clear command.
- vNext now: src/app/(authenticated)/admin/placements/jobs/[jobId]/applications/page.tsx:51-104 — New labels accessible but filter defaults/submit navigation differ.
- Fix: Check keyboard order and focus restore.
