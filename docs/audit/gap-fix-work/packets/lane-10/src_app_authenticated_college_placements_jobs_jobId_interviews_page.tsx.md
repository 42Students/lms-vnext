# Work packet: edit src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-interviews.md

## G2-9-012-004  [P1] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/interviews.js:26-32` — Missing college renders Admin not assigned to a college warning
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx:20-21` — Missing membership redirects /dashboard
- Fix: Render scoped missing-college message and recovery

## G2-9-012-005  [P1] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:750-777` — Header Interviews, descriptive subtitle, This drive only scope chip and Refresh; four metrics below
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx:40-43` — PageHeader Interviews · title with description, Drive overview CTA; no scheduled/today/companies/conflicts metrics
- Fix: Build legacy header and four-count summary strip

## G2-9-012-006  [P1] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:779-815` — Error/loading/empty is followed by toolbar and desktop/mobile interview list
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx:44-65` — Filter form then appointment section then persisted interview round table
- Fix: Place candidate interviews first in same legacy toolbar/table hierarchy; keep round registry as secondary extra

## G2-9-012-007  [P1] MISSING  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:824-923` — Toolbar count, Company/Sort, Export, Conflicts and Clear filters
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx:44-58` — Only kind/status filter form and Apply button, no count/company/sort/conflicts controls
- Fix: Restore complete toolbar and controls

## G2-9-012-009  [P1] MISSING  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:771-776` — Counters Scheduled, Today, Companies, Conflicts
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx:62-64` — Only N matching interview/GD rounds counter
- Fix: Compute and display all four appointment metrics

## G2-9-012-010  [P1] MISSING  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:897-911` — Red attention Conflicts button with count toggles conflicts-only
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx:44-58` — No conflict-only button or count
- Fix: Compute overlapping candidate/room conflicts and filter when clicked

## G2-9-012-026  [P1] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:780-788` — Fetch failure warning alert closable, retains prior interviews
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx:26-29` — Promise.all failing either rounds or appointments hides page until boundary
- Fix: Isolate request failures and keep existing appointments visible with Retry

## G2-9-012-040  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/ModuleGroupGuard.jsx:27-74` — Placements module-off guard with explanatory off screen
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx:20-29` — Only membership guard plus service permission errors, no module-off explanatory screen
- Fix: Render exact placements-off state with admin recovery hint

## G2-9-012-047  [P1] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:780-788` — Error alert with dismiss independent of data
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx:26-29` — Promise.all no per-section catch or retry
- Fix: Add explicit retry for appointment/round read errors

## G2-9-012-048  [P1] MISSING  facet F14  effort M
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:873-895` — Export CSV interviews.csv of currently filtered rows, nine fields
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx:40-77` — No CSV export control on Schedule page
- Fix: Implement filtered CSV with exact 9 legacy columns and filename

## G2-9-012-027  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:791-795` — Loading interviews... spinner
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx:26-29` — No page-local spinner/partial load state
- Fix: Add explicit candidate interview loading state or route loading skeleton

## G2-9-012-030  [P2] GAP  facet F08  effort S
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:810-811` — Filtered-empty exact No interviews match your filters. Try adjusting filters or schedule interviews from the Jobs module.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/interviews/page.tsx:64-65` — No persisted interview or GD rounds match these filters.
- Fix: Use original empty copy for candidate interview list and scoped no-results copy for first run
