# Work packet: edit src/modules/placements/admin-drive-directory-model.ts

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-all.md, docs/audit/gap2/lane-6/l17-u030-superadmin-drives-landing.md, docs/audit/gap2/lane-8/super-admin-jobs-directory.md

## G2-10-016-021  [P1] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:250-269 — Server paginates/filter/sort postedDate desc before returning page.
- vNext now: src/modules/placements/admin-drive-directory-model.ts:15-29 — Client filters/paginates jobs from operations service with no explicit posted-date sorting.
- Fix: Stable posted-date descending order before slicing pages.

## G2-10-016-034  [P1] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:250-269 — Server validates sortBy=postedDate, sortDir=desc, page/size; clamps last page.
- vNext now: src/modules/placements/admin-drive-directory-model.ts:15-29 — New filterAdminDriveDirectory clamps page but no explicit sort.
- Fix: Apply deterministic sort and safe bounds.

## G2-10-016-043  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:135-165 — GET /api/v1/admin/jobs/search server-filtered status/search, postedDate desc, page size20.
- vNext now: src/modules/placements/tpo-operations-service.ts:25-47; src/modules/placements/admin-drive-directory-model.ts:15-29 — Server operation service returns set then filters and pages locally.
- Fix: Query/filter at DB for scale with requested stable sort.

## G2-10-016-072  [P1] GAP  facet F19  effort L
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:250-269 — Server-side page and sort by posted date avoids loading all jobs.
- vNext now: src/modules/placements/tpo-operations-service.ts:25-47; src/modules/placements/admin-drive-directory-model.ts:15-29 — Loads operations jobs then client filters and paginates, potentially large.
- Fix: Move filter/order/page to indexed SQL.

## G2-10-016-086  [P1] GAP  facet F23  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:233-269 — Explicit newest postedDate descending list.
- vNext now: src/modules/placements/admin-drive-directory-model.ts:15-29 — Client filtering has no guaranteed posted ordering.
- Fix: Introduce stable sort, test snapshots.

## G2-17-030-077  [P1] GAP  facet F20  effort M
- Legacy: Legacy extend uses local format YYYY-MM-DDTHH:mm:ss without timezone. `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:74`
- vNext now: vNext AdminDriveIstDate displays Asia/Kolkata and stored dates are Date. `src/modules/placements/admin-drive-directory-model.ts:43`
- Fix: Specify timezone-aware deadline input and normalize IST local-to-UTC during mutation.

## G2-8-030-010  [P1] GAP  facet F04  effort M
- Legacy: Old deadline from applicationDeadline or importantDates.find label application deadline, format DD MMM YYYY, missing — docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:195-203,27-39.
- vNext now: New only applicationDeadline Date, IST formatter, missing — src/app/(authenticated)/admin/placements/drives/page.tsx:65-67; src/modules/placements/admin-drive-directory-model.ts:43-49.
- Fix: Backfill legacy importantDates-deadline fallback before dropping old source.

## G2-8-030-017  [P1] GAP  facet F05  effort M
- Legacy: Old sort postedDate DESC via server paginated search docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:249-260.
- vNext now: New getPlacementTpoOperations jobs ordered by server query, then client array filter and slice; no explicit posted date sort in model src/modules/placements/tpo-operations-service.ts:38-50; src/modules/placements/admin-drive-directory-model.ts:16-28.
- Fix: Use stable postedDate DESC server sort and pagination before loading all rows.

## G2-8-030-033  [P1] GAP  facet F10  effort M
- Legacy: Old searchAdminJobs (page0,size20,status,search,postedDate desc), result content/totalElements docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:249-267.
- vNext now: New SSR getPlacementTpoOperations scoped full operations, filters+pages locally src/app/(authenticated)/admin/placements/drives/page.tsx:38-57; src/modules/placements/admin-drive-directory-model.ts:16-28.
- Fix: Implement DB paging and count at query layer before loading entire history.

## G2-8-030-051  [P1] GAP  facet F19  effort M
- Legacy: Old server pagination with posted date sort and abort stale requests docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:233-283.
- vNext now: New full getPlacementTpoOperations computes comprehensive analytics before client page slice src/modules/placements/tpo-operations-service.ts:38-100; src/modules/placements/admin-drive-directory-model.ts:16-28.
- Fix: Avoid loading all college jobs/applicant stats for first10 rows; separate targeted page query.

## G2-8-030-055  [P1] GAP  facet F22  effort M
- Legacy: Old job active/draft booleans, postedDate/createdAt, importantDates arrays docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:195-203,249-264,578-596.
- vNext now: New placementJobs status enum, publishedAt, applicationDeadline, job employmentType src/app/(authenticated)/admin/placements/drives/page.tsx:59-70; src/modules/placements/admin-drive-directory-model.ts:15-40.
- Fix: Create legacy column->new field mapping for status/posted/deadline/jobType.

## G2-10-016-031  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:81-116 — Unrecognized size falls back20; invalid statuses normalize to all.
- vNext now: src/modules/placements/admin-drive-directory-model.ts:7-13 — Zod rejects invalid pageSize/status with Invalid drive filters ErrorState.
- Fix: Decide fallback semantics, ensure clear recovery.
