# Work packet (wave 2): edit src/app/(authenticated)/learn/my-placements/jobs/page.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-14/learner-placement-jobs.md, docs/audit/gap2/lane-17/learner-saved-jobs-service.md, docs/audit/gap2/lane-20/learner-saved-job-repository.md, docs/audit/gap2/lane-3/learner-saved-job.md

## G2-14-005-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy My Placements → Jobs route with `JobsListContent` tabbed shell; vNext same URL and a PageHeader Drives without local PageShell — `docs/legacy-source/frontend/src/pages/learn/my-placements/jobs/index.js:3-4,34-37`; `docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:93-109`
- vNext now: `src/app/(authenticated)/learn/my-placements/jobs/page.tsx:59-79`
- Fix: Recreate old My Placements PageShell tabs and page-head order

## G2-14-005-005  [P2] GAP  facet F02  effort M
- Legacy: Legacy PageShell My Placements then Drives header+counts, All drives/Saved tabs, toolbar, cards; vNext Drives PageHeader and rules link then segmented Saved, filters, summary, list — `docs/legacy-source/frontend/src/layouts/PlacementsTabsLayout.js:93-109`; `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:1023-1071`
- vNext now: `src/app/(authenticated)/learn/my-placements/jobs/page.tsx:65-79`; `src/components/placements/learner-jobs-browse.tsx:103-224`
- Fix: Match exact header/summary/tabs/filter ordering and placement of counts

## G2-14-005-018  [P2] GAP  facet F04  effort S
- Legacy: Legacy Location raw value or Not specified; vNext roleOption.locations array normalized — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:239-245`
- vNext now: `src/app/(authenticated)/learn/my-placements/jobs/page.tsx:15-40`
- Fix: Join locations in legacy textual format and keep Not specified fallback

## G2-14-005-060  [P2] GAP  facet F13  effort S
- Legacy: Legacy initial five detailed skeleton job cards; vNext Suspense Loading drive filters form count2 — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:276-304,909-917`
- vNext now: `src/app/(authenticated)/learn/my-placements/jobs/page.tsx:75-77`
- Fix: Restore 5-card body skeleton matching card grid, not filter placeholders

## G2-14-005-081  [P2] GAP  facet F20  effort M
- Legacy: Legacy fetchJobs AbortController aborts stale GET on new request; vNext server rendering cancellation implicit, no user-visible last-success cache — `docs/legacy-source/frontend/src/components/Placements/JobsListContent.jsx:385-393,453-463`
- vNext now: `src/app/(authenticated)/learn/my-placements/jobs/page.tsx:59-79`; `src/components/placements/learner-jobs-browse.tsx:43-81`
- Fix: Keep last-success cards during refetch and handle abort/route changes

## G2-17-011-014  [P2] GAP  facet F05  effort S
- Legacy: docs/legacy-source/frontend/src/components/Placements/JobDetailContent.jsx:392-425 — On mount fetch saved IDs and set toggled heart from Set.
- vNext now: src/app/(authenticated)/learn/my-placements/jobs/page.tsx:59-77 — Saved jobs retrieved during server page load.
- Fix: Preserve visible loading/failure state of bookmark until fetched.

## G2-20-014-029  [P2] GAP  facet F18  effort S
- Legacy: Legacy saved list named 'Saved jobs' `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:862-880`
- vNext now: New page heading 'Drives' and saved filter integrated `src/app/(authenticated)/learn/my-placements/jobs/page.tsx:65-77`
- Fix: Use saved jobs wording on filter/subtab while retaining placement naming decision

## G2-3-019-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:744-885`
- vNext now: `src/app/(authenticated)/learn/my-placements/jobs/page.tsx:59-81`, `src/app/api/placements/learner/saved-jobs/route.ts:7-13`, `src/app/api/placements/learner/saved-jobs/[jobId]/route.ts:8-23`
- Fix: Legacy save endpoints POST /jobs/{jobId}/save/{learnerId}, DELETE /unsave/{learnerId}, GET saved-ids and saved; vNext /api/placements/learner/saved-jobs with job ID and session-derived learner. Provide old-route redirect/adapter if deep-linked, keep own-scope.
