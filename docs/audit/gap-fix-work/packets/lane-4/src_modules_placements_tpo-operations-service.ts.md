# Work packet: edit src/modules/placements/tpo-operations-service.ts

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/l17-u030-drives-landing.md, docs/audit/gap2/lane-10/superadmin-jobs-all.md, docs/audit/gap2/lane-10/superadmin-jobs-index.md, docs/audit/gap2/lane-6/l17-u030-superadmin-drives-landing.md, docs/audit/gap2/lane-8/super-admin-jobs-directory.md

## G2-17-030-052  [P0] GAP  facet F19  effort L
- Legacy: Legacy active request cap60, all count size1, attention sample category cap; DrivesLanding.js:98-118,441-453
- vNext now: vNext operations loads all jobs/applications/rounds/result/offers for college in Promise.all; tpo-operations-service.ts:185-277
- Fix: Introduce DB-aggregated counts, bounded active cards and query-specific attention samples to prevent 10k+ learner fanout.

## G2-10-016-043  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:135-165 — GET /api/v1/admin/jobs/search server-filtered status/search, postedDate desc, page size20.
- vNext now: src/modules/placements/tpo-operations-service.ts:25-47; src/modules/placements/admin-drive-directory-model.ts:15-29 — Server operation service returns set then filters and pages locally.
- Fix: Query/filter at DB for scale with requested stable sort.

## G2-10-016-072  [P1] GAP  facet F19  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:250-269 — Server-side page and sort by posted date avoids loading all jobs.
- vNext now: src/modules/placements/tpo-operations-service.ts:25-47; src/modules/placements/admin-drive-directory-model.ts:15-29 — Loads operations jobs then client filters and paginates, potentially large.
- Fix: Move filter/order/page to indexed SQL.

## G2-10-017-023  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:104-126 — Active drive cards limited to latest 60 server sorted postedDate DESC; activeTotal separately fetched.
- vNext now: src/modules/placements/tpo-operations-service.ts:38-75 — Operations query reads all jobs; quicksearch preserves service order, renders first60 after client match.
- Fix: Order active jobs by postedDate desc before card slicing.

## G2-10-017-045  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:115-126 — Two GET /api/v1/admin/jobs/search requests, active(size60) and all(size1) separately, sort by postedDate DESC.
- vNext now: src/modules/placements/tpo-operations-service.ts:38-75 — getPlacementTpoOperations loads normalized jobs, metrics, statuses in one large service.
- Fix: Preserve bounded latest 60 active query and counts.

## G2-10-017-046  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:136-153 — GET /admin/jobs/needs-attention returns category counts and item samples independently.
- vNext now: src/modules/placements/tpo-operations-service.ts:465-629 — Queue built from multiple DB sources as part of TPO operations.
- Fix: Separate failure boundary and honor selected-college category count semantics.

## G2-10-017-075  [P1] GAP  facet F19  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:104-126 — Bounded active 60 rows and one count query for all; no unbounded materialization.
- vNext now: src/modules/placements/tpo-operations-service.ts:38-75 — Multi-source operations loads all jobs, applicants, rounds, offers for panels.
- Fix: Separate early card query and aggregate counts for scale.

## G2-10-017-081  [P1] GAP  facet F21  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:6-16,104-153 — Legacy searchAdminJobs + needs attention independently, model Job/isActive.
- vNext now: src/modules/placements/tpo-operations-service.ts:38-75 — Normalized placementJobs/rounds/applications/offers queue, larger API closure.
- Fix: Make field and count mapping explicit across modules.

## G2-10-017-085  [P1] GAP  facet F22  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:20-27,210-215 — Old needs attention summary counts per individual candidate/drive and sample limits.
- vNext now: src/modules/placements/tpo-operations-service.ts:465-629; src/components/placements/super-admin-needs-attention.tsx:14-24 — New workQueue one row per drive/code with count, UI sums row length.
- Fix: Project counts and samples separately, avoid conflating them.

## G2-17-030-013  [P1] GAP  facet F04  effort M
- Legacy: ActiveTotal from filtered `status=active` size60 and allTotal from size1 count; DrivesLanding.js:98-125
- vNext now: vNext operations jobs all non-archived and metric active count PUBLISHED; placement-operations-overview.tsx:33-37; tpo-operations-service.ts:185-236
- Fix: Document metric status filters, archive inclusion and equality of active/closed/all totals before cloning KPIs.

## G2-17-030-026  [P1] GAP  facet F07  effort M
- Legacy: Attention fetch error exact `Couldn't check for anything that needs attention.`; DrivesLanding.js:136-154
- vNext now: vNext attention computed with operations DB read; unavailable service rejects whole workspace; tpo-operations-service.ts:23-39,185-236
- Fix: Isolate attention failure with Retry state and preserve active drives.

## G2-17-030-034  [P1] GAP  facet F10  effort L
- Legacy: Two paginated jobs searches active size60/newest and all size1; one needs-attention summary; lazy retention GET; DrivesLanding.js:98-155,174-189
- vNext now: vNext getPlacementTpoOperations performs several full non-archived DB reads + relations, derived queue; tpo-operations-service.ts:23-236
- Fix: Replace full-scoped job/application/round fanout on dashboard with bounded/count-specific queries, cache by college.

## G2-17-030-041  [P1] GAP  facet F12  effort M
- Legacy: Missing-offer-letter category includes OFFERED and HIRED on unfiltered ALL; DrivesLanding.js:21-27
- vNext now: vNext workQueue counts ISSUED/ACCEPTED missing offerLetterUrl; tpo-operations-service.ts:325-334
- Fix: Verify HIRED/joined applicants remain counted and stage=ALL deep-link; don't underreport.

## G2-17-030-056  [P1] GAP  facet F22  effort L
- Legacy: Legacy response active content/totalElements and attention count/items; DrivesLanding.js:115-125,145-148
- vNext now: vNext operations jobViews/workQueue, summary/analytics from placementJobs and applications; tpo-operations-service.ts:23-40,185-277,325-440
- Fix: Implement explicit metrics/source crosswalk, especially accepted/offer-letter and definition of active.

## G2-17-030-080  [P1] GAP  facet F22  effort L
- Legacy: Legacy active/attention values come from job, application, interview, offer-letter backend read models. `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:19`
- vNext now: vNext derives workQueue from placementJobs/applications/offer/round related Drizzle tables. `src/modules/placements/tpo-operations-service.ts:11`
- Fix: Map statuses, count predicates and archived/cancelled semantics field-by-field; verify thresholds.

## G2-8-030-017  [P1] GAP  facet F05  effort M
- Legacy: Old sort postedDate DESC via server paginated search docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:249-260.
- vNext now: New getPlacementTpoOperations jobs ordered by server query, then client array filter and slice; no explicit posted date sort in model src/modules/placements/tpo-operations-service.ts:38-50; src/modules/placements/admin-drive-directory-model.ts:16-28.
- Fix: Use stable postedDate DESC server sort and pagination before loading all rows.

## G2-8-030-051  [P1] GAP  facet F19  effort M
- Legacy: Old server pagination with posted date sort and abort stale requests docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:233-283.
- vNext now: New full getPlacementTpoOperations computes comprehensive analytics before client page slice src/modules/placements/tpo-operations-service.ts:38-100; src/modules/placements/admin-drive-directory-model.ts:16-28.
- Fix: Avoid loading all college jobs/applicant stats for first10 rows; separate targeted page query.
